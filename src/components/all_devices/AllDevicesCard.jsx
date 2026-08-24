import { useState } from "react";
import { HiCheck, HiWifi } from "react-icons/hi2";
import { HiOutlineDesktopComputer } from "react-icons/hi";

export default function AllDevicesCard({ props, length, handleAddToDevices })
{
    const [nameInput, setNameInput] = useState("");
    const [submittedName, setSubmittedName] = useState("");
    const [added, setAdded] = useState(false);

    const handleAddOuiName = e => {
        setNameInput(e.target.value);
    };
    const handleSaveName = e => {
        setSubmittedName(nameInput);
        document.getElementById(props?._id)?.close();
    };
    const handleCloseDialog = () => {
        document.getElementById(props?._id)?.close();
    };
    const handleAdd = () => {
        handleAddToDevices(props, submittedName);
        setAdded(true);
    };

    const wired = props?.is_wired === true;
    const online = props?.is_online;
    const onList = props.onList || added;

    return (
        <>
            <div className="bg-white dark:bg-base-200 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Card header */}
                <div className="p-4 pb-3">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-base-200 text-base-content/60">
                            {wired ? (
                                <HiOutlineDesktopComputer className="w-5 h-5" />
                            ) : (
                                <HiWifi className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-base-content truncate">
                                {props?.name || props?.hostname || 'Unknown Device'}
                            </h4>
                            <p className="text-xs text-base-content/50 truncate mt-0.5 font-mono">
                                {props?.mac}
                            </p>
                        </div>
                        {online !== undefined && (
                            <span className={`badge badge-sm flex-shrink-0 mt-1 ${online ? 'badge-success' : 'badge-ghost'}`}>
                                {online ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="px-4 pb-3 space-y-1 text-sm">
                    {props?.oui && (
                        <p className="flex justify-between gap-2">
                            <span className="text-base-content/50">Vendor</span>
                            <span className="text-base-content/80 truncate text-right max-w-[60%]">{props.oui}</span>
                        </p>
                    )}
                    {props?.hostname && props?.name && (
                        <p className="flex justify-between gap-2">
                            <span className="text-base-content/50">Hostname</span>
                            <span className="text-base-content/80 truncate text-right max-w-[60%]">{props.hostname}</span>
                        </p>
                    )}
                    {props?.note && (
                        <p className="flex justify-between gap-2">
                            <span className="text-base-content/50">Note</span>
                            <span className="text-base-content/80 truncate text-right max-w-[60%]">{props.note}</span>
                        </p>
                    )}
                    {props?.last_ip && (
                        <p className="flex justify-between gap-2">
                            <span className="text-base-content/50">Last IP</span>
                            <span className="text-base-content/80 font-mono text-xs text-right">{props.last_ip}</span>
                        </p>
                    )}
                </div>

                {/* Action */}
                <div className="px-4 pb-4 pt-1">
                    {onList ? (
                        <button className="btn btn-sm btn-ghost w-full gap-2 btn-disabled" disabled>
                            <HiCheck className="w-4 h-4 text-success" />
                            On Device List
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm btn-primary w-full gap-2"
                            onClick={handleAdd}
                        >
                            <HiCheck className="w-4 h-4" />
                            Add to Devices
                        </button>
                    )}
                </div>
            </div>

            {/* Name entry dialog — hidden by default */}
            <dialog id={`${props?._id}`} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Enter Name for Device</h3>
                    <input data-inputdata={props?._id} className="input input-bordered w-full" placeholder="Custom name..." onChange={handleAddOuiName} />
                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={handleCloseDialog}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSaveName}>Save Name</button>
                    </div>
                </div>
            </dialog>
        </>
    );
}