const ProjectService = require('../services/projectService');
const logger = require('../utils/logger');

function initCommand(cmd) {
    cmd
        .command('init')
        .description('inicializaciya proekta')
        .option('--name <name>', 'nazvanie proekta', 'my-app')
        .option('--type <type>', 'tip proekta', 'cli')
        .action((options) => {
            const res = ProjectService.init(options.name, options.type);
            logger.logSuccess(`Proekt "${res.name}" sozdan`);
            logger.logSuccess('Ustanovleni zavisimosti');
            logger.logSuccess('Inicializirovan Git-repozitoriy');
            console.log('Proekt gotov k rabote!');
        });
}

module.exports = initCommand;
