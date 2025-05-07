import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaFileMedical, FaArrowLeft } from 'react-icons/fa';

const PatientPrescriptions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/patient/login');
      return;
    }

    const fetchPrescriptions = async () => {
      try {
        const response = await axios.get('/api/patient/prescriptions', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setPrescriptions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        toast.error('Failed to fetch prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center text-teal-600 hover:text-teal-700"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">My Prescriptions</h1>
        </div>

        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FaFileMedical className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any prescriptions yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {prescription.doctor?.name || 'Unknown Doctor'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(prescription.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-teal-100 text-teal-800">
                    {prescription.status}
                  </span>
                </div>
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700">Medications:</h4>
                  <ul className="mt-2 space-y-2">
                    {prescription.medications.map((med, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {med.name} - {med.dosage} ({med.frequency})
                      </li>
                    ))}
                  </ul>
                </div>
                {prescription.notes && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700">Notes:</h4>
                    <p className="mt-1 text-sm text-gray-600">{prescription.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions; 