

async function updateRecurringSchedule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, scheduletype, days } = data; // gets data from
    // console.log('modifiedDaysOfTheWeek\t', modifiedDaysOfTheWeek);
    // console.log('modifiedDaysOfTheWeek\t', modifiedDaysOfTheWeek, typeof modifiedDaysOfTheWeek);
    // console.log("days from updaterecurringsched\t", days);
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    // const { year, month, day } = dateFromDateString(date);
    // const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
    const blockAllow = scheduletype;

    // console.log("days\t", days, typeof days) // 07 18 2024, days is not passed from the front end or in routes/ezscheduleroutes.js // will be undefined
    // const daysToInt = days.split("").map((day) => parseInt(day)); // look deeper into why modifiedDaysOfTheWeek was not iterable upon job re-initiation on outdated onetime jobs
    const rule = new schedule.RecurrenceRule();
    // rule.dayOfWeek = [...daysToInt]; // commented out 07/18/2024, days is not passed from front end, modifiedDOTW is...
    rule.dayOfWeek = [...modifiedDaysOfTheWeek]; // commented out 07 12 2024 && commented back in 07 18 2024
    // rule.dayOfWeek = [...daysToInt];
    // rule.dayOfWeek = [...daysOfTheWeek];
    rule.hour = hour;
    rule.minute = minute;
    const startNewJobTrue = schedule.scheduleJob(rule, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));

    return startNewJobTrue;
}

module.exports = { updateRecurringSchedule };