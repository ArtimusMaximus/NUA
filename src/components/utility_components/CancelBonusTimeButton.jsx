import { useRef, useState } from "react";
import { FcCancel } from "react-icons/fc";
import { MdOutlineCancel } from "react-icons/md";

export default function CancelBonusTimeButton({ deviceId, timerHandler, handleRenderToggle }) {
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
                handleRenderToggle(); // re-render new state
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
                className="btn btn-error btn-sm"
                ref={bonusToggleTestRef}
                onClick={handleStopBonusTime}
            >
                {/* <MdOutlineCancel className="text-error" />
                <FcCancel className="text-error" /> */}
                Stop
            </div>
        </>
    );
}