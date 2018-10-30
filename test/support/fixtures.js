const fs = require('fs-extra');
const cp = require('child_process');
const util = require('util');
const path = require('path');

const execFile = util.promisify(cp.execFile);

class ModClean_Fixtures {
    constructor(opts = {}) {
        this.opts = Object.assign({
            path: path.join(process.cwd(), 'test/fixtures'),
            modules: ['express', 'lodash']
        }, opts);
        
        this.fixtures = this.opts.path;
    }
    
    async setupDir() {
        await fs.mkdirp(this.fixtures).catch(e => { throw e; });
        return this.fixtures;
    }
    
    async execNPM(args) {
        let options = {
            cwd: this.fixtures
        };

        return await execFile('npm', args, options);
    }
    
    async installModules(modules) {
        await this.execNPM(['install'].concat(modules)).catch(e => { throw e; });
        return true;
    }
    
    async cleanup() {
        await fs.remove(this.fixtures).catch(e => { throw e; });
        return true;
    }
}

module.exports = ModClean_Fixtures;
