import { useEffect, useRef, useState } from 'react';
import Devices from "./Devices";
import { IoAddCircleOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';


export default function AdminConsole()
{
    const [inputData, setInputData] = useState({
        active: false,
    });
    const [macData, setMacData] = useState({});
    const [validationError, setValidationError] = useState(false);
    const [toggleReRender, setToggleReRender] = useState(false);
    const [cronJobCheck, setCronJobChecked] = useState({});
    const [serverRestart, setServerRestart] = useState(true);
    const [refreshTimer, setRefreshTimer] = useState(null)
    const macRef = useRef();
    const deviceNameRef = useRef();
    const initialized = useRef(false);
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(2);
    const dialogRef = useRef();


    const timer = t => new Promise(res => setTimeout(res, t));

    const handleTimer = async () => {
        const timer = t => new Promise(res => setTimeout(res, t));
        try {
            await timer(1000)
            setCountdown(1)
            await timer(1000)
            setCountdown(0)
            navigate('/sitesettings');
        } catch (e) {
            if (e) throw e;
        }
    }

    function validateMacAddress(mac) {
        const macRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
        return macRegex.test(mac)
    }
    const handleScroll = () => {
        document.getElementById('top').scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const handleRenderToggle = () => { // re-trigger
        setToggleReRender(prev => !prev)
    }
    const handleInput = e => {
        setValidationError(false)
        setInputData({
            ...inputData,
            [e.target.name]: e.target.value,
            // url: `${e.target.name+inputData.id}`,
        })
        // console.log(inputData);
    }
    const handleAddMacAddresses = async () => { // add mac addresses
        try {
            if (validateMacAddress(inputData.macAddress)) {
                setValidationError(false)
            } else {
                setValidationError(true)
                timer(3000).then(() => setValidationError(false))
                return
            }
            const submitData = await fetch('/addmacaddresses', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify(inputData)
            });
            if (submitData.ok) {
                const returnData = await submitData.json();
                console.log(returnData);
                macRef.current.value = '';
                deviceNameRef.current.value = '';
                handleRenderToggle();
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => { // /getmacaddresses initial fetch
        // console.log('parent component fired off ', toggleReRender);
        const handleGetMacAddresses = async () => {
            try {
                const response = await fetch('/getmacaddresses', {
                    method: 'GET',
                    mode: 'cors',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    setMacData(data ? data : {});
                } else if (!response.ok) {
                    console.log('response not okay!');
                    await dialogRef.current.showModal();
                    await handleTimer();
                }
            } catch (error) {
                if (error) {
                    console.error('consoleerror in /getmacaddresses', error);
                }
            }
        }
        handleGetMacAddresses();
    }, [toggleReRender]);

    // useEffect(() => { // /getmacaddress with refresh timer
    //     // note 01 19 - 60 timer is fine until any forced re-render, then investigate if it goes to 10 second mode, may need to force one time call
    //     let time;
    //     const handleGetMacAddresses = async () => {
    //         try {
    //             const response = await fetch('/getmacaddresses', {
    //                 method: 'GET',
    //                 mode: 'cors',
    //             });
    //             if (response.ok) {
    //                 const data = await response.json();
    //                 console.log('data in /getmacaddress initial useeffect: \t', data);
    //                 setMacData(data ? data : {});
    //                 time = data.refreshRate;
    //             }
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     }
    //     // async function checkEvery60Seconds() {
    //     //     // const minute = 60000;
    //     //     const checker = new Promise((res) => {
    //     //         setTimeout(() => {
    //     //             console.log('60 second check complete.')
    //     //             return res();
    //     //         }, 60000)
    //     //     });
    //     //     handleGetMacAddresses();
    //     //     await checker;
    //     //     // clearTimeout(checker);
    //     //     checkEvery60Seconds();
    //     // }
    //     // const timerId = checkEvery60Seconds();
    //     // // handleGetMacAddresses();
    //     // let time = refreshTimer;
    //     console.log('time in getmacaddresses adminconsole: \t', time);
    //     const checkEvery60Seconds = () => {
    //         console.log(refreshTimer, typeof refreshTimer);
    //         const timerId = setTimeout(async () => {
    //             console.count('60 second check complete.');
    //             await handleGetMacAddresses();
    //             checkEvery60Seconds();
    //         }, time !== null && time !== undefined ? time : 10000)
    //         return () => clearTimeout(timerId)
    //     }
    //     const timerId = checkEvery60Seconds();

    //     return () => clearTimeout(timerId);
    // }, []);

    useEffect(() => { // check if server crash & jobs need re-initiation
        if (!initialized.current) {
            initialized.current = true;
            const getCronData = async () => {
                try {
                    const cronData = await fetch('/checkjobreinitiation');
                    if (cronData.ok) {
                        const cronJobCheckData = await cronData.json();
                        setCronJobChecked(cronJobCheckData);
                        console.log('Cron Job Check Data: ', cronJobCheckData);
                    }
                } catch (error) {
                    if (error) throw error;
                }
            }
            getCronData();
        }
        // if (serverRestart) {
        //     getCronData();
        //     setServerRestart(false);
        // }
    }, []);

    return (
        <>
            <div className="grid mx-auto grid-flow-row gap-6 w-full">

            <Devices data={macData && macData} toggleReRender={toggleReRender} handleRenderToggle={handleRenderToggle} />
                    <div className="flex flex-row items-center justify-center p-6 w-[350px] mx-auto">
                    <details id="top" className="collapse bg-base-200 hover:bg-base-300 mb-80" onClick={handleScroll}>
                        <summary className="collapse-title text-xl font-medium">Add Mac Address <div className="absolute right-5 top-4">&#9660;</div></summary>
                        {/* <div className={`flex flex-col items-center justify-center p-6 gap-4 border rounded`}> */}
                        <div className="collapse-content">
                        <div  className={`flex flex-col items-center justify-center p-6 gap-4 border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900`}>
                            <div className="flex flex-col">
                                <label htmlFor="Mac Address">Mac Address:</label>
                                <input
                                    name="macAddress"
                                    className={`input ${validationError ? 'border-error' : ''}`}
                                    onChange={handleInput}
                                    ref={macRef}
                                    placeholder="01:a2:3b:c4:5d:e6"
                                    />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="Device Name">Device Name:</label>
                                <input
                                    name="name"
                                    className="input"
                                    onChange={handleInput}
                                    ref={deviceNameRef}
                                    placeholder="Friendly Name"
                                    maxLength="30"
                                    />
                                    <div className="flex items-center justify-center">
                                        <IoAddCircleOutline
                                            className="w-20 h-20 hover:text-accent hover:cursor-pointer my-6"
                                            onClick={handleAddMacAddresses}
                                            />
                                    </div>
                            </div>
                        </div>
                    </div>
                    </details>
                </div>
                <div className={`${validationError ? 'absolute bottom-1 left-[25%] z-50' : 'hidden'} w-1/2 mx-auto`}>
                    <div role="alert" className={`alert alert-error `}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Invalid Mac Address</span>
                    </div>
                </div>
            </div>

            {/* navigate to credentials modal */}
            <dialog id="redirectModal" className="modal" ref={dialogRef}>
                <div className="modal-box flex flex-col items-center justify-center">
                    <h3 className="font-bold text-lg">Your unifi credentials must be set to proceed!</h3>
                    <h3 className="font-bold text-lg">Redirecting In:</h3>
                    <p className="py-4 text-4xl italic font-bold">{countdown}</p>
                </div>
            </dialog>
        </>
    )
}