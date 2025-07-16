#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('🚀 Building browser extensions...\n');

// Clean dist directory
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
  console.log('🧹 Cleaned dist directory');
}

try {
  // Build Chrome version
  console.log('🔧 Building Chrome extension...');
  execSync('vite build --mode production --config vite.chrome.config.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Chrome build completed\n');

  // Build Firefox version
  console.log('🦊 Building Firefox extension...');
  execSync('vite build --mode production --config vite.firefox.config.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Firefox build completed\n');

  console.log('🎉 All builds completed successfully!');
  console.log('📁 Chrome build: dist/chrome/');
  console.log('📁 Firefox build: dist/firefox/');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}