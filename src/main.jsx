import React, { Suspense, lazy } from 'react';
import App from './App.jsx';
import './index.css';
import NotFound from './components/NotFound.jsx';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter, Routes, Route
} from 'react-router-dom';
import './globals.css'

// Route-level code splitting: the heavy screens (traffic rules, app/device
// managers) are loaded on demand instead of in the initial bundle.
const AdminConsole = lazy(() => import('./components/AdminConsole.jsx'));
const TrafficRules = lazy(() => import('./components/traffic_rules/TrafficRules.jsx'));
const ManageApp = lazy(() => import('./components/manage_app_page/ManageApp.jsx'));
const SeeAllApps = lazy(() => import('./components/see_all_apps/SeeAllApps.jsx'));
const BlockedDevices = lazy(() => import('./components/blocked_device/BlockedDevices.jsx'));
const AllDevices = lazy(() => import('./components/all_devices/AllDevices.jsx'));


const root = createRoot(document.getElementById('root'));



root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-full w-full">Loading...</div>}>
        <Routes>
          <Route path="/" element={<App />}>
            {/* <Route path="/" element={<Login />} /> */}
            <Route path="/" element={<AdminConsole />} />
            <Route path="/blockeddevices" element={<BlockedDevices />} />
            <Route path="/alldevices" element={<AllDevices />} />
            <Route path="/trafficrules/" element={<TrafficRules />} />
            <Route path="/manageapp/:cat/:id" element={<ManageApp />} />
            <Route path="/seeallapps" element={<SeeAllApps />} />
            {/* <Route path="/admin/:id/scheduler" element={<Scheduler />} /> */}
            {/* <Route path="/admin/:id/cronmanager" element={<CronManager />} /> */}
            {/* <Route path="/admin/:id/easysched" element={<EasySched />} /> */}
            <Route path="*" element={<NotFound />} />
            {/* <Route path="/adminconsole" element={<AdminConsole />} /> */}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);
