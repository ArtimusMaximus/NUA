/**
 * Bonus Scheduler Module
 * 
 * Handles bonus time scheduling logic including:
 * - Starting bonus time (pausing active schedules, creating bonus toggle records)
 * - Ending bonus time (re-initiating paused jobs, cleaning up bonus toggles)
 * - Timer management via startTimeout/endTimeout utilities
 */

const { cronBonusTimeEndJobReinitiation } = require('../server_util_funcs/cronBonusTimeEndJobReinitiation');
const { easyBonusTimeEndJobReinitiation } = require('../server_util_funcs/easyBonusTimeEndJobReinitiation');
const { convertToMilitaryTime } = require('../server_util_funcs/convert_to_military_time');
const { minutesHoursToMilli } = require('../server_util_funcs/minutesHoursToMilli');
const { startTimeout, endTimeout, startTimeoutFromExpiry } = require('../server_util_funcs/start_&_clear_timeouts/start_end_timeouts');

/**
 * Start bonus time for a device
 * Pauses all active schedules and creates bonus toggle records to restore them later
 */
async function startBonusTime(deviceId, hours, minutes, unifi, prisma, schedulerService, originalTime=null) {
  // Enable bonus time on device
  // originalTime (ms remaining) lets additional time extend from the current expiry
  const extraMs = originalTime ? Math.max(originalTime, 0) : 0;
  const expiresAt = new Date(Date.now() + extraMs + minutesHoursToMilli(minutes, hours));
  await prisma.device.update({
    where: { id: deviceId },
    data: { bonusTimeActive: true, bonusTimeExpiresAt: expiresAt }
  });

  const getMacAddressForDevice = await prisma.device.findUnique({ 
    where: { id: deviceId }
  });
  console.log('getMacAddressForDevice\t', getMacAddressForDevice);

  // Unblock device if it's currently blocked
  if (getMacAddressForDevice.active === false) {
    console.log('getMacAddressForDevice.active === false', getMacAddressForDevice.active === false);
    const confirmAllow = await unifi?.unblockClient(getMacAddressForDevice.macAddress);
    console.log(`${getMacAddressForDevice.macAddress} has been unblocked: ${confirmAllow}`);
    await prisma.device.update({
      where: { id: deviceId },
      data: { active: true }
    });
  }

  // Get all active schedules for this device
  const getEasyDevices = await prisma.easySchedule.findMany({ 
    where: { deviceId: deviceId }
  });
  const getCrons = await prisma.cron.findMany({ 
    where: { deviceId: deviceId }
  });

  // Pause Easy Schedules and create bonus toggle records
  for (const easyRule of getEasyDevices) {
    if (easyRule.toggleSched) {
      console.log('easyRule toggleSched = true\t', easyRule);
      
      // Cancel the scheduled job
      const cancelled = await schedulerService.cancelJob(easyRule.jobName);
      console.log('cancelled\t', cancelled);
      
      if (cancelled) {
        // Update schedule to show it's paused
        await prisma.easySchedule.update({
          where: { id: easyRule.id },
          data: { toggleSched: false }
        });

        // Create bonus toggle record to restore later
        await prisma.easyBonusToggles.create({
          data: {
            easyRuleIDToggledOff: easyRule.id,
            blockAllow: easyRule.blockAllow,
            macAddress: getMacAddressForDevice.macAddress,
            toggleSched: easyRule.toggleSched,
            oneTime: easyRule.oneTime,
            date: easyRule.date,
            ampm: easyRule.ampm,
            hour: easyRule.hour,
            minute: easyRule.minute,
            days: easyRule.days,
            month: easyRule.month,
            device: {
              connect: { id: easyRule.deviceId }
            }
          }
        });
      }
    }
  }

  // Pause Cron Schedules and create bonus toggle records
  for (const cronRule of getCrons) {
    console.log('cronRule.toggleSched\t', cronRule.id, cronRule.toggleCron);

    if (cronRule.toggleCron) {
      const cancelled = await schedulerService.cancelJob(cronRule.jobName);
      console.log('Cancelled Bonus Button Job?: ', cancelled);

      if (cancelled) {
        // Update schedule to show it's paused
        await prisma.cron.update({
          where: { id: cronRule.id },
          data: { toggleCron: false }
        });

        // Create bonus toggle record to restore later
        await prisma.cronBonusToggles.create({
          data: {
            cronRuleIDToggledOff: cronRule.id,
            crontype: cronRule.crontype,
            crontime: cronRule.crontime,
            macAddress: getMacAddressForDevice.macAddress,
            device: {
              connect: { id: cronRule.deviceId }
            }
          }
        });
      }
    }
  }

  return { pausedEasyCount: getEasyDevices.length, pausedCronCount: getCrons.length };
}

/**
 * Restart paused jobs after bonus time ends
 */
