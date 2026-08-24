/**
 * Traffic Rule Scheduler Module
 *
 * Lets traffic rules follow schedules (like device EasySchedules). A rule is
 * either enabled or disabled, so a schedule's action maps to:
 *   - "allow" -> enable the rule
 *   - "block" -> disable the rule
 *
 * Persists the schedule directly on the TrafficRules row (one schedule per rule,
 * restart-safe) and provides:
 *   - addTrafficRuleSchedule:     create one-time or recurring schedule
 *   - toggleTrafficRuleSchedule:  enable/disable an existing schedule
 *   - deleteTrafficRuleSchedule:  remove a schedule
 *   - reArmTrafficRuleSchedulesOnBoot: restore jobs after container restart
 */

const schedule = require('node-schedule');
const { convertToMilitaryTime } = require('../server_util_funcs/convert_to_military_time');
const { dateFromDateString } = require('../server_util_funcs/ez_sched_utils/dateFromDateString');
const { convertDOWtoString } = require('../server_util_funcs/ez_sched_utils/convertDOWtoString');
const { startTimeout, endTimeout, timeoutMap } = require('../server_util_funcs/start_&_clear_timeouts/start_end_timeouts');

/**
 * Fetch the live rule object from UniFi by its `_id` so that enabling/disabling
 * sends the actual UniFi shape (not the Prisma DB object, which UniFi rejects).
 */
async function fetchUnifiRule(unifi, unifiId) {
  const path = '/v2/api/site/default/trafficrules';
  const rules = await unifi.customApiRequest(path, 'GET');
  return (rules || []).find(rule => rule._id === unifiId) || null;
}

/**
 * Set the enabled state of a traffic rule in UniFi + DB.
 */
async function setRuleEnabled(unifi, prisma, ruleId, enabled) {
  const rule = await prisma.trafficRules.findUnique({ where: { id: ruleId } });
  if (!rule) {
    return;
  }

  if (unifi) {
    const unifiPath = `/v2/api/site/default/trafficrules/${rule.unifiId}`;
    const ruleCopy = await fetchUnifiRule(unifi, rule.unifiId);
    if (ruleCopy) {
      ruleCopy.enabled = enabled;
      await unifi.customApiRequest(unifiPath, 'PUT', ruleCopy);
    }
  }

  await prisma.trafficRules.update({
    where: { id: ruleId },
    data: { enabled }
  });
}

/**
 * The scheduled action: "allow" enables the rule, "block" disables it.
 */
async function runTrafficRuleScheduleAction(action, unifi, prisma, ruleId) {
  const enabled = action === 'allow';
  await setRuleEnabled(unifi, prisma, ruleId, enabled);
  console.log(`[TrafficRuleSchedule] rule ${ruleId} ${enabled ? 'enabled' : 'disabled'} by schedule`);
}

/**
 * Create a one-time schedule for a traffic rule.
 * @returns {Object|null} the node-schedule job object
 */
async function addOneTimeTrafficRuleSchedule(ruleId, data, unifi, prisma) {
  const { date, hour, minute, ampm, scheduleAction } = data;
  const { year, month, day } = dateFromDateString(date);
  const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
  const dateTime = new Date(year, month - 1, day, modifiedHour, parseInt(minute), 0);

  return schedule.scheduleJob(dateTime, () =>
    runTrafficRuleScheduleAction(scheduleAction, unifi, prisma, ruleId)
  );
}

/**
 * Create a recurring schedule for a traffic rule.
 * @returns {Object|null} the node-schedule job object
 */
async function addRecurringTrafficRuleSchedule(ruleId, data, unifi, prisma) {
  const { hour, minute, ampm, modifiedDaysOfTheWeek, scheduleAction } = data;
  const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [...modifiedDaysOfTheWeek];
  rule.hour = modifiedHour;
  rule.minute = parseInt(minute);

  return schedule.scheduleJob(rule, () =>
    runTrafficRuleScheduleAction(scheduleAction, unifi, prisma, ruleId)
  );
}

/**
 * Create a schedule for a traffic rule and persist it on the row.
 */
async function addTrafficRuleSchedule(ruleId, data, unifi, prisma) {
  const { date, hour, minute, ampm, oneTime, modifiedDaysOfTheWeek, scheduleAction } = data;
  const rule = await prisma.trafficRules.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw new Error(`Traffic rule ${ruleId} not found`);
  }

  let job;
  if (oneTime) {
    job = await addOneTimeTrafficRuleSchedule(ruleId, data, unifi, prisma);
  } else {
    job = await addRecurringTrafficRuleSchedule(ruleId, data, unifi, prisma);
  }

  if (!job) {
    throw new Error('Failed to create traffic rule schedule job');
  }

  const scheduleDays = oneTime
    ? null
    : convertDOWtoString(modifiedDaysOfTheWeek.join(''));

  const updated = await prisma.trafficRules.update({
    where: { id: ruleId },
    data: {
      scheduleType: oneTime ? 'oneTime' : 'recurring',
      scheduleDate: oneTime ? date : null,
      scheduleHour: convertToMilitaryTime(ampm, parseInt(hour)),
      scheduleMinute: parseInt(minute),
      scheduleDays,
      scheduleAction,
      scheduleEnabled: true,
      scheduleJobName: job.name
    }
  });

  return { job, updated };
}

