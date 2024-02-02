import { useEffect, useRef, useState } from 'react';
import Devices from "./Devices";
import { IoAddCircleOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import NuaSvg from "../images/nua.svg";


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
    const [refreshTimer, setRefreshTimer] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const macRef = useRef();
    const deviceNameRef = useRef();
    const initialized = useRef(false);
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(2);
    const dialogRef = useRef();

    const instagramObject = {
        action: 'BLOCK',
        app_category_ids: [],
        app_ids: [ 1573022 ],
        bandwidth_limit: {
          download_limit_kbps: 1024,
          enabled: false,
          upload_limit_kbps: 1024
        },
        description: 'Instagram',
        domains: [],
        enabled: true,
        ip_addresses: [],
        ip_ranges: [],
        matching_target: 'APP',
        network_ids: [],
        regions: [],
        schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
        target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
      }


    const refreshUI = () => {
        setRefresh(prev => !prev)
    }
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
        const handleGetMacAddresses = async () => {
            try {
                const response = await fetch('/getmacaddresses', {
                    method: 'GET',
                    mode: 'cors',
                });
                if (response.ok) {
                    const data = await response.json();
                    // console.log(data);
                    setMacData(data ? data : {});
                } else if (!response.ok) {
                    await dialogRef.current.showModal();
                    // await handleTimer();
                }
            } catch (error) {
                if (error) {
                    console.error('consoleerror in /getmacaddresses', error);
                }
            }
        }
        handleGetMacAddresses();
    }, [toggleReRender]);

    useEffect(() => {
        const eventSource = new EventSource('/pingmacaddresses');
        eventSource.onmessage = (event) => {
            if (event) {
                handleRenderToggle();
            }
        }
        eventSource.onerror = (error) => {
            console.error(error);
        };
        return () => {
            eventSource.close();
        }
    }, [])

    useEffect(() => { // check if server crash & jobs need re-initiation
        if (!initialized.current) {
            initialized.current = true;
            const getCronData = async () => {
                try {
                    const cronData = await fetch('/checkjobreinitiation');
                    if (cronData.ok) {
                        const cronJobCheckData = await cronData.json();
                        setCronJobChecked(cronJobCheckData);
                        // console.log('Cron Job Check Data: ', cronJobCheckData);
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

    const addCustomRule = () => {
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
            <Devices data={macData && macData} toggleReRender={toggleReRender} handleRenderToggle={handleRenderToggle} />
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