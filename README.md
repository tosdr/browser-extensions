# Firefox add-on for [Terms of Service; Didn't Read][tosdr]

“I have read and agree to the Terms” is the biggest lie on the web.
We aim to fix that. “Terms of Service; Didn't Read” is a user
rights initiative to rate and label website terms & privacy
policies, from very good (class A) to very bad (class E).

This extension informs you instantly of your rights online by
showing an unintrusive icon in the toolbar. You can click on this
icon to get summaries from the [Terms of Service; Didn't
Read][tosdr] initiative.

Get the extension
[here](https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read/) **[0.4.1]**

[tosdr]: https://tosdr.org

-----------

Installation instructions
-------------------------

- Download the xpi [from github][Github Download Link].

- Drag & drop the xpi to firefox.

[Github Download Link]: https://github.com/tosdr/tosdr-firefox/blob/master/tosdr.xpi?raw=true

-----------

Building instructions
---------------------

Want to contribute or build XPI ?

- First, make sure you have an updated checkout of the repository and its git
  submodules:

 ```shell
$ git clone --recursive git@github.com:tosdr/tosdr-firefox.git
$ cd tosdr-firefox
 ```
 
- If you haven't done that already, download and install the [Add-on SDK][].

- Once inside the SDK environnement (having activated it using `source
  bin/activate`), go to the add-on directory, and run `cfx run` to quickly test
  that everything is OK, and `cfx xpi` to generate the addon file.

- Drag & drop the resulting xpi to firefox.

[Add-on SDK]: https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation

- Installation on OS X using Homebrew
If you're a Mac user, you can instead choose to use Homebrew to install the SDK, using the following command:

 ```shell
brew install mozilla-addon-sdk
 ```
 
Once this has completed successfully, you can use the cfx program at your command line at any time: you don't need to run bin/activate.

-----------

### Screenshots

OS X

![screenshot](https://dl.dropbox.com/u/18317770/tos.png)

Windows

![screenshot](https://dl.dropbox.com/u/18317770/tos-win.png)

GNU/Linux

![screenshot](https://dl.dropbox.com/u/18317770/tos-linux.png)



License
======

AGPL-3.0+ (GNU Affero General Public License, version 3 or later)

See <https://tosdr.org/legal.html> for more details on the legal aspects of the project.
