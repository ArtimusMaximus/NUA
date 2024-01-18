import Login from "./components/Login";
import { BrowserRouter, Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { GoGear } from "react-icons/go";
import Navbar from './components/Navbar.jsx'
import { useEffect, useState } from "react";
import BreadCrumbs from "./components/breadcrumbs/BreadCrumbs.jsx";


export default function App() {

    const [title, setTitle] = useState({});
    const location = useLocation();
    const [themeValue, setThemeValue] = useState('');
    const [changed, setChanged] = useState(false);


    // const dataThemeRef = useRef()

    const callBackChanged = () => {
      setChanged(prev => !prev)
    }


  useEffect(() => { // title setter for navbar
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

  useEffect(() => { // get theme settings
    const getThemeSettings = async () => {
      try {
        const getTheme = await fetch('/getcurrenttheme');
      if (getTheme.ok) {
        const currentTheme = await getTheme.json();
        document.querySelector('html').dataset.theme = currentTheme;
        setThemeValue(currentTheme);
      }
      } catch (error) {
        if (error) throw error;
      }
    }
    getThemeSettings();
  }, [changed]);

  return (
    <>
      <Navbar title={title} themeValue={themeValue} callBackChanged={callBackChanged} />
      <BreadCrumbs />
      <div className="flex items-center justify-center h-full w-full">
        <Outlet />
      </div>
    </>
  )

}


