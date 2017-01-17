#!/usr/bin/env node
"use strict";

const chalk    = require('chalk');
const program  = require('commander');
const notifier = require('update-notifier');
const clui     = require('clui');
const path     = require('path');
const os       = require('os');
const pkg      = require('../package.json');

const utils    = require('./utils');
const modclean = require('../lib/modclean');
const ModClean = modclean.ModClean;

notifier({ pkg }).notify();

function list(val) {
    return val.split(',');
}

process.on('SIGINT', function() {
    process.stdin.destroy();
    process.exit();
});

program
    .version(pkg.version)
    .description('Remove unwanted files and directories from your node_modules folder')
    .usage('modclean [options]')
    .option('-t, --test', 'Run modclean and return results without deleting files')
    .option('-p, --path <path>', 'Path to run modclean on (defaults to current directory)')
    .option('-D, --modules-dir <name>', 'Modules directory name (defaults to "node_modules")')
    .option('-s, --case-sensitive', 'Matches are case sensitive')
    .option('-i, --interactive', 'Each deleted file/folder requires confirmation')
    .option('-P, --no-progress', 'Hide progress bar')
    .option('-e, --error-halt', 'Halt script on error')
    .option('-v, --verbose', 'Run in verbose mode')
    .option('-r, --run', 'Run immediately without warning')
    .option('-n, --patterns <list>', 'Patterns plugins/rules to use (defaults to "default:safe")', list)
    .option('-a, --additional-patterns <list>', 'Additional glob patterns to search for', list)
    .option('-I, --ignore <list>', 'Comma separated list of patterns to ignore', list)
    .option('--no-dirs', 'Exclude directories from being removed')
    .option('--no-dotfiles', 'Exclude dot files from being removed')
    .option('-k, --keep-empty', 'Keep empty directories')
    .parse(process.argv);

class ModClean_CLI {
    constructor() {
        this.log = utils.initLog(program.verbose);
        
        // Display CLI header
        console.log(
            "\n" +
            chalk.yellow.bold('MODCLEAN ') +
            chalk.gray(' Version ' + pkg.version) + "\n"
        );
        
        // Display "running in test mode" message
        if(program.test) {
            console.log(
                chalk.cyan.bold('RUNNING IN TEST MODE') + "\n" +
                chalk.gray('When running in test mode, files will not be deleted from the file system.') + "\n"
            );
        }
        
        // Display warning message and confirmation prompt
        if(!program.run && !program.test) {
            console.log(
                chalk.red.bold('WARNING:') + "\n" +
                chalk.gray(utils.warningMsg) + "\n"
            );
            
            return utils.confirm('Are you sure you want to continue?', (res) => {
                if(!res) return process.exit(0);
                this.start();
            });
        }
        
        this.start();
    }
    
    start() {
        let self = this,
            platform = os.platform();
        
        this.stats = {
            current: 0,
            total: 0,
            skipped: [],
            currentEmpty: 0,
            totalEmpty: 0
        };
        
        // Disable progress bar in interactive mode
        if(program.interactive) program.progress = false;
        
        let options = {
            cwd: program.path || process.cwd(),
            modulesDir: program.modulesDir || 'node_modules',
            patterns: program.patterns && program.patterns.length? program.patterns : ['default:safe'],
            additionalPatterns: program.additionalPatterns || [],
            ignorePatterns: program.ignore || [],
            noDirs: !program.dirs,
            dotFiles: !!program.dotfiles,
            errorHalt: !!program.errorHalt,
            removeEmptyDirs: !program.keepEmpty,
            ignoreCase: !program.caseSensitive,
            test: !!program.test,
            process: function(file, cb) {
                self.stats.current += 1;
                if(!program.interactive) return cb(true);
                
                let name = path.relative(options.cwd, file);
                if(platform === 'win32') name = name.replace(/\\+/g, '/');
                
                utils.confirm(
                    chalk.gray(`(${self.stats.current}/${self.stats.total})`) + 
                    `${name} ${chalk.gray(' - ')} ${chalk.yellow.bold('Delete File?')}`,
                function(res) {
                    if(!res) self.stats.skipped.push(file);
                    cb(res);
                });
            }
        };
        
        this.modclean = new ModClean(options);
        
        this.initEvents();
        this.modclean.clean(this.done.bind(this));
    }
    
