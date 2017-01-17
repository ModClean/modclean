/*!
 * modclean
 * Remove unwanted files and directories from your node_modules folder
 * @author Kyle Ross
 */
"use strict";
const glob     = require('glob');
const rimraf   = require('rimraf');
const path     = require('path');
const subdirs  = require('subdirs');
const emptyDir = require('empty-dir');
const each     = require('async-each-series');

const Utils        = require('./utils.js');
const EventEmitter = require('events').EventEmitter;

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
     * Function (async or sync) to call before each file is deleted to give ability to prevent deletion. (Optional, default `null`)
     * If called with 3 arguments (file, files, cb) it's async and `cb` must be called with a result (`false` skips file).
     * If called with 1 or 2 arguments (file, files) it's sync and `return false` will skip the file.
     * @type {Function|null}
     */
    process:    null,
    /**
     * The folder name used for storing modules. Used to append to `options.cwd` if running in parent directory (default `"node_modules"`)
     * @type {String}
     */
    modulesDir: 'node_modules',
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
        if(/Thumbs\.db$/i.test(file) || /\.DS_Store$/i.test(file)) return false;
        
        return true;
    },
    /**
     * Whether file deletion errors should halt the module from running and return the error to the callback (default `false`)
     * @type {Boolean}
     */
    errorHalt:  false,
    /**
     * Use test mode which will get the list of files and run the process without actually deleting the files (default `false`)
     * @type {Boolean}
     */
    test:       false
};

/**
 * @class ModClean
 * @extends {EventEmitter}
 */
class ModClean extends EventEmitter {
    /**
     * Initalizes ModClean class with provided options. If `cb` is provided, it will start `clean()`.
     * @param  {Object}   options Options to configure ModClean
     * @param  {Function} cb      Optional callback function, if provided, `clean()` is automatically called.
     */
    constructor(options, cb) {
        super();
        
        this.utils = new Utils(this);
        this.errors = [];
        
        if(typeof options === 'function') cb = options;
        this.options = Object.assign({}, modclean.defaults, options && typeof options === 'object' ? options : {});
        
        this._patterns = this.utils.initPatterns(this.options);
        
        if(this.options.modulesDir !== false && path.basename(this.options.cwd) !== this.options.modulesDir) 
            this.options.cwd = path.join(this.options.cwd, this.options.modulesDir);
    
        if(cb) this.clean(cb);
    }
    
    /**
     * Automated clean process that finds and deletes items based on the ModClean options.
     * @param  {Function} cb Callback to call once process is complete with `err` and `results`.
     * @return {ModClean}    Instance of ModClean
     */
    clean(cb) {
        let opts = this.options;
        
        this.emit('start', this);
        
        let done = (err, results) => {
            this.emit('complete', err, results);
            if(typeof cb === 'function') cb(err, results);
        };
        
        this._find((err, files) => {
            if(err) return done(err);
            
            this._process(files, (err, results) => {
                if(err || !opts.removeEmptyDirs) return done(err, results);
                
                this.cleanEmptyDirs((err, dirs) => {
                    return done(err, Array.isArray(dirs)? results.concat(dirs) : results);
                });
            });
        });
        
        return this;
    }
    
    /**
     * Finds files/folders based on the ModClean options.
     * @private
     * @param  {Function} cb Callback function to call once complete.
     */
    _find(cb) {
        let opts = this.options,
            globOpts = {
                cwd: opts.cwd,
                dot: opts.dotFiles,
                nocase: opts.ignoreCase,
                ignore: this._patterns.ignore,
                nodir: opts.noDirs
            };
        
        this.emit('beforeFind', this._patterns.allow, globOpts);
        
        glob(`**/@(${this._patterns.allow.join('|')})`, globOpts, (err, files) => {
            if(err) this.utils.error(err, '_find');
            else this.emit('files', files);
            cb(err, files);
        });
    }
    
