import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoMdRefresh } from "react-icons/io";
import {
    HiShieldCheck,
    HiMagnifyingGlass,
    HiArrowRight,
    HiArrowLeft,
    HiXMark,
    HiCheck,
} from "react-icons/hi2";
import {
    allAppsList,
    keys,
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
    Fake_Testing_Category,
} from "../../traffic_rule_apps/unifi_match_list";
import {
    categoryDeviceObject,
    dbCategoryDeviceObject,
    appDeviceObject,
    appDbDeviceObject,
} from "../see_all_apps/app_objects";

const feedback = {
    message:
        "If you are having trouble creating a traffic rule for a specific app or category check the support section of the readme.md on the NUA github page.",
    url: "https://github.com/ArtimusMaximus/NUA/blob/master/README.md",
};

const allApps = allAppsList.map((cat) => cat.apps).flat();

export default function CreateRuleModal({ dialogRef, onSuccess }) {
    const [step, setStep] = useState(1);

    // Step 1 — app/category selection
    const [filteredArray, setFilteredArray] = useState([]);
    const [searchableCopy, setSearchableCopy] = useState([]);
    const [filter, setFilter] = useState("");
    const [checked, setChecked] = useState({});
    const [appSelection, setAppSelection] = useState([]);
    const [categoryName, setCategoryName] = useState("All");
    const [catId, setCatId] = useState(255);
    const [catNameId, setCatNameId] = useState([]);

    // Step 2 — rule configuration
    const [description, setDescription] = useState("");
    const [deviceSelection, setDeviceSelection] = useState([]);
    const [devices, setDevices] = useState([]);
    const [blockAllow, setBlockAllow] = useState("");
    const [loading, setLoading] = useState(false);
    const [unifiSubmissionError, setUnifiSubmissionError] = useState({});
    const [submissionError, setSubmissionError] = useState({});

    const selectCatRef = useRef();
    const searchRef = useRef();
    const descriptionRef = useRef();
    const unifiErrorDialogRef = useRef();
    const errorDialogRef = useRef();

    // ─── Reset ────────────────────────────────────────────────────────────────

    const resetAll = () => {
        setStep(1);
        setFilteredArray(allApps);
        setSearchableCopy(allApps);
        setFilter("");
        setChecked({});
        setAppSelection([]);
        setCategoryName("All");
        setCatId(255);
        setCatNameId([]);
        setDescription("");
        setDeviceSelection([]);
        setBlockAllow("");
        setLoading(false);
        if (selectCatRef.current) selectCatRef.current.value = "default";
        if (searchRef.current) searchRef.current.value = "";
        if (descriptionRef.current) descriptionRef.current.value = "";
    };

    const handleClose = () => {
        dialogRef.current.close();
        resetAll();
    };

    // ─── Step 1 handlers ──────────────────────────────────────────────────────

    const handleCheckbox = (e, id) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
        if (e.target.checked) {
            setAppSelection((prev) => [
                ...prev,
                { name: e.target.dataset.name, id: parseInt(e.target.dataset.id) },
            ]);
        } else {
            setAppSelection((prev) =>
                prev.filter((a) => a.name !== e.target.dataset.name)
            );
        }
    };

    const handleSearchByText = (e) => {
        const val = e.target.value;
        if (val.length > 2) {
            setFilteredArray(
                searchableCopy.filter((a) =>
                    a.name.toLowerCase().includes(val.toLowerCase())
                )
            );
        } else {
            setFilteredArray([...searchableCopy]);
        }
    };

    const handleCategoryChange = (e) => {
        setFilter(e.target.value);
        // clear per-app selection when switching categories
        setChecked({});
        setAppSelection([]);
        if (searchRef.current) searchRef.current.value = "";
    };

    const handleReset = () => {
        setFilter("");
        setChecked({});
        setAppSelection([]);
        setCategoryName("All");
        setCatId(255);
        setCatNameId([]);
        if (selectCatRef.current) selectCatRef.current.value = "default";
        if (searchRef.current) searchRef.current.value = "";
    };

    // ─── Step 2 handlers ──────────────────────────────────────────────────────

    const handleSelectDevice = (e) => {
        if (e.target.checked) {
            const matched = devices.filter(
                (d) => d.id === parseInt(e.target.dataset.deviceid)
            );
            setDeviceSelection((prev) => [...new Set([...prev, ...matched])]);
        } else {
            setDeviceSelection((prev) =>
                prev.filter((d) => d.id !== parseInt(e.target.dataset.deviceid))
            );
        }
    };

    // ─── Submit helpers (same logic as SeeAllApps) ────────────────────────────

    const createCategoryObjectRule = (obj, devs, categoryId, desc, action) => {
        obj.target_devices.push(...devs.map((d) => ({ client_mac: d.macAddress, type: "CLIENT" })));
        obj.app_category_ids.push(categoryId);
        obj.description = desc;
        obj.action = action;
        return { ...obj };
    };

    const createDBCategoryObjectRule = (obj, devs, categoryId, catName, devSel, desc, action) => {
        obj.target_devices.push(...devs.map((d) => ({ client_mac: d.macAddress, type: "CLIENT" })));
        obj.app_category_ids.push({ categoryId, categoryName: catName });
        obj.devices.push(...devSel);
        obj.description = desc;
        obj.action = action;
        obj.devices.push(...devs);
        return { ...obj };
    };

    const createAppObjectRule = (obj, devs, appIds, desc, action) => {
        obj.target_devices.push(...devs.map((d) => ({ client_mac: d.macAddress, type: "CLIENT" })));
        obj.app_ids.push(...appIds.map((a) => a.id));
        obj.description = desc;
        obj.action = action;
        return { ...obj };
    };

    const createDbAppObject = (obj, devs, appIds, categoryIds, desc, action) => {
        obj.target_devices.push(...devs.map((d) => ({ client_mac: d.macAddress, type: "CLIENT" })));
        obj.app_ids.push(...appIds.map((a) => a.id));
        obj.appSelection.push(...appIds);
        obj.app_category_ids.push(...categoryIds);
        obj.description = desc;
        obj.action = action;
        obj.devices.push(...devs);
        return { ...obj };
    };

    const handleManageCategory = async () => {
        const unifiObj = JSON.parse(JSON.stringify(categoryDeviceObject));
        const dbObj = JSON.parse(JSON.stringify(dbCategoryDeviceObject));
        const categoryObject = createCategoryObjectRule(unifiObj, deviceSelection, catId, description, blockAllow);
        const dbCatObject = createDBCategoryObjectRule(dbObj, deviceSelection, catId, categoryName, deviceSelection, description, blockAllow);
        setLoading(true);
        try {
            const res = await fetch("/addcategorytrafficrule", {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryObject, dbCatObject }),
            });
            const result = await res.json();
            if (result.success) {
                setLoading(false);
                handleClose();
                onSuccess();
            } else if (result.error) {
                setLoading(false);
                const { error } = result;
                setUnifiSubmissionError({
                    code: error?.code,
                    details: error?.details?.id,
                    errorCode: error?.errorCode,
                    message: error?.message,
                    feedback: feedback.message,
                    url: feedback.url,
                });
                unifiErrorDialogRef.current.showModal();
            }
        } catch (error) {
            setLoading(false);
            setSubmissionError({ name: error?.name, message: error?.message });
            errorDialogRef.current.showModal();
        }
    };

    const handleManageApps = async () => {
        const appObj = JSON.parse(JSON.stringify(appDeviceObject));
        const appDbObj = JSON.parse(JSON.stringify(appDbDeviceObject));
        const appObject = createAppObjectRule(appObj, deviceSelection, appSelection, description, blockAllow);
        const appDbObject = createDbAppObject(appDbObj, deviceSelection, appSelection, catNameId, description, blockAllow);
        setLoading(true);
        try {
            const res = await fetch("/addappstrafficrule", {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appObject, appDbObject }),
            });
            const result = await res.json();
            if (result.success) {
                setLoading(false);
                handleClose();
                onSuccess();
            } else if (result.error) {
                setLoading(false);
                const { error } = result;
                setUnifiSubmissionError({
                    code: error?.code,
                    details: error?.details?.id,
                    errorCode: error?.errorCode,
                    message: error?.message,
                    feedback: feedback.message,
                    url: feedback.url,
                });
                unifiErrorDialogRef.current.showModal();
            }
        } catch (error) {
            setLoading(false);
            setSubmissionError({ name: error?.name, message: error?.message });
            errorDialogRef.current.showModal();
        }
    };

    // ─── Derived state ────────────────────────────────────────────────────────

    const canProceedToStep2 =
        appSelection.length > 0 ||
        (categoryName !== "" && categoryName !== "All" && categoryName !== "Fake_Testing_Category");

    const canSubmit =
        deviceSelection.length > 0 && description !== "" && blockAllow !== "" && !loading;

    // ─── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        const getDevices = async () => {
            try {
                const res = await fetch("/getcurrentdevices");
                if (res.ok) {
                    const data = await res.json();
                    setDevices(data.getDeviceList);
                }
            } catch (error) {
                console.error(error);
            }
        };
        getDevices();
        setFilteredArray(allApps);
        setSearchableCopy(allApps);
    }, []);

    useEffect(() => {
        const run = (criteria) => {
            switch (criteria) {
                case "Media Streaming":
                    setFilteredArray(mediaStreaming); setSearchableCopy(mediaStreaming);
                    setCategoryName("Media Streaming"); setCatId(4);
                    setCatNameId([{ app_cat_id: 4, app_cat_name: "Media Streaming" }]);
                    break;
                case "Social Networks":
                    setFilteredArray(socialNetworks); setSearchableCopy(socialNetworks);
                    setCategoryName("Social Networks"); setCatId(24);
                    setCatNameId([{ app_cat_id: 24, app_cat_name: "Social Networks" }]);
                    break;
                case "Online Games":
                    setFilteredArray(onlineGames); setSearchableCopy(onlineGames);
                    setCategoryName("Online Games"); setCatId(8);
                    setCatNameId([{ app_cat_id: 8, app_cat_name: "Online Games" }]);
                    break;
                case "Peer-to-Peer Networks":
                    setFilteredArray(peertopeerNetworks); setSearchableCopy(peertopeerNetworks);
                    setCategoryName("Peer-to-Peer Networks"); setCatId(1);
                    setCatNameId([{ app_cat_id: 1, app_cat_name: "Peer-to-Peer Networks" }]);
                    break;
                case "Email Messaging":
                    setFilteredArray(emailMessaging); setSearchableCopy(emailMessaging);
                    setCategoryName("Email Messaging"); setCatId(5);
                    setCatNameId([{ app_cat_id: 5, app_cat_name: "Email Messaging" }]);
                    break;
                case "Instant Messengers":
                    setFilteredArray(instantMessengers); setSearchableCopy(instantMessengers);
                    setCategoryName("Instant Messengers"); setCatId(0);
                    setCatNameId([{ app_cat_id: 0, app_cat_name: "Instant Messengers" }]);
                    break;
                case "Tunneling and Proxy":
                    setFilteredArray(tunnelingProxy); setSearchableCopy(tunnelingProxy);
                    setCategoryName("Tunneling and Proxy"); setCatId(11);
                    setCatNameId([{ app_cat_id: 11, app_cat_name: "Tunneling and Proxy" }]);
                    break;
                case "File Sharing":
                    setFilteredArray(fileSharing); setSearchableCopy(fileSharing);
                    setCategoryName("File Sharing"); setCatId(3);
                    setCatNameId([{ app_cat_id: 3, app_cat_name: "File Sharing" }]);
                    break;
                case "VoIP Services":
                    setFilteredArray(voip); setSearchableCopy(voip);
                    setCategoryName("VoIP Services"); setCatId(6);
                    setCatNameId([{ app_cat_id: 6, app_cat_name: "VoIP Services" }]);
                    break;
                case "Remote Access":
                    setFilteredArray(remoteAccess); setSearchableCopy(remoteAccess);
                    setCategoryName("Remote Access"); setCatId(10);
                    setCatNameId([{ app_cat_id: 10, app_cat_name: "Remote Access" }]);
                    break;
                case "Database Tools":
                    setFilteredArray(databaseTools); setSearchableCopy(databaseTools);
                    setCategoryName("Database Tools"); setCatId(7);
                    setCatNameId([{ app_cat_id: 7, app_cat_name: "Database Tools" }]);
                    break;
                case "Management Protocols":
                    setFilteredArray(managementProtocols); setSearchableCopy(managementProtocols);
                    setCategoryName("Management Protocols"); setCatId(9);
                    setCatNameId([{ app_cat_id: 9, app_cat_name: "Management Protocols" }]);
                    break;
                case "Investment Platforms":
                    setFilteredArray(investmentPlatforms); setSearchableCopy(investmentPlatforms);
                    setCategoryName("Investment Platforms"); setCatId(12);
                    setCatNameId([{ app_cat_id: 12, app_cat_name: "Investment Platforms" }]);
                    break;
                case "Web Services":
                    setFilteredArray(webServices); setSearchableCopy(webServices);
                    setCategoryName("Web Services"); setCatId(13);
                    setCatNameId([{ app_cat_id: 13, app_cat_name: "Web Services" }]);
                    break;
                case "Security Updates":
                    setFilteredArray(securityUpdates); setSearchableCopy(securityUpdates);
                    setCategoryName("Security Updates"); setCatId(14);
                    setCatNameId([{ app_cat_id: 14, app_cat_name: "Security Updates" }]);
                    break;
                case "Web IM":
                    setFilteredArray(webIM); setSearchableCopy(webIM);
                    setCategoryName("Web IM"); setCatId(15);
                    setCatNameId([{ app_cat_id: 15, app_cat_name: "Web IM" }]);
                    break;
                case "Business Tools":
                    setFilteredArray(businessTools); setSearchableCopy(businessTools);
                    setCategoryName("Business Tools"); setCatId(17);
                    setCatNameId([{ app_cat_id: 17, app_cat_name: "Business Tools" }]);
                    break;
                case "Network Protocols_18":
                    setFilteredArray(networkP18); setSearchableCopy(networkP18);
                    setCategoryName("Network Protocols_18"); setCatId(18);
                    setCatNameId([{ app_cat_id: 18, app_cat_name: "Network Protocols_18" }]);
                    break;
                case "Network Protocols_19":
                    setFilteredArray(networkp19); setSearchableCopy(networkp19);
                    setCategoryName("Network Protocols_19"); setCatId(19);
                    setCatNameId([{ app_cat_id: 19, app_cat_name: "Network Protocols_19" }]);
                    break;
                case "Network Protocols_20":
                    setFilteredArray(networkp20); setSearchableCopy(networkp20);
                    setCategoryName("Network Protocols_20"); setCatId(20);
                    setCatNameId([{ app_cat_id: 20, app_cat_name: "Network Protocols_20" }]);
                    break;
                case "Private Protocols":
                    setFilteredArray(privateProtocols); setSearchableCopy(privateProtocols);
                    setCategoryName("Private Protocols"); setCatId(23);
                    setCatNameId([{ app_cat_id: 23, app_cat_name: "Private Protocols" }]);
                    break;
                case "Unknown_255":
                    setFilteredArray(Unknown_255); setSearchableCopy(Unknown_255);
                    setCategoryName("Unknown_255"); setCatId(255);
                    setCatNameId([{ app_cat_id: 255, app_cat_name: "Unknown_255" }]);
                    break;
                case "Fake_Testing_Category":
                    setFilteredArray(Fake_Testing_Category); setSearchableCopy(Fake_Testing_Category);
                    setCategoryName("Fake_Testing_Category"); setCatId(27);
                    setCatNameId([{ app_cat_id: 27, app_cat_name: "Fake_Testing_Category" }]);
                    break;
                default:
                    setFilteredArray(allApps); setSearchableCopy(allApps);
                    setCategoryName("All"); setCatId(255);
                    setCatNameId([{ app_cat_id: 255, app_cat_name: "All" }]);
                    break;
            }
        };
        run(filter);
    }, [filter]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box max-w-5xl w-full h-[85vh] flex flex-col p-0 overflow-hidden">

                    {/* Fixed header */}
                    <div className="flex items-center px-6 pt-5 pb-4 border-b border-base-300 flex-shrink-0">
                        {/* Left: title */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <HiShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                            <h2 className="font-bold text-lg truncate">
                                {step === 1 ? "New Rule — Select Apps" : "New Rule — Configure"}
                            </h2>
                        </div>

                        {/* Center: step indicator */}
                        <div className="flex items-center gap-1.5 text-sm flex-shrink-0 px-4">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${step === 1 ? 'bg-primary text-primary-content' : 'bg-success text-success-content'}`}>
                                {step > 1 ? <HiCheck className="w-3.5 h-3.5" /> : '1'}
                            </span>
                            <div className="w-6 h-px bg-base-300" />
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${step === 2 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/40'}`}>
                                2
                            </span>
                        </div>

                        {/* Right: close */}
                        <div className="flex-1 flex justify-end min-w-0">
                            <button className="btn btn-ghost btn-sm btn-circle" onClick={handleClose} aria-label="Close">
                                <HiXMark className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto">

                        {/* ── Step 1: Select apps ── */}
                        {step === 1 && (
                            <div className="p-6 flex flex-col gap-4">

                                {/* Controls */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <select
                                        className="select select-bordered select-sm"
                                        ref={selectCatRef}
                                        defaultValue="default"
                                        onChange={handleCategoryChange}
                                    >
                                        <option disabled value="default">Select Category</option>
                                        {keys.map((k) => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                    <label className="input input-sm input-bordered flex items-center gap-2 flex-1 min-w-[160px]">
                                        <HiMagnifyingGlass className="w-4 h-4 text-base-content/40 flex-shrink-0" />
                                        <input
                                            type="text"
                                            className="grow bg-transparent outline-none"
                                            placeholder="Search apps…"
                                            ref={searchRef}
                                            onChange={handleSearchByText}
                                        />
                                    </label>
                                    <button
                                        className="btn btn-sm btn-ghost btn-circle"
                                        onClick={handleReset}
                                        title="Reset filters"
                                    >
                                        <IoMdRefresh className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Selected apps summary */}
                                {appSelection.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                        <span className="text-xs font-semibold text-primary mr-1 self-center">
                                            Selected:
                                        </span>
                                        {appSelection.map((a) => (
                                            <span key={a.id} className="badge badge-primary badge-sm">
                                                {a.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* App grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {filteredArray.map((app) => (
                                        <label
                                            key={app.id}
                                            className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors select-none ${
                                                checked[app.id]
                                                    ? "border-primary bg-primary/10"
                                                    : "border-base-300 bg-base-200 hover:border-primary/50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary checkbox-sm flex-shrink-0"
                                                checked={checked[app.id] || false}
                                                onChange={(e) => handleCheckbox(e, app.id)}
                                                data-id={app.id}
                                                data-name={app.name}
                                            />
                                            <span className="text-sm truncate">{app.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Configure rule ── */}
                        {step === 2 && (
                            <div className="p-6 flex flex-col gap-6 max-w-lg mx-auto w-full">

                                {/* Scope summary */}
                                <div className="rounded-xl border border-base-300 bg-base-200 p-4 flex flex-col gap-2">
                                    <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                                        Rule Scope
                                    </p>
                                    {appSelection.length ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {appSelection.map((a) => (
                                                <span key={a.id} className="badge badge-primary badge-sm">
                                                    {a.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-sm font-semibold text-primary">
                                            {categoryName} <span className="text-base-content/40 font-normal">(entire category)</span>
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold">Description</label>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="e.g. Block YouTube on Xbox"
                                        ref={descriptionRef}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Block / Allow */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold">Action</label>
                                    <div className="flex items-center gap-1 bg-base-200 rounded-xl p-1 shadow-inner w-fit">
                                        <button
                                            type="button"
                                            className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                                blockAllow === 'ALLOW'
                                                    ? 'bg-success text-success-content shadow-sm'
                                                    : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
                                            }`}
                                            onClick={() => setBlockAllow('ALLOW')}
                                        >
                                            <HiCheck className="w-4 h-4" />
                                            Allow
                                        </button>
                                        <button
                                            type="button"
                                            className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                                blockAllow === 'BLOCK'
                                                    ? 'bg-error text-error-content shadow-sm'
                                                    : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
                                            }`}
                                            onClick={() => setBlockAllow('BLOCK')}
                                        >
                                            <HiXMark className="w-4 h-4" />
                                            Block
                                        </button>
                                    </div>
                                </div>

                                {/* Devices */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold">Target Devices</label>
                                    {devices.length > 0 ? (
                                        <div className="flex flex-col gap-1.5">
                                            {devices.map((device) => {
                                                const isSelected = deviceSelection.some((d) => d.id === device.id);
                                                return (
                                                    <label
                                                        key={device.id}
                                                        className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                                                            isSelected
                                                                ? 'border-accent bg-accent/10'
                                                                : 'border-base-300 bg-base-200 hover:border-accent/50'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium">{device.name}</span>
                                                        <input
                                                            type="checkbox"
                                                            className={`toggle toggle-sm ${isSelected ? 'toggle-accent' : ''}`}
                                                            data-deviceid={device.id}
                                                            onChange={handleSelectDevice}
                                                            checked={isSelected}
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-base-content/40 italic p-3 border border-base-300 rounded-lg">
                                            No devices found. Add devices in the Devices tab first.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-base-300 flex-shrink-0">
                        {step === 1 ? (
                            <>
                                <button className="btn btn-ghost" onClick={handleClose}>
                                    Cancel
                                </button>
                                <div className="flex items-center gap-3">
                                    {appSelection.length > 0 ? (
                                        <span className="badge badge-primary badge-sm gap-1">
                                            {appSelection.length} app{appSelection.length !== 1 ? 's' : ''}
                                        </span>
                                    ) : canProceedToStep2 ? (
                                        <span className="badge badge-ghost badge-sm">{categoryName}</span>
                                    ) : (
                                        <span className="text-sm text-base-content/40">Select apps or a category</span>
                                    )}
                                    <button
                                        className="btn btn-primary gap-1"
                                        disabled={!canProceedToStep2}
                                        onClick={() => setStep(2)}
                                    >
                                        Next <HiArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-ghost gap-1" onClick={() => setStep(1)}>
                                    <HiArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <div className="flex items-center gap-3">
                                    {deviceSelection.length > 0 && (
                                        <span className="badge badge-accent badge-sm gap-1">
                                            {deviceSelection.length} device{deviceSelection.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <button
                                        className="btn btn-primary"
                                        disabled={!canSubmit}
                                        onClick={appSelection.length ? handleManageApps : handleManageCategory}
                                    >
                                        {loading ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : (
                                            'Create Rule'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Backdrop closes modal */}
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleClose}>close</button>
                </form>
            </dialog>

            {/* UniFi error dialog */}
            <dialog ref={unifiErrorDialogRef} className="modal">
                <div className="modal-box">
                    <div className="flex items-center gap-2 mb-4">
                        <HiXMark className="w-6 h-6 text-error" />
                        <h3 className="font-bold text-lg">UniFi Error</h3>
                    </div>
                    <div className="flex flex-col gap-2 text-sm bg-base-200 rounded-lg p-4">
                        <p className="flex justify-between"><span className="text-base-content/60">Response Code:</span> <span className="text-error font-medium">{unifiSubmissionError.code ?? 'none'}</span></p>
                        <p className="flex justify-between"><span className="text-base-content/60">Invalid App ID:</span> <span className="text-error font-medium">{unifiSubmissionError.details ?? 'none'}</span></p>
                        <p className="flex justify-between"><span className="text-base-content/60">HTTP Error Code:</span> <span className="text-error font-medium">{unifiSubmissionError.errorCode ?? 'none'}</span></p>
                        <p className="flex justify-between"><span className="text-base-content/60">Message:</span> <span className="text-error font-medium">{unifiSubmissionError.message ?? 'none'}</span></p>
                    </div>
                    <p className="text-xs text-base-content/50 italic mt-3">
                        {unifiSubmissionError.feedback}{' '}
                        <Link className="underline font-semibold text-primary" to={unifiSubmissionError.url} target="_blank">
                            Readme.md
                        </Link>
                    </p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-ghost">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* Frontend error dialog */}
            <dialog ref={errorDialogRef} className="modal">
                <div className="modal-box">
                    <div className="flex items-center gap-2 mb-4">
                        <HiXMark className="w-6 h-6 text-error" />
                        <h3 className="font-bold text-lg">Submission Error</h3>
                    </div>
                    <div className="flex flex-col gap-2 text-sm bg-base-200 rounded-lg p-4">
                        <p className="flex justify-between"><span className="text-base-content/60">Error Name:</span> <span className="text-error font-medium">{submissionError.name ?? 'none'}</span></p>
                        <p className="flex justify-between"><span className="text-base-content/60">Error Message:</span> <span className="text-error font-medium">{submissionError.message ?? 'none'}</span></p>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-ghost">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}
