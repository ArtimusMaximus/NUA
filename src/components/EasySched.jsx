import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TimeClock from './TimeClock/TimeClock';
import { dateIsInPast } from "./utility_functions/date_in_past_checker";
import { convertSelectedDateForComparison } from "./utility_functions/convertSelectedDate";


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
    const [deviceId, setDeviceId] = useState({ deviceId: parseInt(params.id) });
    const [dayOfTheWeekSelected, setDayOfTheWeekSelected] = useState(false);
    const [selectAllow, setSelectAllow] = useState(true);
    const badDateModalRef = useRef();

    const d1 = useRef();
    const d2 = useRef();
    const d3 = useRef();
    const d4 = useRef();
    const d5 = useRef();
    const d6 = useRef();
    const d7 = useRef();

    const resetToInitialState = () => {
        console.log('Reset Called!');
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
        setChanged(false);
        setInvalidscheduleMessage({});
        // oneTimeScheduleRef.current = null;
        // recurringScheduleRef.current = null;
        // setOneTimeSchedule(false);
        // setTimeData(null);
        setDeviceId({ deviceId: parseInt(params.id) });
        setDayOfTheWeekSelected(false);
        // setSelectAllow(true);
        if (!oneTimeSchedule) {
            d1.current.checked = false;
            d2.current.checked = false;
            d3.current.checked = false;
            d4.current.checked = false;
            d5.current.checked = false;
            d6.current.checked = false;
            d7.current.checked = false;
        }
    };

    const handleTimeData = (data) => {
        setTimeData(data);
    };
    const checkDaysOfWeekNotChosen = () => {
        const chosenDaysOfWeek = Object.values(schedule.daysOfTheWeek);
        console.log('chosenDaysOfWeek \t', chosenDaysOfWeek);

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
        const selectedDateTime = convertSelectedDateForComparison(timeData);
        const isPastDate = dateIsInPast(selectedDateTime);

        if (isPastDate && oneTimeSchedule) {
            setInvalidscheduleMessage({ error: true, message: "Cannot schedule a specific date that is in the past!" });
            badDateModalRef.current.showModal();
            return;
        }
        console.log('isnt in past and onetimeschedule');
        let daysOfTheWeekNumerals = [...Object.values(daysOfTheWeek)];
        let modifiedDaysOfTheWeek = daysOfTheWeekNumerals;

        try {
            const submitData = await fetch('/addeasyschedule', {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ ...modifiedDaysOfTheWeek, ...schedule, ...deviceId })
                // body: JSON.stringify({ ...timeData, ...schedule, ...deviceId })
            });
            if (submitData.ok) {
                setInvalidscheduleMessage({ error: false });
                // const res = submitData.json();
                // console.log(`message: ${res.message} timeData: ${res.timeData}`)
                console.log('submitData \t', submitData);

                // reFetch();
                triggerRender();
                resetToInitialState();
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
                                <input ref={d1} onChange={handleScheduleDayOfWeek} name="sun" value="0" type="checkbox" className="btn join-item rounded-l-full" aria-label="Sun"/>
                                <input ref={d2} onChange={handleScheduleDayOfWeek} name="mon" value="1" type="checkbox" className={`btn join-item`} aria-label="M"/>
                                <input ref={d3} onChange={handleScheduleDayOfWeek} name="tue" value="2" type="checkbox" className="btn join-item" aria-label="T"/>
                                <input ref={d4} onChange={handleScheduleDayOfWeek} name="wed" value="3" type="checkbox" className="btn join-item" aria-label="W"/>
                                <input ref={d5} onChange={handleScheduleDayOfWeek} name="thu" value="4" type="checkbox" className="btn join-item" aria-label="Th"/>
                                <input ref={d6} onChange={handleScheduleDayOfWeek} name="fri" value="5" type="checkbox" className="btn join-item" aria-label="F"/>
                                <input ref={d7} onChange={handleScheduleDayOfWeek} name="sat" value="6" type="checkbox" className="btn join-item rounded-r-full" aria-label="Sat"/>
                            </div>
                        </div>
                    </div>
                    </>}
                    <div class="divider"></div>
                    <div className={`btn mb-8 ${oneTimeSchedule ? '' : dayOfTheWeekSelected ? '' : 'btn-disabled'}`} onClick={handleSubmit}>Submit</div>
                </div>
            </div>
            <dialog ref={badDateModalRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-error">Error!</h3>
                    <p className="py-4 italic text-xl">{invalidscheduleMessage.message}</p>
                    <div className="modal-action">
                    <form method="dialog">
                        <button className="btn">Close</button>
                    </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}