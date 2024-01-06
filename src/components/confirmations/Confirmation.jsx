import { useEffect, useState } from "react";



export default function Confirmation ({ message, alertType, duration, reveal })
//alert-warning error success
{
    const [progressValue, setProgressValue] = useState(100);
    const [showAlert, setShowAlert] = useState(false);


    useEffect(() => {
        let progressInterval;

        const progressChange = () => {
            progressInterval = setInterval(() => {
                setProgressValue((prev) => prev -1)
            }, duration / 120);
        }
        const clearProgressChange = () => {
            clearInterval(progressInterval);
        }

        if (reveal) { // was show alert
            progressChange();
        }

        return () => {
            clearProgressChange();
            setProgressValue(100)
        }

    }, [duration]);

    useEffect(() => {
        if (progressValue === 0) {
            setShowAlert(false)
        }
    }, [progressValue])




    return (
        <>
            <div role="alert" className={`alert mx-auto bottom-[130px] z-10 sm:w-1/2 ${alertType} ${reveal ? 'absolute' : 'hidden'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="flex flex-col items-center justify-center mx-auto">
                    <div className="pb-4">{message}</div>
                    <progress className="progress w-full" value={progressValue} max="100"></progress>
                </div>
            </div>
        </>
    );
}