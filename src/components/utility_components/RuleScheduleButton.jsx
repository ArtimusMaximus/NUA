import { useEffect, useRef, useState } from "react";
import { MdSchedule } from "react-icons/md";
import { GoTrash } from "react-icons/go";
import TimeClock from "../TimeClock/TimeClock";
import { dateIsInPast } from "../utility_functions/date_in_past_checker";
import { convertSelectedDateForComparison } from "../utility_functions/convertSelectedDate";
import { convertDigitsToDOW } from "../utility_functions/convertDigitsToDOTW";

function formatMinutes(min) {
    const m = min ?? 0;
    return m.toString().length === 1 ? "0" + m : m;
}

export default function RuleScheduleButton({ trafficRuleId, scheduleData, onStateChange }) {
    const scheduleDialogRef = useRef();
    const badDateModalRef = useRef();
    const oneTimeScheduleRef = useRef();
    const recurringScheduleRef = useRef();
    const [submitBtnLoading, setSubmitBtnLoading] = useState(false);
    const [oneTimeSchedule, setOneTimeSchedule] = useState(false);
    const [scheduleAction, setScheduleAction] = useState('allow');
    const [timeData, setTimeData] = useState(null);
    const [dayOfTheWeekSelected, setDayOfTheWeekSelected] = useState(false);
    const [invalidscheduleMessage, setInvalidscheduleMessage] = useState({});
    const [schedule, setSchedule] = useState({
        daysOfTheWeek: {
            sun: undefined,
            mon: undefined,
            tue: undefined,
            wed: undefined,
            thu: undefined,
            fri: undefined,
            sat: undefined,
        },
    });

    const scheduleEnabled = scheduleData?.scheduleEnabled || false;
    const scheduleType = scheduleData?.scheduleType;
    const scheduleActionText = scheduleData?.scheduleAction || 'allow';

    const d1 = useRef();
    const d2 = useRef();
    const d3 = useRef();
    const d4 = useRef();
    const d5 = useRef();
    const d6 = useRef();
    const d7 = useRef();

    const timer = t => new Promise(res => setTimeout(res, t));

    const checkDaysOfWeekNotChosen = () => {
        const chosenDaysOfWeek = Object.values(schedule.daysOfTheWeek);
        let mapChosen = chosenDaysOfWeek.map((i) => {
            if (typeof i === "number") return true;
            return false;
        });
        let chosen = mapChosen.includes(true);
        return chosen;
    };

    useEffect(() => {
        setDayOfTheWeekSelected(checkDaysOfWeekNotChosen());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedule.daysOfTheWeek, oneTimeSchedule]);

    const resetToInitialState = () => {
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
        setInvalidscheduleMessage({});
        setDayOfTheWeekSelected(false);
        if (d1.current) d1.current.checked = false;
        if (d2.current) d2.current.checked = false;
        if (d3.current) d3.current.checked = false;
        if (d4.current) d4.current.checked = false;
        if (d5.current) d5.current.checked = false;
        if (d6.current) d6.current.checked = false;
        if (d7.current) d7.current.checked = false;
    };

    const handleTimeData = (data) => {
        setTimeData(data);
    };

    const handleAllow = e => {
        setScheduleAction('allow');
    };

    const handleBlock = e => {
        setScheduleAction('block');
    };

    const handleScheduleDayOfWeek = e => {
        const isChecked = e.target.checked;
        const updatedDaysOfTheWeek = {
            ...schedule.daysOfTheWeek,
            [e.target.name]: isChecked ? parseInt(e.target.value) : undefined,
        };
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            daysOfTheWeek: updatedDaysOfTheWeek,
        }));
    };

    const handlePickedSchedule = e => {
        if (e.target.dataset.onetime === 'onetime') {
            setOneTimeSchedule(true);
            if (oneTimeScheduleRef.current) oneTimeScheduleRef.current.checked = true;
            if (recurringScheduleRef.current) recurringScheduleRef.current.checked = false;
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
            if (oneTimeScheduleRef.current) oneTimeScheduleRef.current.checked = false;
            if (recurringScheduleRef.current) recurringScheduleRef.current.checked = true;
        }
    };

    const handleSubmit = async () => {
        if (!trafficRuleId) {
            setInvalidscheduleMessage({ error: true, message: "Traffic rule ID is missing!" });
            return;
        }

        const selectedDateTime = convertSelectedDateForComparison(timeData);
        const isPastDate = dateIsInPast(selectedDateTime);

        if (isPastDate && oneTimeSchedule) {
            setInvalidscheduleMessage({ error: true, message: "Cannot schedule a specific date that is in the past!" });
            badDateModalRef.current.showModal();
            return;
        }

        let daysOfTheWeekNumerals;
        if (!oneTimeSchedule) {
            daysOfTheWeekNumerals = [...Object.values(schedule.daysOfTheWeek).filter(i => i !== undefined)];
            if (!daysOfTheWeekNumerals || daysOfTheWeekNumerals.length === 0) {
                setInvalidscheduleMessage({ error: true, message: "Please select at least one day of the week!" });
                return;
            }
        }

        const modifiedDaysOfTheWeek = daysOfTheWeekNumerals;
        const oneTime = oneTimeSchedule;

        try {
            setSubmitBtnLoading(true);
            const submitData = await fetch('/addtrafficruleschedule', {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...timeData, modifiedDaysOfTheWeek, scheduleAction, trafficRuleId })
            });

            if (submitData.ok) {
                setInvalidscheduleMessage({ error: false });
                timer(400).then(() => setSubmitBtnLoading(false));
                scheduleDialogRef.current?.close();
                resetToInitialState();
                onStateChange?.();
            } else if (submitData.status === 422) {
                timer(400).then(() => setSubmitBtnLoading(false));
                setInvalidscheduleMessage({ error: true });
            }
        } catch (error) {
            timer(400).then(() => setSubmitBtnLoading(false));
            console.error(error);
        }
    };

    const handleDeleteSchedule = async () => {
        try {
            const res = await fetch('/deletetrafficruleschedule', {
                method: "DELETE",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trafficRuleId })
            });
            if (res.ok) {
                onStateChange?.();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleSchedule = async (toggleOn) => {
        try {
            const res = await fetch('/toggletrafficruleschedule', {
                method: "PUT",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trafficRuleId, toggleOn })
            });
            if (res.ok) {
                onStateChange?.();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Build a human-readable description of the currently saved schedule
    const currentScheduleDescription = () => {
        if (!scheduleEnabled || !scheduleType) return null;
        const hour = scheduleData?.scheduleHour ?? 0;
        const minute = scheduleData?.scheduleMinute ?? 0;
        const time = `${hour}:${formatMinutes(minute)}`;

        if (scheduleType === 'recurring') {
            const days = scheduleData?.scheduleDays;
            let dow = null;
            if (days) {
                dow = convertDigitsToDOW(days);
            }
            const dayText = dow && dow.length < 7
                ? dow.map((day, i) => day + (i === dow.length - 1 ? '' : ',')).join('')
                : 'All';
            return { time, extra: dayText };
        }
        // one-time
        return { time, extra: scheduleData?.scheduleDate || '' };
    };

    const savedSchedule = currentScheduleDescription();

    return (
        <>
            <button
                type="button"
                className={`btn btn-xs gap-0 ${scheduleEnabled ? "btn-warning" : "btn-outline btn-warning"}`}
                onClick={() => scheduleDialogRef.current.showModal()}
                title={scheduleEnabled ? "Edit schedule" : "Schedule this rule"}
            >
                <MdSchedule className="w-3.5 h-3.5" />
            </button>

            <dialog ref={scheduleDialogRef} className="modal">
                <div className="modal-box max-w-2xl w-full">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-base-content">Schedule Traffic Rule</h3>
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost" aria-label="Close schedule modal">
                                ✕
                            </button>
                        </form>
                    </div>

                    {/* Existing Schedule */}
                    <div className="bg-base-200 rounded-xl p-5 mb-5">
                        <h4 className="text-base font-semibold mb-3 text-base-content">Existing Schedule</h4>
                        {savedSchedule ? (
                            <table className="table table-zebra w-full rounded-lg">
                                <thead>
                                    <tr className="font-bold" align="center">
                                        <th>Time</th>
                                        <th>Action</th>
                                        <th>Off/On</th>
                                        <th>Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr align="center">
                                        <td className="uppercase w-1/4 text-xs sm:text-sm">
                                            <div>{savedSchedule.time}</div>
                                            <div className="text-base-content/60">{savedSchedule.extra}</div>
                                        </td>
                                        <td className={`uppercase ${scheduleActionText === 'block' ? 'text-red-500' : 'text-green-500'}`}>
                                            {scheduleActionText}
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-success"
                                                checked={scheduleEnabled}
                                                onClick={() => handleToggleSchedule(!scheduleEnabled)}
                                                aria-label="Toggle schedule on/off"
                                            />
                                        </td>
                                        <td className="w-3 h-3">
                                            <div className="w-fit hover:cursor-pointer" onClick={handleDeleteSchedule} title="Delete schedule">
                                                <GoTrash className="flex items-center justify-center w-6 h-6 pointer-events-none" />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <div className="mx-auto text-center text-base-content/60">There is no schedule to display...</div>
                        )}
                    </div>

                    {/* New Schedule Form */}
                    <div className="border-t border-base-300 pt-4">
                        <div className="flex items-center justify-center">
                            <div className="join m-4 bg-base-200 border-8 border-base-200 rounded-lg">
                                <input
                                    type="radio"
                                    data-recur="recur"
                                    ref={recurringScheduleRef}
                                    onClick={handlePickedSchedule}
                                    onChange={handlePickedSchedule}
                                    name="radio-2"
                                    className="btn join-item"
                                    checked={!oneTimeSchedule}
                                    aria-label="Recurring"
                                />
                                <input
                                    type="radio"
                                    data-onetime="onetime"
                                    ref={oneTimeScheduleRef}
                                    onClick={handlePickedSchedule}
                                    onChange={handlePickedSchedule}
                                    name="radio-2"
                                    className="btn join-item"
                                    checked={oneTimeSchedule}
                                    aria-label="One Time"
                                />
                            </div>
                        </div>

                    <div className="divider">Action</div>

                    <div className="flex items-center justify-center">
                        <div className="join m-4 bg-base-200 border-8 border-base-200 rounded-lg">
                            <input
                                onClick={handleAllow}
                                onChange={handleAllow}
                                className={`btn join-item`}
                                value="allow"
                                type="radio"
                                aria-label="Allow"
                                name="options"
                                checked={scheduleAction === 'allow'}
                            />
                            <input
                                onClick={handleBlock}
                                onChange={handleBlock}
                                className={`btn join-item`}
                                value="block"
                                type="radio"
                                aria-label="Block"
                                name="options"
                                checked={scheduleAction === 'block'}
                            />
                        </div>
                    </div>

                    <div className={`flex items-center justify-center flex-col`}>
                        <div className="flex flex-col">
                            {oneTimeSchedule
                                ? <div className="divider">Date & Time</div>
                                : <><div className="divider">Time</div></>}

                            <div className="flex flex-row gap-2 mt-2 items-center justify-center text-primary mx-auto">
                                <TimeClock oneTime={oneTimeSchedule} handleTimeData={handleTimeData} />
                            </div>

                            {oneTimeSchedule
                                ? <div></div>
                                : <>
                                    <div className="divider">Repeat</div>
                                    <div className="flex justify-center items-center gap-4">
                                        <div className="flex flex-row my-4">
                                            <div className="join">
                                                <input
                                                    ref={d1}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="sun"
                                                    value="0"
                                                    type="checkbox"
                                                    className="btn join-item rounded-l-full"
                                                    aria-label="Sun"
                                                />
                                                <input
                                                    ref={d2}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="mon"
                                                    value="1"
                                                    type="checkbox"
                                                    className="btn join-item"
                                                    aria-label="M"
                                                />
                                                <input
                                                    ref={d3}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="tue"
                                                    value="2"
                                                    type="checkbox"
                                                    className="btn join-item"
                                                    aria-label="T"
                                                />
                                                <input
                                                    ref={d4}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="wed"
                                                    value="3"
                                                    type="checkbox"
                                                    className="btn join-item"
                                                    aria-label="W"
                                                />
                                                <input
                                                    ref={d5}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="thu"
                                                    value="4"
                                                    type="checkbox"
                                                    className="btn join-item"
                                                    aria-label="Th"
                                                />
                                                <input
                                                    ref={d6}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="fri"
                                                    value="5"
                                                    type="checkbox"
                                                    className="btn join-item"
                                                    aria-label="F"
                                                />
                                                <input
                                                    ref={d7}
                                                    onChange={handleScheduleDayOfWeek}
                                                    name="sat"
                                                    value="6"
                                                    type="checkbox"
                                                    className="btn join-item rounded-r-full"
                                                    aria-label="Sat"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>}

                            <div className="divider"></div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm flex-1"
                                    onClick={handleSubmit}
                                >
                                    {submitBtnLoading ? <span className="loading loading-spinner w-6 h-6 text-success"></span> : 'Save Schedule'}
                                </button>
                                <form method="dialog">
                                    <button className="btn btn-sm">Close</button>
                                </form>
                            </div>

                            {invalidscheduleMessage.error && (
                                <div className="text-center text-error font-semibold">
                                    {invalidscheduleMessage.message || 'Invalid schedule!'}
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            </dialog>

            {/* Bad date modal */}
            <dialog ref={badDateModalRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Invalid Date</h3>
                    <p className="py-4">Cannot schedule a specific date that is in the past!</p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}
