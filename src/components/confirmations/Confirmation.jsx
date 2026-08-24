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
            <div className={`toast toast-bottom toast-center z-50 ${reveal ? '' : 'hidden'}`}>
                <div role="alert" className={`alert ${alertType}`}>
                    <div className="flex flex-col items-center justify-center">
                        <div className="pb-2">{message}</div>
                        <progress className="progress w-56" value={progressValue} max="100"></progress>
                    </div>
                </div>
            </div>
        </>
    );
}