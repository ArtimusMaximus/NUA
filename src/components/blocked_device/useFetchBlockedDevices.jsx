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
    function checkIfDeviceOnList(blockedDeviceArray, devicesOnListArray) {
        return blockedDeviceArray.map((blockedDevice) => {
            const onListDevice = devicesOnListArray.find(
                (deviceOnList) => deviceOnList.macAddress === blockedDevice.mac
            );

            return {
                ...blockedDevice,
                onList: Boolean(onListDevice),
                prismaDeviceId: onListDevice?.id ?? null
            };
        });
    }

    useEffect(() => {
        let isActive = true;
        const controller = new AbortController();

        const fetchBlocked = async () => {

            try {
                const response = await fetch('/getallblockeddevices', {
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error('Fetching all blocked devices Failed!');
                }
                const allBlockedDevices = await response.json();

                if (!isActive) return;

                setBlockedDevices(
                    checkIfDeviceOnList(
                        allBlockedDevices.blockedUsers || [],
                        allBlockedDevices.deviceList || []
                    )
                );
                setDeviceList(allBlockedDevices.deviceList || []);
                setLoading(false);
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }
                console.error(error);
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        fetchBlocked();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [reRender])




    return { blockedDevices, deviceList, loading, reFetch };
}