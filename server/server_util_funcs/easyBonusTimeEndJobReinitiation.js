const { convertToMilitaryTime } = require("./convert_to_military_time");
const { dateFromDateString } = require("./ez_sched_utils/dateFromDateString");



async function easyBonusTimeEndJobReinitiation(deviceId, schedule, prisma, unifi, jobFunction, logger) {
    try {
        const getEasyBonusTogglesForDevice = await prisma.easyBonusToggles.findMany({ where: { deviceId: deviceId }});
        // console.log('getEasyBonusTogglesForDevice\t', getEasyBonusTogglesForDevice);
        const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

        let jb;
        for (const bonusToggle of getEasyBonusTogglesForDevice) {

            const { date, hour, minute, ampm, oneTime, macAddress, blockAllow, days } = bonusToggle;
            // const scheduleData = {
                //     // year,
                //     // month,
                //     // day,
                //     date,
                //     minute,
                //     ampm,
                //     modifiedHour,
                //     modifiedDaysOfTheWeek, // modified as in how?: "0123" to [0,1,2,3]
                //     oneTime
                // }
                // const data = { ...bonusToggle };
                // console.log('bonusToggle data\t', data);
                const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
            if (!oneTime) {
                ////////////////////////////////////////
                const modifiedDaysOfTheWeek = days && days.split("").map((day) => parseInt(day));
                const rule = new schedule.RecurrenceRule();
                rule.dayOfWeek = [...modifiedDaysOfTheWeek];
                rule.hour = modifiedHour;
                rule.minute = parseInt(minute);
                const reInitiatedJob = schedule.scheduleJob(rule, () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma));
                jb = reInitiatedJob.name;

                console.log('jb.name: ', jb);
                logger.log('Job re-initiated: ', reInitiatedJob);

                await prisma.easySchedule.update({ // put original ez schedule back as was
                    where: { id: bonusToggle.easyRuleIDToggledOff },
                    data: {
                        toggleSched: true,
                        jobName: jb
                    }
                });
                await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }}); // delete easyToggle
                /////////////////////////////////////////
            } else { // oneTime schedule
                const { year, month, day } = dateFromDateString(date);
                const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
                const reInitiatedJob = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma));
                jb = reInitiatedJob.name;
                console.log('jb.name: ', jb);
                logger.log('Job re-initiated: ', reInitiatedJob);

                await prisma.easySchedule.update({ // put original ez schedule back as was
                    where: { id: bonusToggle.easyRuleIDToggledOff },
                    data: {
                        toggleSched: true,
                        jobName: jb
                    }
                });
                await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }}); // delete easyToggle
            }

        }

        await unifi.blockClient(getMacAddressForDevice.macAddress); // why? to turn the device off after bonus time is over...
        await prisma.device.update({
            where: { id: deviceId },
            data: {
                active: false
            }
        });


    } catch (error) {
        console.error(error);
    }
}

module.exports = { easyBonusTimeEndJobReinitiation };