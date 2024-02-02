
import { Outlet } from "react-router-dom";
import Navbar from './components/Navbar.jsx'
import { useEffect, useState } from "react";
import BreadCrumbs from "./components/breadcrumbs/BreadCrumbs.jsx";


export default function App() {

    const [themeValue, setThemeValue] = useState('');
    const [changed, setChanged] = useState(false);

    const callBackChanged = () => {
      setChanged(prev => !prev)
    }


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
      <Navbar themeValue={themeValue} callBackChanged={callBackChanged} />
      <BreadCrumbs />
      <div className="flex items-center justify-center h-full w-full">
        <Outlet />
      </div>
    </>
  )
}


