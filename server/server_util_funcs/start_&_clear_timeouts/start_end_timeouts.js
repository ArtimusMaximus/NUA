const { minutesHoursToMilli } = require('../minutesHoursToMilli.js');


const timeoutMap = new Map();

function startTimeout(timerId, minutes, hours, callback) { // timerId === deviceId
    const delay = minutesHoursToMilli(minutes, hours);
    // console.log("delay in startTimeout function:\t", delay);

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

function endTimeout(timerId) {
    if (timeoutMap.has(timerId)) {
        clearTimeout(timeoutMap.get(timerId).timeoutId);
        timeoutMap.delete(timerId);
        console.log("timeoutMap cleared:", timeoutMap, "\n On Date:\t", new Date(Date.now()));
        return true;
    }
    return false;
}

module.exports = { startTimeout, endTimeout, timeoutMap };