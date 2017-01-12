# ModClean
*Remove unwanted files and directories from your node_modules folder*

[![npm version](https://img.shields.io/npm/v/modclean.svg)](https://www.npmjs.com/package/modclean) [![Build Status](https://img.shields.io/travis/KyleRoss/modclean.svg)](https://travis-ci.org/KyleRoss/modclean) ![NPM Dependencies](https://david-dm.org/KyleRoss/modclean.svg) [![NPM Downloads](https://img.shields.io/npm/dm/modclean.svg)](https://www.npmjs.com/package/modclean) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/KyleRoss/modclean/master/LICENSE) [![GitHub issues](https://img.shields.io/github/issues/KyleRoss/modclean.svg)](https://github.com/KyleRoss/modclean/issues) [![Package Quality](http://npm.packagequality.com/shield/modclean.svg)](http://packagequality.com/#?package=modclean)

### This documentation is for ModClean 2.x which requires Node v6.9+, if you need to support older versions, use ModClean 1.3.0 instead.

In some environments (especially Enterprise), it's required to commit the `node_modules` folder into version control due to compatibility and vetting open source code. One of the major issues with this is the sheer amount of useless files that are littered through the node_modules folder; taking up space, causing long commit/checkout times, increasing latency on the network, causing additional stress on a CI server, etc. If you think about it, do you really need to deploy tests, examples, build files, attribute files, etc? ModClean is a simple utility that provides a full API and CLI utility to reduce the number of useless files. Even if you do not commit your node_modules folder, this utility is still useful when the application is deployed as you do not need these useless files wasting precious disk space on your server.

Depending on the number of modules you are using, file reduction can be anywhere from hundreds to thousands. I work for a Fortune 500 company and we use this to reduce the amount of useless files and typically we remove over 500 files (roughly 100MB total) from our ~20 modules we use in our applications. It's a huge improvement in deployment time and commit/checkout time.

**New!** In ModClean 2.0.0, patterns are now provided by plugins instead of a static `patterns.json` file as part of the module. By default, ModClean comes with [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) installed, providing the same patterns as before. You now have the ability to create your own patterns plugins and use multiple plugins to clean your modules. This allows flexibility with both the programmatic API and CLI.

**IMPORTANT**
This module has been heavily tested in an enterprise environment used for large enterprise applications. The provided patterns in [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) have worked very well when cleaning up useless files in many popular modules. There are hundreds of thousands of modules in NPM and I cannot simply cover them all. If you are using ModClean for the first time on your application, you should create a copy of the application so you can ensure it still runs properly after running ModClean. The patterns are set in a way to ensure no crutial module files are removed, although there could be one-off cases where a module could be affected and that's why I am stressing that testing and backups are important. If you find any files that should be removed, please create a pull request to [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) or create your own patterns plugin to share with the community.

### Removal Benchmark
So how well does this module work? If we `npm install sails` and run ModClean on it, here are the results:

_All tests ran on macOS 10.12.3 with Node v6.9.1 and NPM v4.0.5_

#### Using Default Safe Patterns
`modclean --empty-dirs -n default:safe` or `modclean -d`

|                 | Total Files | Total Folders | Total Size   |
| --------------- | ----------- | ------------- | ------------ |
| Before ModClean | 16,179      | 1,941         | 71.24 MB     |
| After ModClean  | 12,192      | 1,503         | 59.35 MB     |
| Reduced         | **3,987**   | **438**       | **11.88 MB** |

#### Using Safe and Caution Patterns
`modclean --empty-dirs -n default:safe,default:caution`

|                 | Total Files | Total Folders | Total Size   |
| --------------- | ----------- | ------------- | ------------ |
| Before ModClean | 16,179      | 1,941         | 71.24 MB     |
| After ModClean  | 11,941      | 1,473         | 55.28 MB     |
| Reduced         | **4,238**   | **468**       | **15.95 MB** |

#### Using Safe, Caution and Danger Patterns
`modclean --empty-dirs --patterns="default:*"`

|                 | Total Files | Total Folders | Total Size   |
| --------------- | ----------- | ------------- | ------------ |
| Before ModClean | 16,179      | 1,941         | 71.24 MB     |
| After ModClean  | 11,684      | 1,444         | 51.76 MB     |
| Reduced         | **4,495**   | **497**       | **19.47 MB** |

That makes a huge difference in the amount of files and disk space.

View additional benchmarks in [BENCHMARK.md](https://github.com/ModClean/modclean/blob/master/BENCHMARK.md). If you would like to run some of your own benchmarks, you can use [modclean-benchmark](https://github.com/ModClean/modclean-benchmark).

## Install

Install locally

```bash
npm install modclean --save
```

Install globally (CLI)

```bash
npm install modclean -g
```

## CLI Usage
If you want to use this module as a tool, you can use the provided CLI utility. After installing globally, you will now have access to the command `modclean`. There are several options available to customize how it should run. All options listed below are optional.

### Usage

    modclean [-tsiPevrkhV] [-p, --path=string] [-D, --modules-dir=string] [-n, --patterns=list] [-a, --additional-patterns=list] [-I, --ignore=list]

#### -p [path], --path [string]
Provide a different path to run ModClean in. By default, it uses `process.cwd()`. The path **must** be in a directory that contains a `node_modules` directory.

#### -D, --modules-dir [string]
Change the default modules directory name. Default is `node_modules`.

#### -n, --patterns [list]
Specify which pattern plugins/rules to use. Separate multiple groups by a single comma (no spaces). Default is `default:safe`. 
Example: `modclean -n default:safe,default:caution`

#### -a, --additional-patterns [list]
Specify custom glob patterns to be included in the search.  
Example: `modclean --additional-patterns="*history,*.html,.config"`

#### -I, --ignore [list]
Comma-separated list of glob patterns to ignore during cleaning. Useful when a pattern matches a module name you do not want removed.  
Example: `modclean --ignore="validate-npm-package-license,*history*"`

#### -t, --test
Run in test mode which will do everything ModClean does except delete the files. It's good practice to run this first to analyze the files that will be deleted.

#### -s, --case-sensitive
When files are searched, they are searched using case sensitive matching. (ex. `README.md` pattern would not match `readme.md` files)

#### -i, --interactive
Run in interactive mode. For each file found, you will be prompted whether you want to delete or skip.

#### -P, --no-progress
Turns off the progress bar when files are being deleted.

#### --no-dirs
Do not delete directories, only files.

#### --no-dotfiles
Exclude dot files from being deleted.

#### -k, --keep-empty
Exclude empty directories from being deleted.

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

```js
// Require modclean module
const modclean = require('modclean');
```

Run the basic ModClean process with a callback function when completed.

```js
modclean(function(err, results) {
    if(err) return console.error(err);
    
    console.log('Deleted Files Total:', results.length);
});
```

Run the basic ModClean process with conditional file skipping.

```js
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
```

More advanced usage.

```js
const path = require('path');
    
let MC = new modclean.ModClean({
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
```

### Options
The options below can be used to modify how ModClean works.

#### cwd
*(String)* **Default:** `process.cwd()`  
The path in which ModClean should recursively search through to find files to remove. If the path does not end with `options.modulesDir`, it will be appended to the path, allowing this script to run in the parent directory.

#### patterns
*(Array[string])* **Default** `["default:safe"]`  
Patterns plugins/rules to use. Each value is either the full plugin module name (ex. `modclean-patterns-pluginname`) or just the last section of the module name (ex. `pluginname`). Plugins will usually have different rules to use, you can specify the rule name by appending a colon ':' and the rule name (ex. `pluginname:rule`). If a rule name is not provided, it will load the first rule found on the plugin. If you want to use all rules, you can use an asterisk as the rule name (ex. `pluginname:*`). By default, [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) is included. If you want to create your own plugin, see [Custom Patterns Plugins](#custom-pattern-plugins) below.

#### additionalPatterns
*(Array[string])* **Default** `[]`
Additional custom `glob` patterns to include in the search. This will allow further customization without the need of creating your own patterns plugin.

#### ignorePatterns
*(Array[string])* **Default** `[]`
Custom `glob` patterns to ignore during the search. Allows skipping matched items that would normally be removed, which is good for patterns that match existing module names you wish not to be removed.

#### ignoreCase
*(Boolean)* **Default** `true`  
Whether `glob` should ignore the case of the file names when searching. If you need to do strict searching, set this to `false`.

#### process
*(Function)* **Default:** `null`  
Optional function to call before each file is deleted. This function can be used asynchronously or synchronously depending on the number of parameters provided. If the provided function has 0 or 1 parameters `function(file)`, it is synchronous, if it has 2 parameters `function(file, cb)`, it is asynchronous. When sync, you can `return false` to skip the current file being processed, otherwise when async, you can call the callback function `cb(false)` to skip the file. The **file** parameter is the current path with the filename appened of the file being processed.

#### modulesDir
*(String|Boolean)* **Default:** `"node_modules"`  
The modules directory name to use when looking for modules. This is only used when setting the correct `options.cwd` path. If you do not want the modules directory to be appended to `options.cwd`, set this option to `false`. If `options.cwd` already ends with the value of this option, it will not be appended to the path.

#### removeEmptyDirs
*(Boolean)* **Default:** `true`  
Whether to remove empty directories after the cleanup process. This is usually a safe option to use.

#### noDirs
*(Boolean)* **Default:** `false`  
Set to `true` to skip directories from being deleted during the cleaning process.

#### dotFiles
*(Boolean)* **Default** `true`
Set to `false` to skip dot files from being deleted during the cleaning process.

#### errorHalt
*(Boolean)* **Default:** `false`  
Whether the script should exit with a filesystem error if one is encountered. This really only pertains to systems with complex permissions or Windows filesystems. The `rimraf` module will only throw an error if there is actually an issue deleting an existing file. If the file doesn't exist, it does not throw an error.

#### test
*(Boolean)* **Default:** `false`  
Whether to run in test mode. If set to `true` everything will run (including all events), although the files will not actually be deleted from the filesystem. This is useful when you need to analyze the files to be deleted before actually deleting them.


### Methods and Properties
These are the methods and properties exported when calling `const modclean = require('modclean');`.

#### modclean([options][,cb])
Create a new `ModClean` instance. It's the same as calling `new modclean.ModClean()`. If a callback function is provided, it will automatically call the `clean()` method and therefore `clean()` should not be called manually. If you need to set event listeners, set the callback function in the `clean()` method instead.

| Argument  | Type     | Required? | Description                                                                                                            | Default |
|-----------|----------|-----------|------------------------------------------------------------------------------------------------------------------------|---------|
| `options` | Object   | No        | Optional options object to configure ModClean                                                                          | `{}`    |
| `cb`      | Function | No        | Optional callback function to call once cleaning complete. If not provided, `clean()` will not be called automatically | `null`  |

```js
const modclean = require('modclean');

modclean(function(err, results) {
    // called once cleaning is complete.
    if(err) {
        console.error(err);
        return;
    }
    
    console.log(`${results.length} files removed!`);
});
```

#### modclean.defaults
*(Object)* - The default options used in all created ModClean instances. You may change the defaults at anytime if you will be creating multiple instances that need to use the same options.

#### modclean.ModClean([options][,cb])
Access to the ModClean class constructor.

### ModClean Class

#### ModClean([options][,cb])
Create instance of the `ModClean` class. Must be called with `new`.

| Argument  | Type     | Required? | Description                                                                                                            | Default |
|-----------|----------|-----------|------------------------------------------------------------------------------------------------------------------------|---------|
| `options` | Object   | No        | Optional options object to configure ModClean                                                                          | `{}`    |
| `cb`      | Function | No        | Optional callback function to call once cleaning complete. If not provided, `clean()` will not be called automatically | `null`  |

```js
const ModClean = require('modclean').ModClean;
    
// Create new instance
let MC = new ModClean();
```

#### clean([cb])
Runs the ModClean process. Only needs to be called if a callback function is not provided to the `ModClean()` constructor.

| Argument | Type     | Required? | Description                                                                                                                                              | Default |
|----------|----------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `cb`     | Function | No        | Optional callback function to call once cleaning complete. Called with `err` (error message if one occurred) and `results` (array of file paths removed) | `null`  |

#### cleanEmptyDirs(cb)
Finds all empty directories and deletes them from `options.cwd`.

| Argument | Type     | Required? | Description                                                                                                                             | Default |
|----------|----------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------|---------|
| `cb`     | Function | Yes       | Callback function to call once complete. Called with `err` (error message if one occurred) and `results` (array of directories deleted) |         |

#### _find(cb)
Internally used by ModClean to search for files based on the loaded patterns/rules.

| Argument | Type     | Required? | Description                                                                                                                                 | Default |
|----------|----------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `cb`     | Function | Yes       | Callback function to call once complete. Called with `err` (error message if one occurred) and `files` (array of file paths found) |         |

#### _process(files, cb)
Internally used by ModClean to process each of the files. The processing includes running `options.process` and then calling `_deleteFile()`.

| Argument | Type          | Required? | Description                                                                                                                                     | Default |
|----------|---------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `files`  | Array[String] | Yes       | Array of file paths to be deleted.                                                                                                              |         |
| `cb`     | Function      | Yes       | Callback function to call once complete. Called with `err` (error message if one occurred) and `results` (array of file paths deleted) |         |

#### _deleteFile(file, cb)
Internally used by ModClean to delete a file at the given path.

| Argument | Type     | Required? | Description                                                                                                                                                                                                    | Default |
|----------|----------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `file`   | String   | Yes       | File path to be deleted                                                                                                                                                                                        |         |
| `cb`     | Function | Yes       | Callback function to call once complete. Called with `err` (error message if one occurred) and `files` (the file path deleted). The callback will not receive an error if `options.errorHalt = false` |         |

#### _findEmptyDirs(cb)
Internally used by ModClean to find all empty directories within `options.cwd`.

| Argument | Type     | Required? | Description                                                                                                                           | Default |
|----------|----------|-----------|---------------------------------------------------------------------------------------------------------------------------------------|---------|
| `cb`     | Function | Yes       | Callback function to call once complete. Called with `err` (error message if one occurred) and `results` (array of directories found) |         |

#### _removeEmptyDirs(dirs, cb)
Internally used by ModClean to delete all empty directories provided.

| Argument | Type     | Required? | Description                                                                                                                             | Default |
|----------|----------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------|---------|
| `cb`     | Function | Yes       | Callback function to call once complete. Called with `err` (error message if one occurred) and `results` (array of directories deleted) |         |

#### on(event, fn)
Creates an event handler on the ModClean instance using `EventEmitter`.

| Argument | Type     | Required? | Description                                           | Default |
|----------|----------|-----------|-------------------------------------------------------|---------|
| `event`  | String   | Yes       | Event name to listen to (events are documented below) |         |
| `fn`     | Function | Yes       | Function to call once the specified event is emitted  |         |

#### options
Compiled options object used by the ModClean instance.

### Events
The following events are emitted from the `ModClean` instance.

#### start
Emitted at the beginning of `clean()`.

| Argument | Type     | Description                        |
|----------|----------|------------------------------------|
| `inst`   | ModClean | Access to the instance of ModClean |

#### beforeFind
Emitted before `_find()` function starts.

| Argument   | Type          | Description                                        |
|------------|---------------|----------------------------------------------------|
| `patterns` | Array[String] | Compiled list of `glob` patterns that will be used |
| `globOpts` | Object        | The configuration object being passed into `glob`  |

#### files
Emitted once a list of all found files has been compiled from the `_find()` method.

| Argument | Type          | Description                             |
|----------|---------------|-----------------------------------------|
| `files`  | Array[String] | Array of file paths found to be removed |

#### process
Emitted at the start of the `_process()` function.

| Argument | Type          | Description                             |
|----------|---------------|-----------------------------------------|
| `files`  | Array[String] | Array of file paths found to be removed |

#### deleted
Emitted each time a file has been deleted from the file system by the `_deleteFile()` method.

| Argument | Type   | Description                                  |
|----------|--------|----------------------------------------------|
| `file`   | String | File path that has been successfully deleted |

#### finish
Emitted once processing and deletion of files has completed by the `_process()` method.

| Argument  | Type          | Description                                       |
|-----------|---------------|---------------------------------------------------|
| `results` | Array[String] | List of file paths that were successfully removed |

#### complete
Emitted once the entire ModClean process has completed before calling the main callback function.

| Argument  | Type          | Description                                       |
|-----------|---------------|---------------------------------------------------|
| `err`     | Error         | Error object if one occurred during the process   |
| `results` | Array[String] | List of file paths that were successfully removed |

#### fileError
Emitted if there was an error thrown while deleting a file/folder. Will emit even if `options.errorHalt = false`.

| Argument | Type   | Description                    |
|----------|--------|--------------------------------|
| `err`    | Error  | Error object                   |
| `file`   | String | The file that caused the error |

#### error
Emitted if there was an error thrown while searching for files.

| Argument | Type  | Description  |
|----------|-------|--------------|
| `err`    | Error | Error object |

#### beforeEmptyDirs
Emitted before finding/removing empty directories.

#### afterEmptyDirs
Emitted after finding/removing empty directories.

| Argument  | Type          | Description                      |
|-----------|---------------|----------------------------------|
| `results` | Array[String] | Array of paths that were removed |

#### emptyDirs
Emitted after a list of empty directories is found.

| Argument  | Type          | Description                    |
|-----------|---------------|--------------------------------|
| `results` | Array[String] | Array of paths that were found |

#### deletedEmptyDir
Emitted after an empty directory is deleted.

| Argument | Type   | Description                         |
|----------|--------|-------------------------------------|
| `dir`    | String | The directory path that was deleted |

#### emptyDirError
Emitted if an error occurred while deleting an empty directory.

| Argument | Type   | Description                             |
|----------|--------|-----------------------------------------|
| `dir`    | String | The directory path that caused an error |
| `err`    | Error  | Error object thrown                     |

---

## Custom Patterns Plugins
New in version 2.x, ModClean now supports pattern plugins to allow you to use various sets of patterns, along with custom ones. By default, ModClean comes with [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) preinstalled, but you can install or create your own plugins.

### Installing 3rd Party Plugins
If you would like to use a 3rd party plugin, it's pretty simple to install. If you are using the CLI, the plugin should be installed globally (ex. `npm install -g modclean-patterns-pluginname`), otherwise programmatically, install locally (ex. `npm install modclean-patterns-pluginname --save`).

### Available 3rd Party Plugins
*(None available yet!)*

### Create Your Own
Creating your own patterns plugin is simple. It's a basic Node Module that must be prefixed with `modclean-patterns-` that is published to NPM. The module just needs to export and object that contains the pattern definitions (see [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) for an example).

```js
module.exports = {
    $default: 'basic',
    
    basic: {
        patterns: [
            // ... glob patterns here
        ],
        ignore: [
            // ... glob patterns to ignore here
        ]
    }
        
    ],
    
    advanced: {
        patterns: [
            // ... glob patterns here
        ],
        ignore: [
            // ... glob patterns to ignore here
        ]
    }
};
```

Each key in the object is a rule name that is an object containing `patterns` and `ignore` arrays of glob patterns. The `patterns` section is glob patterns that will be found and removed and the `ignore` section is glob patterns to be ignored. Both keys are required, but can be empty arrays.

An optional configuration parameter `$default` can be provided which tells ModClean the default rule to use if the user does not specify. If this is not provided, ModClean will use the first rule key it encounters. **Note:** Rules starting with `$` will be ignored.

If you've created your own plugin, submit a pull request to add it to the list above!

---

## Issues
If you find any bugs with either ModClean or the CLI Utility, please feel free to open an issue. Any feature requests may also be poseted in the issues.

---

## Contributing
If you would like to contribute to this project, please ensure you follow the guidelines below:

### Code Style
I'm not very picky on the code style as long as it roughly follows what is currently written in the modules. Just ensure that lines that should end with semi-colons do end with them. Comments are also very helpful for future contributors to know what's going on.

---

## License
ModClean is licensed under the MIT license. Please see LICENSE in the repository for the full text.
