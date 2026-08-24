
import { useEffect, useRef, useState } from "react";
import { GoLock, GoUnlock } from "react-icons/go";
import Confirmation from "./confirmations/Confirmation";
import PropTypes from 'prop-types';


export default function SiteSettings({ isOpen, onClose })
{
    const [data, setData] = useState({});
    const [locked, setlocked] = useState(false);
    const [dataExists, setDataExists] = useState(Boolean);
    const [preExistingData, setPreExistingData] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(Boolean);
    const [testMessage, setTestMessage] = useState("");
    const [alertType, setAlertType] = useState("");
    const [reveal, setReveal] = useState(false);
    const [clicked, setClicked] = useState(false);
    const [rangeValue, setRangeValue] = useState(60000);
    const [refreshRateFromDB, setRefreshRateFromDB] = useState(null);
    const hostnameRef = useRef();
    const usernameRef = useRef();
    const passwordRef = useRef();
    const testBtnRef = useRef();
    const portRef = useRef();
    const sslverifyRef = useRef();
    const timerRef = useRef();



    const handleInput = e => {
        if (e.target.name === 'refreshRate') {
            setRefreshRateFromDB(null);
            setRangeValue(e.target.value);
        }
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (dataExists) {
            setPreExistingData({
                ...preExistingData,
                [e.target.name]: value
            });
            // console.log(preExistingData);
        } else {
            setData({
                ...data,
                [e.target.name]: value
            });

            // console.log(data);
        }
    }

    useEffect(() => { // this is not hitting more than once, yes it does when showConfirmation changes
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
                setlocked(true);
                hostnameRef.current.disabled = true;
                usernameRef.current.disabled = true;
                passwordRef.current.disabled = true;
                portRef.current.disabled = true;
                sslverifyRef.current.disabled = true;
                timerRef.current.disabled = true;
            }
        } catch (error) {
            console.error('Failed to save site settings:', error);
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
                    const dbData = await fetchSettings.json();
                    setPreExistingData(dbData);
                    console.log('dbData.refreshRate \t', dbData.refreshRate);
                    setRefreshRateFromDB(dbData.refreshRate)

                } else if (!fetchSettings.ok) {
                    setDataExists(false);
                    setlocked(false);
                    hostnameRef.current.disabled = false;
                    usernameRef.current.disabled = false;
                    passwordRef.current.disabled = false;
                    portRef.current.disabled = false;
                    sslverifyRef.current.disabled = false;
                    timerRef.current.disabled = false;
                }
            } catch (error) {
                console.error('Failed to check for settings:', error);
            }
        }
        checkForSettings();
    }, [])

    const handlelocked = () => {
        if (locked) {
            setlocked(false);
            setClicked(true);
            setDataExists(true);
            hostnameRef.current.disabled = false;
            usernameRef.current.disabled = false;
            passwordRef.current.disabled = false;
            portRef.current.disabled = false;
            sslverifyRef.current.disabled = false;
            timerRef.current.disabled = false;
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
    
    const [debugStatus, setDebugStatus] = useState(null);
    const [showDebugStatus, setShowDebugStatus] = useState(false);
    const [encryptionEnabled, setEncryptionEnabled] = useState(null);
    const [encryptionLoading, setEncryptionLoading] = useState(false);
    const [encryptionMessage, setEncryptionMessage] = useState('');

    useEffect(() => {
        fetch('/encryption-status')
            .then(r => r.json())
            .then(data => setEncryptionEnabled(data.enabled))
            .catch(() => setEncryptionEnabled(false));
    }, []);

    const handleEnableEncryption = async () => {
        setEncryptionLoading(true);
        setEncryptionMessage('');
        try {
            const res = await fetch('/enable-encryption', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setEncryptionEnabled(true);
                setEncryptionMessage(data.message);
            } else {
                setEncryptionMessage(data.error || 'Failed to enable encryption.');
            }
        } catch (error) {
            setEncryptionMessage('An error occurred.');
        } finally {
            setEncryptionLoading(false);
        }
    };
    
    const handleDebugStatus = async () => {
        try {
            const response = await fetch('/debug-status');
            if (response.ok) {
                const status = await response.json();
                setDebugStatus(status);
                setShowDebugStatus(true);
                console.log('Debug Status:', status);
            } else {
                console.error('Failed to fetch debug status');
                setDebugStatus({ error: 'Failed to fetch status' });
                setShowDebugStatus(true);
            }
        } catch (error) {
            console.error('Debug status error:', error);
            setDebugStatus({ error: error.message });
            setShowDebugStatus(true);
        }
    }
    return (
        <>
            <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
                    </div>
                <div className="flex w-full">
                    <div className="flex flex-col items-center justify-center w-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 mb-4">
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
                            <div className="flex items-center justify-end w-full">
                                <div>Refresh:</div>
                                <div className="pl-2 w-full flex justify-end">
                                <label className="form-control  max-w-xs w-[215px]">
                                    <input
                                        type="range"
                                        max={300000} min={60000}
                                        value={refreshRateFromDB !== null ? refreshRateFromDB : rangeValue}
                                        className="range w-full"
                                        step={60000}
                                        ref={timerRef}
                                        name="refreshRate"
                                        onChange={handleInput}
                                    />
                                    <div className="w-full flex justify-between text-xs px-2">
                                        <span>1m</span>
                                        <span>2m</span>
                                        <span>3m</span>
                                        <span>4m</span>
                                        <span>5m</span>
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
                            <div 
                                className="flex m-8 btn btn-outline btn-info"
                                onClick={handleDebugStatus}
                            >
                                Debug Status
                            </div>
                            <div className={`flex m-8 btn ${locked ? 'hidden' : 'block'}`}>
                                <GoUnlock
                                    className={`w-8 h-8 hover:cursor-pointer `}
                                    onClick={handleSubmit}
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

                {/* Encryption Settings */}
                <div className="flex w-full mt-2">
                    <div className="flex flex-col items-center justify-center w-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 p-4 gap-4">
                        <div className="text-2xl font-bold">Credential Encryption</div>
                        <div className="divider mt-0"></div>
                        <div className="flex items-center gap-3">
                            <span>Status:</span>
                            {encryptionEnabled === null ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : encryptionEnabled ? (
                                <span className="badge badge-success gap-1">&#x1F512; Enabled</span>
                            ) : (
                                <span className="badge badge-warning gap-1">&#x26A0; Disabled</span>
                            )}
                        </div>
                        {encryptionEnabled === false && (
                            <p className="text-sm text-center opacity-70 max-w-xs">
                                Enable encryption to store your UniFi password encrypted at rest using AES-256-GCM. A key file will be generated in <code>config/encryption.key</code>.
                            </p>
                        )}
                        {encryptionEnabled === false && (
                            <button
                                className={`btn btn-outline btn-success ${encryptionLoading ? 'loading' : ''}`}
                                onClick={handleEnableEncryption}
                                disabled={encryptionLoading}
                            >
                                {encryptionLoading ? 'Enabling...' : 'Enable Encryption'}
                            </button>
                        )}
                        {encryptionMessage && (
                            <div className={`alert ${encryptionEnabled ? 'alert-success' : 'alert-error'} text-sm`}>
                                <span>{encryptionMessage}</span>
                            </div>
                        )}
                        {encryptionEnabled && (
                            <p className="text-sm text-center opacity-70 max-w-xs">
                                Your credentials are encrypted at rest. Back up <code>config/encryption.key</code> — it is required to start the server.
                            </p>
                        )}
                    </div>
                </div>

                {/* Diagnostics (off by default) */}
                <div className="flex w-full mt-2">
                    <div className="flex flex-col items-center justify-center w-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 p-4 gap-4">
                        <div className="text-2xl font-bold">Diagnostics</div>
                        <div className="divider mt-0"></div>
                        <p className="text-sm text-center opacity-70 max-w-xs">
                            When enabled, the server exposes full credential details via <code>/checkforsettings</code>,
                            logs request bodies that may contain credentials, and includes raw error messages in error
                            responses. Keep off unless you are debugging.
                        </p>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="diagnosticsEnabled"
                                className="toggle toggle-warning"
                                checked={dataExists ? !!preExistingData?.diagnosticsEnabled : !!data?.diagnosticsEnabled}
                                disabled={dataExists && locked && !clicked}
                                onChange={handleInput}
                            />
                            <span>Enable diagnostics</span>
                        </label>
                    </div>
                </div>

                    {/* <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 mt-4">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-2xl font-bold">General</div>
                        </div>
                        <div className="divider"></div>
                        <div className="flex items-center flex-col justify-end gap-4">
                            <div>Choose default page:</div>
                            <div className="pl-2">
                                <select onChange={handleSelect} className="select select-bordered w-full max-w-xs">
                                    <option disabled selected>Choose Page</option>
                                    <option value="/">Device List</option>
                                    <option value="/trafficrules">Traffic Rules</option>
                                </select>
                            </div>
                            <div className="flex pb-4">
                                <div className="btn" onClick={handleUpdateGeneralSettings}>Submit</div>
                            </div>
                        </div>
                    </div> */}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose}>close</button>
                </form>
            </dialog>
            
            {/* Debug Status Modal */}
            {showDebugStatus && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">System Debug Status</h3>
                        <div className="py-4">
                            {debugStatus ? (
                                <div className="space-y-2">
                                    <div className={`alert ${debugStatus.unifiConnected ? 'alert-success' : 'alert-warning'}`}>
                                        <span>UniFi Connected: {debugStatus.unifiConnected ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                    <div className={`alert ${!debugStatus.initialSetup ? 'alert-success' : 'alert-warning'}`}>
                                        <span>Setup Complete: {!debugStatus.initialSetup ? '✅ Yes' : '⚠️ No (Still in setup mode)'}</span>
                                    </div>
                                    <div className={`alert ${debugStatus.hasCredentials ? 'alert-success' : 'alert-error'}`}>
                                        <span>Credentials Configured: {debugStatus.hasCredentials ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                    <div className="collapse collapse-arrow border border-base-300">
                                        <input type="checkbox" />
                                        <div className="collapse-title text-xl font-medium">
                                            Credential Details
                                        </div>
                                        <div className="collapse-content">
                                            <div className="text-sm space-y-1">
                                                <p><strong>Hostname:</strong> {debugStatus.credentials?.hostname}</p>
                                                <p><strong>Username:</strong> {debugStatus.credentials?.username}</p>
                                                <p><strong>Password:</strong> {debugStatus.credentials?.password}</p>
                                                <p><strong>Port:</strong> {debugStatus.credentials?.port}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {debugStatus.error && (
                                        <div className="alert alert-error">
                                            <span>Error: {debugStatus.error}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="loading loading-spinner loading-lg"></div>
                            )}
                        </div>
                        <div className="modal-action">
                            <button 
                                className="btn" 
                                onClick={() => setShowDebugStatus(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

SiteSettings.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
};