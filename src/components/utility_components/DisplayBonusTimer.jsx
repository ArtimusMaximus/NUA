import { useEffect, useState, useRef } from "react";

export default function DisplayBonusTimer({ milliTime }) {
    const [serverBonusTimer, setServerBonusTimer] = useState(milliTime);

    // const [hours, setHours]     = useState(Math.floor((milliTime / (1000*60*60)) % 24));
    // const [minutes, setMinutes] = useState(Math.floor((milliTime / (1000*60)) % 60));
    // const [seconds, setSeconds] = useState(Math.floor(milliTime / (1000) % 60));
    // const hours = Math.floor((remainingTime / (1000*60*60)) % 24);
    // const minutes = Math.floor((remainingTime / (1000*60)) % 60);
    // const seconds = Math.floor(remainingTime / (1000) % 60);
    const [hours, setHours]     = useState(null);
    const [minutes, setMinutes] = useState(null);
    const [seconds, setSeconds] = useState(null);

    useEffect(() => {
        if (serverBonusTimer !== 0 || serverBonusTimer !== null) { // decrements milliTime and passes to DisplayBonusTimeComponent
            if (serverBonusTimer <= 0) {
                setServerBonusTimer(0);
                return;
            }
            const interval = setInterval(() => {
                setServerBonusTimer(prev => prev - 1000);
                setHours(Math.floor((serverBonusTimer / (1000*60*60)) % 24));
                setMinutes(Math.floor((serverBonusTimer / (1000*60)) % 60));
                setSeconds(Math.floor(serverBonusTimer / (1000) % 60));
            }, 1000);
            return () => clearInterval(interval);
        }
        console.log('serverBonusTimer\t', serverBonusTimer);

    }, [serverBonusTimer, milliTime]);
    // }, [milliTime]);

    return (
        <>
            {serverBonusTimer !== null &&
                <span className="pl-4">
                    {hours !== null && minutes !== null && seconds !== null && hours + " : " + minutes + " : " + seconds}
                </span>
            }
        </>
    );
}