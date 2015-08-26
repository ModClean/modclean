#!/usr/bin/env node
require('colors');

var program  = require('commander'),
    inquirer = require('inquirer'),
    pkg      = require('../package.json'),
    notifier = require('update-notifier')({ pkg: pkg }),
    path     = require('path'),
    os       = require('os'),
    modclean = require('../index.js'),
    ModClean = modclean.ModClean,
    pkg      = require('../package.json');

if(notifier.update) notifier.notify();

program
    .version(pkg.version)
    .description('Remove unwanted files and directories from your node_modules folder')
    .usage('modclean [options]')
    .option('-t, --test', 'Run modclean and return results without deleting files')
    .option('-p, --path <path>', 'Path to run modclean on (defaults to current directory)')
    .option('-s, --case-sensitive', 'Matches are case sensitive')
    .option('-i, --interactive', 'Each deleted file/folder requires confirmation')
    .option('-P, --no-progress', 'Hide progress bar')
    .option('-e, --error-halt', 'Halt script on error')
    .option('-v, --verbose', 'Run in verbose mode')
    .option('-r, --run', 'Run immediately without warning')
    .option('-n, --patterns [patterns]', 'Patterns type(s) to remove (safe, caution, or danger)')
    .option('-d, --empty', 'Remove empty directories')
    .parse(process.argv);

var ui = new inquirer.ui.BottomBar();

newLine();
ui.log.write('MODCLEAN'.yellow.bold + (' v' + pkg.version).grey);

if(program.test) {
    newLine();
    ui.log.write('RUNNING IN TEST MODE'.red.bold);
    ui.log.write('When running in test mode, files will not be deleted from the file system.'. grey);
}

if(!program.run && !program.test) {
    ui.log.write('\n' + ('  WARNING:'.red.bold));
    ui.log.write([
        '    This module deletes files from the filesystem that cannot be retreived. Although what',
        '    is being deleted are not required by the modules and/or your application, there is no',
        '    guarantee that the modules will work after this script runs. The patterns.json file',
        '    included with this module shows a listing of files and folders that will be searched',
        '    for and removed from the file system. If you have any concerns with deleting files,',
        '    you should run this utility using the "--test" flag first or with the "-i" flag to',
        '    make the deletion process interactive. The author or contributors shall not be held',
        '    responsible for and damages this module may cause. Please see the README.\n\n'
    ].join(' \n'));
    
    confirm('Are you sure you want to continue?', function(result) {
        if(!result) return process.exit(0);
        new ModCleanCLI(program);
    });
} else {
    newLine();
    process.nextTick(function() {
        new ModCleanCLI(program);
    });
}

function ModCleanCLI(opts) {
    if(!(this instanceof ModCleanCLI)) return new ModCleanCLI(opts);
    
    var self = this,
        _patterns = [];
    
    this.current = 0;
    this.skipped = [];
    this.total = 0;
    this.argv = opts;
    this.os = os.platform();
    
    if(opts.patterns) {
        var patts = opts.patterns.split(',');
        
        for(var i = 0; i < patts.length; i++) {
            if(modclean.patterns.hasOwnProperty(patts[i].toLowerCase())) 
                _patterns.push(modclean.patterns[patts[i].toLowerCase()]);
        }
    }
    
    this.options = {
        cwd: opts.path || process.cwd(),
        patterns: _patterns.length? _patterns : modclean.patterns.safe,
        errorHalt: !!opts.errorHalt,
        removeEmptyDirs: !!opts.empty,
        test: !!opts.test,
        process: function(file, files, cb) {
            self.current += 1;
            if(!opts.interactive) return cb(true);
            
            var fn = path.relative(self.options.cwd, file);
            if(self.os === 'win32') fn = fn.replace(/\\+/g, '/');
            
            confirm(('(%/%) '.fmt(self.current, files.length)).grey + fn + ' - ' + 'Delete file?'.yellow.bold, function(res) {
                if(!res) self.skipped.push(file);
                cb(res);
            });
        }
    };
    
    if(program.caseSensitive) this.options.ignoreCase = false;
    
    this.inst = new ModClean(this.options);
    this.initEvents();
    this.inst.clean(this.done.bind(this));
}

