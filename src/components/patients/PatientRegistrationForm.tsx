import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Search,
  UserPlus,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface PatientFormData {
  patientType: 'new' | 'existing' | 'emergency';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
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
  medicalInfo: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    bloodType: string;
    smoker: boolean;
    alcoholConsumption: string;
  };
  priority: 'normal' | 'urgent' | 'critical';
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
  status: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExistingPatient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { 
    data: patients, 
    loading: patientsLoading, 
    error: patientsError,
    fetchItems: fetchPatients,
    saveItem: savePatient
  } = useHybridStorage<ExistingPatient>('patients');
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
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
      medicalInfo: {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        bloodType: '',
        smoker: false,
        alcoholConsumption: 'none'
      },
      priority: 'normal'
    }
  });
  
  const patientType = watch('patientType');
  
  useEffect(() => {
    // Fetch patients for search functionality
    fetchPatients();
  }, [fetchPatients]);
  
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Filter patients based on search term
      if (Array.isArray(patients)) {
        const results = patients.filter(patient => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          const contactNumber = patient.contact_number.toLowerCase();
          
          return fullName.includes(searchTerm.toLowerCase()) || 
                 contactNumber.includes(searchTerm.toLowerCase());
        });
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
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
    
    // Populate form with selected patient data
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('dateOfBirth', patient.date_of_birth);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
    
    // Move to next step
    setCurrentStep(2);
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
  
  const onSubmit = async (data: PatientFormData) => {
    try {
      setFormError(null);
      
      if (data.patientType === 'existing' && !selectedPatient) {
        setFormError('Please select an existing patient');
        return;
      }
      
      if (data.patientType === 'new') {
        // Create new patient
        const newPatient = {
          id: `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          contact_number: data.contactNumber,
          email: data.email,
          address: data.address,
          emergency_contact: {
            name: data.emergencyContact.name,
            relationship: data.emergencyContact.relationship,
            phone: data.emergencyContact.phone
          },
          medical_history: {
            allergies: data.medicalInfo.allergies,
            chronicConditions: data.medicalInfo.chronicConditions,
            currentMedications: data.medicalInfo.currentMedications,
            bloodType: data.medicalInfo.bloodType,
            smoker: data.medicalInfo.smoker,
            alcoholConsumption: data.medicalInfo.alcoholConsumption
          },
          status: 'active',
          current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration'
        };
        
        await savePatient(newPatient, newPatient.id);
        
        addNotification({
          message: 'Patient registered successfully',
          type: 'success'
        });
        
        // Navigate to patient details or triage
        if (data.patientType === 'emergency') {
          navigate(`/patients/${newPatient.id}/triage`);
        } else {
          navigate(`/patients/${newPatient.id}`);
        }
      } else if (data.patientType === 'existing' && selectedPatient) {
        // Update existing patient's flow step
        const updatedPatient = {
          ...selectedPatient,
          current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration'
        };
        
        await savePatient(updatedPatient, selectedPatient.id);
        
        addNotification({
          message: 'Patient check-in successful',
          type: 'success'
        });
        
        // Navigate to patient details or triage
        if (data.patientType === 'emergency') {
          navigate(`/patients/${selectedPatient.id}/triage`);
        } else {
          navigate(`/patients/${selectedPatient.id}`);
        }
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      setFormError(`Error: ${error.message}`);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Patient Registration
              </h1>
              <p className="text-primary-100">
                Register new or manage existing patients
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Error Message */}
        {formError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : 1}
                </div>
                <div className={`h-1 w-16 ${
                  currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : 2}
                </div>
                <div className={`h-1 w-16 ${
                  currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 3 ? <CheckCircle className="h-5 w-5" /> : 3}
                </div>
                <div className={`h-1 w-16 ${
                  currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 4 ? <CheckCircle className="h-5 w-5" /> : 4}
                </div>
                <div className={`h-1 w-16 ${
                  currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  5
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep} of 5
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
              <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
              <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
              <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
              <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Type</h2>
              <p className="text-gray-600 mb-6">Select the appropriate patient type</p>
              
              <div className="space-y-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'new' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'new')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      patientType === 'new' ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {patientType === 'new' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div className="ml-3 flex items-center">
                      <UserPlus className={`h-5 w-5 mr-2 ${patientType === 'new' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="text-base font-medium text-gray-900">New Patient</h3>
                        <p className="text-sm text-gray-500">Register a new patient</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'existing' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'existing')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      patientType === 'existing' ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {patientType === 'existing' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div className="ml-3 flex items-center">
                      <UserCheck className={`h-5 w-5 mr-2 ${patientType === 'existing' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Existing Patient</h3>
                        <p className="text-sm text-gray-500">Find patient records</p>
                      </div>
                    </div>
                  </div>
                  
                  {patientType === 'existing' && (
                    <div className="mt-4 space-y-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-input pl-10 w-full"
                          placeholder="Search by name or contact number"
                        />
                        <button
                          type="button"
                          onClick={handleSearch}
                          className="absolute inset-y-0 right-0 px-3 flex items-center bg-primary-500 text-white rounded-r-md"
                        >
                          Search
                        </button>
                      </div>
                      
                      {isSearching ? (
                        <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                            {searchResults.map((patient) => (
                              <div 
                                key={patient.id}
                                className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                                onClick={() => selectExistingPatient(patient)}
                              >
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                                    {patient.first_name && patient.first_name.charAt(0)}
                                    {patient.last_name && patient.last_name.charAt(0)}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {patient.first_name} {patient.last_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {calculateAge(patient.date_of_birth)} years • {patient.gender} • {patient.contact_number}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : searchTerm && (
                        <div className="text-center p-4 text-gray-500">
                          No patients found matching your search criteria
                        </div>
                      )}
                      
                      {selectedPatient && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <div className="text-sm font-medium text-green-800">
                              Selected: {selectedPatient.first_name} {selectedPatient.last_name}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'emergency')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      patientType === 'emergency' ? 'border-error-500' : 'border-gray-300'
                    }`}>
                      {patientType === 'emergency' && (
                        <div className="w-3 h-3 rounded-full bg-error-500"></div>
                      )}
                    </div>
                    <div className="ml-3 flex items-center">
                      <AlertTriangle className={`h-5 w-5 mr-2 ${patientType === 'emergency' ? 'text-error-500' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Emergency</h3>
                        <p className="text-sm text-gray-500">Fast-track emergency case</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <input
                type="hidden"
                {...register('patientType', { required: true })}
              />
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              <p className="text-gray-600 mb-6">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="form-label required">First Name</label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth', { required: 'Date of birth is required' })}
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
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="form-error">{errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
              <p className="text-gray-600 mb-6">Enter the patient's contact details</p>
              
              <div className="space-y-6">
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
                
                <div>
                  <label className="form-label required">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={3}
                    />
                  </div>
                  {errors.address && (
                    <p className="form-error">{errors.address.message}</p>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="form-label required">Name</label>
                      <input
                        type="text"
                        {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                        className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                      {errors.emergencyContact?.name && (
                        <p className="form-error">{errors.emergencyContact.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                        className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                      {errors.emergencyContact?.relationship && (
                        <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="form-label required">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                          className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        />
                      </div>
                      {errors.emergencyContact?.phone && (
                        <p className="form-error">{errors.emergencyContact.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Priority</h2>
              <p className="text-gray-600 mb-6">Select the patient's priority level</p>
              
              <div className="space-y-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    watch('priority') === 'normal' 
                      ? 'border-success-500 bg-success-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'normal')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      watch('priority') === 'normal' ? 'border-success-500' : 'border-gray-300'
                    }`}>
                      {watch('priority') === 'normal' && (
                        <div className="w-3 h-3 rounded-full bg-success-500"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-gray-900">Normal</h3>
                      <p className="text-sm text-gray-500">Standard priority for routine cases</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    watch('priority') === 'urgent' 
                      ? 'border-warning-500 bg-warning-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'urgent')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      watch('priority') === 'urgent' ? 'border-warning-500' : 'border-gray-300'
                    }`}>
                      {watch('priority') === 'urgent' && (
                        <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-gray-900">Urgent</h3>
                      <p className="text-sm text-gray-500">Higher priority for cases requiring prompt attention</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    watch('priority') === 'critical' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('priority', 'critical')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      watch('priority') === 'critical' ? 'border-error-500' : 'border-gray-300'
                    }`}>
                      {watch('priority') === 'critical' && (
                        <div className="w-3 h-3 rounded-full bg-error-500"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-gray-900">Critical</h3>
                      <p className="text-sm text-gray-500">Highest priority for life-threatening conditions</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <input
                type="hidden"
                {...register('priority', { required: true })}
              />
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Information</h2>
              <p className="text-gray-600 mb-6">Please review the patient information before submitting</p>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h3>
                  <p className="text-gray-700">
                    {patientType === 'new' && 'New Patient'}
                    {patientType === 'existing' && 'Existing Patient'}
                    {patientType === 'emergency' && 'Emergency Case'}
                  </p>
                  {patientType === 'existing' && selectedPatient && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-gray-700">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-gray-700">{watch('dateOfBirth')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="text-gray-700">{watch('gender')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact Number</p>
                      <p className="text-gray-700">{watch('contactNumber')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-700">{watch('email') || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-700">{watch('address')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-gray-700">{watch('emergencyContact.name')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Relationship</p>
                      <p className="text-gray-700">{watch('emergencyContact.relationship')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-700">{watch('emergencyContact.phone')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Priority</h3>
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      watch('priority') === 'normal' ? 'bg-success-100 text-success-800' :
                      watch('priority') === 'urgent' ? 'bg-warning-100 text-warning-800' :
                      'bg-error-100 text-error-800'
                    }`}>
                      {watch('priority').charAt(0).toUpperCase() + watch('priority').slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Cancel
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center"
              disabled={
                (currentStep === 1 && patientType === 'existing' && !selectedPatient) ||
                (currentStep === 1 && !patientType)
              }
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary flex items-center"
            >
              Register Patient
              <CheckCircle className="h-5 w-5 ml-2" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;