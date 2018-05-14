/*!
 * modclean
 * Remove unwanted files and directories from your node_modules folder
 * @author Kyle Ross
 */
"use strict";
const fs = require('fs');
const path = require('path');
const util = require('util');

const on = require('await-handler');
const subdirs = require('subdirs');
const glob = util.promisify(require('glob'));
const rm = util.promisify(require('rimraf'));
const emptyDir = util.promisify(require('empty-dir'));

const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);

const ModClean_Utils = require('./utils.js');

let defaults = {
    /**
     * The directory to search in, default is `process.cwd()`
     * @type {String}
     */
    cwd:        process.cwd(),
    /**
     * Array of patterns plugins to use. Default is `['default:safe']`.
     * @type {Array}
     */
    patterns:   ['default:safe'],
    /**
     * Array of additional patterns to use.
     * @type {Array}
     */
    additionalPatterns: [],
    /**
     * Ignore the provided glob patterns
     * @type {Array|null}
     */
    ignorePatterns: null,
    /**
     * Exclude directories from being removed
     * @type {Boolean}
     */
    noDirs:     false,
    /**
     * Ignore the case of the file names when searching by patterns (default `true`)
     * @type {Boolean}
     */
    ignoreCase: true,
    /**
     * Include dot files in the search (default `true`)
     * @type {Boolean}
     */
    dotFiles: true,
    /**
     * The folder name used for storing modules. Used to append to `options.cwd` if running in parent directory (default `"node_modules"`)
     * @type {String}
     */
    modulesDir: 'node_modules',
    /**
     * Filter function to run for each file/directory found. File object is passed in as a single argument. Return `true` to mark file for removal,
     * `false` to keep it. Optionally may return `Promise` for async support.
     * @type {?Function}
     */
    filter: null,
    /**
     * If the directory being deleted is a module, skip it's deletion.
     * @type {Boolean}
     */
    skipModules: true,
    /**
     * Remove empty directories as part of the cleanup process (default `true`)
     * @type {Boolean}
     */
    removeEmptyDirs: true,
    /**
     * Filter function used when checking if a directory is empty
     * @param  {String}  file File name to filter against
     * @return {Boolean}      `true` if is a valid file, `false` if invalid file
     */
    emptyDirFilter: function(file) {
        return !/(Thumbs\.db|\.DS_Store)$/i.test(file);
    },
    /**
     * Custom options to pass into `glob` to further customize file searching. Will override existing options.
     * @type {Object}
     */
    globOptions: {},
    /**
     * Whether file deletion errors should halt the module from running and return the error to the callback (default `false`)
     * @type {Boolean}
     */
    errorHalt:  false,
    /**
     * Use test mode which will get the list of files and run the process without actually deleting the files (default `false`)
     * @type {Boolean}
     */
    test:       false,
    /**
     * Force deletion to be done also in symlinked packages (when using npm link) (default `false`)
     * @type {Boolean}
     */
    followSymlink: false
};

/**
 * @class ModClean
 * @extends {ModClean_Utils}
 */
class ModClean extends ModClean_Utils {
    /**
     * Initalizes ModClean class with provided options. If `cb` is provided, it will start `clean()`.
     * @param  {Object}   options Options to configure ModClean
     * @param  {Function} cb      Optional callback function, if provided, `clean()` is automatically called.
     */
    constructor(options={}) {
        super();

        this.options = Object.assign({}, modclean.defaults, options || {});
        this._patterns = this.initPatterns();

        if(this.options.modulesDir !== false && path.basename(this.options.cwd) !== this.options.modulesDir)
            this.options.cwd = path.join(this.options.cwd, this.options.modulesDir);
    }

    /**
     * Automated clean process that finds and deletes items based on the ModClean options.
     * @param  {Function} cb Callback to call once process is complete with `err` and `results`.
     * @return {ModClean}    Instance of ModClean
     */
    async clean() {
        let files, dirs, results;
        this.emit('clean:start', this);
        
        try {
            files = await this._find();
            results = await this._process(files);
            dirs = await this.cleanEmptyDirs();
            
            if(dirs) {
                results.deleted = results.deleted.concat(dirs.deleted);
                results.empty = dirs.empty;
            }
        } catch(err) {
            throw err;
        }
        
        this.emit('clean:complete', results);
        
        return results;
    }

