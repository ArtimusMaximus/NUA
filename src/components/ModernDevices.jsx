import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModernDeviceGrid from "./modern_devices/ModernDeviceGrid";
import LoadingDialog from "./utility_components/LoadingDialog";
import DeviceGroupManager from "./DeviceGroupManager";
import SchedulerModal from "./Scheduler/SchedulerModal.jsx";

export default function ModernDevices({ macData, blockedUsers, handleRenderToggle, loadingMacData }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const editRef = useRef();
    const [updatedDeviceData, setUpdatedDeviceData] = useState(null);
    const [toggleIsLoading, setToggleIsLoading] = useState(false);
    const [timerCancelled, setTimerCancelled] = useState(false);
    
    // Scheduler modal state
    const [schedulerOpen, setSchedulerOpen] = useState(false);
    const [selectedDeviceForScheduler, setSelectedDeviceForScheduler] = useState(null);
    
    const toggleLoadingDialogRef = useRef();
    const deleteConfirmRef = useRef();
    const newDeviceNameRef = useRef();
    const newMacAddressRef = useRef();
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    function timerHandler(cancelled) {
        setTimerCancelled(cancelled);
    }

    function handleToggleIsLoading() {
        if (toggleIsLoading) {
            toggleLoadingDialogRef.current.showModal();
        } else if (!toggleIsLoading) {
            toggleLoadingDialogRef.current.close();
        }
    }

    const delay = t => new Promise(res => setTimeout(res, t));

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    useEffect(() => {
        console.log('useEffect in modern devices fired...');
        console.log("Data from modern devices upon hopeful re-render:\t", macData);
    }, [macData]);

    const openSchedulerModal = (deviceId, deviceName) => {
        setSelectedDeviceForScheduler({ id: deviceId, name: deviceName });
        setSchedulerOpen(true);
    };

    const handleToggle = async (deviceId) => {
        try {
            setLoading(true);
            setToggleIsLoading(true);
            toggleLoadingDialogRef.current.showModal();
            
            const dataToUpdate = macData?.filter((data) => data?.id === parseInt(deviceId));
            
            const updateToggle = await fetch(`/updatemacaddressstatus`, {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToUpdate[0])
            });

            const result = await updateToggle.json();
            
            if (updateToggle.ok && result.success) {
                console.log('Toggle successful:', result);
                setLoading(false);
                handleRenderToggle();

                delay(2000).then(() => {
                    setToggleIsLoading(false);
                    toggleLoadingDialogRef.current.close();
                });
            } else {
                console.error('Toggle failed:', result.error || result.message);
                setLoading(false);
                showToast(`Operation failed: ${result.error || result.message || 'Unknown error'}`);
                
                delay(2000).then(() => {
                    setToggleIsLoading(false);
                    toggleLoadingDialogRef.current.close();
                });
            }
        } catch (error) {
            console.error('Toggle network error:', error);
            setLoading(false);
            showToast('Network error occurred. Please check your connection and try again.');

            delay(2000).then(() => {
                setToggleIsLoading(false);
                toggleLoadingDialogRef.current.close();
            });
        }
    };

    const handleUnBlockAll = async () => {
        try {
            const data = { macData, blockedUsers };
            const blockAll = await fetch('unblockallmacs', {
                method: "PUT",
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (blockAll.ok) {
                const updatedData = await blockAll.json();
                console.log('All Devices Unblocked: ', updatedData);
                handleRenderToggle();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBlockAll = async () => {
        try {
            const data = { macData, blockedUsers };
            const blockAll = await fetch('blockallmacs', {
                method: "PUT",
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (blockAll.ok) {
                const updatedData = await blockAll.json();
                console.log('All Devices Blocked response: ', updatedData);
                handleRenderToggle();
            }
        } catch (error) {
            console.error('Error blocking all devices:', error);
        }
    };

    const handleDelete = (deviceId) => {
        setPendingDeleteId(deviceId);
        deleteConfirmRef.current.showModal();
    };

    const handleConfirmDelete = async () => {
        deleteConfirmRef.current.close();
        if (!pendingDeleteId) return;
        const deviceId = pendingDeleteId;
        setPendingDeleteId(null);
        try {
            const submitForDeletion = await fetch('/removedevice', {
                method: "delete",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: deviceId })
            });
            if (submitForDeletion.ok) {
                const confirmation = await submitForDeletion.json();
                console.log(confirmation);
                handleRenderToggle();
            }
        } catch (error) {
            console.error('Error deleting device:', error);
        }
    };

    const openEditDialog = (deviceId) => {
        editRef.current.showModal();
        const selectedDevice = macData?.filter(device => device.id === parseInt(deviceId));
        setUpdatedDeviceData({
            ...selectedDevice[0],
            id: deviceId
        });
    };

    const handleClose = () => {
        editRef.current.close();
        newDeviceNameRef.current.value = '';
        newMacAddressRef.current.value = '';
    };

    const handleEditInput = e => {
        setUpdatedDeviceData({
            ...updatedDeviceData,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveEdits = () => {
        setLoading(true);
        const updateEdits = async () => {
            try {
                const updates = await fetch('/updatedevicedata', {
                    method: 'PUT',
                    mode: 'cors',
                    headers: {
                        "Content-Type": "application/json"
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
        };
        updateEdits();
    };

    return (
        <div className="space-y-6">
            {/* Tags Management */}
            <DeviceGroupManager 
                devices={macData} 
                onGroupsUpdate={handleRenderToggle}
            />
            
            {/* Device Grid */}
            <ModernDeviceGrid
                devices={macData}
                loading={loadingMacData}
                onToggle={handleToggle}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onScheduleClick={openSchedulerModal}
                timerCancelled={timerCancelled}
                timerHandler={timerHandler}
                handleRenderToggle={handleRenderToggle}
                onBlockAll={handleBlockAll}
                onUnblockAll={handleUnBlockAll}
            />

            {/* Edit Device Modal */}
            <dialog className="modal" ref={editRef}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Edit Device</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="label">
                                <span className="label-text">Device Name</span>
                            </label>
                            <input
                                ref={newDeviceNameRef}
                                type="text"
                                name="name"
                                placeholder="Enter device name"
                                className="input input-bordered w-full"
                                defaultValue={updatedDeviceData?.name || ''}
                                onChange={handleEditInput}
                            />
                        </div>
                        
                        <div>
                            <label className="label">
                                <span className="label-text">MAC Address</span>
                            </label>
                            <input
                                ref={newMacAddressRef}
                                type="text"
                                name="macAddress"
                                placeholder="Enter MAC address"
                                className="input input-bordered w-full"
                                defaultValue={updatedDeviceData?.macAddress || ''}
                                onChange={handleEditInput}
                            />
                        </div>
                    </div>

                    <div className="modal-action">
                        <button 
                            className="btn btn-ghost" 
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleSaveEdits}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleClose}>close</button>
                </form>
            </dialog>

            <LoadingDialog toggleLoadingDialogRef={toggleLoadingDialogRef} />

            {/* Delete Confirmation Modal */}
            <dialog className="modal" ref={deleteConfirmRef}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Delete Device</h3>
                    <p className="py-4">Are you sure you want to delete this device? This action cannot be undone.</p>
                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={() => deleteConfirmRef.current.close()}>Cancel</button>
                        <button className="btn btn-error" onClick={handleConfirmDelete}>Delete</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>

            {/* Scheduler Modal */}
            <SchedulerModal 
                deviceId={selectedDeviceForScheduler?.id}
                deviceName={selectedDeviceForScheduler?.name}
                isOpen={schedulerOpen}
                onClose={() => setSchedulerOpen(false)}
                triggerRender={handleRenderToggle}
            />

            {/* Error Toast */}
            {toastMessage && (
                <div className="toast toast-bottom toast-center z-50">
                    <div className="alert alert-error">
                        <span>{toastMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
}