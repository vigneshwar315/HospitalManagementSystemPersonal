// src/pages/AuthPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AuthPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Select Your Role</h1>
      <div className="flex flex-col items-start mb-4">
        <Link to="/admin/login" className="mb-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Admin Login</button>
        </Link>
        <Link to="/doctor/login" className="mb-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Doctor Login</button>
        </Link>
        <Link to="/doctor/register">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Doctor Register</button>
        </Link>
      </div>
    </div>
  );
};

export default AuthPage;