    initEvents() {
        var inst = this.modclean;
        
        let progressBar = new clui.Progress(40),
            spinner = new clui.Spinner('Loading...'),
            showProgress = true;
        
        if(!process.stdout.isTTY || program.interactive || !program.progress || program.verbose) showProgress = false;
        
        function updateProgress(current, total) {
            if(showProgress) {
                process.stdout.cursorTo(0);
                process.stdout.write(progressBar.update(current, total));
                process.stdout.clearLine(1);
            }
        }
        
        function showSpinner(msg) {
            if(!process.stdout.isTTY || program.verbose || !program.progress) {
                console.log(msg);
            } else {
                spinner.message(msg);
                spinner.start();
            }
        }
        
        // Start Event (searching for files)
        inst.on('start', () => {
            this.log('event', 'start');
            this.log('verbose', '\n' + JSON.stringify(inst.options, null, 4));
            
            showSpinner(`Searching for files in ${inst.options.cwd}...`);
        });
        
        // Files Event (file list after searching complete)
        inst.on('files', (files) => {
            this.log('event', 'files');
            if(process.stdout.isTTY) spinner.stop();
            
            this.stats.total = files.length;
            
            console.log(`Found ${chalk.green.bold(files.length)} files/folders to remove\n`);
        });
        
        inst.on('process', (files) => {
            this.log('event', 'process');
            
            if(!showProgress && !program.interactive && !program.verbose)
                console.log('Deleting files, please wait...');
            
            updateProgress(0, files.length);
        });
        
        // Deleted Event (called for each file deleted)
        inst.on('deleted', (file) => {
            updateProgress(this.stats.current, this.stats.total);
            
            this.log(
                'verbose',
                `${chalk.yellow.bold('DELETED')} (${this.stats.current}/${this.stats.total}) ${chalk.gray(file)}`
            );
        });
        
        inst.on('beforeEmptyDirs', () => {
            this.log('event', 'beforeEmptyDirs');
            
            showSpinner(`Searching for empty directories in ${inst.options.cwd}...`);
        });
        
        inst.on('emptyDirs', (dirs) => {
            this.log('event', 'emptyDirs');
            
            if(process.stdout.isTTY) spinner.stop();
            
            this.stats.totalEmpty = dirs.length;
            console.log(`\nFound ${chalk.green.bold(dirs.length)} empty directories to remove\n`);
            
            if(!dirs.length) return;
            
            if(!showProgress && !program.interactive && !program.verbose)
                console.log('Deleting empty directories, please wait...');
            
            updateProgress(0, dirs.length);
        });
        
        inst.on('deletedEmptyDir', (dir) => {
            this.stats.currentEmpty += 1;
            updateProgress(this.stats.currentEmpty, this.stats.totalEmpty);
            
            this.log(
                'verbose',
                `${chalk.yellow.bold('DELETED EMPTY DIR')} (${this.stats.currentEmpty}/${this.stats.totalEmpty}) ${chalk.gray(dir)}`
            );
        });
        
        inst.on('afterEmptyDirs', () => {
            if(showProgress) process.stdout.write('\n');
            this.log('event', 'afterEmptyDirs');
        });
        
        // Error Event (called as soon as an error is encountered)
        inst.on('error', (err) => {
            this.log('event', 'error');
            this.log('error', err.error);
        });
        
        // FileError Event (called when there was an error deleting a file)
        inst.on('fileError', (err) => {
            this.log('event', 'fileError');
            this.log('error', `${chalk.red.bold('FILE ERROR:')} ${err.error}\n${chalk.gray(err.file)}`);
        });
        
        // Finish Event (once processing/deleting all files is complete)
        inst.on('finish', (results) => {
            if(showProgress) process.stdout.write('\n');
            this.log('event', 'finish');
            
            this.log(
                'verbose',
                `${chalk.green('FINISH')} Deleted ${chalk.yellow.bold(results.length)} files/folders of ${chalk.yellow.bold(this.stats.total)}`
            );
        });
        
        // Complete Event (once everything has completed)
        inst.on('complete', () => {
            this.log('event', 'complete');
        });
    }
    
    done(err, results) {
        console.log(
            "\n" + chalk.green.bold('FILES/FOLDERS DELETED') + "\n" +
            `    ${chalk.yellow.bold('Total:   ')} ${results.length}\n` +
            `    ${chalk.yellow.bold('Skipped: ')} ${this.stats.skipped.length}\n` +
            `    ${chalk.yellow.bold('Empty:   ')} ${this.stats.totalEmpty}\n`
        );
        
        setTimeout(() => {
            process.stdin.destroy();
            
            if(err) {
                this.log('error', err);
                return process.exit(1);
            }
            
            process.exit(0);
        }, 500);
    }
}

new ModClean_CLI();
