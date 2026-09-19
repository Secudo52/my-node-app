const fs = require('fs').promises;
const path = require('path');

const VARIANT = 7;
const IGNORE_DIRS = ['node_modules', '.git'];

async function scanDirectory(dirPath, stats = { files: [], folders: 0 }) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
        if (IGNORE_DIRS.includes(item.name)) continue;
        
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
            stats.folders++;
            await scanDirectory(fullPath, stats);
        } else if (item.isFile()) {
            const fileStat = await fs.stat(fullPath);
            stats.files.push({
                name: item.name,
                path: fullPath,
                size: fileStat.size,
                ext: path.extname(item.name).toLowerCase() || 'no_ext'
            });
        }
    }
    return stats;
}

function formatSize(bytes) {
    const kb = (bytes / 1024).toFixed(2);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB (${bytes} bayt)`;
}

async function runTask3() {
    try {
        const targetDir = process.argv[2] || '.';
        const absoluteTargetDir = path.resolve(targetDir);
        
        console.log(`Analiz direktorii: ${targetDir}`);

        const stats = await scanDirectory(absoluteTargetDir);
        
        let totalSize = 0;
        const extMap = {};
        
        for (const file of stats.files) {
            totalSize += file.size;
            
            if (!extMap[file.ext]) {
                extMap[file.ext] = { count: 0, size: 0 };
            }
            extMap[file.ext].count++;
            extMap[file.ext].size += file.size;
        }

        const sortedByAsc = [...stats.files].sort((a, b) => a.size - b.size);
        const sortedByDesc = [...stats.files].sort((a, b) => b.size - a.size);
        
        const top5Largest = sortedByDesc.slice(0, 5);
        const top5Smallest = sortedByAsc.slice(0, 5);

        console.log(`\nObshchee kolichestvo papok: ${stats.folders}`);
        console.log(`Obshchee kolichestvo faylov: ${stats.files.length}`);
        console.log(`Obshchiy razmer: ${formatSize(totalSize)}`);
        
        console.log('\nRasshireniya faylov:');
        for (const [ext, data] of Object.entries(extMap)) {
            console.log(`${ext}: ${data.count} faylov (${formatSize(data.size)})`);
        }

        console.log('\nTop-5 samykh bolshikh faylov:');
        top5Largest.forEach((f, i) => {
            console.log(`${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`);
        });

        console.log('\nTop-5 samykh malenkikh faylov:');
        top5Smallest.forEach((f, i) => {
            console.log(`${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`);
        });

        const reportData = {
            targetDir,
            totalFolders: stats.folders,
            totalFiles: stats.files.length,
            totalSizeBytes: totalSize,
            extensions: extMap,
            top5Largest,
            top5Smallest
        };

        const reportName = `report_${VARIANT}.json`;
        await fs.writeFile(reportName, JSON.stringify(reportData, null, 2), 'utf8');
        console.log(`\nOtchet sokhranen: ${reportName}`);
        
    } catch (error) {
        console.error('Oshibka pri vipolnenii Zadaniy 3:', error.message);
    }
}

runTask3();