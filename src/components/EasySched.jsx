import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TimeClock from './TimeClock/TimeClock';


export default function EasySched({ triggerRender })
{
    const params = useParams();
    const [schedule, setSchedule] = useState({
        scheduletype: 'allow',
        id: parseInt(params.id),
        daysOfTheWeek: {
            sun: undefined,
            mon: undefined,
            tue: undefined,
            wed: undefined,
            thu: undefined,
            fri: undefined,
            sat: undefined,
        },
        toggleschedule: null
    });
    const submitButtonRef = useRef();
    const inputRef = useRef();
    const [checked, setChecked] = useState(true);
    const [deviceInfo, setDeviceInfo] = useState({});
    const [changed, setChanged] = useState(false);
    const [invalidscheduleMessage, setInvalidscheduleMessage] = useState({});
    const oneTimeScheduleRef = useRef(null);
    const recurringScheduleRef = useRef(null);
    const [oneTimeSchedule, setOneTimeSchedule] = useState(false);
    const [timeData, setTimeData] = useState(null);
    const [deviceId] = useState({ deviceId: parseInt(params.id) });
    const [dayOfTheWeekSelected, setDayOfTheWeekSelected] = useState(false);
    const [selectAllow, setSelectAllow] = useState(true);

    
    const handleTimeData = (data) => {
        setTimeData(data);
    };
    const checkDaysOfWeekNotChosen = () => {
        const chosenDaysOfWeek = Object.values(schedule.daysOfTheWeek);
        let mapChosen = chosenDaysOfWeek.map((i) => {
            if (typeof i === "number") {
                return true;
            } else {
                return false;
            }
        });
        let chosen = mapChosen.includes(true);
        console.log('chosen \t', chosen);
        return chosen;
    }

    useEffect(() => {
        setDayOfTheWeekSelected(checkDaysOfWeekNotChosen());
    }, [schedule.daysOfTheWeek, oneTimeSchedule]);

    const reFetch = () => { setChanged(prev => !prev); }

    const handleAllow = e => {
        setSchedule({
            ...schedule,
            scheduletype: e.target.value
        });
        setSelectAllow(true);
    }
    const handleBlock = e => {
        setSchedule({
            ...schedule,
            scheduletype: e.target.value
        });
        setSelectAllow(false);
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
    }
    const handleScheduleTimes = e => {
        setSchedule({
            ...schedule,
            [e.target.name]: parseInt(e.target.value)
        })
    }

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
                triggerRender();
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
    
    const handlePickedSchedule = e => {
        if (e.target.dataset.onetime === 'onetime') {
            setOneTimeSchedule(true);
            oneTimeScheduleRef.current.checked = true;
            recurringScheduleRef.current.checked = false;
            setSchedule((prev) => ({
                ...prev,
                daysOfTheWeek: {
                    sun: undefined,
                    mon: undefined,
                    tue: undefined,
                    wed: undefined,
                    thu: undefined,
                    fri: undefined,
                    sat: undefined,
                },
            }));
        } else if (e.target.dataset.recur === 'recur') {
            setOneTimeSchedule(false);
            oneTimeScheduleRef.current.checked = false;
            recurringScheduleRef.current.checked = true;
        }
        console.log(oneTimeSchedule);
        console.log('schedule \t', schedule);
    }

    return (
        <>
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
                        checked={selectAllow}
                    />
                    <input
                        onClick={handleBlock}
                        className={`btn join-item`}
                        value="block"
                        type="radio"
                        aria-label="Block"
                        name="options"
                        checked={!selectAllow}
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
                    <div className={`btn mb-8 ${oneTimeSchedule ? '' : dayOfTheWeekSelected ? '' : 'btn-disabled'}`} onClick={handleSubmit}>Submit</div>
                </div>
            </div>
                    
        </>
    )
}