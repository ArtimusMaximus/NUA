import { Link, redirect, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";


export default function Settings()
{
    const params = useParams();
    const idLocation = params.id;
    const [deviceInfo, setDeviceInfo] = useState([]);
    const [allDeviceInfo, setAllDeviceInfo] = useState([]);
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(2);
    const dialogRef = useRef();


    const handleDelete = async () => {
        console.log(deviceInfo);
        try {
            const submitForDeletion = await fetch('/removedevice', { // end point not yet defined 12/11
                method: "delete",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify(deviceInfo)
            });
            if(submitForDeletion.ok) {
                const confirmation = await submitForDeletion.json();
                console.log(confirmation);
                dialogRef.current.showModal()
                handleTimer();
            }
        } catch (error) {
            if (error) throw error;
        }
    }

    useEffect(() => {
        const getDeviceInformation = async () => {
            try {
                const response = await fetch(`/getdeviceinfo`, {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify({ id: params.id})
                })
                // end point not yet defined 12/11
                if (response.ok) {
                    const fetchedDeviceInfo = await response.json();
                    // console.log(response.json());
                    console.log(fetchedDeviceInfo);
                    // const filt = fetchedDeviceInfo.getDeviceInfo.filter((data) => {
                    //     return data.id === parseInt(idLocation)
                    // });

                    // const filt2 = fetchedDeviceInfo.matchedObjects.filter((addy) => {
                    //     return addy.mac === filt[0]?.macAddress
                    // });
                    // // filt.pop();
                    // console.log('filt: ', filt);
                    // console.log('filt2: ', filt2);
                    // setDeviceInfo([...filt]);
                    // setAllDeviceInfo([...filt2])
                    // setDeviceInfo(fetchedDeviceInfo)
                    // setDeviceInfo(response)
                    setDeviceInfo(fetchedDeviceInfo)
                    setAllDeviceInfo(fetchedDeviceInfo)
                }
                // }
            } catch (error) {
                if (error) throw error;
            }
        }
        getDeviceInformation();

    }, [idLocation])

    useEffect(() => {
        // dialogRef.current.showModal()
    }, [deviceInfo, countdown])

    function SettingsData({ data, allDeviceData })
    {
        return (
            <>
                <div className="flex items-center justify-center w-full h-full mx-auto pb-12 pt-12">
                    <div className="flex w-full mx-2">
                        <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                            <div className="flex mt-8">
                                <div className="text-xl font-bold">Device Settings</div>
                            </div>
                            <div className="divider"></div>
                            <div className="flex items-center justify-center flex-col">
                            {!data && <span className="loading loading-spinner w-24 h-24"></span>}
                            {data && <ul className="flex flex-col w-full">
                                        <li className="p-2 bg-base-100">Name: {data?.name}</li>
                                        <li className="p-2 bg-base-300">Mac Address: {data?.macAddress}</li>
                                        <li className={`p-2 bg-base-100`}>Status: <span className={`${data?.active ? 'text-green-500' : 'text-red-500'}`}>{data.active ? 'Active' : 'Disabled'}</span></li>
                                        <li className="p-2 bg-base-300">ID: {data?.id}</li>
                                    <li>
                                        <Link to={`/admin/${idLocation}/cronmanager`} className="w-fit hover:cursor-pointer" >
                                            <div className="btn btn-block">Schedule</div>
                                            {/* <IoAlarmOutline className="hover:text-warning h-12 w-12" /> */}
                                        </Link>
                                    </li>
                                    <li className="">
                                        {/* <a className="w-fit hover:cursor-pointer" > */}
                                            {/* <RiDeleteBin6Line className="hover:text-error h-12 w-12" /> */}
                                            <div className="btn btn-error btn-block" onClick={handleDelete}>Delete</div>
                                        {/* </a> */}
                                    </li>
                                </ul>}
                                <details className="collapse bg-base-200 hover:bg-base-300">
                                    <summary className="collapse-title text-xl font-medium">All Device Information<div className="absolute right-5 top-4">&#9660;</div></summary>
                                    <ul className="p-6 gap-4">
                                        {/* {
                                            allDeviceData?.length ? allDeviceData?.map((allData, index) => {
                                                return (
                                                    <>
                                                        <li key={index}>oui: {allData.oui}</li>
                                                        <li key={index}>_id: {allData._id}</li>
                                                        <li key={index}>ap_mac: {allData.ap_mac}</li>
                                                        <li key={index}>UpTime: {allData.uptime}</li>
                                                    </>
                                                )
                                            }) : <ul>No data to display...</ul>
                                        } */}
                                    </ul>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const handleTimer = async () => {
        const timer = t => new Promise(res => setTimeout(res, t));
        try {
            await timer(1000)
                setCountdown(1)
            await timer(1000)
               setCountdown(0)
               navigate('/')
        } catch (e) {
            if (e) throw e;
        }
    }

    return (
        <>
            <div>
                {/* <div className="m-8 flex flex-row items-center justify-center gap-6">
                    <p className="font-semibold italic text-xl">Return to Admin Page</p>
                    <span>
                        <Link to="/"><IoReturnUpBackSharp className="w-24 h-24 text-slate-500 hover:text-info hover:cursor-pointer" /></Link>
                    </span>
                </div> */}
               {/* <ReturnToPage title={"Return to Admin Page"} link={"/"} /> */}
               <SettingsData data={deviceInfo} allDeviceData={allDeviceInfo} />
            </div>

            <dialog id="redirectModal" className="modal" ref={dialogRef}>
                <div className="modal-box flex flex-col items-center justify-center">
                    <h3 className="font-bold text-lg">Redirecting In:</h3>
                    <p className="py-4 text-4xl italic font-bold">{countdown}</p>
                </div>
            </dialog>
        </>
    )
}