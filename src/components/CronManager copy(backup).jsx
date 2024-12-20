import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { GoInfo, GoTrash } from "react-icons/go";

// todo: toggle on off does not reflect the actual current status on page change....and upon returning to page & toggling, scheduled jobs are not reflected properly

export default function CronManager()
{
    const params = useParams();
    const [cron, setCron] = useState({
        crontype: 'allow',
        id: parseInt(params.id),
        toggleCron: true,
        jobName: ''
    });
    const submitButtonRef = useRef();
    const inputRef = useRef();
    const [checked, setChecked] = useState(true);
    const [returnData, setReturnData] = useState(null);
    const [changed, setChanged] = useState(false);
    const [invalidCronMessage, setInvalidCronMessage] = useState({});
    const [deviceInfo, setDeviceInfo] = useState({});


    const triggerRender = () => {
        setChanged(prev => !prev);
    }
    const handleChecked = e => { // /togglecron
        setChecked(prev => !prev)

        // const deviceId = parseInt(e.target.dataset.checked)
        // const jName = e.target.dataset.jobname
        // console.log('jName: ', jName);
        // setCron({
        //     ...cron,
        //     id: parseInt(e.target.dataset.crontimeid),
        //     // deviceId: e.target.dataset.deviceId,
        //     toggleCron: checked,
        //     jobName: e.target.dataset.jobname,
        // });
        // console.log('cron in handle checked', cron);
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
                    // body: JSON.stringify({ cron, deviceId, c, jName })
                });
                if (toggleCronOnOff.ok) {
                    const result = await toggleCronOnOff.json();
                    console.log('result', result);
                    triggerRender(); // refetch get cron data
                }
            } catch (error) {
                if (error) throw error;
            }
        }
        toggleCronUpdate();
    }
    const handleAllow = e => {
        setCron({
            ...cron,
            crontype: e.target.value
        })
    }
    const handleBlock = e => {
        setCron({
            ...cron,
            crontype: e.target.value
        });
    }
    const handleCronData = e => {
        setCron({
            ...cron,
            id: parseInt(params.id),
            [e.target.name]: e.target.value
        })
        // console.log(cron);
    }

    useEffect(() => { // fetch existing cron data
        const getCronData = async () => {
        try {
                const cronData = await fetch('/getcrondata', {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify(cron)
                });
                if(cronData.ok) {
                    const returnedData = await cronData.json();
                    setReturnData(returnedData);
                    console.log('returned data: ', returnedData);
                }
            } catch (error) {
                if (error) throw error;
            }
        }
        getCronData();
    }, [changed])



    const handleSubmit = async () => {
        try {
            const submitData = await fetch('/addschedule', {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify(cron)
            });
            if (submitData.ok) {
                setInvalidCronMessage({ error: false });
                const results = await submitData.json();
                console.log(results);
                inputRef.current.value = '';
                triggerRender();
            } else if (submitData.status === 422) {
                const badResults = await submitData.json();
                console.log('subdata message ', badResults.message)
                setInvalidCronMessage({
                    message: badResults.message,
                    error: true,
                });
            }
        } catch (e) {
            if (e) throw e;
            console.log('e: ', e)
        }
    }
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
                triggerRender();
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

    return (
        <>
            <div className="flex items-center justify-center w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12 pt-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex mt-8">
                            <h1 className="text-3xl text-center my-2">Adjust Cron for device &quot;{deviceInfo?.name}&quot;</h1>
                            <a href="https://cron.help" target="_blank" rel="noreferrer" className="link hover:text-info" >
                                <GoInfo />
                            </a>
                        </div>
                        <div className="divider"></div>
                        <div className="flex items-center justify-center flex-col">
                            <div className="flex flex-col">
                                <div className="flex justify-center items-center gap-4">
                                    {/* <label htmlFor="croninput">Cron:</label> */}
                                    <div className="flex flex-row my-2">
                                        <input
                                            className={`input input-bordered italic ${invalidCronMessage.error ? 'border-error' : ''}`}
                                            name="croninput"
                                            ref={inputRef}
                                            placeholder="*/5 * * * *"
                                            onChange={e => handleCronData(e)}
                                        />
                                    </div>
                                </div>
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
                                <div className="btn mb-8" onClick={handleSubmit}>Submit</div>

                                <table className="table table-zebra border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900 mb-8">
                                    <tbody>
                                        <tr className="font-bold sm:text-xl" align="center">
                                            <td>Cron</td>
                                            <td>Action</td>
                                            <td>Off/On</td>
                                            <td>Delete</td>
                                        </tr>
                                            {
                                                returnData && returnData?.cronData?.map((cronData) => {
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
                                                                        onClick={e => handleChecked(e)}
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
                                                })
                                            }
                                    </tbody>
                                </table>
                                <div role="alert" className={`alert alert-error w-[312px] sm:w-[360px] bottom-[200px] mx-auto ${invalidCronMessage.error ? 'absolute' : 'hidden'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{invalidCronMessage.message}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}