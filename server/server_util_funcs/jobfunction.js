const { deleteCompletedJobs } = require("./ez_sched_utils/deleteCompletedJobs");
const { red } = require("./red");

const jobFunction = async (crontype, macAddress, oneTime, unifi, prisma) => { // for crons & easy?
    try {
        if (crontype === undefined) throw new Error("**block/allow must be specified for jobFunction, undefined was passed!**");
        if (crontype === 'allow') {
            // console.log('unifi === undefined \t', unifi === undefined);
            const confirmAllow = await unifi?.unblockClient(macAddress);
            console.log(`${macAddress} has been unblocked: ${confirmAllow}`);
            if (oneTime) {
                deleteCompletedJobs(prisma);
            }
        } else if (crontype === 'block') {
            const confirmBlocked = await unifi?.blockClient(macAddress);
            console.log(`${macAddress} has been blocked: ${confirmBlocked}`);
            if (oneTime) {
                deleteCompletedJobs(prisma);
            }
        }
    } catch (error) {
        red('~~~~~~CATCH BLOCK IN JOB FUNCITON~~~~~~', 'red');
        console.error(error);
    }
}

module.exports = { jobFunction };