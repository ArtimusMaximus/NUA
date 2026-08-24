import { useEffect, useRef, useState } from "react";
import { categoryDeviceObject, appDeviceObject } from "../see_all_apps/app_objects";
import { allAppsList } from "../../traffic_rule_apps/unifi_match_list";
import { importToDbConverter } from "../utility_functions/app_cat_utils";
import { useGetAllDevices } from "../custom_hooks/useGetAllDevices";
import GenericPageSkeleton from "../skeletons/GenericPageSkeleton";
import CreateRuleModal from "./CreateRuleModal";
import RuleBonusTimeButton from "../utility_components/RuleBonusTimeButton";
import RuleScheduleButton from "../utility_components/RuleScheduleButton";
import {
    HiShieldCheck,
    HiPlus,
    HiArrowDownTray,
    HiTrash,
    HiChevronDown,
    HiChevronUp,
    HiCpuChip,
    HiDevicePhoneMobile,
} from "react-icons/hi2";




export default function TrafficRules({ embedded = false })
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
    const [pageLoading, setPageLoading] = useState(true);
    const importDialogRef = useRef();
    const createRuleDialogRef = useRef();

    function checkForImportRules(dbData, unifiData) {
        const filterOutInternetMatchingTarget = unifiData.filter((rule) => rule.matching_target !== "INTERNET");
        if (dbData !== null) {
            const importData = filterOutInternetMatchingTarget.filter(unifiData =>
                dbData.some(dbIds => dbIds.trafficRule.unifiId !== unifiData._id));
                // console.log('checkForImportRules \t', importData);
            return importData;
        } else {
            const importData = filterOutInternetMatchingTarget
            return importData;
        }
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
        const resetCheckedState = {};
        importRuleChoices.forEach(choice => {
            resetCheckedState[choice._id] = false;
        });
        setChecked(false);
        setImportRuleSelection([]);
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
        console.log(e.currentTarget.dataset.trafficruleid);
        const dbId = e.currentTarget.dataset.trafficruleid;
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
                    console.log(`DB ID: ${dbId} unmanaged successfully!`);
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
        console.log('Component re-rendered.');
        setRender(prev => !prev);
    }
    const handleToggle = async e => {
        const checked = e.currentTarget.checked;
        // console.log('checked \t', checked);
        const _id = e.currentTarget.dataset.unifiruleid;
        const findUnifiObj = unifiRuleObject.filter(rule => rule._id === _id).pop();
        const unifiObjCopy = JSON.parse(JSON.stringify(findUnifiObj));
        unifiObjCopy.enabled = checked;

        const trafficRuleId = e.currentTarget.dataset.dbtrafficruleid;
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
        const _id = e.currentTarget.dataset.trafficid;
        const trafficRuleId = e.currentTarget.dataset.trafficruleid;
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
                handleImportModalClose();
                setChecked(false);
                reRender();
            }
        } catch (error) {
            setLoadingImportSubmission(false);
            console.error(error);
        }
    }

    useEffect(() => { // refresh after re-render && initial?
        const fetchCustomAPIRules = async () => {
            const getCustomRules = await fetch('/getdbcustomapirules');
            try {
                if (getCustomRules.status === 206) {
                    setCustomAPIRules([]);
                    const { unifiData } = await getCustomRules.json();

                    setUnifiRuleObject(unifiData);
                    const filteredOutNetworkDevices = checkDeviceType(unifiData);
                    const importExists = checkForImportRules(null, filteredOutNetworkDevices);

                    if (importExists.length) {
                        setImportOption(true);
                        setImportRuleChoices([...importExists]);
                    }
                } else if (getCustomRules.status === 200) {
                    const { trafficRuleDbData, unifiData } = await getCustomRules.json();
                    if (trafficRuleDbData.length) {
                        setCustomAPIRules(trafficRuleDbData);
                    }
                    setUnifiRuleObject(unifiData);
                    const filteredOutNetworkDevices = checkDeviceType(unifiData);
                    const importExists = checkForImportRules(trafficRuleDbData, filteredOutNetworkDevices);
                    const filterOutRulesAlreadyInList = importExists.filter(rule => !trafficRuleDbData.some(obj => obj.trafficRule.unifiId === rule._id));
                    if (filterOutRulesAlreadyInList.length) {
                        setImportOption(true);
                        setImportRuleChoices([...filterOutRulesAlreadyInList]);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setPageLoading(false);
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


    const containerClass = embedded
        ? 'flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 gap-6'
        : 'flex flex-col w-full sm:w-3/4 lg:w-1/2 mx-auto px-4 pb-12 pt-4 gap-6';

    return (
        <>
            {pageLoading && <GenericPageSkeleton rows={4} />}
            {!pageLoading && (
                <div className={containerClass}>

                    {/* Page header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HiShieldCheck className="w-6 h-6 text-primary" />
                            <h1 className="text-2xl font-bold text-base-content">Traffic Rules</h1>
                            {customAPIRules.length > 0 && (
                                <span className="badge badge-primary badge-sm ml-1">{customAPIRules.length}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {importOption ? (
                                <button
                                    className="btn btn-sm btn-ghost gap-1"
                                    onClick={handleImportModalOpen}
                                >
                                    <HiArrowDownTray className="w-4 h-4" />
                                    Import
                                </button>
                            ) : (
                                <button className="btn btn-sm btn-ghost gap-1 btn-disabled" disabled>
                                    <HiArrowDownTray className="w-4 h-4" />
                                    Import
                                </button>
                            )}
                                            <button
                                className="btn btn-sm btn-primary gap-1"
                                onClick={() => createRuleDialogRef.current.showModal()}
                            >
                                <HiPlus className="w-4 h-4" />
                                New Rule
                            </button>
                        </div>
                    </div>

                    {/* Rule cards */}
                    {customAPIRules.length ? (
                        <ul className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] m-0 p-0">
                            {customAPIRules.map((data) => (
                                <RuleCard
                                    key={data?.trafficRule.unifiId}
                                    data={data}
                                    onToggle={handleToggle}
                                    onDelete={handleDeleteTrafficRule}
                                    onUnmanage={handleUnmanageApp}
                                    onStateChange={reRender}
                                    loadingUnmanageApp={loadingUnmanageApp}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="bg-white dark:bg-base-200 border border-base-300 rounded-xl shadow-sm p-10 flex flex-col items-center gap-3 text-base-content/50">
                            <HiShieldCheck className="w-10 h-10" />
                            <p className="text-sm">No rules yet. Create or import a rule to get started.</p>
                        </div>
                    )}
                </div>
            )}

            <CreateRuleModal dialogRef={createRuleDialogRef} onSuccess={reRender} />

            {/* Import modal */}
            <dialog ref={importDialogRef} className="modal">
                <div className="modal-box max-w-lg">
                    <div className="flex items-center gap-2 mb-5">
                        <HiArrowDownTray className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-lg">Import UniFi Rules</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {importRuleChoices.map((data) => (
                            <label
                                key={data._id}
                                className="flex items-start gap-4 p-4 rounded-xl border border-base-300 bg-base-200 hover:border-accent cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-accent mt-0.5 flex-shrink-0"
                                    onClick={e => handleSelectedImport(e, data._id)}
                                    data-id={data._id}
                                    checked={checked[data?._id] || false}
                                    onChange={() => {}}
                                />
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="font-semibold text-base-content truncate">{data.description}</span>
                                    <span className="text-xs text-base-content/50">Target: {data.matching_target}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-between mt-6">
                        <button className="btn btn-ghost" onClick={handleImportModalClose}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleImportOption}
                            disabled={!importRuleSelection.length || loadingImportSubmission}
                        >
                            {loadingImportSubmission
                                ? <span className="loading loading-spinner loading-sm"></span>
                                : <><HiArrowDownTray className="w-4 h-4" /> Import {importRuleSelection.length > 0 && `(${importRuleSelection.length})`}</>
                            }
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleImportModalClose}>close</button>
                </form>
            </dialog>
        </>
    );
}

function RuleCard({ data, onToggle, onDelete, onUnmanage, onStateChange, loadingUnmanageApp }) {
    const [expanded, setExpanded] = useState(false);
    const enabled = data?.trafficRule.enabled;
    const bonusTimeActive = data?.trafficRule.bonusTimeActive || false;

    const getCardBorderClasses = (isEnabled) => {
        return `border border-base-300 relative ${isEnabled ? 'border-success' : 'border-error'}`;
    };

    const getAccentBorderColor = (isEnabled) => {
        if (isEnabled) return '#10B981'; // green-500
        return '#EF4444'; // red-500
    };

    return (
        <li className="list-none">
            <div className={`bg-white dark:bg-base-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${getCardBorderClasses(enabled)}`}>
                {/* Stylized top accent border */}
                <div
                    className="absolute top-0 left-0 w-1/3 h-1 rounded-tl-xl"
                    style={{ backgroundColor: getAccentBorderColor(enabled) }}
                ></div>

                {/* Card Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 p-2 rounded-lg bg-base-200 text-base-content/70">
                                <HiShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-base-content truncate" title={data?.trafficRule.description}>
                                    {data?.trafficRule.description}
                                </h3>
                                <p className="text-sm text-base-content/60">Traffic Rule</p>
                                <div className="mt-1 min-h-6">
                                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                                        <span className="badge badge-ghost badge-sm gap-1">
                                            <HiCpuChip className="w-3.5 h-3.5" />
                                            {data?.matchingAppIds?.length || 0}
                                        </span>
                                        <span className="badge badge-ghost badge-sm gap-1">
                                            <HiDevicePhoneMobile className="w-3.5 h-3.5" />
                                            {data?.matchingTargetDevices?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={enabled}
                                className={`toggle toggle-sm ${enabled ? 'toggle-success' : 'toggle-error'}`}
                                onClick={onToggle}
                                data-unifiruleid={data.trafficRule.unifiId}
                                data-dbtrafficruleid={data.trafficRule.id}
                                onChange={() => {}}
                                title={enabled ? 'Disable this rule' : 'Enable this rule'}
                            />
                            <span className="text-sm text-base-content/70" title={enabled ? 'This rule is currently enabled' : 'This rule is currently disabled'}>
                                {enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <RuleBonusTimeButton
                                trafficRuleId={data?.trafficRule.id}
                                bonusTimeActive={bonusTimeActive}
                                onStateChange={onStateChange}
                            />
                            <RuleScheduleButton
                                trafficRuleId={data?.trafficRule.id}
                                scheduleData={data?.trafficRule}
                                onStateChange={onStateChange}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => setExpanded(prev => !prev)}
                                aria-label="Expand rule details"
                            >
                                {expanded ? 'Less' : 'More'}
                            </button>
                            <button
                                className="btn btn-ghost btn-xs text-base-content/50 hover:text-error"
                                onClick={onDelete}
                                data-trafficid={data?.trafficRule.unifiId}
                                data-trafficruleid={data?.trafficRule.id}
                                title="Delete Rule"
                            >
                                <HiTrash className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expanded detail section */}
                {expanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-base-300 bg-base-200/50 flex flex-col gap-4">
                        {data?.matchingAppIds?.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Apps</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.matchingAppIds.map((appId) => (
                                        <span key={appId?.app_name} className="badge badge-primary badge-sm">{appId?.app_name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {data?.matchingTargetDevices?.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Devices</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.matchingTargetDevices.map((device) => (
                                        <span key={device.client_mac} className="badge badge-accent badge-sm">{device.client_mac}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 pt-1">
                            <button
                                className={`btn btn-sm flex-1 gap-1 ${loadingUnmanageApp ? 'btn-disabled' : 'btn-outline'}`}
                                onClick={onUnmanage}
                                data-trafficruleid={data?.trafficRule.id}
                                disabled={loadingUnmanageApp}
                            >
                                {loadingUnmanageApp
                                    ? <span className="loading loading-spinner loading-xs"></span>
                                    : 'Unmanage'
                                }
                            </button>
                            <button
                                className="btn btn-error btn-outline btn-sm gap-1 flex-1"
                                onClick={onDelete}
                                data-trafficid={data?.trafficRule.unifiId}
                                data-trafficruleid={data?.trafficRule.id}
                            >
                                <HiTrash className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </li>
    );
}