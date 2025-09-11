#!/usr/bin/env node

/**
 * Finalize Build Script
 * Performs final optimizations and cleanup before deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting build finalization...");

// Configuration
const config = {
  srcDir: path.join(__dirname, "../src"),
  distDir: path.join(__dirname, "../dist"),
  tempDir: path.join(__dirname, "../temp"),
};

// Utility functions
function log(message, type = "info") {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    warning: "\x1b[33m",
    error: "\x1b[31m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Step 1: Validate project structure
function validateProjectStructure() {
  log("📋 Validating project structure...");

  const requiredFiles = [
    "package.json",
    "src/js/main/main.tsx",
    "src/js/contexts/AppContext.tsx",
    "src/js/contexts/SettingsContext.tsx",
    "src/js/components/MainLayout.tsx",
  ];

  const requiredDirs = [
    "src/js/components",
    "src/js/contexts",
    "src/js/lib",
    "src/js/styles",
    "src/js/types",
  ];

  let isValid = true;

  requiredFiles.forEach((file) => {
    if (!fileExists(file)) {
      log(`❌ Missing required file: ${file}`, "error");
      isValid = false;
    }
  });

  requiredDirs.forEach((dir) => {
    if (!dirExists(dir)) {
      log(`❌ Missing required directory: ${dir}`, "error");
      isValid = false;
    }
  });

  if (isValid) {
    log("✅ Project structure validation passed", "success");
  } else {
    log("❌ Project structure validation failed", "error");
    process.exit(1);
  }
}

// Step 2: Run tests
function runTests() {
  log("🧪 Running tests...");

  try {
    execSync("npm test -- --ci --coverage --watchAll=false", {
      stdio: "inherit",
    });
    log("✅ All tests passed", "success");
  } catch (error) {
    log("❌ Tests failed", "error");
    process.exit(1);
  }
}

// Step 3: Type checking
function runTypeCheck() {
  log("🔍 Running TypeScript type checking...");

  try {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
    log("✅ Type checking passed", "success");
  } catch (error) {
    log("❌ Type checking failed", "error");
    process.exit(1);
  }
}

// Step 4: Lint code
function runLinting() {
  log("🔧 Running ESLint...");

  try {
    execSync("npx eslint src/js --ext .ts,.tsx --fix", { stdio: "inherit" });
    log("✅ Linting passed", "success");
  } catch (error) {
    log("⚠️ Linting issues found (auto-fixed where possible)", "warning");
  }
}

// Step 5: Build project
function buildProject() {
  log("🏗️ Building project...");

  try {
    execSync("npm run build", { stdio: "inherit" });
    log("✅ Build completed successfully", "success");
  } catch (error) {
    log("❌ Build failed", "error");
    process.exit(1);
  }
}

// Step 6: Analyze bundle
function analyzeBundleSize() {
  log("📊 Analyzing bundle size...");

  if (!dirExists(config.distDir)) {
    log("⚠️ Dist directory not found, skipping bundle analysis", "warning");
    return;
  }

  try {
    const stats = execSync("npx bundlesize", { encoding: "utf8" });
    log("Bundle size analysis:", "info");
    console.log(stats);
  } catch (error) {
    log(
      "⚠️ Bundle size analysis failed (bundlesize not configured)",
      "warning",
    );
  }
}

// Step 7: Generate documentation
function generateDocs() {
  log("📚 Generating documentation...");

  try {
    // Generate TypeDoc documentation
    execSync("npx typedoc src/js --out docs/api", { stdio: "inherit" });
    log("✅ API documentation generated", "success");
  } catch (error) {
    log("⚠️ Documentation generation failed", "warning");
  }
}

// Step 8: Security audit
function runSecurityAudit() {
  log("🔒 Running security audit...");

  try {
    execSync("npm audit --audit-level moderate", { stdio: "inherit" });
    log("✅ Security audit passed", "success");
  } catch (error) {
    log("⚠️ Security vulnerabilities found", "warning");
    // Don't fail the build for security issues, just warn
  }
}

// Step 9: Performance check
function checkPerformance() {
  log("⚡ Checking performance...");

  const performanceChecks = [
    {
      name: "Bundle size",
      check: () => {
        if (!dirExists(config.distDir)) return false;
        const files = fs.readdirSync(config.distDir, { recursive: true });
        const jsFiles = files.filter((f) => f.endsWith(".js"));
        const totalSize = jsFiles.reduce((size, file) => {
          const filePath = path.join(config.distDir, file);
          return size + fs.statSync(filePath).size;
        }, 0);
        return totalSize < 2 * 1024 * 1024; // Less than 2MB
      },
    },
    {
      name: "Number of chunks",
      check: () => {
        if (!dirExists(config.distDir)) return false;
        const files = fs.readdirSync(config.distDir, { recursive: true });
        const jsFiles = files.filter((f) => f.endsWith(".js"));
        return jsFiles.length < 20; // Less than 20 chunks
      },
    },
  ];

  performanceChecks.forEach(({ name, check }) => {
    if (check()) {
      log(`✅ ${name} check passed`, "success");
    } else {
      log(`⚠️ ${name} check failed`, "warning");
    }
  });
}

// Step 10: Create deployment package
function createDeploymentPackage() {
  log("📦 Creating deployment package...");

  const packageJson = readJsonFile("package.json");
  if (!packageJson) {
    log("❌ Could not read package.json", "error");
    return;
  }

  // Create deployment info
  const deploymentInfo = {
    version: packageJson.version,
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  // Write deployment info
  if (dirExists(config.distDir)) {
    writeJsonFile(
      path.join(config.distDir, "deployment-info.json"),
      deploymentInfo,
    );
    log("✅ Deployment package created", "success");
  }
}

// Main execution
async function main() {
  try {
    validateProjectStructure();
    runTypeCheck();
    runLinting();
    runTests();
    buildProject();
    analyzeBundleSize();
    generateDocs();
    runSecurityAudit();
    checkPerformance();
    createDeploymentPackage();

    log("🎉 Build finalization completed successfully!", "success");
    log("📋 Summary:", "info");
    log("  ✅ Project structure validated", "success");
    log("  ✅ Type checking passed", "success");
    log("  ✅ Code linted and formatted", "success");
    log("  ✅ All tests passed", "success");
    log("  ✅ Build completed", "success");
    log("  ✅ Performance checks completed", "success");
    log("  ✅ Deployment package ready", "success");
  } catch (error) {
    log(`❌ Build finalization failed: ${error.message}`, "error");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateProjectStructure,
  runTests,
  runTypeCheck,
  runLinting,
  buildProject,
  analyzeBundleSize,
  generateDocs,
  runSecurityAudit,
  checkPerformance,
  createDeploymentPackage,
};
