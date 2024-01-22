import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom"

export default function BreadCrumbs()
{
    const location = useLocation();
    const [locationArr, setLocationArr] = useState([]);

    useEffect(() => {
        // console.log(location.pathname);
        let pathNames = location.pathname.split("/");

        let crumbsArray = [];
        pathNames?.map((path, i) => {

            if (path === '/' || path === '') {
                path = 'Home'
            }  else if (path === 'sitesettings') {
                path = 'Site Settings'
            } else if (path === 'alldevices') {
                path = 'All Devices'
            } else if (path === 'blockeddevices') {
                path = 'Blocked Devices'
            } else if (path === 'cronmanager') {
                path = 'Cron Manager'
                pathNames[i] = ''
            } else if (path === 'admin') {
                path = 'Admin'
                pathNames[i] = ''
            } else if (Number(path)) {
                path = null
            }

            crumbsArray.push({
                path: path,
                link: pathNames[i]
            })
            return crumbsArray;
        });

        // console.log('pnamelength \t', pathNames.length)
        // console.log('pnames \t', pathNames)

        if (pathNames.length === 2 && pathNames[1] === '') {
            // console.log('fired off');
            setLocationArr([{ path: 'Home', link: '/' }])
        } else {
            setLocationArr(crumbsArray)
        }

    }, [location]);


    return (
        <>
            <div className="flex items-center justify-center w-fit mx-auto rounded-xl">
                <div className="text-sm breadcrumbs p-3 bg-transparent">
                    <ul>
                        {locationArr?.map((crumb) => {
                            return (
                                <>
                                    {crumb.path !== null && <li className="italic"><Link to={`/${crumb.link}`}>{crumb.path}</Link></li>}
                                </>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </>
    )
}