ModCleanCLI.prototype = {
    done: function(err, results) {
        var pb = ui.bottomBar;
        // DISPLAY RESULTS
        newLine();
        ui.updateBottomBar('');
        console.log(pb);
        newLine();
        ui.log.write('FILES/FOLDERS DELETED'.green.bold);
        ui.log.write('    Total:   '.yellow.bold + results.length);
        ui.log.write('    Skipped: '.yellow.bold + this.skipped.length);
        newLine();
        
        log('verbose', '\n' + results.join('\n'));
        
        if(err) {
            newLine();
            log('error', err);
            return process.exit(1);
        }
        
        setTimeout(function() {
            process.exit(0);
        }, 500);
    },
    
    initEvents: function() {
        var self = this,
            inst = self.inst;
        
        this.progressBar = new Progress(40);
        
        // Start Event (searching for files)
        inst.on('start', function() {
            log('event', 'start');
            log('verbose', '\n' + JSON.stringify(inst.options, null, 4));
            self.spin('Searching for files in '+ self.options.cwd);
        });
        
        // Files Event (file list after searching complete)
        inst.on('files', function(files) {
            log('event', 'files');
            self.spinStop();
            
            self.total = files.length;
            log(null, 'Found', (files.length.toString()).green.bold, 'files/folders to remove');
            newLine();
        });
        
        // Deleted Event (called for each file deleted)
        inst.on('deleted', function(file) {
            log('event', 'deleted');
            
            if(!self.argv.interactive && self.argv.progress) ui.updateBottomBar(self.getProgress());
            
            log('verbose', 'DELETED'.yellow.bold, '(%/%) %'.fmt(self.current, self.total, file.grey));
        });
        
        // Error Event (called as soon as an error is encountered)
        inst.on('error', function(err) {
            log('event', 'error');
            if(self.argv.verbose) log('error', err);
        });
        
        // FileError Event (called when there was an error deleting a file)
        inst.on('fileError', function(err, file) {
            log('event', 'fileError');
            if(self.argv.verbose) log('error', 'FILE ERROR:'.red, err, file.grey);
        });
        
        // Finish Event (once processing/deleting all files is complete)
        inst.on('finish', function(results) {
            log('event', 'finish');
            log('verbose', 'FINISH'.green, 'Deleted '+ (results.length.toString()).yellow.bold, 'files/folders of '+ (self.total.toString()).yellow.bold);
        });
        
        // Complete Event (once everything has completed)
        inst.on('complete', function() {
            log('event', 'complete');
        });
    },
    
    getProgress: function() {
        if(!this.argv.progress) return '';
        return 'Cleanup Progress '.grey + this.progressBar.update(this.current, this.total) + ' (%/%)'.fmt(this.current, this.total);
    },
    
    spin: function(str) {
        str = str.grey;
        
        var loader = [
            '/ '.cyan.bold + str,
            '| '.cyan.bold + str,
            '\\ '.cyan.bold + str,
            '- '.cyan.bold + str
        ];
        
        var i = 4;
        this._spin = setInterval(function() {
            ui.updateBottomBar(loader[i++ % 4]);
        }, 300);
    },
    
    spinStop: function() {
        clearInterval(this._spin);
        ui.clean();
    }
};


function log(type) {
    var prefix;
    
    switch(type) {
        case 'event': 
            prefix = 'EVENT'.magenta.bold; break;
            
        case 'error': 
            prefix = 'ERROR'.red.bold; break;
            
        case 'verbose': 
            prefix = 'VERBOSE'.green.bold; break;
            
        default: prefix = '';
    }
    
    if((type === 'verbose' || type === 'event') && !program.verbose) return;
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(prefix + '>'.grey);
    
    ui.log.write(args.join(' '));
}

function newLine() {
    ui.log.write('\n');
}

function confirm(str, fn) {
    ui.updateBottomBar(str + (' [y|N] ').grey);
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function(val) {
        fn(/^y|yes|ok|true$/i.test(val.trim()));
    }).resume();
}

// Modified from clui (https://github.com/nathanpeck/clui)
function Progress(width) {
    var currentValue = 0,
        maxValue = 0;

    this.update = function (currentValue, maxValue) {
        if(maxValue === 0) return '[]';
      
        var barLength = Math.ceil(currentValue / maxValue * width);
        if(barLength > width) barLength = width;

        return '[' +
            (Array(barLength).join("|")).green +
            Array(width + 1 - barLength).join("-") +
        '] '+ (Math.ceil(currentValue / maxValue * 100) + '%').grey;
    };
}

// String Interpolation since I don't care for the built in console one
// Adding this since messing with the String prototype isn't a big deal in CLI apps
String.prototype.fmt = function stringProtoFmtFn() {
    var args = (arguments.length === 1 && Array.isArray(arguments[0])) ? arguments[0] : arguments,
        index = 0;
    return this.replace(/(%)/g, function stringProtoFmtReplaceCB(m) {
        var val = args[index];
        
        if(Array.isArray(val)) val = val.join(', ');
        if(typeof val === 'object') val = JSON.stringify(val);
        if(typeof val === 'function') val = val.toString();
        
        index++;
        return val || m;
    });
};
