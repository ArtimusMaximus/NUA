import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';
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
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />

          </Route>
        </Routes>
      </BrowserRouter>
  </React.StrictMode>,
);
