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
                <div className="w-6 h-6 invisible"></div>
                <div className="flex flex-col items-center justify-center mx-auto">
                    <div className="pb-4">{message}</div>
                    <progress className="progress w-full" value={progressValue} max="100"></progress>
                </div>
            </div>
        </>
    );
}