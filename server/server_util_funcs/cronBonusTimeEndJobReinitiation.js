
const schedule = require('node-schedule');

async function cronBonusTimeEndJobReinitiation(deviceId, _schedule, prisma, unifi, jobFunction, logger) {
  try {
    const getCronBonusTogglesForDevice = await prisma.cronBonusToggles.findMany({ where: { deviceId: deviceId }});

    if (!getCronBonusTogglesForDevice || getCronBonusTogglesForDevice.length === 0) {
      console.warn('[cronBonusTimeEndJobReinitiation] No cron bonus toggles found for device:', deviceId);
      return;
    }

    const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});
        
    if (!getMacAddressForDevice) {
      throw new Error(`Device with ID ${deviceId} not found`);
    }

    let jb;
    let errors = [];
    for (const bonusToggle of getCronBonusTogglesForDevice) {
      try {
        await prisma.cronBonusToggles.delete({ where: { id: bonusToggle.id }});

        const reInitiatedJob = schedule.scheduleJob(bonusToggle.crontime, () => jobFunction(bonusToggle.crontype, bonusToggle.macAddress, false, unifi, prisma));
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
      } catch (jobError) {
        const errorMsg = `Failed to re-initiate cron job for toggle ID ${bonusToggle.id}: ${jobError.message}`;
        console.error('[cronBonusTimeEndJobReinitiation]', errorMsg);
        errors.push(errorMsg);
        // Continue processing other toggles instead of failing entirely
      }
    }

    // unifi may be null during boot-time re-arm before the controller connects
    const blockDevice = await unifi?.blockClient(getMacAddressForDevice.macAddress);
    const updateDeviceStatus = await prisma.device.update({
      where: { id: deviceId },
      data: {
        active: false
      }
    });

    if (errors.length > 0) {
      throw new Error(`Completed with ${errors.length} error(s): ${errors.join('; ')}`);
    }


  } catch (error) {
    console.error('[cronBonusTimeEndJobReinitiation] Critical error:', error);
    logger?.log('Critical error in cronBonusTimeEndJobReinitiation:', error.message);
    throw error; // Re-throw so the caller knows something went wrong
  }
}




module.exports = { cronBonusTimeEndJobReinitiation };