#!/usr/bin/env node
/**
 * Kills any process listening on PORT (default 3000) before starting the server.
 * Works on Windows, macOS, and Linux.
 */
const { execSync } = require('child_process');
const PORT = process.env.PORT || 3000;

try {
  if (process.platform === 'win32') {
    // Find PIDs using the port
    const result = execSync(`netstat -ano`, { encoding: 'utf8' });
    const lines = result.split('\n');
    const pids = new Set();
    for (const line of lines) {
      if (line.includes(`:${PORT} `) || line.includes(`:${PORT}\r`)) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[kill-port] Freed port ${PORT} (killed PID ${pid})`);
      } catch (_) { /* already dead */ }
    }
  } else {
    // macOS / Linux
    try {
      execSync(`lsof -ti tcp:${PORT} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`[kill-port] Freed port ${PORT}`);
    } catch (_) { /* nothing was using it */ }
  }
} catch (err) {
  // Non-fatal — just let the server try to start
}
