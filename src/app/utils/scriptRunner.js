import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Spawns a Node.js script as a background process
 * @param {string} scriptName - Name of the script file (e.g., 'example.mjs')
 * @param {string[]} args - Arguments to pass to the script
 * @param {Function} onStdout - Callback for stdout data
 * @param {Function} onStderr - Callback for stderr data
 * @param {Function} onClose - Callback when process closes
 * @param {Function} onError - Callback for process errors
 * @returns {Object} - { success: boolean, process?: ChildProcess, error?: string, path?: string }
 */
export function spawnScript(scriptName, args = [], callbacks = {}) {
  try {
    // Build path dynamically to avoid static analysis
    const root = process.cwd();
    const scriptPath = join(root, scriptName);
    
    // Verify script exists
    if (!existsSync(scriptPath)) {
      return {
        success: false,
        error: `Script not found: ${scriptName}`,
        path: scriptPath
      };
    }
    
    // Spawn the process
    const child = spawn('node', [scriptPath, ...args], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV
      }
    });
    
    // Attach callbacks
    if (callbacks.onStdout) {
      child.stdout.on('data', callbacks.onStdout);
    }
    
    if (callbacks.onStderr) {
      child.stderr.on('data', callbacks.onStderr);
    }
    
    if (callbacks.onClose) {
      child.on('close', callbacks.onClose);
    }
    
    if (callbacks.onError) {
      child.on('error', callbacks.onError);
    }
    
    return {
      success: true,
      process: child,
      path: scriptPath
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
