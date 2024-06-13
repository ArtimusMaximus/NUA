export function dateIsInPast(selectedDate) {
    let isPastDate;
    let currentDate = new Date();
    console.log('Current Date from dateIsInPast()\t', currentDate);
    if (selectedDate < currentDate) { // implicit check
        isPastDate =  true;
    } else {
        isPastDate = false;
    }
    return isPastDate;
}