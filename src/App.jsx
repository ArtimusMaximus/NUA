import Login from "./components/Login";
import { BrowserRouter, Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { GoGear } from "react-icons/go";
import Navbar from './components/Navbar.jsx'
import { useEffect, useState } from "react";


export default function App() {

    const [title, setTitle] = useState({});
    const location = useLocation();


  useEffect(() => {
    // console.log(location.pathname);
    if (location.pathname === '/sitesettings') {
      setTitle({
        title: 'Site Settings'
      })
    } else {
      setTitle({
        title: ''
      })
    }
  }, [location.pathname]);


  return (
    <>
      <Navbar title={title} />
      <div className="bg-neutral flex items-center justify-center h-full w-full">
        <Outlet />
      </div>
    </>
  )

}


