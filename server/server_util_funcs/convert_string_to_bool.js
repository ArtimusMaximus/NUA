function convertStringToBool(str) {
    if (typeof str !== "string" && typeof str === "boolean") {
        return str;
    } else {
        switch (str) {
            case "false":
                return false;
                break;
            case "true":
                return true;
                break;
            default:
                throw new Error("String was neither true nor false");
                break;
        }
    }
}

module.exports = { convertStringToBool };