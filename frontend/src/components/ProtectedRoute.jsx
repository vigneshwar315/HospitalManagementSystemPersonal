// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');

    if (!token) {
      return <Navigate to={`/${role.toLowerCase()}/auth`} />;
    }

    try {
      const decoded = jwt_decode(token);
      if (Array.isArray(role)) {
        if (!role.includes(decoded.role)) {
          return <Navigate to="/unauthorized" />;
        }
      } else if (decoded.role !== role) {
        return <Navigate to="/unauthorized" />;
      }

      return children;
    } catch (error) {
      return <Navigate to={`/${role.toLowerCase()}/auth`} />;
    }
  };

export default ProtectedRoute;