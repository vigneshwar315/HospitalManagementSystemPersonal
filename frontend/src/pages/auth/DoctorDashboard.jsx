import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  FiUser, FiCalendar, FiFileText, FiBell, FiLogOut, 
  FiSearch, FiPlus, FiDownload, FiClock, 
  FiCheckCircle, FiXCircle, FiAlertCircle, FiUpload 
} from 'react-icons/fi';
import { 
  FaUserMd, FaProcedures, FaPills, FaUserInjured,
  FaChartLine, FaClinicMedical, FaNotesMedical, FaStethoscope
} from 'react-icons/fa';
import { RiMedicineBottleLine } from 'react-icons/ri';
import { BsGraphUp, BsFileMedical } from 'react-icons/bs';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [completingId, setCompletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalAppointments: 0,
    patientsToday: 0,
    pendingPrescriptions: 0,
    completedVisits: 0,
    cancellationRate: '0%',
    averageRating: 0
  });
  const [loading, setLoading] = useState({
    appointments: true,
    patients: true,
    stats: true,
    notifications: true,
    prescriptions: true
  });
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    medications: [],
    diagnosis: '',
    notes: '',
    file: null,
    generatedFileName: null
  });
  const [prescriptionFilter, setPrescriptionFilter] = useState('all');

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/doctor/me');
        setUser(response.data);
      } catch (error) {
        toast.error('Failed to load user data');
        console.error(error);
      }
    };
  
    fetchUserData();
  }, []);

  // Fetch prescriptions
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(prev => ({ ...prev, prescriptions: true }));
        const response = await axios.get('/doctor/prescriptions');
        setPrescriptions(response.data || []);
      } catch (error) {
        toast.error('Failed to load prescriptions');
        setPrescriptions([]);
      } finally {
        setLoading(prev => ({ ...prev, prescriptions: false }));
      }
    };
  
    if (activeTab === 'prescriptions') {
      fetchPrescriptions();
    }
  }, [activeTab]);
  
  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(prev => ({ ...prev, appointments: true }));
        const response = await axios.get('/doctor/appointments');
        setAppointments(response.data || []);
      } catch (error) {
        setAppointments([]);
        if (error.response?.status !== 404) {
          toast.error('Failed to load appointments');
        }
      } finally {
        setLoading(prev => ({ ...prev, appointments: false }));
      }
    };
  
    if (activeTab === 'dashboard' || activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(prev => ({ ...prev, stats: true }));
        const response = await axios.get('/doctor/stats');
        setStats(response.data);
      } catch (error) {
        toast.error('Failed to load statistics');
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };
  
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(prev => ({ ...prev, notifications: true }));
        const response = await axios.get('/doctor/notifications');
        setNotifications(response.data.notifications || []);
      } catch (error) {
        setNotifications([]);
        if (error.response?.status !== 404) {
          toast.error('Failed to load notifications');
        }
      } finally {
        setLoading(prev => ({ ...prev, notifications: false }));
      }
    };
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  // Fetch patients for sidebar (only booked patients)
  useEffect(() => {
    const fetchSidebarPatients = async () => {
      try {
        setLoading(prev => ({ ...prev, patients: true }));
        const response = await axios.get('/doctor/patients/booked');
        setPatients(response.data);
      } catch (error) {
        toast.error('Failed to load patients');
      } finally {
        setLoading(prev => ({ ...prev, patients: false }));
      }
    };
    if (activeTab === 'patients') {
      fetchSidebarPatients();
    }
  }, [activeTab, searchTerm]);

  // Fetch patients for prescription dropdown (only booked patients)
  useEffect(() => {
    const fetchPrescriptionPatients = async () => {
      try {
        const response = await axios.get('/doctor/patients/booked');
        setPatients(response.data);
      } catch (error) {
        toast.error('Failed to load patients for prescription');
      }
    };
    if (activeTab === 'prescriptions') {
      fetchPrescriptionPatients();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      setCompletingId(appointmentId);
      
      // Optimistic UI update
      setAppointments(prev => prev.map(appt => 
        appt._id === appointmentId ? { ...appt, status: 'Completed' } : appt
      ));

      await axios.put(`/doctor/appointments/${appointmentId}/complete`);
      
      toast.success('Appointment marked as completed');
      
      // Refresh appointments list
      const appointmentsRes = await axios.get('/doctor/appointments');
      setAppointments(appointmentsRes.data || []);
      
      // Refresh notifications
      const notificationsRes = await axios.get('/doctor/notifications');
      setNotifications(notificationsRes.data.notifications || []);
      
    } catch (error) {
      // Revert on error
      setAppointments(prev => prev.map(appt => 
        appt._id === appointmentId ? { ...appt, status: 'Scheduled' } : appt
      ));
      
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
      console.error("Complete appointment error:", error);
    } finally {
      setCompletingId(null);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(`/doctor/notifications/read/${notificationId}`);
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification._id === notificationId ? { ...notification, read: true } : notification
      ));
      
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(prev => ({ ...prev, prescriptions: true }));
      const response = await axios.get('/doctor/prescriptions');
      setPrescriptions(response.data || []);
    } catch (error) {
      console.error("Prescription fetch error:", error);
      toast.error(error.response?.data?.message || 'Failed to load prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(prev => ({ ...prev, prescriptions: false }));
    }
  };
  const handleSearchPatient = async () => {
    try {
      setLoading(prev => ({ ...prev, patients: true }));
      const response = await axios.get(`/doctor/patients/${searchTerm}`);
      setPatients([response.data]);
    } catch (error) {
      toast.error('Patient not found');
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Find the latest appointment for this patient
      const appointmentResponse = await axios.get(`/doctor/appointments?patientId=${newPrescription.patientId}&status=Scheduled`);
      const latestAppointment = appointmentResponse.data[0];
      
      if (!latestAppointment) {
        toast.error('No scheduled appointment found for this patient');
        return;
      }

      let generatedFileName = newPrescription.generatedFileName || null;
      if (!newPrescription.file && !generatedFileName) {
        const pdfResponse = await axios.post('/doctor/prescriptions/generate', {
          patientId: newPrescription.patientId,
          appointmentId: latestAppointment._id,
          diagnosis: newPrescription.diagnosis,
          medications: newPrescription.medications,
          notes: newPrescription.notes
        });
        generatedFileName = pdfResponse.data.fileName;
        setNewPrescription(prev => ({ ...prev, generatedFileName }));
      }

      const formData = new FormData();
      formData.append('patientId', newPrescription.patientId);
      formData.append('appointmentId', latestAppointment._id);
      formData.append('diagnosis', newPrescription.diagnosis);
      formData.append('medications', JSON.stringify(newPrescription.medications));
      formData.append('notes', newPrescription.notes);
      if (newPrescription.file) {
        formData.append('prescription', newPrescription.file);
      } else if (generatedFileName) {
        formData.append('fileName', generatedFileName);
      }

      const response = await axios.post('/doctor/prescriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Prescription created successfully');
      setNewPrescription({
        patientId: '',
        medications: [],
        diagnosis: '',
        notes: '',
        file: null,
        generatedFileName: null
      });
      
      // Mark the appointment as completed
      await axios.put(`/doctor/appointments/${latestAppointment._id}/complete`);
      
      // Refresh prescriptions and appointments
      fetchPrescriptions();
      fetchAppointments();
      
    } catch (error) {
      console.error('Create prescription error:', error);
      toast.error(error.response?.data?.message || 'Error creating prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (appointmentId) => {
    try {
      // Find the appointment in the current list
      const appointment = appointments.find(a => a._id === appointmentId);
      if (!appointment?.patient?.customId) {
        toast.error('Patient details not available');
        return;
      }

      // Fetch patient details using customId
      const response = await axios.get(`/doctor/patients/${appointment.patient.customId}`);
      if (response.data) {
        // Navigate to patient details page with the data
        navigate(`/doctor/patients/${appointment.patient.customId}`, { 
          state: { patient: response.data } 
        });
      } else {
        toast.error('Failed to fetch patient details');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Failed to fetch patient details');
    }
  };

  const generatePrescription = async (patientId) => {
    try {
      // Find the patient in the current list to get their customId
      const patient = patients.find(p => p._id === patientId);
      if (!patient?.customId) {
        toast.error('Patient ID not found');
        return;
      }

      const response = await axios.post(`/doctor/patients/generate-prescription/${patient.customId}`, {}, {
        responseType: 'blob'
      });

      if (response.data) {
        // Create a temporary link to download the PDF
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `prescription_${patient.customId}_${new Date().getTime()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.success('Prescription generated successfully');
        
        // Refresh prescriptions list
        const prescriptionsRes = await axios.get('/doctor/prescriptions');
        setPrescriptions(prescriptionsRes.data || []);
        
        // Update stats
        const statsRes = await axios.get('/doctor/stats');
        setStats(statsRes.data);
      }
    } catch (error) {
      toast.error('Failed to generate prescription');
      console.error(error);
    }
  };

  const downloadPrescription = async (prescriptionId) => {
    try {
      const response = await axios.get(`/doctor/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob' // Important for file downloads
      });
  
      // Create a temporary link to download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download prescription');
      console.error(error);
    }
  };
  
  const clearAllNotifications = async () => {
    try {
      await axios.delete('/doctor/notifications/clear');
      setNotifications([]);
      toast.success('Notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'lab': return <FaProcedures className="text-blue-500" />;
      case 'appointment': return <FiCalendar className="text-purple-500" />;
      case 'prescription': return <RiMedicineBottleLine className="text-green-500" />;
      default: return <FiBell className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderPrescriptionsTab = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Prescriptions</h1>
        <button 
          onClick={() => document.getElementById('new-prescription-modal').showModal()}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all"
        >
          <FiPlus className="mr-2" />
          New Prescription
        </button>
      </div>

      {/* New Prescription Modal */}
      <dialog id="new-prescription-modal" className="modal">
        <div className="modal-box bg-white max-w-4xl rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <h3 className="font-bold text-2xl">Create New Prescription</h3>
            <p className="text-white/90">Fill out the form to generate a new prescription</p>
          </div>
          <form onSubmit={handleCreatePrescription} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select
                  value={newPrescription.patientId}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} (ID: {patient.customId})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                <input
                  type="text"
                  value={newPrescription.diagnosis}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Medications</label>
                <button
                  type="button"
                  onClick={() => setNewPrescription(prev => ({ ...prev, medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }] }))}
                  className="text-primary hover:text-secondary flex items-center"
                >
                  <FiPlus className="mr-1" />
                  Add Medication
                </button>
              </div>
              
              {newPrescription.medications.map((med, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => setNewPrescription(prev => ({
                        ...prev,
                        medications: prev.medications.map((m, i) => i === index ? { ...m, name: e.target.value } : m)
                      }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => setNewPrescription(prev => ({
                        ...prev,
                        medications: prev.medications.map((m, i) => i === index ? { ...m, dosage: e.target.value } : m)
                      }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => setNewPrescription(prev => ({
                        ...prev,
                        medications: prev.medications.map((m, i) => i === index ? { ...m, frequency: e.target.value } : m)
                      }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Duration</label>
                    <input
                      type="text"
                      value={med.duration || ''}
                      onChange={(e) => setNewPrescription(prev => ({
                        ...prev,
                        medications: prev.medications.map((m, i) => i === index ? { ...m, duration: e.target.value } : m)
                      }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewPrescription(prev => ({
                        ...prev,
                        medications: prev.medications.filter((_, i) => i !== index)
                      }))}
                      className="text-danger text-xs mt-1 flex items-center hover:text-red-700"
                    >
                      <FiXCircle className="mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {newPrescription.medications.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  No medications added yet
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={newPrescription.notes}
                onChange={(e) => setNewPrescription(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
      
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => document.getElementById('new-prescription-modal').close()}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                disabled={newPrescription.medications.length === 0}
              >
                <FiFileText className="mr-2 inline" />
                Generate Prescription
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Prescriptions List */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Recent Prescriptions</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPrescriptionFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  prescriptionFilter === 'all' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setPrescriptionFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  prescriptionFilter === 'pending' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Pending
              </button>
              <button 
                onClick={() => setPrescriptionFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  prescriptionFilter === 'completed' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
        
        {loading.prescriptions ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiFileText className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No prescriptions found</h3>
            <p className="text-gray-500 mt-1">Create your first prescription to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescriptions
                  .filter(prescription => {
                    if (prescriptionFilter === 'all') return true;
                    if (prescriptionFilter === 'pending') return prescription.status === 'Pending';
                    if (prescriptionFilter === 'completed') return prescription.status === 'Completed';
                    return true;
                  })
                  .map((prescription) => (
                    <tr key={prescription._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {prescription.patient?.avatar ? (
                              <img 
                                src={prescription.patient.avatar} 
                                alt={prescription.patient?.name} 
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <FiUser className="text-primary" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{prescription.patient?.name || 'Patient not found'}</div>
                            <div className="text-sm text-gray-500">ID: {prescription.patient?.customId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 line-clamp-2">{prescription.diagnosis}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {prescription.medications.length} medications
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          prescription.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => downloadPrescription(prescription._id)}
                          className="text-primary hover:text-secondary flex items-center"
                        >
                          <FiDownload className="mr-1" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderAppointmentActions = (appointment) => (
    <div className="flex space-x-2">
      {appointment.status === 'Scheduled' && (
        <button
          onClick={() => handleCompleteAppointment(appointment._id)}
          className={`text-green-600 hover:text-green-900 flex items-center ${
            completingId === appointment._id ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={completingId === appointment._id}
          title="Mark as complete"
        >
          {completingId === appointment._id ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <FiCheckCircle className="mr-1" />
          )}
          Complete
        </button>
      )}
      <button 
        onClick={() => handleViewDetails(appointment._id)}
        className="text-gray-600 hover:text-gray-900 flex items-center"
        title="View details"
      >
        <FiFileText className="mr-1" />
        Details
      </button>
    </div>
  );

  // Sidebar Component
  const Sidebar = () => (
    <div className="w-72 bg-gradient-to-b from-dark to-gray-900 text-white p-5 flex flex-col shadow-2xl">
    {user ? (
      <div className="flex items-center space-x-4 p-4 glass border border-white/10 rounded-xl mb-8">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-lg">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt="Doctor" 
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <FaUserMd className="text-2xl text-white" />
          )}
        </div>
        <div>
          <h2 className="font-bold text-lg text-gray-200">Dr. {user.username}</h2>
          <p className="text-sm text-gray-400">{user.specialization}</p>
          {user.experience && (
            <p className="text-xs text-gray-500 mt-1">
              {user.experience} years experience
            </p>
          )}
        </div>
      </div>
    ) : (
      <div className="h-20 mb-8 bg-white/10 rounded-xl animate-pulse glass"></div>
    )}

      <nav className="space-y-2 flex-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all ${
            activeTab === 'dashboard' 
              ? 'bg-primary/20 shadow-md text-white' 
              : 'hover:bg-white/10 hover:shadow-sm text-white/80'
          }`}
        >
          <FaChartLine className="text-lg" />
          <span>Dashboard</span>
        </button>
        
        <button
          onClick={() => setActiveTab('appointments')}
          className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all ${
            activeTab === 'appointments' 
              ? 'bg-primary/20 shadow-md text-white' 
              : 'hover:bg-white/10 hover:shadow-sm text-white/80'
          }`}
        >
          <FiCalendar className="text-lg" />
          <span>Appointments</span>
          {!loading.appointments && (
            <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">
              {appointments.filter(a => a.status === 'Scheduled').length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('patients')}
          className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all ${
            activeTab === 'patients' 
              ? 'bg-primary/20 shadow-md text-white' 
              : 'hover:bg-white/10 hover:shadow-sm text-white/80'
          }`}
        >
          <FaUserInjured className="text-lg" />
          <span>Patients</span>
        </button>
        
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all ${
            activeTab === 'prescriptions' 
              ? 'bg-primary/20 shadow-md text-white' 
              : 'hover:bg-white/10 hover:shadow-sm text-white/80'
          }`}
        >
          <FaNotesMedical className="text-lg" />
          <span>Prescriptions</span>
          {!loading.stats && stats.pendingPrescriptions > 0 && (
            <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">
              {stats.pendingPrescriptions}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('notifications')}
          className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all ${
            activeTab === 'notifications' 
              ? 'bg-primary/20 shadow-md text-white' 
              : 'hover:bg-white/10 hover:shadow-sm text-white/80'
          }`}
        >
          <FiBell className="text-lg" />
          <span>Notifications</span>
          {!loading.notifications && notifications.filter(n => !n.read).length > 0 && (
            <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex font-sans">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">The DeccanCare</h1>
              <div className="text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Appointments Card */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                      {loading.stats ? (
                        <div className="h-8 w-24 bg-gray-200 rounded mt-2 animate-pulse"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">
                          {stats.totalAppointments}
                        </h3>
                      )}
                      <p className="text-xs text-gray-400 mt-2">All time appointments</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                      <FiCalendar className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                 
<button 
  onClick={() => setActiveTab('appointments')}
  className="flex items-center text-sm text-primary hover:text-secondary cursor-pointer"
>
  <FiClock className="mr-1" />
  <span>View schedule</span>
</button>
                  </div>
                </div>
              </motion.div>

              {/* Patients Today Card */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patients Today</p>
                      {loading.stats ? (
                        <div className="h-8 w-24 bg-gray-200 rounded mt-2 animate-pulse"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">
                          {stats.patientsToday}
                        </h3>
                      )}
                      <p className="text-xs text-gray-400 mt-2">Scheduled for today</p>
                    </div>
                    <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                      <FaUserInjured className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                 
<button 
  onClick={() => setActiveTab('patients')}
  className="flex items-center text-sm text-accent hover:text-accent/80 cursor-pointer"
>
  <FaNotesMedical className="mr-1" />
  <span>View Patients</span>
</button>
                  </div>
                </div>
              </motion.div>

              {/* Pending Prescriptions Card */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Prescriptions</p>
                      {loading.stats ? (
                        <div className="h-8 w-24 bg-gray-200 rounded mt-2 animate-pulse"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">
                          {stats.pendingPrescriptions}
                        </h3>
                      )}
                      <p className="text-xs text-gray-400 mt-2">Require your attention</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-lg text-accent">
                      <FaPills className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                
<button 
  onClick={() => setActiveTab('prescriptions')}
  className="flex items-center text-sm text-accent hover:text-accent/80 cursor-pointer"
>
  <FaNotesMedical className="mr-1" />
  <span>Complete prescriptions</span>
</button>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Recent Appointments */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">Recent Appointments</h2>
                <button 
                  onClick={() => setActiveTab('appointments')}
                  className="text-primary hover:text-secondary font-medium flex items-center"
                >
                  View All
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {loading.appointments ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.slice(0, 5).map((appointment) => (
                        <tr key={appointment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {appointment.patient?.avatar ? (
                                  <img 
                                    src={appointment.patient.avatar} 
                                    alt={appointment                                    .patient?.name} 
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <FiUser className="text-primary" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.patient?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {appointment.patient?.customId || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(appointment.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {renderAppointmentActions(appointment)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'appointments' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search appointments..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-600">Scheduled</h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {appointments.filter(a => a.status === 'Scheduled').length}
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-600">Completed</h3>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {appointments.filter(a => a.status === 'Completed').length}
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-600">Cancelled</h3>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    {appointments.filter(a => a.status === 'Cancelled').length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {loading.appointments ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {appointment.patient?.avatar ? (
                                  <img 
                                    src={appointment.patient.avatar} 
                                    alt={appointment.patient?.name} 
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <FiUser className="text-primary" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.patient?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.patient?.age ? `${appointment.patient.age} yrs` : 'Age not specified'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {new Date(appointment.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{appointment.reason || 'Not specified'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {renderAppointmentActions(appointment)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'patients' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
              <div className="flex mt-4 md:mt-0">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                <button
                  onClick={handleSearchPatient}
                  className="ml-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all"
                >
                  <FiSearch className="mr-2" />
                  Search
                </button>
              </div>
            </div>
            
            {loading.patients ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map((patient) => (
                  <motion.div
                    key={patient._id || patient.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {patient.avatar ? (
                            <img 
                              src={patient.avatar} 
                              alt={patient.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FiUser className="text-primary text-2xl" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{patient.name}</h3>
                          <p className="text-sm text-gray-500">ID: {patient.customId || patient.id}</p>
                          <p className="text-sm text-gray-500">
                            {patient.age ? `${patient.age} yrs` : 'Age not specified'} | {patient.gender || 'Gender not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Medical Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          {patient.conditions?.length > 0 ? (
                            patient.conditions.map((condition, index) => (
                              <span key={index} className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                                {condition}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No conditions recorded</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Last Visit</p>
                          <p className="text-sm font-medium">
                            {patient.lastVisit ? formatDate(patient.lastVisit) : 'No visits yet'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Next Appointment</p>
                          <p className="text-sm font-medium">
                            {patient.nextAppointment ? formatDate(patient.nextAppointment) : 'None scheduled'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => navigate(`/doctor/patients/${patient.customId.trim()}`)}
                          className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg text-sm flex items-center justify-center"
                        >
                          <FiFileText className="mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
              <button
                onClick={clearAllNotifications}
                className="text-danger hover:text-danger-dark text-sm font-medium flex items-center px-4 py-2 rounded-lg hover:bg-danger/10 transition-all"
                disabled={notifications.length === 0}
              >
                <FiXCircle className="mr-1" />
                Clear All
              </button>
            </div>
            
            {loading.notifications ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                <FiBell className="mx-auto text-4xl text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No notifications</h3>
                <p className="text-gray-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification._id || notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                      notification.read 
                        ? 'border-gray-200' 
                        : 'border-primary bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-lg ${
                        notification.read 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className={`font-medium ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markNotificationAsRead(notification._id || notification.id)}
                            className="mt-3 text-primary hover:text-primary-dark text-sm font-medium flex items-center"
                          >
                            Mark as read
                            <FiCheckCircle className="ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'prescriptions' && renderPrescriptionsTab()}
      </div>
    </div>
  );
};

export default DoctorDashboard;