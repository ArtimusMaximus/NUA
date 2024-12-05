const fs = require('fs');
const { Console } = require('node:console');

const output = fs.createWriteStream('./config/server_logs/stdout.log');
const errorOutput = fs.createWriteStream('./config/server_logs/stderr.log');


const logger = new Console({ stdout: output, stderr: errorOutput });

module.exports = { logger };