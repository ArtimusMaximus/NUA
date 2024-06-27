const { convertToMilitaryTime } = require("../server_util_funcs/convert_to_military_time");
const { addEasySchedule } = require("./addEasySchedule");
const { jobFunction } = require("../server_util_funcs/jobfunction");
const { dateFromDateString } = require("../server_util_funcs/ez_sched_utils/dateFromDateString");

async function nodeScheduleRecurrenceRule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, scheduletype } = data;
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    const { year, month, day } = dateFromDateString(date);
    const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
    const blockAllow = scheduletype;
    const scheduleData = {
        year,
        month,
        day,
        date,
        minute,
        ampm,
        modifiedHour,
        modifiedDaysOfTheWeek,
        oneTime
    }
    const rule = new schedule.RecurrenceRule();
    const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
    const daysOfTheWeek = modifiedDaysOfTheWeek;
    rule.dayOfWeek = [...daysOfTheWeek];
    rule.hour = hour;
    rule.minute = minute;
    const startNewJobTrue = schedule.scheduleJob(rule, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));
    addEasySchedule(deviceId, dateTime, scheduletype, scheduleData, startNewJobTrue, prisma);
}

module.exports = { nodeScheduleRecurrenceRule };