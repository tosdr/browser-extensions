// recursively copy files from /src to /tsc while ignoring all .ts files

const fs = require('fs');
const path = require('path');

const sourceDir = 'src';
const buildDir = 'tsc';

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
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
        if (!src.endsWith('.ts')) {
            fs.copyFileSync(src, dest);
        }
    }
}

copyRecursiveSync(sourceDir, buildDir);