const FileManagerPromises = require('./fileOperationsPromises');

const fileManager = new FileManagerPromises('./test-data-promises');

async function testFileOperations() {
    console.log('=== TESTIROVANIE PROMISOV ===\n');
    
    try {
        console.log('1. Sozdanie fayla...');
        const filePath = await fileManager.createFile('test1.txt', 'Privet iz promisov!');
        console.log(`Fayl sozdan: ${filePath}`);
        
        console.log('\n2. Chtenie fayla...');
        const content = await fileManager.readFile('test1.txt');
        console.log(`Soderzhimoe: "${content}"`);
        
        console.log('\n3. Poluchenie statistiki...');
        const stats = await fileManager.getFileStats('test1.txt');
        console.log(`Statistika:\n     Razmer: ${stats.size} bayt\n     Sozdan: ${stats.created}\n     Izmenen: ${stats.modified}`);
        
        console.log('\n4. Sozdanie neskolkih faylov parallelno...');
        const files = [
            { filename: 'test2.txt', content: 'Vtoroy fayl' },
            { filename: 'test3.txt', content: 'Tretiy fayl' },
            { filename: 'test4.txt', content: 'Chetvertyy fayl' }
        ];
        const paths = await fileManager.createMultipleFiles(files);
        console.log(`Sozdano faylov: ${paths.length}`);
        paths.forEach(p => console.log(`     - ${p}`));
        
        console.log('\n5. Spisok faylov...');
        const fileList = await fileManager.listFiles();
        console.log(`Naydeno faylov: ${fileList.length}`);
        fileList.forEach(f => console.log(`     - ${f}`));

        console.log('\n6. Chtenie neskolkih faylov parallelno...');
        const contents = await fileManager.readMultipleFiles(fileList);
        console.log('Soderzhimoe faylov:');
        Object.entries(contents).forEach(([filename, content]) => {
            console.log(`     - ${filename}: "${content}"`);
        });

        console.log('\n7. Ochistka...');
        for (const file of fileList) {
            await fileManager.deleteFile(file);
            console.log(`${file} udalen`);
        }
        
        console.log('\nVse operacii zaversheny!');
        console.log('Kod stal namnogo chishe i chitaemee!');
    } catch (error) {
        console.error('\nOshibka:', error.message);
        console.error('Stack:', error.stack);
    }
}

testFileOperations();