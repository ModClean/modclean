/**
 * modclean
 * Remove unwanted files and directories from your node_modules folder
 * @version 1.0.0 (4/20/2015)
 * @author Kyle Ross
 */

var glob         = require('glob'),
    rimraf       = require('rimraf'),
    util         = require("util"),
    EventEmitter = require("events").EventEmitter,
    path         = require('path'),
    patterns     = require('./patterns.json');
    
var defaults     = {
    /**
     * The directory to search in, default is `process.cwd()`
     * @type {String}
     */
    cwd:        process.cwd(),
    /**
     * Patterns to search for, default is an array loaded from `patterns.json`
     * @type {Array}
     */
    patterns:   patterns.safe,
    /**
     * Ignore the case of the file names when searching by patterns (default `true`)
     * @type {Boolean}
     */
    ignoreCase: true,
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

// export modclean
module.exports = modclean;

/**
 * Shortcut for calling `new ModClean(options, cb).clean()`
 * @param  {Object}   options Options to set for ModClean (Optional)
 * @param  {Function} cb      Callback function to call once completed or if error
 * @return {Object}           New ModClean instance
 */
function modclean(options, cb) {
    return new ModClean(options, cb).clean();
}

/**
 * The default options for ModClean that can be overridden.
 * @property {Object} options Default options for ModClean.
 */
modclean.defaults = defaults;

/**
 * The full list of patterns from patterns.json
 * @property {Object} patterns `safe`, `caution` and `danger` patterns from patterns.json
 */
modclean.patterns = patterns;

// Export ModClean class
modclean.ModClean = ModClean;

/**
 * Main ModClean class
 * @class ModClean
 * @param {Object}   options ModClean options (optional)
 * @param {Function} cb  Callback function to call if once completed or if error - `function(error, files)`
 */
function ModClean(options, cb) {
    if(!(this instanceof ModClean)) return new ModClean(options);
    EventEmitter.call(this);
    
    if(typeof options === 'function') cb = options;
    if(!options || typeof options !== 'object') options = {};
    
    this.options = options = extend(Object.create(modclean.defaults), options || {});
    if(typeof this.options.patterns === 'string') this.options.patterns = [this.options.patterns];
    
    if(Array.isArray(this.options.patterns)) {
        var _patterns = [];
        for(var i = 0; i < this.options.patterns.length; i++) {
            if(Array.isArray(this.options.patterns[i])) {
                _patterns = _patterns.concat(this.options.patterns[i]);
            } else {
                _patterns.push(this.options.patterns[i]);
            }
        }
        
        this.options.patterns = _patterns;
    }
    
    if(this.options.modulesDir !== false && path.basename(this.options.cwd) !== this.options.modulesDir) 
        this.options.cwd = path.join(this.options.cwd, this.options.modulesDir);
    
    if(cb) this.clean(cb);
}

// Inherit EventEmitter.prototype
util.inherits(ModClean, EventEmitter);

/**
 * Start the clean process
 * @public
 * @param {Function} cb  Callback function to call if once completed or if error - `function(error, files)`
 */
ModClean.prototype.clean = function(cb) {
    var self = this;
    
    this.finalCallback = function(err, results) {
        /**
         * @event complete
         * @property {Mixed} err     An error string/object if error was thrown
         * @property {Array} results List of files successfully deleted
         */
        this.emit('complete', err, results);
        if(typeof cb === 'function') cb(err, results);
    };
    
    /**
     * @event start
     * @property {Object} this ModClean instance
     */
    self.emit('start', this);
    
    self._find(null, function(err, files) {
        if(err) return self.finalCallback(err);
        
        self._process(files, function(err, results) {
            self.finalCallback(err, results);
        });
    });
};

/**
 * Find patterns using glob and return file list
 * @protected
 * @param  {Array}    patterns Array of patterns to find (defaults to `options.patterns`)
 * @param  {Function} cb       Callback to call with `error` and `files` when complete
 */
ModClean.prototype._find = function(patterns, cb) {
    var self = this,
        opts = self.options,
        globOpts = {
            cwd: opts.cwd,
            dot: true,
            nocase: opts.ignoreCase
        };
    
    glob('**/@('+ (patterns || opts.patterns).join('|') +')', globOpts, function(err, files) {
        if(err) self.emit('error', err);
        /**
         * @event files
         * @property {Array} files List of files found based on `options.patterns` in `options.cwd`
         */
        else self.emit('files', files);
        cb(err, files);
    });
};

/**
 * Processes a list of files
 * @private
 * @param  {Array}    files List of files to process
 * @param  {Function} cb    Callback function to call once completed or if error
 */
ModClean.prototype._process = function(files, cb) {
    var self = this,
        opts = this.options,
        processFn = typeof opts.process === 'function'? opts.process : function() { return true; };
    
    if(!files.length) return cb(null, []);
    
    eachSeries(files, function(file, callback) {
        if(processFn.length === 3) {
            // If processFn has 3 arguments (file, files, cb), then assume async
            processFn(file, files, function(result) {
                if(result !== false) self._deleteFile(file, callback);
                else callback();
            });
        } else {
            // If processFn has any other number of arguments (default: file, files), then assume sync
            if(processFn(file, files) !== false) self._deleteFile(file, callback);
            else callback();
        }
    }, function(err, results, errFile) {
        /**
         * @event finish
         * @property {Array} results List of files successfully deleted
         */
        self.emit('finish', results);
        cb(err, results);
    });
};

/**
 * Deletes file/folder at given path
 * @param  {String}   file The file/folder path to delete
 * @param  {Function} cb   Callback function to call when complete or error
 */
ModClean.prototype._deleteFile = function(file, cb) {
    var self = this,
        opts = self.options;
    // If test mode is enabled, just return the file.
    if(opts.test) {
        self.emit('deleted', file);
        return cb(null, file);
    }
    
    rimraf(path.join(opts.cwd, file), function(err) {
        if(err) {
            /**
             * @event fileError
             * @property {Mixed}  err  The error object/string
             * @property {String} file The file that caused the error
             */
            self.emit('fileError', err, file);
            return opts.errorHalt? cb(err, file) : cb();
        }
        
        /**
         * @event deleted
         * @property {String} file The deleted file name
         */
        self.emit('deleted', file);
        cb(null, file);
    });
};


/**
 * Extends object with properties from another object
 * @private
 * @param  {Object} obj The destination object
 * @param  {Object} ... The object in which to copy the properties from
 * @return {Object}     Destination object with properties copied
 */
function extend(obj) {
    var arr = [];
    
    arr.forEach.call(arr.slice.call(arguments, 1), function(source) {
        if(source) {
            for(var prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
}

/**
 * Iterate through array asynchronously one item at a given time.
 * Modified from `node-async` - https://github.com/caolan/async/blob/master/lib/async.js
 * @private
 * @param  {Array}    arr      The array to iterate through
 * @param  {Function} iterator The function to run for each iteration
 * @param  {Function} callback Final callback function to call once all iterations have completed or if error
 */
function eachSeries(arr, iterator, callback) {
    var results = [];
    callback = callback || function() {};
    if(!arr.length) return callback();
    var completed = 0;
    var iterate = function() {
        iterator(arr[completed], function(err, result) {
            if(err) {
                callback(err, results, result);
                callback = function() {};
            } else {
                if(result) results.push(result);
                completed += 1;
                if (completed >= arr.length) callback(null, results);
                else iterate();
            }
        });
    };
    iterate();
}
