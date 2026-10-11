#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');

async function readAllStdin() {
    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            return resolve('');
        }
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', chunk => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            resolve(data.trim());
        });
        process.stdin.resume();
        setTimeout(() => {
            resolve(data.trim());
        }, 300);
    });
}

const program = new Command();

program
    .name('my-cli')
    .description('CLI-prilozhenie s podderzhkoy interaktivnogo rezhima')
    .version('1.0.0');

program
    .command('init')
    .description('inicializirovat proekt')
    .option('--name <name>', 'nazvanie proekta')
    .option('--type <type>', 'tip proekta (web, cli, library, microservice)')
    .option('--typescript', 'ispolzovat TypeScript')
    .option('--eslint', 'ispolzovat ESLint')
    .option('--prettier', 'ispolzovat Prettier')
    .option('--jest', 'ispolzovat Jest')
    .option('--git', 'ispolzovat Git')
    .option('--no-git', 'ne ispolzovat Git')
    .option('--token <token>', 'token dostupa')
    .option('--no-interactive', 'otklyuchit interaktivniy rezhim')
    .action(async (options) => {
        let isInteractive = options.interactive !== false;

        let pipedInput = '';
        if (!process.stdin.isTTY) {
            pipedInput = await readAllStdin();
        }

        if (pipedInput && !options.name) {
            options.name = pipedInput;
        }

        if (options.name && options.type) {
            isInteractive = false;
        }

        if (!isInteractive) {
            if (!options.name && !options.type) {
                console.error('Oshibka: v neinteraktivnom rezhime neobhodimo ukazat --name i --type');
                process.exit(1);
            }
            if (!options.type) {
                console.error('Oshibka: nedostatochno dannih. Ukazhite --type');
                process.exit(1);
            }
            if (!options.name) {
                console.error('Oshibka: nedostatochno dannih. Ukazhite --name');
                process.exit(1);
            }

            const chosenOptions = [];
            if (options.typescript) chosenOptions.push('TypeScript');
            if (options.eslint) chosenOptions.push('ESLint');
            if (options.prettier) chosenOptions.push('Prettier');
            if (options.jest) chosenOptions.push('Jest');

            const typeMap = {
                cli: 'CLI-utilita',
                web: 'Web-prilozhenie',
                library: 'Biblioteka',
                microservice: 'Mikroservis'
            };

            console.log(`✓ Proekt "${options.name}" uspeshno inicializirovan!`);
            console.log(`  Tip: ${typeMap[options.type] || options.type}`);
            console.log(`  Opcii: ${chosenOptions.length ? chosenOptions.join(', ') : 'net'}`);
            console.log(`  Git: ${options.git ? 'da' : 'net'}`);
            process.exit(0);
        }

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Vvedite nazvanie proekta:',
                default: options.name || 'my-project'
            },
            {
                type: 'list',
                name: 'type',
                message: 'Viberite tip proekta:',
                choices: [
                    { name: 'Web-prilozhenie', value: 'Web-prilozhenie' },
                    { name: 'CLI-utilita', value: 'CLI-utilita' },
                    { name: 'Biblioteka', value: 'Biblioteka' },
                    { name: 'Mikroservis', value: 'Mikroservis' }
                ],
                default: 1
            },
            {
                type: 'checkbox',
                name: 'features',
                message: 'Viberite dopolnitelnie opcii:',
                choices: [
                    { name: 'TypeScript', checked: true },
                    { name: 'ESLint', checked: false },
                    { name: 'Prettier', checked: true },
                    { name: 'Jest', checked: false }
                ]
            },
            {
                type: 'confirm',
                name: 'git',
                message: 'Ispolzovat Git?',
                default: true
            },
            {
                type: 'password',
                name: 'token',
                message: 'Vvedite token dostupa:',
                mask: '*'
            }
        ]);

        console.log(`\n✓ Proekt "${answers.name}" uspeshno inicializirovan!`);
        console.log(`  Tip: ${answers.type}`);
        console.log(`  Opcii: ${answers.features.join(', ')}`);
        console.log(`  Git: ${answers.git ? 'da' : 'net'}`);
    });

program.parse(process.argv);