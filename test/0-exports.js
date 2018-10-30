const assert = require('chai').assert;
const semverRegex = require('semver-regex');
const modclean = require('../');

describe ('Exports', () => {
    it('should export a function', () => {
        assert.isFunction(modclean);
    });
    
    it('should export default options', () => {
        assert.isObject(modclean.defaults);
    });
    
    it ('should export access to ModClean class', () => {
        assert.isFunction(modclean.ModClean);
    });
    
    it ('should export the version', () => {
        assert.isString(modclean.version);
        assert.match(modclean.version, semverRegex());
    });
    
    describe ('Constructor Shortcut', () => {
        it('should return new instance of ModClean', () => {
            let mc = modclean();
            assert.instanceOf(mc, modclean.ModClean);
        });
    });
});
