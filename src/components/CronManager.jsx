import { useEffect, useRef, useState } from "react";
import { GoInfo, GoTrash } from "react-icons/go";

export default function CronManager({ triggerRender, deviceId, deviceName }) {
    const [cron, setCron] = useState({
        crontype: 'allow',
        id: deviceId ? parseInt(deviceId) : null,
        toggleCron: true,
        jobName: '',
        croninput: ''
    });

    const inputRef = useRef();
    const [invalidCronMessage, setInvalidCronMessage] = useState({});
    
    // Update state when deviceId prop changes
    useEffect(() => {
        if (deviceId) {
            setCron(prev => ({
                ...prev,
                id: parseInt(deviceId)
            }));
        }
    }, [deviceId]);

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
            id: cron.id,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async () => {
        if (!cron.id) {
            setInvalidCronMessage({ error: true, message: "Device ID is missing!" });
            return;
        }

        if (!cron.croninput || cron.croninput.trim() === '') {
            setInvalidCronMessage({ error: true, message: "Please enter a valid cron expression!" });
            return;
        }

        try {
            const submitData = await fetch('/addschedule', {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ...cron, cron: cron.croninput })
            });
            
            if (submitData.ok) {
                setInvalidCronMessage({ error: false });
                const results = await submitData.json();
                console.log(results);
                if (inputRef.current) inputRef.current.value = '';
                setCron(prev => ({ ...prev, croninput: '' }));
                triggerRender();
            } else if (submitData.status === 422) {
                const badResults = await submitData.json();
                console.log('subdata message ', badResults.message);
                setInvalidCronMessage({
                    message: badResults.message,
                    error: true,
                });
            } else {
                setInvalidCronMessage({
                    message: "Failed to create schedule. Please try again.",
                    error: true,
                });
            }
        } catch (e) {
            if (e) throw e;
            console.log('e: ', e);
            setInvalidCronMessage({
                message: "Error submitting schedule. Please check your connection.",
                error: true,
            });
        }
    }
    
    return (
        <>
            <div className="flex mt-8">
                <a href="https://cron.help" target="_blank" rel="noreferrer" className="link hover:text-info">
                    <GoInfo />
                </a>
            </div>
            
            <div className="flex items-center justify-center flex-col">
                <div className="flex flex-col">
                    <div className="flex justify-center items-center gap-4">
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
                    
                    <div className="flex items-center justify-center gap-4 my-2">
                        <label className="label cursor-pointer">
                            <span className="label-text">Allow</span>
                            <input 
                                type="radio" 
                                name="crontype" 
                                value="allow" 
                                checked={cron.crontype === 'allow'} 
                                onChange={handleAllow} 
                                className="radio radio-success radio-sm"
                            />
                        </label>
                        <label className="label cursor-pointer">
                            <span className="label-text">Block</span>
                            <input 
                                type="radio" 
                                name="crontype" 
                                value="block" 
                                checked={cron.crontype === 'block'} 
                                onChange={handleBlock} 
                                className="radio radio-error radio-sm"
                            />
                        </label>
                    </div>

                    <div className="flex justify-center mt-2">
                        <button 
                            className="btn btn-primary btn-sm w-full max-w-xs" 
                            onClick={handleSubmit}
                        >
                            Submit Schedule
                        </button>
                    </div>
                </div>
            </div>

            {invalidCronMessage.error && (
                <div role="alert" className="alert alert-error mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{invalidCronMessage.message}</span>
                </div>
            )}
        </>
    );
}
