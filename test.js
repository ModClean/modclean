/**
 * ModClean - Tests
 * @requires mocha (npm install mocha -g)
 * @author Kyle Ross
 */

/*global describe, it, before, beforeEach */

var should = require('should'),
    path = require('path'),
    modclean = require('./index.js');

describe('modclean', function() {
    it('should be a function', function() {
        modclean.should.be.a.Function;
    });
    
    describe('defaults', function() {
        var patterns;
        
        before('load patterns.json', function() {
            patterns = require('./patterns.json');
        });
        
        it('should be an object', function() {
            modclean.defaults.should.be.an.instanceOf(Object);
        });
        
        it('should have correct cwd', function() {
            modclean.defaults.cwd.should.equal(process.cwd());
        });
        
        it('should contain patterns from patterns.json', function() {
            modclean.defaults.patterns.should.match(patterns.safe);
        });
    });
    
    describe('patterns', function() {
        var patterns;
        
        before('load patterns.json', function() {
            patterns = require('./patterns.json');
        });
        
        it('should be an object', function() {
            modclean.patterns.should.be.an.instanceOf(Object);
        });
        
        it('should contain patterns from patterns.json', function() {
            modclean.patterns.should.match(patterns);
        });
        
        describe('safe', function() {
            it('should contain patterns', function() {
                modclean.patterns.should.have.property('safe');
                modclean.patterns.safe.length.should.be.greaterThan(0);
            });
        });
        
        describe('caution', function() {
            it('should contain patterns', function() {
                modclean.patterns.should.have.property('caution');
                modclean.patterns.caution.length.should.be.greaterThan(0);
            });
        });
        
        describe('danger', function() {
            it('should contain patterns', function() {
                modclean.patterns.should.have.property('danger');
                modclean.patterns.danger.length.should.be.greaterThan(0);
            });
        });
    });
    
    describe('ModClean', function() {
        it('should be a function', function() {
            modclean.ModClean.should.be.a.Function;
        });
        
        it('should have EventEmitter', function() {
            modclean.ModClean.super_.name.should.equal('EventEmitter');
        });
        
        it('should have clean method', function() {
            modclean.ModClean.prototype.clean.should.be.a.Function;
        });
        
        it('should have _find method', function() {
            modclean.ModClean.prototype._find.should.be.a.Function;
        });
        
        it('should have _process method', function() {
            modclean.ModClean.prototype._process.should.be.a.Function;
        });
        
        it('should have _deleteFile method', function() {
            modclean.ModClean.prototype._deleteFile.should.be.a.Function;
        });
    });
});

