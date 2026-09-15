const FileManager = require('./fileOperations');
const fileManager = new FileManager('./test-data');

console.log('TESTIROVANIE CALLBACKOV\n');

console.log('1. Sozdanie fayla...');
fileManager.createFile('test1.txt', 'Privet, mir!', (err, filePath) => {
    if (err) {
        console.error('Oshibka sozdaniya:', err.message);
        return;
    }
    console.log(`Fayl sozdan: ${filePath}`);

    console.log('\n2. Chtenie fayla...');
    fileManager.readFile('test1.txt', (err, content) => {
        if (err) {
            console.error('Oshibka chteniya:', err.message);
            return;
        }
        console.log(`Soderzhimoe: "${content}"`);

        console.log('\n3. Poluchenie statistiki...');
        fileManager.getFileStats('test1.txt', (err, stats) => {
            if (err) {
                console.error('Oshibka statistiki:', err.message);
                return;
            }
            console.log(`Statistika:\n     Razmer: ${stats.size} bayt\n     Sozdan: ${stats.created}\n     Izmenen: ${stats.modified}`);

            console.log('\n4. Sozdanie vtorogo fayla...');
            fileManager.createFile('test2.txt', 'Vtoroy fayl dlya demonstracii', (err, filePath2) => {
                if (err) {
                    console.error('Oshibka sozdaniya vtorogo fayla:', err.message);
                    return;
                }
                console.log(`Vtoroy fayl sozdan: ${filePath2}`);

                console.log('\n5. Spisok faylov...');
                fileManager.listFiles((err, files) => {
                    if (err) {
                        console.error('Oshibka polucheniya spiska:', err.message);
                        return;
                    }
                    console.log('Fayly v direktorii:');
                    files.forEach(file => console.log(`     - ${file}`));

                    console.log('\n6. Ochistka...');
                    fileManager.deleteFile('test1.txt', (err) => {
                        if (err) return console.error('Oshibka udaleniya test1.txt:', err.message);
                        console.log('test1.txt udalen');

                        fileManager.deleteFile('test2.txt', (err) => {
                            if (err) return console.error('Oshibka udaleniya test2.txt:', err.message);
                            console.log('test2.txt udalen');
                            
                            console.log('\nVse operacii zaversheny!');
                            console.log('Obratite vnimanie na glubinu vlozhennosti callbackov!');
                        });
                    });
                });
            });
        });
    });
});