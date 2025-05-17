import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Search,
  UserPlus,
  UserCheck,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface PatientFormData {
  patientType: 'new' | 'existing' | 'emergency';
  existingPatientId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  priority: 'normal' | 'urgent' | 'critical';
  paymentMethod: 'cash' | 'insurance' | 'mobile_money';
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
  };
  mobileMoneyDetails?: {
    provider: string;
    phoneNumber: string;
  };
}

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
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: '',
      gender: 'male',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      priority: 'normal',
      paymentMethod: 'cash'
    }
  });
  
  const { 
    saveItem: savePatient,
    fetchItems: fetchPatients,
    data: patientsData
  } = useHybridStorage<Patient>('patients');
  
  const patientType = watch('patientType');
  const dateOfBirth = watch('dateOfBirth');
  const paymentMethod = watch('paymentMethod');
  
  // Calculate age when date of birth changes
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setValue('age', age.toString());
    }
  }, [dateOfBirth, setValue]);
  
  // Set priority to critical for emergency patients
  useEffect(() => {
    if (patientType === 'emergency') {
      setValue('priority', 'critical');
    }
  }, [patientType, setValue]);
  
  // Handle patient search
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Fetch all patients and filter them based on search term
      await fetchPatients();
      
      if (Array.isArray(patientsData)) {
        const results = patientsData.filter(patient => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          const contactNumber = patient.contact_number || '';
          
          return fullName.includes(searchTerm.toLowerCase()) || 
                 contactNumber.includes(searchTerm);
        });
        
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      addNotification({
        message: 'Failed to search patients',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, fetchPatients, patientsData, addNotification]);
  
  // Search when search term changes
  useEffect(() => {
    if (patientType === 'existing' && searchTerm.trim().length >= 3) {
      const debounceTimer = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, patientType, handleSearch]);
  
  const selectExistingPatient = (patient: Patient) => {
    setValue('existingPatientId', patient.id);
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('dateOfBirth', patient.date_of_birth);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    setValue('emergencyContact', patient.emergency_contact);
    
    // Calculate age
    const birthDate = new Date(patient.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setValue('age', age.toString());
    
    // Move to next step
    setCurrentStep(3);
  };
  
  const nextStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientFormData) => {
    setIsSaving(true);
    
    try {
      if (data.patientType === 'existing' && data.existingPatientId) {
        // Update existing patient
        const existingPatient = searchResults.find(p => p.id === data.existingPatientId);
        
        if (existingPatient) {
          const updatedPatient: Patient = {
            ...existingPatient,
            current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration',
            status: 'active'
          };
          
          await savePatient(updatedPatient, existingPatient.id);
          
          addNotification({
            message: `Patient ${data.firstName} ${data.lastName} updated successfully`,
            type: 'success'
          });
          
          navigate('/reception');
          return;
        }
      }
      
      // Create new patient
      const newPatient: Omit<Patient, 'id'> = {
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email || null,
        address: data.address,
        emergency_contact: data.emergencyContact,
        status: 'active',
        current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration'
      };
      
      const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await savePatient(newPatient as Patient, patientId);
      
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      navigate('/reception');
    } catch (error: any) {
      console.error('Error saving patient:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-primary-600 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full text-white hover:bg-primary-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Patient Registration</h1>
              <p className="text-primary-100">Register new or manage existing patients</p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-6 w-6" /> : 1}
              </div>
              <div className={`h-1 w-16 ${
                currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <CheckCircle className="h-6 w-6" /> : 2}
              </div>
              <div className={`h-1 w-16 ${
                currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 3 ? <CheckCircle className="h-6 w-6" /> : 3}
              </div>
              <div className={`h-1 w-16 ${
                currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 4 ? <CheckCircle className="h-6 w-6" /> : 4}
              </div>
              <div className={`h-1 w-16 ${
                currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                5
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of 5
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
            <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
            <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
            <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
            <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
          </div>
        </div>
        
        {/* Step 1: Patient Type */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Type</h2>
            <p className="text-gray-600 mb-6">Select the appropriate patient type</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  watch('patientType') === 'new' 
                    ? 'border-primary-500 bg-primary-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('patientType', 'new')}
              >
                <div className="flex items-center mb-2">
                  <div className={`p-2 rounded-full ${
                    watch('patientType') === 'new' ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <UserPlus className={`h-5 w-5 ${
                      watch('patientType') === 'new' ? 'text-primary-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">New Patient</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Register a new patient</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  watch('patientType') === 'existing' 
                    ? 'border-primary-500 bg-primary-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('patientType', 'existing')}
              >
                <div className="flex items-center mb-2">
                  <div className={`p-2 rounded-full ${
                    watch('patientType') === 'existing' ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <UserCheck className={`h-5 w-5 ${
                      watch('patientType') === 'existing' ? 'text-primary-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Existing Patient</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Find patient records</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  watch('patientType') === 'emergency' 
                    ? 'border-error-500 bg-error-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('patientType', 'emergency')}
              >
                <div className="flex items-center mb-2">
                  <div className={`p-2 rounded-full ${
                    watch('patientType') === 'emergency' ? 'bg-error-100' : 'bg-gray-100'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 ${
                      watch('patientType') === 'emergency' ? 'text-error-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Emergency</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Fast-track emergency case</p>
              </div>
            </div>
            
            {/* Existing Patient Search */}
            {watch('patientType') === 'existing' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Find Existing Patient</h3>
                
                <form onSubmit={handleSearch} className="mb-4">
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
                      type="submit"
                      className="absolute inset-y-0 right-0 px-3 flex items-center bg-primary-500 text-white rounded-r-md"
                    >
                      Search
                    </button>
                  </div>
                </form>
                
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : hasSearched ? (
                  searchResults.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <div 
                          key={patient.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer"
                          onClick={() => selectExistingPatient(patient)}
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</div>
                              <div className="text-sm text-gray-500">{patient.contact_number}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                      <p className="text-gray-500 mb-4">No patients match your search criteria</p>
                      <button
                        type="button"
                        onClick={() => setValue('patientType', 'new')}
                        className="btn btn-primary"
                      >
                        Register as New Patient
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Enter a name or contact number to search
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <p className="text-gray-600 mb-6">Enter the patient's personal details</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div>
                <label className="form-label required">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register('dateOfBirth', { 
                      required: 'Date of birth is required',
                      validate: value => {
                        const date = new Date(value);
                        const today = new Date();
                        return date <= today || 'Date of birth cannot be in the future';
                      }
                    })}
                    className={`form-input pl-10 ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="form-error">{errors.dateOfBirth.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label">Age</label>
                <input
                  type="text"
                  {...register('age')}
                  className="form-input bg-gray-100"
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Auto-calculated from date of birth</p>
              </div>
              
              <div>
                <label className="form-label required">Gender</label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-600 mb-6">Enter the patient's contact details</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="+1 (555) 000-0000"
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
                    {...register('email', { 
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`form-input pl-10 ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="patient@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
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
                    rows={3}
                    placeholder="Enter complete address"
                  />
                </div>
                {errors.address && (
                  <p className="form-error">{errors.address.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label required">Contact Name</label>
                    <input
                      type="text"
                      {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                      className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Full name"
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
                      placeholder="e.g., Spouse, Parent, Child"
                    />
                    {errors.emergencyContact?.relationship && (
                      <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Contact Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                        className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="+1 (555) 000-0000"
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
        
        {/* Step 4: Priority & Payment */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority & Payment</h2>
            <p className="text-gray-600 mb-6">Set patient priority and payment method</p>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Level</h3>
              
              {patientType === 'emergency' ? (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-error-800 font-medium">Emergency Case</h4>
                      <p className="text-error-600 text-sm">
                        This patient has been marked as an emergency case and will be given critical priority.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      watch('priority') === 'normal' 
                        ? 'border-success-500 bg-success-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'normal')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Normal</h4>
                      <div className={`w-3 h-3 rounded-full ${
                        watch('priority') === 'normal' ? 'bg-success-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <p className="text-sm text-gray-500">Standard priority for routine cases</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      watch('priority') === 'urgent' 
                        ? 'border-warning-500 bg-warning-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'urgent')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Urgent</h4>
                      <div className={`w-3 h-3 rounded-full ${
                        watch('priority') === 'urgent' ? 'bg-warning-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <p className="text-sm text-gray-500">Requires prompt attention</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      watch('priority') === 'critical' 
                        ? 'border-error-500 bg-error-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'critical')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Critical</h4>
                      <div className={`w-3 h-3 rounded-full ${
                        watch('priority') === 'critical' ? 'bg-error-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <p className="text-sm text-gray-500">Immediate life-threatening condition</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    watch('paymentMethod') === 'cash' 
                      ? 'border-primary-500 bg-primary-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'cash')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full ${
                      watch('paymentMethod') === 'cash' ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <DollarSign className={`h-5 w-5 ${
                        watch('paymentMethod') === 'cash' ? 'text-primary-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">Cash</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Pay with cash</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    watch('paymentMethod') === 'insurance' 
                      ? 'border-primary-500 bg-primary-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'insurance')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full ${
                      watch('paymentMethod') === 'insurance' ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`h-5 w-5 ${
                        watch('paymentMethod') === 'insurance' ? 'text-primary-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">Insurance</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Pay with health insurance</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    watch('paymentMethod') === 'mobile_money' 
                      ? 'border-primary-500 bg-primary-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'mobile_money')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full ${
                      watch('paymentMethod') === 'mobile_money' ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Smartphone className={`h-5 w-5 ${
                        watch('paymentMethod') === 'mobile_money' ? 'text-primary-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">Mobile Money</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Pay with mobile money</p>
                </div>
              </div>
              
              {/* Insurance Details */}
              {paymentMethod === 'insurance' && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Insurance Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Insurance Provider</label>
                      <input
                        type="text"
                        {...register('insuranceDetails.provider', { 
                          required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false
                        })}
                        className={`form-input ${errors.insuranceDetails?.provider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="e.g., Blue Cross, Aetna"
                      />
                      {errors.insuranceDetails?.provider && (
                        <p className="form-error">{errors.insuranceDetails.provider.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Policy Number</label>
                      <input
                        type="text"
                        {...register('insuranceDetails.policyNumber', { 
                          required: paymentMethod === 'insurance' ? 'Policy number is required' : false
                        })}
                        className={`form-input ${errors.insuranceDetails?.policyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="e.g., ABC123456789"
                      />
                      {errors.insuranceDetails?.policyNumber && (
                        <p className="form-error">{errors.insuranceDetails.policyNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Coverage Percentage</label>
                      <div className="relative">
                        <input
                          type="number"
                          {...register('insuranceDetails.coveragePercentage', { 
                            required: paymentMethod === 'insurance' ? 'Coverage percentage is required' : false,
                            min: { value: 0, message: 'Must be at least 0%' },
                            max: { value: 100, message: 'Must be at most 100%' }
                          })}
                          className={`form-input pr-8 ${errors.insuranceDetails?.coveragePercentage ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                          placeholder="e.g., 80"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                      {errors.insuranceDetails?.coveragePercentage && (
                        <p className="form-error">{errors.insuranceDetails.coveragePercentage.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mobile Money Details */}
              {paymentMethod === 'mobile_money' && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Mobile Money Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Provider</label>
                      <select
                        {...register('mobileMoneyDetails.provider', { 
                          required: paymentMethod === 'mobile_money' ? 'Provider is required' : false
                        })}
                        className={`form-input ${errors.mobileMoneyDetails?.provider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      >
                        <option value="">Select Provider</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="airtel">Airtel Money</option>
                        <option value="orange">Orange Money</option>
                        <option value="mtn">MTN Mobile Money</option>
                      </select>
                      {errors.mobileMoneyDetails?.provider && (
                        <p className="form-error">{errors.mobileMoneyDetails.provider.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Phone Number</label>
                      <input
                        type="tel"
                        {...register('mobileMoneyDetails.phoneNumber', { 
                          required: paymentMethod === 'mobile_money' ? 'Phone number is required' : false
                        })}
                        className={`form-input ${errors.mobileMoneyDetails?.phoneNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="e.g., +254 712 345 678"
                      />
                      {errors.mobileMoneyDetails?.phoneNumber && (
                        <p className="form-error">{errors.mobileMoneyDetails.phoneNumber.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Enter the number in international format</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Information</h2>
            <p className="text-gray-600 mb-6">Please review the patient information before submitting</p>
            
            {patientType === 'emergency' && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-error-800 font-medium">Emergency Case</h4>
                    <p className="text-error-600 text-sm">
                      This patient has been marked as an emergency case and will be given critical priority.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  Personal Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{watch('dateOfBirth')} ({watch('age')} years)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-sm font-medium text-gray-900">{watch('gender')?.charAt(0).toUpperCase() + watch('gender')?.slice(1)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  Contact Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Contact Number</p>
                      <p className="text-sm font-medium text-gray-900">{watch('contactNumber')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-sm font-medium text-gray-900">{watch('email') || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{watch('address')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                  Emergency Contact
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{watch('emergencyContact.name')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Relationship</p>
                      <p className="text-sm font-medium text-gray-900">{watch('emergencyContact.relationship')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{watch('emergencyContact.phone')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-gray-400 mr-2" />
                  Priority Level
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      watch('priority') === 'normal' ? 'bg-success-500' :
                      watch('priority') === 'urgent' ? 'bg-warning-500' :
                      'bg-error-500'
                    }`}></div>
                    <p className="text-sm font-medium text-gray-900">
                      {watch('priority')?.charAt(0).toUpperCase() + watch('priority')?.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  Payment Method
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Method</p>
                      <p className="text-sm font-medium text-gray-900">
                        {watch('paymentMethod') === 'cash' ? 'Cash' :
                         watch('paymentMethod') === 'insurance' ? 'Insurance' :
                         'Mobile Money'}
                      </p>
                    </div>
                    
                    {watch('paymentMethod') === 'insurance' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Provider</p>
                            <p className="text-sm font-medium text-gray-900">{watch('insuranceDetails.provider')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Policy Number</p>
                            <p className="text-sm font-medium text-gray-900">{watch('insuranceDetails.policyNumber')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Coverage</p>
                            <p className="text-sm font-medium text-gray-900">{watch('insuranceDetails.coveragePercentage')}%</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {watch('paymentMethod') === 'mobile_money' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Provider</p>
                            <p className="text-sm font-medium text-gray-900">
                              {watch('mobileMoneyDetails.provider')?.charAt(0).toUpperCase() + watch('mobileMoneyDetails.provider')?.slice(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone Number</p>
                            <p className="text-sm font-medium text-gray-900">{watch('mobileMoneyDetails.phoneNumber')}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
              onClick={() => navigate('/reception')}
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
                (currentStep === 1 && !watch('patientType')) ||
                (currentStep === 1 && watch('patientType') === 'existing' && !watch('existingPatientId'))
              }
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
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