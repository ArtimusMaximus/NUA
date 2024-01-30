import { useRef, useState } from "react";
import { IoEllipseOutline } from "react-icons/io5";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiMiniPencilSquare } from "react-icons/hi2";

const device = {
    name: '',
    macAddress: '',
    active: false,
    url: '',
    id: '',
};

export default function Devices({ data, toggleReRender, handleRenderToggle })
{
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const editRef = useRef();
    const [updatedDeviceData, setUpdatedDeviceData] = useState(null);

    // const handleSchedule = device => {
    //     navigate(`/admin/${device}`)
    // }

    const handleToggle = async e => { // toggle device blocked or unblocked
        setLoading(true)
        try {
            // const itemId = e.target.dataset.name;
            const dataToUpdate = data?.macData?.filter((data) => data?.id === parseInt(e.target.dataset.name));
            // const dataToUpdate = data?.macData?.find((data) => data.id === itemId)
            console.log(dataToUpdate);

            // dataToUpdate[0]?.active === true ? dataToUpdate[0].active = false : dataToUpdate[0].active = true
            console.log('dataToUpdate[0]: ', dataToUpdate[0]);

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
                    handleRenderToggle()
                    // console.log(dataToUpdate[0]);
                }

        } catch (error) {
            console.log(error);
            setLoading(false);
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
    const handleClose = () => { editRef.current.close(); }
    const handleEditInput = e => {
        setUpdatedDeviceData({
            ...updatedDeviceData,
            [e.target.name]: e.target.value
        });
        console.log(updatedDeviceData);
    }
    const handleSaveEdits = () => {
        setLoading(true)
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
                }
            } catch (error) {
                setLoading(false);
                console.error(error);
            }
        }
        updateEdits();
    }
    const deleteCustomRule = () => {
        const _id = '65b4863e38fb85531f2e55f8'
        const fetchStuff = async () => {
            const response = await fetch('/deletecustomapi', {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ _id })
            })
            if (response.ok) {
                console.log(response);
            }
        }
        fetchStuff();
    }
    const handleDragStart = e => {
        const deviceOrderId = e.currentTarget.getAttribute('data-devid');
        e.dataTransfer.setData('text/plain', deviceOrderId);
    }
    const handleDragOver = e => {
        e.preventDefault();

    }
    const handleDrop = async e => {
        e.preventDefault();
        const draggedDeviceId = e.dataTransfer.getData("text/plain");
        const targetDeviceId = e.currentTarget.getAttribute("data-devid");
        const newData = [...data?.macData];
        let draggedDeviceIndex = newData.findIndex(device => device?.id === parseInt(draggedDeviceId));
        let targetDeviceIndex = newData.findIndex(device => device?.id === parseInt(targetDeviceId));

        if (draggedDeviceIndex !== -1 && targetDeviceIndex !== -1) {
            const temp = newData[draggedDeviceIndex].order
            newData[draggedDeviceIndex].order = newData[targetDeviceIndex].order
            newData[targetDeviceIndex].order = temp

            // const temp2 = newData[draggedDeviceIndex]
            // newData[draggedDeviceIndex] = newData[targetDeviceIndex]
            // newData[targetDeviceIndex] = temp2

        }
        newData.sort((a,b) => parseInt(a.order) - parseInt(b.order))
        try {
            const updateOrder = await fetch('/updatedeviceorder', {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ newData })
            });
            if (updateOrder.ok) {
                handleRenderToggle();
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            <div className="flex items-center justify-center w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-xl font-bold">Toggle</div>
                            <div className="text-xl font-bold">Device</div>
                        </div>
                        <div className="divider mt-2 mb-2"></div>
                        <ul className="flex flex-col w-full">
                            {
                                data?.macData?.sort((a, b) => parseInt(a?.order) - parseInt(b?.order)).map((device, index) => {
                                    return (
                                        <>
                                            <li key={device?.id} className="m-1" >
                                                <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div onClick={e => handleToggle(e)} className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <IoEllipseOutline
                                                                data-name={`${device?.id}`}
                                                                className={`${device?.active ? 'text-green-500' : 'text-red-500'} animate-pulse w-8 h-8 z-40`}
                                                                />
                                                            {device?.name}

                                                            <div
                                                                draggable={true}
                                                                data-orderid={`${index+1}`}
                                                                data-devid={device?.id}
                                                                onDragStart={handleDragStart}
                                                                onDragOver={handleDragOver}
                                                                onDrop={handleDrop}
                                                                className="rotate-90 z-50">
                                                                |||
                                                            </div>
                                                        </div>

                                                    </div>
                                                    <div className="collapse-content">
                                                            <div className="flex justify-between flex-wrap">
                                                                <p><span className="font-thin italic">Name:</span> {device?.name}</p>
                                                                <p><span className="font-thin italic">Mac:</span> {device?.macAddress}</p>
                                                                <p><span className="font-thin italic">Status:</span> <span className={`${device?.active ? 'text-green-500' : 'text-red-500'}`}>{device?.active ? 'Allowed' : 'Blocked'}</span></p>
                                                                <span className="flex items-center justify-center"
                                                                    onClick={openEditDialog}
                                                                    data-id={device?.id}
                                                                >
                                                                    <HiMiniPencilSquare
                                                                        className="w-6 h-6 pointer-events-none"
                                                                    />
                                                                </span>
                                                            </div>
                                                        <div>
                                                            <Link to={`/admin/${device?.id}/cronmanager`} className="w-fit hover:cursor-pointer" >
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
                <div className="btn btn-circle" onClick={deleteCustomRule}>delete custom api</div>
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
                            />
                            <div className="flex flex-row justify-evenly mt-4">
                                <button className={`btn btn-large ${loading ? 'disabled' : ''}`} onClick={handleSaveEdits}>{loading ? <span className="loading loading-spinner w-3 h-4"></span> : 'Save'}</button>
                                <button className={`btn btn-large ${loading ? 'disabled' : ''}`} onClick={handleClose}>{loading ? <span className="loading loading-spinner w-3 h-4">loading loading-spinner</span> : 'Close'}</button>
                            </div>
                        </label>
                    </div>
                </div>
            </dialog>
        </>
    )
}