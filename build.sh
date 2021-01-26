#!/bin/bash

cat src/manifest.json | sed '/"version":/ s/"version":[^,]*/"version":"'$(npm run env | grep npm_package_version | cut -d '=' -f 2)'"/' > src/manifest.json
mkdir -p build; rm -rf build/*
mkdir -p dist; rm -rf dist/*
cp -r src build/firefox
cp -r src build/chrome
node mixin.js firefox/manifest.json build/firefox/manifest.json
cd build/chrome; zip -r ../../dist/chrome.zip *; cd ../..
cd build/firefox; zip -r ../../dist/firefox.xpi *; cd ../..
rm -rf build