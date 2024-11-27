import { useEffect, useRef, useState } from 'react';
import Devices from "./Devices";
import { useNavigate } from 'react-router-dom';
import NuaSvg from "../images/nua.svg";


export default function AdminConsole()
{
    const [inputData, setInputData] = useState({
        active: false,
    });
    // const [macData, setMacData] = useState({}); // prev
    const [macData, setMacData] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [validationError, setValidationError] = useState(false);
    const [toggleReRender, setToggleReRender] = useState(false);
    const [cronJobCheck, setCronJobChecked] = useState({});
    const [loadingMacData, setLoadingMacData] = useState(false);
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
        } catch (e) {
            if (e) throw e;
        }
    }
    const handleProceed = () => {
        navigate('/sitesettings');
    }

    // function validateMacAddress(mac) {
    //     const macRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
    //     return macRegex.test(mac)
    // }
    // const handleScroll = () => {
    //     document.getElementById('top').scrollIntoView({ block: 'center', behavior: 'smooth' });
    // }
    const handleRenderToggle = () => { // re-trigger
        setToggleReRender(prev => !prev)
    }
    const handleInput = e => {
        setValidationError(false)
        setInputData({
            ...inputData,
            [e.target.name]: e.target.value,
        })
    }
    // const handleAddMacAddresses = async () => { // add mac addresses
    //     try {
    //         if (validateMacAddress(inputData.macAddress)) {
    //             setValidationError(false)
    //         } else {
    //             setValidationError(true)
    //             timer(3000).then(() => setValidationError(false))
    //             return
    //         }
    //         const submitData = await fetch('/addmacaddresses', {
    //             method: 'POST',
    //             mode: 'cors',
    //             headers: {
    //                 "Content-Type" : "application/json"
    //             },
    //             body: JSON.stringify(inputData)
    //         });
    //         if (submitData.ok) {
    //             const returnData = await submitData.json();
    //             // console.log(returnData);
    //             macRef.current.value = '';
    //             deviceNameRef.current.value = '';
    //             handleRenderToggle();
    //         }
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

    useEffect(() => { // /getmacaddresses initial fetch
        setLoadingMacData(true);
        const handleGetMacAddresses = async () => {
            try {
                const response = await fetch('/getmacaddresses', {
                    method: 'GET',
                    mode: 'cors',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('macData from ping re-render:\t', data);
                    // setMacData(data ? data : {}); // previous, updating
                    setMacData([...data.macData] || []);
                    setBlockedUsers([...data.blockedUsers] || []);
                    setLoadingMacData(false)
                } else if (!response.ok) {
                    dialogRef.current.showModal();
                    setLoadingMacData(false);
                    // await handleTimer();
                }
            } catch (error) {
                dialogRef.current.showModal();
                setLoadingMacData(false);
                console.error('consoleerror in /getmacaddresses', error);
            }
        }
        handleGetMacAddresses();
    }, [toggleReRender]);

    // useEffect(() => { // original 03/04/2024
    //     const eventSource = new EventSource('/pingmacaddresses');
    //     eventSource.onmessage = (event) => {
    //         if (event) {
    //             handleRenderToggle();
    //         }
    //     }
    //     eventSource.onerror = (error) => {
    //         console.error(error);
    //     };
    //     return () => {
    //         eventSource.close();
    //     }
    // }, [])

    useEffect(() => { // new 03/04/2024 // revisited 11 15 2024 - need this to not interrupt state in devices component
        let eventSource;
        try {
            eventSource = new EventSource('/pingmacaddresses');
            eventSource.onmessage = (event) => {
                if (event) {
                    handleRenderToggle();
                    // console.log('%chandleRenderToggle() if(event)...', 'color: pink; background: black; font-size: 12px;');
                    // console.log('event \t', event);
                }
            }
            eventSource.onerror = (error) => {
                console.error(error);
            };
            return () => {
                eventSource.close();
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

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
                    // if (error) throw error; // prev 03/4/2024
                    console.error('Error Fetching "/checkjobreinitiation" \t', error);
                }
            }
            getCronData();
        }
        // if (serverRestart) {
        //     getCronData();
        //     setServerRestart(false);
        // }
    }, []);

    const addCustomRule = () => { // original block app test
        const fetchStuff = async () => {
           try {
            const response = await fetch('/fetchcustomapi', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({instagramObject})
            })
            if (response.ok) {
                console.log(response)
                let rj = await response.json();
                console.log('rj: \t', rj);
            }
           } catch (error) {
            console.error(error)
           }
        }
        fetchStuff();
    }


    return (
        <>
            <div className="grid mx-auto grid-flow-row gap-6 w-full">
                <Devices
                    macData={macData && macData}
                    blockedUsers={blockedUsers}
                    handleRenderToggle={handleRenderToggle}
                    loadingMacData={loadingMacData}
                />
                <div className="flex flex-row items-center justify-center p-6 w-[350px] mx-auto">
                </div>
            </div>

            {/* navigate to credentials modal */}
            <dialog id="redirectModal" className="modal" ref={dialogRef}>
                <div className="modal-box flex flex-col items-center justify-center overflow-x-hidden">
                    <h1 className="nuaFont text-2xl">NUA</h1>
                    <h2 className="font-bold text-xl">Welcome!</h2>
                    <h3 className="font-bold text-lg text-center">Your UniFi login credentials must be set to proceed...</h3>
                    <div className="btn btn-block mt-2 font-semi-bold italic text-green-500" onClick={handleProceed}>Proceed to Site Settings</div>
                    <div className="absolute top-3 right-5">
                        <img
                            src={NuaSvg}
                            alt="NUA Logo"
                            className="w-10 h-10"
                        />
                    </div>
                    {/* <h3 className="font-bold text-lg">Redirecting In:</h3> */}
                    {/* <p className="py-4 text-4xl italic font-bold">{countdown}</p> */}
                </div>
            </dialog>
        </>
    )
}