describe('ModClean instance', function() {
    this.timeout(3000);
    
    describe('options', function() {
        it('should have default options', function() {
            var opts = new modclean.ModClean().options;
            opts.cwd = process.cwd();
            opts.should.match(modclean.defaults);
        });
        
        describe('custom', function() {
            var MC,
                customPatterns = ['a', 'b', 'c'];
            
            before('set custom options', function() {
                MC = new modclean.ModClean({
                    patterns:   customPatterns,
                    ignoreCase: false,
                    process:    function() {},
                    modulesDir: 'nm',
                    errorHalt:  true,
                    test:       true
                });
            });
            
            it('should have custom patterns', function() {
                MC.options.patterns.should.match(customPatterns);
            });
            
            it('should flatten array of arrays for patterns', function() {
                var _patterns = [];
                _patterns = _patterns.concat(modclean.patterns.safe, modclean.patterns.caution);
                
                var MC = new modclean.ModClean({
                    patterns: [modclean.patterns.safe, modclean.patterns.caution]
                });
                
                MC.options.patterns.should.match(_patterns);
            });
                
            it('should ignore case', function() {
                MC.options.ignoreCase.should.be.false;
            });
            
            it('should have process function', function() {
                MC.options.process.should.be.a.Function;
            });
            
            it('should have modulesDir appended to cwd', function() {
                MC.options.cwd.should.equal(path.join(process.cwd(), MC.options.modulesDir));
            });
            
            it('should errorHalt', function() {
                MC.options.errorHalt.should.be.true;
            });
            
            it('should be in test mode', function() {
                MC.options.test.should.be.true;
            });
            
            it('should go back to defaults in a new instance', function() {
                var NMC = new modclean.ModClean();
                NMC.options.should.not.match(MC.options);
            });
        });
    });

    describe('constructor', function() {
        it('should run clean if callback provided', function(done) {
            var MC = new modclean.ModClean({ test: true }, function(err, results) {
                results.should.be.an.Array;
                done();
            });
        });
        
        it('should except callback as first parameter', function(done) {
            modclean.defaults.test = true;
            
            var MC = new modclean.ModClean(function(err, results) {
                results.should.be.an.Array;
                modclean.defaults.test = false;
                done();
            });
        });
    });

    describe('complete event', function() {
        it('should emit complete event', function(done) {
            var MC = new modclean.ModClean({ test: true });
            
            MC.on('complete', function(err, results) {
                should.not.exist(err);
                results.should.be.an.Array;
                done();
            });
            
            MC.clean();
        });
    });
    
    describe('method', function() {
        describe('clean', function() {
            it('should run the clean method and complete', function(done) {
                var MC = new modclean.ModClean({ test: true });
                MC.clean.should.be.a.Function;
                
                MC.clean(function(err, results) {
                    should.not.exist(err);
                    results.should.be.an.Array;
                    done();
                });
            });
            
            it('should emit start event', function(done) {
                var MC = new modclean.ModClean({ test: true });
                
                MC.on('start', function(inst) {
                    inst.should.be.instanceOf(modclean.ModClean);
                    done();
                });
                
                MC.clean();
            });
        });
        
        describe('_find', function() {
            it('should find all index.js files (custom patterns)', function(done) {
                var MC = new modclean.ModClean({ test: true });
                MC._find.should.be.a.Function;
                
                MC._find(['index.js'], function(err, files) {
                    should.not.exist(err);
                    files.should.be.an.Array;
                    done();
                });
            });
            
            it('should emit files event', function(done) {
                var MC = new modclean.ModClean({ test: true });
                
                MC.on('files', function(files) {
                    files.should.be.an.Array;
                    files.length.should.be.greaterThan(0);
                    done();
                });
                
                MC._find(['index.js'], function() {});
            });
        });
        
        describe('_process', function() {
            it('should find all index.js files (custom patterns)', function(done) {
                var MC = new modclean.ModClean({ test: true });
                MC._process.should.be.a.Function;
                
                MC._find(['index.js'], function(err, files) {
                    should.not.exist(err);
                    files.should.be.an.Array;
                    
                    MC._process(files, function(err, results) {
                        should.not.exist(err);
                        results.should.be.an.Array;
                        results.length.should.equal(files.length);
                        done();
                    });
                });
            });
            
            it('should emit finish event', function(done) {
                var MC = new modclean.ModClean({ test: true });
                
                MC.on('finish', function(results) {
                    results.should.be.an.Array;
                    results.length.should.be.greaterThan(0);
                    done();
                });
                
                MC._find(['index.js'], function(err, files) {
                    MC._process(files, function() {});
                });
            });
        });
        
        describe('_deleteFile', function() {
            it('should delete a file', function(done) {
                var MC = new modclean.ModClean({ test: true });
                
                MC._deleteFile('someFile.txt', function(err, file) {
                    should.not.exist(err);
                    file.should.be.a.String;
                    done();
                });
            });
            
            it('should emit deleted event', function(done) {
                var MC = new modclean.ModClean({ test: true });
                
                MC.on('deleted', function(file) {
                    file.should.be.a.String;
                    done();
                });
                
                MC._deleteFile('someFile.txt', function() {});
            });
        });
    });
    
    describe('process function', function() {
        describe('async', function() {
            it('should call the process function', function(done) {
                var count = 0;
                
                new modclean.ModClean({
                    patterns: ['index.js'],
                    process: function(file, files, cb) {
                        file.should.be.a.String;
                        files.should.be.an.Array;
                        cb.should.be.a.Function;
                        count++;
                        cb(true);
                    },
                    test: true
                }, function(err, results) {
                    should.not.exist(err);
                    results.should.be.an.Array;
                    results.length.should.equal(count);
                    done();
                });
            });
            
            it('should skip files', function(done) {
                var count = 0;
                
                new modclean.ModClean({
                    patterns: ['index.js'],
                    process: function(file, files, cb) {
                        count++;
                        cb(false);
                    },
                    test: true
                }, function(err, results) {
                    should.not.exist(err);
                    results.should.be.an.Array;
                    results.length.should.not.equal(count);
                    done();
                });
            });
        });
        
        describe('sync', function() {
            it('should call the process function', function(done) {
                var count = 0;
                
                new modclean.ModClean({
                    patterns: ['index.js'],
                    process: function(file, files) {
                        file.should.be.a.String;
                        files.should.be.an.Array;
                        count++;
                        return true;
                    },
                    test: true
                }, function(err, results) {
                    should.not.exist(err);
                    results.should.be.an.Array;
                    results.length.should.equal(count);
                    done();
                });
            });
            
            it('should skip files', function(done) {
                var count = 0;
                
                new modclean.ModClean({
                    patterns: ['index.js'],
                    process: function(file, files) {
                        count++;
                        return false;
                    },
                    test: true
                }, function(err, results) {
                    should.not.exist(err);
                    results.should.be.an.Array;
                    results.length.should.not.equal(count);
                    done();
                });
            });
        });
    });
});
