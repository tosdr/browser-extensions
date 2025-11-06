import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';
import { copyFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'fs';

// Custom plugin to copy Firefox-specific assets
function copyFirefoxAssetsPlugin() {
  return {
    name: 'copy-firefox-assets',
    writeBundle() {
      const outDir = 'dist/firefox';
      
      // Copy Firefox manifest
      copyFileSync('src/manifest-ff.json', `${outDir}/manifest.json`);
      
      // Copy icons directory
      if (existsSync('src/icons')) {
        cpSync('src/icons', `${outDir}/icons`, { recursive: true });
      }
      
      // Copy view icons
      if (existsSync('src/views/icons')) {
        if (!existsSync(`${outDir}/views/icons`)) {
          mkdirSync(`${outDir}/views/icons`, { recursive: true });
        }
        cpSync('src/views/icons', `${outDir}/views/icons`, { recursive: true });
      }

      // Copy fonts
      if (existsSync('src/views/fonts')) {
        if (!existsSync(`${outDir}/views/fonts`)) {
          mkdirSync(`${outDir}/views/fonts`, { recursive: true });
        }
        cpSync('src/views/fonts', `${outDir}/views/fonts`, { recursive: true });
      }
      
      // Copy settings icons
      if (existsSync('src/views/settings/icons')) {
        if (!existsSync(`${outDir}/views/settings/icons`)) {
          mkdirSync(`${outDir}/views/settings/icons`, { recursive: true });
        }
        cpSync('src/views/settings/icons', `${outDir}/views/settings/icons`, { recursive: true });
      }
      
      // Copy locales directory
      if (existsSync('src/_locales')) {
        cpSync('src/_locales', `${outDir}/_locales`, { recursive: true });
      }
      
      // Copy HTML files to correct locations
      if (existsSync(`${outDir}/src/views/popup.html`)) {
        if (!existsSync(`${outDir}/views`)) {
          mkdirSync(`${outDir}/views`, { recursive: true });
        }
        copyFileSync(`${outDir}/src/views/popup.html`, `${outDir}/views/popup.html`);
      }

      if (existsSync(`${outDir}/src/views/settings/settings.html`)) {
        if (!existsSync(`${outDir}/views/settings`)) {
          mkdirSync(`${outDir}/views/settings`, { recursive: true });
        }
        copyFileSync(`${outDir}/src/views/settings/settings.html`, `${outDir}/views/settings/settings.html`);
      }

      if (existsSync(`${outDir}/src/views/background.html`)) {
        if (!existsSync(`${outDir}/views`)) {
          mkdirSync(`${outDir}/views`, { recursive: true });
        }
        copyFileSync(`${outDir}/src/views/background.html`, `${outDir}/views/background.html`);
      }

      if (existsSync(`${outDir}/src`)) {
        rmSync(`${outDir}/src`, { recursive: true, force: true });
      }

      console.log('Firefox assets copied successfully');
    }
  };
}

export default defineConfig(
  mergeConfig(baseConfig, {
    plugins: [copyFirefoxAssetsPlugin()],
    define: {
      'process.env.BROWSER': JSON.stringify('firefox'),
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
      outDir: 'dist/firefox',
      sourcemap: false,
      minify: true
    }
  })
);
