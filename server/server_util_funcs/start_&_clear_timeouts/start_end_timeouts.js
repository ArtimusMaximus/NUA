let timeoutMap = new Map();

function startTimeout(timerId, delay, callback) {
    const timeoutId = setTimeout(async () => {
        try {
            await callback();
        } catch (error) {
            console.error('Error in async callback!', error);
        } finally {
            timeoutMap.delete(timerId);
        }
    }, delay);
    timeoutMap.set(timerId, timeoutId);
}

function endTimeout(timerId) {
    if (timeoutMap.has(timerId)) {
        clearTimeout(timeoutMap.get(timerId));
        timeoutMap.delete(timerId);
        return true;
    }
    return false;
}

module.exports = { startTimeout, endTimeout };