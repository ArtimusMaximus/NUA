import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { EZScheduleTable } from "./SchedulerComponents/EZScheduleTable";
import { CronScheduleTable } from "./SchedulerComponents/CronScheduleTable";


export default function ScheduleData({ changed, deviceId: providedDeviceId = null })
{
    const [returnData, setReturnData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const submitButtonRef = useRef();
    const [toggledOrDeletedSchedule, setToggledOrDeletedSchedule] = useState(false);
    const params = useParams();

    const triggerRender2 = () => {
        setToggledOrDeletedSchedule(prev => !prev);
    }
    // const [cron] = useState({
    //     crontype: 'allow',
    //     id: parseInt(params.id),
    //     toggleCron: true,
    //     jobName: ''
    // });
    const resolvedDeviceId = providedDeviceId ? parseInt(providedDeviceId) : parseInt(params.id);
    const devicePayload = { id: resolvedDeviceId };

    const handleCronToggle = e => { // /togglecron
        console.log(e.target.checked);

        const id = parseInt(e.target.dataset.crontimeid);
        const toggleCron = e.target.checked;
        const jobName = e.target.dataset.jobname;
        const crontime = e.target.dataset.crontime;
        const crontype = e.target.dataset.crontype;
        const deviceId = parseInt(e.target.dataset.deviceid);
        async function toggleCronUpdate() {
            try {
                const toggleCronOnOff = await fetch('/togglecron', {
                    method: 'PUT',
                    mode: 'cors',
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify({ id, toggleCron, jobName, crontime, crontype, deviceId })
                });
                if (toggleCronOnOff.ok) {
                    const result = await toggleCronOnOff.json();
                    console.log('result', result);
                    triggerRender2(); // refetch get cron data
                } else {
                    setErrorMessage('Failed to toggle cron schedule.');
                }
            } catch (error) {
                console.error('Error toggling cron schedule:', error);
                setErrorMessage('Error toggling cron schedule.');
            }
        }
        toggleCronUpdate();
    }
    const handleEZToggle = e => { // /toggleEZ
        const id = parseInt(e.target.dataset.id);
        const deviceId = parseInt(e.target.dataset.deviceid);
        const jobName = e.target.dataset.jobname;
        const date = e.target.dataset.date;
        const blockAllow = e.target.dataset.blockallow;
        const oneTime = e.target.dataset.onetime;
        const ampm = e.target.dataset.ampm;
        const hour = e.target.dataset.hour;
        const minute = e.target.dataset.minute;
        const days = e.target.dataset.days;
        const toggleSched = e.target.checked;
        console.log('e.target.checked', e.target.checked);
        async function toggleEZUpdate() {
            try {
                const toggleCronOnOff = await fetch('/toggleezschedule', {
                    method: 'PUT',
                    mode: 'cors',
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    // body: JSON.stringify({ id, deviceId, jobName, scheduletype, date,date oneTime, ampm, hour, minute, toggleEZSched });
                    // backend needs: const { id, deviceId, jobName, date, scheduletype, oneTime, ampm, hour, minute } = req.body;
                    body: JSON.stringify({ id, deviceId, jobName, date, blockAllow, oneTime, ampm, hour, minute, days, toggleSched })
                });
                if (toggleCronOnOff.ok) {
                    const result = await toggleCronOnOff.json();
                    console.log('result', result);
                    triggerRender2(); // refetch get cron data
                } else {
                    setErrorMessage('Failed to toggle easy schedule.');
                }
            } catch (error) {
                console.error('Error toggling easy schedule:', error);
                setErrorMessage('Error toggling easy schedule.');
            }
        }
        toggleEZUpdate();
    }

    useEffect(() => { // fetch existing cron data && EZ schedule data 06 24 2024
        if (!Number.isInteger(resolvedDeviceId)) {
            setReturnData({ cronData: [], ezScheduleData: [] });
            setIsLoading(false);
            setErrorMessage('');
            return;
        }

        const getScheduleData = async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
                const scheduleData = await fetch('/getscheduledata', {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify(devicePayload)
                });
                if (scheduleData.ok) {
                    const returnedData = await scheduleData.json();
                    console.log('returnedData\t', returnedData);
                    // setReturnData(returnedData); // original
                    // setReturnData({});
                    setReturnData(returnedData);
                    console.log('returned data: ', returnedData);
                } else {
                    setReturnData({ cronData: [], ezScheduleData: [] });
                    setErrorMessage('Failed to fetch schedules.');
                }
            } catch (error) {
                console.error('Error on initial fetch...');
                console.error(error);
                setReturnData({ cronData: [], ezScheduleData: [] });
                setErrorMessage('Error loading schedules.');
            } finally {
                setIsLoading(false);
            }
        }
        getScheduleData();
    }, [changed, toggledOrDeletedSchedule, resolvedDeviceId])

    const handleDeleteCron = async e => {
        // submitButtonRef.current.disabled = true
        console.log(e.target.dataset.id);
        console.log(e.target.dataset.jobname);
        let jobName = e.target.dataset.jobname
        console.log('jobName: \t', jobName);
        const parseId = parseInt(e.target.dataset.id);

        try {
            const deleteCron = await fetch("/deletecron", {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ parseId, jobName })
            });
            if (deleteCron.ok) {
                const deleteReply = await deleteCron.json();
                console.log("Deleted Data: ", deleteReply);
                triggerRender2();
            } else {
                setErrorMessage('Failed to delete cron schedule.');
            }
        } catch (error) {
            // submitButtonRef.current.disabled = false
            console.error('Error deleting cron schedule:', error);
            setErrorMessage('Error deleting cron schedule.');
        }
    }
    const handleDeleteEZSched = async e => {
        // submitButtonRef.current.disabled = true
        console.log(e.target.dataset.id);
        console.log(e.target.dataset.jobname);
        let jobName = e.target.dataset.jobname
        console.log('jobName: \t', jobName);
        const parseId = parseInt(e.target.dataset.id);
        try {
            const deleteEZSchedule = await fetch("/deleteezschedule", {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ parseId, jobName })
            });
            if (deleteEZSchedule.ok) {
                const deleteReply = await deleteEZSchedule.json();
                console.log("Deleted Data: ", deleteReply);
                triggerRender2();
            } else {
                setErrorMessage('Failed to delete easy schedule.');
            }
        } catch (error) {
            // submitButtonRef.current.disabled = false
            console.error('Error deleting easy schedule:', error);
            setErrorMessage('Error deleting easy schedule.');
        }
    }


    return (
        <>
            {isLoading && (
                <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            )}
            {errorMessage && (
                <div role="alert" className="alert alert-error mb-4">
                    <span>{errorMessage}</span>
                </div>
            )}
            {
                !isLoading && returnData?.ezScheduleData?.length
                ?
                <EZScheduleTable
                    returnData={returnData}
                    submitButtonRef={submitButtonRef}
                    handleDeleteEZSched={handleDeleteEZSched}
                    handleEZToggle={handleEZToggle}
                />
                :
                <></>
            }
            {
                !isLoading && returnData?.cronData?.length
                ?
                <CronScheduleTable
                    returnData={returnData}
                    submitButtonRef={submitButtonRef}
                    handleDeleteCron={handleDeleteCron}
                    handleCronToggle={handleCronToggle}
                />
                :
                <></>
            }
            {!isLoading && !errorMessage && !returnData?.ezScheduleData.length && !returnData?.cronData.length && <div className="mx-auto text-center pb-4">There is no data to display...</div>}
        </>
    );
}