const { convertStringToBool } = require("../../server_util_funcs/convert_string_to_bool");
const { updateOneTimeSchedule } = require("../../ez_sched_funcs/update_ez_schedules/updateOneTimeSchedule");
const { updateRecurringSchedule } = require("../../ez_sched_funcs/update_ez_schedules/updateRecurringSchedule");

function ezScheduleRoutes(app, unifi, prisma, schedule, jobFunction) {

    app.put('/toggleezschedule', async (req, res) => {
        const { id, deviceId, jobName, date, scheduletype, oneTime, ampm, hour, minute, toggleSched, days } = req.body;
        const modifiedDaysOfTheWeek = days && days.split("").map((day) => parseInt(day));

        const boolOneTime        = convertStringToBool(oneTime);
        const toggleSchedBoolean = convertStringToBool(toggleSched);

        const data = { date, hour, minute, ampm, boolOneTime, deviceId, scheduletype, modifiedDaysOfTheWeek, id }; // data for nodeOneTimeScheduleRule
        let jb = jobName;
        try {
            // const getMacAddress = await prisma.device.findUnique({ where: { id: deviceId } });
            // console.log('getMacAddress.macAddress: ', getMacAddress.macAddress);

            if (toggleSchedBoolean === false && jobName !== '') {
                const cancelled = schedule?.cancelJob(jobName);
                console.log('Cancelled Job?: ', cancelled);
            } else if (toggleSchedBoolean === true) {
                console.log('continue');

                let reInitiatedJob;
                if (boolOneTime) {
                    reInitiatedJob = await updateOneTimeSchedule(data, unifi, prisma, jobFunction, schedule);
                } else if (!boolOneTime) {
                    reInitiatedJob = await updateRecurringSchedule(data, unifi, prisma, jobFunction, schedule);
                }



                jb = reInitiatedJob?.name;
                console.log('jb.name: ', jb?.name);
            }
            const updateEZToggle = await prisma.easySchedule.update({
                where: { id: id },
                data: {
                    toggleSched: toggleSchedBoolean,
                    jobName: jb
                }
            });
            res.json(updateEZToggle);
        } catch (error) {
            console.error(error);
        }
    });
}

module.exports = { ezScheduleRoutes };