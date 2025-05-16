import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  Search,
  CreditCard,
  Building2
} from 'lucide-react';

interface PatientFormData {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  patientType: string;
  paymentMethod: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    holderName: string;
    relationship: string;
  };
  conditionSeverity: string;
  visitPurpose: string;
  urgencyLevel: string;
  preferredDoctor: string;
}

interface SearchResult {
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
  medical_history: any;
}

const PatientRegistrationForm: React.FC = () => {
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);
  const [doctors, setDoctors] = useState<{id: string, name: string}[]>([]);

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      age: 0,
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      patientType: 'outpatient',
      paymentMethod: 'cash',
      conditionSeverity: 'mild',
      visitPurpose: 'consultation',
      urgencyLevel: 'low',
      preferredDoctor: ''
    }
  });

  const paymentMethod = useWatch({
    control,
    name: 'paymentMethod'
  });

  const patientType = useWatch({
    control,
    name: 'patientType'
  });

  useEffect(() => {
    // Generate a patient ID
    generatePatientId();
    
    // Fetch doctors for the dropdown
    fetchDoctors();
  }, [hospital]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'doctor');
        
      if (error) throw error;
      
      const formattedDoctors = data?.map(doc => ({
        id: doc.id,
        name: `Dr. ${doc.first_name} ${doc.last_name}`
      })) || [];
      
      setDoctors(formattedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const generatePatientId = () => {
    // Generate a random 8-digit patient ID
    const randomId = Math.floor(10000000 + Math.random() * 90000000);
    setPatientId(`PT${randomId}`);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Search by name, phone, or ID
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      addNotification({
        message: 'Error searching for patients',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectPatient = (patient: SearchResult) => {
    setSelectedPatient(patient);
    
    // Calculate age from date of birth
    const birthDate = new Date(patient.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Pre-fill the form with patient data
    reset({
      firstName: patient.first_name,
      lastName: patient.last_name,
      age: age,
      gender: patient.gender,
      contactNumber: patient.contact_number,
      email: patient.email || '',
      address: patient.address,
      emergencyContact: patient.emergency_contact,
      patientType: 'outpatient', // Default to outpatient for returning patients
      paymentMethod: 'cash', // Default payment method
      conditionSeverity: 'mild',
      visitPurpose: 'follow_up', // Default to follow-up for returning patients
      urgencyLevel: 'low',
      preferredDoctor: ''
    });
    
    // Show emergency contact section if it exists
    if (patient.emergency_contact && 
        (patient.emergency_contact.name || 
         patient.emergency_contact.phone || 
         patient.emergency_contact.relationship)) {
      setShowEmergencyContact(true);
    }
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
    
    addNotification({
      message: `Patient ${patient.first_name} ${patient.last_name} selected`,
      type: 'success'
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPatient(null);
  };

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    
    try {
      // If we're updating an existing patient
      if (selectedPatient) {
        // Calculate date of birth from age
        const today = new Date();
        today.setFullYear(today.getFullYear() - data.age);
        const dateOfBirth = today.toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('patients')
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            date_of_birth: dateOfBirth,
            gender: data.gender,
            contact_number: data.contactNumber,
            email: data.email,
            address: data.address,
            emergency_contact: data.emergencyContact,
            current_flow_step: 'registration',
            status: 'active',
            medical_history: {
              ...selectedPatient.medical_history,
              patientType: data.patientType,
              paymentMethod: data.paymentMethod,
              insuranceInfo: data.paymentMethod === 'insurance' ? data.insuranceInfo : null,
              conditionSeverity: data.conditionSeverity,
              visitPurpose: data.visitPurpose,
              urgencyLevel: data.urgencyLevel,
              preferredDoctor: data.preferredDoctor
            }
          })
          .eq('id', selectedPatient.id);
          
        if (error) throw error;
        
        addNotification({
          message: 'Patient information updated successfully',
          type: 'success'
        });
        
        navigate(`/patients/${selectedPatient.id}`);
      } else {
        // Calculate date of birth from age
        const today = new Date();
        today.setFullYear(today.getFullYear() - data.age);
        const dateOfBirth = today.toISOString().split('T')[0];
        
        // Create a new patient
        const { data: newPatient, error } = await supabase
          .from('patients')
          .insert([
            {
              first_name: data.firstName,
              last_name: data.lastName,
              date_of_birth: dateOfBirth,
              gender: data.gender,
              contact_number: data.contactNumber,
              email: data.email,
              address: data.address,
              emergency_contact: data.emergencyContact,
              current_flow_step: 'registration',
              status: 'active',
              medical_history: {
                patientType: data.patientType,
                paymentMethod: data.paymentMethod,
                insuranceInfo: data.paymentMethod === 'insurance' ? data.insuranceInfo : null,
                conditionSeverity: data.conditionSeverity,
                visitPurpose: data.visitPurpose,
                urgencyLevel: data.urgencyLevel,
                preferredDoctor: data.preferredDoctor
              }
            }
          ])
          .select()
          .single();
          
        if (error) throw error;
        
        addNotification({
          message: 'Patient registered successfully',
          type: 'success'
        });
        
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error registering patient: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTab = () => {
    setActiveTab(prev => Math.min(prev + 1, 3));
  };

  const prevTab = () => {
    setActiveTab(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-3">
        <button 
          onClick={() => navigate('/patients')}
          className="mr-3 p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Patient Registration</h1>
      </div>

      {/* Returning Patient Search */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Returning Patient?</h2>
        <p className="text-xs text-gray-500 mb-2">Please search for the patient using their name, phone number, or ID before proceeding.</p>
        
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 py-1.5 text-sm w-full"
              placeholder="Search by name, phone number, or ID"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim()}
            className="btn btn-primary py-1.5 text-sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="btn btn-outline py-1.5 text-sm"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Contact</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResults.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {patient.first_name} {patient.last_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {patient.id.substring(0, 8)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {patient.contact_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {searchResults.length === 0 && searchTerm && !isSearching && (
          <p className="mt-2 text-xs text-gray-500">No matching patients found. Please proceed with registration.</p>
        )}
        
        {selectedPatient && (
          <div className="mt-3 p-2 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-sm text-success-700">
              <span className="font-medium">Selected patient:</span> {selectedPatient.first_name} {selectedPatient.last_name}
            </p>
            <p className="text-xs text-success-600">
              The form has been pre-filled with this patient's information. You can update any details as needed.
            </p>
          </div>
        )}
      </div>

      {/* Patient ID Display */}
      <div className="mb-4 p-3 bg-primary-50 rounded-lg">
        <h2 className="text-sm font-medium text-primary-700 mb-1">Patient ID</h2>
        <p className="text-xs text-primary-600 mb-1">This unique identifier will be used for all patient records</p>
        <div className="flex items-center">
          <div className="bg-white px-3 py-1.5 rounded border border-primary-200 text-primary-700 font-mono text-sm">
            {selectedPatient ? selectedPatient.id.substring(0, 8) : patientId}
          </div>
          {!selectedPatient && (
            <button
              type="button"
              onClick={generatePatientId}
              className="ml-2 text-xs text-primary-600 hover:text-primary-800"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab(0)}
              className={`py-2 px-1 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 0
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Personal Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className={`py-2 px-1 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 1
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contact Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(2)}
              className={`py-2 px-1 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 2
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Priority Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(3)}
              className={`py-2 px-1 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 3
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Review
            </button>
          </nav>
        </div>

        {/* Personal Information */}
        {activeTab === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label required text-sm">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input pl-9 py-1.5 text-sm ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                </div>
                {errors.firstName && <p className="form-error text-xs">{errors.firstName.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`form-input py-1.5 text-sm ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.lastName && <p className="form-error text-xs">{errors.lastName.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Age</label>
                <input
                  type="number"
                  {...register('age', { 
                    required: 'Age is required',
                    min: { value: 0, message: 'Age must be at least 0' },
                    max: { value: 120, message: 'Age must be less than 120' }
                  })}
                  className={`form-input py-1.5 text-sm ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.age && <p className="form-error text-xs">{errors.age.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Gender</label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`form-input py-1.5 text-sm ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="form-error text-xs">{errors.gender.message}</p>}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextTab}
                className="btn btn-primary py-1.5 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label required text-sm">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register('contactNumber', { required: 'Phone number is required' })}
                    className={`form-input pl-9 py-1.5 text-sm ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                </div>
                {errors.contactNumber && <p className="form-error text-xs">{errors.contactNumber.message}</p>}
              </div>
              
              <div>
                <label className="form-label text-sm">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email', { 
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`form-input pl-9 py-1.5 text-sm ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="form-error text-xs">{errors.email.message}</p>}
              </div>
            </div>
            
            <div>
              <label className="form-label required text-sm">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className={`form-input pl-9 py-1.5 text-sm ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={2}
                />
              </div>
              {errors.address && <p className="form-error text-xs">{errors.address.message}</p>}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Emergency Contact (Optional)</h3>
                <button
                  type="button"
                  onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  {showEmergencyContact ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showEmergencyContact && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="form-label text-sm">Contact Name</label>
                    <input
                      type="text"
                      {...register('emergencyContact.name')}
                      className="form-input py-1.5 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="form-label text-sm">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship')}
                        className="form-input py-1.5 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Phone Number</label>
                      <input
                        type="tel"
                        {...register('emergencyContact.phone')}
                        className="form-input py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevTab}
                className="btn btn-outline py-1.5 text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={nextTab}
                className="btn btn-primary py-1.5 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Priority Information */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Priority Information</h2>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label required text-sm">Patient Type</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="outpatient"
                      value="outpatient"
                      {...register('patientType', { required: 'Patient type is required' })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="outpatient" className="ml-2 block text-sm text-gray-700">
                      Outpatient
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="inpatient"
                      value="inpatient"
                      {...register('patientType')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="inpatient" className="ml-2 block text-sm text-gray-700">
                      Inpatient
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="emergency"
                      value="emergency"
                      {...register('patientType')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="emergency" className="ml-2 block text-sm text-gray-700">
                      Emergency
                    </label>
                  </div>
                </div>
                {errors.patientType && <p className="form-error text-xs">{errors.patientType.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Condition Severity</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="mild"
                      value="mild"
                      {...register('conditionSeverity', { required: 'Condition severity is required' })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="mild" className="ml-2 block text-sm text-gray-700">
                      Mild
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="moderate"
                      value="moderate"
                      {...register('conditionSeverity')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="moderate" className="ml-2 block text-sm text-gray-700">
                      Moderate
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="severe"
                      value="severe"
                      {...register('conditionSeverity')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="severe" className="ml-2 block text-sm text-gray-700">
                      Severe
                    </label>
                  </div>
                </div>
                {errors.conditionSeverity && <p className="form-error text-xs">{errors.conditionSeverity.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label required text-sm">Visit Purpose</label>
                <select
                  {...register('visitPurpose', { required: 'Visit purpose is required' })}
                  className={`form-input py-1.5 text-sm ${errors.visitPurpose ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="procedure">Procedure</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="imaging">Imaging</option>
                  <option value="vaccination">Vaccination</option>
                </select>
                {errors.visitPurpose && <p className="form-error text-xs">{errors.visitPurpose.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Urgency Level</label>
                <select
                  {...register('urgencyLevel', { required: 'Urgency level is required' })}
                  className={`form-input py-1.5 text-sm ${errors.urgencyLevel ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {errors.urgencyLevel && <p className="form-error text-xs">{errors.urgencyLevel.message}</p>}
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Preferred Doctor</label>
              <select
                {...register('preferredDoctor')}
                className="form-input py-1.5 text-sm"
              >
                <option value="">No preference</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Information</h3>
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="form-label required text-sm">Payment Method</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cash"
                        value="cash"
                        {...register('paymentMethod', { required: 'Payment method is required' })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="cash" className="ml-2 block text-sm text-gray-700">
                        Cash
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="credit_card"
                        value="credit_card"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="credit_card" className="ml-2 block text-sm text-gray-700">
                        Credit Card
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="insurance"
                        value="insurance"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="insurance" className="ml-2 block text-sm text-gray-700">
                        Insurance
                      </label>
                    </div>
                  </div>
                  {errors.paymentMethod && <p className="form-error text-xs">{errors.paymentMethod.message}</p>}
                </div>
                
                {paymentMethod === 'insurance' && (
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="form-label required text-sm">Insurance Provider</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register('insuranceInfo.provider', { 
                            required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false 
                          })}
                          className={`form-input pl-9 py-1.5 text-sm ${
                            errors.insuranceInfo?.provider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''
                          }`}
                        />
                      </div>
                      {errors.insuranceInfo?.provider && <p className="form-error text-xs">{errors.insuranceInfo.provider.message}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="form-label required text-sm">Policy Number</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.policyNumber', { 
                            required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                          })}
                          className={`form-input py-1.5 text-sm ${
                            errors.insuranceInfo?.policyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''
                          }`}
                        />
                        {errors.insuranceInfo?.policyNumber && <p className="form-error text-xs">{errors.insuranceInfo.policyNumber.message}</p>}
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Group Number</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.groupNumber')}
                          className="form-input py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="form-label required text-sm">Policy Holder Name</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.holderName', { 
                            required: paymentMethod === 'insurance' ? 'Policy holder name is required' : false 
                          })}
                          className={`form-input py-1.5 text-sm ${
                            errors.insuranceInfo?.holderName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''
                          }`}
                        />
                        {errors.insuranceInfo?.holderName && <p className="form-error text-xs">{errors.insuranceInfo.holderName.message}</p>}
                      </div>
                      
                      <div>
                        <label className="form-label required text-sm">Relationship to Patient</label>
                        <select
                          {...register('insuranceInfo.relationship', { 
                            required: paymentMethod === 'insurance' ? 'Relationship is required' : false 
                          })}
                          className={`form-input py-1.5 text-sm ${
                            errors.insuranceInfo?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''
                          }`}
                        >
                          <option value="">Select Relationship</option>
                          <option value="self">Self</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.insuranceInfo?.relationship && <p className="form-error text-xs">{errors.insuranceInfo.relationship.message}</p>}
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="form-label text-sm">Card details will be collected at reception</label>
                      <div className="flex items-center text-xs text-gray-500">
                        <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                        <span>We accept all major credit cards</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevTab}
                className="btn btn-outline py-1.5 text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={nextTab}
                className="btn btn-primary py-1.5 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Review Information</h2>
            <p className="text-xs text-gray-500">Please review the information below before submitting.</p>
            
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Personal Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name:</span>
                    <span className="text-xs font-medium text-gray-900">
                      {`${watch('firstName')} ${watch('lastName')}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Age:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('age')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Gender:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('gender')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(0)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                >
                  Edit
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Phone:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('contactNumber')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Email:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('email') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Address:</span>
                    <span className="text-xs font-medium text-gray-900 text-right max-w-[60%]">{watch('address')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(1)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                >
                  Edit
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Priority Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Patient Type:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('patientType')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Condition Severity:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('conditionSeverity')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Visit Purpose:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('visitPurpose')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Urgency Level:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('urgencyLevel')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                >
                  Edit
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Payment Method:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('paymentMethod')}</span>
                  </div>
                  {watch('paymentMethod') === 'insurance' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Insurance Provider:</span>
                        <span className="text-xs font-medium text-gray-900">{watch('insuranceInfo.provider')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Policy Number:</span>
                        <span className="text-xs font-medium text-gray-900">{watch('insuranceInfo.policyNumber')}</span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                >
                  Edit
                </button>
              </div>
            </div>
            
            {showEmergencyContact && watch('emergencyContact.name') && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('emergencyContact.name')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Relationship:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('emergencyContact.relationship')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Phone:</span>
                    <span className="text-xs font-medium text-gray-900">{watch('emergencyContact.phone')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(1)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                >
                  Edit
                </button>
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevTab}
                className="btn btn-outline py-1.5 text-sm"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary py-1.5 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Complete Registration
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientRegistrationForm;