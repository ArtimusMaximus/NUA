import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HiCog6Tooth } from "react-icons/hi2";
import NuaSvg from "../images/nua.svg";
import PropTypes from 'prop-types';

export default function Navbar({ themeValue, callBackChanged, onSettingsClick, onLogout, showLogout }) {
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          const data = await res.json();
          setConnected(data.unifiConnected ?? true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    };
    checkHealth();
    const id = setInterval(checkHealth, 30000);
    return () => clearInterval(id);
  }, []);

  const updateTheme = async () => {
    const next = themeValue === 'light' ? 'dark' : 'light';
    try {
      const res = await fetch('/updatetheme', {
        method: 'PUT',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      });
      if (res.ok) callBackChanged();
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  return (
    <div className="navbar bg-base-100 border-b border-base-200 px-4 z-50">
      {/* Left: brand */}
      <div className="flex-1">
        <Link className="btn btn-ghost px-2 nuaFont text-xl gap-2" to="/">
          <img src={NuaSvg} alt="NUA Logo" className="w-8 h-8" />
          NUA
        </Link>
      </div>

      {/* Right: connection dot + theme toggle + settings gear */}
      <div className="flex items-center gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            connected === null
              ? 'bg-base-content/30 animate-pulse'
              : connected
              ? 'bg-success'
              : 'bg-error animate-pulse'
          }`}
          title={
            connected === null
              ? 'Checking UniFi connection…'
              : connected
              ? 'UniFi connected'
              : 'UniFi disconnected'
          }
        />

        <label className="swap swap-rotate">
          <input
            type="checkbox"
            className="theme-controller"
            checked={themeValue === 'dark'}
            onChange={updateTheme}
          />
          {/* Sun — light mode */}
          <svg className="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
          </svg>
          {/* Moon — dark mode */}
          <svg className="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
          </svg>
        </label>

        <button
          className="btn btn-ghost btn-sm btn-circle"
          title="Site Settings"
          onClick={onSettingsClick}
        >
          <HiCog6Tooth className="w-5 h-5" />
        </button>

        {showLogout && (
          <button
            className="btn btn-ghost btn-sm"
            title="Log out"
            onClick={onLogout}
          >
            Log out
          </button>
        )}
      </div>
    </div>
  );
}

Navbar.propTypes = {
  themeValue: PropTypes.string,
  callBackChanged: PropTypes.func,
  onSettingsClick: PropTypes.func,
  onLogout: PropTypes.func,
  showLogout: PropTypes.bool,
};
