import { useEffect, useRef, useState } from 'react';
import Devices from "./Devices";
import { IoAddCircleOutline } from "react-icons/io5";


const device = {
    name: '',
    macAddress: '',
    active: false,
    url: '',
    id: '',
}

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
    const [refreshTimer, setRefreshTimer] = useState(60000)
    const macRef = useRef();
    const deviceNameRef = useRef();
    const initialized = useRef(false);

    const timer = t => new Promise(res => setTimeout(res, t));

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

    useEffect(() => { // /getmacaddresses
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
                    // setRefreshTimer(data.refreshTimer)
                }
            } catch (error) {
                console.error(error);
            }
        }
        handleGetMacAddresses();
    }, [toggleReRender]);

    useEffect(() => {
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

                }
            } catch (error) {
                console.error(error);
            }
        }
        async function checkEvery60Seconds() {
            // const minute = 60000;
            const checker = new Promise((res) => {
                setTimeout(() => {
                    console.log('60 second check complete.')
                    return res();
                }, 60000)
            });
            handleGetMacAddresses();
            await checker;
            // clearTimeout(checker);
            checkEvery60Seconds();
        }
        const timerId = checkEvery60Seconds();
        // handleGetMacAddresses();
    }, []);

    useEffect(() => { // check if server crash & jobs need re-initiation
        if (!initialized.current) {
            initialized.current = true;
            const getCronData = async () => {
                try {
                    const cronData = await fetch('/checkjobreinitiation');
                    if(cronData.ok) {
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

    useEffect(() => {
        try {
            const fetchTimer = async () => {
                const getTimer = await fetch('/getrefreshsettings');
                if (getTimer.ok) {
                    console.log('timer good');
                    // const dbRefreshTimer = await getTimer.json();
                    // console.log(dbRefreshTimer);
                }
            }
            fetchTimer();
        } catch (error) {
            console.error(error);
        }
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
        </>
    )
}