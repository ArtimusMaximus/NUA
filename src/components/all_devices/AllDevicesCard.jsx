import { useEffect, useRef, useState } from "react";
import { IoCheckmarkSharp } from "react-icons/io5";


export default function AllDevicesCard({ props, length, handleAddToDevices })
{
    const [nameInput, setNameInput] = useState("");
    const [submittedName, setSubmittedName] = useState("");
    const [modalIdState, setModalIdState] = useState("");

    const handleAddOuiName = e => {
        setNameInput(e.target.value);
    }
    const handleSaveName = e => {
        setSubmittedName(nameInput);
        const modalId = document.getElementById(modalIdState);
        const disableButton = document.querySelector(`[data-btnid="${e.target.dataset.savebtnid}"]`);
        disableButton.classList.add('btn-disabled');
        disableButton.innerHTML = "Saved for Device List!"
        modalId.close();
    }
    const handleCloseDialog = e => {
        const modalId = document.getElementById(modalIdState);
        modalId.close();
        // e.target.dataset.inputdata[e.target.id]
        // setSubmittedName("");
        // setNameInput("");
    }
    const handleOpenDialog = e => {
        setModalIdState(e.target.dataset.btnid)
        const modalId = document.getElementById(e.target.dataset.btnid);
        modalId.showModal();
    }
    useEffect(() => {
        // console.log('props \t', props);
    }, []);
    return (
        <>
            <div className={`card min-w-[375px] min-h-[384px] bg-base-100 mx-4 shadow-xl hover:bg-base-300`}>
                <div className="card-body">
                    <h2 className="card-title"><span className="italic font-thin">oui: </span>{props?.oui ? props?.oui : '"none"'}</h2>
                    <p><span className="italic font-thin">hostname: </span>{props?.hostname ? props?.hostname : '"none"'}</p>
                    <p><span className="italic font-thin">mac: </span>{props?.mac}</p>
                    <p><span className="italic font-thin">last ip: </span>{props?.last_ip}</p>
                    <p><span className="italic font-thin">is guest: </span>{props?.is_guest === true ? 'true' : 'false'}</p>
                    <p><span className="italic font-thin">is wired: </span>{props?.is_wired === true ? 'true' : 'false'}</p>
                    <div className="card-actions justify-between pt-4">
                        <button
                            className={`btn ${props.onList ? 'btn-disabled' : ''}`}
                            data-macaddress={props.mac}
                            onClick={() => handleAddToDevices(props, submittedName)}>
                                {props.onList ?
                                (
                                    <> On Device List <IoCheckmarkSharp /> </>
                                ) : ('Add to Devices')
                                }
                        </button>
                        <button
                            data-btnid={props?._id}
                            className={`${props.oui ? 'hidden' : 'btn'} ${props?.onList ? 'hidden' : ''}`}
                            onClick={e => handleOpenDialog(e)}>Add Name to Device List
                        </button>
                    </div>
                </div>
            </div>
            <dialog id={`${props?._id}`} className="modal">
                <div className="modal-box flex items-center justify-center flex-col gap-4">
                    <h3 className="font-bold text-lg">Enter Name for "Added Device List"</h3>
                    <input data-inputdata={props?._id} className="input input-bordered" onChange={handleAddOuiName} />
                    <div className="modal-action">
                        <button className="btn" data-savebtnid={props?._id} onClick={handleSaveName}>Save Name</button>
                        <button className="btn" onClick={handleCloseDialog}>Close</button>
                    </div>
                </div>
            </dialog>
        </>
    );
}