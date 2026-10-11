#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
    .name('my-cli')
    .description('CLI-prilozhenie dlya laboratornoy raboti No17')
    .version('1.0.0', '-V, --version', 'output the version number')
    .option('-v, --verbose', 'podrobniy vivod');

program
    .command('generate')
    .description('sgenerirovat otchet')
    .option('-t, --type <type>', 'tip otcheta (po umolchaniyu: "html")', 'html')
    .option('-o, --output <path>', 'put dlya sohraneniya')
    .option('-f, --force', 'perezapisat sushestvuyushiy fayl')
    .option('--dry-run', 'pokazat chto budet sdelano bez vipolneniya')
    .action((options) => {
        const globalOptions = program.opts();
        const validTypes = ['html', 'pdf', 'json', 'csv'];

        if (!validTypes.includes(options.type)) {
            console.error(`Oshibka: nedopustimiy tip otcheta "${options.type}".`);
            console.error(`Dopustimie znacheniya: ${validTypes.join(', ')}`);
            process.exit(1);
        }

        const outputPath = options.output || `./output.${options.type}`;

        if (options.dryRun) {
            console.log(`[DRY-RUN] Budet sgenerirovan otchet tipa: ${options.type}`);
            console.log(`[DRY-RUN] Fayl budet sohranen v: ${outputPath}`);
            console.log(`[DRY-RUN] Deystviya ne vipolneni (rezhim proverki)`);
            return;
        }

        if (globalOptions.verbose) {
            console.log(`[VERBOSE] Zapusk generacii otcheta...`);
            console.log(`[VERBOSE] Tip otcheta: ${options.type}`);
            console.log(`[VERBOSE] Put sohraneniya: ${outputPath}`);
        }

        console.log(`Otchet uspeshno sgenerirovan: ${outputPath}`);
    });

program
    .command('convert')
    .description('konvertirovat fayl')
    .option('-i, --input <path>', 'ishodniy fayl')
    .option('-o, --output <path>', 'vihodniy fayl')
    .action((options) => {
        console.log(`Konvertaciya ${options.input || 'fayla'} vipolnena.`);
    });

program.parse(process.argv);