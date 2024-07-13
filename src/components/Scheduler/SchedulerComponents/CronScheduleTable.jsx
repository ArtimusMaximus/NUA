import { GoTrash } from "react-icons/go";

export function CronScheduleTable({ returnData, handleDeleteCron, handleCronToggle, submitButtonRef }) {
    return (
        <table className="table table-zebra border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900 mb-8">
            <tbody>
                <tr className="font-bold sm:text-xl" align="center">
                    <td>Cron</td>
                    <td>Action</td>
                    <td>Off/On</td>
                    <td>Delete</td>
                </tr>
                    {
                        returnData.cronData.length ? returnData?.cronData?.map((cronData) => {
                            return (
                                <>
                                    <tr key={cronData.id} align="center">
                                        <td className="uppercase">{cronData.crontime}</td>
                                        <td className={`uppercase ${cronData.crontype === 'block' ? 'text-red-500' : 'text-green-500'}`}>
                                            {cronData.crontype}
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-success"
                                                data-crontimeid={cronData?.id}
                                                data-deviceid={cronData?.deviceId}
                                                data-jobname={cronData?.jobName}
                                                data-crontime={cronData?.crontime}
                                                data-crontype={cronData?.crontype}
                                                checked={cronData?.toggleCron}
                                                // data-macaddress={cronData?.macAddress}
                                                onClick={e => handleCronToggle(e)}
                                            />
                                        </td>
                                        <td className="w-3 h-3">
                                            <div
                                                // className="bg-red-500 hover:bg-red-200 btn btn-circle animate-pulse"
                                                className="w-fit hover:cursor-pointer"
                                                onClick={e => handleDeleteCron(e)}
                                                data-id={cronData?.id}
                                                data-jobname={cronData?.jobName}
                                            >
                                            <GoTrash
                                                className="flex items-center justify-center z-10 w-6 h-6 pointer-events-none"
                                                ref={submitButtonRef}
                                            />
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            )
                        }) : <></>
                    }
            </tbody>
        </table>
    );
}