const { dateFromDateString } = require("./dateFromDateString");


async function deleteCompletedJobs(prisma) {
    const easySchedList = await prisma.easySchedule.findMany();
    const oneTimeSchedulesOnly = easySchedList.filter((sched) => sched.oneTime);
    if (oneTimeSchedulesOnly.length) {
        let currentDate = new Date();
        let aux = [];
        oneTimeSchedulesOnly.forEach((s) => {
            const { year, month, day } = dateFromDateString(s.date);
            let scheduledDate = new Date(year, month-1, day, s.hour, s.minute);
            s.scheduledDate = scheduledDate;
            if (s.scheduledDate < currentDate) {
                aux.push({ ...s });
            }
        });
        for (const job of aux) {
            const deleteOldJob = await prisma.easySchedule.delete({ where: { id: job.id } });
            console.log('Completed job deleted:\t', deleteOldJob)
        }
    }
}

module.exports = { deleteCompletedJobs };

