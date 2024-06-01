import { useEffect, useState } from "react";
import CronManager from "../CronManager";
import EasySched from "../EasySched";
import { useParams } from "react-router-dom";
import ScheduleData from "./ScheduleData";


export default function Scheduler() {
    const [deviceInfo, setDeviceInfo] = useState({});
    const params = useParams();
    const [scheduleMode, setScheduleMode] = useState("standard");
    const [render, setRender] = useState(false);

    const [changed, setChanged] = useState(false);
    const triggerRender = () => {
        setChanged(prev => !prev);
    }
    const reRender = () => {
        setRender(prev => !prev);
    };
    const handleSelectScheduleMode = e => {
        console.log(e.target.value);
      if (e.target.value === "standard") {
        setScheduleMode("standard");
        reRender();
      } else if (e.target.value === "advanced") {
        setScheduleMode("advanced");
        reRender();
      }
    };
    useEffect(() => {
        console.log('re render...')
    }, [scheduleMode, render]);

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
                            <h1 className="text-3xl text-center my-2">Adjust schedule for device &quot;{deviceInfo?.name}&quot;</h1>
                        </div>
                        <div className="divider"></div>
                            <select className="select select-bordered w-full max-w-xs" onChange={handleSelectScheduleMode}>
                                <option disabled selected>Scheduler Type...</option>
                                <option value="standard">Standard</option>
                                <option value="advanced">Cron</option>
                            </select>
                        <div className="divider"></div>
                        {scheduleMode === "standard" ? (
                            <EasySched triggerRender={triggerRender} />
                        ) : (<CronManager triggerRender={triggerRender} />)}
                        <div className="divider"></div>
                        <ScheduleData changed={changed} />
                    </div>
                </div>
            </div>
        </>
    );
}