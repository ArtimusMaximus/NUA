import { createContext, useContext, useEffect, useState } from "react";

const TimerContext = createContext();

export function TimerProvider ({ children, initialMilliTime }) {
    const [remainingTime, setRemainingTime] = useState(initialMilliTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemainingTime((prev) => {
                if(prev <=0){
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1000;
            })
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <TimerContext.Provider value={remainingTime}>
                {children}
            </TimerContext.Provider>
        </>
    );
}

export const useTimer = () => {
    return useContext(TimerContext);
};