// src/pages/auth/DoctorLogin.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserMd, FaLock, FaSignInAlt, FaHome, FaEye, FaEyeSlash } from 'react-icons/fa';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/staff/login-doctor', formData);
      localStorage.setItem('token', response.data.token);
      toast.success('Login successful!');
      navigate('/doctor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              opacity: 0
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 0.1, 0],
              transition: {
                duration: Math.random() * 30 + 30,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative z-10"
      >
        <div className="absolute top-4 left-4">
          <Link 
            to="/" 
            className="flex items-center text-white/70 hover:text-white transition-colors"
          >
            <FaHome className="mr-2" /> Home
          </Link>
        </div>

        <div className="p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <FaUserMd className="text-white text-4xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Doctor Portal</h1>
          <p className="text-white/80 mb-8">Secure access to medical dashboard</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 text-white rounded-lg border ${errors.email ? 'border-red-400' : 'border-white/20'} focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder-white/50`}
                  placeholder="Email Address"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
                  <FaUserMd />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 text-left">{errors.email}</p>
                )}
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-10 py-3 bg-white/10 text-white rounded-lg border ${errors.password ? 'border-red-400' : 'border-white/20'} focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder-white/50`}
                  placeholder="Password"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
                  <FaLock />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1 text-left">{errors.password}</p>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-70 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <FaSignInAlt />
                  <span>Sign In</span>
                </>
              )}
            </button>
            
            <div className="flex justify-between items-center text-white/70 text-sm">
              <button 
                type="button" 
                onClick={() => navigate('/doctor/register')}
                className="text-white font-medium hover:underline"
              >
                Register as Doctor
              </button>
              <button 
                type="button"
                className="text-white/70 hover:text-white"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorLogin;