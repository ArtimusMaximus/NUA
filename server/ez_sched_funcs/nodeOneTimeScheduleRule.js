const { convertToMilitaryTime } = require("../server_util_funcs/convert_to_military_time");
const { dateFromDateString } = require("../server_util_funcs/ez_sched_utils/dateFromDateString");
const { jobFunction } = require("../server_util_funcs/jobfunction");
const { addEasySchedule } = require("./addEasySchedule");

async function nodeOneTimeScheduleRule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, oneTime, deviceId, blockAllow } = data;
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    const { year, month, day } = dateFromDateString(date);
    const modifiedHour = convertToMilitaryTime(ampm, hour);

    const scheduleData = {
        year,
        month,
        day,
        date,
        minute,
        ampm,
        modifiedHour,
        oneTime
    };

    const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
    const startNewJobTrue = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));
    await addEasySchedule(deviceId, blockAllow, scheduleData, startNewJobTrue, prisma); // -- do easy schedule in end point, not in function?
    return startNewJobTrue;
}

module.exports = { nodeOneTimeScheduleRule };