function dateFromDateString(date) {
    const breakDownDate = date.split("-");
    const year = parseInt(breakDownDate[0]);
    const month = parseInt(breakDownDate[1]);
    const day = parseInt(breakDownDate[2]);
    return { year, month, day };
}

module.exports = { dateFromDateString };