#!/usr/bin/env node

import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = resolve(__dirname, "..");

console.log("Multi-Agent Review — Claude Code Plugin Installer\n");

try {
  execFileSync("claude", ["--version"], { stdio: "ignore" });
} catch {
  console.error(
    "Error: Claude Code CLI not found. Install it first:\n  npm install -g @anthropic-ai/claude-code\n"
  );
  process.exit(1);
}

try {
  console.log("Adding plugin marketplace...");
  execFileSync("claude", ["plugin", "marketplace", "add", pluginRoot], {
    stdio: "inherit",
  });

  console.log("\nInstalling plugin...");
  execFileSync("claude", ["plugin", "install", "multi-agent-review"], {
    stdio: "inherit",
  });

  console.log("\nDone! Restart Claude Code or run /reload-plugins, then use:");
  console.log('  /multi-agent-review "description of your changes"\n');
} catch (err) {
  console.error("\nInstallation failed. You can install manually:");
  console.error(
    "  claude plugin add millenniumbismay/multi-agent-review\n"
  );
  process.exit(1);
}
