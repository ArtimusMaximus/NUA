import React from 'react';
import App from './App.jsx';
import './index.css';
import AdminConsole from './components/AdminConsole.jsx';
import Login from './components/Login.jsx';
import Devices from './components/Devices.jsx';
import TrafficRules from './components/traffic_rules/TrafficRules.jsx';
import ManageApp from './components/manage_app_page/ManageApp.jsx';
import SeeAllApps from './components/see_all_apps/SeeAllApps.jsx'
import BlockedDevices from './components/blocked_device/BlockedDevices.jsx';
import AllDevices from './components/all_devices/AllDevices.jsx';
import NotFound from './components/NotFound.jsx';
import CronManager from './components/CronManager.jsx';
import CronManager2 from './components/CronManager2.jsx';
import SiteSettings from './components/SiteSettings.jsx';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter, Routes, Route
} from 'react-router-dom';
import './globals.css'


const root = createRoot(document.getElementById('root'));



root.render(
  <React.StrictMode>
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            {/* <Route path="/" element={<Login />} /> */}
            <Route path="/" element={<AdminConsole />} />
            <Route path="/blockeddevices" element={<BlockedDevices />} />
            <Route path="/alldevices" element={<AllDevices />} />
            <Route path="/sitesettings" element={<SiteSettings />} />
            <Route path="/trafficrules/" element={<TrafficRules />} />
            <Route path="/manageapp/:cat/:id" element={<ManageApp />} />
            <Route path="/seeallapps" element={<SeeAllApps />} />
            <Route path="/admin/:id/cronmanager" element={<CronManager />} />
            <Route path="/admin/:id/cronmanager2" element={<CronManager2 />} />
            <Route path="*" element={<NotFound />} />
            {/* <Route path="/adminconsole" element={<AdminConsole />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
  </React.StrictMode>,
);
