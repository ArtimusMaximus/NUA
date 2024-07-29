const { convertToMilitaryTime } = require("../../server_util_funcs/convert_to_military_time");
const { dateFromDateString } = require("../../server_util_funcs/ez_sched_utils/dateFromDateString");


async function updateOneTimeSchedule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, oneTime, deviceId, blockAllow } = data;
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    console.log('scheduletype from one time\t', scheduletype)

    const { year, month, day } = dateFromDateString(date);
    const modifiedHour = convertToMilitaryTime(ampm, hour);
    const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);

    const startNewJobTrue = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));

    return startNewJobTrue;
}

module.exports = { updateOneTimeSchedule };