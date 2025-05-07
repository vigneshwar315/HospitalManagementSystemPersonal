import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMobile, FaLock, FaArrowLeft, FaHospital, FaShieldAlt, FaUser, FaEnvelope, FaHome, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const PatientLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contactNumber: '',
    otp: '',
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [error, setError] = useState(null);

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return false;
    return cleaned;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'contactNumber' || name === 'otp') && !/^\d*$/.test(value)) return;
    setFormData({ ...formData, [name]: value });
  };

  const startResendCooldown = (seconds) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formattedPhone = validatePhoneNumber(formData.contactNumber);
      if (!formattedPhone) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      const checkResponse = await axios.post('/patient/check', {
        contactNumber: formattedPhone
      });

      if (!checkResponse.data.exists) {
        setIsNewPatient(true);
        setStep(1.5);
        return;
      }

      const response = await axios.post('/patient/send-otp', {
        contactNumber: formattedPhone,
        phone: formattedPhone
      });
      
      if (response.data.success) {
        toast.success('OTP sent successfully!');
        setStep(2);
        startResendCooldown(response.data.cooldown || 60);
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      if (error.response?.status === 429) {
        startResendCooldown(error.response?.data?.cooldown || 60);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPatientSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formattedPhone = validatePhoneNumber(formData.contactNumber);
      if (!formattedPhone) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      if (!formData.name || !formData.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      const registerResponse = await axios.post('/patient/register', {
        name: formData.name,
        email: formData.email,
        contactNumber: formattedPhone
      });

      if (registerResponse.data.success) {
        toast.success('Registration successful! Sending OTP...');
        
        const otpResponse = await axios.post('/patient/send-otp', {
          contactNumber: formattedPhone
        });
        
        if (otpResponse.data.success) {
          toast.success('OTP sent successfully!');
          setStep(2);
          if (otpResponse.data.cooldown) {
            startResendCooldown(otpResponse.data.cooldown);
          }
        } else {
          toast.error(otpResponse.data.message || 'Failed to send OTP');
        }
      } else {
        toast.error(registerResponse.data.message || 'Failed to register');
      }
    } catch (error) {
      console.error('Error registering patient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        toast.info('Patient already exists. Sending OTP...');
        try {
          const otpResponse = await axios.post('/patient/send-otp', {
            contactNumber: validatePhoneNumber(formData.contactNumber)
          });
          
          if (otpResponse.data.success) {
            toast.success('OTP sent successfully!');
            setStep(2);
            if (otpResponse.data.cooldown) {
              startResendCooldown(otpResponse.data.cooldown);
            }
          }
        } catch (otpError) {
          toast.error(otpError.response?.data?.message || 'Failed to send OTP');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = validatePhoneNumber(formData.contactNumber);
      if (!formattedPhone) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      const response = await axios.post('/patient/verify-otp', {
        contactNumber: formattedPhone,
        otp: formData.otp
      });

      if (response.data.success) {
        await login({
          token: response.data.token,
          id: response.data.patient.id,
          name: response.data.patient.name,
          email: response.data.patient.email,
          phone: response.data.patient.phone,
          customId: response.data.patient.customId
        });
        navigate('/patient/dashboard');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'OTP verification failed');
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: { enable: false, rotateX: 600, rotateY: 1200 }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "repulse" },
              onclick: { enable: true, mode: "push" },
              resize: true
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
              push: { particles_nb: 4 }
            }
          },
          retina_detect: true
        }}
      />

      {/* Floating Glass Morphism Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5 backdrop-blur-md border border-white/10"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              opacity: 0
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 0.1, 0],
              transition: {
                duration: Math.random() * 40 + 40,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
          />
        ))}
      </div>

      {/* Home Button */}
      <motion.button 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full shadow-xl backdrop-blur-sm transition-all duration-300 border border-white/20 hover:border-white/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaHome className="text-xl" />
        <span className="font-medium">Home</span>
      </motion.button>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/10 overflow-hidden"
      >
        {/* Glowing Accent Elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-teal-500/20 to-emerald-600/20 rounded-full blur-3xl" />
        
        {/* Logo Header */}
        <motion.div 
          className="text-center mb-8 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <FaHospital className="text-5xl text-white/90" />
            </motion.div>
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent ml-3"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              DeccanCare
            </motion.h1>
          </div>
          <motion.h2 
            className="text-2xl font-semibold text-white/90 mb-2"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Patient Portal
          </motion.h2>
          <motion.p 
            className="text-white/70 text-lg"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {step === 1 ? 'Enter your phone number to receive OTP' : 
             step === 1.5 ? 'Complete your registration' : 
             'Enter the OTP sent to your phone'}
          </motion.p>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                {/* Phone Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                    <div className="relative flex items-center">
                      <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-blue-400/80">
                        <FaMobile className="text-xl" />
                      </div>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                        placeholder="10-digit mobile number"
                        required
                        pattern="[0-9]{10}"
                        maxLength="10"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <button
                    type="submit"
                    disabled={isLoading || resendCooldown > 0}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : resendCooldown > 0 ? (
                      `Resend OTP in ${resendCooldown}s`
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <FaChevronRight className="ml-2" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            ) : step === 1.5 ? (
              <form onSubmit={handleNewPatientSubmit} className="space-y-6">
                {/* Name Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                    <div className="relative flex items-center">
                      <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-blue-400/80">
                        <FaUser className="text-xl" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Email Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                    <div className="relative flex items-center">
                      <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-blue-400/80">
                        <FaEnvelope className="text-xl" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                        placeholder="Your email address"
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Navigation Buttons */}
                <motion.div
                  className="flex justify-between items-center pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center text-blue-400/80 hover:text-blue-400 transition-colors"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </span>
                    ) : (
                      <>
                        <span>Continue</span>
                        <FaChevronRight className="ml-2" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* OTP Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-white/70 mb-2">Verification Code</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                    <div className="relative flex items-center">
                      <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-blue-400/80">
                        <FaShieldAlt className="text-xl" />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                        placeholder="6-digit OTP"
                        required
                        pattern="[0-9]{6}"
                        maxLength="6"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    Enter the 6-digit code sent to {formData.contactNumber}
                  </p>
                </motion.div>

                {/* Navigation Buttons */}
                <motion.div
                  className="flex justify-between items-center pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center text-blue-400/80 hover:text-blue-400 transition-colors"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <FaChevronRight className="ml-2" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            )}
                    </motion.div>
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Footer Links */}
        <motion.div 
          className="mt-8 text-center text-white/60 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>By continuing, you agree to our <a href="/terms" className="text-blue-400/80 hover:text-blue-400 transition-colors">Terms</a> and <a href="/privacy" className="text-blue-400/80 hover:text-blue-400 transition-colors">Privacy Policy</a></p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PatientLogin;