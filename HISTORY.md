# ModClean History

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
