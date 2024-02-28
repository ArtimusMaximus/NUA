import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { categoryDeviceObject, appDeviceObject } from "../see_all_apps/app_objects";
import { allAppsList } from "../../traffic_rule_apps/unifi_match_list";
import { importToDbConverter } from "../utility_functions/app_cat_utils";
import { useGetAllDevices } from "../custom_hooks/useGetAllDevices";




export default function TrafficRules()
{
    const { existingDeviceList, allClientDeviceList } = useGetAllDevices();
    const [customAPIRules, setCustomAPIRules] = useState([]);
    const [unifiRuleObject, setUnifiRuleObject] = useState([]);
    const [importRuleChoices, setImportRuleChoices] = useState([]);
    const [importRuleSelection, setImportRuleSelection] = useState([]);
    const [importDeviceSelection, setImportDeviceSelection] = useState([]);
    const [checked, setChecked] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [render, setRender] = useState(false);
    const [importOption, setImportOption] = useState(false);
    const [loadingImportSubmission, setLoadingImportSubmission] = useState(false);
    const [loadingUnmanageApp, setLoadingUnmanageApp] = useState(false);
    const importDialogRef = useRef();

    function checkForImportRules(dbData, unifiData) {
        const filterOutInternetMatchingTarget = unifiData.filter((rule) => rule.matching_target !== "INTERNET")
        const importData = filterOutInternetMatchingTarget.filter(unifiData =>
            dbData.some(dbIds => dbIds.trafficRule.unifiId !== unifiData._id));
            // console.log('checkForImportRules \t', importData);
        return importData;
    }
    function checkDeviceType(arr) {
        const filteredDevices = arr.filter(device => {
            return !(device?.target_devices?.every(innerDevice => innerDevice?.type === "NETWORK"));
        });
        return filteredDevices;
    }
    const handleImportModalOpen = () => {
        importDialogRef.current.showModal();
    }
    const handleImportModalClose = () => {
        importDialogRef.current.close();
    }
    const handleSelectedImport = (e, id) => {
        setChecked(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
        const choicesFilter = importRuleChoices.filter((choice) => choice._id === id);
            if (e.target.checked) {
                const noDuplicates = [...new Set(choicesFilter)];
                setImportRuleSelection(prev => ([
                    ...prev,
                    ...noDuplicates
                ]))
            } else if (!e.target.checked) {
                const filteredOut = importRuleSelection.filter(id => id._id !== e.target.dataset.id);
                const noDuplicates = [...new Set(filteredOut)];
                setImportRuleSelection([...noDuplicates])
            }
            console.log('importRuleSelection \t', importRuleSelection);
    }
    const handleUnmanageApp = e => {

        console.log(e.target.dataset.trafficruleid);
        const dbId = e.target.dataset.trafficruleid;

        const unmanageApp = async () => {
            try {
                const submitUnmanageApp = await fetch('/unmanageapp', {
                    method: 'DELETE',
                    mode: 'cors',
                    headers: {
                        'Content-Type' : 'application/json'
                    },
                    body: JSON.stringify({ dbId })
                });
                if (submitUnmanageApp.ok) {
                    console.log(`DB ID: ${dbId} unmanaged successfully!`)
                    reRender();
                }
            } catch (error) {
                console.error(error);
            }
        }
        unmanageApp();

    }
    // const handleSelectedDeviceImport = (e, id) => {
    //     const choicesFilter = importRuleChoices.filter((choice) => choice._id === id);
    //         setChecked2(prevState => ({
    //             ...prevState,
    //             [id]: !prevState[id]
    //         }));
    //         if (e.target.checked) {
    //             const noDuplicates = [...new Set(choicesFilter)]
    //             setImportDeviceSelection(prev => ([
    //                 ...prev,
    //                 ...noDuplicates
    //             ]))
    //         } else if (!e.target.checked) {
    //             const filteredOut = importRuleSelection.filter(id => id._id !== e.target.dataset.unifiid)
    //             const noDuplicates = [...new Set(filteredOut)];
    //             setImportDeviceSelection([...noDuplicates]);
    //         }
    //         console.log('ImportDeviceSelection \t', importDeviceSelection);
    // }
    const reRender = () => {
        setRender(prev => !prev);
    }
    const handleToggle = async e => {
        const checked = e.target.checked;
        // console.log('checked \t', checked);
        const _id = e.target.dataset.unifiruleid;
        const findUnifiObj = unifiRuleObject.filter(rule => rule._id === _id).pop();
        const unifiObjCopy = JSON.parse(JSON.stringify(findUnifiObj));
        unifiObjCopy.enabled = checked;

        const trafficRuleId = e.target.dataset.dbtrafficruleid;
        try {
            const toggleEnabled = await fetch('/updatetrafficruletoggle', {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ _id, trafficRuleId, unifiObjCopy })
            });
            if (toggleEnabled.ok) {
                reRender();
            }
        } catch (error) {
            console.error('There was an error toggling the Traffic Rule.');
        }
    }
    const handleDeleteTrafficRule = async e => {
        const _id = e.target.dataset.trafficid;
        const trafficRuleId = e.target.dataset.trafficruleid;
        try {
            const deleteTrafficRule = await fetch('/deletecustomapi', {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ _id, trafficRuleId })
            });
            if (deleteTrafficRule.ok) {
                console.log('Delete Successful.');
                const res = await deleteTrafficRule.json();
                console.log(res.result);
                reRender();
            }
        } catch (error) {
            console.error(error);
        }
    }
    const handleDeleteTestIds = async () => {
        const untouchableIds = [ "6575d1891769d72344f9e1af", "65a9260d7d12773fe586ec4b", "65bda95338fb85531f321e7e" ];
        const touchableIds = unifiRuleObject.filter(id => !untouchableIds.some(ids => ids === id._id));
        // const touchableIds = touchableId.slice(0, 100);
        const asda = ["65c59f2538fb85531f3569d6"];

        // console.log('touchableIds \t', touchableIds);
        try {
            const deleteManyTestIds = await fetch('/deletetestids', {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ asda })
            });
            if (deleteManyTestIds.ok) {
                const { successArray } = await deleteManyTestIds.json();
                // console.log('successArray: \t', successArray);
                // console.log('successArray.length: \t', successArray.length);
            }
        } catch (error) {
            console.error(error);
        }
    }
    const handleImportOption = async () => {
        setLoadingImportSubmission(true);
        const importExists = checkForImportRules(customAPIRules, unifiRuleObject);
        if (importExists.length) {
            console.log('importExists \t', importExists);
        }
        const { categoryClones, appClones } = importToDbConverter(importRuleSelection, allClientDeviceList, existingDeviceList);
        if (categoryClones || appClones) {
            console.log('categoryClones \t', categoryClones);
            console.log('appClones \t', appClones);
        }
        try {
            const importExistingRules = await fetch('/importexistingunifirules', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ categoryClones, appClones })
            });

            if (importExistingRules.ok) {
                setLoadingImportSubmission(false);
                // const res = importExistingRules.json();
                // console.log('importExistingRules.ok: \t', res);
                // setImportDeviceSelection([]);
                handleImportModalClose();
                reRender();
            }
        } catch (error) {
            setLoadingImportSubmission(false);
            console.error(error);
        }
    }

    useEffect(() => { // refresh after re-render && initial?
        const fetchCustomAPIRules = async () => {
            try {
                const getCustomRules = await fetch('/getdbcustomapirules');
                if (getCustomRules.ok) {
                    const { trafficRuleDbData, unifiData } = await getCustomRules.json();
                    console.log('trafficRuleDbData rerender: \t', trafficRuleDbData);

                    setCustomAPIRules(trafficRuleDbData);
                    setUnifiRuleObject(unifiData);
                    console.log('unifiData rerender: \t', unifiData);

                    const filteredOutNetworkDevices = checkDeviceType(unifiData);
                    console.log('checkDeviceType: \t', checkDeviceType(unifiData));

                    const importExists = checkForImportRules(trafficRuleDbData, filteredOutNetworkDevices);
                    console.log('importExists \t', importExists);

                    console.log('customAPIRules \t', customAPIRules); // empty
                    const filterOutRulesAlreadyInList = importExists.filter(rule => !trafficRuleDbData.some(obj => obj.trafficRule.unifiId === rule._id));

                    console.log('filterOutRulesAlreadyInList \t', filterOutRulesAlreadyInList);
                    if (filterOutRulesAlreadyInList.length) {
                        setImportOption(true);
                        setImportRuleChoices([...filterOutRulesAlreadyInList]);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchCustomAPIRules();
    }, [render]);

    // useEffect(() => { // fetch DB customAPI rules && unifi rules // necessary 02/27/2024 - not necessary?
    //     const fetchCustomAPIRules = async () => {
    //         try {
    //             const getCustomRules = await fetch('/getdbcustomapirules');
    //             if (getCustomRules.ok) {
    //                 const { trafficRuleDbData, unifiData } = await getCustomRules.json();
    //                 console.log('customDATABASERulesJSON \t', trafficRuleDbData);
    //                 console.log('unifiData initial \t', unifiData);
    //                 setCustomAPIRules(trafficRuleDbData);
    //                 setUnifiRuleObject(unifiData);
    //             }
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     }
    //     fetchCustomAPIRules();
    // }, []);


    return (
        <>
            <div className="flex items-center justify-center flex-col w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                {/* <div className="btn" onClick={handleDeleteTestIds}>Delete Test Ids</div> */}
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-xl font-bold">Toggle</div>
                            <div className="text-xl font-bold">Description</div>
                        </div>
                        <div className="divider mt-2 mb-2"></div>
                        <ul className="flex flex-col w-full justify-around gap-2">
                            {
                                customAPIRules?.map((data) => {
                                    return (
                                        <>
                                            <li key={data?.trafficRule.unifiId} className="m-1" >
                                            <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <input
                                                                type="checkbox"
                                                                checked={data?.trafficRule.enabled}
                                                                className="toggle toggle-success z-30"
                                                                onClick={handleToggle}
                                                                data-unifiruleid={data.trafficRule.unifiId}
                                                                data-dbtrafficruleid={data.trafficRule.id}
                                                            />
                                                            {data?.trafficRule.description}
                                                        </div>
                                                    </div>
                                                    <div className="collapse-content">
                                                            <div className="flex gap-4 flex-wrap items-center my-2">
                                                            <h1 className="font-bold italic">Managing Apps:</h1>
                                                                {data?.matchingAppIds.map((appId) => {
                                                                    return (
                                                                        <>
                                                                            <span className="badge badge-primary">{appId?.app_name}</span>
                                                                        </>
                                                                    )
                                                                })}
                                                                {/* <p><span className="font-thin italic">Apps:</span> {data?.name}</p> */}
                                                                {/* <p><span className="font-thin italic">Devices:</span> {data?.macAddress}</p> */}
                                                            </div>
                                                            <div className="flex gap-4 flex-wrap items-center my-2">
                                                                <h1 className="font-bold italic">Devices: </h1>
                                                                {data.matchingTargetDevices.map((device) => {
                                                                    return (
                                                                        <>
                                                                            <span className="badge badge-accent">{device.client_mac}</span>
                                                                        </>
                                                                    )
                                                                })}
                                                            </div>
                                                        <div>
                                                            {/* <Link to={`/`} className="w-fit hover:cursor-pointer"> */}
                                                                <div className="btn btn-block btn-disabled bg-base-300 hover:bg-base-content hover:text-base-100 my-2 disabled">Schedule</div>
                                                            {/* </Link> */}
                                                        </div>
                                                        <div className="flex flex-row gap-2">
                                                            <div
                                                                className="btn btn-error w-1/2" aria-disabled
                                                                onClick={handleDeleteTrafficRule}
                                                                data-trafficid={data?.trafficRule.unifiId}
                                                                data-trafficruleid={data?.trafficRule.id}
                                                            >Delete
                                                            </div>
                                                            <div
                                                                className={`${loadingUnmanageApp ? 'btn btn-disabled' : 'btn btn-info'} w-1/2`} aria-disabled
                                                                onClick={handleUnmanageApp}
                                                                // data-trafficid={data?.trafficRule.unifiId}
                                                                data-trafficruleid={data?.trafficRule.id}
                                                            >{loadingUnmanageApp ? <span className="spinner loading-spinner"></span> : 'Unmanage App'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </>
                                    )
                                })
                            }
                        </ul>
                    </div>
                </div>
                <div className="flex flex-row gap-6 flex-wrap mx-auto">
                    <Link to="/seeallapps"><div className="btn">Create New Rule</div></Link>
                    {importOption ? <div className={`btn text-accent italic`} onClick={handleImportModalOpen}>Import UniFi Rules</div> : <div className={`btn text-accent italic btn-disabled`}>Import Existing Unifi Rules</div>}
                </div>
            </div>
            <dialog ref={importDialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Select UniFi Rules To Import</h3>
                    <div className="flex flex-col gap-4 my-4">
                            {importRuleChoices.map((data) => {
                                return (
                                    <>
                                        <div className="card w-full bg-base-200 shadow-xl">
                                        <div className="card-body p-6">
                                            <h2 className="card-title">Description: {data.description}</h2>
                                            <p>Matching Target: {data.matching_target}</p>
                                            <div className="card-actions justify-end items-center flex">
                                                <div className="label">Select</div>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-accent"
                                                    onClick={e => handleSelectedImport(e, data._id)}
                                                    data-id={data._id}
                                                    checked={checked[data?._id] || false}
                                                />
                                            </div>
                                            {/* <div className="card-actions justify-end items-center flex">
                                                <div className="label">Add to Device List</div>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-accent"
                                                    onClick={e => handleSelectedDeviceImport(e, data._id)}
                                                    data-unifiid={data._id}
                                                    checked={checked2[data?._id] || false}
                                                />
                                            </div> */}
                                        </div>
                                        </div>
                                    </>
                                )
                            })}
                    </div>
                    <div className="flex justify-between">
                        <div className="btn" onClick={handleImportModalClose}>Cancel</div>
                        <div
                            className={`btn
                            ${importRuleSelection.length ? '' : 'btn-disabled'}
                            ${loadingImportSubmission ? 'btn-disabled' : ''}`}
                            onClick={handleImportOption}>
                            {loadingImportSubmission ? <span className={'loading loading-spinner'}></span> : 'Import'}
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    )
}