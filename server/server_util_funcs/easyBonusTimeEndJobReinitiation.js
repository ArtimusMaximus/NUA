const { convertToMilitaryTime } = require('./convert_to_military_time');
const { dateFromDateString } = require('./ez_sched_utils/dateFromDateString');
const schedule = require('node-schedule');



async function easyBonusTimeEndJobReinitiation(deviceId, _schedule, prisma, unifi, jobFunction, logger) {
  try {
    const getEasyBonusTogglesForDevice = await prisma.easyBonusToggles.findMany({ where: { deviceId: deviceId }});

    if (!getEasyBonusTogglesForDevice || getEasyBonusTogglesForDevice.length === 0) {
      console.warn('[easyBonusTimeEndJobReinitiation] No easy bonus toggles found for device:', deviceId);
      return;
    }

    const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});
        
    if (!getMacAddressForDevice) {
      throw new Error(`Device with ID ${deviceId} not found`);
    }

    let jb;
    let errors = [];
    for (const bonusToggle of getEasyBonusTogglesForDevice) {
      try {
        const { date, hour, minute, ampm, oneTime, macAddress, blockAllow, days } = bonusToggle;
        const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
                
        if (!oneTime) {
          const modifiedDaysOfTheWeek = days && days.split('').map((day) => parseInt(day));
          const rule = new schedule.RecurrenceRule();
          rule.dayOfWeek = [...modifiedDaysOfTheWeek];
          rule.hour = modifiedHour;
          rule.minute = parseInt(minute);
          const reInitiatedJob = schedule.scheduleJob(rule, () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma));
          jb = reInitiatedJob.name;

          console.log('jb.name: ', jb);
          logger?.log('Job re-initiated: ', reInitiatedJob);

          await prisma.easySchedule.update({
            where: { id: bonusToggle.easyRuleIDToggledOff },
            data: {
              toggleSched: true,
              jobName: jb
            }
          });
          await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }});
        } else { // oneTime schedule
          const { year, month, day } = dateFromDateString(date);
          const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
          const reInitiatedJob = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma));
          jb = reInitiatedJob.name;
          console.log('jb.name: ', jb);
          logger?.log('Job re-initiated: ', reInitiatedJob);

          await prisma.easySchedule.update({
            where: { id: bonusToggle.easyRuleIDToggledOff },
            data: {
              toggleSched: true,
              jobName: jb
            }
          });
          await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }}); // delete easyToggle
        }
      } catch (jobError) {
        const errorMsg = `Failed to re-initiate easy bonus toggle for device ${deviceId}, toggle ID ${bonusToggle.id}: ${jobError.message}`;
        console.error('[easyBonusTimeEndJobReinitiation]', errorMsg);
        errors.push(errorMsg);
        // Continue processing other toggles instead of failing entirely
      }
    }

    // unifi may be null during boot-time re-arm before the controller connects
    await unifi?.blockClient(getMacAddressForDevice.macAddress);
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        active: false
      }
    });

    if (errors.length > 0) {
      throw new Error(`Completed with ${errors.length} error(s): ${errors.join('; ')}`);
    }

  } catch (error) {
    console.error('[easyBonusTimeEndJobReinitiation] Critical error:', error);
    logger?.log('Critical error in easyBonusTimeEndJobReinitiation:', error.message);
    throw error; // Re-throw so the caller knows something went wrong
  }
}

module.exports = { easyBonusTimeEndJobReinitiation };