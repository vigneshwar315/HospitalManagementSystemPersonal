import React, { useState } from 'react';
import RoleSwitch from '../../components/RoleSwitch';
import { useNavigate } from 'react-router-dom';

const AuthSelection = () => {
  const [selectedRole, setSelectedRole] = useState("admin");
  const navigate = useNavigate();

  const handleProceed = () => {
    if (selectedRole === "admin") {
      navigate("/auth/admin");
    } else {
      navigate("/auth/doctor/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h2 className="text-3xl font-semibold mb-4">Select Role</h2>
      <RoleSwitch selectedRole={selectedRole} onChange={setSelectedRole} />
      <button 
        onClick={handleProceed}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Proceed
      </button>
    </div>
  );
};

export default AuthSelection;
