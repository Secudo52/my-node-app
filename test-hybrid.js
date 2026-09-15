const FileManagerHybrid = require('./fileOperationsHybrid');
const fileManager = new FileManagerHybrid('./test-data-hybrid');

console.log('=== TESTIROVANIE ZADANIYA 3 (GIBRID) ===\n');

function testHybridOperations() {
    console.log('--- Chast 1: Ispolzovanie Callback (iz Zadanija 1) ---');
    
    fileManager.createFile('test-cb.txt', 'Privet iz callback!', (err, filePath) => {
        if (err) {
            console.error('Oshibka sozdaniya (cb):', err.message);
            return;
        }
        console.log(`Fayl sozdan (cb): ${filePath}`);

        fileManager.readFile('test-cb.txt', (err, content) => {
            if (err) {
                console.error('Oshibka chteniya (cb):', err.message);
                return;
            }
            console.log(`Soderzhimoe (cb): "${content}"`);

            fileManager.deleteFile('test-cb.txt', (err) => {
                if (err) return console.error('Oshibka udaleniya (cb):', err.message);
                console.log('Fayl udalen (cb)\n');
                
                runPromisesPart();
            });
        });
    });
}

async function runPromisesPart() {
    console.log('--- Chast 2: Ispolzovanie Promisov (iz Zadanija 2) ---');
    try {
        const filePath = await fileManager.createFile('test-pr.txt', 'Privet iz promisov!');
        console.log(`Fayl sozdan (promis): ${filePath}`);
        
        const content = await fileManager.readFile('test-pr.txt');
        console.log(`Soderzhimoe (promis): "${content}"`);
        
        const stats = await fileManager.getFileStats('test-pr.txt');
        console.log(`Statistika (promis):\n     Razmer: ${stats.size} bayt\n     Izmenen: ${stats.modified}`);
        
        await fileManager.deleteFile('test-pr.txt');
        console.log('Fayl udalen (promis)');
        
        console.log('\nVse gibridnye operacii zaversheny!');
    } catch (error) {
        console.error('\nOshibka (promis):', error.message);
    }
}

testHybridOperations();