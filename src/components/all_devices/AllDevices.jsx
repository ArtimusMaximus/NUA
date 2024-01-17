import AllDevicesCard from "./AllDevicesCard";
import useFetchAllDevices from "./useFetchAllDevices";



export default function AllDevices()
{
const { clientDevices, loading, reFetch } = useFetchAllDevices();
const skeletons = () => {
    let arr=[];
    let length = 12;
    while(length > 0) {
        arr.push('NUA')
        length -= 1;
    }
    return arr;
}
const skelArray = skeletons();
console.log(skelArray);


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

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-8 pb-24">
            <h1 className="my-6 text-3xl italic mx-auto row-start-1 col-span-full text-center">All Client Devices</h1>
            {
                // loading ? <div className={`${loading ? 'loading loading-spinner' : ''} w-36 h-36 flex items-center justify-center col-span-full mx-auto text-4xl`}>{!clientDevices && !loading && 'There is not data to display...'}</div>
                loading ? skelArray.map((str, index) => {
                    return (
                        <>
                            <div className={`${loading ? 'skeleton w-96 h-96' : ''} grid-flow-row flex items-center justify-center mx-auto text-4xl`}>{!clientDevices && !loading && 'There is not data to display...'}<div className="flex flex-col items-center justify-center gap-2"><span className="loading loading-spinner w-12 h-12"></span>{str}</div></div>
                        </>
                    )
                })
                : clientDevices?.map((device) => {
                    return (
                        <>
                        <div className="flex items-center justify-center">
                            <AllDevicesCard key={device?.mac} props={device} handleAddToDevices={handleAddToDevices} handleUnblock={handleUnblock} />
                        </div>
                        </>
                    )
                })
                }
            </div>
        </>
    );
}