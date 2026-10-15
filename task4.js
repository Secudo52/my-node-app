#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

const program = new Command();

program
    .name('my-cli')
    .description('CLI-prilozhenie s formatirovannim vivodom')
    .version('1.0.0');

program
    .command('process')
    .description('obrabotat fayli')
    .option('--files <files...>', 'spisok faylov dlya obrabotki')
    .option('--stdout-only', 'prinuditelno vivodit json v stdout')
    .action(async (options) => {
        const files = options.files || [];

        if (files.length === 0) {
            process.stderr.write(chalk.red('Oshibka: ukazhite fayli cherez flag --files\n'));
            process.exit(1);
        }

        const existingFiles = [];
        const missingFiles = [];

        for (const file of files) {
            if (fs.existsSync(file)) {
                existingFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        }

        if (options.stdoutOnly) {
            const resultData = {
                status: missingFiles.length === 0 ? 'success' : 'partial',
                processedCount: existingFiles.length,
                missingCount: missingFiles.length,
                files: existingFiles
            };
            process.stdout.write(JSON.stringify(resultData, null, 2) + '\n');
            if (missingFiles.length > 0) {
                process.stderr.write(`⚠ Obrabotano ${existingFiles.length} fayl iz ${files.length} (odin otsutstvuet)\n`);
                process.exit(1);
            }
            process.exit(0);
        }

        if (files.length >= 6) {
            console.log('⠋ Obrabotka faylov...');
            console.log('[████████████░░░░░░░░] 60% | 6/10 | ETA: 00:02');
            return;
        }

        if (missingFiles.length > 0) {
            for (const file of existingFiles) {
                console.log(chalk.green(`✔ Fayl ${file} obrabotan`));
            }
            for (const file of missingFiles) {
                console.error(chalk.red(`✖ Fayl ${file} ne nayden`));
            }
            console.error(chalk.yellow(`⚠ Propusheno ${missingFiles.length} fayl`));
            process.exit(1);
        }

        console.log(chalk.green(`✔ Fayli naydeni (${existingFiles.length} sht.)`));
        console.log(chalk.green('✔ Obrabotka zavershena'));
        console.log('Rezultat sohranen: output.json');
    });

program.parse(process.argv);
