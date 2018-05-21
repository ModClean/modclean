#!/usr/bin/env node
"use strict";

const chalk = require('chalk');
const program = require('commander');
const util = require('util');
const path = require('path');
const fs = require('fs');

const utils = require('./utils');
const modclean = require('../lib/modclean');
const ModClean = modclean.ModClean;

function list(val) {
    return val.split(',');
}

process.on('SIGINT', function() {
    process.stdin.destroy();
    process.exit();
});

program
    .version(modclean.version)
    .description('Remove unwanted files and directories from your node_modules folder')
    .usage('[options]')
    .option('-p, --path <path>', 'Path to run modclean on (defaults to current directory)')
    .option('-D, --modules-dir <name>', 'Modules directory name (defaults to "node_modules")')
    .option('-n, --patterns <list>', 'Patterns plugins/rules to use (defaults to "default:safe")', list)
    .option('-a, --additional-patterns <list>', 'Additional glob patterns to search for', list)
    .option('-I, --ignore <list>', 'Comma separated list of patterns to ignore', list)
    .option('-t, --test', 'Run modclean and return results without deleting files')
    .option('-s, --case-sensitive', 'Matches are case sensitive')
    .option('-P, --no-progress', 'Hide progress bar')
    .option('-e, --error-halt', 'Halt script on error')
    .option('-v, --verbose', 'Run in verbose mode')
    .option('-f, --follow-symlink', 'Clean symlinked packages as well')
    .option('-r, --run', 'Run immediately without warning')
    .option('--no-dirs', 'Exclude directories from being removed')
    .option('--no-dotfiles', 'Exclude dot files from being removed')
    .option('-k, --keep-empty', 'Keep empty directories')
    .option('-m, --modules', 'Delete modules that are matched by patterns')
    .option('-l, --log', 'Output log files')
    .parse(process.argv);

class ModClean_CLI {
    constructor() {
        this.log = utils.initLog(program.verbose);
        
        // Add a space at the top
        console.log("\n");
        
        // Display CLI header
        console.log(
            chalk.yellow.bold('MODCLEAN ') +
            chalk.gray(' Version ' + modclean.version) + "\n"
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
        this.stats = {
            total: 0,
            deleted: 0,
            skipped: 0,
            deletedEmpty: 0,
            totalEmpty: 0
        };
        
        this.logs = {
            deleted: [],
            skipped: [],
            errors: []
        };

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
            followSymlink: !!program.followSymlink,
            skipModules: !program.modules
        };

        this.modclean = new ModClean(options);
        
        this.initEvents();
        
        this.modclean.clean()
            .then(this.done.bind(this))
            .catch(this.fail.bind(this));
    }

    initEvents() {
        var inst = this.modclean,
            showProgress = true,
            spinner, progress;

        if(!process.stdout.isTTY || !program.progress || program.verbose) showProgress = false;
        
        inst.on('clean:start', () => {
            this.log('event', 'clean:start');
            this.log('verbose', '\n' + JSON.stringify(inst.options, null, 4));
            
            spinner = utils.spinner(`Searching for files in ${inst.options.cwd}...`);
        });
        
        inst.on('file:find', () => {
            this.log('event', 'file:find');
        });
        
        inst.on('file:list', files => {
            this.log('event', 'file:list');
            this.stats.total = files.length;
            
            spinner.succeed(`Found ${files.length} files to remove`);
        });
        
        inst.on('process:start', files => {
            this.log('event', 'process:start');
            
            if(!showProgress) console.log('Deleting files, please wait...');
            if(showProgress) progress = utils.progressBar(files.length);
        });
        
        inst.on('file:skipped', file => {
            this.log('event', 'file:skipped');
            this.stats.skipped += 1;
            this.logs.skipped.push(file.fullPath);
            
            this.log(
                'verbose',
                `${chalk.magenta.bold('SKIPPED')} ${chalk.gray(file.path)}`
            );
            
            if(showProgress) progress.tick(1);
        });
        
        inst.on('file:deleted', file => {
            this.log('event', 'file:deleted');
            this.stats.deleted += 1;
            this.logs.deleted.push(file.fullPath);
            
            this.log(
                'verbose',
                `${chalk.yellow.bold('DELETED')} ${chalk.gray(file.path)}`
            );
            
            if(showProgress) progress.tick(1);
        });
        
        inst.on('process:done', () => {
            this.log('event', 'process:done');
            if(showProgress) progress.terminate();
        });
        
        inst.on('emptydir:start', () => {
            this.log('event', 'emptydir:start');
            spinner = utils.spinner(`Searching for empty directories in ${inst.options.cwd}...`);
        });
        
        inst.on('emptydir:list', dirs => {
            this.log('event', 'emptydir:list');
            spinner.succeed(`Found ${dirs.length} empty directories to remove`);
            
            this.stats.totalEmpty = dirs.length;

            if(!dirs.length) return;

            if(!showProgress) console.log('Deleting empty directories, please wait...');
            if(showProgress) progress = utils.progressBar(dirs.length);
        });
        
        inst.on('emptydir:deleted', dir => {
            this.log('event', 'emptydir:deleted');
            this.stats.deletedEmpty += 1;
            this.logs.deleted.push(dir);
            
            this.log(
                'verbose',
                `${chalk.yellow.bold('DELETED EMPTY DIR')} ${chalk.gray(dir)}`
            );
            
            if(showProgress) progress.tick(1);
        });
        
        inst.on('emptydir:done', () => {
            this.log('event', 'emptydir:done');
            if(showProgress) progress.terminate();
        });
        
        inst.on('error', (err) => {
            this.log('event', 'error');
            this.log('error', err.message);
            
            this.logs.errors.push({
                message: err.message,
                method: err.method,
                payload: err.payload
            });
        });
        
        inst.on('clean:complete', res => {
            this.log('event', 'clean:complete');
            
            this.log(
                'verbose',
                `${chalk.green('FINISH')} Deleted ${chalk.yellow.bold(res.deleted.length)} files/folders of ${chalk.yellow.bold(this.stats.total + this.stats.totalEmpty)}`
            );
        });
    }
    
    async writeLogs() {
        if(!program.log) return;
        let writeFile = util.promisify(fs.writeFile);
        
        try {
            await writeFile(path.join(process.cwd(), 'modclean-deleted.log'), JSON.stringify(this.logs.deleted));
            await writeFile(path.join(process.cwd(), 'modclean-skipped.log'), JSON.stringify(this.logs.skipped));
            await writeFile(path.join(process.cwd(), 'modclean-errors.log'), JSON.stringify(this.logs.errors));
        } catch(e) {
            console.error('Error while creating log files:');
            console.error(e);
        }
        
        return true;
    }
    
    async fail(err) {
        this.log('error', err);
        
        await this.writeLogs();
        process.stdin.destroy();
        return process.exit(1);
    }
    
    async done(results) {
        console.log(
            "\n" + chalk.green.bold('FILES/FOLDERS DELETED') + "\n" +
            `    ${chalk.yellow.bold('Total:   ')} ${results.deleted.length}\n` +
            `    ${chalk.yellow.bold('Skipped: ')} ${this.stats.skipped}\n` +
            `    ${chalk.yellow.bold('Empty:   ')} ${this.stats.deletedEmpty}\n`
        );

        await this.writeLogs();
        process.stdin.destroy();
        return process.exit(0);
    }
}

new ModClean_CLI();
