// src/pages/auth/AwaitingApproval.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaEnvelope, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AwaitingApproval = () => {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-center"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaClock size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Approval Pending</h1>
          <p className="opacity-90">Your registration is under review</p>
        </div>
        
        <div className="p-8">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaEnvelope className="text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-800 mb-1">What's Next?</h3>
                <p className="text-sm text-gray-600">
                  You'll receive an email notification once your account is approved by the administrator.
                  This process typically takes 24-48 hours.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Thank you for your patience. Our team is reviewing your application and will get back to you shortly.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.href = 'mailto:csgptclg@gmail.com'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Contact Support
            </button>
            <button
              onClick={handleHome}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <FaHome /> Go to Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AwaitingApproval;