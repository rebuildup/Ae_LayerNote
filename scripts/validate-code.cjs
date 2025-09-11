#!/usr/bin/env node

/**
 * Code Validation Script
 * Runs TypeScript type checking, ESLint, and Prettier checks
 */

const { execSync } = require("child_process");
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

function runCommand(command, description) {
  log(`🔍 ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
    log(`✅ ${description} passed`, "success");
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, "error");
    return false;
  }
}

function checkRequiredFiles() {
  log("📋 Checking required configuration files...");

  const requiredFiles = [
    "tsconfig.json",
    ".eslintrc.js",
    ".prettierrc.js",
    "jest.config.js",
  ];

  let allFilesExist = true;

  requiredFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      log(`❌ Missing required file: ${file}`, "error");
      allFilesExist = false;
    } else {
      log(`✅ Found: ${file}`, "success");
    }
  });

  return allFilesExist;
}

function main() {
  log("🚀 Starting code validation...");

  let success = true;

  // Check required files
  if (!checkRequiredFiles()) {
    log("❌ Missing required configuration files", "error");
    process.exit(1);
  }

  // TypeScript type checking
  success =
    runCommand("npx tsc --noEmit", "TypeScript type checking") && success;

  // ESLint
  success =
    runCommand(
      "npx eslint src/js --ext .ts,.tsx --max-warnings 0",
      "ESLint checking",
    ) && success;

  // Prettier format checking
  success =
    runCommand(
      'npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,scss,md}"',
      "Prettier format checking",
    ) && success;

  // Run tests
  success =
    runCommand(
      "npm test -- --ci --coverage --watchAll=false",
      "Running tests",
    ) && success;

  if (success) {
    log("🎉 All validation checks passed!", "success");
    log("📋 Summary:", "info");
    log("  ✅ TypeScript type checking passed", "success");
    log("  ✅ ESLint checking passed", "success");
    log("  ✅ Prettier format checking passed", "success");
    log("  ✅ All tests passed", "success");
  } else {
    log("❌ Some validation checks failed", "error");
    process.exit(1);
  }
}

// Auto-fix mode
function autoFix() {
  log("🔧 Running auto-fix...");

  // Auto-fix ESLint issues
  runCommand("npx eslint src/js --ext .ts,.tsx --fix", "ESLint auto-fix");

  // Auto-format with Prettier
  runCommand(
    'npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,scss,md}"',
    "Prettier auto-format",
  );

  log("✅ Auto-fix completed", "success");
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes("--fix")) {
  autoFix();
} else {
  main();
}

module.exports = {
  checkRequiredFiles,
  runCommand,
  main,
  autoFix,
};