    /**
     * Processes the found files and deletes the ones that pass `options.process`.
     * @private
     * @param  {Array}    files List of file paths to process.
     * @param  {Function} cb    Callback function to call once complete.
     */
    _process(files, cb) {
        let self = this,
            opts = this.options,
            processFn = typeof opts.process === 'function'? opts.process : function() { return true; },
            results = [];
        
        if(!files.length) return cb(null, []);
        
        this.emit('process', files);
        
        each(files, function(file, callback) {
            if(processFn.length <= 1) {
                // If processFn has 0 or 1 argument (file), then assume sync
                if(processFn(file) !== false) self._deleteFile(file, (err) => {
                    if(!err) results.push(file);
                    callback(err);
                });
                else callback();
            } else {
                // If processFn more than 1 argument (file, cb), then assume async
                processFn(file, function(result) {
                    if(result !== false) self._deleteFile(file, (err) => {
                        if(!err) results.push(file);
                        callback(err);
                    });
                    else callback();
                });
            }
        }, function(err) {
            /**
             * @event finish
             * @property {Array} results List of files successfully deleted
             */
            self.emit('finish', results);
            cb(err, results);
        });
    }
    
    /**
     * Deletes a single file/folder from the filesystem.
     * @private
     * @param  {String}   file File path to delete.
     * @param  {Function} cb   Callback function to call once complete.
     */
    _deleteFile(file, cb) {
        let self = this,
            opts = this.options;
        
        function done() {
            self.emit('deleted', file);
            return cb(null, file);
        }
        
        // If test mode is enabled, just return the file.
        if(opts.test) return done();
        
        rimraf(path.join(opts.cwd, file), (err) => {
            if(err) {
                this.utils.error(err, '_deleteFile', { file }, 'fileError');
                return opts.errorHalt? cb(err, file) : cb();
            }
            
            return done();
        });
    }
    
    /**
     * Finds and removes all empty directories.
     * @param  {Function} cb Callback to call once complete.
     */
    cleanEmptyDirs(cb) {
        let self = this,
            opts = this.options,
            results = [];
        // If test mode is enabled or removeEmptyDirs is disabled, just return.
        if(opts.test || !opts.removeEmptyDirs) return cb();
        
        this.emit('beforeEmptyDirs');
        
        function done(err, res) {
            self.emit('afterEmptyDirs', results);
            return cb(err, res);
        }
        
        this._findEmptyDirs((err, dirs) => {
            if(err) return done(err);
            
            this._removeEmptyDirs(dirs, (err, res) => {
                return done(err, res);
            });
        });
    }
    
    /**
     * Finds all empty directories within `options.cwd`.
     * @private
     * @param  {Function} cb Callback to call once complete.
     */
    _findEmptyDirs(cb) {
        let self = this,
            results = [];
        
        subdirs(this.options.cwd, function(err, dirs) {
            if(err) self.utils.error(err, '_findEmptyDirs');
            if(err || !Array.isArray(dirs)) return cb(err, []);
            
            each(dirs, (dir, dCb) => {
                emptyDir(dir, self.options.emptyDirFilter || function() { return true; }, (err, isEmpty) => {
                    if(err) self.utils.error(err, '_findEmptyDirs');
                    if(err || !isEmpty) return dCb();
                    results.push(dir);
                    dCb();
                });
            }, (err) => {
                self.emit('emptyDirs', results);
                cb(err, results);
            });
        });
    }
    
    /**
     * Removes all empty directories provided in `dirs`.
     * @private
     * @param  {Array}    dirs List of empty directories to remove.
     * @param  {Function} cb   Callback function to call once complete.
     */
    _removeEmptyDirs(dirs, cb) {
        let self = this,
            results = [];
        
        each(dirs, (dir, dCb) => {
            rimraf(dir, (err) => {
                if(err) self.utils.error(err, '_removeEmptyDirs', { dir }, 'emptyDirError');
                else {
                    results.push(dir);
                    self.emit('deletedEmptyDir', dir);
                }
                
                dCb();
            });
        }, (err) => {
            cb(err, results);
        });
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
}

/**
 * The default options for ModClean that can be overridden.
 * @property {Object} options Default options for ModClean.
 */
modclean.defaults = defaults;

// Export ModClean class
modclean.ModClean = ModClean;
