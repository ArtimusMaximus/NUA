function convertDOWtoString(arr) {
    let strDates = "";
    for(let i=0; i<arr.length; i++) {
        strDates += arr[i];
  }
  return strDates;
}

module.exports = { convertDOWtoString };