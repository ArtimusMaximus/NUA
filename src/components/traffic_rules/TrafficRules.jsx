import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoryDeviceObject, appDeviceObject } from "../see_all_apps/app_objects";



export default function TrafficRules()
{
    const [customAPIRules, setCustomAPIRules] = useState([]);
    const [render, setRender] = useState(false);

    const reRender = () => {
        setRender(prev => !prev);
    }

    useEffect(() => { // fetch customAPI rules
        const fetchCustomAPIRules = async () => {
            try {
                const getCustomRules = await fetch('/getcustomapirules');
                if (getCustomRules.ok) {
                    const customRulesJSON = await getCustomRules.json();
                    console.log(customRulesJSON);
                    setCustomAPIRules(customRulesJSON);
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchCustomAPIRules();
    }, []);

    useEffect(() => { // refresh after re-render
        const fetchCustomAPIRules = async () => {
            try {
                const getCustomRules = await fetch('/getcustomapirules');
                if (getCustomRules.ok) {
                    const customRulesJSON = await getCustomRules.json();
                    console.log(customRulesJSON);
                    setCustomAPIRules(customRulesJSON);
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchCustomAPIRules();
    }, [render]);

    const handleDeleteTrafficRule = async e => {
        const _id = e.target.dataset.trafficid;
        try {
            const deleteTrafficRule = await fetch('/deletecustomapi', {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ _id })
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



    return (
        <>
            <div className="flex items-center justify-center flex-col w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-xl font-bold">Toggle</div>
                            <div className="text-xl font-bold">Description</div>
                        </div>
                        <div className="divider mt-2 mb-2"></div>
                        <ul className="flex flex-col w-full justify-around">
                            {
                                customAPIRules?.map((data) => {
                                    return (
                                        <>
                                            <li key={data._id}>
                                            <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div onClick={() => console.log('clicked')} className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <input type="checkbox" className="toggle toggle-success z-30" />
                                                            {data?.description}
                                                        </div>
                                                    </div>
                                                    <div className="collapse-content">
                                                            <div className="flex justify-between flex-wrap">
                                                                <p><span className="font-thin italic">Apps:</span> {data?.name}</p>
                                                                <p><span className="font-thin italic">Devices:</span> {data?.macAddress}</p>
                                                            </div>
                                                        <div>
                                                            <Link to={`/`} className="w-fit hover:cursor-pointer" >
                                                                <div className="btn btn-block btn-disabled bg-base-300 hover:bg-base-content hover:text-base-100 my-2 disabled">Schedule</div>
                                                            </Link>
                                                        </div>
                                                        <div
                                                            className="btn btn-error btn-block" aria-disabled
                                                            onClick={handleDeleteTrafficRule}
                                                            data-trafficid={data?._id}
                                                        >Delete
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
                    <Link to="/seeallapps"><div className="btn">Manage New App</div></Link>
                </div>
            </div>


        </>
    )
}