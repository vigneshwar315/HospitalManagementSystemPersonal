import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      // If role is receptionist, skip /auth/me fetch
      if (role === 'receptionist') {
        setLoading(false);
      } else {
        fetchUserData();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/auth/me');
      if (response.data && response.data.success && response.data.data) {
        setUser(response.data.data);
        setError(null);
      } else {
        setError('Failed to fetch user data');
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to fetch user data');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      // For patient login, we already have the token and user data
      // No need to make an additional API call
      localStorage.setItem('token', credentials.token);
      setUser({
        id: credentials.id,
        name: credentials.name,
        email: credentials.email,
        phone: credentials.phone,
        customId: credentials.customId,
        role: 'patient'
      });
      setError(null);
      return credentials;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 