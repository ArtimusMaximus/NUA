const { minutesHoursToMilli } = require('../minutesHoursToMilli.js');


const timeoutMap = new Map();

function startTimeout(timerId, minutes, hours, callback, originalTime=null) { // timerId === deviceId
  let delay = minutesHoursToMilli(minutes, hours);
  // console.log("delay in startTimeout function:\t", delay);
  if (originalTime) { // for future feature of adding to current bonus time
    delay += originalTime;
  }

  const futureTime = Date.now() + delay;
  const timeoutId = setTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      console.error('Error in async callback!', error);
    } finally {
      timeoutMap.delete(timerId);
    }
  }, delay);
  const mapObj = { time: futureTime, timeoutId: timeoutId };
  timeoutMap.set(timerId, mapObj);

  return { timeoutMap };
}

/**
 * Re-arm a timer from an absolute expiry timestamp (ms since epoch).
 * Used on server boot to restore bonus-time timers that survived a restart.
 * If the expiry has already passed, the callback runs immediately.
 */
function startTimeoutFromExpiry(timerId, expiresAt, callback) {
  const delay = Math.max(expiresAt - Date.now(), 0);
  const timeoutId = setTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      console.error('Error in async callback!', error);
    } finally {
      timeoutMap.delete(timerId);
    }
  }, delay);
  const mapObj = { time: expiresAt, timeoutId: timeoutId };
  timeoutMap.set(timerId, mapObj);

  return { timeoutMap };
}

module.exports = { startTimeout, endTimeout, startTimeoutFromExpiry, timeoutMap };

function endTimeout(timerId) {
  if (timeoutMap.has(timerId)) {
    clearTimeout(timeoutMap.get(timerId).timeoutId);
    timeoutMap.delete(timerId);
    console.log('timeoutMap cleared:', timeoutMap, '\n On Date:\t', new Date(Date.now()));
    return true;
  }
  return false;
}

module.exports = { startTimeout, endTimeout, timeoutMap };