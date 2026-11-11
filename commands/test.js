const ProjectService = require('../services/projectService');
const logger = require('../utils/logger');

function testCommand(cmd) {
    cmd
        .command('test')
        .description('zapusk testov')
        .action(() => {
            console.log('⠋ Zapusk testov...');
            const res = ProjectService.test();
            logger.logSuccess(`Proydeno: ${res.passed}/${res.total} testov`);
            logger.logSuccess(`Pokritie: ${res.coverage}`);
        });
}

module.exports = testCommand;
