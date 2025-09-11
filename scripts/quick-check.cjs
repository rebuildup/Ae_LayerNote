#!/usr/bin/env node

/**
 * Quick Check Script
 * Runs basic validation checks
 */

const { execSync } = require("child_process");

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

function main() {
  log("🚀 Running quick validation checks...");

  let success = true;

  // TypeScript type checking (only src/js)
  success =
    runCommand("npx tsc --noEmit --skipLibCheck", "TypeScript type checking") &&
    success;

  if (success) {
    log("🎉 Quick validation passed!", "success");
  } else {
    log("❌ Quick validation failed", "error");
    process.exit(1);
  }
}

main();
