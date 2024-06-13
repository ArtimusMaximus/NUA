export function convertToMilitaryTime(ampm, hour) {
    if (typeof hour !== "number") {
        throw new Error("Hour must be converted to number first!");
    }
    let modifiedHour;
    if (ampm === "AM" && hour === 12) {
        modifiedHour = hour - 12;
    } else if (ampm === "PM" && hour === 12) {
        modifiedHour = hour;
    } else if (ampm === "PM") {
        modifiedHour = hour + 12;
    } else {
        modifiedHour = hour;
    }
    return modifiedHour;
}