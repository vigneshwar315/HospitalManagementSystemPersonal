import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiUser, FiCalendar, FiPhone, FiMail, FiPlus } from 'react-icons/fi';
import axios from 'axios';

const SearchPatients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    gender: '',
    ageRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all patients initially
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/patients');
        
        // Handle different response formats
        let patientsData = [];
        if (Array.isArray(response.data)) {
          patientsData = response.data;
        } else if (response.data?.data) {
          patientsData = response.data.data;
        } else if (response.data?.patients) {
          patientsData = response.data.patients;
        } else if (response.data?.samplePatient) {
          // If only sample patient is returned, create mock data
          patientsData = Array(response.data.totalPatients || 1).fill(0).map((_, index) => ({
            ...response.data.samplePatient,
            _id: `${response.data.samplePatient._id}-${index}`,
            name: `Patient ${index + 1}`,
            email: `patient${index + 1}@example.com`,
            contactNumber: `934661250${index}`,
            gender: ['Male', 'Female', 'Other'][index % 3],
            age: 20 + index * 5,
            status: index % 2 === 0 ? 'Active' : 'Inactive'
          }));
        }

        setPatients(patientsData);
        setFilteredPatients(patientsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err.response?.data?.message || 'Failed to fetch patients');
        setPatients([]);
        setFilteredPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Search patients including ID search
  useEffect(() => {
    const searchPatients = () => {
      if (searchTerm.trim() === '') {
        setFilteredPatients(patients);
        return;
      }

      const term = searchTerm.toLowerCase();
      const results = patients.filter(patient =>
        patient.name?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.contactNumber?.includes(term) ||
        patient._id?.toLowerCase().includes(term) ||
        patient.customId?.toLowerCase().includes(term)
      );

      setFilteredPatients(results);
    };

    const timer = setTimeout(searchPatients, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, patients]);

  // Apply local filters to search results
  useEffect(() => {
    let results = [...patients];
    
    if (filters.gender) {
      results = results.filter(patient => patient.gender === filters.gender);
    }
    
    if (filters.status) {
      results = results.filter(patient => 
        patient.status === filters.status
      );
    }
    
    if (filters.ageRange) {
      const [min, max] = filters.ageRange.split('-').map(Number);
      results = results.filter(patient => 
        patient.age && patient.age >= min && patient.age <= max
      );
    }
    
    setFilteredPatients(results);
  }, [filters, patients]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      gender: '',
      ageRange: ''
    });
    setSearchTerm('');
    setFilteredPatients(patients);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Patient Records</h1>
          <button 
            onClick={() => navigate('/register-patient')}
            className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <FiPlus className="mr-2" />
            New Patient
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name, email, phone, or ID..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={filters.gender}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                  <select
                    name="ageRange"
                    value={filters.ageRange}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Ages</option>
                    <option value="0-17">0-17</option>
                    <option value="18-25">18-25</option>
                    <option value="26-35">26-35</option>
                    <option value="36-45">36-45</option>
                    <option value="46-100">46+</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredPatients.length}</span> patients
            </p>
            {(searchTerm || filters.status || filters.gender || filters.ageRange) && (
              <p className="text-sm text-gray-600">
                Filtered from <span className="font-medium">{patients.length}</span> total patients
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="px-6 pb-6 flex-grow overflow-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading patients...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {patient.customId || patient._id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                              <FiUser className="text-lg" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {patient.gender || 'N/A'}, {patient.age ? `${patient.age} yrs` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.email || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{patient.contactNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Blood Type: {patient.bloodType || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            patient.status === 'Active' ? 
                            'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {patient.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/patient-details/${patient._id}`)}
                            className="text-primary hover:text-primary-dark mr-4"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/book-appointments?patientId=${patient._id}`)}
                            className="text-secondary hover:text-secondary-dark"
                          >
                            Book
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No patients found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPatients;