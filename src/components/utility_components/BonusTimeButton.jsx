import { useEffect, useRef, useState } from "react";
import DisplayBonusTimer from "./DisplayBonusTimer";

export default function BonusTimeButton({ deviceId }) {

    const bonusDialogRef = useRef();
    const [submitBtnLoading, setSubmitBtnLoading] = useState(false);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(30);
    const numsCheckArr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
    const minutesArr = (function generateMinutes() {
        let maxMins = 59;
        let arr = [];
        while(maxMins > -1) {
            arr.push(maxMins);
            maxMins--;
        }
        return arr;
    })();
    const timer = t => new Promise(res => setTimeout(res, t));
    const [serverBonusTimer, setServerBonusTimer] = useState(null);

    const handleHoursIncDec = e => {
        if (e.target.id === "decrementHours") {
            setHours(prev => Math.max(prev - 1, 0));
        } else if (e.target.id === "incrementHours") {
            setHours(prev => Math.min(prev + 1, 23));
        }
    }
    const handleMinutesIncDec = e => {
        if (e.target.id === "decrementMinutes") {
            setMinutes(prev => Math.max(prev - 1, 0));
        } else if (e.target.id === "incrementMinutes") {
            setMinutes(prev => Math.min(prev + 1, 59));
        }
    }
    const handleInputHoursChange = e => {
        if (!numsCheckArr.includes(parseInt(e.target.value))) {
            setHours(0);
        } else if (parseInt(e.target.value) > 23) {
            setHours(23);
        } else if (parseInt(e.target.value) < 0) {
            setHours(0);
        } else {
            setHours(parseInt(e.target.value))
        }
    }
    const handleInputMinutesChange = e => {
        if (!minutesArr.includes(parseInt(e.target.value))) {
            setMinutes(0);
        } else if (parseInt(e.target.value) > 59) {
            setMinutes(59);
        } else if (parseInt(e.target.value) < 0) {
            setMinutes(0);
        } else {
            setMinutes(parseInt(e.target.value))
        }
    }

    useEffect(() => {
        // console.log("hours\t", hours);
        // if (serverBonusTimer !== 0 || serverBonusTimer !== null) { // decrements milliTime and passes to DisplayBonusTimeComponent
        //     if (serverBonusTimer <= 0) {
        //         setServerBonusTimer(null);
        //         return;
        //     }
        //     const interval = setInterval(() => {
        //         setServerBonusTimer(prev => prev - 1000);
        //     }, 1000);
        //     return () => clearInterval(interval);
        // }

    // }, [hours, serverBonusTimer])
    }, [hours, serverBonusTimer]);

    const handleBonusTime = () => {
        bonusDialogRef.current.showModal();
    }
    const handleAddTime = async () => {
        setSubmitBtnLoading(true);
        const data = { hours: hours, minutes: minutes, deviceId: deviceId };
        try {
            const addBonusTime = await fetch("/addbonustime", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify(data)
            });
            if (addBonusTime.ok) {
                timer(500)
                    .then(() => setSubmitBtnLoading(false))
                    .then(() => bonusDialogRef.current.close())
                const response = await addBonusTime.json();
                console.log("response\t", response.msg);
                console.log('response.time\t', response.timer);
                setServerBonusTimer(response.timer);
                setHours(0);
                setMinutes(30);
            }
            } catch (error) {
                timer(500)
                    .then(() => setSubmitBtnLoading(false))
                // .then(() => bonusDialogRef.current.close())
            console.error(error);
        }
    }

    return (
        <>
            <div className="btn btn-block btn-info" onClick={handleBonusTime}>
                {/* Bonus Time {serverBonusTimer !== null && serverBonusTimer > 0 ? serverBonusTimer : ""} */}
                Bonus Time {serverBonusTimer && <DisplayBonusTimer milliTime={serverBonusTimer} />}
            </div>




            <dialog ref={bonusDialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Add Bonus Time</h3>

                    <div className="flex flex-col items-center justify-center gap-4 m-8">
                        <form className="max-w-xs mx-auto">
                            {/* <label for="bedrooms-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Hours:</label> */}
                            <div className="relative flex items-center max-w-[11rem]">
                                <button type="button" id="decrementHours" onClick={handleHoursIncDec} data-input-counter-decrement="bedrooms-input" className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none z-50">
                                    <svg className="w-3 h-3 text-gray-900 dark:text-white z-0 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
                                    </svg>
                                </button>
                                <input type="text" id="bedrooms-input" onChange={handleInputHoursChange} data-input-counter-max="23" className="bg-gray-50 border-x-0 border-gray-300 h-11 font-medium text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full pb-6 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" value={hours} required />
                                <div className="absolute bottom-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex items-center text-xs text-gray-400 space-x-1 rtl:space-x-reverse">
                                    <span>Hours</span>
                                </div>
                                <button type="button" id="incrementHours" onClick={handleHoursIncDec} data-input-counter-increment="bedrooms-input" className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none z-50">
                                    <svg className="w-3 h-3 text-gray-900 dark:text-white z-0 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                                    </svg>
                                </button>
                            </div>
                        </form>
                        <form className="max-w-xs mx-auto">
                            {/* <label for="bedrooms-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Minutes:</label> */}
                            <div className="relative flex items-center max-w-[11rem]">
                                <button type="button" id="decrementMinutes" onClick={handleMinutesIncDec} data-input-counter-decrement="bedrooms-input" className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none z-50">
                                    <svg className="w-3 h-3 text-gray-900 dark:text-white z-0 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
                                    </svg>
                                </button>
                                <input type="text" id="bedrooms-input" onChange={handleInputMinutesChange} className="bg-gray-50 border-x-0 border-gray-300 h-11 font-medium text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full pb-6 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" value={minutes} required />
                                <div className="absolute bottom-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex items-center text-xs text-gray-400 space-x-1 rtl:space-x-reverse">
                                    <span>Minutes</span>
                                </div>
                                <button type="button" id="incrementMinutes" onClick={handleMinutesIncDec} data-input-counter-increment="bedrooms-input" className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none z-50">
                                    <svg className="w-3 h-3 text-gray-900 dark:text-white pointer-events-none z-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-action">
                        <div className="btn btn-primary" onClick={handleAddTime}>
                            {submitBtnLoading ? <span className="loading loading-spinner w-6 h-6 text-success"></span> : 'Add'}
                        </div>
                        <form method="dialog">
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}