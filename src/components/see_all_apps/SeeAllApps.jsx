import { useEffect, useRef, useState } from "react";
import {
    allAppsList,
	mediaStreaming,
	socialNetworks,
	onlineGames,
	peertopeerNetworks,
	emailMessaging,
	instantMessengers,
	tunnelingProxy,
	fileSharing,
	voip,
	remoteAccess,
	databaseTools,
	managementProtocols,
	investmentPlatforms,
	webServices,
	securityUpdates,
	webIM,
	businessTools,
	networkP18,
	networkp19,
	networkp20,
	privateProtocols,
	Unknown_255,

} from "../../traffic_rule_apps/app_ids";
// import AppCard from "./app_card/AppCard";


export default function SeeAllApps()
{
    const keys = allAppsList.map(cat => cat.cat);
    const [filteredArray, setFilteredArray] = useState([]);
    const [searchableCopy, setSearchableCopy] = useState([]);
    const [filter, setFilter] = useState('');
    const [selection, setSelection] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const manageDialogRef = useRef();
    let selectionArray = [];




    const handleChange = e => {
        console.log(e.target.value);
        setFilter(e.target.value);
    }
    const handleSearchByText = e => {
        const searchedArray = filteredArray.filter(name => name.name.toLowerCase().includes(e.target.value.toLowerCase()));
        setFilteredArray(searchedArray)
        if (e.target.value.length <= 2) {
            setFilteredArray(searchableCopy)
        }
    }

    useEffect(() => {
        const filterCriteria = (criteria) => {
            switch (criteria) {
                case 'Media Streaming':
                    // console.log('All devices in switch statement');
                    setFilteredArray(mediaStreaming);
                    setSearchableCopy(mediaStreaming);
                    setCategoryName("mediastreaming")
                    break;
                case 'Social Networks':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(socialNetworks);
                    setSearchableCopy(socialNetworks);
                    setCategoryName("socialnetworks");
                    break;
                case 'Online Games':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(onlineGames);
                    setSearchableCopy(onlineGames);
                    setCategoryName("onlinegames");
                    break;
                case 'Peer-to-Peer Networks':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(peertopeerNetworks);
                    setSearchableCopy(peertopeerNetworks);
                    setCategoryName("peertopeernetworks");
                    break;
                case 'Email Messaging':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(emailMessaging);
                    setSearchableCopy(emailMessaging);
                    setCategoryName("emailmessaging");
                    break;
                case 'Instant Messengers':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(instantMessengers);
                    setSearchableCopy(instantMessengers);
                    setCategoryName("instantmessengers");
                    break;
                case 'Tunneling and Proxy':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(tunnelingProxy);
                    setSearchableCopy(tunnelingProxy);
                    setCategoryName("tunnelingandproxy");
                    break;
                case 'File Sharing':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(fileSharing);
                    setSearchableCopy(fileSharing);
                    setCategoryName("filesharing");
                    break;
                case 'VoIP Services':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(voip);
                    setSearchableCopy(voip);
                    setCategoryName("voipservices");
                    break;
                case 'Remote Access':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(remoteAccess);
                    setSearchableCopy(remoteAccess);
                    setCategoryName("remoteaccess");
                    break;
                case 'Database Tools':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(databaseTools);
                    setSearchableCopy(databaseTools);
                    setCategoryName("databasetools");
                    break;
                case 'Management Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(managementProtocols);
                    setSearchableCopy(managementProtocols)
                    setCategoryName("managementprotocols");
                    break;
                case 'Investment Platforms':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(investmentPlatforms);
                    setSearchableCopy(investmentPlatforms);
                    setCategoryName("investmentplatforms");
                    break;
                case 'Web Services':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(webServices);
                    setSearchableCopy(webServices);
                    setCategoryName("webservices");
                    break;
                case 'Security Updates':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(securityUpdates);
                    setSearchableCopy(securityUpdates);
                    setCategoryName("securityupdates");
                    break;
                case 'Web IM':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(webIM);
                    setSearchableCopy(webIM);
                    setCategoryName("webim");
                    break;
                case 'Business Tools':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(businessTools);
                    setSearchableCopy(businessTools);
                    setCategoryName("businesstools");
                    break;
                case 'Network Protocols_18':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(networkP18);
                    setSearchableCopy(networkP18);
                    setCategoryName("networkprotocols18");
                    break;
                case 'Network Protocols_19':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(networkp19);
                    setSearchableCopy(networkp19);
                    setCategoryName("networkprotocols19");
                    break;
                case 'Network Protocols_20':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(networkp20);
                    setSearchableCopy(networkp20);
                    setCategoryName("networkprotocols20");
                    break;
                case 'Private Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(privateProtocols);
                    setSearchableCopy(privateProtocols);
                    setCategoryName("privateprotocols");
                    break;
                case 'Unknown_255':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(Unknown_255);
                    setSearchableCopy(Unknown_255);
                    setCategoryName("unknown255");
                    break;
                default:
                    setFilteredArray([]);
                    break;
            }
        }
        filterCriteria(filter);
    }, [
        filter,
        mediaStreaming,
        socialNetworks,
        onlineGames,
        peertopeerNetworks,
        emailMessaging,
        instantMessengers,
        tunnelingProxy,
        fileSharing,
        voip,
        remoteAccess,
        databaseTools,
        managementProtocols,
        investmentPlatforms,
        webServices,
        securityUpdates,
        webIM,
        businessTools,
        networkP18,
        networkp19,
        networkp20,
        privateProtocols,
        Unknown_255,
    ]);

    const handleModalOpen = () => {
        manageDialogRef.current.showModal();
    }
    const handleCheckbox = e => {
        console.log(e.target.dataset.id, e.target.dataset.name, e.target.checked);
        if (e.target.checked) {
            selectionArray.push({ id: e.target.dataset.id, name: e.target.dataset.name })

        } else if (!e.target.checked) {
            const filterOut = selectionArray.filter(i => i.name !== e.target.dataset.name);
            selectionArray = filterOut;

        }
        setSelection(selectionArray);
        console.log('selection \t', selection);
    }



    function AppCard({ props, cat })
    {
        return (
            <>
                <div className="card w-80 min-h-[204px] bg-base-100 shadow-xl hover:bg-base-200">
                    <div className="card-body">
                        <h2 className="card-title">{props?.name}</h2>
                        <p>
                        More Info on&nbsp;
                            <a className="underline text-info italic" href={`https://www.google.com/search?q=${props?.name}`} target="_blank" rel="noreferrer">{props?.name}</a>
                        ...
                        </p>
                        <div className="card-actions justify-end">
                            {/* <Link to={`/manageapp/${cat}/${props.id}`}><button className="btn btn-primary btn-circle text-2xl font-bold">+</button></Link> */}
                            <input type="checkbox" onClick={handleCheckbox} className="checkbox checkbox-primary" data-id={props?.id} data-name={props?.name} />
                        </div>
                    </div>
                </div>
            </>
        )
    }


    return (
        <>
            <div className={`grid ${filteredArray.length === 2 ? '2xl:grid-cols-2 lg:grid-cols-2' : filteredArray.length === 1 ? '2xl-grid-cols-1 lg:grid-cols-1 xl-grid-cols-1' : '2xl:grid-cols-3 lg:grid-cols-2'} grid-cols-1 auto-rows-auto w-full sm:w-3/4 mx-auto py-12 gap-6`}>
                    <div className="w-full row-span-full col-span-full row-start-3 flex items-center justify-center flex-wrap gap-4">
                        <select className="select select-bordered" onChange={handleChange}>
                            <option disabled selected value="" className="font-bold hover:bg-accent">Select App Category</option>
                            {keys.map((i) => {
                                return (
                                    <>
                                        <option key={i.id} className="font-bold hover:bg-accent" value={i}>{i}</option>
                                    </>
                                )
                            })}
                        </select>
                        <input className="input input-bordered" onChange={handleSearchByText} />
                        <button className="btn" onClick={handleModalOpen}>Manage Category/Apps in {filter}</button>
                    </div>
                    {/* <div className="flex flex-row">
                        {/* <button className="btn">Block Selected Apps</button>
                    </div> */}
                            {filteredArray?.map((app) => {
                                return (
                                    <span className="mx-auto" key={app?.id}>
                                        <AppCard props={app} cat={categoryName} />
                                    </span>
                                    )
                                })}
            </div>

            <dialog ref={manageDialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Manage</h3>
                        <select className="select select-bordered">
                            {/* map devices */}
                        </select>
                    <div className="modal-action">
                        <div className="m-1 flex flex-row items-center justify-center">
                            {selection.map((app) => {
                                return (
                                    <>
                                        <div key={app.id} className="badge badge-primary">{app?.name}</div>
                                    </>
                                )
                            })}
                        </div>
                    <form method="dialog">
                        <button className="btn">Exit</button>
                    </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}