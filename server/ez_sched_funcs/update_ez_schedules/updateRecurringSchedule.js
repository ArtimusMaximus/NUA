

async function updateRecurringSchedule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, scheduletype, days } = data;
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    // const { year, month, day } = dateFromDateString(date);
    // const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
    const blockAllow = scheduletype;

    // const daysToInt = days.split("").map((day) => parseInt(day));
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [...modifiedDaysOfTheWeek];
    // rule.dayOfWeek = [...daysToInt];
    // rule.dayOfWeek = [...daysOfTheWeek];
    rule.hour = hour;
    rule.minute = minute;
    const startNewJobTrue = schedule.scheduleJob(rule, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));

    return startNewJobTrue;
}

module.exports = { updateRecurringSchedule };