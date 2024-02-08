import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoryDeviceObject, appDeviceObject } from "../see_all_apps/app_objects";



export default function TrafficRules()
{
    const [customAPIRules, setCustomAPIRules] = useState([]);
    const [unifiRuleObject, setUnifiRuleObject] = useState([]);
    const [render, setRender] = useState(false);

    const reRender = () => {
        setRender(prev => !prev);
    }
    const handleToggle = async e => {
        const checked = e.target.checked;
        console.log('checked \t', checked);
        const _id = e.target.dataset.unifiruleid;
        const findUnifiObj = unifiRuleObject.filter(rule => rule._id === _id).pop();
        const unifiObjCopy = JSON.parse(JSON.stringify(findUnifiObj));
        unifiObjCopy.enabled = checked;

        const trafficRuleId = e.target.dataset.dbtrafficruleid;
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
        const _id = e.target.dataset.trafficid;
        const trafficRuleId = e.target.dataset.trafficruleid;
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

        console.log('touchableIds \t', touchableIds);
        try {
            const deleteManyTestIds = await fetch('/deletetestids', {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({ touchableIds })
            });
            if (deleteManyTestIds.ok) {
                const { successArray } = await deleteManyTestIds.json();
                console.log('successArray: \t', successArray);
                console.log('successArray.length: \t', successArray.length);
            }
        } catch (error) {
            console.error(error);
        }
    }


    useEffect(() => { // refresh after re-render && initial?
        const fetchCustomAPIRules = async () => {
            try {
                const getCustomRules = await fetch('/getdbcustomapirules');
                if (getCustomRules.ok) {
                    const { trafficRuleDbData, unifiData } = await getCustomRules.json();
                    console.log('trafficRuleDbData rerender: \t', trafficRuleDbData);
                    setCustomAPIRules(trafficRuleDbData);
                    console.log('unifiData rerender: \t', unifiData);
                    setUnifiRuleObject(unifiData);
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchCustomAPIRules();
    }, [render]);

    // useEffect(() => { // fetch DB customAPI rules && unifi rules // necessary?
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


    return (
        <>
            <div className="flex items-center justify-center flex-col w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                <div className="btn" onClick={handleDeleteTestIds}>Delete Test Ids</div>
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-xl font-bold">Toggle</div>
                            <div className="text-xl font-bold">Description</div>
                        </div>
                        <div className="divider mt-2 mb-2"></div>
                        <ul className="flex flex-col w-full justify-around gap-2">
                            {
                                customAPIRules?.map((data) => {
                                    return (
                                        <>
                                            <li key={data?.trafficRule.unifiId}>
                                            <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <input
                                                                type="checkbox"
                                                                checked={data?.trafficRule.enabled}
                                                                className="toggle toggle-success z-30"
                                                                onClick={handleToggle}
                                                                data-unifiruleid={data.trafficRule.unifiId}
                                                                data-dbtrafficruleid={data.trafficRule.id}
                                                            />
                                                            {data?.trafficRule.description}
                                                        </div>
                                                    </div>
                                                    <div className="collapse-content">
                                                                <h1 className="font-bold italic">Managing Apps:</h1>
                                                            <div className="flex gap-4 flex-wrap items-center justify-center mt-2">
                                                                {data?.matchingAppIds.map((appId) => {
                                                                    return (
                                                                        <>
                                                                            <span className="badge badge-primary">{appId?.app_name}</span>
                                                                        </>
                                                                    )
                                                                })}
                                                                {/* <p><span className="font-thin italic">Apps:</span> {data?.name}</p> */}
                                                                {/* <p><span className="font-thin italic">Devices:</span> {data?.macAddress}</p> */}
                                                            </div>
                                                        <div>
                                                            <Link to={`/`} className="w-fit hover:cursor-pointer" >
                                                                <div className="btn btn-block btn-disabled bg-base-300 hover:bg-base-content hover:text-base-100 my-2 disabled">Schedule</div>
                                                            </Link>
                                                        </div>
                                                        <div
                                                            className="btn btn-error btn-block" aria-disabled
                                                            onClick={handleDeleteTrafficRule}
                                                            data-trafficid={data?.trafficRule.unifiId}
                                                            data-trafficruleid={data?.trafficRule.id}
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