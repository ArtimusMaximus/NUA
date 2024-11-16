

async function easyBonusTimeEndJobReinitiation(deviceId, schedule, prisma, unifi, jobFunction, logger) {
    try {
        const getEasyBonusTogglesForDevice = await prisma.easyBonusToggles.findMany({ where: { deviceId: deviceId }});
        // console.log('getEasyBonusTogglesForDevice\t', getEasyBonusTogglesForDevice);
        const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

        let jb;
        for (const bonusToggle of getEasyBonusTogglesForDevice) {
            await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }});
////////////////////////////////////////

        // const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
        // const scheduleData = {
        //     // year,
        //     // month,
        //     // day,
        //     date,
        //     minute,
        //     ampm,
        //     modifiedHour,
        //     modifiedDaysOfTheWeek,
        //     oneTime
        // }
        const data = { ...bonusToggle };
        console.log('bonusToggle data\t', data);
        // const rule = new schedule.RecurrenceRule();
        // rule.dayOfWeek = [...modifiedDaysOfTheWeek];
        // rule.hour = modifiedHour;
        // rule.minute = parseInt(minute);

/////////////////////////////////////////
            // const reInitiatedJob = schedule.scheduleJob(rule, () => jobFunction(bonusToggle.blockAllow, bonusToggle.macAddress, false, unifi, prisma));
            // // const jobFunction = async (crontype, macAddress, oneTime, unifi, prisma) => {
            // jb = reInitiatedJob.name;
            // console.log('jb.name: ', jb);
            // logger.log('jb.name: ', jb);

            // const updateEasyToggle = await prisma.easySchedule.update({
            //     where: { id: bonusToggle.easyRuleIDToggledOff },
            //     data: {
            //         toggleSched: true,
            //         jobName: jb
            //     }
            // });
        }

        await unifi.blockClient(getMacAddressForDevice.macAddress); // why?
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