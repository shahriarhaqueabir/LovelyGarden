import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const diagnosticsRoot = path.join(
  projectRoot,
  "artifacts",
  "diagnostics",
  runId,
);
const fullMatrix = process.argv.includes("--full");

fs.mkdirSync(diagnosticsRoot, { recursive: true });

const summary = {
  runId,
  startedAt: new Date().toISOString(),
  projectRoot,
  host: {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpus: os.cpus().length,
    node: process.version,
  },
  steps: [],
};

const steps = [
  {
    id: "node-version",
    command: "node",
    args: ["--version"],
    timeoutMs: 30_000,
  },
  {
    id: "pnpm-version",
    command: "pnpm",
    args: ["--version"],
    timeoutMs: 30_000,
  },
  {
    id: "git-status",
    command: "git",
    args: ["status", "--short"],
    timeoutMs: 30_000,
  },
  {
    id: "prepare-dist",
    command: "node",
    args: ["scripts/prepare-dist.js"],
    timeoutMs: 30_000,
  },
  {
    id: "build",
    command: "pnpm",
    args: ["run", "build"],
    timeoutMs: 8 * 60_000,
  },
  {
    id: "unit-tests",
    command: "pnpm",
    args: ["run", "test:unit"],
    timeoutMs: 5 * 60_000,
  },
  {
    id: "smoke-tests",
    command: "pnpm",
    args: ["run", "test:smoke"],
    timeoutMs: 8 * 60_000,
  },
  {
    id: "e2e-chromium",
    command: "pnpm",
    args: ["run", "test:e2e:chromium"],
    timeoutMs: 15 * 60_000,
    env: { DEBUG: "pw:api" },
  },
];

if (fullMatrix) {
  steps.push({
    id: "e2e-all-browsers",
    command: "pnpm",
    args: ["run", "test:e2e"],
    timeoutMs: 20 * 60_000,
    env: { DEBUG: "pw:api" },
  });
}

function shellQuote(value) {
  return /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

function runStep(step) {
  return new Promise((resolve) => {
    const logPath = path.join(diagnosticsRoot, `${step.id}.log`);
    const log = fs.createWriteStream(logPath, { flags: "w" });
    const renderedCommand = [step.command, ...(step.args || [])]
      .map(shellQuote)
      .join(" ");

    log.write(`$ ${renderedCommand}\n`);
    log.write(`cwd: ${projectRoot}\n`);
    log.write(`startedAt: ${new Date().toISOString()}\n\n`);

    const started = Date.now();
    let timedOut = false;
    let timer = null;

    const child = spawn(step.command, step.args || [], {
      cwd: projectRoot,
      shell: true,
      windowsHide: true,
      env: { ...process.env, ...(step.env || {}) },
    });

    if (typeof step.timeoutMs === "number" && step.timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        log.write(`\n[diagnostics] timeout after ${step.timeoutMs}ms\n`);
        child.kill();
      }, step.timeoutMs);
    }

    child.stdout.on("data", (chunk) => log.write(chunk));
    child.stderr.on("data", (chunk) => log.write(chunk));

    child.on("error", (error) => {
      log.write(`\n[diagnostics] spawn error: ${error.message}\n`);
    });

    child.on("close", (code, signal) => {
      if (timer) clearTimeout(timer);
      const durationMs = Date.now() - started;
      const ok = !timedOut && code === 0;

      log.write("\n");
      log.write(`exitCode: ${String(code)}\n`);
      log.write(`signal: ${String(signal)}\n`);
      log.write(`timedOut: ${String(timedOut)}\n`);
      log.write(`durationMs: ${durationMs}\n`);
      log.end();

      const stepResult = {
        id: step.id,
        command: renderedCommand,
        ok,
        exitCode: code,
        signal,
        timedOut,
        durationMs,
        logFile: path.relative(projectRoot, logPath),
      };
      summary.steps.push(stepResult);
      resolve(stepResult);
    });
  });
}

let hasFailures = false;
for (const step of steps) {
  // eslint-disable-next-line no-await-in-loop
  const result = await runStep(step);
  if (!result.ok) {
    hasFailures = true;
  }
}

summary.finishedAt = new Date().toISOString();
summary.success = !hasFailures;

const summaryPath = path.join(diagnosticsRoot, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`\nDiagnostics run: ${runId}`);
console.log(`Logs: ${path.relative(projectRoot, diagnosticsRoot)}`);
console.log(`Summary: ${path.relative(projectRoot, summaryPath)}`);

if (hasFailures) {
  console.error("One or more diagnostic steps failed. See logs for details.");
  process.exitCode = 1;
}
