import { useEffect, useRef, useState } from "react";
import {
    allAppsList,
	mediaStreaming,
	socialNetworks,
	onlineGames,
	peertopeerNetworks,
	emailMessaging,
	instantMessengers,
	tunnelingProxy,
	fileSharing,
	voip,
	remoteAccess,
	databaseTools,
	managementProtocols,
	investmentPlatforms,
	webServices,
	securityUpdates,
	webIM,
	businessTools,
	networkP18,
	networkp19,
	networkp20,
	privateProtocols,
	Unknown_255,

} from "../../traffic_rule_apps/app_ids";
import { categoryDeviceObject, appDeviceObject } from "./app_objects";
// import AppCard from "./app_card/AppCard";


export default function SeeAllApps()
{
    const keys = allAppsList.map(cat => cat.cat);
    const [filteredArray, setFilteredArray] = useState([]);
    const [searchableCopy, setSearchableCopy] = useState([]);
    const [filter, setFilter] = useState("");
    const [checked, setChecked] = useState({});
    const [description, setDescription] = useState("");
    const [appSelection, setAppSelection] = useState([]); // app selection
    const [deviceSelection, setDeviceSelection] = useState([]);
    const [devices, setDevices] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [catId, setCatId] = useState(Number);
    const [catIds, setCatIds] = useState([]); // for apps in multiple cats
    const [loading, setLoading] = useState(false);
    const [render, setRender] = useState(false);
    const manageDialogRef = useRef();
    const selectCatRef = useRef();
    const descriptionRef = useRef();


    const reRenderPage = () => {
        setRender(prev => !prev);
    }
    const resetState = () => {
        setFilteredArray([]);
        setSearchableCopy([]);
        setFilter("");
        setChecked({});
        setDescription("");
        setAppSelection([]);
        setDeviceSelection([]);
        setDevices([]);
        setCategoryName("");
        setCatId(Number);
        setCatIds([]);
        selectCatRef.current.value = "default";
        descriptionRef.current.value = "";
    }
    const handleChange = e => {
        setFilter(e.target.value);
    }
    const handleSearchByText = e => {
        const searchedArray = filteredArray.filter(name => name.name.toLowerCase().includes(e.target.value.toLowerCase()));
        setFilteredArray(searchedArray)
        if (e.target.value.length <= 2) {
            setFilteredArray(searchableCopy)
        }
    }
    const handleModalOpen = () => {
        manageDialogRef.current.showModal();
    }
    const handleModalClose = () => {
        manageDialogRef.current.close();
    }
    // const handleCheckbox = e => {
    //     if (e.target.checked) {
    //         setSelection([
    //             ...selection,
    //             { name: e.target.dataset.name, id: parseInt(e.target.dataset.id) }
    //         ]);
    //     } else if (!e.target.checked) {
    //         const filteredOut = selection.filter(name => name.name !== e.target.dataset.name)
    //         setSelection(filteredOut)
    //     }
    // }
    const handleCheckbox = (e, id) => {
        setChecked(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
        if (e.target.checked) {
            setAppSelection([
                ...appSelection,
                { name: e.target.dataset.name, id: parseInt(e.target.dataset.id) }
            ]);
        } else if (!e.target.checked) {
            const filteredOut = appSelection.filter(name => name.name !== e.target.dataset.name)
            setAppSelection(filteredOut)
        }
    }
    const handleDescription = e => {
        setDescription(e.target.value);
    }
    const handleSelectDevice = e => {
        if (e.target.checked) {
            const filterDevices = devices.filter(device => device.id === parseInt(e.target.dataset.deviceid));
            setDeviceSelection(prev => ([
                ...prev,
                ...filterDevices
            ]));
        } else if (!e.target.checked && deviceSelection.length) {
            const filterOutDevices = deviceSelection.filter(device => device.id !== parseInt(e.target.dataset.deviceid));
            setDeviceSelection([...filterOutDevices]);
        }
        console.log('deviceSelection \t', deviceSelection);
    }

    const createCategoryObjectRule = (unifiObject, devices, categoryId, description) => {
        const formatDevices = devices.map((device) => {
            return { client_mac: device.macAddress, type: 'CLIENT' }
        });
        // console.log(formatDevices);
        unifiObject.target_devices.push(...formatDevices);
        unifiObject.app_category_ids.push(categoryId);
        unifiObject.description = description;
        return {
            ...unifiObject
        }
    }
    const handleManageCategory = async () => {
        const categoryObject = createCategoryObjectRule(categoryDeviceObject, deviceSelection, catId, description);
        console.log('categoryObject \t', categoryObject);
        setLoading(true);
        try {
            const updateManagedCat = await fetch('/addcategorytrafficrule', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ categoryObject })
            });
            if (updateManagedCat.ok) {
                console.log('POST Success');
                setLoading(false);
                handleModalClose();
                reRenderPage();
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    }
    const createAppObjectRule = (unifiObject, devices, appIds, categoryIds, description) => {
        const formatDevices = devices.map((device) => {
            return { client_mac: device.macAddress, type: 'CLIENT' }
        });
        const formatAppIds = appIds.map((appId) => {
            return appId.id;
        });
        // console.log(formatDevices);
        unifiObject.target_devices.push(...formatDevices);
        unifiObject.app_ids.push(...formatAppIds);
        unifiObject.app_category_ids.push(...categoryIds);
        unifiObject.description = description;
        return {
            ...unifiObject
        }
    }
    const handleManageApps = async () => {
        const appObject = createAppObjectRule(appDeviceObject, deviceSelection, appSelection, catIds, description);
        console.log('appObject \t', appObject);
        setLoading(true);

        try {
            const updateManagedApps = await fetch('/addappstrafficrule', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ appObject })
            });
            if (updateManagedApps.ok) {
                console.log('POST Success');
                setLoading(false);
                handleModalClose();
                reRenderPage();
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    }

    useEffect(() => { // switch for filters
        const filterCriteria = (criteria) => {
            switch (criteria) {
                case 'Media Streaming':
                    // console.log('All devices in switch statement');
                    setFilteredArray(mediaStreaming);
                    setSearchableCopy(mediaStreaming);
                    setCategoryName("Media Streaming");
                    setCatId(4);
                    setCatIds(prev => [...prev, 4])
                    break;
                case 'Social Networks':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(socialNetworks);
                    setSearchableCopy(socialNetworks);
                    setCategoryName("Social Networks");
                    setCatId(24);
                    setCatIds(prev => [...prev, 24])
                    break;
                case 'Online Games':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(onlineGames);
                    setSearchableCopy(onlineGames);
                    setCategoryName("Online Games");
                    setCatId(8);
                    setCatIds(prev => [...prev, 8])
                    break;
                case 'Peer-to-Peer Networks':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(peertopeerNetworks);
                    setSearchableCopy(peertopeerNetworks);
                    setCategoryName("Peer-to-Peer Networks");
                    setCatId(1);
                    setCatIds(prev => [...prev, 1])
                    break;
                case 'Email Messaging':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(emailMessaging);
                    setSearchableCopy(emailMessaging);
                    setCategoryName("Email Messaging");
                    setCatId(5);
                    setCatIds(prev => [...prev, 5])
                    break;
                case 'Instant Messengers':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(instantMessengers);
                    setSearchableCopy(instantMessengers);
                    setCategoryName("Instant Messengers");
                    setCatId(0);
                    setCatIds(prev => [...prev, 0])
                    break;
                case 'Tunneling and Proxy':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(tunnelingProxy);
                    setSearchableCopy(tunnelingProxy);
                    setCategoryName("Tunneling and Proxy");
                    setCatId(11);
                    setCatIds(prev => [...prev, 11])
                    break;
                case 'File Sharing':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(fileSharing);
                    setSearchableCopy(fileSharing);
                    setCategoryName("File Sharing");
                    setCatId(3);
                    setCatIds(prev => [...prev, 3])
                    break;
                case 'VoIP Services':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(voip);
                    setSearchableCopy(voip);
                    setCategoryName("VoIP Services");
                    setCatId(6);
                    setCatIds(prev => [...prev, 6])
                    break;
                case 'Remote Access':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(remoteAccess);
                    setSearchableCopy(remoteAccess);
                    setCategoryName("Remote Access");
                    setCatId(10);
                    setCatIds(prev => [...prev, 10])
                    break;
                case 'Database Tools':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(databaseTools);
                    setSearchableCopy(databaseTools);
                    setCategoryName("Database Tools");
                    setCatId(7);
                    setCatIds(prev => [...prev, 7])
                    break;
                case 'Management Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(managementProtocols);
                    setSearchableCopy(managementProtocols)
                    setCategoryName("Management Protocols");
                    setCatId(9);
                    setCatIds(prev => [...prev, 9])
                    break;
                case 'Investment Platforms':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(investmentPlatforms);
                    setSearchableCopy(investmentPlatforms);
                    setCategoryName("Investment Platforms");
                    setCatId(12);
                    setCatIds(prev => [...prev, 12])
                    break;
                case 'Web Services':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(webServices);
                    setSearchableCopy(webServices);
                    setCategoryName("Web Services");
                    setCatId(13);
                    setCatIds(prev => [...prev, 13])
                    break;
                case 'Security Updates':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(securityUpdates);
                    setSearchableCopy(securityUpdates);
                    setCategoryName("Security Updates");
                    setCatId(14);
                    setCatIds(prev => [...prev, 14])
                    break;
                case 'Web IM':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(webIM);
                    setSearchableCopy(webIM);
                    setCategoryName("Web IM");
                    setCatId(15);
                    setCatIds(prev => [...prev, 15])
                    break;
                case 'Business Tools':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(businessTools);
                    setSearchableCopy(businessTools);
                    setCategoryName("Business Tools");
                    setCatId(17);
                    setCatIds(prev => [...prev, 17])
                    break;
                case 'Network Protocols_18':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(networkP18);
                    setSearchableCopy(networkP18);
                    setCategoryName("Network Protocols_18");
                    setCatId(18);
                    setCatIds(prev => [...prev, 18])
                    break;
                case 'Network Protocols_19':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(networkp19);
                    setSearchableCopy(networkp19);
                    setCategoryName("Network Protocols_19");
                    setCatId(19);
                    setCatIds(prev => [...prev, 19])
                    break;
                case 'Network Protocols_20':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(networkp20);
                    setSearchableCopy(networkp20);
                    setCategoryName("Network Protocols_20");
                    setCatId(20);
                    setCatIds(prev => [...prev, 20])
                    break;
                case 'Private Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(privateProtocols);
                    setSearchableCopy(privateProtocols);
                    setCategoryName("Private Protocols");
                    setCatId(23);
                    setCatIds(prev => [...prev, 23])
                    break;
                case 'Unknown_255':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(Unknown_255);
                    setSearchableCopy(Unknown_255);
                    setCategoryName("Unknown_255");
                    setCatId(255);
                    setCatIds(prev => [...prev, 255])
                    break;
                default:
                    setFilteredArray([]);
                    break;
            }
        }
        filterCriteria(filter);
    }, [
        filter,
        mediaStreaming,
        socialNetworks,
        onlineGames,
        peertopeerNetworks,
        emailMessaging,
        instantMessengers,
        tunnelingProxy,
        fileSharing,
        voip,
        remoteAccess,
        databaseTools,
        managementProtocols,
        investmentPlatforms,
        webServices,
        securityUpdates,
        webIM,
        businessTools,
        networkP18,
        networkp19,
        networkp20,
        privateProtocols,
        Unknown_255,
    ]);

    useEffect(() => { // get current devices
        const getDevices = async () => {
            try {
                const fetchDevices = await fetch('/getcurrentdevices');
                if (fetchDevices.ok) {
                    const deviceData = await fetchDevices.json();
                    setDevices(deviceData.getDeviceList);
                    console.log('deviceData: \t', deviceData);
                }
            } catch (error) {
                console.error(error);
            }
        }
        getDevices();
    }, []);

    useEffect(() => { // fetch custom api rules
        const fetchCustomAPIRules = async () => {
            try {
                const getCustomRules = await fetch('/getcustomapirules');
                if (getCustomRules.ok) {
                    const customRulesJSON = await getCustomRules.json();
                    console.log(customRulesJSON);
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchCustomAPIRules();
    }, []);
    useEffect(() => { // re-render after post
        resetState();
    }, [render])





    return (
        <>
            <div className={`grid ${filteredArray.length === 2 ? '2xl:grid-cols-2 lg:grid-cols-2' : filteredArray.length === 1 ? '2xl-grid-cols-1 lg:grid-cols-1 xl-grid-cols-1' : '2xl:grid-cols-3 lg:grid-cols-2'} grid-cols-1 auto-rows-auto w-full sm:w-3/4 mx-auto py-12 gap-6`}>
                    <div className="w-full row-span-full col-span-full row-start-3 flex items-center justify-center flex-wrap gap-4">
                            <select className="select select-bordered" ref={selectCatRef} onChange={handleChange}>
                                <option disabled selected value="default" className="font-bold hover:bg-accent">Select App Category</option>
                                {keys.map((i) => {
                                    return (
                                        <>
                                            <option key={i.id} className="font-bold hover:bg-accent" value={i}>{i}</option>
                                        </>
                                    )
                                })}
                            </select>
                            <input className="input input-bordered" placeholder="Search..." onChange={handleSearchByText} />
                        <button className="btn" onClick={handleModalOpen}>{appSelection.length ? 'Manage Apps in ' : 'Manage Category '} <span className="text-accent">{filter}</span></button>
                    </div>
                    {filteredArray?.map((app) => {
                        return (
                            <>
                                <div key={app?.id} className="card w-80 min-h-[204px] bg-base-100 shadow-xl hover:bg-base-200 mx-auto">
                                    <div className="card-body">
                                        <h2 className="card-title">{app?.name}</h2>
                                        <p>
                                        More Info on&nbsp;
                                            <a className="underline text-info italic" href={`https://www.google.com/search?q=${app?.name}`} target="_blank" rel="noreferrer">{app?.name}</a>
                                        ...
                                        </p>
                                        <div className="card-actions justify-end">
                                            <input type="checkbox" onChange={e => handleCheckbox(e, app?.id)} checked={checked[app?.id] || false} className="checkbox checkbox-primary" data-id={app?.id} data-name={app?.name} />
                                        </div>
                                    </div>
                                </div>
                            </>
                            )
                        })}
            </div>


            <dialog ref={manageDialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Manage</h3>
                    <div className="divider"></div>

                    {/* <div className="flex flex-col mb-2">
                        <span className="label font-bold">Apps in category:</span>
                            <select className="select select-bordered">
                                <option disabled selected>Choose apps</option>
                                {filteredArray
                                    .filter(app => !selection.some(selectedApp => selectedApp.id === app?.id))
                                    .map(app => {
                                        return (
                                            <>
                                                <option key={app.id}>{app?.name}</option>
                                            </>
                                        )
                                })}
                            </select>
                    </div> */}
                    <div className="m-1 flex flex-col items-center justify-center gap-2">
                    {!appSelection.length && <span>Category:&nbsp;<span className="text-accent">{categoryName}</span></span>}
                        <h1 className=" font-bold">Selected Apps:</h1>
                        {appSelection.length ? appSelection?.map((app) => {
                            return (
                                <>
                                    <div key={app.id} className="badge badge-primary">{app?.name}</div>
                                </>
                            )
                        }) : <span className="italic">none selected</span>}
                    </div>
                    <div className="flex flex-row mb-2 items-center justify-center my-2">
                        <input className="input input-bordered" placeholder="Add Description" ref={descriptionRef} onChange={handleDescription} />
                    </div>
                    <div className="flex flex-col mb-2">
                        <h1 className=" font-bold">Devices to manage Apps:</h1>
                       {devices.map((device) => {
                        return (
                            <>
                                <div className="form-control">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">{device?.name}</span>
                                        <input key={device?.id} data-deviceid={device?.id} onClick={handleSelectDevice} type="checkbox" className="checkbox checkbox-primary" />
                                    </label>
                                </div>
                            </>
                        )
                       })}
                    </div>
                    <div className="modal-action">
                        <div className="mr-auto">
                            <div className={` ${!appSelection.length ? 'btn' : 'hidden'} ${loading ? 'btn-disabled' : ''}`} onClick={handleManageCategory}>{loading ? <span className="loading loading-spinner w-6 h-6 text-accent"></span> : 'Manage Category'}</div>
                            <div className={` ${appSelection.length ? 'btn' : 'hidden'}`} onClick={handleManageApps}>Manage Apps</div>
                        </div>
                    <form method="dialog">
                        <button className="btn">Exit</button>
                    </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}