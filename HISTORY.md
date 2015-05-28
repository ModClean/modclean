# ModClean History

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
