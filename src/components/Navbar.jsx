import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoGear } from "react-icons/go";
import { useEffect, useRef, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import NuaSvg from "../images/nua.svg";
// import '../globals.css'


export default function Navbar({ themeValue, callBackChanged })
{
  const [open, setOpen] = useState(false);
  const drawerRef = useRef();

  const updateTheme = async () => {
    let theme;
    if (themeValue === 'light') {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    try {
      const toggleTheme = await fetch('/updatetheme', {
        method: 'PUT',
        mode: 'cors',
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({ theme })
      });

      if (toggleTheme.ok) {
        const response = await toggleTheme.json();
        callBackChanged();
      }
    } catch (error) {
      if (error) throw error;
    }
  }

  const handleDrawerOn = () => {
    if (drawerRef.current.value === 'on') {
      setOpen(true);
      drawerRef.current.value = 'off'
    } else if (drawerRef.current.value === 'off') {
      setOpen(false);
      drawerRef.current.value = 'on'
    }
  }



  return (
    <>
        <div className="navbar bg-base-100 grid grid-flow-row grid-cols-2 z-50">
          <div className="flex flex-row items-center justify-center w-fit z-50 mr-4 gap-1">
            <div className="drawer w-fit">
              <input id="my-drawer" type="checkbox" onClick={handleDrawerOn} ref={drawerRef} className="drawer-toggle" />
              <div className="drawer-content flex items-center justify-center">
                {/* Page content here */}
                <label
                  htmlFor="my-drawer"
                  className="text-neutral drawer-button font-bold">
                    <GiHamburgerMenu className="w-8 h-8 hover:text-base-300 hover:cursor-pointer" />
                </label>
              </div>
              <div className="drawer-side">
                <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
                <ul className="menu p-4 w-52 sm:w-80 min-h-full bg-base-200 text-base-content ">
                  <Link to="/"><li><div>
                    <img
                      src={NuaSvg}
                      alt="NUA Logo"
                      className="w-16 h-16 p-0"
                    />
                    <div className="px-1 nuaFont text-2xl">NUA</div>
                  </div></li></Link>
                  {/* Sidebar content here */}
                  <Link to="/"><li className="font-bold text-lg"><a>Home</a></li></Link>
                  <Link to="/sitesettings"><li className="font-bold text-lg"><a>Site Settings</a></li></Link>
                  {/* <Link to="/blockeddevices"><li className="font-bold text-lg"><a>See All Blocked</a></li></Link> */}
                  <Link to="/alldevices"><li className="font-bold text-lg"><a>See All Devices</a></li></Link>
                  <Link to="/trafficrules"><li className="font-bold text-lg"><a>Traffic Rules</a></li></Link>
                  <Link to="/seeallapps"><li className="font-bold text-lg"><a>See All Apps</a></li></Link>
                </ul>
                <div className={`${open ? "absolute left-5 bottom-5" : "hidden"}`}>
                  <div className="badge badge-outline">Version&nbsp;<span className="text-primary">2.1.7</span></div>
                </div>
              </div>
            </div>
              <div className="flex justify-center items-center">
                <Link className="btn btn-ghost px-1 nuaFont text-xl " to="/">
                  <img
                    src={NuaSvg}
                    alt="NUA Logo"
                    className="w-10 h-10 p-0"
                  />
                  NUA
                </Link>
              </div>
          </div>
          <div className="flex justify-end">
                <label className="swap swap-rotate">
                  <input type="checkbox" className={`theme-controller`} onClick={updateTheme} />
                  {
                  themeValue === 'light' &&
                  <>
                  <svg className={`swap-off fill-current w-10 h-10`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
                  </>
                  }
                  {
                  themeValue === 'dark' &&
                  <>
                  <svg className={`swap-on fill-current w-10 h-10`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
                  </>
                  }
                  {
                  themeValue === 'dark' &&
                  <>
                  <svg className={`swap-off fill-current w-10 h-10`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
                  </>
                  }
                 {
                 themeValue === 'light' &&
                 <>
                 <svg className={`swap-on fill-current w-10 h-10`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
                </>
                }
                </label>
            </div>
        </div>
    </>
  )
}