const { convertToMilitaryTime } = require("../../server_util_funcs/convert_to_military_time");


async function updateRecurringSchedule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, blockAllow, days } = data; // gets data from
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
    const rule = new schedule.RecurrenceRule();
    // rule.dayOfWeek = [...daysToInt]; // commented out 07/18/2024, days is not passed from front end, modifiedDOTW is...
    rule.dayOfWeek = [...modifiedDaysOfTheWeek]; // commented out 07 12 2024 && commented back in 07 18 2024
    rule.hour = hour;
    rule.minute = minute;
    const startNewJobTrue = schedule.scheduleJob(rule, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));

    return startNewJobTrue;
}

module.exports = { updateRecurringSchedule };