import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GoInfo, GoTrash } from "react-icons/go";

export default function CronManager({ triggerRender }) {
    const params = useParams();
    const [cron, setCron] = useState({
        crontype: 'allow',
        id: parseInt(params.id),
        toggleCron: true,
        jobName: ''
    });

    const inputRef = useRef();
    const [invalidCronMessage, setInvalidCronMessage] = useState({});
    const [startDate, setStartDate] = useState(new Date()); // Assuming start date logic

    // Handle the state for crontype (allow/block)
    const handleAllow = e => {
        setCron({
            ...cron,
            crontype: e.target.value
        });
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
        });
    }

    const handleSubmit = async () => {
        try {
            const submitData = await fetch('/addschedule', {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
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
            console.error('Error:', e);
        }
    }

    // useEffect to reset the start date or handle time initialization based on schedule type
    useEffect(() => {
        if (cron.crontype === 'allow') {
            // Logic to reset the starting date for "allow" schedule
            setStartDate(new Date()); // Set to the current date
        } else if (cron.crontype === 'block') {
            // Logic to reset the starting date for "block" schedule
            setStartDate(new Date()); // Set to the current date or some other logic
        }
    }, [cron.crontype]);

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
                    <div className="flex items-center justify-center">
                        <div className="join m-4">
                            <input
                                onChange={handleAllow}
                                className={`btn join-item`}
                                value="allow"
                                type="radio"
                                aria-label="Allow"
                                name="options"
                                checked={cron.crontype === "allow"}
                            />
                            <input
                                onChange={handleBlock}
                                className={`btn join-item`}
                                value="block"
                                type="radio"
                                aria-label="Block"
                                name="options"
                                checked={cron.crontype === "block"}
                            />
                        </div>
                    </div>
                    <div className="btn mb-8" onClick={handleSubmit}>Submit</div>
                    <div role="alert" className={`alert alert-error w-[312px] sm:w-[360px] bottom-[200px] mx-auto ${invalidCronMessage.error ? 'absolute' : 'hidden'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{invalidCronMessage.message}</span>
                    </div>
                </div>
            </div>
        </>
    )
}
