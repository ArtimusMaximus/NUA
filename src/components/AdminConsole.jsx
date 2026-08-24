import { useEffect, useRef, useState, useCallback } from 'react';
import ModernDevices from "./ModernDevices";
import TrafficRules from "./traffic_rules/TrafficRules";
import { useNavigate, useOutletContext } from 'react-router-dom';
import NuaSvg from "../images/nua.svg";
import { HiOutlineDeviceTablet, HiOutlineShieldCheck, HiOutlineChevronUp } from 'react-icons/hi2';


export default function AdminConsole()
{
    const [inputData, setInputData] = useState({
        active: false,
    });
    const [macData, setMacData] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [validationError, setValidationError] = useState(false);
    const [toggleReRender, setToggleReRender] = useState(false);
    const [cronJobCheck, setCronJobChecked] = useState({});
    const [loadingMacData, setLoadingMacData] = useState(false);
    const [syncHealth, setSyncHealth] = useState({
        stale: false,
        stateSource: 'unknown',
        lastSyncedAt: null,
    });
    const initialized = useRef(false);
    const navigate = useNavigate();
    const { openSettings } = useOutletContext() ?? {};
    const [countdown, setCountdown] = useState(2);
    const dialogRef = useRef();
    const devicesSectionRef = useRef();
    const rulesSectionRef = useRef();
    const [activeTab, setActiveTab] = useState('devices');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollSentinelRef = useRef();
    const macRequestCounterRef = useRef(0);
    const macRequestAbortRef = useRef(null);

    // Show/hide "scroll to top" button when user scrolls past the sentinel
    useEffect(() => {
        const sentinel = scrollSentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowScrollTop(!entry.isIntersecting);
            },
            { threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    const scrollToTop = useCallback(() => {
        document.scrollingElement?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Scroll-spy: update active tab as user scrolls between sections
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (entry.target === devicesSectionRef.current) {
                            setActiveTab('devices');
                        } else if (entry.target === rulesSectionRef.current) {
                            setActiveTab('rules');
                        }
                    }
                });
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        );

        const devicesEl = devicesSectionRef.current;
        const rulesEl = rulesSectionRef.current;
        if (devicesEl) observer.observe(devicesEl);
        if (rulesEl) observer.observe(rulesEl);

        return () => observer.disconnect();
    }, []);

    const scrollToSection = useCallback((sectionRef) => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);


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
        openSettings?.();
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
        const requestId = ++macRequestCounterRef.current;
        if (macRequestAbortRef.current) {
            macRequestAbortRef.current.abort();
        }
        const controller = new AbortController();
        macRequestAbortRef.current = controller;

        setLoadingMacData(true);
        const handleGetMacAddresses = async () => {
            try {
                const response = await fetch('/getmacaddresses', {
                    method: 'GET',
                    mode: 'cors',
                    signal: controller.signal,
                });

                if (requestId !== macRequestCounterRef.current) {
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    console.log('macData from ping re-render:\t', data);
                    // setMacData(data ? data : {}); // previous, updating
                    setMacData([...data.macData] || []);
                    setBlockedUsers([...data.blockedUsers] || []);
                    setSyncHealth({
                        stale: Boolean(data?.stale),
                        stateSource: data?.stateSource || 'unknown',
                        lastSyncedAt: Date.now(),
                    });
                } else if (!response.ok) {
                    if (response.status === 401) {
                        dialogRef.current.showModal();
                    } else {
                        setSyncHealth((previous) => ({
                            ...previous,
                            stale: true,
                            stateSource: 'fetch-error',
                        }));
                    }
                    // await handleTimer();
                }
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }
                setSyncHealth((previous) => ({
                    ...previous,
                    stale: true,
                    stateSource: 'network-error',
                }));
                console.error('consoleerror in /getmacaddresses', error);
            } finally {
                if (requestId === macRequestCounterRef.current) {
                    setLoadingMacData(false);
                }
            }
        }
        handleGetMacAddresses();

        return () => {
            controller.abort();
        };
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
            <div className="w-full">
                {/* Combined policy navigation */}
                <div className="flex justify-center pt-4 pb-6">
                    <div className="relative flex items-center gap-1 bg-base-200 rounded-xl p-1 shadow-inner">
                        <button
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'devices'
                                    ? 'bg-base-100 shadow-sm text-base-content'
                                    : 'text-base-content/70 hover:text-base-content hover:bg-base-300'
                            }`}
                            onClick={() => scrollToSection(devicesSectionRef)}
                        >
                            <HiOutlineDeviceTablet className="w-4 h-4" />
                            Devices
                        </button>
                        <button
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'rules'
                                    ? 'bg-base-100 shadow-sm text-base-content'
                                    : 'text-base-content/70 hover:text-base-content hover:bg-base-300'
                            }`}
                            onClick={() => scrollToSection(rulesSectionRef)}
                        >
                            <HiOutlineShieldCheck className="w-4 h-4" />
                            Traffic Rules
                        </button>
                    </div>
                </div>

                {/* Sentinel — when this scrolls out of view, the scroll-to-top button appears */}
                <div ref={scrollSentinelRef} className="h-px" />

                {/* Unified content wrapper */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-8">
                    <div className={`rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3 ${
                        syncHealth.stale ? 'border-warning/40 bg-warning/10 text-warning-content' : 'border-success/30 bg-success/10 text-success-content'
                    }`}>
                        <div className="font-medium">
                            {syncHealth.stale
                                ? 'Device state is using fallback data. Live UniFi sync is temporarily unavailable.'
                                : 'Device state is synced with UniFi.'}
                        </div>
                        <div className="opacity-80">
                            <span className="font-semibold">Source:</span> {syncHealth.stateSource}
                            {syncHealth.lastSyncedAt ? ` • Updated ${new Date(syncHealth.lastSyncedAt).toLocaleTimeString()}` : ''}
                        </div>
                    </div>

                    <div ref={devicesSectionRef} id="devices-section" className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
                        <ModernDevices
                            macData={macData && macData}
                            blockedUsers={blockedUsers}
                            handleRenderToggle={handleRenderToggle}
                            loadingMacData={loadingMacData}
                        />
                    </div>

                    <div ref={rulesSectionRef} id="rules-section" className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
                        <TrafficRules embedded={true} />
                    </div>
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
                </div>
            </dialog>

            {/* Scroll-to-top button */}
            <button
                className={`fixed bottom-6 right-6 z-50 btn btn-circle btn-primary shadow-lg transition-all duration-300 ${
                    showScrollTop
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
                onClick={scrollToTop}
                aria-label="Scroll to top"
                title="Back to top"
            >
                <HiOutlineChevronUp className="w-5 h-5" />
            </button>
        </>
    )
}