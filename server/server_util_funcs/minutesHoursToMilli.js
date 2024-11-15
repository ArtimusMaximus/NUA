
function minutesHoursToMilli(minutes, hours) {
    let mins = parseInt(minutes);
    let hrs = parseInt(hours) * 60;
    let converted = 0;
    if (minutes) {
        converted += mins * 60000;
    }
    if (hours) {
        converted += hrs * 60000;
    }
    return converted;
}


module.exports = { minutesHoursToMilli };