import { useEffect, useState, useRef } from "react";
import { GoInfo, GoTrash } from "react-icons/go";
import { useParams } from "react-router-dom";
import { DisplayOneTimeOrRecurringSchedule } from "./SchedulerComponents/DisplayOneTimeOrRecurringSchedule";


export default function ScheduleData({ changed })
{
    const [returnData, setReturnData] = useState(null);
    // const [checked, setChecked] = useState(true);
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
    const deviceId = { id: parseInt(params.id) };

    const handleCronToggle = e => { // /togglecron
        setChecked(prev => !prev);
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
                }
            } catch (error) {
                if (error) throw error;
            }
        }
        toggleCronUpdate();
    }
    const handleEZToggle = e => { // /togglecron
        setChecked(prev => !prev);
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
                }
            } catch (error) {
                if (error) throw error;
            }
        }
        toggleCronUpdate();
    }

    useEffect(() => { // fetch existing cron data && EZ schedule data 06 24 2024
        const getScheduleData = async () => {
        try {
                const scheduleData = await fetch('/getscheduledata', {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify(deviceId)
                });
                if (scheduleData.ok) {
                    const returnedData = await scheduleData.json();
                    console.log('returnedData\t', returnedData);
                    // setReturnData(returnedData); // original
                    // setReturnData({});
                    setReturnData(returnedData);
                    console.log('returned data: ', returnedData);
                }
            } catch (error) {
                console.error('Error on initial fetch...');
                if (error) throw error;
            }
        }
        getScheduleData();
    }, [changed, toggledOrDeletedSchedule])

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
            }
        } catch (error) {
            // submitButtonRef.current.disabled = false
            if (error) throw error;
        }
    }

    return (
        <>
            {returnData?.ezScheduleData?.length ?
            <table className="table table-zebra border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900 mb-8">
            <tbody>
                <tr className="font-bold sm:text-xl" align="center">
                    <td>Time</td>
                    <td>Action</td>
                    <td>Off/On</td>
                    <td>Delete</td>
                </tr>
                    {
                        returnData.ezScheduleData.length ? returnData?.ezScheduleData?.map((ezData) => {
                            return (
                                <>
                                    <tr key={ezData.id} align="center">
                                        <td className="uppercase"><DisplayOneTimeOrRecurringSchedule oneTime={ezData.oneTime} ezData={ezData} /></td>
                                        <td className={`uppercase ${ezData.blockAllow === 'block' ? 'text-red-500' : 'text-green-500'}`}>
                                            {ezData.blockAllow}
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-success"
                                                data-crontimeid={ezData?.date}
                                                data-deviceid={ezData?.deviceId}
                                                data-jobname={ezData?.jobName}
                                                data-crontime={ezData?.date}
                                                data-crontype={ezData?.blockAllow}
                                                checked={ezData?.date}
                                                // data-macaddress={ezData?.macAddress}
                                                onClick={e => handleCronToggle(e)}
                                            />
                                        </td>
                                        <td className="w-3 h-3">
                                            <div
                                            // className="bg-red-500 hover:bg-red-200 btn btn-circle animate-pulse"
                                            className="w-fit hover:cursor-pointer"
                                            onClick={e => handleDeleteCron(e)}
                                            data-id={ezData?.id}
                                            data-jobname={ezData?.jobName}
                                            >
                                                <GoTrash
                                                    className="flex items-center justify-center z-10 w-6 h-6 pointer-events-none"
                                                    ref={submitButtonRef}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            )
                        }) : <></>
                    }
            </tbody>
        </table> : <></>
        }
        {returnData?.cronData?.length ?
            <table className="table table-zebra border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900 mb-8">
                <tbody>
                    <tr className="font-bold sm:text-xl" align="center">
                        <td>Cron</td>
                        <td>Action</td>
                        <td>Off/On</td>
                        <td>Delete</td>
                    </tr>
                        {
                            returnData.cronData.length ? returnData?.cronData?.map((cronData) => {
                                return (
                                    <>
                                        <tr key={cronData.id} align="center">
                                            <td className="uppercase">{cronData.crontime}</td>
                                            <td className={`uppercase ${cronData.crontype === 'block' ? 'text-red-500' : 'text-green-500'}`}>
                                                {cronData.crontype}
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-success"
                                                    data-crontimeid={cronData?.id}
                                                    data-deviceid={cronData?.deviceId}
                                                    data-jobname={cronData?.jobName}
                                                    data-crontime={cronData?.crontime}
                                                    data-crontype={cronData?.crontype}
                                                    checked={cronData?.toggleCron}
                                                    // data-macaddress={cronData?.macAddress}
                                                    onClick={e => handleCronToggle(e)}
                                                />
                                            </td>
                                            <td className="w-3 h-3">
                                                <div
                                                // className="bg-red-500 hover:bg-red-200 btn btn-circle animate-pulse"
                                                className="w-fit hover:cursor-pointer"
                                                onClick={e => handleDeleteCron(e)}
                                                data-id={cronData?.id}
                                                data-jobname={cronData?.jobName}
                                                >
                                                    <GoTrash
                                                        className="flex items-center justify-center z-10 w-6 h-6 pointer-events-none"
                                                        ref={submitButtonRef}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    </>
                                )
                            }) : <></>
                        }
                </tbody>
            </table> : <></>
        }

        </>
    );
}