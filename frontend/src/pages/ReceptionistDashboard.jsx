import React, { useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
//receptionist dashboard component
const ReceptionistDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ReceptionistDashboard component mounted');
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors from API...');
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
  
      const apiUrl = '/receptionist/doctors';
      console.log('API URL:', apiUrl);
      
      const response = await axiosInstance.get(apiUrl);
      
      console.log('Doctors API response:', response.data);
      
      if (response.data.success) {
        console.log(`Setting ${response.data.data.length} doctors in state`);
        setDoctors(response.data.data);
        
        // Check if doctors array is empty
        if (response.data.data.length === 0) {
          console.warn('No doctors returned from API');
          toast.warning('No doctors available at the moment');
        } else {
          console.log('Doctors data:', response.data.data);
        }
      } else {
        console.error('API returned success: false', response.data);
        setError('Failed to fetch doctors: ' + (response.data.message || 'Unknown error'));
        toast.error('Failed to fetch doctors: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to fetch doctors: ' + (error.response?.data?.message || error.message));
      toast.error('Failed to fetch doctors: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments from API...');
      const response = await axiosInstance.get('/receptionist/appointments');
      
      console.log('Appointments API response:', response.data);
      
      if (response.data.success) {
        setAppointments(response.data.data);
        console.log(`Set ${response.data.data.length} appointments in state`);
      } else {
        console.error('API returned success: false', response.data);
        setError('Failed to fetch appointments: ' + (response.data.message || 'Unknown error'));
        toast.error('Failed to fetch appointments: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to fetch appointments: ' + (error.response?.data?.message || error.message));
      toast.error('Failed to fetch appointments: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Receptionist Dashboard</h1>
      
      {/* Doctors Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Doctors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{doctor.username}</h3>
              <p className="text-gray-600">Specialization: {doctor.specialization}</p>
              <p className="text-sm text-gray-500">
                Appointment Duration: {doctor.appointmentDuration || 30} minutes
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Appointments Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id} className="border-b">
                  <td className="px-6 py-4">{appointment.patientId?.name}</td>
                  <td className="px-6 py-4">{appointment.doctorId?.username}</td>
                  <td className="px-6 py-4">
                    {new Date(appointment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
// export the ReceptionistDashborad
export default ReceptionistDashboard; 