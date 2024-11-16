
async function cronBonusTimeEndJobReinitiation(deviceId, schedule, prisma, unifi, jobFunction, logger) {
    try {
        const getCronBonusTogglesForDevice = await prisma.cronBonusToggles.findMany({ where: { deviceId: deviceId }});
        // console.log('getCronBonusTogglesForDevice\t', getCronBonusTogglesForDevice);

        const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

        let jb;
        for (const bonusToggle of getCronBonusTogglesForDevice) {
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
        const blockDevice = await unifi.blockClient(getMacAddressForDevice.macAddress);
        // console.log("blockDevice\t", blockDevice);
        const updateDeviceStatus = await prisma.device.update({
            where: { id: deviceId },
            data: {
                active: false
            }
        });


    } catch (error) {
        console.error(error);
    }
}




module.exports = { cronBonusTimeEndJobReinitiation };