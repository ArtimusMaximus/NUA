import { useEffect, useState, useRef } from "react";

export default function DisplayBonusTimer({ milliTime }) {

    const [hours, setHours]     = useState(Math.floor((milliTime / (1000*60*60)) % 24));
    const [minutes, setMinutes] = useState(Math.floor((milliTime / (1000*60)) % 60));
    const [seconds, setSeconds] = useState(Math.floor(milliTime / (1000) % 60));
    // const hours = Math.floor((remainingTime / (1000*60*60)) % 24);
    // const minutes = Math.floor((remainingTime / (1000*60)) % 60);
    // const seconds = Math.floor(remainingTime / (1000) % 60);

    useEffect(() => {
        setHours(Math.floor((milliTime / (1000*60*60)) % 24))
        setMinutes(Math.floor((milliTime / (1000*60)) % 60))
        setSeconds(Math.floor(milliTime / (1000) % 60))
    }, [milliTime]);

    return (
        <>
            <span className="pl-4">
                {milliTime !== null && hours + " : " + minutes + " : " + seconds}
            </span>
        </>
    );
}