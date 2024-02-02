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

    useEffect(() => { // switch for filters
        const filterCriteria = (criteria) => {
            switch (criteria) {
                case 'Media Streaming':
                    // console.log('All devices in switch statement');
                    setFilteredArray(mediaStreaming);
                    setSearchableCopy(mediaStreaming);
                    setCategoryName("Media Streaming")
                    break;
                case 'Social Networks':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(socialNetworks);
                    setSearchableCopy(socialNetworks);
                    setCategoryName("Social Networks");
                    break;
                case 'Online Games':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(onlineGames);
                    setSearchableCopy(onlineGames);
                    setCategoryName("Online Games");
                    break;
                case 'Peer-to-Peer Networks':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(peertopeerNetworks);
                    setSearchableCopy(peertopeerNetworks);
                    setCategoryName("Peer-to-Peer Networks");
                    break;
                case 'Email Messaging':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(emailMessaging);
                    setSearchableCopy(emailMessaging);
                    setCategoryName("Email Messaging");
                    break;
                case 'Instant Messengers':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(instantMessengers);
                    setSearchableCopy(instantMessengers);
                    setCategoryName("Instant Messengers");
                    break;
                case 'Tunneling and Proxy':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(tunnelingProxy);
                    setSearchableCopy(tunnelingProxy);
                    setCategoryName("Tunneling and Proxy");
                    break;
                case 'File Sharing':
                    // console.log('Blocked devices in switch statement');
                    setFilteredArray(fileSharing);
                    setSearchableCopy(fileSharing);
                    setCategoryName("File Sharing");
                    break;
                case 'VoIP Services':
                    // console.log('Offline devices in switch statement');
                    setFilteredArray(voip);
                    setSearchableCopy(voip);
                    setCategoryName("VoIP Services");
                    break;
                case 'Remote Access':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(remoteAccess);
                    setSearchableCopy(remoteAccess);
                    setCategoryName("Remote Access");
                    break;
                case 'Database Tools':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(databaseTools);
                    setSearchableCopy(databaseTools);
                    setCategoryName("Database Tools");
                    break;
                case 'Management Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(managementProtocols);
                    setSearchableCopy(managementProtocols)
                    setCategoryName("Management Protocols");
                    break;
                case 'Investment Platforms':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(investmentPlatforms);
                    setSearchableCopy(investmentPlatforms);
                    setCategoryName("Investment Platforms");
                    break;
                case 'Web Services':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(webServices);
                    setSearchableCopy(webServices);
                    setCategoryName("Web Services");
                    break;
                case 'Security Updates':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(securityUpdates);
                    setSearchableCopy(securityUpdates);
                    setCategoryName("Security Updates");
                    break;
                case 'Web IM':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(webIM);
                    setSearchableCopy(webIM);
                    setCategoryName("Web IM");
                    break;
                case 'Business Tools':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(businessTools);
                    setSearchableCopy(businessTools);
                    setCategoryName("Business Tools");
                    break;
                case 'Network Protocols_18':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(networkP18);
                    setSearchableCopy(networkP18);
                    setCategoryName("Network Protocols_18");
                    break;
                case 'Network Protocols_19':
                    // console.log('Online Devices in switch statement');
                    setFilteredArray(networkp19);
                    setSearchableCopy(networkp19);
                    setCategoryName("Network Protocols_19");
                    break;
                case 'Network Protocols_20':
                    // console.log('Devices on List in switch statement');
                    setFilteredArray(networkp20);
                    setSearchableCopy(networkp20);
                    setCategoryName("Network Protocols_20");
                    break;
                case 'Private Protocols':
                    // console.log('Wired Devices in switch statement');
                    setFilteredArray(privateProtocols);
                    setSearchableCopy(privateProtocols);
                    setCategoryName("Private Protocols");
                    break;
                case 'Unknown_255':
                    // console.log('Wireless Devices in switch statement');
                    setFilteredArray(Unknown_255);
                    setSearchableCopy(Unknown_255);
                    setCategoryName("Unknown_255");
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
        if (e.target.checked) {
            setSelection([
                ...selection,
                { name: e.target.dataset.name, id: parseInt(e.target.dataset.id) }
            ]);
        } else if (!e.target.checked) {
            const filteredOut = selection.filter(name => name.name !== e.target.dataset.name)
            setSelection(filteredOut)
        }
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
                            <input className="input input-bordered" placeholder="Search..." onChange={handleSearchByText} />
                        <button className="btn" onClick={handleModalOpen}>Manage Category/Apps in <span className="text-accent">{filter}</span></button>
                    </div>
                    {filteredArray?.map((app) => {
                        return (
                            <>
                                <div className="card w-80 min-h-[204px] bg-base-100 shadow-xl hover:bg-base-200 mx-auto">
                                    <div className="card-body">
                                        <h2 className="card-title">{app?.name}</h2>
                                        <p>
                                        More Info on&nbsp;
                                            <a className="underline text-info italic" href={`https://www.google.com/search?q=${app?.name}`} target="_blank" rel="noreferrer">{app?.name}</a>
                                        ...
                                        </p>
                                        <div className="card-actions justify-end">
                                            <input type="checkbox" onChange={handleCheckbox}  className="checkbox checkbox-primary" data-id={app?.id} data-name={app?.name} />
                                        </div>
                                    </div>
                                </div>
                            </>
                            )
                        })}
            </div>

            <dialog ref={manageDialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Manage</h3>
                    <div className="divider"></div>
                    <div className="flex flex-row mb-2">
                        Category:&nbsp;<span className="text-accent">{categoryName}</span>
                    </div>
                    <div className="flex flex-col mb-2">
                        <span className="label">Apps in category:</span>
                            <select className="select select-bordered">
                                <option disabled selected>Choose apps</option>
                                {filteredArray
                                    .filter(app => !selection.some(selectedApp => selectedApp.id === app?.id))
                                    .map(app => {
                                        return (
                                            <>
                                                <option key={app.id}>{app?.name}</option>
                                            </>
                                        )
                                })}
                            </select>
                    </div>
                    <div className="m-1 flex flex-col items-center justify-center gap-2">
                            {selection?.map((app) => {
                                return (
                                    <>
                                        <div key={app.id} className="badge badge-primary">{app?.name}</div>
                                    </>
                                )
                            })}
                        </div>
                    <div className="modal-action">

                    <form method="dialog">
                        <button className="btn">Exit</button>
                    </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}