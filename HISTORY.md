# ModClean History

## 2.1.0 (1/17/2017)
* Added `emptyDirFilter` configuration option.
* Use `Object.assign` instead of `extend` module.
    - Removed `extend` dependency.
* Removed unused `pad` dependency.
* Removed duplicate call to `clean()` in shortcut method.
* Misc. cleanup
* **Breaking Change:** All error events (`error`, `fileError` and `emptyDirsError`) now return error object.
* **New!** Added `errors` property on the ModClean class which contains all errors that occurred.
* Moved documentation to the Wiki.

## 2.0.0 (1/11/2017)
### ModClean API Changes
* Complete rewrite using ES6 and some breaking changes (now requires Node v6.9+)
* No longer includes `patterns.json` file, instead uses plugins to allow further customization.
* **Breaking Change:** `patterns` option now takes array of pattern plugins instead of patterns. See README for more information.
* **Breaking Change:** `ignore` option has been renamed to `ignorePatterns`.
* **Breaking Change:** `process` option now is sync with only 1 argument and async with 2.
* **New!** Added `additionalPatterns` option that takes array of glob patterns to use with any provided pattern plugins.
* **New!** Added `dotFiles` option that allows disabling of removing dot files.
* **New!** Added `process` event which will be fired before the files start processing.
* **New!** When finding empty directories, it will now ignore `.DS_Store` and `Thumbs.db` files.
* **New!** Added `beforeFind` event.
* **New!** Added `beforeEmptyDirs` event.
* **New!** Added `emptyDirs` event.
* **New!** Added `emptyDirError` event.
* **New!** Added `afterEmptyDirs` event.
* **New!** Added `deletedEmptyDir` event.
* Removed utility functions in favor for micro-packages.
    * Removed unused dependencies.
    * Replaced `node-dir` dependency with `subdirs`.
    * Replaced `colors` dependency with `chalk`.
    * Added `empty-dir` dependency.
    * Added `async-each-series` dependency.
    * Added `extend` dependency.
    * Added `lodash.uniq` dependency.
* Updated all dependcies to their latest versions.
* Benchmarks updated for 2017.

### ModClean CLI Changes
* Rewrite using ES6 with new features and bug fixes.
* **Breaking Change:** `-n, --patterns` option now takes list of plugins instead of a pattern rule name.
* **Removed:** `-d, --empty` option.
* **New!** Added `-D, --modules-dir` option.
* **New!** Added `-a, --additional-patterns` option.
* **New!** Added `-k, --keep-empty` option.
* **New!** Added `--no-dotfiles` option.
* Removed `inquirer` dependency in favor of `clui` and utility functions.
* Reduced memory usage of the CLI.
* Logging has been rewritten to handle stack overflow errors.
* Updated some text.

_If you still need to support Node < v6.9, use ModClean 1.3.0 instead. For more information about these changes, refer to the README._

## 1.3.0 (1/6/2017)
* Added `noDirs` option to exclude directories from being removed (#8)
    - Added `--no-dirs` option to CLI (#8)
* Added `ignore` option to exclude array of glob patterns from being removed (#8)
    - Added `-I, --ignore` option to CLI to pass in comma-separated list of glob patterns (#8)
* Changed the `*.map` safe pattern to `*.js.map` (#10)
* Moved `*.map` to danger patterns (#10)
* Skip inital logging if not verbose to prevent stack overflow (#9)

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
