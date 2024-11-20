import { useRef, useState } from "react";

export default function CancelBonusTimeButton({ deviceId, timerHandler }) {
    const bonusToggleTestRef = useRef();

    const handleStopBonusTime = async e => {
        timerHandler(true);
        const deviceId = parseInt(e.target.id);
        const obj = { deviceId : deviceId, cancelTimer: true }; // deviceId is the timerId on the server
        try {
            const pingBonusToggle = await fetch('/deletebonustoggles', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type":"application/json"
                },
                body: JSON.stringify(obj)
            });
            if (pingBonusToggle.ok) {
                timerHandler(false);
            }
            // pingBonusToggle();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            <div
                id={deviceId}
                className="btn btn-warning hover:bg-error btn-sm"
                ref={bonusToggleTestRef}
                onClick={handleStopBonusTime}
            >
                Stop Bonus Time
            </div>
        </>
    );
}