# ModClean
*Remove unwanted files and directories from your node_modules folder*

[![npm version](https://img.shields.io/npm/v/modclean.svg)](https://www.npmjs.com/package/modclean) [![Build Status](https://img.shields.io/travis/KyleRoss/modclean.svg)](https://travis-ci.org/KyleRoss/modclean) ![NPM Dependencies](https://david-dm.org/KyleRoss/modclean.svg) [![NPM Downloads](https://img.shields.io/npm/dm/modclean.svg)](https://www.npmjs.com/package/modclean) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/KyleRoss/modclean/master/LICENSE) [![GitHub issues](https://img.shields.io/github/issues/KyleRoss/modclean.svg)](https://github.com/KyleRoss/modclean/issues)

In some environments (especially Enterprise), it's required to commit the `node_modules` folder into version control due to compatibility and vetting open source code. One of the major issues with this is the sheer amount of useless files that are littered through the node_modules folder; taking up space, causing long commit/checkout times, increasing latency on the network, causing additional stress on a CI server, etc. If you think about it, do you really need to deploy tests, examples, build files, attribute files, etc? ModClean is a simple utility that provides a full API and CLI utility to reduce the number of useless files. Even if you do not commit your node_modules folder, this utility is still useful when the application is deployed since you do not need these useless files wasting precious disk space on your server.

Depending on the number of modules you are using, file reduction can be anywhere from hundreds to thousands. I work for a Fortune 500 company and we use this to reduce the amount of useless files and typically we remove over 500 files (roughly 100MB total) from our ~20 modules we use in our applications. It's a huge improvement in deployment time and commit/checkout time.

This module comes with a JSON file (patterns.json) that outlines file patterns that searched for through the node_modules folder recursively. This list is a basic list of commonly found files/folders within various node_modules that are junk, although it's by no means a complete list. Even though this is the default list, you can provide your own list of patterns to use instead.

**IMPORTANT**
This module has been heavily tested in an enterprise environment used for large enterprise applications. The provided patterns in this module (see patterns.json) have worked very well when cleaning up useless files in many popular modules. There are hundreds of thousands of modules in NPM and we cannot simply cover them all. If you are using ModClean for the first time on your application, you should create a copy of the application so you can ensure it still runs properly after running ModClean. The patterns are set in a way to ensure no crutial module files are removed, although there could be one-off cases where a module could be affected and that's why I am stressing that testing and backups are important. There could still be many useless files left after the cleanup process since we cannot cover them all. If you find any files that should be removed, please create a pull request using the contributing guidelines at the bottom of this file.

### Removal Benchmark
So how well does this module work? If we `npm install sails` and run ModClean on it, here are the results:

#### Using Safe Patterns
`modclean -n safe`

|                 | Total Files | Total Folders | Total Size  |
| --------------- | ----------- | ------------- | ----------- |
| Before ModClean | 7,461       | 1,915         | 72.5 MB     |
| After ModClean  | 3,335       | 1,393         | 43.5 MB     |
| Reduced         | **4,126**   | **522**       | **29.0 MB** |

#### Using Safe and Caution Patterns
`modclean -n safe,caution`

|                 | Total Files | Total Folders | Total Size  |
| --------------- | ----------- | ------------- | ----------- |
| Before ModClean | 7,461       | 1,915         | 72.5 MB     |
| After ModClean  | 3,029       | 1,393         | 38.8 MB     |
| Reduced         | **4,432**   | **522**       | **33.7 MB** |

#### Using Safe, Caution and Danger Patterns
`modclean -n safe,caution,danger`

|                 | Total Files | Total Folders | Total Size  |
| --------------- | ----------- | ------------- | ----------- |
| Before ModClean | 7,461       | 1,915         | 72.5 MB     |
| After ModClean  | 2,957       | 1,393         | 35.9 MB     |
| Reduced         | **4,504**   | **522**       | **36.6 MB** |

That makes a huge difference in the amount of files and disk space.

View additional benchmarks in [BENCHMARK.md](https://github.com/KyleRoss/modclean/blob/master/BENCHMARK.md). If you would like to run some of your own benchmarks, you can use [modclean-benchmark](https://github.com/KyleRoss/modclean-benchmark).

## Install

Install locally

    npm install modclean --save

Install globally (CLI)

    npm install modclean -g


## CLI Usage
If you want to use this module as a tool, you can use the provided CLI utility. After installing globally, you will now have access to the command `modclean`. There are several options available to customize how it should run. All options listed below are optional.

### Usage

    modclean [-tsievrhV] [-p path]

#### -p [path], --path [path]
Provide a different path to run ModClean in. By default, it uses `process.cwd()`. The path **must** either be inside a `node_modules` directory or in a directory that contains a `node_modules` folder.

#### -n, --patterns [patterns]
Specify which group(s) of patterns to use. Can be `safe`, `caution` or `danger`. Separate multiple groups by a single comma (no spaces). Default is `safe`. 
Example: `modclean -n safe,caution`

#### -t, --test
Run in test mode which will do everything ModClean does except delete the files. It's good practice to run this first to analyze the files that will be deleted.

#### -s, --case-sensitive
When files are searched, they are searched using case sensitive matching. (ex. `README.md` pattern would not match `readme.md` files)

#### -i, --interactive
Run in interactive mode. For each file found, you will be prompted whether you want to delete or skip.

#### -P, --no-progress
Turns off the progress bar when files are being deleted.

#### -I, --ignore
Comma-separated list of glob patterns to ignore during cleaning.

#### --no-dirs
Do not delete directories, only files.

#### -d, --empty
Delete all empty directories after the cleanup process. Does not prompt for deletion when in `--interactive` mode.

#### -e, --error-halt
Whether to halt the process when an error is encountered. The process is only halted when there is an issue deleting a file due to permissions or some other catastrophic issue.

#### -v, --verbose
Runs in verbose mode. This will display much more information during the process.

#### -r, --run
Run the utility immediately without displaying the warning and having to confirm.

#### -h, --help
Show help/usage screen.

#### -V, --version
Display the version of ModClean that is installed.

---

## API Documentation
You can also use ModClean programmically so you can include it into your own utilities and customize how it works. Just install ModClean locally to your project.

### Examples

    // Require modclean module
    var modclean = require('modclean');

Run the basic ModClean process with a callback function when completed.

    modclean(function(err, results) {
        if(err) return console.error(err);
        
        console.log('Deleted Files Total:', results.length);
    });

Run the basic ModClean process with conditional file skipping.

    modclean({
        process: function(file, files) {
            // Skip .gitignore files
            if(file.match(/\.gitignore/i)) {
                return false;
            }
            
            return true;
        }
    }).clean(function(err, results) {
        if(err) return console.error(err);
        
        console.log('Deleted Files Total:', results.length);
    });

More advanced usage.

    var path = require('path');
    
    var MC = new modclean.ModClean({
        // Define a custom path
        cwd: path.join(process.cwd(), 'myApp/node/node_modules'),
        // Only delete patterns.safe patterns along with html and png files
        patterns: [modclean.patterns.safe, '*.html', '*.png'],
        // Run in test mode so no files are deleted
        test: true
    });
    
    MC.on('deleted', function(file) {
        // For every file deleted, log it
        console.log((MC.options.test? 'TEST' : ''), file, 'deleted from filesystem');
    });
    
    // Run the cleanup process without using the 'clean' function
    MC._find(null, function(err, files) {
        if(err) return console.error('Error while searching for files', err);
        
        MC._process(files, function(err, results) {
            if(err) return console.error('Error while processing files', err);
            
            console.log('Deleted Files Total:', results.length);
        });
    });

### Options
The options below can be used to modify how ModClean works.

#### cwd
*(String)* **Default:** `process.cwd()`  
The path in which ModClean should recursively search through to find files to remove. If the path does not end with `options.modulesDir`, it will be appended to the path, allowing this script to run in the parent directory.

#### patterns
*(Array)* **Default** `modclean.patterns.safe` (see patterns.json file)  
Patterns to use as part of the search. These patterns are concatenated into a regex string and passed into `glob`. Anything allowed in `glob` can be used in the patterns. This option can also be an array of arrays in which will be flattened.

#### ignoreCase
*(Boolean)* **Default** `true`  
Whether `glob` should ignore the case of the file names when searching. If you need to do strict searching, set this to `false`.

#### process
*(Function)* **Default:** `null`  
Optional function to call before each file is deleted. This function can be used asynchronously or synchronously depending on the number of parameters provided. If the provided function has 1 or 2 parameters `function(file, files)`, it is synchronous, if it has 3 parameters `function(file, files, cb)`, it is asynchronous. When sync, you can `return false` to skip the current file being processed, otherwise when async, you can call the callback function `cb(false)` to skip the file. The **file** parameter is the current path with the filename appened of the file being processed. The **files** parameter is the full array of all the files.

#### modulesDir
*(String|Boolean)* **Default:** `"node_modules"`  
The modules directory name to use when looking for modules. This is only used when setting the correct `options.cwd` path. If you do not want the modules directory to be appended to `options.cwd`, set this option to `false`. If `options.cwd` already ends with the value of this option, it will not be appended to the path.

#### removeEmptyDirs
*(Boolean)* **Default:** `true`  
Whether to remove empty directories after the cleanup process. This is usually a safe option to use.

#### ignore
*([String])* **Default:** `null`  
Array of glob patterns (strings) to ignore while running the deletion process.

#### noDirs
*(Boolean) **Default:** `false`  
Set to `true` to skip directories from being deleted during the cleaning process.

#### errorHalt
*(Boolean)* **Default:** `false`  
Whether the script should exit with a filesystem error if one is encountered. This really only pertains to systems with complex permissions or Windows filesystems. The `rimraf` module will only throw an error if there is actually an issue deleting an existing file. If the file doesn't exist, it does not throw an error.

#### test
*(Boolean)* **Default:** `false`  
Whether to run in test mode. If set to `true` everything will run (including all events), although the files will not actually be deleted from the filesystem. This is useful when you need to analyze the files to be deleted before actually deleting them.


### Methods and Properties
These are the methods and properties returned when calling `var modclean = require('modclean');`.

#### modclean([options][,cb])
Create a new `ModClean` instance. It's the same as calling `new modclean.ModClean()`. If a callback function is provided, it will automatically call the `clean()` method and therefore `clean()` should not be called manually. If you need to set event listeners, set the callback function in the `clean()` method instead.

**options** *(Object)* - Options to configure how ModClean works. (Optional)
**cb** *(Function)* - Callback function to call once the process is completed `function(err, results)`. The `results` parameter contains an array of all the files that were successfully remove from the filesystem.

#### modclean.defaults
*(Object)* - The default options used in all created ModClean instances. You may change the defaults at anytime if you will be creating multiple instances that need to use the same options.

#### modclean.patterns
*(Object)* - The full list of patterns provided in `patterns.json`. This returns 3 properties (`safe`, `caution`, `danger`) which determines the level of file removal.

#### modclean.ModClean([options][,cb])
Create instance of the `ModClean` class. The parameters are the same as `modclean()`. The only difference between this and `modclean()` is that this must be called with `new`.

    var modclean = require('modclean');
    
    // Create new instance
    var MC = new modclean.ModClean();

#### modclean.ModClean().clean([cb])
Runs the ModClean process. Only needs to be called if a callback function is not provided to `modclean.ModClean()`.

**cb** *(Function)* - Callback function to call once the process is completed `function(err, results)`. The `results` parameter contains an array of all the files that were successfully remove from the filesystem.

#### modclean.ModClean()._find(patterns, cb)
Internally used by ModClean to search for files based on the provided patterns.

**patterns** *(Array|null)* - Patterns to use for the search process. If set to `null`, it will default to `options.patterns`.
**cb** *(Function)* - Callback function to call once the search process is completed with an array of file paths `function(err, files)`.

#### modclean.ModClean()._process(files, cb)
Internally used by ModClean to process each of the files. The processing includes running `options.process` and then calling `ModClean()._deleteFile()`.

**files** *(Array)* - Array of file paths to process and send for deletion.
**cb** *(Function)* - Callback function to call once processing and deletion is complete `function(err, results)`. The results parameter contains an array of files that were successfully deleted (does not include skipped files).

#### modclean.ModClean()._deleteFile(file, cb)
Internally used by ModClean to delete a file at the given path.

**file** *(String)* - File path to be deleted. Should not include `options.cwd` as it will be prepended.
**cb** *(Function)* - Callback function to be called once the file is deleted `function(err, file)`. The callback will not receive an error if `options.errorHalt = false`.

#### modclean.ModClean()._removeEmpty(cb)
Internally used by ModClean to delete all empty directories within `options.cwd`.

**cb** *(Function)* - Callback function to be called once all empty directories have been deleted `function(err, results)`.

#### modclean.ModClean().options
Compiled options object used by the ModClean instance.

#### modclean.ModClean().on(event, fn)
Creates an event handler on the ModClean instance.

**event** *(String)* - Any of the event names the are listed in the events section below.
**fn** *(Function)* - Function to call when the specified event is emitted.


### Events
The following events are emitted from the `ModClean` instance.

#### start
Emitted at the beginning of `clean()`.

**inst** *(Object)* - Provides access to the current ModClean instance.

#### files
Emitted once a list of all found files has been compiled from the `_find()` method.

**files** *(Array)* - Array of file paths found.

#### deleted
Emitted each time a file has been deleted from the file system by the `_deleteFile()` method.

**file** *(String)* - The file path that has been deleted.

#### finish
Emitted once processing and deletion of files has completed by the `_process()` method.

**results** *(Array)* - List of file paths that were successfully deleted from the file system (not including skipped files).

#### complete
Emitted once the entire ModClean process has completed before calling the main callback function.

**err** *(Object|String|null)* - Error (if any) that was thrown during the process.
**results** *(Array)* - List of file paths that were successfully deleted from the file system (not including skipped files).

#### fileError
Emitted if there was an error thrown while deleting a file/folder. Will emit even if `options.errorHalt = false`.

**err** *(Object|String)* - Error thrown by `rimraf`.
**file** *(String)* - File path of the file/folder that caused the error.

#### error
Emitted if there was an error thrown somewhere in the module.

**err** *(Object|String)* - The error that was thrown.

---

## Tests
This module has a good number of tests written for it that should cover most (if not all cases). If you would like to run the tests, please install `mocha` globally and install the `devDependencies` for this module. You can run the tests by calling `npm test`. The tests are ran using this modules own `node_modules` folder.

---

## Issues
If you find any bugs with either ModClean or the CLI Utility, please feel free to open an issue. Any feature requests may also be poseted in the issues.

---

## Contributing
If you would like to contribute to this project, please ensure you follow the guidelines below:

### Code Style
I'm not very picky on the code style as long as it roughly follows what is currently written in the modules. Just ensure that lines that should end with semi-colons do end with them. Comments are also very helpful for future contributors to know what's going on.

### Run Tests
If you are making a code change, please run the tests and ensure they pass before submitting a pull request. If you are adding new functionality, please ensure to write the tests for it.

### Patterns.json Changes
In case there are file patterns that were missed and this module could clean up additional files, feel free to submit a pull request adding the pattern. I will not accept pull reuqests that use wildcards on `.js` or `.json` files. If you notice a pattern that is causing issues with a particular module, submit a pull request or issue. There are 3 sections to the `patterns.json` file: (`safe`, `caution` and `danger`). Each of these sections determine the level of files to remove which includes additional patterns that match file/folder names. Safe patterns contain absolutely useless files that can be safely removed whereas caution and danger patterns are ones in which could cause issues with certain modules but will help significantly clean up more files.

---

## License
ModClean is licensed under the MIT license. Please see LICENSE in the repository for the full text.
