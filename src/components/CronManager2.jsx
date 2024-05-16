import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GoInfo, GoTrash } from "react-icons/go";
import TimeClock from './TimeClock/TimeClock'


export default function CronManager2()
{
    const params = useParams();
    const [schedule, setSchedule] = useState({
        scheduletype: 'allow',
        id: parseInt(params.id),
        toggleschedule: null
    });
    const submitButtonRef = useRef();
    const inputRef = useRef();
    const [checked, setChecked] = useState(true);
    const [returnData, setReturnData] = useState(null);
    const [changed, setChanged] = useState(false);
    const [invalidscheduleMessage, setInvalidscheduleMessage] = useState({});
    const [deviceInfo, setDeviceInfo] = useState({});
    const oneTimeScheduleRef = useRef(null);
    const recurringScheduleRef = useRef(null);
    const [oneTimeSchedule, setOneTimeSchedule] = useState(false);
    const [timeData, setTimeData] = useState(null);
    const [deviceId] = useState({ deviceId: parseInt(params.id) });


    const handleTimeData = (data) => {
        setTimeData(data);
    };


    // function PickerComponent() {
    //     useEffect(() => {
    //         import ('../../node_modules/pickerjs/src/css/picker.css');
    //         const script = document.createElement('script');
    //         script.src = '../../node_modules/pickerjs/src/js/picker.js';
    //         script.async = true;

    //         script.onload = () => {
    //             let input = document.getElementById('pickerjs');
    //             if (input) {
    //                 new Picker(input, {
    //                     format: 'MM/DD HH:mm'
    //                 });
    //             }
    //         }
    //         document.body.appendChild(script);
    //         return () => {
    //             document.body.removeChild(script);
    //         }
    //     }, []);
    //     return <input type="text" id="pickerjs" />;
    // }


    const reFetch = () => { setChanged(prev => !prev); }

    const handleChecked = e => { // /toggleschedule
        setChecked(prev => !prev)
        console.log(e.target.checked);

        const toggleData = {
            toggleschedule : e.target.checked,
            id : parseInt(e.target.dataset.scheduletimeid),
            jobName :e.target.dataset.jobname,
            scheduletime : e.target.dataset.scheduletime,
            scheduletype : e.target.dataset.scheduletype,
            deviceId : parseInt(e.target.dataset.deviceid)
        }

        async function togglescheduleUpdate() {
            try {

                const togglescheduleOnOff = await fetch('/toggleschedule', {
                    method: 'PUT',
                    mode: 'cors',
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify(toggleData)
                });
                if (togglescheduleOnOff.ok) {
                    const result = await togglescheduleOnOff.json();
                    console.log('result', result);
                    reFetch(); // refetch get schedule data
                }
            } catch (error) {
                if (error) throw error;
            }
        }
        togglescheduleUpdate();
    }
    const handleAllow = e => {
        setSchedule({
            ...schedule,
            scheduletype: e.target.value
        })
    }
    const handleBlock = e => {
        setSchedule({
            ...schedule,
            scheduletype: e.target.value
        });
    }
    const handleScheduleDayOfWeek = e => {
        const isChecked = e.target.checked;
        const updatedDaysOfTheWeek = {
            ...schedule.daysOfTheWeek,
            [e.target.name]: isChecked ? parseInt(e.target.value) : undefined
        }
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            daysOfTheWeek: updatedDaysOfTheWeek,
            id: parseInt(params.id)
        }));

        console.log(schedule);
    }
    const handleScheduleTimes = e => {
        setSchedule({
            ...schedule,
            [e.target.name]: parseInt(e.target.value)
        })
    }


    // useEffect(() => { // fetch existing schedule data
    //     const getscheduleData = async () => {
    //     try {
    //             const scheduleData = await fetch('/getscheduledata', {
    //                 method: "POST",
    //                 mode: "cors",
    //                 headers: {
    //                     "Content-Type" : "application/json"
    //                 },
    //                 body: JSON.stringify(schedule)
    //             });
    //             if(scheduleData.ok) {
    //                 const returnedData = await scheduleData.json();
    //                 setReturnData(returnedData);
    //                 console.log('returned data: ', returnedData);
    //             }
    //         } catch (error) {
    //             if (error) throw error;
    //         }
    //     }
    //     getscheduleData();
    // }, [changed])

    const handleSubmit = async () => {
        console.log('preSubmittedData: ', {...timeData, ...schedule});
        try {
            const submitData = await fetch('/addeasyschedule', {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ ...timeData, ...schedule, ...deviceId })
            });
            if (submitData.ok) {
                setInvalidscheduleMessage({ error: false });
                // const res = submitData.json();
                // console.log(`message: ${res.message} timeData: ${res.timeData}`)
                console.log('submitData \t', submitData);

                reFetch();
            } else if (submitData.status === 422) {
                // const badResults = await submitData.json();
                // console.log('subdata message ', badResults.message)
                setInvalidscheduleMessage({
                    // message: badResults.message,
                    error: true,
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    const handleDeleteschedule = async e => {
        // submitButtonRef.current.disabled = true
        console.log(e?.target.dataset.id);
        const parseId = parseInt(e.target.dataset.id);

        try {
            const deleteschedule = await fetch("/deleteschedule", {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ parseId })
            });
            if (deleteschedule.ok) {
                const deleteReply = await deleteschedule.json();
                console.log("Deleted Data: ", deleteReply);
                reFetch();
            }
        } catch (error) {
            // submitButtonRef.current.disabled = false
            if (error) throw error;
        }
    }

    useEffect(() => { // get current device info (name)
        const p = parseInt(params.id);
        const getDeviceData = async () => {
            const getDeviceName = await fetch('/getspecificdevice', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ id: p })
            });
            if (getDeviceName.ok) {
                const devInfo = await getDeviceName.json();
                setDeviceInfo(devInfo);
            }
        }
        getDeviceData();
    }, []);

    const handlePickedSchedule = e => {
        // if (e.target.type !== 'radio') {
        //     return;
        // }
        console.log(e.target);
        console.log(e.target.value);

        const { onetime, recur } = e.target.dataset

        if (e.target.dataset.onetime === 'onetime') {
            setOneTimeSchedule(true);
            oneTimeScheduleRef.current.checked = true;
            recurringScheduleRef.current.checked = false;
        } else if (e.target.dataset.recur === 'recur') {
            setOneTimeSchedule(false);
            oneTimeScheduleRef.current.checked = false;
            recurringScheduleRef.current.checked = true;
        }
        console.log(oneTimeSchedule);
    }




    return (
        <>
            <div className="flex items-center justify-center w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12 pt-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex mt-8">
                            <h1 className="italic text-3xl text-center my-2">New schedule for device &quot;{deviceInfo?.name}&quot;</h1>
                            {/* <a href="https://schedule.help" target="_blank" rel="noreferrer" className="link hover:text-info" >
                                <GoInfo />
                            </a> */}
                        </div>
                        <div className="divider"></div>

                        <div className="flex flex-row gap-4 my-4">
                            <span>Recurring:</span>
                            <input
                                type="radio"
                                data-recur="recur"
                                ref={recurringScheduleRef}
                                onClick={handlePickedSchedule}
                                name="radio-2"
                                className="radio radio-primary"
                                checked={!oneTimeSchedule}
                            />
                            <span>Single Event:</span>
                            <input
                                type="radio"
                                data-onetime="onetime"
                                ref={oneTimeScheduleRef}
                                onClick={handlePickedSchedule}
                                name="radio-2"
                                className="radio radio-primary"
                                checked={oneTimeSchedule}
                            />
                        </div>

                        <div class="divider">Action</div>

                        <div className="flex items-center justify-center">
                            <div className="join m-4">
                                <input
                                    onClick={handleAllow}
                                    className={`btn join-item`}
                                    value="allow"
                                    type="radio"
                                    aria-label="Allow"
                                    name="options"
                                />
                                <input
                                    onClick={handleBlock}
                                    className={`btn join-item`}
                                    value="block"
                                    type="radio"
                                    aria-label="Block"
                                    name="options"
                                />
                            </div>
                        </div>



                        <div className={`flex items-center justify-center flex-col`}>
                            <div className="flex flex-col">

                                {oneTimeSchedule
                                ? <div class="divider">Date & Time</div>
                                : <><div class="divider">Time</div>
                                </>}
                                <div className="flex flex-row gap-2 mt-2 items-center justify-center text-primary mx-auto">
                                    {/* <input onChange={handleScheduleTimes} onFocus={handleFocusTime} onClick={handleTimeClick} name="hour" type="time" placeholder="Hour to recur" className="input italic input-bordered w-full max-w-xs" /> */}
                                    {/* <input onChange={handleScheduleTimes} name="minute" type="number" placeholder="Minute to recur" className="input italic input-bordered w-full max-w-xs" /> */}
                                    <TimeClock oneTime={oneTimeSchedule} handleTimeData={handleTimeData}  />

                                </div>

                                {oneTimeSchedule
                                ? <div></div>
                                : <><div class="divider">Repeat</div>

                                <div className="flex justify-center items-center gap-4">
                                    <div className="flex flex-row my-4">
                                        <div className="join">
                                            <input onChange={handleScheduleDayOfWeek} name="sun" value="0" type="checkbox" className="btn join-item rounded-l-full" aria-label="Sun"/>
                                            <input onChange={handleScheduleDayOfWeek} name="mon" value="1" type="checkbox" className={`btn join-item`} aria-label="M"/>
                                            <input onChange={handleScheduleDayOfWeek} name="tue" value="2" type="checkbox" className="btn join-item" aria-label="T"/>
                                            <input onChange={handleScheduleDayOfWeek} name="wed" value="3" type="checkbox" className="btn join-item" aria-label="W"/>
                                            <input onChange={handleScheduleDayOfWeek} name="thu" value="4" type="checkbox" className="btn join-item" aria-label="Th"/>
                                            <input onChange={handleScheduleDayOfWeek} name="fri" value="5" type="checkbox" className="btn join-item" aria-label="F"/>
                                            <input onChange={handleScheduleDayOfWeek} name="sat" value="6" type="checkbox" className="btn join-item rounded-r-full" aria-label="Sat"/>
                                        </div>
                                    </div>
                                </div>
                                </>}


                                <div class="divider"></div>
                                <div className="btn mb-8" onClick={handleSubmit}>Submit</div>

                                <table className="table table-zebra border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900 mb-8">
                                    <tbody>
                                        <tr className="font-bold sm:text-xl" align="center">
                                            <td>Schedule</td>
                                            <td>Action</td>
                                            <td>Off/On</td>
                                            <td>Delete</td>
                                        </tr>
                                            {
                                                returnData && returnData?.scheduleData?.map((scheduleData) => {
                                                    return (
                                                        <>
                                                            <tr key={scheduleData.id} align="center">
                                                                <td className="uppercase">{scheduleData.scheduletime}</td>
                                                                <td className={`uppercase ${scheduleData.scheduletype === 'block' ? 'text-red-500' : 'text-green-500'}`}>
                                                                    {scheduleData.scheduletype}
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="toggle toggle-success"
                                                                        data-scheduletimeid={scheduleData?.id}
                                                                        data-deviceid={scheduleData?.deviceId}
                                                                        data-jobname={scheduleData?.jobName}
                                                                        data-scheduletime={scheduleData?.scheduletime}
                                                                        data-scheduletype={scheduleData?.scheduletype}
                                                                        checked={scheduleData?.toggleschedule}
                                                                        // data-macaddress={scheduleData?.macAddress}
                                                                        onClick={e => handleChecked(e)}
                                                                    />
                                                                </td>
                                                                <td className="w-3 h-3">
                                                                    <div
                                                                    // className="bg-red-500 hover:bg-red-200 btn btn-circle animate-pulse"
                                                                    className="w-fit hover:cursor-pointer"
                                                                    onClick={e => handleDeleteschedule(e)}
                                                                    data-id={scheduleData?.id}
                                                                    >
                                                                        <GoTrash
                                                                            className="flex items-center justify-center z-10 w-6 h-6 pointer-events-none"

                                                                            // data-jobname={scheduleData?.jobName}
                                                                            ref={submitButtonRef}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </>
                                                    )
                                                })
                                            }
                                    </tbody>
                                </table>
                                <div role="alert" className={`alert alert-error w-[312px] sm:w-[360px] bottom-[200px] mx-auto ${invalidscheduleMessage.error ? 'absolute' : 'hidden'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{invalidscheduleMessage.message}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}