import React from "react";

const RoleSwitch = ({ selectedRole, setSelectedRole }) => {
  return (
    <div className="flex justify-center gap-6 my-6">
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          value="admin"
          checked={selectedRole === "admin"}
          onChange={() => setSelectedRole("admin")}
          className="accent-blue-600 w-4 h-4"
        />
        <span className="text-lg font-medium">Admin</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="radio"
          value="doctor"
          checked={selectedRole === "doctor"}
          onChange={() => setSelectedRole("doctor")}
          className="accent-green-600 w-4 h-4"
        />
        <span className="text-lg font-medium">Doctor</span>
      </label>
    </div>
  );
};

export default RoleSwitch;
