/**
 * Traffic Rule Bonus Scheduler Module
 *
 * Handles temporary "bonus time" for traffic rules:
 * - startBonusRule:  enables a rule for a duration, persisting an absolute expiry
 * - endBonusRule:    disables the rule again (via UniFi + DB), clearing the expiry
 * - reArmOnBoot:     restores in-flight bonus timers after a container restart
 */

const { minutesHoursToMilli } = require('../server_util_funcs/minutesHoursToMilli');
const { startTimeout, endTimeout, startTimeoutFromExpiry, timeoutMap } = require('../server_util_funcs/start_&_clear_timeouts/start_end_timeouts');

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
 * Start bonus time for a traffic rule.
 * Enables the rule (UniFi + DB) and persists an absolute expiry timestamp.
 */
async function startBonusRule(ruleId, hours, minutes, unifi, prisma, originalTime = null) {
  const rule = await prisma.trafficRules.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw new Error(`Traffic rule ${ruleId} not found`);
  }

  const extraMs = originalTime ? Math.max(originalTime, 0) : 0;
  const expiresAt = new Date(Date.now() + extraMs + minutesHoursToMilli(minutes, hours));

  // Enable the rule in UniFi and reflect in DB
  const unifiPath = `/v2/api/site/default/trafficrules/${rule.unifiId}`;
  if (unifi) {
    const ruleCopy = await fetchUnifiRule(unifi, rule.unifiId);
    if (ruleCopy) {
      ruleCopy.enabled = true;
      await unifi.customApiRequest(unifiPath, 'PUT', ruleCopy);
    }
  }
  await prisma.trafficRules.update({
    where: { id: ruleId },
    data: { enabled: true, bonusTimeExpiresAt: expiresAt }
  });

  return expiresAt;
}

/**
 * End bonus time for a traffic rule: disable it again and clear the expiry.
 */
async function endBonusRule(ruleId, unifi, prisma) {
  const rule = await prisma.trafficRules.findUnique({ where: { id: ruleId } });
  if (!rule) {
    return;
  }

  const unifiPath = `/v2/api/site/default/trafficrules/${rule.unifiId}`;
  if (unifi) {
    const ruleCopy = await fetchUnifiRule(unifi, rule.unifiId);
    if (ruleCopy) {
      ruleCopy.enabled = false;
      await unifi.customApiRequest(unifiPath, 'PUT', ruleCopy);
    }
  }
  await prisma.trafficRules.update({
    where: { id: ruleId },
    data: { enabled: false, bonusTimeExpiresAt: null }
  });
}

/**
 * Boot-time restore. Re-arms in-memory timers for rules whose expiry is still in
 * the future, and immediately disables rules whose expiry has already passed.
 * Returns counts for logging.
 */
async function reArmTrafficBonusOnBoot(unifi, prisma) {
  let rearmed = 0;
  let expired = 0;

  const rules = await prisma.trafficRules.findMany({
    where: { bonusTimeExpiresAt: { not: null } }
  });

  for (const rule of rules) {
    const expiresAt = new Date(rule.bonusTimeExpiresAt).getTime();
    const remaining = expiresAt - Date.now();

    if (remaining > 0) {
      // Rule is still in bonus time — re-arm the timer keyed by ruleId
      startTimeoutFromExpiry(rule.id, expiresAt, async () => {
        await endBonusRule(rule.id, unifi, prisma);
        endTimeout(rule.id);
      });
      rearmed++;
    } else {
      // Bonus time already elapsed while down — disable the rule now
      await endBonusRule(rule.id, unifi, prisma);
      expired++;
    }
  }

  return { rearmed, expired };
}

module.exports = {
  startBonusRule,
  endBonusRule,
  reArmTrafficBonusOnBoot
};
