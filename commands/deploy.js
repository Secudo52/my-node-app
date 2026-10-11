const readline = require('readline');
const ProjectService = require('../services/projectService');
const logger = require('../utils/logger');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

function deployCommand(cmd) {
    cmd
        .command('deploy')
        .description('razvertivanie proekta')
        .option('--env <environment>', 'sreda okruzheniya (staging, production)', 'staging')
        .option('--force', 'prinuditelnoe razvertivanie bez podtverzhdeniya')
        .action(async (options) => {
            if (options.env === 'production' && !options.force) {
                logger.logWarning('Vi sobiraetes razvernut proekt v production!');
                const answer = await askQuestion('Prodolzhit? (y/N) ');
                if (answer.toLowerCase() !== 'y') {
                    console.log('Razvertivanie otmeneno.');
                    return;
                }
            }

            console.log('⠋ Razvertivanie...');
            const res = ProjectService.deploy(options.env, true);
            logger.logSuccess('Razvernuto uspeshno');
            console.log(`URL: ${res.url}`);
        });
}

module.exports = deployCommand;
