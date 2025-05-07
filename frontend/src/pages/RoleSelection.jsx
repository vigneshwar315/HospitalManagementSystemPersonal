import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    if (role === "admin") {
      navigate("/admin/login");
    } else if (role === "doctor") {
      navigate("/doctor/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#e6f7ff] rounded-full opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#f6ffed] rounded-full opacity-20"></div>
      </div>

      {/* Home button */}
      <button 
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors z-10 group"
      >
        <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
          <FaHome className="text-xl" />
        </div>
        <span className="font-medium">Return Home</span>
      </button>

      <div className="relative z-10 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight">
          The <span className="text-[#1890ff]">DeccanCare</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          Select your role to access the healthcare management portal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* Admin Card */}
        <div
          className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#1890ff]/20 group relative overflow-hidden"
          onClick={() => handleSelect("admin")}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[#1890ff]"></div>
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#1890ff]/10 rounded-full scale-90 group-hover:scale-100 transition-transform duration-300"></div>
            <img
              src="/src/assets/user.png"
              alt="Admin"
              className="w-24 h-24 relative z-10 object-contain p-2"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Administrator</h2>
          <p className="text-gray-500 text-center mb-6">
            Comprehensive system management and analytics
          </p>
          <div className="mt-auto px-6 py-2 bg-[#1890ff] text-white rounded-md font-medium shadow-sm hover:shadow-md transition-shadow">
            Continue
          </div>
        </div>

        {/* Doctor Card */}
        <div
          className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#52c41a]/20 group relative overflow-hidden"
          onClick={() => handleSelect("doctor")}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[#52c41a]"></div>
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#52c41a]/10 rounded-full scale-90 group-hover:scale-100 transition-transform duration-300"></div>
            <img
              src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
              alt="Doctor"
              className="w-24 h-24 relative z-10 object-contain p-2"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Medical Doctor</h2>
          <p className="text-gray-500 text-center mb-6">
            Patient care and clinical management portal
          </p>
          <div className="mt-auto px-6 py-2 bg-[#52c41a] text-white rounded-md font-medium shadow-sm hover:shadow-md transition-shadow">
            Continue
          </div>
        </div>
      </div>

      {/* Premium decorative footer */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-r from-[#1890ff] to-[#52c41a] opacity-5 z-0"></div>
    </div>
  );
};

export default RoleSelection;