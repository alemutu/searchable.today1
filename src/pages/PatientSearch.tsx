import React, { useState } from 'react';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../lib/store';
import { Search, User, AlertTriangle, Activity, FileText, Eye, Pill, Stethoscope, Hash, X, Loader2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  status: string;
  current_flow_step: string | null;
  medical_info: any;
}

const PatientSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'name' | 'id' | 'phone'>('all');
  const { addNotification } = useNotificationStore();
  const { data: patients, loading: isLoading, fetchItems } = useHybridStorage<Patient>('patients');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    setHasSearched(true);
    
    try {
      await fetchItems({ search: searchTerm });
      
      // Filter results based on search term and filter type
      const results = Array.isArray(patients) ? patients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        
        if (searchFilter === 'name') {
          return fullName.includes(searchTerm.toLowerCase());
        } else if (searchFilter === 'id') {
          return patient.id.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchFilter === 'phone') {
          return patient.contact_number.includes(searchTerm);
        }
        
        // 'all' filter - check all fields
        return fullName.includes(searchTerm.toLowerCase()) || 
               patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
               patient.contact_number.includes(searchTerm);
      }) : [];
      
      setSearchResults(results);
    } catch (error: any) {
      console.error('Error searching patients:', error);
      addNotification({
        message: `Error searching patients: ${error.message}`,
        type: 'error'
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setHasSearched(false);
    setSearchResults([]);
  };

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

  // Generate a formatted patient ID based on hospital settings
  const generatePatientId = (patient: Patient) => {
    // Use the UUID first 8 characters as a fallback
    const shortId = patient.id.slice(0, 8);
    
    // For demo purposes, we'll use a simple algorithm to generate a number
    // In a real system, this would be stored in the database
    const patientNumber = parseInt(patient.id.substring(0, 8), 16) % 1000;
    
    if (patientNumber <= 0) return shortId;
    
    const paddedNumber = String(patientNumber).padStart(6, '0');
    return `PT${paddedNumber}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Patient Search</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 pr-10 w-full transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 rounded-lg"
                placeholder="Search by name, ID, or phone number..."
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="relative md:w-1/4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value as 'all' | 'name' | 'id' | 'phone')}
                className="form-input pl-10 w-full border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 rounded-lg"
              >
                <option value="all">All Fields</option>
                <option value="name">Name</option>
                <option value="id">Patient ID</option>
                <option value="phone">Phone Number</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center justify-center transition-all duration-200"
              disabled={isLoading || !searchTerm}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search Patients
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {hasSearched && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Search Results</h2>
            {searchResults.length > 0 && (
              <span className="text-sm text-gray-500">
                Found {searchResults.length} {searchResults.length === 1 ? 'patient' : 'patients'}
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              <span className="ml-2 text-gray-600">Searching patient records...</span>
            </div>
          ) : searchResults.length === 0 && hasSearched ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
              <p className="text-gray-500 mb-4">No patients match your search criteria.</p>
              <Link to="/patients/register" className="btn btn-primary inline-flex items-center">
                <User className="h-5 w-5 mr-2" />
                Register a new patient
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medical Info
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
                  {searchResults.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {calculateAge(patient.date_of_birth)} years • {patient.gender}
                            </div>
                          </div>
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{patient.contact_number}</div>
                        {patient.email && (
                          <div className="text-sm text-gray-500">{patient.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {patient.medical_info?.allergies?.length > 0 && (
                            <div className="flex items-center text-error-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span>{patient.medical_info.allergies.length} Allerg{patient.medical_info.allergies.length === 1 ? 'y' : 'ies'}</span>
                            </div>
                          )}
                          {patient.medical_info?.chronicConditions?.length > 0 && (
                            <div className="flex items-center text-warning-600">
                              <Activity className="h-4 w-4 mr-1" />
                              <span>{patient.medical_info.chronicConditions.length} Condition{patient.medical_info.chronicConditions.length === 1 ? '' : 's'}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFlowStepColor(patient.current_flow_step)}`}>
                          {patient.current_flow_step?.replace('_', ' ').charAt(0).toUpperCase() + 
                           patient.current_flow_step?.slice(1).replace('_', ' ') || 'Not Started'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/patients/${patient.id}`}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded-full hover:bg-primary-50 transition-colors"
                            title="View Patient"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/patients/${patient.id}/consultation`}
                            className="text-secondary-600 hover:text-secondary-900 p-1 rounded-full hover:bg-secondary-50 transition-colors"
                            title="New Consultation"
                          >
                            <Stethoscope className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/pharmacy?patient=${patient.id}`}
                            className="text-success-600 hover:text-success-900 p-1 rounded-full hover:bg-success-50 transition-colors"
                            title="Prescriptions"
                          >
                            <Pill className="h-5 w-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Search className="h-8 w-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Search for a patient</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Enter a patient's name, ID, or phone number to find their records. You can also filter your search by specific fields.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/patients/register" className="btn btn-primary inline-flex items-center">
              <User className="h-5 w-5 mr-2" />
              Register New Patient
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;