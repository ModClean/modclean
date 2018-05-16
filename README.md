# ModClean
*Remove unwanted files and directories from your node_modules folder*

[![npm version](https://img.shields.io/npm/v/modclean.svg)](https://www.npmjs.com/package/modclean) ![NPM Dependencies](https://david-dm.org/ModClean/modclean.svg) [![NPM Downloads](https://img.shields.io/npm/dm/modclean.svg)](https://www.npmjs.com/package/modclean) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ModClean/modclean/master/LICENSE) [![GitHub issues](https://img.shields.io/github/issues/ModClean/modclean.svg)](https://github.com/ModClean/modclean/issues) [![Package Quality](http://npm.packagequality.com/shield/modclean.svg)](http://packagequality.com/#?package=modclean)

### This documentation is for ModClean 3.x which requires Node v6.9+, if you need to support older versions, use:
**Node v6.9+:** [ModClean 2.x](https://github.com/ModClean/modclean/tree/2.x)  
**Older:** [ModClean 1.x](https://github.com/ModClean/modclean/tree/1.x)


ModClean is a utility that finds and removes unnecessary files and folders from your `node_modules` directory based on [predefined](https://github.com/ModClean/modclean-patterns-default) and [custom](https://github.com/ModClean/modclean/wiki/Custom-Pattern-Plugins) [glob](https://github.com/isaacs/node-glob) patterns. This utility comes with both a CLI and a programmatic API to provide customization for your environment. ModClean is used and tested in an Enterprise environment on a daily basis.

## What's New in ModClean 3?
This has been a complete overhaul of ModClean and the CLI to provide more performance and new features. With any major change, there have been a lot of breaking changes as well (see the [Migration Guide]() for more info). Here are some of the new notable features:

1. **Moved away from callbacks to Promises.** With Promise support, ModClean utilizes async/await in order to have cleaner and more performant code.
2. **New options for more customization.** Now you can customize ModClean more including options passed into `glob`.
3. **NPM Module detection support.** ModClean now has the ability to detect if a matched directory is a NPM module and prevent deleting it. This allows stricter patterns without the worry of potentially deleting a module.
4. **New event names.** Events are now properly named and namespaced for easier use and understanding.
5. **Dependency reduction.** Reduced the dependencies and brought in newer and more usable dependencies that brought ModClean from over 9MBs to 1.2MB.

## Why?
There are a few different reasons why you would want to use ModClean:

* **Commiting Modules.** Some environments (especially Enterprise), it's required to commit the `node_modules` directory with your application into version control. This is due to compatibility, vetting and vunerability scanning rules for open source software. This can lead to issues with project size, checking out/pulling changes and the infamous 255 character path limit if you're unlucky enough to be on Windows or SVN.
* **Wasted space on your server.** Why waste space on your server with files not needed by you or the modules?
* **Packaged applications.** If you're required to package your application, you can reduce the size of the package quickly by removing unneeded files.
* **Compiled applications.** Other tools like, [NW.js](https://nwjs.io/) and [Electron](http://electron.atom.io/) make it easy to create cross-platform desktop apps, but depending on the modules, your app can become huge. Reduce down the size of the compiled application before shipping and make it faster for users to download.
* **Save space on your machine.** Depending on the amount of global modules you have installed, you can reduce their space by removing those gremlin files.
* **and much more!**

The :cake: is a lie, but the [Benchmarks](https://github.com/ModClean/modclean/wiki/Benchmarks) are not.

## How?
**Note:** In ModClean 2+, patterns are now provided by plugins instead of a static `patterns.json` file as part of the module. By default, ModClean comes with [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) installed, providing the same patterns as before. You now have the ability to create your own patterns plugins and use multiple plugins to clean your modules. This allows flexibility with both the programmatic API and CLI.

ModClean scans the `node_modules` directory of your choosing, finding all files and folders that match the defined patterns and deleting them. Both the CLI and the programmatic API provides all the options needed to customize this process to your requirements. Depending on the number of modules your app requires, files can be reduced anywhere from hundreds to thousands and disk space can be reduced considerably.

_(File and disk space reduction can also be different between the version of NPM and Operating System)_

**IMPORTANT**
This module has been heavily tested in an enterprise environment used for large enterprise applications. The provided patterns in [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) have worked very well when cleaning up useless files in many popular modules. There are hundreds of thousands of modules in NPM and I cannot simply cover them all. If you are using ModClean for the first time on your application, you should create a copy of the application so you can ensure it still runs properly after running ModClean. The patterns are set in a way to ensure no crutial module files are removed, although there could be one-off cases where a module could be affected and that's why I am stressing that testing and backups are important. If you find any files that should be removed, please create a pull request to [modclean-patterns-default](https://github.com/ModClean/modclean-patterns-default) or create your own patterns plugin to share with the community.

In ModClean 3+, module detection has been added. This will help prevent modules that have names matched by the patterns from being removed.

## Removal Benchmark
So how well does this module work? If we `npm install sails` and run ModClean on it, here are the results:

_All tests ran on macOS 10.12.3 with Node v6.9.1 and NPM v4.0.5_

#### Using Default Safe Patterns
`modclean -n default:safe` or `modclean`

|                 | Total Files | Total Folders | Total Size   |
| --------------- | ----------- | ------------- | ------------ |
| Before ModClean | 16,179      | 1,941         | 71.24 MB     |
| After ModClean  | 12,192      | 1,503         | 59.35 MB     |
| Reduced         | **3,987**   | **438**       | **11.88 MB** |

#### Using Safe and Caution Patterns
`modclean -n default:safe,default:caution`

|                 | Total Files | Total Folders | Total Size   |
| --------------- | ----------- | ------------- | ------------ |
| Before ModClean | 16,179      | 1,941         | 71.24 MB     |
| After ModClean  | 11,941      | 1,473         | 55.28 MB     |
| Reduced         | **4,238**   | **468**       | **15.95 MB** |

#### Using Safe, Caution and Danger Patterns
`modclean --patterns="default:*"`

|                 | Total Files | Total Folders | Total Size   |
| --------------- | ----------- | ------------- | ------------ |
| Before ModClean | 16,179      | 1,941         | 71.24 MB     |
| After ModClean  | 11,684      | 1,444         | 51.76 MB     |
| Reduced         | **4,495**   | **497**       | **19.47 MB** |

That makes a huge difference in the amount of files and disk space.

View additional benchmarks on the Wiki: [Benchmarks](https://github.com/ModClean/modclean/wiki/Benchmarks). If you would like to run some of your own benchmarks, you can use [modclean-benchmark](https://github.com/ModClean/modclean-benchmark).

## Install

Install locally

```bash
npm install modclean --save
```

Install globally (CLI)

```bash
npm install modclean -g
```


---

### [Read the CLI Documentation](https://github.com/ModClean/modclean/wiki/CLI)

### [Read the API Documentation](https://github.com/ModClean/modclean/wiki/API)

### [Read the Custom Patterns Plugin Documentation](https://github.com/ModClean/modclean/wiki/Custom-Pattern-Plugins)

---

## Issues
If you find any bugs with either ModClean or the CLI Utility, please feel free to open an issue. Any feature requests may also be poseted in the issues.

## License
ModClean is licensed under the MIT license. Please see LICENSE in the repository for the full text.
