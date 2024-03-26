import { useState, useEffect } from "react";

export function useGetAllDevices() {
    const [existingDeviceList, setExistingDeviceList] = useState([]);
    const [allClientDeviceList, setAllClientDeviceList] = useState([]);

    useEffect(() => {
        const getAllDevices = async () => {
            try {
                const getDevicesFromDB = await fetch('/getalldevices');
                if (getDevicesFromDB.ok) {
                    const { getDeviceList, getClientDevices } = await getDevicesFromDB.json();
                    setExistingDeviceList([...getDeviceList]);
                    setAllClientDeviceList([...getClientDevices])
                }
            } catch (error) {
                console.error(error);
            }
        }
        getAllDevices();
    }, [])

    return { existingDeviceList, allClientDeviceList };
}