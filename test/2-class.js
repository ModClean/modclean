const assert = require('chai').assert;
const path = require('path');
const semverRegex = require('semver-regex');
const modclean = require('../');

describe ('ModClean Class', () => {
    let mc = modclean();
    
    it ('should have version property', () => {
        assert.isString(mc.version);
        assert.match(mc.version, semverRegex());
    });
    
    it ('should have EventEmitter', () => {
        assert.isFunction(mc.emit);
        assert.isFunction(mc.on);
    });
    
    describe ('Default Options', () => {
        let mc = modclean();
        
        it('should set options.cwd', () => {
            assert.equal(mc.options.cwd, path.join(process.cwd(), mc.options.modulesDir));
        });
        
        it ('should set _patterns', () => {
            assert.isObject(mc._patterns);
            assert.hasAllKeys(mc._patterns, ['allow', 'ignore']);
            
            assert.isArray(mc._patterns.allow);
            assert.isArray(mc._patterns.ignore);
        });
    });
    
    
    describe ('Custom Options', () => {
        let mc = modclean({
            patterns: ['default:*'],
            additionalPatterns: ['custom.file'],
            ignorePatterns: ['ignore.file', 'cname'],
            modulesDir: false,
            filter: function() {
                return true;
            },
            globOptions: {
                dot: true
            }
        });
        
        it('should just use options.cwd without modulesDir', () => {
            assert.equal(mc.options.cwd, process.cwd());
        });
        
        it('should set _patterns', () => {
            assert.isObject(mc._patterns);
            assert.hasAllKeys(mc._patterns, ['allow', 'ignore']);

            assert.isArray(mc._patterns.allow);
            assert.isArray(mc._patterns.ignore);
        });
        
        it ('should add allowed patterns', () => {
            assert.include(mc._patterns.allow, 'custom.file');
        });
        
        it ('should add ignored patterns', () => {
            assert.include(mc._patterns.ignore, 'ignore.file');
        });
        
        it ('should remove ignored patterns from allowed patterns', () => {
            assert.notInclude(mc._patterns.allow, 'cname');
        });
        
        it ('should have a filter function', () => {
            assert.isFunction(mc.options.filter);
        });
        
        it ('should have globOptions', () => {
            assert.deepEqual(mc.options.globOptions, { dot: true });
        });
    });
});