async function restartPausedJobs(deviceId, unifi, prisma, jobFunction, schedulerService) {
  try {
    // Re-initiate cron schedules
    await cronBonusTimeEndJobReinitiation(deviceId, undefined, prisma, unifi, jobFunction);
    
    // Re-initiate easy schedules
    await easyBonusTimeEndJobReinitiation(deviceId, undefined, prisma, unifi, jobFunction);
    
    // Disable bonus time on device
    await prisma.device.update({
      where: { id: deviceId },
      data: { bonusTimeActive: false, bonusTimeExpiresAt: null }
    });
  } catch (error) {
    console.error('Error in restartPausedJobs:', error);
  }
}

/**
 * Delete bonus toggles and re-initiate all paused jobs for a device
 */
async function deleteBonusToggles(deviceId, unifi, prisma, jobFunction, schedulerService, logger) {
  const getCronBonusTogglesToDelete = await prisma.cronBonusToggles.findMany({ 
    where: { deviceId: deviceId }
  });
  const getEasyBonusTogglesToDelete = await prisma.easyBonusToggles.findMany({ 
    where: { deviceId: deviceId }
  });

  // Restore cron schedules
  for (const bonusToggle of getCronBonusTogglesToDelete) {
    await prisma.cronBonusToggles.delete({ 
      where: { id: bonusToggle.id } 
    });

    const reInitiatedJob = await schedulerService.createCronJob(
      bonusToggle.crontime,
      () => jobFunction(bonusToggle.crontype, bonusToggle.macAddress, false, unifi, prisma)
    );
    
    console.log('jb.name: ', reInitiatedJob.name);
    logger?.log('jb.name: ', reInitiatedJob.name);

    await prisma.cron.update({
      where: { id: bonusToggle.cronRuleIDToggledOff },
      data: {
        toggleCron: true,
        jobName: reInitiatedJob.name
      }
    });
  }

  // Restore easy schedules
  for (const bonusToggle of getEasyBonusTogglesToDelete) {
    const { date, hour, minute, ampm, oneTime, macAddress, blockAllow, days } = bonusToggle;

    if (!oneTime) {
      // Recurring schedule - use schedulerService helper
      const rule = await schedulerService.buildRecurringRule({
        modifiedDaysOfTheWeek: days?.split('').map((day) => parseInt(day)) || [],
        hour: convertToMilitaryTime(ampm, parseInt(hour)),
        minute: parseInt(minute)
      });

      const reInitiatedJob = await schedulerService.createCronJob(
        rule,
        () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma)
      );
      
      console.log('jb.name: ', reInitiatedJob.name);
      logger?.log('Job re-initiated: ', reInitiatedJob);

      await prisma.easySchedule.update({
        where: { id: bonusToggle.easyRuleIDToggledOff },
        data: {
          toggleSched: true,
          jobName: reInitiatedJob.name
        }
      });
    } else {
      // One-time schedule - use schedulerService helper
      const oneTimeDate = await schedulerService.buildOneTimeDate(date, ampm, hour, minute);
      
      const reInitiatedJob = await schedulerService.createOneTimeJob(
        oneTimeDate,
        () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma)
      );
      
      console.log('jb.name: ', reInitiatedJob.name);
      logger?.log('Job re-initiated: ', reInitiatedJob);

      await prisma.easySchedule.update({
        where: { id: bonusToggle.easyRuleIDToggledOff },
        data: {
          toggleSched: true,
          jobName: reInitiatedJob.name
        }
      });
    }

    await prisma.easyBonusToggles.delete({ 
      where: { id: bonusToggle.id } 
    });
  }

  return { restoredCronCount: getCronBonusTogglesToDelete.length, restoredEasyCount: getEasyBonusTogglesToDelete.length };
}

/**
 * Clear the persisted bonus-time expiry for a device.
 * Called when bonus time is stopped via cancel/block paths.
 */
async function clearBonusTimeExpiry(deviceId, prisma) {
  await prisma.device.update({
    where: { id: deviceId },
    data: { bonusTimeActive: false, bonusTimeExpiresAt: null }
  });
}

/**
 * Boot-time restore for device bonus time. Re-arms timers for devices whose
 * expiry is still in the future; immediately ends bonus time (restarting paused
 * schedules) for devices whose expiry already passed while the container was down.
 */
async function reArmDeviceBonusOnBoot(unifi, prisma, jobFunction, schedulerService) {
  let rearmed = 0;
  let expired = 0;

  const devices = await prisma.device.findMany({
    where: { bonusTimeExpiresAt: { not: null } }
  });

  for (const device of devices) {
    const expiresAt = new Date(device.bonusTimeExpiresAt).getTime();
    const remaining = expiresAt - Date.now();

    if (remaining > 0) {
      // Still in bonus time — re-arm the timer keyed by deviceId
      startTimeoutFromExpiry(device.id, expiresAt, async () => {
        await restartPausedJobs(device.id, unifi, prisma, jobFunction, schedulerService);
        endTimeout(device.id);
      });
      rearmed++;
    } else {
      // Bonus time already elapsed while down — restore schedules now
      await restartPausedJobs(device.id, unifi, prisma, jobFunction, schedulerService);
      expired++;
    }
  }

  return { rearmed, expired };
}

module.exports = {
  startBonusTime,
  restartPausedJobs,
  deleteBonusToggles,
  clearBonusTimeExpiry,
  reArmDeviceBonusOnBoot
};
