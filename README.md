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
Just open ```about:debugging``` (Firefox) or ``chrome:extensions`` (Chrome) and follow instructions.

-----------

Building instructions
---------------------

Make sure you have `node` installed, and from the repository root run the following:

1. Install dependencies
`npm install`

2. Build
`npm run build`

3. Package up the contents of `./dist/chrome` and `./dist/firefox`

Publishing the Chrome extension
-----------------------------

TODO: document

Publishing the Firefox extension
--------------------------------

TODO: document

Publishing the Edge extension
-----------------------------

* follow the build instructions
* cd ./dist/chrome
* zip -r ../chrome.zip .
* upload it to the [Microsoft Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/a77b3f51-22a2-4310-a2cd-e118e062cc63/packages).
* this will require a [client certificate](https://github.com/tosdr/browser-extensions/issues/109#issuecomment-2545206825)
* click through the 'continue' and 'publish'
* after [review by Microsoft](https://github.com/tosdr/browser-extensions/issues/109#issuecomment-2545207271) it will be [available to Edge users](https://microsoftedge.microsoft.com/addons/detail/terms-of-service-didn%E2%80%99t-/oaaecoiolcpocebdnakfpfjegbmmpkjn)

Artifacts
======

Artifacts of each build and release can be viewed on S3: https://tosdr-artifacts.s3.eu-west-2.jbcdn.net/minio/tosdr-artifacts/browser-extensions/


License
======

AGPL-3.0+ (GNU Affero General Public License, version 3 or later)

See <https://tosdr.org/legal.html> for more details on the legal aspects of the project.

Packages we use
======

- JSZip
- Sentry
- Open Sans by Google