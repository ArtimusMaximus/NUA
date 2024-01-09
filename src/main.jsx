import React from 'react';
import App from './App.jsx';
import './index.css';
import AdminConsole from './components/AdminConsole.jsx';
import Login from './components/Login.jsx';
import Devices from './components/Devices.jsx';
import BlockedDevices from './components/blocked_device/BlockedDevices.jsx';
import NotFound from './components/NotFound.jsx';
import CronManager from './components/CronManager.jsx';
import Settings from './components/Settings.jsx';
import SiteSettings from './components/SiteSettings.jsx';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter, Routes, Route
} from 'react-router-dom';


const root = createRoot(document.getElementById('root'));



root.render(
  <React.StrictMode>
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            {/* <Route path="/" element={<Login />} /> */}
            <Route path="/" element={<AdminConsole />} />
            <Route path="/blockeddevices" element={<BlockedDevices />} />
            <Route path="/sitesettings" element={<SiteSettings />} />
            <Route path="/admin/:id" element={<Settings />} />
            <Route path="/admin/:id/cronmanager" element={<CronManager />} />
            <Route path="*" element={<NotFound />} />
            {/* <Route path="/adminconsole" element={<AdminConsole />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
  </React.StrictMode>,
);
