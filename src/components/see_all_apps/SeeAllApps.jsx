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
import { categoryDeviceObject, dbCategoryDeviceObject, appDeviceObject, appDbDeviceObject } from "./app_objects";
import { IoMdRefresh } from "react-icons/io";


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
    const [blockAllow, setBlockAllow] = useState("");
    const [catNameId, setCatNameId] = useState([]);
    const manageDialogRef = useRef();
    const selectCatRef = useRef();
    const descriptionRef = useRef();
    const blockRef = useRef();
    const allowRef = useRef();

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
        setBlockAllow("");
        setCatNameId([]);
        selectCatRef.current.value = "default";
        descriptionRef.current.value = "";
        allowRef.current.checked = false;
        blockRef.current.checked = false;
    }
    const handleResetManually = () => {
        resetState();
    }
    const handleChange = e => {
        setFilter(e.target.value);
    }
    const handleSearchByText = e => {
        const searchedArray = filteredArray.filter(name => name.name.toLowerCase().includes(e.target.value.toLowerCase()));
        setFilteredArray([...searchedArray])
        if (e.target.value.length <= 2) {
            setFilteredArray([...searchableCopy])
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
    const handleAllow = () => {
        setBlockAllow("ALLOW")
    }
    const handleBlock = () => {
        setBlockAllow("BLOCK")
    }

    const handleCheckbox = (e, id) => {
        setChecked(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
        if (e.target.checked) {
            setAppSelection(prev => ([
                ...prev,
                { name: e.target.dataset.name, id: parseInt(e.target.dataset.id) }
            ]));
        } else if (!e.target.checked) {
            const filteredOut = appSelection.filter(name => name.name !== e.target.dataset.name)
            const noDuplicates = [...new Set(filteredOut)];
            setAppSelection([...noDuplicates])
        }
    }
    const handleDescription = e => {
        setDescription(e.target.value);
    }
    const handleSelectDevice = e => {
        if (e.target.checked) {
            const filterDevices = devices.filter(device => device.id === parseInt(e.target.dataset.deviceid));
            const noDuplicates = [...new Set(filterDevices)];
            setDeviceSelection(prev => ([
                ...prev,
                ...noDuplicates
            ]));
        } else if (!e.target.checked && deviceSelection.length) {
            const filterOutDevices = deviceSelection.filter(device => device.id !== parseInt(e.target.dataset.deviceid));
            setDeviceSelection([...filterOutDevices]);
        }
        console.log('deviceSelection \t', deviceSelection);
    }

    const createCategoryObjectRule = (unifiObject, devices, categoryId, description, blockAllow) => {
        const formatDevices = devices.map((device) => {
            return { client_mac: device.macAddress, type: 'CLIENT' }
        });
        // console.log(formatDevices);
        unifiObject.target_devices.push(...formatDevices);
        unifiObject.app_category_ids.push(categoryId);
        unifiObject.description = description;
        unifiObject.action = blockAllow;
        return {
            ...unifiObject
        }
    }
    const createDBCategoryObjectRule = (unifiObject, devices, categoryId, categoryName, deviceSelection, description, blockAllow) => {
        const formatDevices = devices.map((device) => {
            return { client_mac: device.macAddress, type: 'CLIENT' }
        });
        // console.log(formatDevices);
        unifiObject.target_devices.push(...formatDevices);
        unifiObject.app_category_ids.push({ categoryId: categoryId, categoryName: categoryName});
        unifiObject.devices.push(...deviceSelection);
        unifiObject.description = description;
        unifiObject.action = blockAllow;
        unifiObject.devices.push(...devices);
        return {
            ...unifiObject
        }
    }
    const handleManageCategory = async () => { // submit category
        let unifiObjectCatCopy = JSON.parse(JSON.stringify(categoryDeviceObject))
        let unifiDbObjectCatCopy = JSON.parse(JSON.stringify(dbCategoryDeviceObject))
        const categoryObject = createCategoryObjectRule(unifiObjectCatCopy, deviceSelection, catId, description, blockAllow);
        const dbCatObject = createDBCategoryObjectRule(unifiDbObjectCatCopy, deviceSelection, catId, categoryName, deviceSelection, description, blockAllow);
        setLoading(true);
        try {
            const updateManagedCat = await fetch('/addcategorytrafficrule', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ categoryObject, dbCatObject })
            });
            if (updateManagedCat.ok) {
                console.log('POST Success');
                setLoading(false);
                handleModalClose();
                resetState();
                reRenderPage();
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    }

    const createAppObjectRule = (unifiObject, devices, appIds, description, blockAllow) => {
        const formatDevices = devices.map((device) => {
            return { client_mac: device.macAddress, type: 'CLIENT' }
        });
        const formatAppIds = appIds.map((appId) => {
            return appId.id;
        });
        // console.log(formatDevices);
        unifiObject.target_devices.push(...formatDevices);
        unifiObject.app_ids.push(...formatAppIds);
        // unifiObject.app_category_ids.push(...categoryIds); // categoryIds
        unifiObject.description = description;
        unifiObject.action = blockAllow;
        return {
            ...unifiObject
        }
    }
    const createDbAppObject = (unifiObject, devices, appIds, categoryIds, description, blockAllow) => {
        const formatDevices = devices.map((device) => {
            return { client_mac: device.macAddress, type: 'CLIENT' }
        });
        const formatAppIds = appIds.map((appId) => {
            return appId.id;
        });
        // console.log(formatDevices);
        unifiObject.target_devices.push(...formatDevices);
        unifiObject.app_ids.push(...formatAppIds);
        unifiObject.appSelection.push(...appIds)
        unifiObject.app_category_ids.push(...categoryIds);
        unifiObject.description = description;
        unifiObject.action = blockAllow;
        unifiObject.devices.push(...devices);
        return {
            ...unifiObject
        }
    }
    const handleManageApps = async () => { // submit apps
        let appDeviceObjectCopy = JSON.parse(JSON.stringify(appDeviceObject));
        let appDbDeviceObjectCopy = JSON.parse(JSON.stringify(appDbDeviceObject));
        const appObject = createAppObjectRule(appDeviceObjectCopy, deviceSelection, appSelection, description, blockAllow);
        const appDbObject = createDbAppObject(appDbDeviceObjectCopy, deviceSelection, appSelection, catNameId, description, blockAllow);
        console.log('appObject \t', appObject);
        console.log('appDatabaseObject \t', appDbObject);
        setLoading(true);

        try {
            const updateManagedApps = await fetch('/addappstrafficrule', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ appObject, appDbObject })
            });
            if (updateManagedApps.ok) {
                console.log('POST Success');
                setLoading(false);
                handleModalClose();
                resetState();
                reRenderPage();
            } else if (!updateManagedApps.ok) {
                const errorMessage = await updateManagedApps.json();
                console.log(errorMessage.error);
            }
        } catch (error) {
            setLoading(false);
            console.error('error \t', error);
            console.error('error.response \t', error.response);
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
                    setCatIds(prev => [...prev, 4]);
                    setCatNameId(prev => [...prev, { app_cat_id: 4, app_cat_name: "Media Streaming" }])
                    break;
                case 'Social Networks':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(socialNetworks);
                    setSearchableCopy(socialNetworks);
                    setCategoryName("Social Networks");
                    setCatId(24);
                    setCatIds(prev => [...prev, 24])
                    setCatNameId(prev => [...prev, { app_cat_id: 24, app_cat_name: "Social Networks" }])
                    break;
                case 'Online Games':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(onlineGames);
                    setSearchableCopy(onlineGames);
                    setCategoryName("Online Games");
                    setCatId(8);
                    setCatIds(prev => [...prev, 8])
                    setCatNameId(prev => [...prev, { app_cat_id: 8, app_cat_name: "Online Games" }])
                    break;
                case 'Peer-to-Peer Networks':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(peertopeerNetworks);
                    setSearchableCopy(peertopeerNetworks);
                    setCategoryName("Peer-to-Peer Networks");
                    setCatId(1);
                    setCatIds(prev => [...prev, 1])
                    setCatNameId(prev => [...prev, { app_cat_id: 1, app_cat_name: "Peer-to-Peer Networks" }])
                    break;
                case 'Email Messaging':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(emailMessaging);
                    setSearchableCopy(emailMessaging);
                    setCategoryName("Email Messaging");
                    setCatId(5);
                    setCatIds(prev => [...prev, 5])
                    setCatNameId(prev => [...prev, { app_cat_id: 5, app_cat_name: "Email Messaging" }])
                    break;
                case 'Instant Messengers':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(instantMessengers);
                    setSearchableCopy(instantMessengers);
                    setCategoryName("Instant Messengers");
                    setCatId(0);
                    setCatIds(prev => [...prev, 0])
                    setCatNameId(prev => [...prev, { app_cat_id: 0, app_cat_name: "Instant Messengers" }])
                    break;
                case 'Tunneling and Proxy':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(tunnelingProxy);
                    setSearchableCopy(tunnelingProxy);
                    setCategoryName("Tunneling and Proxy");
                    setCatId(11);
                    setCatIds(prev => [...prev, 11])
                    setCatNameId(prev => [...prev, { app_cat_id: 11, app_cat_name: "Tunneling and Proxy" }])
                    break;
                case 'File Sharing':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(fileSharing);
                    setSearchableCopy(fileSharing);
                    setCategoryName("File Sharing");
                    setCatId(3);
                    setCatIds(prev => [...prev, 3])
                    setCatNameId(prev => [...prev, { app_cat_id: 3, app_cat_name: "File Sharing" }])
                    break;
                case 'VoIP Services':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(voip);
                    setSearchableCopy(voip);
                    setCategoryName("VoIP Services");
                    setCatId(6);
                    setCatIds(prev => [...prev, 6])
                    setCatNameId(prev => [...prev, { app_cat_id: 6, app_cat_name: "VoIP Services" }])
                    break;
                case 'Remote Access':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(remoteAccess);
                    setSearchableCopy(remoteAccess);
                    setCategoryName("Remote Access");
                    setCatId(10);
                    setCatIds(prev => [...prev, 10])
                    setCatNameId(prev => [...prev, { app_cat_id: 10, app_cat_name: "Remote Access" }])
                    break;
                case 'Database Tools':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(databaseTools);
                    setSearchableCopy(databaseTools);
                    setCategoryName("Database Tools");
                    setCatId(7);
                    setCatIds(prev => [...prev, 7])
                    setCatNameId(prev => [...prev, { app_cat_id: 7, app_cat_name: "Database Tools" }])
                    break;
                case 'Management Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(managementProtocols);
                    setSearchableCopy(managementProtocols)
                    setCategoryName("Management Protocols");
                    setCatId(9);
                    setCatIds(prev => [...prev, 9])
                    setCatNameId(prev => [...prev, { app_cat_id: 9, app_cat_name: "Management Protocols" }])
                    break;
                case 'Investment Platforms':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(investmentPlatforms);
                    setSearchableCopy(investmentPlatforms);
                    setCategoryName("Investment Platforms");
                    setCatId(12);
                    setCatIds(prev => [...prev, 12])
                    setCatNameId(prev => [...prev, { app_cat_id: 12, app_cat_name: "Investment Platforms" }])
                    break;
                case 'Web Services':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(webServices);
                    setSearchableCopy(webServices);
                    setCategoryName("Web Services");
                    setCatId(13);
                    setCatIds(prev => [...prev, 13])
                    setCatNameId(prev => [...prev, { app_cat_id: 13, app_cat_name: "Web Services" }])
                    break;
                case 'Security Updates':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(securityUpdates);
                    setSearchableCopy(securityUpdates);
                    setCategoryName("Security Updates");
                    setCatId(14);
                    setCatIds(prev => [...prev, 14])
                    setCatNameId(prev => [...prev, { app_cat_id: 14, app_cat_name: "Security Updates" }])
                    break;
                case 'Web IM':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(webIM);
                    setSearchableCopy(webIM);
                    setCategoryName("Web IM");
                    setCatId(15);
                    setCatIds(prev => [...prev, 15])
                    setCatNameId(prev => [...prev, { app_cat_id: 15, app_cat_name: "Web IM" }])
                    break;
                case 'Business Tools':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(businessTools);
                    setSearchableCopy(businessTools);
                    setCategoryName("Business Tools");
                    setCatId(17);
                    setCatIds(prev => [...prev, 17])
                    setCatNameId(prev => [...prev, { app_cat_id: 17, app_cat_name: "Business Tools" }])
                    break;
                case 'Network Protocols_18':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(networkP18);
                    setSearchableCopy(networkP18);
                    setCategoryName("Network Protocols_18");
                    setCatId(18);
                    setCatIds(prev => [...prev, 18])
                    setCatNameId(prev => [...prev, { app_cat_id: 18, app_cat_name: "Network Protocols_18" }])
                    break;
                case 'Network Protocols_19':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(networkp19);
                    setSearchableCopy(networkp19);
                    setCategoryName("Network Protocols_19");
                    setCatId(19);
                    setCatIds(prev => [...prev, 19])
                    setCatNameId(prev => [...prev, { app_cat_id: 19, app_cat_name: "Network Protocols_19" }])
                    break;
                case 'Network Protocols_20':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(networkp20);
                    setSearchableCopy(networkp20);
                    setCategoryName("Network Protocols_20");
                    setCatId(20);
                    setCatIds(prev => [...prev, 20])
                    setCatNameId(prev => [...prev, { app_cat_id: 20, app_cat_name: "Network Protocols_20" }])
                    break;
                case 'Private Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(privateProtocols);
                    setSearchableCopy(privateProtocols);
                    setCategoryName("Private Protocols");
                    setCatId(23);
                    setCatIds(prev => [...prev, 23])
                    setCatNameId(prev => [...prev, { app_cat_id: 23, app_cat_name: "Private Protocols" }])
                    break;
                case 'Unknown_255':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(Unknown_255);
                    setSearchableCopy(Unknown_255);
                    setCategoryName("Unknown_255");
                    setCatId(255);
                    setCatIds(prev => [...prev, 255])
                    setCatNameId(prev => [...prev, { app_cat_id: 255, app_cat_name: "Unknown_255" }])
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
    // useEffect(() => { // fetch custom api rules
    //     const fetchCustomAPIRules = async () => {
    //         try {
    //             const getCustomRules = await fetch('/getcustomapirules'); // /getdbcustomapirules ??
    //             if (getCustomRules.ok) {
    //                 const customRulesJSON = await getCustomRules.json();
    //                 console.log(customRulesJSON);
    //             }
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     }
    //     fetchCustomAPIRules();
    // }, []);
    useEffect(() => { // re-render after post and reset devices list

        const getDevices = async () => {
            try {
                const fetchDevices = await fetch('/getcurrentdevices');
                if (fetchDevices.ok) {
                    const deviceData = await fetchDevices.json();
                    setDevices(deviceData.getDeviceList);
                    console.log('deviceData on rerender: \t', deviceData);
                }
            } catch (error) {
                console.error(error);
            }
        }
        getDevices();
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
                        <div className="btn btn-circle" onClick={handleResetManually}><IoMdRefresh className="pointer-events-none w-7 h-7" /></div>
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
                    <h3 className="flex font-bold text-lg items-center justify-center mt-2">Manage</h3>
                    <div className="divider"></div>
                    <div className="m-1 flex flex-col gap-2">
                        {!appSelection.length && <span>Selected Category:&nbsp;<span className="text-accent">{categoryName}</span></span>}
                        <h1 className={`${appSelection.length ? 'font-bold' : 'hidden'}`}>Selected Apps:</h1>
                        <div className={`${appSelection.length ? 'flex flex-row flex-wrap gap-2' : 'hidden'}`}>{appSelection.length ? appSelection?.map((app) => {
                            return (
                                <>
                                    <div key={app.id} className="badge badge-primary">{app?.name}</div>
                                </>
                            )
                        }) : <span className="italic">none selected</span>}</div>
                        </div>
                    <div className="flex flex-col mb-2 my-2 gap-4">
                        <h1 className="font-bold">Description:</h1>
                        <input className="input input-bordered" placeholder="Add Description" ref={descriptionRef} onChange={handleDescription} />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="join m-4">
                                <input
                                    onClick={handleAllow}
                                    className={`btn join-item`}
                                    ref={allowRef}
                                    type="radio"
                                    aria-label="Allow"
                                    name="options"
                                />
                                <input
                                    onClick={handleBlock}
                                    className={`btn join-item`}
                                    ref={blockRef}
                                    type="radio"
                                    aria-label="Block"
                                    name="options"
                                />
                            </div>
                        </div>
                    <div className="flex flex-col mb-2">
                        <h1 className=" font-bold">Devices to manage Apps:</h1>
                       {devices.map((device) => {
                        return (
                            <>
                                <div className="form-control">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">{device?.name}</span>
                                        <input
                                            key={device?.id}
                                            data-deviceid={device?.id}
                                            onClick={handleSelectDevice}
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                        />
                                    </label>
                                </div>
                            </>
                        )
                       })}
                    </div>
                    <div className="modal-action">
                        <div className="mr-auto">
                            <div
                                className={`
                                    ${!appSelection.length ? 'btn' : 'hidden'}
                                    ${loading ? 'btn-disabled' : ''}
                                    ${!deviceSelection.length ? 'btn-disabled' : ''}
                                    ${description === "" ? 'btn-disabled' : ''}
                                    ${blockAllow === "" ? 'btn-disabled' : ''}
                                `}
                                onClick={handleManageCategory}>{loading ? <span className="loading loading-spinner w-6 h-6 text-accent"></span> : 'Manage Category'}</div>
                            <div
                                className={`
                                    ${appSelection.length ? 'btn' : 'hidden'}
                                    ${loading ? 'btn-disabled' : ''}
                                    ${!deviceSelection.length ? 'btn-disabled' : ''}
                                    ${description === "" ? 'btn-disabled' : ''}
                                    ${blockAllow === "" ? 'btn-disabled' : ''}
                                `}
                                onClick={handleManageApps}>{loading ? <span className="loading loading-spinner w-6 h-6 text-accent"></span> : 'Manage Apps'}</div>
                        </div>
                        <div className="btn" onClick={handleModalClose}>Exit</div>
                    </div>
                </div>
            </dialog>
        </>
    );
}