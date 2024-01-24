
import { useEffect, useRef, useState } from "react";
import { GoLock, GoUnlock } from "react-icons/go";
import Confirmation from "./confirmations/Confirmation";


export default function SiteSettings()
{
    const [data, setData] = useState({});
    const [message, setMessage] = useState("");
    const [locked, setlocked] = useState(false);
    const [dataExists, setDataExists] = useState(Boolean);
    const [preExistingData, setPreExistingData] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(Boolean);
    const [testMessage, setTestMessage] = useState("");
    const [alertType, setAlertType] = useState("");
    const [reveal, setReveal] = useState(false);
    const [clicked, setClicked] = useState(false);
    const [rangeValue, setRangeValue] = useState(0)
    const hostnameRef = useRef();
    const usernameRef = useRef();
    const passwordRef = useRef();
    const testBtnRef = useRef();
    const portRef = useRef();
    const sslverifyRef = useRef();
    const timerRef = useRef();



    const handleInput = e => {
        if (e.target.name === 'refreshRate') {
            setRangeValue(e.target.value);
        }
        if (dataExists) {
            setPreExistingData({
                ...preExistingData,
                [e.target.name]: e.target.value
            });
            // console.log(preExistingData);
        } else {
            setData({
                ...data,
                [e.target.name]: e.target.value
            });

            // console.log(data);
        }
    }

    useEffect(() => { // this is not hitting more than once, yes it does when showConfirmation changes
        console.log('reset reveal here???');
        let revealTimer;
        const handleReveal = () => {
            revealTimer = setTimeout(() => {
                setReveal(false)
                setClicked(prev => prev && locked ? false : true)
                // console.log('setClicked(false)');
            }, 5000)
        }
        handleReveal();
        const clearRevealInterval = () => {
            clearInterval(revealTimer);
        }
        return () => {
            clearRevealInterval();
        }
        // if (!showConfirmation) {
        //     setReveal(false)
        // }
            // setReveal(false)
    }, [showConfirmation])

    const handleSubmit = async () => {
        setClicked(false)
        try {
            const submitSiteSettings = await fetch(`${dataExists ? "/updatesitesettings" : "/savesitesettings"}`, {
                method: `${dataExists ? "PUT" : "POST"}`,
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: dataExists ? JSON.stringify(preExistingData) : JSON.stringify(data)
            });
            if (submitSiteSettings.ok) {
                const response = await submitSiteSettings.json();
                // console.log('Front end success.', response);
                setlocked(true);

                // testBtnRef.current.disabled = false;
                // console.log(testBtnRef.current);
                // setMessage(response.message);
                hostnameRef.current.disabled = true;
                usernameRef.current.disabled = true;
                passwordRef.current.disabled = true;
                portRef.current.disabled = true;
                sslverifyRef.current.disabled = true;
                timerRef.current.disabled = true;
            }
        } catch (error) {
            if (error) throw error;
        }
    }

    useEffect(() => { // check for settings...
        console.log('fired how many times...');
        async function checkForSettings() {
            try {
                const fetchSettings = await fetch('/checkforsettings');
                if (fetchSettings.ok) {
                    setDataExists(true);
                    setlocked(true);
                    hostnameRef.current.disabled = true;
                    usernameRef.current.disabled = true;
                    passwordRef.current.disabled = true;
                    portRef.current.disabled = true;
                    sslverifyRef.current.disabled = true;
                    timerRef.current.disabled = true;
                    // testBtnRef.current.disabled = false;
                    const dbData = await fetchSettings.json();
                    // console.log('dbData: ', dbData);
                    setPreExistingData(dbData[0])
                // } else if (fetchSettings.status === 404) {
                } else if (!fetchSettings.ok) {
                    setDataExists(false);
                    setlocked(false);
                    hostnameRef.current.disabled = false;
                    usernameRef.current.disabled = false;
                    passwordRef.current.disabled = false;
                    portRef.current.disabled = false;
                    sslverifyRef.current.disabled = false;
                    timerRef.current.disabled = false;
                    // testBtnRef.current.disabled = true;
                }
            } catch (error) {
                if (error) throw error;
            }
        }
        checkForSettings();
    }, [])

    // useEffect(() => {
    //     console.log('preExistingData: ', preExistingData);
    // }, [preExistingData]);

    const handlelocked = () => {
        if (locked) {
            setlocked(false);
            setClicked(true)
            setDataExists(true);
            hostnameRef.current.disabled = false;
            usernameRef.current.disabled = false;
            passwordRef.current.disabled = false;
            portRef.current.disabled = false;
            sslverifyRef.current.disabled = false;
            timerRef.current.disabled = false;
            // testBtnRef.current.disabled = false;
        }
    }
    const handleTest = async () => {
        setClicked(true)
        console.log('clicked set to true', clicked);
        try {
            const testConnection = await fetch('/testconnection');
            if (testConnection.ok) {
                // setShowConfirmation(true)
                setTestMessage("You have successfully logged into your Unifi Device.")
                setAlertType("alert-success");
                setReveal(true);
                let interval1;
                const resetReveal1 = async () => {
                     interval1 = setTimeout(() => {
                        // setReveal(false);
                        // setShowConfirmation(prev => !prev);
                        // setClicked(false)
                    }, 5000);
                }
                await resetReveal1()
                    .then(() => clearInterval(interval1))
                    .then(() => setShowConfirmation(prev => !prev))
                    // .then(() => setClicked(false))
                    // .then(() => testBtnRef.current.disabled = false)


                } else if (!testConnection.ok) {
                    const errorMsg = await testConnection.json();
                    console.log('error message from back end (/sitesettings)', errorMsg);

                    // setShowConfirmation(true)
                    setTestMessage(`There was an error "${errorMsg.message}", please double check your username and password.`);
                    setAlertType("alert-error");
                    setReveal(true);
                    let interval2;
                    const resetReveal2 = async () => {
                        interval2 = setTimeout(() => {
                            // setReveal(false);
                            // setShowConfirmation(prev => !prev);
                            // setClicked(false)
                        }, 5000);
                    }
                    await resetReveal2()
                        .then(() => clearInterval(interval2))
                        .then(() => setShowConfirmation(prev => !prev))
                        // .then(() => setClicked(false))


                        // .then(() => testBtnRef.current.disabled = false)


            }
        } catch (error) {
            console.error(error);
            (() => {
                setClicked(false)
            })()
            // if (error) throw error;
        }
    }

    const handleRange = e => {
        setRangeValue(e.target.value);
        // console.log(e.target.value);
    }
    return (
        <>
            <div className="flex items-center justify-center w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-2xl font-bold">Connection Settings</div>
                        </div>
                        <div className="divider"></div>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-end">
                                <div>Hostname:</div>
                                <div className="pl-2">
                                    <label className="form-control w-full max-w-xs">
                                        <input
                                            type="text"
                                            placeholder={`${dataExists ? preExistingData?.hostname : 'unifi'}`}
                                            className="input input-bordered w-full max-w-xs"
                                            minLength={1}
                                            maxLength={64}
                                            name="hostname"
                                            onChange={e => handleInput(e)}
                                            ref={hostnameRef}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div>Username:</div>
                                <div className="pl-2">
                                    <label className="form-control w-full max-w-xs">
                                        <input
                                        type="text"
                                        placeholder={`${dataExists ? preExistingData?.username : 'svc_unifi'}`}
                                        className="input input-bordered w-full max-w-xs"
                                        minLength={1}
                                        maxLength={64}
                                        name="username"
                                        onChange={e => handleInput(e)}
                                        ref={usernameRef}
                                    />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div>Password:</div>
                                <div className="pl-2">
                                    <label className="form-control w-full max-w-xs">
                                        <input
                                            type="password"
                                            placeholder="Un1qu3"
                                            className="input input-bordered w-full max-w-xs"
                                            minLength={1}
                                            maxLength={64}
                                            name="password"
                                            onChange={e => handleInput(e)}
                                            ref={passwordRef}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div>Port:</div>
                                <div className="pl-2">
                                    <label className="form-control w-full max-w-xs">
                                        <input
                                            type="text"
                                            placeholder={`${dataExists ? preExistingData?.port : '443'}`}
                                            className="input input-bordered w-full max-w-xs"
                                            minLength={1}
                                            maxLength={5}
                                            name="port"
                                            onChange={e => handleInput(e)}
                                            ref={portRef}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div>SSL Verify:</div>
                                <div className="pl-2">
                                    <label className="form-control w-full max-w-xs">
                                        <input
                                            type="text"
                                            placeholder={`${dataExists ? preExistingData?.sslverify : 'true'}`}
                                            className="input input-bordered w-full max-w-xs"
                                            maxLength={5}
                                            minLength={4}
                                            name="sslverify"
                                            onChange={e => handleInput(e)}
                                            ref={sslverifyRef}
                                        />
                                    </label>
                                </div>
                            </div>
                            {/* <div className="flex items-center justify-end">
                                <div>Refresh Freq (s):</div>
                                <div className="pl-2">
                                    <label className="form-control w-full max-w-xs">
                                        <input
                                            type="number"
                                            placeholder={`${dataExists ? preExistingData?.refreshRate !== null && preExistingData?.refreshRate : '60000'}`}
                                            className="input input-bordered w-full max-w-xs"
                                            maxLength={5}
                                            minLength={4}
                                            name="refreshTimer"
                                            onChange={e => handleInput(e)}
                                            ref={timerRef}
                                        />
                                    </label>
                                </div>
                            </div> */}
                            <div className="flex items-center justify-end w-full">
                                <div>Refresh:</div>
                                <div className="pl-2 w-full flex justify-end">
                                <label className="form-control  max-w-xs w-[215px]">
                                    <input
                                        type="range"
                                        max={300000} min={60000}
                                        value={rangeValue}
                                        className="range w-full"
                                        step={60000}
                                        ref={timerRef}
                                        name="refreshRate"
                                        onChange={handleInput}
                                    />
                                    <div className="w-full flex justify-between text-xs px-2">
                                        <span>1s</span>
                                        <span>2s</span>
                                        <span>3s</span>
                                        <span>4s</span>
                                        <span>5s</span>
                                    </div>
                                </label>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-flow-row grid-cols-2">
                            <div
                                className={`flex m-8 btn ${locked && !clicked ? '' : clicked && !locked ? 'btn-disabled' : ''}`}
                                ref={testBtnRef}
                                onClick={handleTest}
                            >
                                Test Connection
                            </div>
                            <div className={`flex m-8 btn ${locked ? 'hidden' : 'block'}`}>
                                <GoUnlock
                                    className={`w-8 h-8 hover:cursor-pointer `}
                                    onClick={handleSubmit}
                                    // data-id={cronData?.id}
                                    // data-jobname={cronData?.jobName}
                                    // ref={submitButtonRef}
                                    />
                            </div>
                            <div
                                className={`flex m-8 btn ${locked ? 'flex' : 'hidden'}`}
                                onClick={handlelocked}
                            >
                                <GoLock
                                    className={`items-center justify-center z-10 w-8 h-8 hover:cursor-pointer `}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {reveal && <Confirmation message={testMessage} alertType={alertType} duration={5000} reveal={reveal} />}
            </div>
        </>
    )
}