const ProjectService = require('../services/projectService');
const logger = require('../utils/logger');

function buildCommand(cmd) {
    cmd
        .command('build')
        .description('sborka proekta')
        .option('--config <path>', 'put k faylu konfiguracii')
        .option('--dry-run', 'testoviy zapusk bez izmeneniya faylov')
        .action((options) => {
            console.log('⠋ Sborka proekta...');
            try {
                const res = ProjectService.build(options.config, options.dryRun);
                logger.logSuccess(`Sborka zavershena za ${res.time || '1.0s'}`);
                console.log(`Rezultat: ${res.outputFile}`);
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    logger.logError(err.message);
                    console.error(err.stack);
                } else if (process.env.NODE_ENV === 'production') {
                    logger.logError(`fayl ${options.config || 'config.json'} ne nayden`);
                } else {
                    logger.logError('fayl konfiguracii ne nayden');
                    console.log('  Ukazhite put cherez --config');
                    console.log(`  Podrobnosti: ${options.config || 'config.json'} otsutstvuet v korne proekta`);
                }
                process.exit(1);
            }
        });
}

module.exports = buildCommand;
