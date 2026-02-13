import express from 'express';
import history from 'connect-history-api-fallback';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import open from 'open';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 4173;
const HEARTBEAT_TIMEOUT = 15000; // 15 seconds grace period
let lastHeartbeat = Date.now();

console.log('======================================================');
console.log('           Raida\'s Garden - Unified Controller');
console.log('======================================================');

async function start() {
    // 1. Build Phase
    console.log('[1/3] Building application for Production...');
    
    // Detect package manager
    const pkgManager = fs.existsSync(path.join(ROOT_DIR, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm';
    console.log(`[INFO] Using ${pkgManager} for build...`);

    const build = spawn(pkgManager, ['run', 'build'], { 
        shell: true, 
        stdio: 'inherit',
        cwd: ROOT_DIR
    });

    const buildCode = await new Promise((resolve) => build.on('close', resolve));
    
    if (buildCode !== 0) {
        console.error('[ERROR] Build failed. Please check the logs above.');
        process.exit(1);
    }

    // 2. Server Phase
    console.log('[2/3] Starting Production Server...');
    const app = express();

    // Heartbeat endpoint
    app.get('/api/heartbeat', (req, res) => {
        lastHeartbeat = Date.now();
        res.json({ status: 'ok' });
    });

    // SPA support - redirect all non-file requests to index.html
    app.use(history());

    // Serve static files from dist
    const distPath = path.join(ROOT_DIR, 'dist');
    if (!fs.existsSync(distPath)) {
        console.error('[ERROR] dist folder not found. Build might have failed silently.');
        process.exit(1);
    }
    app.use(express.static(distPath));

    const server = app.listen(PORT, 'localhost', () => {
        const url = `http://localhost:${PORT}`;
        console.log(`[3/3] SUCCESS! Raida's Garden is active.`);
        console.log(`      Address: ${url}`);
        
        // 3. Open Browser
        open(url);
    });

    // 4. Lifecycle Management (Automatic Shutdown)
    setInterval(() => {
        if (Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT) {
            console.log('\n[INFO] No active browser tabs detected. Shutting down systems...');
            server.close(() => {
                process.exit(0);
            });
        }
    }, 5000);

    // Keep process alive
    process.on('SIGINT', () => process.exit(0));
    process.on('SIGTERM', () => process.exit(0));
}

start().catch(err => {
    console.error('[FATAL ERROR]', err);
    process.exit(1);
});
