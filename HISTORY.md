# ModClean History

## 1.2.6 (3/4/2016)
* Added additional patterns #6 (@KenRmk)
* Added Node 4.0 and 4.1 to `.travis.yml`
* Updated dependencies:
    * glob@7.0.0
    * inquirer@0.12.0
    * update-notifier@0.6.1

## 1.2.5 (8/26/2015)
* Fix a deprecated function in inquirer that was missed during testing (#5)

## 1.2.4 (8/26/2015)
* Added ability to disable progress bar in CLI (#5)
* Updated dependencies:
    * inquirer@0.9.0
    * update-notifier@0.5.0
    * colors@1.1.2
    * commander@2.8.1
    * glob@5.0.14
    * node-dir@0.1.9
    * rimraf@2.4.2
* Updated dev dependencies:
    * should@7.0.4
    * mocha@2.2.5

## 1.2.3 (6/30/2015)
* Removed `.bin` pattern from safe patterns (#4)

## 1.2.2 (5/28/2015)
* Adjusted `history*` pattern (#3)

## 1.2.1 (4/29/2015)
* Removed lingering `console.log`.

## 1.2.0 (4/28/2015)
* Added several new patterns to `patterns.json`.
* Added ability to delete empty directories.
    * Added `ModClean()._removeEmpty()`.
    * Added `removeEmptyDirs` option.
    * Added `-d, --empty` flags to the CLI to toggle `removeEmptyDirs` on.
* Added `node-dir` dependency.
* Added `BENCHMARK.md` file to store a list of benchmarks.
* Updated `.travis.yml` to include io.js
* Updated and fixed `README.md`.
* Updated tests.

## 1.1.2 (4/25/2015)
* Fixed line endings for OS X and Linux systems

## 1.1.0 (4/24/2015)
* Exposes `modclean.patterns` object.
* Changed `patterns.json` to be an object with 3 different levels of file matching.
* Changed `options.patterns` to default to `modclean.patterns.safe`.
* `options.patterns` can now be an Array of Arrays that will be flattened.
* Added additional safe patterns to `patterns.json`.
* modclean CLI now takes option `-n, --patterns [patterns]`.
* Updated tests and README.

## 1.0.0 (4/23/2015)
* Initial release
