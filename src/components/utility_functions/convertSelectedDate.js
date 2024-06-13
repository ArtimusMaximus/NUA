import { convertToMilitaryTime } from "./convert_to_military_time";

export function convertSelectedDateForComparison(selectedDate) {
    const { date, hour, minute, ampm } = selectedDate;
    const modifiedHour = convertToMilitaryTime(ampm, hour);
    const splitDate = date.split("-");
    const year = splitDate[0];
    const month = splitDate[1] - 1;
    const day = splitDate[2];
    let userSelectedDate = new Date(year, month, day, modifiedHour, minute, 0);

    return userSelectedDate;
};

