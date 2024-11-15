
async function bonusTimeEndJobReinitiation(deviceId, schedule, prisma, unifi, jobFunction, logger) {
    try {
        const getBonusTogglesForDevice = await prisma.bonusToggles.findMany({ where: { deviceId: deviceId }});
        // console.log('getBonusTogglesForDevice\t', getBonusTogglesForDevice);

        const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

        let jb;
        for (const bonusToggle of getBonusTogglesForDevice) {
            await prisma.bonusToggles.delete({ where: { id: bonusToggle.id }});

            const reInitiatedJob = schedule.scheduleJob(bonusToggle.crontime, () => jobFunction(bonusToggle.crontype, bonusToggle.macAddress, false, unifi, prisma));
            // const jobFunction = async (crontype, macAddress, oneTime, unifi, prisma) => {
            jb = reInitiatedJob.name;
            console.log('jb.name: ', jb);
            logger.log('jb.name: ', jb);

            const updateCronToggle = await prisma.cron.update({
                where: { id: bonusToggle.cronRuleToggledOff },
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




module.exports = { bonusTimeEndJobReinitiation };