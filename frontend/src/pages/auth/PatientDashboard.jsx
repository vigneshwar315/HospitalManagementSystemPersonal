import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaCalendarAlt, FaFileMedical, FaFlask, 
  FaHistory, FaBell, FaSignOutAlt, FaPlus,
  FaSearch, FaFilter, FaDownload, FaEdit,
  FaClock, FaCheckCircle, FaTimesCircle, FaChevronDown,
  FaStethoscope, FaPills, FaFilePdf, FaFileAlt, FaChevronRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { FiAlertCircle, FiChevronLeft } from 'react-icons/fi';

const PatientDashboard = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState({
    appointments: [],
    prescriptions: [],
    labReports: [],
    medicalHistory: []
  });
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    age: ''
  });

  // Appointment booking state
  const [bookingStep, setBookingStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    date: new Date(),
    time: '',
    notes: '',
    status: 'Scheduled'
  });
  const [bookingErrors, setBookingErrors] = useState({
    doctorId: '',
    date: '',
    time: ''
  });
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);

  // Add state for modal loading and error
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/patient/login');
      return;
    }

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        const [appointmentsRes, prescriptionsRes, labReportsRes, notificationsRes] = await Promise.all([
          axios.get(`/patient/appointments`),
          axios.get(`/patient/prescriptions`),
          axios.get(`/patient/lab-reports`),
          axios.get(`/patient/notifications`)
        ]);

        setPatientData({
          appointments: appointmentsRes.data || [],
          prescriptions: Array.isArray(prescriptionsRes.data.data)
            ? prescriptionsRes.data.data.map(p => ({
                ...p,
                doctor: p.doctor || (p.doctorId ? { name: p.doctorId.username, specialization: p.doctorId.specialization } : undefined)
              }))
            : [],
          labReports: labReportsRes.data || [],
          medicalHistory: []
        });

        setNotifications(notificationsRes.data || []);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [user, navigate]);

  // Fetch latest profile from backend
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError('');
      const res = await axios.get('/patient/profile');
      if (res.data && res.data.success && res.data.data) {
        setUser(res.data.data);
        setEditFormData({
          name: res.data.data.name || '',
          email: res.data.data.email || '',
          contactNumber: res.data.data.contactNumber || '',
          address: res.data.data.address || '',
          dateOfBirth: res.data.data.dateOfBirth ? new Date(res.data.data.dateOfBirth) : '',
          gender: res.data.data.gender || '',
          bloodGroup: res.data.data.bloodGroup || '',
          age: res.data.data.age || ''
        });
      }
    } catch (err) {
      setProfileError('Failed to fetch profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // On dashboard load, always fetch latest profile
  useEffect(() => {
    if (!user) {
      navigate('/patient/login');
      return;
    }
    fetchProfile();
    // eslint-disable-next-line
  }, [navigate]);

  // When opening modal, fetch latest profile
  useEffect(() => {
    if (showEditProfile) {
      fetchProfile();
    }
  }, [showEditProfile]);

  const handleUpdateProfile = async () => {
    setProfileError('');
    if (!editFormData.name || !editFormData.email || !editFormData.contactNumber) {
      setProfileError('Please fill in all required fields');
      return;
    }
    if (!editFormData.gender) {
      setProfileError('Please select a gender');
      return;
    }
    if (!editFormData.bloodGroup) {
      setProfileError('Please select a blood group');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormData.email)) {
      setProfileError('Please enter a valid email address');
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(editFormData.contactNumber)) {
      setProfileError('Please enter a valid 10-digit phone number');
      return;
    }
    setProfileLoading(true);
    try {
      const payload = { ...editFormData };
      if (payload.dateOfBirth instanceof Date && !isNaN(payload.dateOfBirth)) {
        payload.dateOfBirth = payload.dateOfBirth.toISOString();
      }
      if (payload.age !== undefined && payload.age !== '') {
        payload.age = Number(payload.age);
      }
      // Always include gender, bloodGroup, address
      payload.gender = editFormData.gender;
      payload.bloodGroup = editFormData.bloodGroup;
      payload.address = editFormData.address;
      const response = await axios.put('/patient/profile', payload);
      if (response.data && response.data.success) {
        toast.success('Profile updated successfully');
        setShowEditProfile(false);
        await fetchProfile(); // Refresh user context and form
      } else {
        setProfileError('Failed to update profile.');
      }
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsFetchingDoctors(true);
      const response = await axios.get('/doctor/available', {
        params: { date: new Date().toISOString().split('T')[0] }
      });

      if (response.data && response.data.success) {
        setDoctors(response.data.data || []);
      } else {
        toast.error('Failed to load doctors list');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error(error.response?.data?.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setIsFetchingDoctors(false);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return [];
      }

      const response = await axios.get(`/api/appointments/slots/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: { 
          date: date.toISOString().split('T')[0]
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setAvailableSlots(response.data);
      } else {
        toast.error('Failed to load available slots');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    }
  };

  const handleBookingChange = (name, value) => {
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (bookingErrors[name]) {
      setBookingErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Fetch slots when doctor or date changes
    if (name === 'doctorId' && value && bookingData.date) {
      fetchAvailableSlots(value, bookingData.date);
    } else if (name === 'date' && value && bookingData.doctorId) {
      fetchAvailableSlots(bookingData.doctorId, value);
    }
  };

  const validateBooking = () => {
    const newErrors = {};
    if (!bookingData.doctorId) newErrors.doctorId = 'Please select a doctor';
    if (!bookingData.date) newErrors.date = 'Please select a date';
    if (!bookingData.time) newErrors.time = 'Please select a time';
    
    setBookingErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookAppointment = async () => {
    try {
      if (!validateBooking()) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const appointmentData = {
        doctorId: bookingData.doctorId,
        patientId: user._id,
        date: bookingData.date.toISOString().split('T')[0],
        time: bookingData.time,
        notes: bookingData.notes || '',
        status: 'Scheduled'
      };

      const response = await axios.post('/api/appointments/book', appointmentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        toast.success('Appointment booked successfully');
        setActiveTab('appointments');
        
        // Update appointments list
        setPatientData(prev => ({
          ...prev,
          appointments: [...prev.appointments, response.data.appointment]
        }));
        
        // Reset booking data
        setBookingData({
          doctorId: '',
          date: new Date(),
          time: '',
          notes: '',
          status: 'Scheduled'
        });
        setBookingStep(1);
        setSelectedDoctor(null);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    }
  };

  const TimeSlot = ({ time, available }) => (
    <button
      type="button"
      className={`flex items-center justify-center px-4 py-2 rounded-lg border transition-all ${
        !available 
          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          : bookingData.time === time 
            ? 'border-indigo-500 bg-indigo-100 text-indigo-600 font-medium'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
      }`}
      onClick={() => available && handleBookingChange('time', time)}
      disabled={!available}
    >
      <FaClock className="mr-2" />
      {time}
      {!available ? (
        <FaTimesCircle className="ml-2 text-gray-500" />
      ) : bookingData.time === time ? (
        <FaCheckCircle className="ml-2 text-indigo-500" />
      ) : null}
    </button>
  );

  const filteredAppointments = patientData.appointments.filter(appt => 
    appt.doctor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrescriptions = patientData.prescriptions.filter(prescription => 
    prescription.doctor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.medications?.some(med => 
      med.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredLabReports = patientData.labReports.filter(report => 
    report.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.keys(report.results || {}).some(key => 
      key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FaUser className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Patient Portal
              </h1>
              <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
                <FaBell className="text-xl" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
            <button 
              onClick={() => logout()}
              className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-colors group"
            >
              <div className="relative">
                <FaSignOutAlt className="transition-transform group-hover:translate-x-1" />
                <span className="absolute -left-1 -top-1 w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </div>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[{ 
              icon: <FaCalendarAlt className="text-indigo-600" size={24} />,
              title: 'Upcoming Appointments',
              value: patientData.appointments.filter(a => new Date(a.date) > new Date()).length,
              color: 'from-indigo-100 to-indigo-200'
            },
            {
              icon: <FaFileMedical className="text-emerald-600" size={24} />,
              title: 'Active Prescriptions',
              value: patientData.prescriptions.filter(p => !p.completed).length,
              color: 'from-emerald-100 to-emerald-200'
            },
            {
              icon: <FaFlask className="text-amber-600" size={24} />,
              title: 'Pending Lab Reports',
              value: patientData.labReports.filter(r => !r.completed).length,
              color: 'from-amber-100 to-amber-200'
            },
            {
              icon: <FaBell className="text-rose-600" size={24} />,
              title: 'Unread Notifications',
              value: notifications.filter(n => !n.read).length,
              color: 'from-rose-100 to-rose-200'
            }].map((stat, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200 hover:border-slate-300 transition-all`}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white/50 backdrop-blur-sm shadow-inner">
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-slate-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Profile and Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border-2 border-white/20">
                    <FaUser className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{user?.name || 'Patient Name'}</h2>
                    <p className="text-sm text-white/80">Patient ID: {user?.customId || 'PAT-12345'}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-slate-600 w-24">Age:</span>
                    <span className="font-medium text-slate-800">{user?.age !== undefined && user?.age !== null && user?.age !== '' ? user.age : '--'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-600 w-24">Gender:</span>
                    <span className="font-medium text-slate-800">{user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '--'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-600 w-24">Blood Group:</span>
                    <span className="font-medium text-slate-800">{user?.bloodGroup ? user.bloodGroup : '--'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-600 w-24">Contact:</span>
                    <span className="font-medium text-slate-800">{user?.contactNumber || '--'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-600 w-24">Email:</span>
                    <span className="font-medium text-slate-800">{user?.email || '--'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab('book-appointment');
                      setBookingStep(1);
                      fetchDoctors();
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                  >
                    <FaPlus className="text-white" />
                    <span>Book Appointment</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('medical-history')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                  >
                    <FaHistory className="text-white" />
                    <span>Medical History</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('prescriptions')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                  >
                    <FaFileMedical className="text-white" />
                    <span>My Prescriptions</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            {activeTab !== 'book-appointment' && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="relative w-full md:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Tabs */}
            {activeTab !== 'book-appointment' && (
              <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-slate-200">
                <div className="border-b border-slate-200">
                  <nav className="flex -mb-px">
                    {[
                      { id: 'dashboard', label: 'Dashboard', icon: <FaUser className="mr-2" /> },
                      { id: 'appointments', label: 'Appointments', icon: <FaCalendarAlt className="mr-2" /> },
                      { id: 'prescriptions', label: 'Prescriptions', icon: <FaFileMedical className="mr-2" /> },
                      { id: 'lab-reports', label: 'Lab Reports', icon: <FaFlask className="mr-2" /> },
                      { id: 'medical-history', label: 'Medical History', icon: <FaHistory className="mr-2" /> }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <div className="p-6">
                {activeTab === 'dashboard' && (
                  <div className="space-y-8">
                    {/* Upcoming Appointments */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h3>
                        <button 
                          onClick={() => setActiveTab('appointments')}
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          View All
                        </button>
                      </div>
                      {filteredAppointments.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-white">
                          <FaCalendarAlt className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                          <h3 className="text-sm font-medium text-slate-600">No upcoming appointments</h3>
                          <p className="text-xs text-slate-500 mt-1">Book an appointment to get started</p>
                        </div>
                      ) : (
                        filteredAppointments
                          .filter(a => new Date(a.date) > new Date())
                          .slice(0, 3)
                          .map(appointment => (
                            <motion.div
                              key={appointment._id}
                              whileHover={{ scale: 1.02 }}
                              className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-slate-800">Dr. {appointment.doctor?.name || appointment.doctor?.username || 'Unknown Doctor'}</h4>
                                  <p className="text-sm text-slate-600">{appointment.doctor?.specialization}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                  appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {appointment.status}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center text-sm text-slate-600">
                                <FaClock className="mr-2 text-slate-400" />
                                <span>{new Date(appointment.date).toLocaleString()}</span>
                              </div>
                              {appointment.notes && (
                                <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">{appointment.notes}</p>
                              )}
                            </motion.div>
                          ))
                      )}
                    </div>

                    {/* Recent Prescriptions */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Recent Prescriptions</h3>
                        <button 
                          onClick={() => setActiveTab('prescriptions')}
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          View All
                        </button>
                      </div>
                      {filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-white">
                          <FaFileMedical className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                          <h3 className="text-sm font-medium text-slate-600">No prescriptions</h3>
                          <p className="text-xs text-slate-500 mt-1">Your doctor will provide prescriptions after your appointment</p>
                        </div>
                      ) : (
                        filteredPrescriptions.slice(0, 3).map(prescription => (
                          <motion.div
                            key={prescription._id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">Dr. {prescription.doctor?.name || prescription.doctor?.username || 'Unknown Doctor'}</h4>
                                <p className="text-sm text-slate-600">
                                  {prescription.createdAt
                                    ? `${new Date(prescription.createdAt).toLocaleDateString()} ${new Date(prescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : prescription.date
                                      ? `${new Date(prescription.date).toLocaleDateString()}${prescription.date ? ' ' + new Date(prescription.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                                      : '--'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDownloadReport(prescription._id, 'prescription')}
                                className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                              >
                                <FaDownload />
                              </button>
                            </div>
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Medications:</h5>
                              <ul className="space-y-2 bg-slate-50 rounded-lg p-3">
                                {prescription.medications?.map((med, index) => (
                                  <li key={index} className="text-sm text-slate-600 flex items-center">
                                    <FaPills className="mr-2 text-indigo-500" />
                                    {med.name} - {med.dosage} ({med.frequency})
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {prescription.notes && (
                              <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">{prescription.notes}</p>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-slate-800">All Appointments</h3>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveTab('book-appointment');
                          setBookingStep(1);
                          fetchDoctors();
                        }}
                        className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                      >
                        <FaPlus />
                        <span>New Appointment</span>
                      </motion.button>
                    </div>

                    <div className="space-y-4">
                      {filteredAppointments.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                          <FaCalendarAlt className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                          <h3 className="text-lg font-medium text-slate-600">No appointments found</h3>
                          <p className="text-sm text-slate-500 mt-2">Book your first appointment to get started</p>
                        </div>
                      ) : (
                        filteredAppointments.map(appointment => (
                          <motion.div
                            key={appointment._id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">Dr. {appointment.doctor?.name || appointment.doctor?.username || 'Unknown Doctor'}</h4>
                                <p className="text-sm text-slate-600">{appointment.doctor?.specialization}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-slate-600">
                              <FaClock className="mr-2 text-slate-400" />
                              <span>{new Date(appointment.date).toLocaleString()}</span>
                            </div>
                            {appointment.notes && (
                              <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">{appointment.notes}</p>
                            )}
                            {appointment.status === 'Scheduled' && (
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={() => {
                                    axios.put(`/appointments/${appointment._id}/cancel`)
                                      .then(() => {
                                        toast.success('Appointment cancelled');
                                        const updatedAppointments = patientData.appointments.map(a => 
                                          a._id === appointment._id ? {...a, status: 'Cancelled'} : a
                                        );
                                        setPatientData(prev => ({
                                          ...prev,
                                          appointments: updatedAppointments
                                        }));
                                      })
                                      .catch(error => {
                                        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
                                      });
                                  }}
                                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                                >
                                  Cancel Appointment
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'prescriptions' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-slate-800">All Prescriptions</h3>
                      <div className="flex items-center space-x-4">
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
                          <FaFilter className="mr-2" />
                          Filter
                        </button>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
                          <FaDownload className="mr-2" />
                          Export All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                          <FaFileMedical className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                          <h3 className="text-lg font-medium text-slate-600">No prescriptions found</h3>
                          <p className="text-sm text-slate-500 mt-2">Your prescriptions will appear here</p>
                        </div>
                      ) : (
                        filteredPrescriptions.map(prescription => (
                          <motion.div
                            key={prescription._id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">Dr. {prescription.doctor?.name || prescription.doctor?.username || 'Unknown Doctor'}</h4>
                                <p className="text-sm text-slate-600">
                                  {prescription.createdAt
                                    ? `${new Date(prescription.createdAt).toLocaleDateString()} ${new Date(prescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : prescription.date
                                      ? `${new Date(prescription.date).toLocaleDateString()}${prescription.date ? ' ' + new Date(prescription.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                                      : '--'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDownloadReport(prescription._id, 'prescription')}
                                className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                              >
                                <FaDownload />
                              </button>
                            </div>
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Medications:</h5>
                              <ul className="space-y-2 bg-slate-50 rounded-lg p-3">
                                {prescription.medications?.map((med, index) => (
                                  <li key={index} className="text-sm text-slate-600 flex items-center">
                                    <FaPills className="mr-2 text-indigo-500" />
                                    {med.name} - {med.dosage} ({med.frequency})
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {prescription.notes && (
                              <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">{prescription.notes}</p>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'lab-reports' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-slate-800">All Lab Reports</h3>
                      <div className="flex items-center space-x-4">
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
                          <FaFilter className="mr-2" />
                          Filter
                        </button>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
                          <FaDownload className="mr-2" />
                          Export All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredLabReports.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                          <FaFlask className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                          <h3 className="text-lg font-medium text-slate-600">No lab reports found</h3>
                          <p className="text-sm text-slate-500 mt-2">Your lab reports will appear here</p>
                        </div>
                      ) : (
                        filteredLabReports.map(report => (
                          <motion.div
                            key={report._id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">{report.testName}</h4>
                                <p className="text-sm text-slate-600">
                                  {new Date(report.date).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDownloadReport(report._id, 'lab-report')}
                                className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                              >
                                <FaDownload />
                              </button>
                            </div>
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Results:</h5>
                              <ul className="space-y-2 bg-slate-50 rounded-lg p-3">
                                {Object.entries(report.results || {}).map(([key, value], index) => (
                                  <li key={index} className="text-sm text-slate-600 flex items-center">
                                    <FaStethoscope className="mr-2 text-indigo-500" />
                                    {key}: {value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {report.notes && (
                              <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">{report.notes}</p>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'book-appointment' && (
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <button 
                        onClick={() => setActiveTab('appointments')}
                        className="mr-4 text-indigo-600 hover:text-indigo-800"
                      >
                        <FiChevronLeft className="inline" /> Back
                      </button>
                      <h2 className="text-xl font-semibold text-slate-800">Book New Appointment</h2>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-between items-center mb-6">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                            bookingStep > step 
                              ? 'bg-green-500 text-white' 
                              : bookingStep === step 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                          }`}>
                            {bookingStep > step ? <FaCheckCircle /> : step}
                          </div>
                          <span className="text-xs">
                            {step === 1 ? 'Select Doctor' : step === 2 ? 'Select Time' : 'Confirm'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Select Doctor */}
                    {bookingStep === 1 && (
                      <div className="bg-white rounded-lg p-6 border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Select a Doctor</h3>
                        
                        {isFetchingDoctors ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : doctors.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No doctors available at the moment.</p>
                            <button 
                              onClick={fetchDoctors}
                              className="mt-4 text-indigo-600 hover:text-indigo-700"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {doctors.map(doctor => (
                              <div 
                                key={doctor._id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                  bookingData.doctorId === doctor._id 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-gray-200 hover:border-indigo-300'
                                }`}
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  handleBookingChange('doctorId', doctor._id);
                                }}
                              >
                                <div className="flex items-center">
                                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                                    <FaUser className="text-indigo-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Dr. {doctor.username}</h4>
                                    <p className="text-sm text-slate-600">{doctor.specialization}</p>
                                    <div className="flex items-center mt-1 text-sm text-slate-500">
                                      <FaClock className="mr-1" />
                                      <span>Available: {doctor.availableDays?.join(', ')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {bookingErrors.doctorId && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <FiAlertCircle className="mr-1" /> {bookingErrors.doctorId}
                          </p>
                        )}

                        <div className="flex justify-end mt-6">
                          <button
                            onClick={() => {
                              if (!bookingData.doctorId) {
                                setBookingErrors({ ...bookingErrors, doctorId: 'Please select a doctor' });
                                return;
                              }
                              setBookingStep(2);
                              fetchAvailableSlots(bookingData.doctorId, bookingData.date);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Next: Select Date & Time <FaChevronRight className="inline ml-1" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Select Date & Time */}
                    {bookingStep === 2 && selectedDoctor && (
                      <div className="bg-white rounded-lg p-6 border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Select Date & Time</h3>
                        
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date</label>
                          <DatePicker
                            selected={bookingData.date}
                            onChange={(date) => handleBookingChange('date', date)}
                            minDate={new Date()}
                            filterDate={(date) => {
                              if (!selectedDoctor.availableDays) return true;
                              const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                              return selectedDoctor.availableDays.includes(day);
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          {bookingErrors.date && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <FiAlertCircle className="mr-1" /> {bookingErrors.date}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700">Available Time Slots</label>
                          {availableSlots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {availableSlots.map((slot) => (
                                <TimeSlot 
                                  key={slot.time} 
                                  time={slot.time} 
                                  available={slot.available} 
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <FiAlertCircle className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-yellow-700">
                                    No available slots for this date. Please try another date.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {bookingErrors.time && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <FiAlertCircle className="mr-1" /> {bookingErrors.time}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between mt-6">
                          <button
                            onClick={() => setBookingStep(1)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <FiChevronLeft className="inline mr-1" /> Back
                          </button>
                          <button
                            onClick={() => {
                              if (!bookingData.time) {
                                setBookingErrors({ ...bookingErrors, time: 'Please select a time slot' });
                                return;
                              }
                              setBookingStep(3);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Next: Confirm Details <FaChevronRight className="inline ml-1" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Confirm Appointment */}
                    {bookingStep === 3 && selectedDoctor && (
                      <div className="bg-white rounded-lg p-6 border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Confirm Appointment Details</h3>
                        
                        <div className="space-y-6">
                          <div className="flex items-start">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                              <FaUser className="text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Dr. {selectedDoctor.username}</h4>
                              <p className="text-sm text-slate-600">{selectedDoctor.specialization}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-500">Date</p>
                              <p className="font-medium">
                                {bookingData.date.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Time</p>
                              <p className="font-medium">{bookingData.time}</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                            <textarea
                              value={bookingData.notes}
                              onChange={(e) => handleBookingChange('notes', e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              rows="3"
                              placeholder="Any specific concerns or details..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-between mt-6">
                          <button
                            onClick={() => setBookingStep(2)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <FiChevronLeft className="inline mr-1" /> Back
                          </button>
                          <button
                            onClick={handleBookAppointment}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Confirm & Book Appointment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'medical-history' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Medical History</h3>
                      <button 
                        onClick={() => setActiveTab('medical-history')}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        View All
                      </button>
                    </div>
                    {/* Medical history content here */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-y-auto"
          >
            <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input 
                    type="text" 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input 
                    type="email" 
                    value={editFormData.email} 
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                  <input 
                    type="text" 
                    value={editFormData.contactNumber} 
                    onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <textarea 
                    rows="2"
                    value={editFormData.address} 
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                  <DatePicker
                    selected={editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth) : null}
                    onChange={(date) => setEditFormData({ ...editFormData, dateOfBirth: date })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Gender</label>
                  <select 
                    value={editFormData.gender} 
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Blood Group</label>
                  <select 
                    value={editFormData.bloodGroup} 
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={editFormData.age}
                    onChange={e => setEditFormData({ ...editFormData, age: e.target.value })}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              {profileError && <div className="text-red-600 text-sm mt-2">{profileError}</div>}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleUpdateProfile}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => setShowEditProfile(false)}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientDashboard;