import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCalendar, FiClock, FiUser, FiSearch, FiCheck, FiX, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    date: new Date(),
    time: '',
    notes: '',
    status: 'Scheduled'
  });

  // Error states
  const [errors, setErrors] = useState({
    doctorId: '',
    patientId: '',
    date: '',
    time: ''
  });

  // Status options
  const statusOptions = [
    { value: 'Scheduled', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'Rescheduled', label: 'Rescheduled', color: 'bg-purple-100 text-purple-800' }
  ];

  // Fetch doctors with proper error handling
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsFetchingDoctors(true);
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          toast.error("Authentication required. Please login again.");
          navigate("/auth/receptionist");
          return;
        }

        // const response = await axios.get('/api/doctor', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //     'Content-Type': 'application/json'
        //   }
        // });
        // Use the correct endpoint for fetching available doctors
        const response = await axios.get('/api/doctors', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: { date: new Date().toISOString().split('T')[0] } // today by default
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
          const formattedDoctors = response.data.data.map(doctor => ({
            value: doctor.id || doctor._id,
            label: `${doctor.name || doctor.username || 'Doctor'} - ${doctor.specialization || ''}`.trim(),
            ...doctor
          }));
          setDoctors(formattedDoctors);
        } else {
          toast.warn("No doctors available. Please try again later.");
        }
      } catch (error) {
        console.error("Doctor fetch error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          navigate("/auth/receptionist");
        } else {
          toast.error(error.response?.data?.message || 'Failed to load doctors. Please try again.');
        }
      } finally {
        setIsFetchingDoctors(false);
      }
    };

    fetchDoctors();
  }, [navigate]);

  // Search patients with proper error handling
  const handleSearchPatients = async () => {
    if (!searchQuery.trim()) {
      toast.warn("Please enter a search query");
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication required. Please login again.");
        navigate("/auth/receptionist");
        return;
      }
  
      // Use the same endpoint pattern as SearchPatient.jsx
      const response = await axios.get('/api/patients', {
        params: { search: searchQuery },  // Changed from 'query' to 'search'
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      // Handle different response formats like SearchPatient.jsx does
      let patientsData = [];
      if (Array.isArray(response.data)) {
        patientsData = response.data;
      } else if (response.data?.data) {
        patientsData = response.data.data;
      }
  
      if (patientsData.length > 0) {
        const formattedPatients = patientsData.map(patient => ({
          value: patient._id,
          label: `${patient.name} (ID: ${patient.customId || patient._id})`,
          ...patient
        }));
        setPatients(formattedPatients);
      } else {
        toast.info("No patients found matching your search");
        setPatients([]);
      }
    } catch (error) {
      console.error("Patient search error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/auth/receptionist");
      } else {
        toast.error(error.response?.data?.message || 'Patient search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  // Fetch available slots with proper error handling
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication required. Please login again.");
          navigate("/auth/receptionist");
          return;
        }

        const dateStr = formData.date.toISOString().split('T')[0];
        const response = await axios.get(
          `/api/appointments/slots/${formData.doctorId}?date=${dateStr}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          setAvailableSlots(response.data.data);
        } else {
          setAvailableSlots([]);
          toast.info("No available slots for this date. Please try another date.");
        }
      } catch (error) {
        console.error("Slot fetch error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          navigate("/auth/receptionist");
        } else {
          toast.error(error.response?.data?.message || 'Failed to fetch available slots. Please try again.');
        }
        setAvailableSlots([]);
      }
    };

    if (formData.doctorId && formData.date) {
      fetchSlots();
    }
  }, [formData.doctorId, formData.date, navigate]);

  // Handle form input changes
  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.doctorId) newErrors.doctorId = 'Please select a doctor';
    if (!formData.patientId) newErrors.patientId = 'Please select a patient';
    if (!formData.date) newErrors.date = 'Please select a date';
    if (!formData.time) newErrors.time = 'Please select a time';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with proper error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) return;
      
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Session expired. Please login again.");
        navigate("/auth/receptionist");
        return;
      }

      // Prepare appointment data
      const appointmentData = {
        doctorId: formData.doctorId,
        patientId: formData.patientId,
        date: formData.date.toISOString(),
        time: formData.time,
        notes: formData.notes,
        status: formData.status
      };

      console.log("Submitting appointment:", appointmentData);

      const response = await axios.post(
        '/api/appointments/book',
        appointmentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Booking response:", response.data);
      toast.success("Appointment booked successfully!");
      
      setTimeout(() => {
        navigate('/receptionist/dashboard/appointments');
      }, 1500);
    } catch (error) {
      console.error("Booking error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/auth/receptionist");
      } else {
        toast.error(error.response?.data?.message || "Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Custom time slot component
  const TimeSlot = ({ time, available }) => (
    <button
      type="button"
      className={`flex items-center justify-center px-4 py-2 rounded-lg border transition-all ${
        !available 
          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          : formData.time === time 
            ? 'border-primary bg-primary-100 text-primary font-medium'
            : 'border-gray-300 hover:border-primary hover:bg-primary-50'
      }`}
      onClick={() => available && handleChange('time', time)}
      disabled={!available}
    >
      <FiClock className="mr-2" />
      {time}
      {!available ? (
        <FiX className="ml-2 text-gray-500" />
      ) : formData.time === time ? (
        <FiCheck className="ml-2 text-primary" />
      ) : null}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Book New Appointment</h1>
            <button 
              onClick={() => navigate('/receptionist/dashboard')}
              className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
            >
              <FiChevronLeft className="mr-1" /> Back to Dashboard
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-between mt-6">
            {[1, 2, 3].map((stepNumber) => (
              <div 
                key={stepNumber} 
                className={`flex flex-col items-center ${step >= stepNumber ? 'opacity-100' : 'opacity-50'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step > stepNumber 
                    ? 'bg-green-500' 
                    : step === stepNumber 
                      ? 'bg-white text-primary' 
                      : 'bg-white bg-opacity-20'
                }`}>
                  {step > stepNumber ? <FiCheck /> : stepNumber}
                </div>
                <span className="text-sm">
                  {stepNumber === 1 ? 'Patient' : stepNumber === 2 ? 'Schedule' : 'Confirm'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Patient Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Search Patient</label>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button 
                      type="button" 
                      onClick={handleSearchPatients}
                      disabled={!searchQuery.trim() || loading}
                      className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Searching...' : <FiSearch />}
                    </button>
                  </div>
                  {errors.patientId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1" /> {errors.patientId}
                    </p>
                  )}
                </div>

                {patients.length > 0 && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Select Patient</label>
                    <Select
                      options={patients}
                      onChange={(selected) => {
                        setSelectedPatient(selected);
                        handleChange('patientId', selected.value);
                      }}
                      placeholder="Select patient..."
                      className="basic-single"
                      classNamePrefix="select"
                      isLoading={loading}
                    />
                  </div>
                )}

                {selectedPatient && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-full mr-4">
                        <FiUser className="text-primary text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                        <p className="text-gray-600">ID: {selectedPatient.customId}</p>
                        <p className="text-gray-600">Phone: {selectedPatient.contactNumber}</p>
                        {selectedPatient.email && (
                          <p className="text-gray-600">Email: {selectedPatient.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.patientId}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      formData.patientId
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    Next: Select Doctor <FiChevronRight className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Doctor & Schedule Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Select Doctor</label>
                  <Select
                    options={doctors}
                    onChange={(selected) => {
                      if (!selected) {
                        setSelectedDoctor(null);
                        handleChange('doctorId', '');
                        return;
                      }
                      setSelectedDoctor({
                        _id: selected.value,
                        name: selected.name || selected.username || "Doctor",
                        username: selected.username,
                        specialization: selected.specialization,
                        availableDays: selected.availableDays
                      });
                      handleChange('doctorId', selected.value);
                    }}
                    value={doctors.find(d => d.value === formData.doctorId)}
                    placeholder={isFetchingDoctors ? "Loading doctors..." : "Select doctor..."}
                    isClearable
                    isSearchable
                    isLoading={isFetchingDoctors}
                    className="basic-single"
                    classNamePrefix="select"
                    noOptionsMessage={() => isFetchingDoctors ? "Loading..." : "No doctors available"}
                    loadingMessage={() => "Loading doctors..."}
                  />
                  {errors.doctorId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1" /> {errors.doctorId}
                    </p>
                  )}
                </div>

                {selectedDoctor && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-secondary-100 p-3 rounded-full mr-4">
                        <FiUser className="text-secondary text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Dr. {selectedDoctor.name}</h3>
                        <p className="text-gray-600">Specialization: {selectedDoctor.specialization}</p>
                        {selectedDoctor.availableDays && (
                          <p className="text-gray-600">
                            Available: {selectedDoctor.availableDays.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Select Date</label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => handleChange('date', date)}
                    minDate={new Date()}
                    filterDate={(date) => {
                      if (!selectedDoctor?.availableDays) return true;
                      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                      return selectedDoctor.availableDays.includes(day);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1" /> {errors.date}
                    </p>
                  )}
                </div>

                {formData.doctorId && formData.date && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Available Time Slots</label>
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
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1" /> {errors.time}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiChevronLeft className="inline mr-1" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.doctorId || !formData.time}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      formData.doctorId && formData.time
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    Next: Confirm Details <FiChevronRight className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Confirm Appointment Details</h3>
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Patient Details */}
                    <div>
                      <h4 className="font-medium text-gray-500 mb-2">PATIENT INFORMATION</h4>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center mb-3">
                          <div className="bg-primary-100 p-2 rounded-full mr-3">
                            <FiUser className="text-primary" />
                          </div>
                          <h5 className="font-semibold">{selectedPatient?.name}</h5>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>ID: {selectedPatient?.customId}</p>
                          <p>Phone: {selectedPatient?.contactNumber}</p>
                          {selectedPatient?.email && <p>Email: {selectedPatient.email}</p>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Doctor Details */}               
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-500 mb-2">DOCTOR DETAILS</h4>
                      <div className="flex items-center mb-3">
                        <div className="bg-secondary-100 p-2 rounded-full mr-3">
                          <FiUser className="text-secondary" />
                        </div>
                        <h5 className="font-semibold">
                          Dr. {selectedDoctor?.username || selectedDoctor?.name || 'Name not available'}
                        </h5>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Specialization: {selectedDoctor?.specialization || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-500 mb-2">APPOINTMENT DETAILS</h4>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">
                              {formData.date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">{formData.time}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <select
                              value={formData.status}
                              onChange={(e) => handleChange('status', e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label htmlFor="notes" className="block text-sm text-gray-500 mb-1">
                            Additional Notes
                          </label>
                          <textarea
                            id="notes"
                            rows={3}
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiChevronLeft className="inline mr-1" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;