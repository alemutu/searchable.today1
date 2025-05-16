import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Activity, 
  FileText, 
  Pill, 
  AlertTriangle,
  Syringe,
  LineChart,
  ClipboardList,
  ArrowUpRight,
  FileBarChart2,
  FolderOpen,
  Microscope,
  FileImage,
  Hash
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: string;
  current_flow_step: string | null;
  medical_info: {
    allergies?: {
      allergen: string;
      reaction: string;
      severity: string;
    }[];
    chronicConditions?: string[];
    currentMedications?: {
      name: string;
      dosage: string;
      frequency: string;
    }[];
    bloodType?: string;
    smoker?: boolean;
    alcoholConsumption?: string;
  };
}

const PatientDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Generate a formatted patient ID
  const generatePatientId = () => {
    if (!patient) return '';
    
    // Use the UUID first 8 characters as a fallback
    const shortId = patient.id.slice(0, 8);
    
    // For demo purposes, we'll use a simple algorithm to generate a number
    // In a real system, this would be stored in the database
    const patientNumber = parseInt(patient.id.substring(0, 8), 16) % 1000;
    
    if (patientNumber <= 0) return shortId;
    
    const paddedNumber = String(patientNumber).padStart(6, '0');
    return `PT${paddedNumber}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <div className="flex flex-wrap items-center mt-1 text-gray-500">
                <User className="h-4 w-4 mr-1" />
                <span>{patient.gender}</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>{calculateAge(patient.date_of_birth)} years</span>
                <span className="mx-2">•</span>
                <Hash className="h-4 w-4 mr-1" />
                <span className="font-mono">{generatePatientId()}</span>
                <span className="mx-2">•</span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  patient.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button 
              onClick={() => navigate(`/patients/${patient.id}/consultation`)}
              className="btn btn-primary"
            >
              New Consultation
            </button>
            <button 
              onClick={() => navigate(`/patients/${patient.id}/triage`)}
              className="btn btn-outline"
            >
              Triage
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('medical_records')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'medical_records'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medical Records
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'appointments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Contact Information */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{patient.contact_number}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-gray-900">{patient.address}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{patient.emergency_contact.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3 ml-8">{patient.emergency_contact.relationship}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{patient.emergency_contact.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                {patient.medical_info && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
                      {patient.medical_info.bloodType && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Blood Type:</span>
                          <span className="text-gray-900 font-medium">{patient.medical_info.bloodType}</span>
                        </div>
                      )}
                      
                      {patient.medical_info.smoker !== undefined && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Smoker:</span>
                          <span className="text-gray-900">{patient.medical_info.smoker ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      
                      {patient.medical_info.alcoholConsumption && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Alcohol:</span>
                          <span className="text-gray-900">
                            {patient.medical_info.alcoholConsumption.charAt(0).toUpperCase() + 
                             patient.medical_info.alcoholConsumption.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Medical Summary */}
              <div className="md:col-span-2 space-y-6">
                {/* Allergies */}
                {patient.medical_info?.allergies && patient.medical_info.allergies.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Allergies</h3>
                      </div>
                      <Link to={`/patients/${patient.id}/allergies`} className="text-sm text-primary-600 hover:text-primary-800">
                        View All
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <div className="space-y-4">
                        {patient.medical_info.allergies.slice(0, 3).map((allergy, index) => (
                          <div key={index} className="flex items-start">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              allergy.severity === 'severe' || allergy.severity === 'life_threatening' 
                                ? 'bg-error-100 text-error-800' 
                                : 'bg-warning-100 text-warning-800'
                            } mr-3`}>
                              {allergy.severity.charAt(0).toUpperCase() + allergy.severity.replace('_', ' ').slice(1)}
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">{allergy.allergen}</p>
                              <p className="text-gray-500 text-sm">{allergy.reaction}</p>
                            </div>
                          </div>
                        ))}
                        {patient.medical_info.allergies.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{patient.medical_info.allergies.length - 3} more allergies
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chronic Conditions */}
                {patient.medical_info?.chronicConditions && patient.medical_info.chronicConditions.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <Activity className="h-5 w-5 text-warning-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Chronic Conditions</h3>
                      </div>
                      <Link to={`/patients/${patient.id}/medical-history`} className="text-sm text-primary-600 hover:text-primary-800">
                        View All
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <div className="space-y-2">
                        {patient.medical_info.chronicConditions.slice(0, 5).map((condition, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-warning-500 mr-3"></div>
                            <p className="text-gray-900">{condition}</p>
                          </div>
                        ))}
                        {patient.medical_info.chronicConditions.length > 5 && (
                          <p className="text-sm text-gray-500">
                            +{patient.medical_info.chronicConditions.length - 5} more conditions
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Medications */}
                {patient.medical_info?.currentMedications && patient.medical_info.currentMedications.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <Pill className="h-5 w-5 text-primary-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Current Medications</h3>
                      </div>
                      <Link to={`/patients/${patient.id}/prescriptions`} className="text-sm text-primary-600 hover:text-primary-800">
                        View All
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <div className="space-y-4">
                        {patient.medical_info.currentMedications.slice(0, 3).map((medication, index) => (
                          <div key={index} className="flex items-start">
                            <Pill className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                            <div>
                              <p className="text-gray-900 font-medium">{medication.name}</p>
                              <p className="text-gray-500 text-sm">{medication.dosage} - {medication.frequency}</p>
                            </div>
                          </div>
                        ))}
                        {patient.medical_info.currentMedications.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{patient.medical_info.currentMedications.length - 3} more medications
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'medical_records' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to={`/patients/${patient.id}/consultations`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <FileText className="h-8 w-8 text-primary-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Consultations</h3>
                  </div>
                  <p className="text-gray-600">View all consultation notes and diagnoses</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/prescriptions`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <Pill className="h-8 w-8 text-success-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Prescriptions</h3>
                  </div>
                  <p className="text-gray-600">View medication history and current prescriptions</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/lab-results`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <Microscope className="h-8 w-8 text-warning-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Lab Results</h3>
                  </div>
                  <p className="text-gray-600">View laboratory test results and reports</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/radiology`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <FileImage className="h-8 w-8 text-error-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Radiology</h3>
                  </div>
                  <p className="text-gray-600">View imaging studies and radiology reports</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/immunizations`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <Syringe className="h-8 w-8 text-accent-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Immunizations</h3>
                  </div>
                  <p className="text-gray-600">View vaccination history and schedule</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/allergies`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-error-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Allergies</h3>
                  </div>
                  <p className="text-gray-600">View documented allergies and reactions</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/vital-signs`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <Activity className="h-8 w-8 text-primary-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Vital Signs</h3>
                  </div>
                  <p className="text-gray-600">View vital signs history and trends</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/growth-charts`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <LineChart className="h-8 w-8 text-success-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Growth Charts</h3>
                  </div>
                  <p className="text-gray-600">View growth and development metrics</p>
                </Link>
                
                <Link to={`/patients/${patient.id}/medical-history`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <FileBarChart2 className="h-8 w-8 text-warning-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Medical History</h3>
                  </div>
                  <p className="text-gray-600">View past and current medical conditions</p>
                </Link>

                <Link to={`/patients/${patient.id}/documents`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <FolderOpen className="h-8 w-8 text-accent-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                  </div>
                  <p className="text-gray-600">View uploaded medical documents</p>
                </Link>

                <Link to={`/patients/${patient.id}/care-plans`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <ClipboardList className="h-8 w-8 text-primary-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Care Plans</h3>
                  </div>
                  <p className="text-gray-600">View treatment and care plans</p>
                </Link>

                <Link to={`/patients/${patient.id}/referrals`} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <ArrowUpRight className="h-8 w-8 text-error-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Referrals</h3>
                  </div>
                  <p className="text-gray-600">View specialist referrals</p>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
                <Link to={`/appointments/new?patientId=${patient.id}`} className="btn btn-primary btn-sm">
                  Schedule Appointment
                </Link>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No appointments found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
                <Link to={`/billing/new?patientId=${patient.id}`} className="btn btn-primary btn-sm">
                  Create Invoice
                </Link>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Services
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No billing records found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;