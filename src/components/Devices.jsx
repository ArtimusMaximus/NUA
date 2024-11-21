import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiMiniPencilSquare } from "react-icons/hi2";
import DeviceSkeleton from "./skeletons/DevicesSkeleton";
import LoadingDialog from "./utility_components/LoadingDialog";
import BonusTimeButton from "./utility_components/BonusTimeButton";
import DisplayBonusTimer from "./utility_components/DisplayBonusTimer";



export default function Devices({ data, toggleReRender, handleRenderToggle, loadingMacData })
{
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const editRef = useRef();
    const [updatedDeviceData, setUpdatedDeviceData] = useState(null);
    const [toggleIsLoading, setToggleIsLoading] = useState(false);
    const [timerCancelled, setTimerCancelled] = useState(false);
    const toggleLoadingDialogRef = useRef();
    const newDeviceNameRef = useRef();
    const newMacAddressRef = useRef();

    // const handleSchedule = device => {
    //     navigate(`/admin/${device}`)
    // }
    function timerHandler(cancelled) {
        setTimerCancelled(cancelled); // passed to CancelBonusTimeButton
    }

    function handleToggleIsLoading() {
        if (toggleIsLoading) {
            toggleLoadingDialogRef.current.showModal();
        } else if (!toggleIsLoading) {
            toggleLoadingDialogRef.current.close();
        }
    }
    const delay = t => new Promise(res => setTimeout(res, t));

    useEffect(() => {
      console.log('useEffect in devices fired...')
      console.log("Data from devices upon hopeful re-render:\t", data)
    }, [toggleReRender])


    const handleToggle = async e => { // toggle device blocked or unblocked
        try {
            setLoading(true);
            setToggleIsLoading(true);
            toggleLoadingDialogRef.current.showModal();

            // const itemId = e.target.dataset.name;
            const dataToUpdate = data?.macData?.filter((data) => data?.id === parseInt(e.target.dataset.name));
            // const dataToUpdate = data?.macData?.find((data) => data.id === itemId)
            // console.log(dataToUpdate);

            // dataToUpdate[0]?.active === true ? dataToUpdate[0].active = false : dataToUpdate[0].active = true
            // console.log('dataToUpdate[0]: ', dataToUpdate[0]);

                const updateToggle = await fetch(`/updatemacaddressstatus`, {
                    method: "PUT",
                    mode: "cors",
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify(dataToUpdate[0])
                });

                if (updateToggle.ok) {
                    const updatedData = await updateToggle.json();
                    console.log('Updated data: ', updatedData);
                    setLoading(false);
                    timerHandler(true);
                    handleRenderToggle(); // test without

                    delay(2000).then(() => {
                        setToggleIsLoading(false);
                        toggleLoadingDialogRef.current.close();
                    });

                    // console.log(dataToUpdate[0]);
                }

            } catch (error) {
                console.log(error);
                setLoading(false);

                delay(2000).then(() => {
                    setToggleIsLoading(false);
                    toggleLoadingDialogRef.current.close();
                });
        }
    }
    const handleUnBlockAll = async () => {
        try {
            const blockAll = await fetch('unblockallmacs', {
                method: "PUT",
                mode: 'cors',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (blockAll.ok) {
                const updatedData = await blockAll.json();
                console.log('All Devices Blocked: ', updatedData);
                handleRenderToggle();
            }
        } catch (error) {
            if (error) throw error;
        }
    }
    const handleBlockAll = async () => {
        try {
            const blockAll = await fetch('blockallmacs', {
                method: "PUT",
                mode: 'cors',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (blockAll.ok) {
                const updatedData = await blockAll.json();
                console.log('All Devices Blocked: ', updatedData);
                handleRenderToggle();
            }
        } catch (error) {
            if (error) throw error;
        }
    }
    const handleDelete = async e => {
        try {
            const submitForDeletion = await fetch('/removedevice', { // end point not yet defined 12/11
                method: "delete",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ id: e.target.dataset.deviceid })
            });
            if(submitForDeletion.ok) {
                const confirmation = await submitForDeletion.json();
                console.log(confirmation);
                handleRenderToggle();
            }
        } catch (error) {
            if (error) throw error;
        }
    }
    const openEditDialog = e => {
        editRef.current.showModal();
        const selectedDevice = data?.macData?.filter(device => device.id === parseInt(e.target.dataset.id));
        setUpdatedDeviceData({
            ...selectedDevice,
            id: e.target.dataset.id
        });
    }
    const handleClose = () => {
        editRef.current.close();
        newDeviceNameRef.current.value = '';
        newMacAddressRef.current.value = '';
    }
    const handleEditInput = e => {
        setUpdatedDeviceData({
            ...updatedDeviceData,
            [e.target.name]: e.target.value
        });
        // console.log(updatedDeviceData);
    }
    const handleSaveEdits = () => {
        setLoading(true);
        const updateEdits = async () => {
            try {
                const updates = await fetch('/updatedevicedata', {
                    method: 'PUT',
                    mode: 'cors',
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify(updatedDeviceData)
                });
                if (updates.ok) {
                    const response = updates.json();
                    console.log(response);
                    setLoading(false);
                    handleRenderToggle();
                    editRef.current.close();
                    newDeviceNameRef.current.value = '';
                    newMacAddressRef.current.value = '';
                }
            } catch (error) {
                setLoading(false);
                console.error(error);
            }
        }
        updateEdits();
    }


    return (
        <>
            <div className="flex items-center justify-center w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-between">
                            <div className="px-4 text-xl font-bold">Toggle</div>
                            <div className="px-12 text-xl font-bold">Device</div>
                        </div>
                        <div className="divider mt-2 mb-2"></div>
                        <ul className="flex flex-col w-full mb-2">
                            {
                                // !loadingMacData ? data?.macData?.map((device) => {
                                data?.macData?.map((device) => {
                                    return (
                                        <>
                                            <li key={device?.id} className="m-1">
                                                <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <input
                                                                type="checkbox"
                                                                className="toggle toggle-success z-40"
                                                                onClick={handleToggle}
                                                                checked={device?.active}
                                                                data-name={device?.id}
                                                            />
                                                            {device?.name === "" ? device?.macAddress : device?.name}
                                                        </div>
                                                    </div>
                                                    <div className="collapse-content">
                                                            <div className="flex justify-between flex-wrap">
                                                                <p><span className="font-bold italic">Name:</span> {device?.name}</p>
                                                                <p><span className="font-bold italic">Mac:</span> {device?.macAddress}</p>
                                                                <p><span className="font-bold italic">Status:</span> <span className={`${device?.active ? 'text-green-500' : 'text-red-500'}`}>{device?.active ? 'Allowed' : 'Blocked'}</span></p>
                                                                <span className="flex items-center justify-center"
                                                                    onClick={openEditDialog}
                                                                    data-id={device?.id}
                                                                >
                                                                    <HiMiniPencilSquare
                                                                        className="w-6 h-6 pointer-events-none"
                                                                    />
                                                                </span>
                                                            </div>
                                                        <div className="mt-2">
                                                            <BonusTimeButton
                                                                deviceId={device?.id}
                                                                timerCancelled={timerCancelled}
                                                                timerHandler={timerHandler}
                                                                handleRenderToggle={handleRenderToggle}

                                                            />
                                                        </div>
                                                        <div>
                                                            <Link to={`/admin/${device?.id}/scheduler`} className="w-fit hover:cursor-pointer" >
                                                                <div className="btn btn-block bg-base-300 hover:bg-base-content hover:text-base-100 my-2">Schedule</div>
                                                            </Link>
                                                        </div>
                                                        <div
                                                            className="btn btn-error btn-block"
                                                            onClick={e => handleDelete(e)}
                                                            data-deviceid={device?.id}
                                                        >Delete
                                                        </div>
                                                    </div>
                                                </div>

                                            </li>
                                        </>
                                    );
                            })
                            }
                        </ul>
                    </div>
                </div>
            </div>
            <div className="flex flex-row gap-6 flex-wrap mx-auto">
                <div className="btn" onClick={handleUnBlockAll}>Unblock All</div>
                <div className="btn" onClick={handleBlockAll}>Block All</div>
                {/* <div className="btn btn-circle" onClick={deleteCustomRule}>delete custom api</div> */}
            </div>
            <div className="flex flex-row flex-wrap mx-auto pt-4">
                <Link to="/alldevices"><div className="btn px-10">Add Device</div></Link>
            </div>
            <dialog id="my_modal_1" ref={editRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-2xl">Edit</h3>
                    <div className="modal-action flex items-center justify-center m-0 p-0">
                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text italic">New Device Name:</span>
                            </div>
                            <input
                                type="text"
                                name="name"
                                placeholder="Device Name"
                                className="input input-bordered w-full max-w-xs"
                                onChange={handleEditInput}
                                ref={newDeviceNameRef}
                            />
                            <div className="label">
                                <span className="label-text italic">New Mac Address:</span>
                            </div>
                            <input
                                type="text"
                                name="macAddress"
                                placeholder="Mac Address"
                                className="input input-bordered w-full max-w-xs"
                                onChange={handleEditInput}
                                ref={newMacAddressRef}
                            />
                            <div className="flex flex-row justify-evenly mt-4">
                                <button className={`btn btn-large ${loading ? 'disabled' : ''}`} onClick={handleSaveEdits}>{loading ? <span className="loading loading-spinner w-3 h-4"></span> : 'Save'}</button>
                                <button className={`btn btn-large ${loading ? 'disabled' : ''}`} onClick={handleClose}>{loading ? <span className="loading loading-spinner w-3 h-4">loading loading-spinner</span> : 'Close'}</button>
                            </div>
                        </label>
                    </div>
                </div>
            </dialog>

            <LoadingDialog toggleLoadingDialogRef={toggleLoadingDialogRef} />
        </>
    )
}