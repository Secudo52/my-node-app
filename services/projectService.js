const fs = require('fs');
const path = require('path');

class ProjectService {
    static init(name, type) {
        if (!name) throw new Error('Imya proekta ne ukazano');
        const projectDir = path.resolve(process.cwd(), name);
        return {
            success: true,
            name,
            type: type || 'cli',
            path: projectDir
        };
    }

    static build(configPath, dryRun = false) {
        const configFile = configPath || 'config.json';
        const fullPath = path.resolve(process.cwd(), configFile);

        if (!fs.existsSync(fullPath)) {
            const err = new Error(`ENOENT: no such file or directory, open '${configFile}'`);
            err.code = 'ENOENT';
            err.configFile = configFile;
            throw err;
        }

        if (dryRun) {
            return {
                dryRun: true,
                outputFile: 'dist/my-app.js'
            };
        }

        return {
            time: '2.3s',
            outputFile: 'dist/my-app.js'
        };
    }

    static test() {
        return {
            passed: 15,
            total: 15,
            coverage: '87%'
        };
    }

    static deploy(env, force = false) {
        if (env === 'production' && !force) {
            return { requireConfirmation: true };
        }
        return {
            success: true,
            env: env || 'staging',
            url: 'https://my-app.example.com'
        };
    }
}

module.exports = ProjectService;
