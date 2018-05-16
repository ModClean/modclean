/*
    Misc. utils for the CLI program
 */
"use strict";
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const ProgressBar = require('progress');

exports.warningMsg =
`    This module deletes files from the filesystem and cannot be recovered. 
    Depending on the patterns plugins, the files being deleted typically are not 
    required by modules, although there is no guarantee that the modules will 
    work correctly after running this script. You can easily restore your modules 
    by deleting your "node_modules" folder and running "npm install" again. If you 
    have any concerns with deleting files, you should run this utility with the 
    "--test" flag first. The author or contributors shall not be held responsible 
    for damages this module might cause. Please see the README for more information.\n\n`;

exports.confirm = function(msg, cb) {
    process.stdin.setEncoding('utf8');
    
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question(msg + chalk.gray(' [y/N] '), function(answer) {
        rl.close();
        cb(/^y|yes|ok|true$/i.test(answer.trim()));
    });
};

exports.progressBar = function(total) {
    return new ProgressBar('[:bar] :percent (:current/:total) :etas', {
        total: total,
        incomplete: ' ',
        width: 30
    });
};

exports.spinner = function(msg) {
    return ora(msg).start();
};

exports.initLog = function(verbose) {
    let types = {
        error: chalk.red.bold('ERROR'),
        info: ''
    };
    
    if(verbose) {
        types.event = chalk.magenta.bold('EVENT');
        types.verbose = chalk.green.bold('VERBOSE');
    }
    
    return function log(type, ...args) {
        if(!type) type = 'info';
        if(!types.hasOwnProperty(type)) return;
        let method = type === 'error'? 'error' : 'log';
        
        args.unshift(types[type] + chalk.gray('>'));
        console[method](args.join(' '));
    };
};
