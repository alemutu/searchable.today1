import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  UserPlus, 
  Users, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Save,
  Check,
  Clock,
  Activity,
  Siren,
  Search,
  X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  patientType: string;
  priority: string;
  priorityNotes: string;
  paymentMethod: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
}

interface ExistingPatient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string;
}

const PatientRegistrationForm: React.FC = () => {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      gender: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      patientType: 'new',
      priority: 'normal',
      priorityNotes: '',
      paymentMethod: 'cash'
    }
  });
  
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ExistingPatient | null>(null);
  
  // Use the hybrid storage hook to access patient data
  const { 
    data: patients,
    loading: patientsLoading,
    fetchItems: fetchPatients
  } = useHybridStorage<ExistingPatient>('patients');
  
  const patientType = watch('patientType');
  const priority = watch('priority');
  const paymentMethod = watch('paymentMethod');
  
  // Generate a unique patient ID when the component mounts
  useEffect(() => {
    // Generate a unique ID for the patient
    // In a real app, this would follow a specific format from the backend
    const uniqueId = `PT${Math.floor(100000 + Math.random() * 900000)}`;
    setPatientId(uniqueId);
  }, []);
  
  // Fetch patients when in existing patient mode
  useEffect(() => {
    if (patientType === 'existing') {
      fetchPatients();
    }
  }, [patientType, fetchPatients]);
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, this would be an API call to register the patient
      console.log('Registering patient:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Redirect to patient list
      navigate('/patients');
    } catch (error) {
      console.error('Error registering patient:', error);
      addNotification({
        message: 'Failed to register patient',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setValue('age', age);
    return age;
  };
  
  const getPriorityPlaceholder = () => {
    switch(priority) {
      case 'emergency':
        return 'Describe the emergency situation (e.g., severe chest pain, difficulty breathing, major trauma)';
      case 'urgent':
        return 'Describe the urgent condition (e.g., high fever, moderate pain, minor injuries)';
      case 'normal':
        return 'Any additional notes about the patient\'s condition';
      default:
        return 'Add notes about priority if needed';
    }
  };
  
  const handleSearch = () => {
    if (!searchTerm || !Array.isArray(patients)) return;
    
    setIsSearching(true);
    
    try {
      // Filter patients based on search term
      const results = patients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const phone = patient.contact_number.toLowerCase();
        
        return fullName.includes(searchTerm.toLowerCase()) || 
               phone.includes(searchTerm.toLowerCase()) ||
               (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
      });
      
      setSearchResults(results);
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
  
  const selectExistingPatient = (patient: ExistingPatient) => {
    setSelectedPatient(patient);
    
    // Fill the form with the selected patient's data
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('dateOfBirth', patient.date_of_birth);
    setValue('gender', patient.gender);
    setValue('phone', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    
    // Calculate age from date of birth
    calculateAge(patient.date_of_birth);
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
  };
  
  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    
    // Reset form fields
    setValue('firstName', '');
    setValue('lastName', '');
    setValue('dateOfBirth', '');
    setValue('age', 0);
    setValue('gender', '');
    setValue('phone', '');
    setValue('email', '');
    setValue('address', '');
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-primary-600 rounded-t-lg p-4 mb-4">
          <div className="flex items-center">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="mr-3 text-white hover:bg-primary-700 p-1 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Patient Registration</h1>
              <p className="text-primary-100 text-sm">Register new or manage existing patients</p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <Check className="h-4 w-4" /> : 1}
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 2 ? <Check className="h-4 w-4" /> : 2}
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 3 ? <Check className="h-4 w-4" /> : 3}
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 4 ? <Check className="h-4 w-4" /> : 4}
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  5
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Step {currentStep} of 5
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
              <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
              <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
              <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
              <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Patient Type</h2>
              <p className="text-sm text-gray-500 mb-4">Select the appropriate patient type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    patientType === 'new' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setValue('patientType', 'new');
                    clearSelectedPatient();
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <UserPlus className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">New Patient</h3>
                        <p className="text-xs text-gray-500">Register a new patient</p>
                      </div>
                    </div>
                    {patientType === 'new' && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    patientType === 'existing' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'existing')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="bg-secondary-100 p-2 rounded-full">
                        <Users className="h-5 w-5 text-secondary-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Existing Patient</h3>
                        <p className="text-xs text-gray-500">Find patient records</p>
                      </div>
                    </div>
                    {patientType === 'existing' && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setValue('patientType', 'emergency');
                    setValue('priority', 'emergency');
                    clearSelectedPatient();
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="bg-error-100 p-2 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-error-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Emergency</h3>
                        <p className="text-xs text-gray-500">Fast-track emergency case</p>
                      </div>
                    </div>
                    {patientType === 'emergency' && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Search Existing Patients</h3>
                    
                    {selectedPatient ? (
                      <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {calculateAge(selectedPatient.date_of_birth)} years • {selectedPatient.gender}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedPatient.contact_number}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={clearSelectedPatient}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex space-x-2 mb-3">
                          <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="form-input pl-9 py-2 text-sm w-full"
                              placeholder="Search by name, phone, or email"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching || !searchTerm}
                            className="btn btn-primary py-2 text-sm"
                          >
                            {isSearching ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              'Search'
                            )}
                          </button>
                        </div>
                        
                        {searchResults.length > 0 ? (
                          <div className="max-h-60 overflow-y-auto">
                            <div className="space-y-2">
                              {searchResults.map((patient) => (
                                <div 
                                  key={patient.id}
                                  className="bg-white p-2 rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer"
                                  onClick={() => selectExistingPatient(patient)}
                                >
                                  <p className="text-sm font-medium text-gray-900">
                                    {patient.first_name} {patient.last_name}
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-500">
                                      {calculateAge(patient.date_of_birth)} years • {patient.gender}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {patient.contact_number}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : searchTerm && !isSearching ? (
                          <div className="text-center p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-500">No patients found matching "{searchTerm}"</p>
                          </div>
                        ) : null}
                      </>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-500">
                      {selectedPatient ? 
                        "You've selected an existing patient. Continue to update their information or register a new visit." :
                        "Search for existing patients by name, phone number, or email address."
                      }
                    </div>
                  </div>
                </div>
              )}
              
              {patientType === 'emergency' && (
                <div className="mt-4 p-3 bg-error-50 rounded-lg border border-error-100">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-error-800">
                        Emergency Registration
                      </p>
                      <p className="text-sm text-error-700 mt-1">
                        This will fast-track the patient through the registration process. 
                        Only essential information will be required initially.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h2>
              <p className="text-sm text-gray-500 mb-4">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.firstName ? 'border-error-300' : ''}`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-error-500">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.lastName ? 'border-error-300' : ''}`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-error-500">{errors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      onChange={(e) => calculateAge(e.target.value)}
                      className="form-input pl-9 py-2 text-sm"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label required">Age</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('age', { 
                        required: 'Age is required',
                        min: { value: 0, message: 'Age must be positive' },
                        max: { value: 120, message: 'Age must be less than 120' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.age ? 'border-error-300' : ''}`}
                      placeholder="Enter age"
                    />
                  </div>
                  {errors.age && (
                    <p className="mt-1 text-xs text-error-500">{errors.age.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Gender</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input py-2 text-sm ${errors.gender ? 'border-error-300' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-error-500">{errors.gender.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Patient ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={selectedPatient ? selectedPatient.id : patientId}
                      readOnly
                      className="form-input pl-9 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h2>
              <p className="text-sm text-gray-500 mb-4">Enter the patient's contact details</p>
              
              <div className="space-y-3">
                <div>
                  <label className="form-label required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Phone number is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.phone ? 'border-error-300' : ''}`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-error-500">{errors.phone.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label required">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.address ? 'border-error-300' : ''}`}
                      rows={3}
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-xs text-error-500">{errors.address.message}</p>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <label className="form-label">Emergency Contact</label>
                    <button
                      type="button"
                      onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      {showEmergencyContact ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {showEmergencyContact && (
                    <div className="space-y-3 mt-2 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="form-label text-sm">Contact Name</label>
                        <input
                          type="text"
                          {...register('emergencyContact.name')}
                          className="form-input py-2 text-sm"
                          placeholder="Enter emergency contact name"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Relationship</label>
                        <input
                          type="text"
                          {...register('emergencyContact.relationship')}
                          className="form-input py-2 text-sm"
                          placeholder="E.g., Spouse, Parent, Child"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Phone Number</label>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone')}
                          className="form-input py-2 text-sm"
                          placeholder="Enter emergency contact phone"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Patient Priority</h2>
              <p className="text-sm text-gray-500 mb-4">Select the appropriate priority level for this patient</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    priority === 'emergency' 
                      ? 'border-error-500 bg-error-50 ring-2 ring-error-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'emergency')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="bg-error-100 p-2 rounded-full mb-2">
                        <AlertTriangle className="h-5 w-5 text-error-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">Emergency</h3>
                      <p className="text-xs text-gray-500 mt-1">Life-threatening</p>
                    </div>
                    {priority === 'emergency' && (
                      <Check className="h-5 w-5 text-error-500 absolute top-2 right-2" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    priority === 'urgent' 
                      ? 'border-warning-500 bg-warning-50 ring-2 ring-warning-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'urgent')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="bg-warning-100 p-2 rounded-full mb-2">
                        <Siren className="h-5 w-5 text-warning-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">Urgent</h3>
                      <p className="text-xs text-gray-500 mt-1">Requires prompt attention</p>
                    </div>
                    {priority === 'urgent' && (
                      <Check className="h-5 w-5 text-warning-500 absolute top-2 right-2" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    priority === 'normal' 
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'normal')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="bg-primary-100 p-2 rounded-full mb-2">
                        <Clock className="h-5 w-5 text-primary-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">Normal</h3>
                      <p className="text-xs text-gray-500 mt-1">Standard care</p>
                    </div>
                    {priority === 'normal' && (
                      <Check className="h-5 w-5 text-primary-500 absolute top-2 right-2" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    priority === 'low' 
                      ? 'border-success-500 bg-success-50 ring-2 ring-success-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'low')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="bg-success-100 p-2 rounded-full mb-2">
                        <Activity className="h-5 w-5 text-success-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">Low</h3>
                      <p className="text-xs text-gray-500 mt-1">Non-urgent care</p>
                    </div>
                    {priority === 'low' && (
                      <Check className="h-5 w-5 text-success-500 absolute top-2 right-2" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="form-label">Priority Notes</label>
                <textarea
                  {...register('priorityNotes')}
                  className="form-input py-2 text-sm"
                  rows={3}
                  placeholder={getPriorityPlaceholder()}
                />
              </div>
              
              {priority === 'emergency' && (
                <div className="mt-4 p-3 bg-error-50 rounded-lg border border-error-100">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-error-800">
                        Emergency Patient
                      </p>
                      <p className="text-sm text-error-700 mt-1">
                        This patient will be fast-tracked through the system. Payment requirements will be bypassed if necessary.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {priority === 'urgent' && (
                <div className="mt-4 p-3 bg-warning-50 rounded-lg border border-warning-100">
                  <div className="flex items-start">
                    <Siren className="h-5 w-5 text-warning-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-warning-800">
                        Urgent Patient
                      </p>
                      <p className="text-sm text-warning-700 mt-1">
                        This patient will be prioritized in the queue. Please ensure they are seen promptly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Review Information</h2>
              <p className="text-sm text-gray-500 mb-4">Please review the patient information before submitting</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Patient ID:</span> {selectedPatient ? selectedPatient.id : patientId}</p>
                    <p><span className="font-medium">Name:</span> {watch('firstName')} {watch('lastName')}</p>
                    <p><span className="font-medium">Age:</span> {watch('age')} years</p>
                    <p><span className="font-medium">Gender:</span> {watch('gender')}</p>
                    <p><span className="font-medium">Date of Birth:</span> {watch('dateOfBirth') || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Phone:</span> {watch('phone')}</p>
                    <p><span className="font-medium">Email:</span> {watch('email') || 'Not provided'}</p>
                    <p><span className="font-medium">Address:</span> {watch('address')}</p>
                  </div>
                </div>
                
                {showEmergencyContact && watch('emergencyContact.name') && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {watch('emergencyContact.name')}</p>
                      <p><span className="font-medium">Relationship:</span> {watch('emergencyContact.relationship')}</p>
                      <p><span className="font-medium">Phone:</span> {watch('emergencyContact.phone')}</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Priority Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        priority === 'emergency' ? 'bg-error-100 text-error-800' :
                        priority === 'urgent' ? 'bg-warning-100 text-warning-800' :
                        priority === 'normal' ? 'bg-primary-100 text-primary-800' :
                        'bg-success-100 text-success-800'
                      }`}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </p>
                    {watch('priorityNotes') && (
                      <p><span className="font-medium">Notes:</span> {watch('priorityNotes')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {priority === 'emergency' && (
                <div className="mt-4 p-3 bg-error-50 rounded-lg border border-error-100">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-error-800">
                        Emergency Registration
                      </p>
                      <p className="text-sm text-error-700 mt-1">
                        This patient will be registered as an emergency case and fast-tracked through the system.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {priority === 'urgent' && (
                <div className="mt-4 p-3 bg-warning-50 rounded-lg border border-warning-100">
                  <div className="flex items-start">
                    <Siren className="h-5 w-5 text-warning-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-warning-800">
                        Urgent Registration
                      </p>
                      <p className="text-sm text-warning-700 mt-1">
                        This patient will be prioritized in the queue for prompt attention.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex items-center py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center py-2 text-sm"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center py-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Patient
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;