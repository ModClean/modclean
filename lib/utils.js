"use strict";
const uniq = require('lodash.uniq');
const path = require('path');


class ModClean_Utils {
    constructor(inst) {
        this._inst = inst;
    }
    
    /**
     * Initializes patterns based on the configuration
     * @param  {Object} opts Options object for ModClean
     * @return {Object}      The compiled and loaded patterns
     */
    initPatterns(opts) {
        let patDefs = opts.patterns,
            patterns = [],
            ignore = [];
        
        if(!Array.isArray(patDefs)) patDefs = [patDefs];
        
        patDefs.forEach((def) => {
            def = def.split(':');
            let mod = def[0],
                name = def[1],
                loader = this._loadPatterns(mod),
                results;
            
            mod = loader.module;
            results = loader.patterns;
            
            let all = Object.keys(results).filter(function(val) {
                return val[0] !== '$';
            });
            
            if(!name) {
                if(results.$default) name = results.$default;
                else name = all[0];
            }
            
            if(name === '*') name = all;
            
            let rules = Array.isArray(name)? name : name.split(',');
            
            rules.forEach(function(rule) {
                if(!results.hasOwnProperty(rule)) throw new Error(`Module "${mod}" does not contain rule "${rule}"`);
                let obj = results[rule];
                
                if(Array.isArray(obj)) return patterns = patterns.concat(obj);
                
                if(typeof obj === 'object') {
                    if(obj.hasOwnProperty('patterns')) patterns = patterns.concat(obj.patterns);
                    if(obj.hasOwnProperty('ignore')) ignore = ignore.concat(obj.ignore);
                }
            });
        });
        
        let addlPats = opts.additionalPatterns,
            addlIgnore = opts.ignorePatterns;
        
        if(Array.isArray(addlPats) && addlPats.length) patterns = patterns.concat(addlPats);
        if(Array.isArray(addlIgnore) && addlIgnore.length) ignore = ignore.concat(addlIgnore);
        
        patterns = uniq(patterns);
        ignore = uniq(ignore);
        
        if(!patterns.length) throw new Error('No patterns have been loaded, nothing to check against');
        
        return {
            allow: patterns,
            ignore
        };
    }
    
    /**
     * Parses pattern configuration item and attempts to load it
     * @param  {String} module Module name or path to load
     * @param  {String} def    Raw definition provided in the configuration
     * @return {Object}        Object containing the found module name and the loaded patterns
     */
    _loadPatterns(module, def) {
        let patterns;
        
        if(module.indexOf('/') !== -1) {
            let ext = path.extname(module);
            if(!path.isAbsolute(module)) module = path.resolve(process.cwd(), module);
            
            if(ext === '.js' || ext === '.json') patterns = require(module); 
            else throw new Error(`Invalid pattern module "${def}" provided`);
        } else {
            if(module.match(/modclean\-patterns\-/) === null) module = 'modclean-patterns-' + module;
            
            try {
                patterns = require(module);
            } catch(e) {
                throw new Error(`Unable to find patterns plugin "${module}", is it installed?`);
            }
        }
        
        if(patterns === null || typeof patterns !== 'object')
            throw new Error(`Patterns "${module}" did not return an object`);
        
        return {
            module,
            patterns
        };
    }
    
    /**
     * Stores error details and emits error event
     * @param  {Error}  err    Error object
     * @param  {String} method Method in which the error occurred
     * @param  {Object} obj    Optional object to combine into the stored error object
     * @param  {String} event  Event name to emit, `false` disables
     * @return {Object}        The compiled error object
     */
    error(err, method, obj={}, event='error') {
        let errObj = Object.assign({
            error: err,
            method: method
        }, obj || {});
        
        this._inst.errors.push(errObj);
        if(event !== false) this._inst.emit(event, errObj);
        
        return errObj;
    }
}

module.exports = ModClean_Utils;
