const fs = require('fs').promises;
const path = require('path');

const VARIANT = 7;
const PROJECT_DIR = path.join(__dirname, `project_${VARIANT}`);

async function printTree(dirPath, prefix = '') {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isLast = i === items.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            console.log(`${prefix}${marker}${item.name}`);
            
            if (item.isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                await printTree(path.join(dirPath, item.name), newPrefix);
            }
        }
    } catch (error) {
        console.error(`Oshibka chteniya direktorii ${dirPath}:`, error.message);
    }
}

async function createDirWithInfo(dirPath, description) {
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, 'info.txt'), description, 'utf8');
}

async function runTask2() {
    try {
        console.log('--- Nachalo vipolneniya Zadaniy 2 ---');

        const dirsToCreate = [
            { p: path.join(PROJECT_DIR, 'src', 'modules'), desc: 'Moduli proekta' },
            { p: path.join(PROJECT_DIR, 'src', 'components'), desc: 'Komponenty proekta' },
            { p: path.join(PROJECT_DIR, 'src', 'utils'), desc: 'Utiliti' },
            { p: path.join(PROJECT_DIR, 'data', 'input'), desc: 'Vhodnye dannye' },
            { p: path.join(PROJECT_DIR, 'data', 'output'), desc: 'Vyhodnye dannye' },
            { p: path.join(PROJECT_DIR, 'temp'), desc: 'Vremennye fayli' }
        ];

        for (const dir of dirsToCreate) {
            await createDirWithInfo(dir.p, dir.desc);
        }

        const compDir = path.join(PROJECT_DIR, 'src', 'components');
        for (let i = 1; i <= 3; i++) {
            await createDirWithInfo(path.join(compDir, String(i)), `Vlozhennaya papka ${i}`);
        }
        
        await fs.writeFile(path.join(PROJECT_DIR, 'src', 'info.txt'), 'Ishodnii kod', 'utf8');
        await fs.writeFile(path.join(PROJECT_DIR, 'data', 'info.txt'), 'Dannye', 'utf8');
        await fs.writeFile(path.join(PROJECT_DIR, 'info.txt'), 'Koren proekta', 'utf8');

        console.log(`\nDerevo struktury (Do izmeneniy) [project_${VARIANT}]:`);
        await printTree(PROJECT_DIR);

        const oldTemp = path.join(PROJECT_DIR, 'temp');
        const newTemp = path.join(PROJECT_DIR, 'data', 'temp');
        await fs.rename(oldTemp, newTemp);

        const oldOutput = path.join(PROJECT_DIR, 'data', 'output');
        const newOutput = path.join(PROJECT_DIR, 'data', 'results');
        await fs.rename(oldOutput, newOutput);

        await fs.rm(newTemp, { recursive: true, force: true });

        console.log('\nDerevo struktury (Posle izmeneniy):');
        await printTree(PROJECT_DIR);

        console.log('\n--- Zadanie 2 uspeshno zaversheno ---');
    } catch (error) {
        console.error('Oshibka pri vipolnenii Zadaniy 2:', error.message);
    }
}

runTask2();