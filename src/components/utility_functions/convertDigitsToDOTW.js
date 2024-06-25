export function convertDigitsToDOW(digits) {
    let individualDigits = digits.split("");
    const mapToDays = individualDigits.map((digitDay) => {
        switch (digitDay) {
            case "0":
                return "Su";
                break;
            case "1":
                return "M";
                break;
            case "2":
                return "T";
                break;
            case "3":
                return "W";
                break;
            case "4":
                return "Th";
                break;
            case "5":
                return "F";
                break;
            case "6":
                return "Sa";
                break;
            default:
                break;
        }
    });
    return mapToDays;
}