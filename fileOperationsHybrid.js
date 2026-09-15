const fs = require('fs');
const path = require('path');
const util = require('util');

const readFilePromise = util.promisify(fs.readFile);
const writeFilePromise = util.promisify(fs.writeFile);
const unlinkPromise = util.promisify(fs.unlink);
const statPromise = util.promisify(fs.stat);

class FileManagerHybrid {
    constructor(baseDir = './data-hybrid') {
        this.baseDir = baseDir;
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
            console.log(`Sozdana direktoriya: ${this.baseDir}`);
        }
    }

    createFile(filename, content, callback) {
        const filePath = path.join(this.baseDir, filename);
        if (callback) {
            fs.writeFile(filePath, content, 'utf8', (err) => {
                if (err) return callback(err, null);
                callback(null, filePath);
            });
        } else {
            return writeFilePromise(filePath, content, 'utf8').then(() => filePath);
        }
    }

    readFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);
        if (callback) {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) return callback(err, null);
                callback(null, data);
            });
        } else {
            return readFilePromise(filePath, 'utf8');
        }
    }

    getFileStats(filename, callback) {
        const filePath = path.join(this.baseDir, filename);
        if (callback) {
            fs.stat(filePath, (err, stats) => {
                if (err) return callback(err, null);
                callback(null, {
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isFile: stats.isFile()
                });
            });
        } else {
            return statPromise(filePath).then(stats => ({
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isFile: stats.isFile()
            }));
        }
    }

    deleteFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);
        if (callback) {
            fs.unlink(filePath, (err) => {
                if (err) return callback(err);
                callback(null);
            });
        } else {
            return unlinkPromise(filePath);
        }
    }
}

module.exports = FileManagerHybrid;