/**
 * Toggle an existing schedule on/off for a traffic rule.
 */
async function toggleTrafficRuleSchedule(ruleId, unifi, prisma, toggleOn) {
  const rule = await prisma.trafficRules.findUnique({ where: { id: ruleId } });
  if (!rule || !rule.scheduleJobName) {
    throw new Error('No schedule exists for this traffic rule');
  }

  if (!toggleOn) {
    const job = schedule.scheduledJobs[rule.scheduleJobName];
    job?.cancel();
    await prisma.trafficRules.update({
      where: { id: ruleId },
      data: { scheduleEnabled: false }
    });
    return false;
  }

  // Re-create the job from the persisted schedule data
  let job;
  if (rule.scheduleType === 'oneTime') {
    const { year, month, day } = dateFromDateString(rule.scheduleDate);
    const dateTime = new Date(year, month - 1, day, rule.scheduleHour, rule.scheduleMinute, 0);
    job = schedule.scheduleJob(dateTime, () =>
      runTrafficRuleScheduleAction(rule.scheduleAction, unifi, prisma, ruleId)
    );
  } else {
    const modifiedDays = rule.scheduleDays.split('').map(day => parseInt(day));
    const r = new schedule.RecurrenceRule();
    r.dayOfWeek = [...modifiedDays];
    r.hour = rule.scheduleHour;
    r.minute = rule.scheduleMinute;
    job = schedule.scheduleJob(r, () =>
      runTrafficRuleScheduleAction(rule.scheduleAction, unifi, prisma, ruleId)
    );
  }

  await prisma.trafficRules.update({
    where: { id: ruleId },
    data: { scheduleEnabled: true, scheduleJobName: job.name }
  });

  return job;
}

/**
 * Delete a schedule for a traffic rule (cancels the job, clears columns).
 */
async function deleteTrafficRuleSchedule(ruleId, unifi, prisma) {
  const rule = await prisma.trafficRules.findUnique({ where: { id: ruleId } });
  if (!rule) {
    return;
  }

  if (rule.scheduleJobName) {
    const job = schedule.scheduledJobs[rule.scheduleJobName];
    job?.cancel();
  }

  await prisma.trafficRules.update({
    where: { id: ruleId },
    data: {
      scheduleType: null,
      scheduleDate: null,
      scheduleHour: null,
      scheduleMinute: null,
      scheduleDays: null,
      scheduleAction: null,
      scheduleEnabled: false,
      scheduleJobName: null
    }
  });
}

/**
 * Boot-time restore. Re-creates in-memory jobs for rules whose schedule is
 * enabled. Returns count for logging.
 */
async function reArmTrafficRuleSchedulesOnBoot(unifi, prisma) {
  let rearmed = 0;

  const rules = await prisma.trafficRules.findMany({
    where: { scheduleEnabled: true }
  });

  for (const rule of rules) {
    if (!rule.scheduleType) {
      continue;
    }

    let job;
    if (rule.scheduleType === 'oneTime') {
      const { year, month, day } = dateFromDateString(rule.scheduleDate);
      const dateTime = new Date(year, month - 1, day, rule.scheduleHour, rule.scheduleMinute, 0);
      job = schedule.scheduleJob(dateTime, () =>
        runTrafficRuleScheduleAction(rule.scheduleAction, unifi, prisma, rule.id)
      );
    } else {
      const modifiedDays = rule.scheduleDays.split('').map(day => parseInt(day));
      const r = new schedule.RecurrenceRule();
      r.dayOfWeek = [...modifiedDays];
      r.hour = rule.scheduleHour;
      r.minute = rule.scheduleMinute;
      job = schedule.scheduleJob(r, () =>
        runTrafficRuleScheduleAction(rule.scheduleAction, unifi, prisma, rule.id)
      );
    }

    if (job) {
      await prisma.trafficRules.update({
        where: { id: rule.id },
        data: { scheduleJobName: job.name }
      });
      rearmed++;
    }
  }

  return { rearmed };
}

module.exports = {
  addTrafficRuleSchedule,
  toggleTrafficRuleSchedule,
  deleteTrafficRuleSchedule,
  reArmTrafficRuleSchedulesOnBoot
};
