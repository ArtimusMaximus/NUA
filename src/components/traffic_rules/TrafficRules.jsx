import { Link } from "react-router-dom";




export default function TrafficRules()
{
    const dummyData = [
        {description: 'Billys youtube', devices: [
            { name: 'Xubuntu', macAddress: 'xgsd:Gv:dafd:'},
            { name: 'Xubuntu', macAddress: 'xgsd:Gv:dafd:'}
        ], id: '1'},
        {description: 'Johnny Tik Tok', devices: [{ name: 'Xubuntu', macAddress: 'xgsd:Gv:dafd:'}], id: '2'}
    ];



    return (
        <>
            <div className="flex items-center justify-center flex-col w-full h-full sm:w-3/4 lg:w-1/2 mx-auto pb-12">
                <div className="flex w-full mx-2">
                    <div className="flex flex-col items-center justify-center w-full h-full mx-auto border rounded-lg shadow overflow-hidden border-neutral shadow-base-300 m-8">
                        <div className="flex w-full mt-2 justify-around">
                            <div className="text-xl font-bold">Toggle</div>
                            <div className="text-xl font-bold">Description</div>
                        </div>
                        <div className="divider mt-2 mb-2"></div>
                        <ul className="flex flex-col w-full justify-around">
                            {
                                dummyData.map((data) => {
                                    return (
                                        <>
                                            <li key={data.id}>
                                            <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div onClick={() => console.log('clicked')} className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <input type="checkbox" className="toggle toggle-success z-30" />
                                                            {data?.description}
                                                        </div>
                                                    </div>
                                                    <div className="collapse-content">
                                                            <div className="flex justify-between flex-wrap">
                                                                <p><span className="font-thin italic">Apps:</span> {data?.name}</p>
                                                                <p><span className="font-thin italic">Devices:</span> {data?.macAddress}</p>
                                                            </div>
                                                        <div>
                                                            <Link to={`/`} className="w-fit hover:cursor-pointer" >
                                                                <div className="btn btn-block btn-disabled bg-base-300 hover:bg-base-content hover:text-base-100 my-2 disabled">Schedule</div>
                                                            </Link>
                                                        </div>
                                                        <div
                                                            className="btn btn-error btn-block btn-disabled" aria-disabled
                                                            onClick={(e) => console.log(e)}
                                                            data-dataid={data?.id}
                                                        >Delete
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </>
                                    )
                                })
                            }

                            {/* {
                                data?.macData?.sort((a, b) => parseInt(a?.order) - parseInt(b?.order)).map((device, index) => {
                                    return (
                                        <>
                                            <li key={device?.id} className="m-1" >
                                                <div className="collapse bg-base-200">
                                                <input type="checkbox" />
                                                    <div className="collapse-title text-xl font-medium">
                                                        <div onClick={e => handleToggle(e)} className="w-full flex flex-row items-center justify-between hover:cursor-pointer z-40">
                                                            <IoEllipseOutline
                                                                data-name={`${device?.id}`}
                                                                className={`${device?.active ? 'text-green-500' : 'text-red-500'} animate-pulse w-8 h-8 z-40`}
                                                                />
                                                            {device?.name}
                                                            <div
                                                                draggable={true}
                                                                data-orderid={`${index+1}`}
                                                                data-devid={device?.id}
                                                                onDragStart={handleDragStart}
                                                                onDragOver={handleDragOver}
                                                                onDrop={handleDrop}
                                                                className="rotate-90 z-50 hover:cursor-grab">
                                                                |||
                                                            </div>
                                                        </div>

                                                    </div>
                                                    <div className="collapse-content">
                                                            <div className="flex justify-between flex-wrap">
                                                                <p><span className="font-thin italic">Name:</span> {device?.name}</p>
                                                                <p><span className="font-thin italic">Mac:</span> {device?.macAddress}</p>
                                                                <p><span className="font-thin italic">Status:</span> <span className={`${device?.active ? 'text-green-500' : 'text-red-500'}`}>{device?.active ? 'Allowed' : 'Blocked'}</span></p>
                                                                <span className="flex items-center justify-center"
                                                                    onClick={openEditDialog}
                                                                    data-id={device?.id}
                                                                >
                                                                    <HiMiniPencilSquare
                                                                        className="w-6 h-6 pointer-events-none"
                                                                    />
                                                                </span>
                                                            </div>
                                                        <div>
                                                            <Link to={`/admin/${device?.id}/cronmanager`} className="w-fit hover:cursor-pointer" >
                                                                <div className="btn btn-block bg-base-300 hover:bg-base-content hover:text-base-100 my-2">Schedule</div>

                                                            </Link>
                                                        </div>
                                                        <div
                                                            className="btn btn-error btn-block"
                                                            onClick={e => handleDelete(e)}
                                                            data-deviceid={device?.id}
                                                        >Delete
                                                        </div>
                                                    </div>
                                                </div>

                                            </li>
                                        </>
                                    );
                                })
                            } */}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-row gap-6 flex-wrap mx-auto">
                    <Link to="/seeallapps"><div className="btn">Manage New App</div></Link>
                </div>
            </div>


        </>
    )
}