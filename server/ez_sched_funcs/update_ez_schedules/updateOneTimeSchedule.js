const { convertToMilitaryTime } = require("../../server_util_funcs/convert_to_military_time");
const { dateFromDateString } = require("../../server_util_funcs/ez_sched_utils/dateFromDateString");
const { validDateModifier } = require('../../server_util_funcs/ez_sched_utils/validDateModifier');


async function updateOneTimeSchedule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, oneTime, deviceId, blockAllow } = data;
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });

    const { year, month, day } = dateFromDateString(date);
    // we do not need modified hour here, as the DB provides already modified hour, only need to pre-cursor zero's (validDateMofidier)
    const dateTime = validDateModifier(year, month-1, day, hour, parseInt(minute), 0); // month -1 (JS starts month @ 0, db stores it as proper month)

    const startNewJobTrue = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));
    return startNewJobTrue;
}

module.exports = { updateOneTimeSchedule };