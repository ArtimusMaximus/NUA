const { convertToMilitaryTime } = require("../convert_to_military_time");
const { logger } = require('../server_log_utils/customLogger');
const { endTimeout } = require("../start_&_clear_timeouts/start_end_timeouts");
const { jobFunction } = require("../jobfunction");
const { dateFromDateString } = require("../ez_sched_utils/dateFromDateString");

async function stopBonusTime(deviceId, cancelTimer, schedule, prisma, unifi) {
    try {
        if (cancelTimer) { // cancelling timer/ending timeout from /addbonustoggles
            endTimeout(deviceId);
        }
        const getCronBonusTogglesToDelete = await prisma.cronBonusToggles.findMany({ where: { deviceId: deviceId }});
        const getEasyBonusTogglesToDelete = await prisma.easyBonusToggles.findMany({ where: { deviceId: deviceId }});
        // const getOriginalCrons = await prisma.cron.findMany({ where: { deviceId: deviceId }});
        // console.log('getCronBonusTogglesToDelete\t', getCronBonusTogglesToDelete);
        const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

        let jb;
        for (const bonusToggle of getCronBonusTogglesToDelete) {
            await prisma.cronBonusToggles.delete({ where: { id: bonusToggle.id }});

            const reInitiatedJob = schedule.scheduleJob(bonusToggle.crontime, () => jobFunction(bonusToggle.crontype, bonusToggle.macAddress, false, unifi, prisma));
            // const jobFunction = async (crontype, macAddress, oneTime, unifi, prisma) => {
            jb = reInitiatedJob.name;
            console.log('jb.name: ', jb);
            logger.log('jb.name: ', jb);

            const updateCronToggle = await prisma.cron.update({
                where: { id: bonusToggle.cronRuleIDToggledOff },
                data: {
                    toggleCron: true,
                    jobName: jb
                }
            });
        }
        /////////////////////////////////////////////////////
        for (const bonusToggle of getEasyBonusTogglesToDelete) {
            const { date, hour, minute, ampm, oneTime, macAddress, blockAllow, days } = bonusToggle;

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
                await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }});
            }
        }
        // await unifi.blockClient(getMacAddressForDevice.macAddress);
        // console.log("blockDevice\t", blockDevice);
        const confirmBlocked = await unifi?.blockClient(getMacAddressForDevice.macAddress);
        console.log(`${getMacAddressForDevice.macAddress} has been blocked: ${confirmBlocked}`);
        await prisma.device.update({
            where: { id: deviceId },
            data: {
                active: false
            }
        });

    // res.sendStatus(200);
    } catch (error) {
        console.error(error);
    }
}

module.exports = { stopBonusTime };