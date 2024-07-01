const { convertStringToBool } = require("../../server_util_funcs/convert_string_to_bool");
const { updateOneTimeSchedule } = require("../../ez_sched_funcs/update_ez_schedules/updateOneTimeSchedule");
const { updateRecurringSchedule } = require("../../ez_sched_funcs/update_ez_schedules/updateRecurringSchedule");
const { nodeOneTimeScheduleRule } = require("../../ez_sched_funcs/nodeOneTimeScheduleRule");
const { nodeScheduleRecurrenceRule } = require("../../ez_sched_funcs/nodeRecurringScheduleRule");


function ezScheduleRoutes(app, unifi, prisma, schedule, jobFunction) {

    app.post('/addeasyschedule', async (req, res) => {
        const { date, hour, minute, oneTime, blockAllow, modifiedDaysOfTheWeek, ampm, deviceId } = req.body;
        // const { date, hour, minute, oneTime, blockAllow, daysOfTheWeek, ampm, deviceId } = req.body;
        // console.log('daysOfTheWeek\t', daysOfTheWeek);
        // let daysOfTheWeekNumerals = [...Object.values(daysOfTheWeek)];
        // let modifiedDaysOfTheWeek = daysOfTheWeekNumerals;
        // if (daysOfTheWeek === undefined) {
        //     modifiedDaysOfTheWeek = [0, 1, 2, 3, 4, 5, 6];
        // }
        try {
            if (oneTime) {
                nodeOneTimeScheduleRule(
                    { date, hour, minute, ampm, deviceId, oneTime, blockAllow },
                    unifi,
                    prisma,
                    jobFunction,
                    schedule
                );
            } else { // recurrence
                nodeScheduleRecurrenceRule(
                    { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, blockAllow },
                    unifi,
                    prisma,
                    jobFunction,
                    schedule
                );
            }
        } catch (error) {
            console.error(error);
        }
        res.sendStatus(200);
    });

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

    app.delete('/deleteezschedule', async (req, res) => {
        const { parseId, jobName } = req.body;
        try {
            const deleteEZSchedule = await prisma.easySchedule.delete({
                where: {
                    id: parseId
                }
            });
            console.log('jobName: \t', jobName);
            const jobToCancel = schedule.scheduledJobs[jobName]
            console.log('Job Name cancelled: ', jobToCancel?.name);
            jobToCancel?.cancel();
            res.json({ message: "Data Deleted Succesfully.", dataDeleted: deleteEZSchedule });
        } catch (error) {
            if (error) throw error;
        }
    });
}

module.exports = { ezScheduleRoutes };