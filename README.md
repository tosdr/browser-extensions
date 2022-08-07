# WebExtension for [Terms of Service; Didn't Read][tosdr]

“I have read and agree to the Terms” is the biggest lie on the web.
We aim to fix that. “Terms of Service; Didn't Read” is a user
rights initiative to rate and label website terms & privacy
policies, from very good (class A) to very bad (class E).

This extension informs you instantly of your rights online by
showing an unintrusive icon in the toolbar. You can click on this
icon to get summaries from the [Terms of Service; Didn't
Read][tosdr] initiative.

Get the extension
[for Firefox](https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read) **[0.6.2]**
or [for Chrome](https://chrome.google.com/webstore/detail/terms-of-service-didn%E2%80%99t-r/hjdoplcnndgiblooccencgcggcoihigg) **[2.0.0]**

[tosdr]: https://tosdr.org

-----------

Installation instructions
-------------------------

Just open ```about:debugging``` (Firefox) or ``chrome:extensions`` (Chrome) and follow instructions.

-----------

Building instructions
---------------------

Make sure you have `node` installed, and from the repository root, run:

```bash
./build.sh
```
This will create two extensions in the dist folder, one for Firefox and one for Chrome.
 
-----------


Verification
======

Official Artifacts are from version 3.4.3 and upwards are always GPG Signed.

You can verify each release with our associated GPG Key found [here](https://raw.githubusercontent.com/tosdr/browser-extensions/master/signkey_0xE719AF12.asc)


Artifacts
======

Artifacts of each build and release can be viewed on S3: https://tosdr-artifacts.s3.eu-west-2.jbcdn.net/minio/tosdr-artifacts/browser-extensions/


License
======

AGPL-3.0+ (GNU Affero General Public License, version 3 or later)

See <https://tosdr.org/legal.html> for more details on the legal aspects of the project.
