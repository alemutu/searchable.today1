import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  UserPlus, 
  Search,
  CheckCircle,
  ChevronRight,
  Users
} from 'lucide-react';

interface PatientRegistrationFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  priority: 'normal' | 'urgent' | 'critical';
  isEmergency: boolean;
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
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: string;
}

const PatientRegistrationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [patientType, setPatientType] = useState<'new' | 'existing' | 'emergency' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ExistingPatient | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    control, 
    setValue, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      priority: 'normal',
      isEmergency: false
    }
  });
  
  const { saveItem } = useHybridStorage<any>('patients');
  const { data: patients, fetchItems: fetchPatients } = useHybridStorage<ExistingPatient>('patients');
  
  const isEmergency = watch('isEmergency');
  
  // Watch for patient type changes
  useEffect(() => {
    if (patientType === 'emergency') {
      setValue('isEmergency', true);
    } else {
      setValue('isEmergency', false);
    }
  }, [patientType, setValue]);
  
  // Handle search for existing patients
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    performSearch();
  };
  
  const performSearch = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      await fetchPatients();
      
      if (Array.isArray(patients)) {
        const results = patients.filter(patient => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          return fullName.includes(searchTerm.toLowerCase()) || 
                 patient.contact_number.includes(searchTerm);
        });
        
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      addNotification({
        message: 'Failed to search for patients',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (searchTerm.length >= 2) {
      const timeout = setTimeout(() => {
        performSearch();
      }, 300);
      
      setSearchTimeout(timeout);
    }
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm]);
  
  const selectExistingPatient = (patient: ExistingPatient) => {
    setSelectedPatient(patient);
    
    // Populate form with patient data
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('dateOfBirth', patient.date_of_birth);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    setValue('emergencyContactName', patient.emergency_contact.name);
    setValue('emergencyContactRelationship', patient.emergency_contact.relationship);
    setValue('emergencyContactPhone', patient.emergency_contact.phone);
    
    // Move to next step
    setCurrentStep(2);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    try {
      // If it's an emergency registration, only require first and last name
      if (patientType === 'emergency' && (!data.firstName || !data.lastName)) {
        addNotification({
          message: 'Please enter at least the patient\'s first and last name',
          type: 'error'
        });
        return;
      }
      
      // For existing patient, use their ID
      const patientId = selectedPatient?.id || `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create patient object
      const patientData = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date().toISOString().split('T')[0], // Default to today if emergency
        gender: data.gender || 'unknown', // Default if emergency
        contact_number: data.contactNumber || 'Unknown', // Default if emergency
        email: data.email,
        address: data.address || 'Unknown', // Default if emergency
        emergency_contact: {
          name: data.emergencyContactName || 'Unknown', // Default if emergency
          relationship: data.emergencyContactRelationship || 'Unknown', // Default if emergency
          phone: data.emergencyContactPhone || 'Unknown' // Default if emergency
        },
        status: 'active',
        current_flow_step: patientType === 'emergency' ? 'emergency' : 'registration',
        priority_level: data.priority || 'normal',
        medical_history: {},
        created_at: new Date().toISOString()
      };
      
      // Save patient data
      await saveItem(patientData, patientId);
      
      // Show success notification
      addNotification({
        message: `${patientType === 'emergency' ? 'Emergency' : 'Patient'} registration successful`,
        type: 'success'
      });
      
      // Navigate based on patient type
      if (patientType === 'emergency') {
        navigate(`/patients/${patientId}/triage`);
      } else {
        navigate('/patients');
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    if (currentStep === 2 && patientType === 'existing') {
      setSelectedPatient(null);
    }
    setCurrentStep(currentStep - 1);
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-primary-600 rounded-lg shadow-md p-3 mb-3">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="mr-3 text-white hover:bg-primary-700 p-1 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Patient Registration</h1>
              <p className="text-primary-100 text-xs">Register new or manage existing patients</p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm mb-3">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : 1}
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : 2}
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <div className={`h-1 w-10 ${
                  currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  4
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
            <div className="flex justify-between mt-1.5 text-xs text-gray-500">
              <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
              <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
              <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
              <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
              <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Patient Type</h2>
              <p className="text-sm text-gray-600 mb-4">Select the appropriate patient type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'new' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPatientType('new')}
                >
                  <div className="flex items-center mb-2">
                    <UserPlus className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-base font-medium text-gray-900">New Patient</h3>
                  </div>
                  <p className="text-sm text-gray-500">Register a new patient</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'existing' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPatientType('existing')}
                >
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-base font-medium text-gray-900">Existing Patient</h3>
                  </div>
                  <p className="text-sm text-gray-500">Find patient records</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPatientType('emergency')}
                >
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                    <h3 className="text-base font-medium text-gray-900">Emergency</h3>
                  </div>
                  <p className="text-sm text-gray-500">Fast-track emergency case</p>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <form onSubmit={handleSearch} className="mb-4">
                      <div className="flex space-x-2">
                        <div className="relative flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pl-10 w-full"
                            placeholder="Search by name or phone number..."
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary"
                        >
                          Search
                        </button>
                      </div>
                    </form>
                    
                    {isSearching ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <div 
                            key={patient.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer"
                            onClick={() => selectExistingPatient(patient)}
                          >
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</div>
                                <div className="text-xs text-gray-500">
                                  {calculateAge(patient.date_of_birth)} years • {patient.gender} • {patient.contact_number}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    ) : searchTerm.length > 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-2">No patients found matching "{searchTerm}"</p>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setPatientType('new')}
                        >
                          Register as new patient
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h2>
              <p className="text-sm text-gray-600 mb-4">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`form-input pl-10 ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-10 ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
                
                {!isEmergency && (
                  <>
                    <div>
                      <label className="form-label required">Date of Birth</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          {...register('dateOfBirth', { required: !isEmergency ? 'Date of birth is required' : false })}
                          className={`form-input pl-10 ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <p className="form-error">{errors.dateOfBirth.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Gender</label>
                      <select
                        {...register('gender', { required: !isEmergency ? 'Gender is required' : false })}
                        className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && (
                        <p className="form-error">{errors.gender.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {isEmergency && (
                <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-error-800">Emergency Registration</p>
                    <p className="text-sm text-error-600">
                      Only first and last name are required for emergency registration. 
                      Other details can be completed later.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && !isEmergency && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-4">Enter the patient's contact details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required">Contact Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Contact number is required' })}
                      className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="form-error">{errors.contactNumber.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="form-input pl-10"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label required">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={2}
                    />
                  </div>
                  {errors.address && (
                    <p className="form-error">{errors.address.message}</p>
                  )}
                </div>
              </div>
              
              <h3 className="text-base font-medium text-gray-900 mt-4 mb-3">Emergency Contact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required">Name</label>
                  <input
                    type="text"
                    {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                    className={`form-input ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.emergencyContactName && (
                    <p className="form-error">{errors.emergencyContactName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Relationship</label>
                  <input
                    type="text"
                    {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
                    className={`form-input ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.emergencyContactRelationship && (
                    <p className="form-error">{errors.emergencyContactRelationship.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Phone Number</label>
                  <input
                    type="tel"
                    {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                    className={`form-input ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="form-error">{errors.emergencyContactPhone.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Priority</h2>
              <p className="text-sm text-gray-600 mb-4">Select the patient's priority level</p>
              
              <div className="space-y-3">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    watch('priority') === 'normal' 
                      ? 'border-success-500 bg-success-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'normal')}
                >
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-success-500 mr-2"></div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Normal</h3>
                      <p className="text-sm text-gray-500">Standard priority for routine cases</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    watch('priority') === 'urgent' 
                      ? 'border-warning-500 bg-warning-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'urgent')}
                >
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-warning-500 mr-2"></div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Urgent</h3>
                      <p className="text-sm text-gray-500">Higher priority for cases requiring prompt attention</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    watch('priority') === 'critical' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'critical')}
                >
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-error-500 mr-2"></div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Critical</h3>
                      <p className="text-sm text-gray-500">Highest priority for life-threatening conditions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Review Information</h2>
              <p className="text-sm text-gray-600 mb-4">Please review the patient information before submitting</p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Personal Information</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">{watch('firstName')} {watch('lastName')}</span>
                    </div>
                    
                    {!isEmergency && (
                      <>
                        <div>
                          <span className="text-gray-500">Date of Birth:</span>
                          <span className="ml-2 text-gray-900">{watch('dateOfBirth')}</span>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Gender:</span>
                          <span className="ml-2 text-gray-900">{watch('gender')}</span>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Contact:</span>
                          <span className="ml-2 text-gray-900">{watch('contactNumber')}</span>
                        </div>
                        
                        {watch('email') && (
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-2 text-gray-900">{watch('email')}</span>
                          </div>
                        )}
                        
                        <div className="col-span-2">
                          <span className="text-gray-500">Address:</span>
                          <span className="ml-2 text-gray-900">{watch('address')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {!isEmergency && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Emergency Contact</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 text-gray-900">{watch('emergencyContactName')}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Relationship:</span>
                        <span className="ml-2 text-gray-900">{watch('emergencyContactRelationship')}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-2 text-gray-900">{watch('emergencyContactPhone')}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Priority</h3>
                  <div className="mt-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      watch('priority') === 'normal' ? 'bg-success-100 text-success-800' :
                      watch('priority') === 'urgent' ? 'bg-warning-100 text-warning-800' :
                      'bg-error-100 text-error-800'
                    }`}>
                      {watch('priority').charAt(0).toUpperCase() + watch('priority').slice(1)}
                    </span>
                  </div>
                </div>
                
                {isEmergency && (
                  <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-error-800">Emergency Registration</p>
                      <p className="text-sm text-error-600">
                        This patient is being registered as an emergency case. 
                        Additional details can be completed later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center py-1.5 px-3 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn btn-outline flex items-center py-1.5 px-3 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !patientType) ||
                (currentStep === 2 && !isEmergency && (!watch('firstName') || !watch('lastName') || !watch('dateOfBirth') || !watch('gender'))) ||
                (currentStep === 2 && isEmergency && (!watch('firstName') || !watch('lastName'))) ||
                (currentStep === 3 && !isEmergency && (!watch('contactNumber') || !watch('address') || !watch('emergencyContactName') || !watch('emergencyContactRelationship') || !watch('emergencyContactPhone')))
              }
              className="btn btn-primary flex items-center py-1.5 px-3 text-sm"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center py-1.5 px-3 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white mr-1.5"></div>
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Complete Registration
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