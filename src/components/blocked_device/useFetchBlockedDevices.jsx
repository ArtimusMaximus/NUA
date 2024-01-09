import { useState, useEffect } from 'react';


export default function useFetchBlockedDevices()
{
    const [blockedDevices, setBlockedDevices] = useState([]);
    const [deviceList, setDeviceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reRender, setReRender] = useState(false);

    function reFetch() {
        setReRender(prev => !prev);
    }
    // function checkIfDeviceOnList(blockedDeviceArray, devicesOnListArray) {
    //     const result = blockedDeviceArray.map((device) => {
    //         const isOnList = devicesOnListArray.some(
    //             (onListDevice) => onListDevice.macAddress === device.mac
    //         )
    //         return { ...device, onList: isOnList }
    //     });
    //     console.log('result! ', result);
    //     return result;
    // }
    function checkIfDeviceOnList(blockedDeviceArray, devicesOnListArray) { // this adds the id field
        for (const blockedDevice of blockedDeviceArray) {
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
        console.log('blockedDeviceArray ', blockedDeviceArray);
        return blockedDeviceArray;
    }

    useEffect(() => {
        const fetchBlocked = async () => {

            try {
                const response = await fetch('/getallblockeddevices');
                if (!response.ok) {
                    throw new Error('Fetching all blocked devices Failed!');
                }
                const allBlockedDevices = await response.json();
                setBlockedDevices(
                    checkIfDeviceOnList(allBlockedDevices.blockedUsers, allBlockedDevices.deviceList)
                );
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        }
        fetchBlocked();
    }, [reRender])




    return { blockedDevices, deviceList, loading, reFetch };
}