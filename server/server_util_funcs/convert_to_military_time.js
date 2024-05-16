function convertToMilitaryTime(ampm, hour) {
    let modifiedHour;
    if (ampm === "AM" && hour === 12) {
        modifiedHour = hour - 12;
    } else if (ampm === "PM" && hour === 12) {
        modifiedHour = hour;
    } else if (ampm === "PM") {
        modifiedHour = hour + 12;
    }
    return modifiedHour;
}

module.exports = { convertToMilitaryTime };
