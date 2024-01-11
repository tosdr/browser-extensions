/*eslint no-undef: "off"*/
const fs = require('fs');
const path = require('path');
const Terser = require('terser');
const htmlMinifier = require('html-minifier');
const CleanCSS = require('clean-css');

// Source, build and distribution directories
const sourceDir = 'tsc';
const buildDir = 'build';
const distDir = 'dist';

// Function to minify a JavaScript file
function minifyJSFile(file) {
    const filePath = path.join(sourceDir, file);
    const code = fs.readFileSync(filePath, 'utf8');

    // Minify the JavaScript code
    Terser.minify(code, {
        mangle: {
            properties: {
                regex: /^_/,
            },
        },
        compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true,
            drop_debugger: true,
            global_defs: {
                '@process.env.NODE_ENV': 'production',
            },
        },
        output: {
            comments: false, // Remove comments
        },
    }).then((result) => {
        if (result.code && typeof result.code === 'string') {
            const buildFilePath = path.join(buildDir, file);
            const buildFileDir = path.dirname(buildFilePath);

            if (!fs.existsSync(buildFileDir)) {
                fs.mkdirSync(buildFileDir, { recursive: true });
            }
            fs.writeFileSync(buildFilePath, result.code, 'utf8');
            console.log(`Minified ${file} -> ${buildFilePath}`);
        } else {
            console.error(
                `Error minifying ${file}: Unexpected result from Terser.`
            );
        }
    });
}

// Function to minify an HTML file
function minifyHTMLFile(file) {
    const filePath = path.join(sourceDir, file);
    const code = fs.readFileSync(filePath, 'utf8');

    // Minify the HTML code
    const minifiedCode = htmlMinifier.minify(code, {
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        removeEmptyElements: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
    });

    const buildFilePath = path.join(buildDir, file);
    const buildFileDir = path.dirname(buildFilePath);

    if (!fs.existsSync(buildFileDir)) {
        fs.mkdirSync(buildFileDir, { recursive: true });
    }
    fs.writeFileSync(buildFilePath, minifiedCode, 'utf8');
    console.log(`Minified ${file} -> ${buildFilePath}`);
}

// Function to minify a CSS file
function minifyCSSFile(file) {
    const filePath = path.join(sourceDir, file);
    const code = fs.readFileSync(filePath, 'utf8');

    // Minify the CSS code
    const minifiedCode = new CleanCSS().minify(code).styles;

    const buildFilePath = path.join(buildDir, file);
    const buildFileDir = path.dirname(buildFilePath);

    if (!fs.existsSync(buildFileDir)) {
        fs.mkdirSync(buildFileDir, { recursive: true });
    }
    fs.writeFileSync(buildFilePath, minifiedCode, 'utf8');
    console.log(`Minified ${file} -> ${buildFilePath}`);
}

// Function to copy a file
function copyFile(file) {
    const srcFilePath = path.join(sourceDir, file);
    const destFilePath = path.join(buildDir, file);
    const destFileDir = path.dirname(destFilePath);

    if (!fs.existsSync(destFileDir)) {
        fs.mkdirSync(destFileDir, { recursive: true });
    }

    fs.copyFileSync(srcFilePath, destFilePath);
    console.log(`Copied ${file} -> ${destFilePath}`);
}

// Function to recursively process files in a directory
function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();

        if (isDirectory) {
            processDirectory(filePath);
        } else {
            if (file.startsWith('background')) { 
                console.log('skipping');
            } else if (file.endsWith('.js')) {
                minifyJSFile(filePath.substring(sourceDir.length + 1));
            } else if (file.endsWith('.html')) {
                minifyHTMLFile(filePath.substring(sourceDir.length + 1));
            } else if (file.endsWith('.css')) {
                minifyCSSFile(filePath.substring(sourceDir.length + 1));
            } else {
                copyFile(filePath.substring(sourceDir.length + 1));
            }
        }
    });
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (exists && isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function createDistFolder(browser) {
    const browserBuildDir = path.join(distDir, browser);

    // Ensure the dist folder exists
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    // Ensure the browser-specific build folder exists
    if (!fs.existsSync(browserBuildDir)) {
        fs.mkdirSync(browserBuildDir);
    }

    // Copy contents from build folder recursively
    copyRecursiveSync(buildDir, browserBuildDir);

    // Adjust manifest files based on the browser
    const manifestSrc =
        browser === 'chrome' ? 'manifest.json' : 'manifest-ff.json';
    const manifestDest = 'manifest.json';

    const manifestDestPath = path.join(browserBuildDir, manifestDest);

    // Move or rename the Firefox manifest to manifest.json for Firefox
    fs.renameSync(path.join(browserBuildDir, manifestSrc), manifestDestPath);

    // Delete all manifest-*.json files
    fs.readdirSync(browserBuildDir).forEach((item) => {
        if (item.startsWith('manifest-')) {
            fs.unlinkSync(path.join(browserBuildDir, item));
        }
    });

    console.log(`Created ${browser} dist folder with adjusted manifest files.`);
}

// Ensure the build directory exists
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Start the minification process
processDirectory(sourceDir);

// wait 5 seconds to make sure processing is done
console.log('Waiting 3 seconds for processing to finish...');
setTimeout(() => {
    // Generate the distribution files
    createDistFolder('chrome');
    createDistFolder('firefox');

    console.log('Done!');
}, 3000);
