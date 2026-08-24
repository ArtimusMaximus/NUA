const schedule = require('node-schedule');
const { convertToMilitaryTime } = require('../server_util_funcs/convert_to_military_time');
const { dateFromDateString } = require('../server_util_funcs/ez_sched_utils/dateFromDateString');
const { validDateModifier } = require('../server_util_funcs/ez_sched_utils/validDateModifier');

/**
 * Central scheduler service for NUA server.
 * Extracts all duplicated scheduling logic from app.js into reusable, testable functions.
 */

// ============================================================================
// Job Creation Functions
// ============================================================================

/**
 * Schedule a one-time job at a specific date/time.
 * @param {Date} dateTime - The Date object when the job should fire
 * @param {Function} callback - The job callback function
 * @returns {Object|null} The scheduled job object or null on failure
 */
function createOneTimeJob(dateTime, callback) {
  try {
    return schedule.scheduleJob(dateTime, callback);
  } catch (error) {
    console.error('[Scheduler] Failed to create one-time job:', error);
    return null;
  }
}

/**
 * Schedule a recurring job using a cron pattern.
 * @param {string|Object} crontime - Cron time pattern (e.g., '0 12 * * *' or node-cron object)
 * @param {Function} callback - The job callback function
 * @returns {Object|null} The scheduled job object or null on failure
 */
function createCronJob(crontime, callback) {
  try {
    return schedule.scheduleJob(crontime, callback);
  } catch (error) {
    console.error('[Scheduler] Failed to create cron job:', error);
    return null;
  }
}

/**
 * Schedule a recurring job using a RecurrenceRule.
 * @param {Object} rule - node-schedule RecurrenceRule instance
 * @param {Function} callback - The job callback function
 * @returns {Object|null} The scheduled job object or null on failure
 */
function createRecurringJob(rule, callback) {
  try {
    return schedule.scheduleJob(rule, callback);
  } catch (error) {
    console.error('[Scheduler] Failed to create recurring job:', error);
    return null;
  }
}

// ============================================================================
// Job Management Functions
// ============================================================================

/**
 * Cancel a scheduled job by its name.
 * @param {string} jobName - The name of the job to cancel
 * @returns {boolean} True if job was found and cancelled, false otherwise
 */
function cancelJobByName(jobName) {
  const scheduledJobs = schedule.scheduledJobs;
  if (!scheduledJobs || !scheduledJobs[jobName]) {
    console.warn(`[Scheduler] Job "${jobName}" not found for cancellation`);
    return false;
  }
  scheduledJobs[jobName].cancel();
  console.log(`[Scheduler] Job "${jobName}" cancelled successfully`);
  return true;
}

/**
 * Cancel a scheduled job by its job object.
 * @param {Object} job - The node-schedule job object
 * @returns {boolean} True if job was cancelled, false otherwise
 */
function cancelJob(job) {
  if (!job || !job.cancel) {
    console.warn('[Scheduler] Invalid job object provided for cancellation');
    return false;
  }
  job.cancel();
  console.log('[Scheduler] Job cancelled successfully');
  return true;
}

/**
 * Check if a job exists in scheduledJobs.
 * @param {string} jobName - The name of the job to check
 * @returns {boolean} True if job exists, false otherwise
 */
function jobExists(jobName) {
  const scheduledJobs = schedule.scheduledJobs;
  return !!(scheduledJobs && scheduledJobs[jobName]);
}

/**
 * Get all scheduled jobs.
 * @returns {Object} The scheduledJobs map from node-schedule
 */
function getAllScheduledJobs() {
  return schedule.scheduledJobs || {};
}

// ============================================================================
// Date/Time Builder Functions (used to construct job trigger times)
// ============================================================================

/**
 * Build a Date object for a one-time schedule from string inputs.
 * @param {Object} data - Schedule data containing date, hour, minute, ampm fields
 * @returns {Date} The constructed Date object
 */
function buildOneTimeDate(data) {
  const { date, hour, minute, ampm } = data;
  const { year, month, day } = dateFromDateString(date);
  const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
  return new Date(year, month - 1, day, modifiedHour, parseInt(minute), 0);
}

/**
 * Build a RecurrenceRule for recurring schedules.
 * @param {Object} data - Schedule data containing modifiedDaysOfTheWeek, hour, minute fields
 * @returns {Object} A node-schedule RecurrenceRule instance
 */
