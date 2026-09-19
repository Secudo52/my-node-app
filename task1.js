const fs = require('fs').promises;
const path = require('path');

async function runTask1() {
    const variant = 7; 
    const fileName = `student_${variant}.txt`;
    const filePath = path.join(__dirname, fileName);

    const fileData = [
        "Student: Denishchik Daniil",
        "Gruppa: 477",
        `Variant: ${variant}`,
        `Data: ${new Date().toLocaleString('ru-RU')}`,
        "Lubimye igry:",
        "1. Dota 2",
        "2. Terraria",
        "3. Fear & Hunger",
        "4. DeadLock",
        "5. Alter Ego"
    ];

    try {
        await fs.writeFile(filePath, fileData.join('\n'), 'utf8');
        console.log(`Sozdan fayl: ${fileName}`);

        const content = await fs.readFile(filePath, 'utf8');
        const linesCount = content.split('\n').length;
        await fs.appendFile(filePath, `\nKolichestvo zapisey: ${linesCount + 1}`, 'utf8');

        const finalContent = await fs.readFile(filePath, 'utf8');
        console.log('Soderzhimoe fayla:\n---------------------------------');
        console.log(finalContent);
        console.log('---------------------------------');
    } catch (error) {
        console.error('Oshibka pri vipolnenii Zadaniy 1:', error.message);
    }
}

runTask1();