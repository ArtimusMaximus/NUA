const fs = require('fs');
const util = require('util');


let fileName = "nua.log";

function serverLogger(data, fileName) {
    fs.appendFile(`./config/server_logs/${fileName}`, data + "\n", (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("File Write successful.");
            console.log("File Contents:");
            console.log(fs.readFileSync(`./config/server_logs/${fileName}`, "utf8"));
        }
    });
}

module.exports = { serverLogger };
