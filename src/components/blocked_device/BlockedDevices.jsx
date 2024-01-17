import useFetchBlockedDevices from "./useFetchBlockedDevices";
import BlockedDeviceCard from "./BlockedDeviceCard";
import DeviceCardSkeleton from "../device_card_skeleton/DeviceCardSkeleton";



export default function BlockedDevices()
{
const { blockedDevices, loading, reFetch } = useFetchBlockedDevices();


const handleAddToDevices = async (deviceToAdd) => {
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

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-8 pb-24">
            <h1 className="my-6 text-3xl italic mx-auto row-start-1 col-span-full text-center">Currently Blocked Devices</h1>
            {
                loading ? <DeviceCardSkeleton devices={blockedDevices} loading={loading} />
                : blockedDevices?.map((device) => {
                    return (
                        <>
                        <div className="flex items-center justify-center">
                            <BlockedDeviceCard key={device.mac} props={device} handleAddToDevices={handleAddToDevices} handleUnblock={handleUnblock} />
                        </div>
                        </>
                    )
                })
                }
            </div>
        </>
    );
}