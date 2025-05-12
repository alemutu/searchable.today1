import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, Eye, Activity, Stethoscope, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  current_flow_step: string | null;
  status: string;
  medical_info: any;
}

const PatientList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital, isDoctor } = useAuthStore();
  
  useEffect(() => {
    fetchPatients();
  }, [hospital]);
  
  const fetchPatients = async () => {
    if (!hospital) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('hospital_id', hospital.id)
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPatients = async () => {
    if (!searchTerm || !hospital) return;
    
    try {
      setIsLoading(true);
      
      // Use the search_patients function if the search term is complex
      if (searchTerm.length > 2) {
        const { data, error } = await supabase.rpc('search_patients', {
          search_term: searchTerm
        });
        
        if (error) throw error;
        setPatients(data || []);
      } else {
        // For simple searches, use the regular query
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('hospital_id', hospital.id)
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });
            
        if (error) throw error;
        setPatients(data || []);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredPatients = patients.filter(patient => {
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    return matchesFilter;
  });

  const getFlowStepColor = (step: string | null) => {
    switch (step) {
      case 'registration':
        return 'bg-gray-100 text-gray-800';
      case 'triage':
        return 'bg-warning-100 text-warning-800';
      case 'waiting_consultation':
        return 'bg-primary-100 text-primary-800';
      case 'consultation':
        return 'bg-secondary-100 text-secondary-800';
      case 'emergency':
        return 'bg-error-100 text-error-800';
      case 'post_consultation':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate a formatted patient ID based on hospital settings
  const generatePatientId = (patient: Patient) => {
    if (!hospital) return patient.id.slice(0, 8);
    
    // Use the UUID first 8 characters as a fallback
    const shortId = patient.id.slice(0, 8);
    
    // If we have hospital settings, try to format the ID
    if (hospital.patient_id_format) {
      const patientIndex = patients.findIndex(p => p.id === patient.id);
      const patientNumber = hospital.patient_id_last_number - patientIndex;
      
      if (patientNumber <= 0) return shortId;
      
      const paddedNumber = String(patientNumber).padStart(hospital.patient_id_digits || 6, '0');
      
      switch (hospital.patient_id_format) {
        case 'prefix_year_number':
          return `${hospital.patient_id_prefix || 'PT'}${new Date().getFullYear()}-${paddedNumber}`;
        case 'hospital_prefix_number':
          return `${hospital.subdomain.substring(0, 2).toUpperCase()}-${hospital.patient_id_prefix || 'PT'}-${paddedNumber}`;
        case 'custom':
          return `${hospital.patient_id_prefix || 'PT'}${paddedNumber}`;
        case 'prefix_number':
        default:
          return `${hospital.patient_id_prefix || 'PT'}${paddedNumber}`;
      }
    }
    
    return shortId;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPatients();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Link to="/patients/register" className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Patient
        </Link>
      </div>
      
      <div className="card">
        <div className="p-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <form onSubmit={handleSearch} className="relative flex-grow flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 flex-grow"
              placeholder="Search patients by name, contact, or medical info..."
            />
            <button type="submit" className="btn btn-primary ml-2">Search</button>
          </form>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Patients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age/Gender
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medical Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Step
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No patients found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-1" />
                        <div className="text-sm font-mono text-gray-600">
                          {generatePatientId(patient)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years
                      </div>
                      <div className="text-sm text-gray-500">{patient.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.contact_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {patient.medical_info?.allergies?.length > 0 && (
                          <div className="text-error-600 font-medium">
                            {patient.medical_info.allergies.length} Allerg{patient.medical_info.allergies.length === 1 ? 'y' : 'ies'}
                          </div>
                        )}
                        {patient.medical_info?.chronicConditions?.length > 0 && (
                          <div className="text-warning-600">
                            {patient.medical_info.chronicConditions.length} Chronic Condition{patient.medical_info.chronicConditions.length === 1 ? '' : 's'}
                          </div>
                        )}
                        {patient.medical_info?.currentMedications?.length > 0 && (
                          <div className="text-primary-600">
                            {patient.medical_info.currentMedications.length} Medication{patient.medical_info.currentMedications.length === 1 ? '' : 's'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFlowStepColor(patient.current_flow_step)}`}>
                        {patient.current_flow_step?.replace('_', ' ').charAt(0).toUpperCase() + 
                         patient.current_flow_step?.slice(1).replace('_', ' ') || 'Not Started'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${patient.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'}`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        {patient.current_flow_step === 'registration' && (
                          <Link
                            to={`/patients/${patient.id}/triage`}
                            className="text-warning-600 hover:text-warning-900"
                          >
                            <Activity className="h-5 w-5" />
                          </Link>
                        )}
                        {(patient.current_flow_step === 'waiting_consultation' || patient.current_flow_step === 'emergency') && isDoctor && (
                          <Link
                            to={`/patients/${patient.id}/consultation`}
                            className="text-secondary-600 hover:text-secondary-900"
                          >
                            <Stethoscope className="h-5 w-5" />
                          </Link>
                        )}
                        <button className="text-secondary-600 hover:text-secondary-900">
                          <FileText className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredPatients.length}</span> of{' '}
            <span className="font-medium">{patients.length}</span> patients
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-outline py-1 px-3">Previous</button>
            <button className="btn btn-outline py-1 px-3">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientList;