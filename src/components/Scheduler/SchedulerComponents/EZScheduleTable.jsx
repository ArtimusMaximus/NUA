import { DisplayOneTimeOrRecurringSchedule } from "./DisplayOneTimeOrRecurringSchedule";
import { GoTrash } from "react-icons/go";
import { TbRepeat, TbRepeatOff } from "react-icons/tb";

export function EZScheduleTable({ returnData, handleDeleteEZSched, handleEZToggle, submitButtonRef }) {
    return (
        <table className="table table-zebra border rounded-lg shadow overflow-hidden dark:border-gray-700 dark:shadow-gray-900 mb-8">
            <thead>
                <tr className="font-bold sm:text-xl" align="center">
                    <th>Time</th>
                    <th>Action</th>
                    <th>Off/On</th>
                    <th>Delete</th>
                </tr>
            </thead>
            <tbody>
                    {
                        returnData.ezScheduleData.length ? returnData?.ezScheduleData?.map((ezData) => {
                            return (
                                <>
                                    <tr key={ezData.id} align="center">
                                        <td className="uppercase w-1/4 text-xs sm:text-sm"><DisplayOneTimeOrRecurringSchedule oneTime={ezData.oneTime} ezData={ezData} /></td>
                                        <td className={`uppercase ${ezData.blockAllow === 'block' ? 'text-red-500' : 'text-green-500'}`}>
                                            {ezData.blockAllow}
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-success"
                                                data-id={ezData?.id}
                                                data-deviceid={ezData?.deviceId}
                                                data-jobname={ezData?.jobName}
                                                data-date={ezData?.date}
                                                data-hour={ezData?.hour}
                                                data-minute={ezData?.minute}
                                                data-ampm={ezData?.ampm}
                                                data-blockallow={ezData?.blockAllow}
                                                data-onetime={ezData?.oneTime}
                                                data-days={ezData?.days}
                                                checked={ezData?.toggleSched}
                                                // data-macaddress={ezData?.macAddress}
                                                onClick={e => handleEZToggle(e)}
                                            />
                                        </td>
                                        <td className="w-3 h-3">
                                            <div
                                                // className="bg-red-500 hover:bg-red-200 btn btn-circle animate-pulse"
                                                className="w-fit hover:cursor-pointer"
                                                onClick={e => handleDeleteEZSched(e)}
                                                data-id={ezData?.id}
                                                data-jobname={ezData?.jobName}
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
// const { date, hour, minute, ampm, oneTime, deviceId, scheduletype } = data;

// const id = parseInt(e.target.dataset.ezSchedId);
// const deviceId = parseInt(e.target.dataset.deviceid);
// const jobName = e.target.dataset.jobname;
// const date = e.target.dataset.date;
// const scheduletype = e.target.dataset.blockallow;
// const oneTime = e.target.dataset.onetime;
// const ampm = e.target.dataset.ampm;
// const hour = e.target.dataset.hour;
// const minute = e.target.dataset.minute;
// const days = e.target.dataset.days;
// const toggleSched = e.target.checked;
