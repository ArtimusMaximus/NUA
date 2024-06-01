import { useEffect, useState, useRef } from "react";
import { GoInfo, GoTrash } from "react-icons/go";
import { useParams } from "react-router-dom";

export default function ScheduleData({ changed })
{
    const [returnData, setReturnData] = useState(null);
    // const [checked, setChecked] = useState(true);
    const submitButtonRef = useRef();
    const [changed2, setChanged2] = useState(false);
    const params = useParams();

    const triggerRender2 = () => {
        setChanged2(prev => !prev);
    }
    const [cron] = useState({
        crontype: 'allow',
        id: parseInt(params.id),
        toggleCron: true,
        jobName: ''
    });
    

    const handleChecked = e => { // /togglecron
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
                console.error('Error on initial fetch...');
                if (error) throw error;
            }
        }
        getCronData();
    }, [changed, changed2])

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
        </>
    );
}