function buildRecurringRule(data) {
  const { modifiedDaysOfTheWeek, hour, minute } = data;
  const modifiedHour = convertToMilitaryTime(null, parseInt(hour));

  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [...modifiedDaysOfTheWeek];
  rule.hour = modifiedHour;
  rule.minute = parseInt(minute);
  return rule;
}

// ============================================================================
// Job Re-initiation Functions (used after server restart)
// ============================================================================

/**
 * Re-initialize a cron-based job from database record.
 * Used during /checkjobreinitiation to restore jobs after server restart.
 * @param {Object} cronRecord - Database record with crontime and deviceId fields
 * @param {string} macAddress - MAC address of the device to schedule
 * @param {Function} jobFunction - The job callback function
 * @returns {Object|null} The re-initiated job object or null
 */
function reinitCronJob(cronRecord, macAddress, jobFunction) {
  if (!cronRecord || !cronRecord.crontime) {
    console.warn('[Scheduler] Invalid cron record for re-initiation');
    return null;
  }

  const reInitiatedJob = schedule.scheduleJob(
    cronRecord.crontime,
    () => jobFunction(cronRecord.crontype, macAddress, false)
  );
  return reInitiatedJob;
}

/**
 * Re-initialize a one-time easy schedule job from database record.
 * @param {Object} ezScheduleRecord - Database record with date, hour, minute fields
 * @param {string} macAddress - MAC address of the device to schedule
 * @param {Function} jobFunction - The job callback function
 * @returns {Object|null} The re-initiated job object or null
 */
function reinitOneTimeSchedule(ezScheduleRecord, macAddress, jobFunction) {
  if (!ezScheduleRecord || !ezScheduleRecord.date) {
    console.warn('[Scheduler] Invalid one-time schedule record for re-initiation');
    return null;
  }

  const triggerDate = new Date(`${ezScheduleRecord.date} ${ezScheduleRecord.hour}:${ezScheduleRecord.minute}:00`);
  const currentDate = new Date();

  if (triggerDate < currentDate) {
    console.log('[Scheduler] One-time schedule date is in the past, skipping re-initiation');
    return null;
  }

  const reInitiatedJob = schedule.scheduleJob(triggerDate, () =>
    jobFunction(ezScheduleRecord.blockAllow, macAddress, true)
  );
  return reInitiatedJob;
}

/**
 * Re-initialize a recurring easy schedule job from database record.
 * @param {Object} ezScheduleRecord - Database record with days, hour, minute fields
 * @param {string} macAddress - MAC address of the device to schedule
 * @param {Function} jobFunction - The job callback function
 * @returns {Object|null} The re-initiated job object or null
 */
function reinitRecurringSchedule(ezScheduleRecord, macAddress, jobFunction) {
  if (!ezScheduleRecord || !ezScheduleRecord.days && !ezScheduleRecord.modifiedDaysOfTheWeek) {
    console.warn('[Scheduler] Invalid recurring schedule record for re-initiation');
    return null;
  }

  let modifiedDays = ezScheduleRecord.modifiedDaysOfTheWeek;
  if (ezScheduleRecord.days && !ezScheduleRecord.modifiedDaysOfTheWeek) {
    modifiedDays = ezScheduleRecord.days.split('').map(day => parseInt(day));
  }

  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [...modifiedDays];
  rule.hour = convertToMilitaryTime(null, parseInt(ezScheduleRecord.hour));
  rule.minute = parseInt(ezScheduleRecord.minute);

  const reInitiatedJob = schedule.scheduleJob(rule, () =>
    jobFunction(ezScheduleRecord.blockAllow, macAddress, false)
  );
  return reInitiatedJob;
}

// ============================================================================
// Export
// ============================================================================

module.exports = {
  // Job creation
  createOneTimeJob,
  createCronJob,
  createRecurringJob,

  // Job management
  cancelJobByName,
  cancelJob,
  jobExists,
  getAllScheduledJobs,

  // Date/time builders
  buildOneTimeDate,
  buildRecurringRule,

  // Re-initiation (post-server-restart)
  reinitCronJob,
  reinitOneTimeSchedule,
  reinitRecurringSchedule,
};
