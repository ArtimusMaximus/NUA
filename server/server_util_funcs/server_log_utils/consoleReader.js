const { stdin: input, stdout: output } = require('node:process');
const readline = require('node:readline');


function consoleReader(schedule) {
    const rl = new readline.createInterface({ input, output });
    rl.on('line', (input) => {
        if (input === "show running") {
            // console.info('Running Logs: ...');
            const j = schedule.scheduledJobs;
            for (const job in j) {
                console.info(`Scheduled Jobs: \t${job}`);
            }
        } else {
            console.info("Type '!' for list of commands...");
        }

    });
}

module.exports = { consoleReader };