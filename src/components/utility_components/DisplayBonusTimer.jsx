import { useEffect, useState, useRef } from "react";

export default function DisplayBonusTimer({ milliTime, timerCancelled }) {
    const [serverBonusTimer, setServerBonusTimer] = useState(milliTime.timer);
    const [timerCompleted, setTimerCompleted] = useState(false);

    useEffect(() => {
        setServerBonusTimer(milliTime.timer);
        setTimerCompleted(false);
    }, [milliTime])


    useEffect(() => {
        if (timerCancelled) {
            setServerBonusTimer(0);
            setTimerCompleted(true);
            return;
        }
        if (timerCompleted || serverBonusTimer <= 0) {
            setTimerCompleted(true);
            return;
        }

            const interval = setInterval(() => {
                setServerBonusTimer((prev) => {
                    const updatedTime = prev - 1000;

                    if (updatedTime <= 0) {
                        setTimerCompleted(true);
                        clearInterval(interval);
                        return 0;
                    }
                    return updatedTime;
                });
            }, 1000);
            return () => clearInterval(interval);

    }, [timerCompleted, timerCancelled]);

    const hours = (Math.floor((serverBonusTimer / (1000*60*60)) % 24));
    const minutes = (Math.floor((serverBonusTimer / (1000*60)) % 60));
    const seconds = (Math.floor(serverBonusTimer / (1000) % 60));

    return (
        <>
            {serverBonusTimer > 0 && !timerCompleted ?
                <>
                    {hours + " : " + minutes + " : " + seconds}
                </>
                : <></>
            }
        </>
    );
}