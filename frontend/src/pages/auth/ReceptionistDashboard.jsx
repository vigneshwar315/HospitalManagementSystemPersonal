import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUserPlus, FiSearch, FiCalendar, FiUsers, 
  FiClock, FiSettings, FiLogOut 
} from 'react-icons/fi';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysAppointments: 0,
    pendingActions: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const menuItems = [
    { icon: <FiUserPlus />, label: 'Register Patient', path: '/register-patient' },
    { icon: <FiSearch />, label: 'Search Patient', path: '/search-patient' },
    { icon: <FiCalendar />, label: 'Appointments', path: '/book-appointments' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
    
        const [patientsRes, appointmentsRes] = await Promise.all([
          axios.get('/patients/count'),
          axios.get('/appointments', {
            params: {
              date: new Date().toISOString().split('T')[0],
              limit: 5,
              sort: '-date'
            }
          })
        ]);
    
        const appointments = appointmentsRes.data?.data || [];  // <--- Safely fallback to []
    
        const pendingActions = appointments.filter(
          appt => appt.status === 'Pending'
        ).length;
    
        setStats({
          totalPatients: patientsRes.data.count || 0,
          todaysAppointments: appointments.length,
          pendingActions
        });
    
        const formattedAppointments = appointments.map(appt => ({
          id: appt._id,
          patientName: appt.patientId?.name || 'N/A',
          doctorName: appt.doctorId?.username || 'N/A',
          time: appt.date ? new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          status: appt.status || 'Unknown'
        }));
    
        setRecentAppointments(formattedAppointments);
    
      } catch (error) {
        console.error('Error fetching dashboard data:', error.message || error);
      } finally {
        setLoading(false);
      }
    };
    

    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gradient-to-b from-primary to-secondary text-white">
          <div className="flex items-center justify-center h-16 px-4 border-b border-blue-400">
            <h1 className="text-xl font-bold">MediCare Admin</h1>
          </div>
          <div className="flex flex-col flex-grow p-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setActiveTab(item.label);
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === item.label ? 'bg-white text-primary' : 'text-white hover:bg-blue-600'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center w-full px-4 py-3 text-white hover:bg-blue-600 rounded-lg transition-all"
              >
                <FiLogOut className="mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                <span>RS</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="card p-6 bg-white rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-700">Total Patients</h3>
                  <div className="p-3 rounded-full bg-blue-100 text-primary">
                    <FiUsers className="text-xl" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                <p className="mt-2 text-sm text-gray-500">Registered in system</p>
              </div>

              <div className="card p-6 bg-white rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-700">Today's Appointments</h3>
                  <div className="p-3 rounded-full bg-indigo-100 text-secondary">
                    <FiCalendar className="text-xl" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">{stats.todaysAppointments}</p>
                <p className="mt-2 text-sm text-gray-500">Scheduled for today</p>
              </div>

              <div className="card p-6 bg-white rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-700">Pending Actions</h3>
                  <div className="p-3 rounded-full bg-red-100 text-danger">
                    <FiClock className="text-xl" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">{stats.pendingActions}</p>
                <p className="mt-2 text-sm text-gray-500">Requires attention</p>
              </div>

              {/* Quick Actions */}
              <div className="card col-span-1 md:col-span-2 lg:col-span-3 p-6 bg-white rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => navigate('/register-patient')}
                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-primary transition-all"
                  >
                    <div className="p-3 mb-2 rounded-full bg-blue-100 text-primary">
                      <FiUserPlus className="text-xl" />
                    </div>
                    <span className="text-sm font-medium">Register Patient</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/book-appointments')}
                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-secondary transition-all"
                  >
                    <div className="p-3 mb-2 rounded-full bg-indigo-100 text-secondary">
                      <FiCalendar className="text-xl" />
                    </div>
                    <span className="text-sm font-medium">New Appointment</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/search-patient')}
                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-success transition-all"
                  >
                    <div className="p-3 mb-2 rounded-full bg-green-100 text-success">
                      <FiSearch className="text-xl" />
                    </div>
                    <span className="text-sm font-medium">Find Patient</span>
                  </button>
                </div>
              </div>

              {/* Recent Appointments */}
              <div className="card col-span-1 md:col-span-2 lg:col-span-3 p-6 bg-white rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Appointments</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentAppointments.length > 0 ? (
                        recentAppointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.patientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.doctorName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                            No recent appointments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;