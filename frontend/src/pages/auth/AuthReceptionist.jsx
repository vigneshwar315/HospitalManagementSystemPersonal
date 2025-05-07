import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaSignInAlt, FaUserPlus, FaEnvelope, FaPhone, FaLock, FaCheck, FaTimes, FaHome } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';

const AuthReceptionist = ({ role = 'Receptionist' }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [emailForReset, setEmailForReset] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        contactNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const passwordValidation = useMemo(() => {
        const { password } = formData;
        return {
            length: password.length >= 8,
            upperCase: /[A-Z]/.test(password),
            lowerCase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            isValid: password.length >= 8 && 
                    /[A-Z]/.test(password) && 
                    /[a-z]/.test(password) && 
                    /[0-9]/.test(password) && 
                    /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }, [formData.password]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            if (showForgotPassword && resetToken) {
                if (!passwordValidation.isValid) {
                    throw new Error('Password does not meet requirements');
                }
                
                await axios.post(
                    `http://localhost:5000/api/staff/receptionist/reset-password/${resetToken}`, 
                    { newPassword: formData.password },
                    { withCredentials: true }
                );
                setSuccess('Password reset successfully!');
                setTimeout(() => {
                    setShowForgotPassword(false);
                    setResetToken('');
                }, 2000);
            } else if (isLogin) {
                const res = await axios.post(
                    'http://localhost:5000/api/staff/login-receptionist', 
                    {
                        email: formData.email.trim().toLowerCase(),
                        password: formData.password,
                        role: "Receptionist"
                    },
                    {
                        withCredentials: true,
                        validateStatus: (status) => status < 500
                    }
                );

                if (!res.data.success) {
                    throw new Error(res.data.message || 'Login failed');
                }

                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userData', JSON.stringify(res.data.user));
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => navigate('/receptionist/dashboard'), 1500);
            } else {
                if (!passwordValidation.isValid) {
                    throw new Error('Password does not meet requirements');
                }

                const res = await axios.post(
                    'http://localhost:5000/api/staff/register-receptionist',
                    {
                        ...formData,
                        role: "Receptionist"
                    },
                    { withCredentials: true }
                );

                if (!res.data.success) {
                    throw new Error(res.data.message || 'Registration failed');
                }

                setSuccess('Registration successful! Redirecting...');
                setTimeout(() => navigate('/awaiting-approval'), 1500);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                              err.response?.data?.error || 
                              err.message || 
                              'Authentication failed';
            setError(errorMessage);
            console.error("Auth Error:", {
                error: err.response?.data || err.message,
                config: err.config
            });
        } finally {
            setLoading(false);
        }
    }, [formData, isLogin, navigate, resetToken, showForgotPassword, passwordValidation.isValid]);

    const handleForgotPassword = useCallback(async () => {
        if (!emailForReset) {
            setError('Please enter your email');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await axios.post(
                'http://localhost:5000/api/staff/receptionist/forgot-password',
                { email: emailForReset },
                { withCredentials: true }
            );
            
            if (!res.data.success) {
                throw new Error(res.data.message || 'Failed to send reset link');
            }
            
            setSuccess('Password reset link sent to your email');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    }, [emailForReset]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            setResetToken(token);
            setShowForgotPassword(true);
        }
    }, []);

    const PasswordValidationChecklist = useMemo(() => () => (
        <div className="mt-3 space-y-2 text-xs">
            <div className={`flex items-center ${passwordValidation.length ? 'text-emerald-500' : 'text-amber-500'}`}>
                {passwordValidation.length ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center ${passwordValidation.upperCase ? 'text-emerald-500' : 'text-amber-500'}`}>
                {passwordValidation.upperCase ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                <span>At least one uppercase letter</span>
            </div>
            <div className={`flex items-center ${passwordValidation.lowerCase ? 'text-emerald-500' : 'text-amber-500'}`}>
                {passwordValidation.lowerCase ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                <span>At least one lowercase letter</span>
            </div>
            <div className={`flex items-center ${passwordValidation.number ? 'text-emerald-500' : 'text-amber-500'}`}>
                {passwordValidation.number ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                <span>At least one number</span>
            </div>
            <div className={`flex items-center ${passwordValidation.specialChar ? 'text-emerald-500' : 'text-amber-500'}`}>
                {passwordValidation.specialChar ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                <span>At least one special character</span>
            </div>
        </div>
    ), [passwordValidation]);

    if (showForgotPassword) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 relative overflow-hidden"
            >
                {/* Luxury decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full opacity-20 filter blur-3xl"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-100 rounded-full opacity-20 filter blur-3xl"></div>
                </div>

                {/* Home button */}
                <button 
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 z-10 flex items-center space-x-2 bg-white/90 hover:bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                    <FaHome className="text-blue-600" />
                    <span className="font-medium text-gray-700">Home</span>
                </button>

                {/* Luxury card container */}
                <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden relative z-10 border border-gray-200/70">
                    {/* Premium header with subtle texture */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
                        <FaUserShield className="mx-auto text-4xl text-white mb-4 drop-shadow-lg" />
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
                        <p className="text-blue-100 font-light">
                            Enter your details to reset your password
                        </p>
                    </div>
                    
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start">
                                <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg flex items-start">
                                <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-emerald-700">{success}</p>
                            </div>
                        )}

                        {!resetToken ? (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FaEnvelope />
                                        </div>
                                        <input
                                            type="email"
                                            value={emailForReset}
                                            onChange={(e) => setEmailForReset(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleForgotPassword}
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center shadow-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : 'Send Reset Link'}
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider">
                                        New Password
                                        {formData.password && (
                                            <span className="ml-2 text-xs font-normal">
                                                {passwordValidation.isValid ? (
                                                    <span className="text-emerald-500">✓ Strong password</span>
                                                ) : (
                                                    <span className="text-amber-500">✗ Requires improvement</span>
                                                )}
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FaLock />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    {formData.password && <PasswordValidationChecklist />}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !passwordValidation.isValid}
                                    className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center shadow-md ${
                                        loading || !passwordValidation.isValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                                    }`}
                                >
                                    Reset Password
                                </button>
                            </form>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setResetToken('');
                                    setError('');
                                    setSuccess('');
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 relative overflow-hidden"
        >
            {/* Luxury decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full opacity-20 filter blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-100 rounded-full opacity-20 filter blur-3xl"></div>
            </div>

            {/* Home button */}
            <button 
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-10 flex items-center space-x-2 bg-white/90 hover:bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
            >
                <FaHome className="text-blue-600" />
                <span className="font-medium text-gray-700">Home</span>
            </button>

            {/* Luxury card container */}
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden relative z-10 border border-gray-200/70">
                {/* Premium header with subtle texture */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
                    <FaUserShield className="mx-auto text-4xl text-white mb-4 drop-shadow-lg" />
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{isLogin ? `${role} Login` : `Register ${role}`}</h1>
                    <p className="text-blue-100 font-light">
                        {isLogin ? 'Access your reception dashboard' : 'Join our professional team'}
                    </p>
                </div>
                
                {/* Form content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start">
                            <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg flex items-start">
                            <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-emerald-700">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FaUserShield />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider">Contact Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FaPhone />
                                        </div>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                                            placeholder="+1 (555) 123-4567"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <FaEnvelope />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Password
                                {!isLogin && formData.password && (
                                    <span className="ml-2 text-xs font-normal">
                                        {passwordValidation.isValid ? (
                                            <span className="text-emerald-500">✓ Strong password</span>
                                        ) : (
                                            <span className="text-amber-500">✗ Requires improvement</span>
                                        )}
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <FaLock />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {!isLogin && formData.password && <PasswordValidationChecklist />}
                        </div>

                        {isLogin && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (!isLogin && !passwordValidation.isValid)}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center shadow-md ${
                                loading || (!isLogin && !passwordValidation.isValid)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : isLogin ? (
                                <>
                                    <FaSignInAlt className="mr-2" />
                                    Sign In
                                </>
                            ) : (
                                <>
                                    <FaUserPlus className="mr-2" />
                                    Register
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                            {isLogin ? 'Need an account? Register here' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AuthReceptionist;