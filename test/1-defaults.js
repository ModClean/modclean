const assert = require('chai').assert;
const modclean = require('../');

describe ('Default Options', () => {
    let def = modclean.defaults;
    
    it('should have all of the options', () => {
        assert.hasAllKeys(modclean.defaults, [
            "cwd",
            "patterns",
            "additionalPatterns",
            "ignorePatterns",
            "noDirs",
            "ignoreCase",
            "dotFiles",
            "modulesDir",
            "filter",
            "skipModules",
            "removeEmptyDirs",
            "emptyDirFilter",
            "globOptions",
            "errorHalt",
            "test",
            "followSymlink"
        ]);
    });
    
    it ('should have defaults.cwd', () => {
        assert.isString(def.cwd);
        assert.equal(def.cwd, process.cwd());
    });
    
    it ('should have defaults.patterns', () => {
        assert.isArray(def.patterns);
        assert.deepEqual(def.patterns, ['default:safe']);
    });
    
    it ('should have defaults.additionalPatterns', () => {
        assert.isNull(def.additionalPatterns);
    });
    
    it ('should have defaults.ignorePatterns', () => {
        assert.isNull(def.ignorePatterns);
    });
    
    it ('should have defaults.noDirs', () => {
        assert.isBoolean(def.noDirs);
        assert.isFalse(def.noDirs);
    });
    
    it ('should have defaults.ignoreCase', () => {
        assert.isBoolean(def.ignoreCase);
        assert.isTrue(def.ignoreCase);
    });
    
    it ('should have defaults.dotFiles', () => {
        assert.isBoolean(def.dotFiles);
        assert.isTrue(def.dotFiles);
    });
    
    it ('should have defaults.modulesDir', () => {
        assert.isString(def.modulesDir);
        assert.equal(def.modulesDir, 'node_modules');
    });
    
    it ('should have defaults.filter', () => {
        assert.isNull(def.filter);
    });
    
    it ('should have defaults.skipModules', () => {
        assert.isBoolean(def.skipModules);
        assert.isTrue(def.skipModules);
    });
    
    it ('should have defaults.removeEmptyDirs', () => {
        assert.isBoolean(def.removeEmptyDirs);
        assert.isTrue(def.removeEmptyDirs);
    });
    
    it ('should have defaults.emptyDirFilter', () => {
        assert.isFunction(def.emptyDirFilter);
    });
    
    it ('should have defaults.globOptions', () => {
        assert.isObject(def.globOptions);
        assert.isEmpty(def.globOptions);
    });
    
    it ('should have defaults.errorHalt', () => {
        assert.isBoolean(def.errorHalt);
        assert.isFalse(def.errorHalt);
    });
    
    it ('should have defaults.test', () => {
        assert.isBoolean(def.test);
        assert.isFalse(def.test);
    });
    
    it ('should have defaults.followSymlink', () => {
        assert.isBoolean(def.followSymlink);
        assert.isFalse(def.followSymlink);
    });
    
    describe ('defaults.emptyDirFilter', () => {
        it('should return true for valid file', () => {
            assert.isTrue(
                def.emptyDirFilter('/path/to/valid.txt')
            );
        });
        
        it ('should return false for invalid file (.DS_Store)', () => {
            assert.isFalse(
                def.emptyDirFilter('/path/to/.DS_Store')
            );
        });
        
        it('should return false for invalid file (Thumbs.db)', () => {
            assert.isFalse(
                def.emptyDirFilter('/path/to/Thumbs.db')
            );
        });
    });
});
