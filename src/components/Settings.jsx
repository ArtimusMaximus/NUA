import { Link, redirect, useNavigate, useParams } from "react-router-dom";
import { IoReturnUpBackSharp } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useEffect, useRef, useState } from "react";
import { IoAlarmOutline } from "react-icons/io5";
import ReturnToPage from "./ReturnToPage";

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
        console.log(deviceInfo[0]);
        try {
            const submitForDeletion = await fetch('/removedevice', { // end point not yet defined 12/11
                method: "delete",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify(deviceInfo[0])
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
                    method: "GET",
                    mode: "cors",
                })

                // end point not yet defined 12/11
                if (response.ok) {
                    const fetchedDeviceInfo = await response.json();
                    // console.log(response.json());
                    // console.log(fetchedDeviceInfo);
                    const filt = fetchedDeviceInfo.getDeviceInfo.filter((data) => {
                        return data.id === parseInt(idLocation)
                    });

                    const filt2 = fetchedDeviceInfo.matchedObjects.filter((addy) => {
                        return addy.mac === filt[0]?.macAddress
                    })


                    // filt.pop();
                    console.log('filt: ', filt);
                    console.log('filt2: ', filt2);
                    setDeviceInfo([...filt]);
                    setAllDeviceInfo([...filt2])
                    // setDeviceInfo(fetchedDeviceInfo)
                    // setDeviceInfo(response)

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

                <div className="flex flex-col items-center justify-center border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900">
                    <h1 className="text-2xl font-bold mt-5">Device Settings</h1>
                    <div className="divider"></div>
                    <div className="flex flex-col items-center p-12 mx-2 my-2">
                        <ul className="flex flex-col gap-6 text-xl my-4">
                            {
                                data.length ? data?.map((d, index) => {
                                    return (
                                        <>
                                            <li key={index} className="p-2 bg-base-100">Name: {d?.name}</li>
                                            <li key={index} className="p-2 bg-base-300">Mac Address: {d?.macAddress}</li>
                                            <li key={index} className={`p-2 bg-base-100`}>Status: <span className={`${d?.active ? 'text-green-500' : 'text-red-500'}`}>{d.active ? 'Active' : 'Disabled'}</span></li>
                                            <li key={index} className="p-2 bg-base-300">ID: {d?.id}</li>
                                        </>
                                    )
                                }) : <span className="loading loading-spinner w-24 h-24"></span>
                            }
                             <li>
                                <Link to={`/${idLocation}/cronmanager`} className="w-fit hover:cursor-pointer" >
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

                        </ul>
                        <details className="collapse bg-base-200 hover:bg-base-300">
                            <summary className="collapse-title text-xl font-medium">All Device Information<div className="absolute right-5 top-4">&#9660;</div></summary>
                            <ul className="p-6 gap-4">
                                {
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
                                }
                                {/* {
                                    allDeviceData?.length && Object.keys(allDeviceData).
                                } */}
                            </ul>
                        </details>
                    </div>
                </div>
            </>
        )
    }
    const timer = t => new Promise(res => setTimeout(res, t))

    const handleTimer = async () => {
        try {
            await timer(1000)
                setCountdown(1)

            await timer(1000)
               setCountdown(0)

            // await timer(1000)
            //    setCountdown(0)

               navigate('/')
        } catch (e) {
            if (e) throw e;
        }
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center w-full h-full">
                {/* <div className="m-8 flex flex-row items-center justify-center gap-6">
                    <p className="font-semibold italic text-xl">Return to Admin Page</p>
                    <span>
                        <Link to="/"><IoReturnUpBackSharp className="w-24 h-24 text-slate-500 hover:text-info hover:cursor-pointer" /></Link>
                    </span>
                </div> */}
               <ReturnToPage title={"Return to Admin Page"} link={"/"} />
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