# WebExtension for [Terms of Service; Didn't Read][tosdr]

“I have read and agree to the Terms” is the biggest lie on the web.
We aim to fix that. “Terms of Service; Didn't Read” is a user
rights initiative to rate and label website terms & privacy
policies, from very good (class A) to very bad (class E).

This extension informs you instantly of your rights online by
showing an unintrusive icon in the toolbar. You can click on this
icon to get summaries from the [Terms of Service; Didn't
Read][tosdr] initiative.

This is a complete rewrite of the old extension for modern browsers, written in TypeScript.

Get the extension

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read/)
- [Chrome](https://chromewebstore.google.com/detail/terms-of-service-didn’t-r/hjdoplcnndgiblooccencgcggcoihigg)
- [Safari](https://apps.apple.com/en/app/tos-dr/id6470998202?l=en-GB)


[tosdr]: https://tosdr.org

-----------

Installation instructions
-------------------------
### Release
For release builds, refer to the links above.

### Development
The extension is built with [WXT](https://wxt.dev). After installing dependencies (see below), start a dev server with hot reload:

```sh
npm run dev          # Chrome
npm run dev:firefox  # Firefox
```

WXT opens a fresh browser profile with the extension loaded. To load a build manually instead, open `chrome://extensions` (enable Developer mode → "Load unpacked") or `about:debugging#/runtime/this-firefox` ("Load Temporary Add-on…") and point it at the matching folder in `.output/`.

-----------

Building instructions
---------------------

Make sure you have [Node.js](https://nodejs.org) or [Bun](https://bun.sh) installed, then from the repository root:

1. Install dependencies

   ```sh
   npm install    # or: bun install
   ```

2. Build

   ```sh
   npm run build          # Chrome  → .output/chrome-mv3
   npm run build:firefox  # Firefox → .output/firefox-mv3
   ```

3. Package for store submission (optional)

   ```sh
   npm run zip            # Chrome  → .output/*-chrome.zip
   npm run zip:firefox    # Firefox → .output/*-firefox.zip (+ sources zip)
   ```

To type-check the project without building, run `npm run compile`.

Artifacts
======

Artifacts of each build and release can be viewed on GitHub [here](https://github.com/tosdr/browser-extensions/actions).


License
======

AGPL-3.0+ (GNU Affero General Public License, version 3 or later)

See <https://tosdr.org/legal.html> for more details on the legal aspects of the project.

Packages we use
======

- JSZip
- Sentry
- Open Sans by Google