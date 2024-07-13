const { convertDOWtoString } = require("../server_util_funcs/ez_sched_utils/convertDOWtoString");
const { convertStringToBool } = require("../server_util_funcs/convert_string_to_bool");


async function addEasySchedule(deviceId, blockAllow, scheduleData, startNewJobTrue, prisma) {
// async function addEasySchedule(deviceId, dateTime, blockAllow, scheduleData, startNewJobTrue, prisma) {
    const { month, day, minute, modifiedHour, ampm, date, oneTime, modifiedDaysOfTheWeek } = scheduleData;

    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } }); // deviceToSchedule.macAddress
    let boolOneTime = convertStringToBool(oneTime);
    try {
        if (boolOneTime && startNewJobTrue) {
            console.log("boolOneTime && startNewJobTrue from addEasy");
                const addToDB = await prisma.easySchedule.create({ // create easySched
                    data: {
                        month: month,
                        // days: day,
                        minute: parseInt(minute),
                        hour: modifiedHour,
                        ampm: ampm,
                        date: date,
                        blockAllow: blockAllow,
                        jobName: startNewJobTrue.name,
                        toggleSched: true,
                        oneTime: boolOneTime,
                        device: {
                            connect: { id: deviceToSchedule.id }
                        },
                    }
                });

        } else if (!boolOneTime && startNewJobTrue) {
            console.log("!boolOneTime && startNewJobTrue from addEasy");
            const stringDays = convertDOWtoString(modifiedDaysOfTheWeek.join(""));
            const addToDB = await prisma.easySchedule.create({ // create easySched
                data: {
                    month: month,
                    days: stringDays,
                    minute: parseInt(minute),
                    hour: modifiedHour,
                    ampm: ampm,
                    date: null,
                    blockAllow: blockAllow,
                    jobName: startNewJobTrue.name,
                    toggleSched: true,
                    oneTime: boolOneTime,
                    device: {
                        connect: { id: deviceToSchedule.id }
                    },
                }
            });
        }
        else {
            throw new Error("startNewJob false...");
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { addEasySchedule };