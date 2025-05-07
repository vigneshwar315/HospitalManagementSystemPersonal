import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiUser, FiCalendar, FiFileText, FiArrowLeft, 
  FiDownload, FiClock, FiActivity, FiDroplet, FiHeart
} from 'react-icons/fi';
import { FaPills, FaNotesMedical, FaWeight, FaAllergies } from 'react-icons/fa';
import { GiMedicalPack, GiHealthNormal } from 'react-icons/gi';
import { BsClipboard2Pulse, BsDropletHalf } from 'react-icons/bs';
import { MdOutlineVaccines } from 'react-icons/md';

const PatientDetails = () => {
  const { customId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get(`/api/doctor/patients/${customId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setPatient(response.data);
      } catch (error) {
        console.error('Fetch error:', error.response);
        toast.error(error.response?.data?.message || 'Failed to load patient data');
        navigate('/doctor/patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [customId, navigate]);

  useEffect(() => {
    if (activeTab === 'prescriptions' && patient) {
      const fetchPrescriptions = async () => {
        try {
          const response = await axios.get(`/api/doctor/patients/${customId}/prescriptions`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          setPrescriptions(response.data);
        } catch (error) {
          console.error('Prescriptions error:', error.response);
          toast.error('Failed to load prescriptions');
        }
      };
      fetchPrescriptions();
    }
  }, [activeTab, customId, patient]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );
  
  if (!patient) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <GiMedicalPack className="mx-auto text-5xl text-primary mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Patient not found</h3>
        <button 
          onClick={() => navigate('/doctor/patients')}
          className="mt-6 bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center mx-auto"
        >
          <FiArrowLeft className="mr-2" /> Back to Patients
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-white bg-gradient-to-r from-primary to-indigo-600 px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg mb-6 transition-all"
      >
        <FiArrowLeft className="mr-2" /> Back to Patients
      </button>

      {/* Patient Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl shadow-2xl overflow-hidden mb-8 border border-white/20">
        <div className="p-8 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-lg">
            {patient.avatar ? (
              <img 
                src={patient.avatar} 
                alt={patient.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="text-4xl text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{patient.name}</h1>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
                ID: {patient.customId}
              </span>
              {patient.age && (
                <span className="text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
                  {patient.age} years
                </span>
              )}
              {patient.gender && (
                <span className="text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium capitalize">
                  {patient.gender}
                </span>
              )}
            </div>
          </div>
          
          {/* Vital Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            {patient.vitals?.bloodPressure && (
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
                <div className="flex items-center">
                  <FiActivity className="text-white mr-2 text-lg" />
                  <span className="text-sm font-medium text-white">Blood Pressure</span>
                </div>
                <p className="text-white font-bold text-xl mt-2">{patient.vitals.bloodPressure}</p>
              </div>
            )}
            
            {patient.vitals?.heartRate && (
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
                <div className="flex items-center">
                  <FiHeart className="text-white mr-2 text-lg" />
                  <span className="text-sm font-medium text-white">Heart Rate</span>
                </div>
                <p className="text-white font-bold text-xl mt-2">{patient.vitals.heartRate} <span className="text-sm">bpm</span></p>
              </div>
            )}
            
            {patient.vitals?.temperature && (
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
                <div className="flex items-center">
                  <BsDropletHalf className="text-white mr-2 text-lg" />
                  <span className="text-sm font-medium text-white">Temperature</span>
                </div>
                <p className="text-white font-bold text-xl mt-2">{patient.vitals.temperature}°F</p>
              </div>
            )}
            
            {patient.vitals?.weight && (
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
                <div className="flex items-center">
                  <FaWeight className="text-white mr-2 text-lg" />
                  <span className="text-sm font-medium text-white">Weight</span>
                </div>
                <p className="text-white font-bold text-xl mt-2">{patient.vitals.weight} <span className="text-sm">kg</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-white/20">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-5 px-8 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'overview'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <BsClipboard2Pulse className="mr-2 text-lg" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-5 px-8 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'prescriptions'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MdOutlineVaccines className="mr-2 text-lg" />
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-5 px-8 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'history'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <GiHealthNormal className="mr-2 text-lg" />
              Medical History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Medical Summary */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <BsClipboard2Pulse className="mr-3 text-white" />
                Medical Summary
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {patient.allergies?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                      <FaAllergies className="mr-2 text-red-500" />
                      Allergies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <span key={index} className="bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded-full border border-red-100">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {patient.chronicConditions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                      <GiHealthNormal className="mr-2 text-purple-500" />
                      Chronic Conditions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {patient.chronicConditions.map((condition, index) => (
                        <span key={index} className="bg-purple-50 text-purple-700 text-xs px-3 py-1.5 rounded-full border border-purple-100">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {patient.medications?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                      <FaPills className="mr-2 text-blue-500" />
                      Current Medications
                    </h3>
                    <div className="space-y-3">
                      {patient.medications.map((med, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-blue-800">{med.name}</p>
                              <p className="text-xs text-blue-600 mt-1">{med.dosage} • {med.frequency}</p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FiCalendar className="mr-3 text-white" />
                Upcoming Appointments
              </h2>
            </div>
            <div className="p-6">
              {patient.upcomingAppointments?.length > 0 ? (
                <div className="space-y-4">
                  {patient.upcomingAppointments.map(appt => (
                    <div 
                      key={appt._id} 
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {new Date(appt.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          appt.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">With:</span> Dr. {appt.doctorId?.name}
                        </p>
                        {appt.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Reason:</span> {appt.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <FiCalendar className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">No upcoming appointments scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-violet-600 to-violet-500 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MdOutlineVaccines className="mr-3 text-white" />
              Prescription History
            </h2>
          </div>
          <div className="p-6">
            {prescriptions.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medications</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prescriptions.map(prescription => (
                      <tr key={prescription._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(prescription.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {prescription.diagnosis}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {prescription.medications.slice(0, 3).map((med, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-100">
                                {med.name}
                              </span>
                            ))}
                            {prescription.medications.length > 3 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded border border-gray-200">
                                +{prescription.medications.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => window.open(`/api/prescriptions/${prescription._id}/download`, '_blank')}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center shadow hover:shadow-md"
                          >
                            <FiDownload className="mr-2" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <MdOutlineVaccines className="mx-auto text-5xl text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No prescriptions found</h3>
                <p className="text-gray-500 mt-1">This patient has no prescription history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <GiHealthNormal className="mr-3 text-white" />
              Complete Medical History
            </h2>
          </div>
          <div className="p-6">
            {patient.medicalHistory?.length > 0 ? (
              <div className="space-y-6">
                {patient.medicalHistory.map((record, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{record.diagnosis}</h3>
                        <div className="flex items-center mt-2">
                          <span className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()} • Dr. {record.doctorId?.name}
                          </span>
                          {record.doctorId?.specialization && (
                            <span className="ml-3 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              {record.doctorId.specialization}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {record.type === 'consultation' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Consultation
                          </span>
                        )}
                        {record.type === 'procedure' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Procedure
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {record.notes && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{record.notes}</p>
                      </div>
                    )}
                    
                    {record.treatment && (
                      <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Treatment</h4>
                        <p className="text-sm text-blue-600 whitespace-pre-line">{record.treatment}</p>
                      </div>
                    )}
                    
                    {record.followUp && (
                      <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-100">
                        <h4 className="text-sm font-medium text-green-700 mb-2">Follow Up</h4>
                        <p className="text-sm text-green-600 whitespace-pre-line">{record.followUp}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <GiHealthNormal className="mx-auto text-5xl text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No medical history recorded</h3>
                <p className="text-gray-500 mt-1">This patient has no recorded medical history</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;