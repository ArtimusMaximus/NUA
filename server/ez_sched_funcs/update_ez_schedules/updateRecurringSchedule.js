const { convertToMilitaryTime } = require("../../server_util_funcs/convert_to_military_time");


async function updateRecurringSchedule(data, unifi, prisma, jobFunction, schedule) {
    const { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, blockAllow, days } = data; // gets data from
    // console.log('modifiedDaysOfTheWeek\t', modifiedDaysOfTheWeek);
    // console.log('Array.isArray modifiedDaysOfTheWeek\t', Array.isArray(modifiedDaysOfTheWeek));
    // console.log("days from updaterecurringsched\t", days);
    const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
    // const { year, month, day } = dateFromDateString(date);
    const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
    // console.log('modifiedHour\t', modifiedHour);
    console.log('blockAllow\t', blockAllow);

    // console.log('modifiedHour\t', modifiedHour);
    // console.log('modifiedHour\t', typeof modifiedHour);
    // console.log('hour\t', hour);
    // console.log('typeof hour\t', typeof hour);
    // console.log('minute\t', minute, typeof minute);

    // console.log("days\t", days, typeof days) // 07 18 2024, days is not passed from the front end or in routes/ezscheduleroutes.js // will be undefined
    // const daysToInt = days.split("").map((day) => parseInt(day)); // look deeper into why modifiedDaysOfTheWeek was not iterable upon job re-initiation on outdated onetime jobs
    const rule = new schedule.RecurrenceRule();
    // rule.dayOfWeek = [...daysToInt]; // commented out 07/18/2024, days is not passed from front end, modifiedDOTW is...
    rule.dayOfWeek = [...modifiedDaysOfTheWeek]; // commented out 07 12 2024 && commented back in 07 18 2024
    // rule.dayOfWeek = [...daysToInt];
    // rule.dayOfWeek = [...daysOfTheWeek];
    // rule.hour = modifiedHour;
    rule.hour = hour;
    rule.minute = minute;
    // rule.tz = "Etc/UTC";
    // console.log("rule\t", rule);
    const startNewJobTrue = schedule.scheduleJob(rule, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));
    // await new Promise(res => setTimeout(res, 2000));
    // console.log('startNewJobTrue from updateRecurringSched\t', startNewJobTrue.nextInvocation())
    // startNewJobTrue.cancelNext(true)
    // startNewJobTrue.reschedule({ spec: true });
    // let adjust = startNewJobTrue.nextInvocation();
    // console.log('adjust\t', adjust);
    // console.log('startNewJobTrue.name\t', startNewJobTrue.name);
    // console.log('schedule\t', schedule.scheduledJobs[startNewJobTrue.name].pendingInvocations[0])
    // adjust._date.ts = "2024-12-25T16:32:00.000-05:00";
    // console.log('startNewJobTrue.nextInvocation()\t', startNewJobTrue.nextInvocation())

    // console.log('startNewJobTrue?.pendingInvocations[0].job\t', startNewJobTrue?.pendingInvocations[0].job);
    // console.log('startNewJobTrue?.pendingInvocations[0].FIREDATE\t', startNewJobTrue?.pendingInvocations[0].fireDate);
    // console.log('startNewJobTrue?.pendingInvocations[0].recurrenceRule\t', startNewJobTrue?.pendingInvocations[0].recurrenceRule);

    return startNewJobTrue;
}

module.exports = { updateRecurringSchedule };