import { IoCheckmarkSharp } from "react-icons/io5";


export default function BlockedDeviceCard({ props, handleAddToDevices, handleUnblock })
{
    return (
        <>
            <div className="card w-72 sm:w-96 bg-base-100 shadow-xl hover:bg-base-300">
                <div className="card-body">
                    <h2 className="card-title"><span className="italic font-thin">oui: </span>{props?.oui ? props?.oui : '"none"'}</h2>
                    <p><span className="italic font-thin">hostname: </span>{props?.hostname}</p>
                    <p><span className="italic font-thin">mac: </span>{props?.mac}</p>
                    <p><span className="italic font-thin">last ip: </span>{props?.last_ip}</p>
                    <p><span className="italic font-thin">is guest: </span>{props?.is_guest === true ? 'true' : 'false'}</p>
                    <p><span className="italic font-thin">is wired: </span>{props?.is_wired === true ? 'true' : 'false'}</p>
                    <p><span className="italic font-thin">_id: </span>{props?._id}</p>
                    <div className="card-actions justify-between pt-4">
                        <button
                            className="btn"
                            onClick={() => handleUnblock(props)}
                            >Unblock
                        </button>
                        <button
                            className={`btn ${props.onList ? 'btn-disabled' : ''}`}
                            data-macaddress={props.mac}
                            onClick={() => handleAddToDevices(props)}>
                                {props.onList ?
                                (
                                    <> On Device List <IoCheckmarkSharp /> </>
                                ) : ('Add to Devices')
                                }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}