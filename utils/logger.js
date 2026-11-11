const chalk = require('chalk');

function logSuccess(msg) {
    console.log(chalk.green(`✔ ${msg}`));
}

function logError(msg) {
    console.error(chalk.red(`✖ ${msg}`));
}

function logWarning(msg) {
    console.warn(chalk.yellow(`⚠ ${msg}`));
}

function logInfo(msg) {
    console.log(chalk.blue(`ℹ ${msg}`));
}

module.exports = {
    logSuccess,
    logError,
    logWarning,
    logInfo
};
