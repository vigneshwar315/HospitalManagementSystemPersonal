// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import RoleSelection from './pages/RoleSelection';
import AuthReceptionist from './pages/auth/AuthReceptionist';
import AdminLogin from './pages/auth/AdminLogin';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorDashboard from './pages/auth/DoctorDashboard';
import DoctorRegister from './pages/auth/DoctorRegister';
import AdminDashboard from './pages/auth/AdminDashboard';
import ReceptionistDashboard from './pages/auth/ReceptionistDashboard';
import GenAiSearch from './genai/GenAiSearch';
import AwaitingApproval from './pages/auth/AwaitingApproval';
import AboutUs from './pages/auth/AboutUs';
import PatientDetails from './pages/auth/PatientDetails';
import PatientLogin from './pages/auth/PatientLogin';
import PatientDashboard from './pages/auth/PatientDashboard';
import PatientPrescriptions from './pages/auth/PatientPrescriptions';
import RegisterPatient from './pages/auth/RegisterPatient';
import BookAppointment from './pages/auth/BookAppointment';
import SearchPatients from './pages/auth/SearchPatient';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import axios from 'axios';
import TermsOfService from './pages/auth/TermsOfService';
import PrivacyPolicy from './pages/auth/PrivacyPolicy';

// In your routes configuration:

// Set token globally for all axios requests
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        {/* Toast Container should be here to work across all routes */}
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          toastStyle={{
            borderRadius: '12px',
            fontFamily: 'inherit',
          }}
        />
        
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/auth/receptionist" element={<AuthReceptionist role="receptionist" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/register" element={<DoctorRegister />} />
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/dashboard/appointments" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/dashboard/appointments/:id" element={<ReceptionistDashboard />} />
          <Route path="/register-patient" element={<RegisterPatient />} />
          <Route path="/book-appointments" element={<BookAppointment />} />
          <Route path="/search-patient" element={<SearchPatients />} />
          <Route path="/search/:query" element={<GenAiSearch />} />
          <Route path="/auth/dashboard" element={<AdminDashboard />} />
          <Route path="/awaiting-approval" element={<AwaitingApproval />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/doctor/patients/:customId" element={<PatientDetails />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);