    /**
     * Finds files/folders based on the ModClean options.
     * @private
     * @param  {Function} cb Callback function to call once complete.
     */
    async _find() {
        let defaultGlobOpts = {
            cwd: this.options.cwd,
            dot: this.options.dotFiles,
            nocase: this.options.ignoreCase,
            ignore: this._patterns.ignore,
            nodir: this.options.noDirs,
            follow: this.options.followSymlink
        };
        
        let globOpts = Object.assign({}, defaultGlobOpts, this.options.globOptions);
        
        this.emit('file:find', this._patterns.allow, globOpts);

        let [err, results] = await on(glob(`**/@(${this._patterns.allow.join('|')})`, globOpts));
        if(err) throw this.error(err, '_find');
        
        let [e, files] = await on(
            Promise.all(results.map(async file => {
                let obj = {
                    path: file,
                    fullPath: path.join(this.options.cwd, file),
                    dir: path.join(this.options.cwd, path.parse(file).dir),
                    name: path.basename(file),
                    isModule: false
                };
                
                try {
                    let stats = await stat(obj.fullPath);
                    if(stats.isDirectory()) {
                        let list = await readdir(obj.fullPath);
                        if(list.indexOf('package.json')) obj.isModule = true;
                    }
                    
                    obj.stat = stats;
                } catch(error) {
                    this.error(error, '_find');
                    return null;
                }
                
                return obj;
            }))
        );
        
        if(e) throw e;
        
        files = files.filter(obj => !!obj);
        
        this.emit('file:list', files);
        return files;
    }

    /**
     * Processes the found files and deletes the ones that pass `options.process`.
     * @private
     * @param  {Array}    files List of file paths to process.
     * @param  {Function} cb    Callback function to call once complete.
     */
    async _process(files) {
        let results = {
            files,
            deleted: []
        };

        if(!files.length) return results;
        
        this.emit('process:start', files);
        
        let [err] = await on(
            Promise.all(files.map(async file => {
                let [e, res] = await on(this._deleteFile(file));
                if(e) throw e;
                
                if(res) results.deleted.push(file.fullPath);
                return res;
            }))
        );
        
        if(err) throw err;
        
        this.emit('process:done', results.deleted);
        
        return results;
    }

    /**
     * Deletes a single file/folder from the filesystem.
     * @private
     * @param  {String}   file File path to delete.
     * @param  {Function} cb   Callback function to call once complete.
     */
    async _deleteFile(file) {
        let shouldDelete = true;
        
        if(typeof this.options.filter === 'function') {
            let res = this.options.filter(file);
            if(res instanceof Promise) shouldDelete = await res;
            else shouldDelete = !!res;
        }
        
        if(this.options.skipModules && file.isModule) shouldDelete = false;
        
        if(!shouldDelete) {
            this.emit('file:skipped', file);
            return false;
        }
        
        if(this.options.test) {
            this.emit('file:deleted', file);
            return true;
        }
        
        let [err] = await on(rm(file.fullPath));
        if(err && err.code !== 'ENOENT') {
            err = this.error(err, '_deleteFile', { file });
            if(this.options.errorHalt) throw err;
        } else {
            this.emit('file:deleted', file);
        }
        
        return !err;
    }

    /**
     * Finds and removes all empty directories.
     * @param  {Function} cb Callback to call once complete.
     */
    async cleanEmptyDirs() {
        if(!this.options.removeEmptyDirs) return false;
        
        this.emit('emptydir:start');
        
        
        let [error, dirs] = await on(this._findEmptyDirs());
        if(error) throw error;
        
        let results = await this._removeEmptyDirs(dirs);
        
        this.emit('emptydir:done', results);
        
        return {
            empty: dirs,
            deleted: results
        };
    }

    /**
     * Finds all empty directories within `options.cwd`.
     * @private
     * @param  {Function} cb Callback to call once complete.
     */
    async _findEmptyDirs() {
        let results = [];
        
        let [err, dirs] = await on(subdirs(this.options.cwd));
        if(err) throw this.error(err, '_findEmptyDirs');
        if(!Array.isArray(dirs)) return [];
        
        for(let dir of dirs) {
            let [e, isEmpty] = await on(emptyDir(dir, this.options.emptyDirFilter));
            if(e) this.error(err, '_findEmptyDirs', { dir });
            else if(isEmpty) results.push(dir);
        }
        
        this.emit('emptydir:list', results);
        return results;
    }

    /**
     * Removes all empty directories provided in `dirs`.
     * @private
     * @param  {Array}    dirs List of empty directories to remove.
     * @param  {Function} cb   Callback function to call once complete.
     */
    async _removeEmptyDirs(dirs) {
        let results = [];
        
        // Return all empty directories if in test mode
        if(this.options.test) return dirs;
        
        for(let dir in dirs) {
            let [err] = await on(rm(dir));
            if(err) this.error(err, '_removeEmptyDirs', { dir });
            else {
                results.push(dir);
                this.emit('emptydir:deleted', dir);
            }
        }
        
        return results;
    }
}

// export modclean
module.exports = modclean;

/**
 * Shortcut for calling `new ModClean(options, cb).clean()`
 * @param  {Object}   options Options to set for ModClean (Optional)
 * @param  {Function} cb      Callback function to call once completed or if error
 * @return {Object}           New ModClean instance
 */
function modclean(options, cb) {
    return new ModClean(options, cb);
function modclean(options) {
    return new ModClean(options);
}

/**
 * The default options for ModClean that can be overridden.
 * @property {Object} options Default options for ModClean.
 */
modclean.defaults = defaults;

// Export ModClean class
modclean.ModClean = ModClean;
