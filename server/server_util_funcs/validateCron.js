const cron = require('cron-validator');


function validateCron(crontype) { // return true/false
    let validation = cron.isValidCron(crontype)
    return validation;
}

module.exports = { validateCron };