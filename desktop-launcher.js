import { spawn, execSync, exec } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}  Pakistan Market Intelligence — Desktop Launcher   ${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

// 1. Check if production build exists; if not, build automatically
const distHtml = path.join(__dirname, 'dist', 'index.html');
const serverBundle = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(distHtml) || !fs.existsSync(serverBundle)) {
  console.log(`${YELLOW}⚡ Production build not found. Compiling application bundle...${RESET}`);
  try {
    execSync('npm run build', { stdio: 'inherit', shell: true, cwd: __dirname });
    console.log(`${GREEN}✓ Compilation complete!${RESET}\n`);
  } catch (err) {
    console.error(`\n${YELLOW}Build failed. Please check build errors above.${RESET}`);
    process.exit(1);
  }
}

// 2. Start the production backend server with stdio inherited for real-time visibility
console.log(`${CYAN}🚀 Starting Pakistan Market Intelligence server...${RESET}`);

const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'server.cjs')], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: __dirname
});

serverProcess.on('error', (err) => {
  console.error(`\n${YELLOW}[ERROR] Failed to start server process:${RESET}`, err.message);
  process.exit(1);
});

// 3. Poll server until ready, then open desktop browser
let attempts = 0;
const maxAttempts = 25;
let browserOpened = false;

function checkServerReady() {
  if (browserOpened) return;
  attempts++;

  // Test 127.0.0.1 to avoid Windows IPv6 localhost resolution mismatch
  const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
    if ((res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 404) && !browserOpened) {
      browserOpened = true;
      console.log(`\n${BOLD}${GREEN}====================================================${RESET}`);
      console.log(`${BOLD}${GREEN}  Application is live at: ${URL}${RESET}`);
      console.log(`${BOLD}${GREEN}  Opening your browser now...                       ${RESET}`);
      console.log(`${BOLD}${GREEN}====================================================${RESET}\n`);
      console.log(`Tip: Press ${BOLD}Ctrl + C${RESET} in this terminal to stop the application.\n`);

      openBrowser(URL);
    } else {
      retry();
    }
  });

  req.on('error', () => {
    retry();
  });

  req.setTimeout(800, () => {
    req.destroy();
    retry();
  });
}

function retry() {
  if (browserOpened) return;
  if (attempts >= maxAttempts) {
    console.log(`\n${YELLOW}Server is starting up. Please open ${URL} in your browser.${RESET}`);
    openBrowser(URL);
    return;
  }
  setTimeout(checkServerReady, 400);
}

function openBrowser(targetUrl) {
  const platform = process.platform;
  let command = '';

  if (platform === 'win32') {
    command = `start "" "${targetUrl}"`;
  } else if (platform === 'darwin') {
    command = `open "${targetUrl}"`;
  } else {
    command = `xdg-open "${targetUrl}"`;
  }

  exec(command, { shell: true }, (err) => {
    if (err) {
      console.log(`Could not automatically launch browser. Please open ${targetUrl} manually.`);
    }
  });
}

// Start polling after server init
setTimeout(checkServerReady, 600);

// 4. Handle clean exit
function shutdown() {
  console.log(`\n${YELLOW}Shutting down Pakistan Market Intelligence...${RESET}`);
  serverProcess.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
