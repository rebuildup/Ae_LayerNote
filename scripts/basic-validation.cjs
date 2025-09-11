#!/usr/bin/env node

/**
 * Basic Validation Script
 * Performs basic file structure and syntax validation
 */

const fs = require("fs");
const path = require("path");

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

function validateFileStructure() {
  log("📋 Validating file structure...");

  const coreFiles = [
    "src/js/main/main.tsx",
    "src/js/contexts/AppContext.tsx",
    "src/js/contexts/SettingsContext.tsx",
    "src/js/components/MainLayout.tsx",
    "src/js/components/ErrorBoundary.tsx",
    "src/js/components/LoadingIndicator.tsx",
    "src/js/components/StatusBar.tsx",
    "src/js/components/Sidebar.tsx",
    "src/js/types/settings.ts",
    "src/js/types/global.d.ts",
  ];

  let allFilesExist = true;

  coreFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, "success");
    } else {
      log(`❌ Missing: ${file}`, "error");
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

function validateSyntax() {
  log("🔍 Validating basic syntax...");

  const tsFiles = [
    "src/js/contexts/AppContext.tsx",
    "src/js/contexts/SettingsContext.tsx",
    "src/js/components/MainLayout.tsx",
    "src/js/components/ErrorBoundary.tsx",
    "src/js/components/LoadingIndicator.tsx",
    "src/js/components/StatusBar.tsx",
    "src/js/components/Sidebar.tsx",
  ];

  let syntaxValid = true;

  tsFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf8");

      // Basic syntax checks
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      if (openBraces !== closeBraces) {
        log(
          `❌ ${file}: Mismatched braces (${openBraces} open, ${closeBraces} close)`,
          "error",
        );
        syntaxValid = false;
      } else if (openParens !== closeParens) {
        log(
          `❌ ${file}: Mismatched parentheses (${openParens} open, ${closeParens} close)`,
          "error",
        );
        syntaxValid = false;
      } else {
        log(`✅ ${file}: Basic syntax OK`, "success");
      }
    } catch (error) {
      log(`❌ ${file}: Cannot read file`, "error");
      syntaxValid = false;
    }
  });

  return syntaxValid;
}

function validateImports() {
  log("📦 Validating imports...");

  const mainFile = "src/js/main/main.tsx";

  try {
    const content = fs.readFileSync(mainFile, "utf8");

    const requiredImports = [
      "AppProvider",
      "SettingsProvider",
      "EditorProvider",
      "ErrorBoundary",
      "MainLayout",
    ];

    let importsValid = true;

    requiredImports.forEach((importName) => {
      if (content.includes(importName)) {
        log(`✅ Import found: ${importName}`, "success");
      } else {
        log(`❌ Missing import: ${importName}`, "error");
        importsValid = false;
      }
    });

    return importsValid;
  } catch (error) {
    log(`❌ Cannot validate imports in ${mainFile}`, "error");
    return false;
  }
}

function main() {
  log("🚀 Starting basic validation...");

  let success = true;

  success = validateFileStructure() && success;
  success = validateSyntax() && success;
  success = validateImports() && success;

  if (success) {
    log("🎉 Basic validation passed!", "success");
    log("📋 Summary:", "info");
    log("  ✅ All core files exist", "success");
    log("  ✅ Basic syntax validation passed", "success");
    log("  ✅ Required imports found", "success");
    log("", "info");
    log("Note: Full TypeScript checking may have additional issues", "warning");
    log("that do not affect basic functionality.", "warning");
  } else {
    log("❌ Basic validation failed", "error");
    process.exit(1);
  }
}

main();
