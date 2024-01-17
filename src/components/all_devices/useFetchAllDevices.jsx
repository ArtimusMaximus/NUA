import { useState, useEffect } from 'react';


export default function useFetchAllDevices()
{
    const [clientDevices, setClientDevices] = useState([]);
    const [deviceList, setDeviceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reRender, setReRender] = useState(false);

    function reFetch() {
        setReRender(prev => !prev);
    }
    function checkIfDeviceOnList(allDevicesArray, devicesOnListArray) { // this adds the id field
        for (const blockedDevice of allDevicesArray) {
            const onListDevice = devicesOnListArray.find(
                (onListDevice) => onListDevice.macAddress === blockedDevice.mac
            );
            if (onListDevice) {
                blockedDevice.onList = true;
                blockedDevice.prismaDeviceId = onListDevice.id;
            } else {
                blockedDevice.onList = false;
                blockedDevice.prismaDeviceId = null;
            }
        }
        console.log('allDevicesArray ', allDevicesArray);
        return allDevicesArray;
    }

    useEffect(() => {
        const fetchBlocked = async () => {

            try {
                const response = await fetch('/getalldevices');
                if (!response.ok) {
                    throw new Error('Fetching all blocked devices Failed!');
                }
                const clientDev = await response.json();
                console.log('clientDevices: ', clientDev);
                setClientDevices(
                    checkIfDeviceOnList(clientDev.getClientDevices, clientDev.getDeviceList)
                );
                // setClientDevices(clientDev.getClientDevices)
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        }
        fetchBlocked();
    }, [reRender])




    return { clientDevices, deviceList, loading, reFetch };
}