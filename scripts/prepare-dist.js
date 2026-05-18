import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function assertWritable(dirPath) {
  const probe = path.join(
    dirPath,
    `.write-probe-${process.pid}-${Date.now().toString(36)}.tmp`,
  );
  fs.writeFileSync(probe, "ok");
  fs.unlinkSync(probe);
}

function ensureWritableDist() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  try {
    assertWritable(distDir);
    console.log("[prepare-dist] dist is writable.");
    return;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `[prepare-dist] dist is not writable. Attempting recovery. Reason: ${reason}`,
    );
  }

  const lockedBackupDir = path.join(projectRoot, `dist.locked.${timestamp()}`);
  try {
    fs.renameSync(distDir, lockedBackupDir);
    console.warn(
      `[prepare-dist] moved locked dist to ${path.basename(lockedBackupDir)}.`,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[prepare-dist] failed to quarantine locked dist folder: ${reason}`,
    );
  }

  fs.mkdirSync(distDir, { recursive: true });
  assertWritable(distDir);
  console.log("[prepare-dist] created a fresh writable dist directory.");
}

ensureWritableDist();
