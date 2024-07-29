

function validDateModifier(year, month, day, modifiedHour, minute) {
    if (year === undefined
        || month === undefined
        || day === undefined
        || modifiedHour === undefined
        || minute === undefined) { throw new Error("undefined date value passed") };

    let validModifiedHour = modifiedHour.toString();
    let validMinute = minute.toString();
    let validMonth = month.toString();
    let validDay = day.toString();
    let z = 0;
    if (validModifiedHour.length < 2) {
        validModifiedHour = z + validModifiedHour;
    }
    if (validMinute.length < 2) {
        validMinute = z + validMinute;
    }
    if (validMonth.length < 2) {
        validMonth = z + validMonth;
    }
    if (validDay.length < 2) {
        validDay = z + validDay;
    }
    const validDate = new Date(year, validMonth, validDay, validModifiedHour, validMinute, 0);
    return validDate;
}
module.exports = { validDateModifier };