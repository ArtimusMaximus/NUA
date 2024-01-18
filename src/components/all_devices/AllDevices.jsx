import { useState, useEffect, useRef } from "react";
import DeviceCardSkeleton from "../device_card_skeleton/DeviceCardSkeleton";
import AllDevicesCard from "./AllDevicesCard";
import useFetchAllDevices from "./useFetchAllDevices";
import { IoMdRefresh } from "react-icons/io";


export default function AllDevices()
{
const { clientDevices, deviceList, loading, reFetch } = useFetchAllDevices();

const selectRef = useRef();
const [filteredArray, setFilteredArray] = useState(clientDevices);
const [filter, setFilter] = useState('all');

const handleRefresh = () => {
    selectRef.current.selected = true;
    setFilter('all')
}
const handleAddToDevices = async (deviceToAdd) => {
    // console.log(deviceToAdd.mac); // works
    try {
        const response = await fetch('/addtodevicelist', {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(deviceToAdd)
        });
        if (response.ok) {
            const returnData = await response.json();
            console.log('return data from blocked devices', returnData);
            reFetch();
        }
    } catch (error) {
        console.error(error);
    }
}
const handleUnblock = async (deviceToUnblock) => {
    try {
        const unblock = await fetch('/unblockmac', {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(deviceToUnblock)
        });
        if (unblock.ok) {
            reFetch();
        }
    } catch (error) {
        console.error(error);
    }
}
const handleSelect = e => {
    selectRef.current.selected = false;
    setFilter(e.target.value);
}



useEffect(() => {
    const filterCriteria = (criteria) => {
        switch (criteria) {
            case 'all':
                console.log('All devices in switch statement');
                setFilteredArray(clientDevices);
                break;
            case 'Blocked Devices':
                console.log('Blocked devices in switch statement');
                setFilteredArray(() => clientDevices.filter((device) => device.blocked === true));
                break;
            case 'Offline Devices':
                console.log('Offline devices in switch statement');
                setFilteredArray(() => clientDevices.filter((device) => device.blocked === true));
                break;
            case 'Online Devices':
                console.log('Online Devices in switch statement');
                setFilteredArray(() => clientDevices.filter((device) => device.blocked === false));
                break;
            case 'Devices on NUA List':
                console.log('Devices on List in switch statement');
                setFilteredArray(deviceList)
                break;
            case 'Wired Devices':
                console.log('Wired Devices in switch statement');
                setFilteredArray(() => clientDevices.filter((device) => device.is_wired === true));
                break;
            case 'Wireless Devices':
                console.log('Wireless Devices in switch statement');
                setFilteredArray(() => clientDevices.filter((device) => device.is_wired === false));
                break;
            default:
                setFilteredArray(clientDevices);
                break;
        }
    }
    filterCriteria(filter);
}, [filter, clientDevices]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-8 pb-24">
            <h1 className="my-6 text-3xl italic mx-auto row-start-1 col-span-full text-center">{filter === 'all' ? 'All Client Devices' : filter} ({filteredArray.length}<span className="font-thin italic text-lg ml-1">items<span className="text-3xl italic">)</span></span></h1>



            <div className="flex flex-row row-start-2 gap-2 col-span-full mx-auto">
                <select className="select select-bordered w-full max-w-xs">
                    <option disabled ref={selectRef} selected value={'all'}>Filter Selection</option>
                    <option onClick={handleSelect} value={'Blocked Devices'}>Blocked Devices</option>
                    <option onClick={handleSelect} value={'Offline Devices'}>Offline Devices</option>
                    <option onClick={handleSelect} value={'Online Devices'}>Online Devices</option>
                    <option onClick={handleSelect} value={'Devices on NUA List'}>Devices on NUA List</option>
                    <option onClick={handleSelect} value={'Wired Devices'}>Wired Devices</option>
                    <option onClick={handleSelect} value={'Wireless Devices'}>Wireless Devices</option>
                </select>
                <div className="btn btn-circle" onClick={handleRefresh}><IoMdRefresh className="w-4 h-4 pointer-events-none" /></div>

            </div>



            {
                loading ? <DeviceCardSkeleton devices={filteredArray} loading={loading} />
                : filteredArray?.map((device) => {
                    return (
                        <>
                            <div className="flex items-center justify-center">
                                <AllDevicesCard
                                    key={device?.mac}
                                    props={device}
                                    handleAddToDevices={handleAddToDevices}
                                    handleUnblock={handleUnblock}
                                />
                            </div>
                        </>
                    )
                })
            }
            </div>
        </>
    );
}