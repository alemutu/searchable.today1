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
  Heart, 
  AlertTriangle, 
  Save, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  UserPlus,
  UserRound,
  Search,
  Clock
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientFormData {
  firstName: string;
  lastName: string;
  age?: number;
  gender: string;
  contactNumber: string;
  email?: string;
  address: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  priorityLevel: string;
  priorityNotes?: string;
}

const PatientRegistrationForm: React.FC = () => {
  const { user, hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState<string>(uuidv4());
  
  // Storage hook for patients
  const { 
    saveItem: savePatient,
    error: patientError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'male',
      contactNumber: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      priorityLevel: 'normal'
    }
  });
  
  const priorityLevel = watch('priorityLevel');
  const formValues = watch();
  
  // Display error notification if there's a patient error
  useEffect(() => {
    if (patientError) {
      addNotification({
        message: `Error with patient data: ${patientError.message}`,
        type: 'error'
      });
    }
  }, [patientError, addNotification]);
  
  // Generate a new patient ID when the component loads
  useEffect(() => {
    setPatientId(uuidv4());
  }, []);
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsLoading(true);
      
      // Create patient object
      const patient = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: calculateDateOfBirth(data.age || 0),
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email || null,
        address: data.address,
        emergency_contact: data.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        medical_history: null,
        status: 'active',
        current_flow_step: 'registration',
        priority_level: data.priorityLevel,
        priority_notes: data.priorityNotes
      };
      
      // Save patient to storage
      await savePatient(patient, patientId);
      
      // Show success notification
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Navigate to patient list
      navigate('/patients');
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error registering patient: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateDateOfBirth = (age: number): string => {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return `${birthYear}-01-01`; // Default to January 1st of the birth year
  };
  
  // Format the patient ID for display
  const formatPatientId = (id: string): string => {
    // Use the first 8 characters of the UUID
    const shortId = id.substring(0, 8);
    return `PT-${shortId.toUpperCase()}`;
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate('/patients')}
              className="mr-4 p-2 rounded-full text-white hover:bg-white/10"
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
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : 1}
                </div>
                <div className={`h-1 w-12 ${
                  currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : 2}
                </div>
                <div className={`h-1 w-12 ${
                  currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 3 ? <CheckCircle className="h-5 w-5" /> : 3}
                </div>
                <div className={`h-1 w-12 ${
                  currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 4 ? <CheckCircle className="h-5 w-5" /> : 4}
                </div>
                <div className={`h-1 w-12 ${
                  currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  5
                </div>
              </div>
              <div className="text-xs text-gray-500">
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="border-2 border-primary-500 bg-primary-50 rounded-lg p-6 flex flex-col items-center cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <UserPlus className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">New Patient</h3>
                  <p className="text-sm text-gray-500 text-center">Register a new patient</p>
                </div>
                
                <div 
                  className="border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate('/patients/search')}
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Existing Patient</h3>
                  <p className="text-sm text-gray-500 text-center">Find patient records</p>
                </div>
                
                <div 
                  className="border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setValue('priorityLevel', 'critical');
                    nextStep();
                    nextStep();
                    nextStep();
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-error-100 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-error-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Emergency</h3>
                  <p className="text-sm text-gray-500 text-center">Fast-track emergency case</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <UserRound className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Patient ID</h3>
                    <p className="mt-1 text-sm text-blue-600">
                      A unique ID <span className="font-mono font-medium">{formatPatientId(patientId)}</span> will be assigned to this patient.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Personal Info */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
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
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label required">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label required">Age</label>
                  <input
                    type="number"
                    {...register('age', { 
                      required: 'Age is required',
                      min: { value: 0, message: 'Age must be a positive number' },
                      max: { value: 120, message: 'Age cannot exceed 120' }
                    })}
                    className={`form-input ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter age"
                  />
                  {errors.age && <p className="form-error">{errors.age.message}</p>}
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
                  {errors.gender && <p className="form-error">{errors.gender.message}</p>}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="form-label required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Phone number is required' })}
                      className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
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
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
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
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && <p className="form-error">{errors.address.message}</p>}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label">Emergency Contact</label>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>
                  
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="form-label text-sm">Contact Name</label>
                      <input
                        type="text"
                        {...register('emergencyContact.name')}
                        className="form-input"
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label text-sm">Relationship</label>
                        <input
                          type="text"
                          {...register('emergencyContact.relationship')}
                          className="form-input"
                          placeholder="E.g., Spouse, Parent, etc."
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Phone Number</label>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone')}
                          className="form-input"
                          placeholder="Enter emergency contact phone"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Priority</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="form-label required">Priority Level</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div 
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        priorityLevel === 'normal' 
                          ? 'border-success-500 bg-success-50 ring-2 ring-success-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('priorityLevel', 'normal')}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center mb-3">
                          <Clock className="h-6 w-6 text-success-600" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Normal</h3>
                        <p className="text-xs text-gray-500 text-center">Standard priority</p>
                      </div>
                      {priorityLevel === 'normal' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-success-500" />
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        priorityLevel === 'urgent' 
                          ? 'border-warning-500 bg-warning-50 ring-2 ring-warning-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('priorityLevel', 'urgent')}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center mb-3">
                          <AlertTriangle className="h-6 w-6 text-warning-600" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Urgent</h3>
                        <p className="text-xs text-gray-500 text-center">Requires prompt attention</p>
                      </div>
                      {priorityLevel === 'urgent' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-warning-500" />
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        priorityLevel === 'critical' 
                          ? 'border-error-500 bg-error-50 ring-2 ring-error-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('priorityLevel', 'critical')}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center mb-3">
                          <Heart className="h-6 w-6 text-error-600" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Critical</h3>
                        <p className="text-xs text-gray-500 text-center">Immediate medical attention</p>
                      </div>
                      {priorityLevel === 'critical' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-error-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Priority Notes</label>
                  <textarea
                    {...register('priorityNotes')}
                    className="form-input"
                    rows={3}
                    placeholder={
                      priorityLevel === 'critical' 
                        ? "Describe the critical condition or reason for emergency priority..." 
                        : priorityLevel === 'urgent'
                        ? "Describe the urgent condition requiring prompt attention..."
                        : "Add any notes about the patient's priority level..."
                    }
                  />
                </div>
                
                {priorityLevel === 'critical' && (
                  <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-error-800">Critical Priority</h3>
                        <p className="mt-1 text-sm text-error-700">
                          This patient will be flagged for immediate medical attention and will bypass normal queuing procedures.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.firstName} {formValues.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Age:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Gender:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.gender.charAt(0).toUpperCase() + formValues.gender.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.contactNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Email:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Address:</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[200px]">{formValues.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
                  {formValues.emergencyContact?.name ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Relationship:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.emergencyContact.relationship}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">{formValues.emergencyContact.phone}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No emergency contact provided</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Priority Level</h3>
                  <div className="flex items-center mb-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formValues.priorityLevel === 'normal' ? 'bg-success-100 text-success-800' :
                      formValues.priorityLevel === 'urgent' ? 'bg-warning-100 text-warning-800' :
                      'bg-error-100 text-error-800'
                    }`}>
                      {formValues.priorityLevel.charAt(0).toUpperCase() + formValues.priorityLevel.slice(1)}
                    </div>
                  </div>
                  {formValues.priorityNotes && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Notes:</span>
                      <p className="text-sm text-gray-700 mt-1">{formValues.priorityNotes}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <UserRound className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Patient ID</h3>
                      <p className="mt-1 text-sm text-blue-600">
                        This patient will be assigned ID: <span className="font-mono font-medium">{formatPatientId(patientId)}</span>
                      </p>
                    </div>
                  </div>
                </div>
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
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/patients')}
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
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
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