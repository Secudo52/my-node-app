#!/usr/bin/env node

const { Command } = require('commander');
const initCommand = require('../commands/init');
const buildCommand = require('../commands/build');
const testCommand = require('../commands/test');
const deployCommand = require('../commands/deploy');
const logger = require('../utils/logger');

process.on('uncaughtException', (err) => {
    if (process.env.NODE_ENV === 'development') {
        logger.logError(err.message);
        console.error(err.stack);
    } else {
        logger.logError(err.message);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    if (process.env.NODE_ENV === 'development') {
        logger.logError(String(reason));
    } else {
        logger.logError('Neobrabotannaya oshibka asinhronnoy operacii');
    }
    process.exit(1);
});

const program = new Command();

program
    .name('my-cli')
    .description('Polnocennoe arhitekturnoe CLI-prilozhenie gruppi 477')
    .version('1.0.0');

initCommand(program);
buildCommand(program);
testCommand(program);
deployCommand(program);

program.parse(process.argv);
