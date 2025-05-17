import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from "../../lib/store";
import { useHybridStorage } from "../../lib/hooks/useHybridStorage";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  CreditCard,
  DollarSign,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Hash
} from 'lucide-react';

interface PatientFormData {
  patientType: 'new' | 'existing' | 'emergency';
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  age: number;
  gender: string;
  patientId: string;
  contactNumber: string;
  email?: string;
  address: string;
  hasEmergencyContact: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo?: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    bloodType?: string;
    smoker?: boolean;
    alcoholConsumption?: string;
  };
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'mpesa';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  creditCardInfo?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
  mpesaInfo?: {
    phoneNumber: string;
    transactionId: string;
  };
  notes?: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [emergencyContactExpanded, setEmergencyContactExpanded] = useState(false);
  
  const { saveItem } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      age: 0,
      gender: '',
      patientId: '',
      contactNumber: '',
      email: '',
      address: '',
      hasEmergencyContact: false,
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalInfo: {
        allergies: [],
        chronicConditions: [],
        currentMedications: []
      },
      paymentMethod: 'cash',
      notes: ''
    }
  });
  
  const patientType = watch('patientType');
  const paymentMethod = watch('paymentMethod');
  const hasEmergencyContact = watch('hasEmergencyContact');
  
  useEffect(() => {
    // Generate a patient ID when the component loads
    generatePatientId();
    
    // Set emergency mode if coming from emergency route
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('emergency') === 'true') {
      setIsEmergency(true);
      setValue('patientType', 'emergency');
    }
  }, [setValue]);
  
  const generatePatientId = () => {
    // Generate a unique patient ID with format PT + random 6 digits
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const newPatientId = `PT${randomId}`;
    setPatientId(newPatientId);
    setValue('patientId', newPatientId);
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create a unique ID for the patient record
      const patientUuid = crypto.randomUUID();
      
      // Format the data for storage
      const patientData = {
        id: patientUuid,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email,
        address: data.address,
        emergency_contact: data.hasEmergencyContact ? data.emergencyContact : {
          name: '',
          relationship: '',
          phone: ''
        },
        medical_info: data.medicalInfo,
        status: 'active',
        current_flow_step: isEmergency ? 'emergency' : 'registration',
        priority_level: isEmergency ? 'critical' : 'normal',
        payment_info: {
          method: data.paymentMethod,
          ...(data.paymentMethod === 'insurance' && { insurance: data.insuranceInfo }),
          ...(data.paymentMethod === 'credit_card' && { creditCard: data.creditCardInfo }),
          ...(data.paymentMethod === 'mpesa' && { mpesa: data.mpesaInfo })
        },
        notes: data.notes,
        created_at: new Date().toISOString(),
        patient_id: data.patientId
      };
      
      // Save the patient data
      await saveItem(patientData, patientUuid);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Redirect based on patient type
      if (isEmergency) {
        navigate(`/patients/${patientUuid}/triage`);
      } else {
        navigate('/patients');
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEmergency ? 'Emergency Patient Registration' : 'Patient Registration'}
            </h1>
            <p className="text-primary-100 text-lg">
              Register new or manage existing patients
            </p>
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="px-8 py-6 border-b border-gray-200">
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
          <div className="text-lg text-gray-600">
            Step {currentStep} of 5
          </div>
        </div>
        <div className="flex justify-between mt-3 text-md text-gray-600">
          <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
          <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
          <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
          <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
          <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-8 py-6">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Type</h2>
              <p className="text-lg text-gray-600 mb-6">Select the appropriate patient type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    patientType === 'new' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'new')}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      patientType === 'new' ? 'bg-primary-500' : 'bg-gray-200'
                    }`}>
                      <User className={`h-5 w-5 ${patientType === 'new' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-xl font-medium text-gray-900">New Patient</h3>
                  </div>
                  <p className="text-md text-gray-600">Register a new patient</p>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    patientType === 'existing' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setValue('patientType', 'existing');
                    navigate('/patients/search');
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      patientType === 'existing' ? 'bg-primary-500' : 'bg-gray-200'
                    }`}>
                      <User className={`h-5 w-5 ${patientType === 'existing' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-xl font-medium text-gray-900">Existing Patient</h3>
                  </div>
                  <p className="text-md text-gray-600">Find patient records</p>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setValue('patientType', 'emergency');
                    setIsEmergency(true);
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      patientType === 'emergency' ? 'bg-error-500' : 'bg-gray-200'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${patientType === 'emergency' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-xl font-medium text-gray-900">Emergency</h3>
                  </div>
                  <p className="text-md text-gray-600">Fast-track emergency case</p>
                </div>
              </div>
              
              {isEmergency && (
                <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
                  <AlertTriangle className="h-6 w-6 text-error-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-error-800 text-lg">Emergency Mode Activated</h3>
                    <p className="text-error-700 text-md">
                      This patient will be fast-tracked through the registration process and immediately flagged for urgent care.
                      You can complete additional details later.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              <p className="text-lg text-gray-600 mb-6">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    First Name <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.firstName ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-error-500 text-md">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Last Name <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.lastName ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-error-500 text-md">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="pl-12 pr-4 py-3 w-full border-2 border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Age <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('age', { 
                        required: 'Age is required',
                        min: { value: 0, message: 'Age must be a positive number' },
                        max: { value: 120, message: 'Age must be less than 120' }
                      })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.age ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Enter age"
                    />
                  </div>
                  {errors.age && (
                    <p className="mt-2 text-error-500 text-md">{errors.age.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Gender <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <select
                      {...register('gender', { required: 'Gender is required' })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.gender ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <p className="mt-2 text-error-500 text-md">{errors.gender.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Patient ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={patientId}
                      readOnly
                      className="pl-12 pr-4 py-3 w-full border-2 border-gray-300 rounded-lg bg-gray-50 text-lg"
                    />
                  </div>
                  <p className="mt-2 text-gray-500 text-md">Auto-generated unique identifier</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <p className="text-lg text-gray-600 mb-6">Enter the patient's contact details</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Phone number is required' })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.contactNumber ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="mt-2 text-error-500 text-md">{errors.contactNumber.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email', { 
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.email ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-error-500 text-md">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Address <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="h-6 w-6 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                        errors.address ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      rows={3}
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-2 text-error-500 text-md">{errors.address.message}</p>
                  )}
                </div>
                
                {/* Collapsible Emergency Contact Section */}
                <div className="border-2 border-gray-200 rounded-lg p-5">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setEmergencyContactExpanded(!emergencyContactExpanded)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hasEmergencyContact"
                        {...register('hasEmergencyContact')}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label htmlFor="hasEmergencyContact" className="ml-3 text-lg font-medium text-gray-700">
                        Emergency Contact Information
                      </label>
                    </div>
                    {emergencyContactExpanded ? (
                      <ChevronUp className="h-6 w-6 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  
                  {emergencyContactExpanded && (
                    <div className="mt-5 space-y-5">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Contact Name {hasEmergencyContact && <span className="text-error-500">*</span>}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            {...register('emergencyContact.name', { 
                              required: hasEmergencyContact ? 'Emergency contact name is required' : false 
                            })}
                            className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                              errors.emergencyContact?.name ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                            }`}
                            placeholder="Enter emergency contact name"
                          />
                        </div>
                        {errors.emergencyContact?.name && (
                          <p className="mt-2 text-error-500 text-md">{errors.emergencyContact.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Relationship {hasEmergencyContact && <span className="text-error-500">*</span>}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            {...register('emergencyContact.relationship', { 
                              required: hasEmergencyContact ? 'Relationship is required' : false 
                            })}
                            className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                              errors.emergencyContact?.relationship ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                            }`}
                            placeholder="E.g., Spouse, Parent, Child"
                          />
                        </div>
                        {errors.emergencyContact?.relationship && (
                          <p className="mt-2 text-error-500 text-md">{errors.emergencyContact.relationship.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Phone Number {hasEmergencyContact && <span className="text-error-500">*</span>}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-6 w-6 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            {...register('emergencyContact.phone', { 
                              required: hasEmergencyContact ? 'Emergency contact phone is required' : false 
                            })}
                            className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                              errors.emergencyContact?.phone ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                            }`}
                            placeholder="Enter emergency contact phone"
                          />
                        </div>
                        {errors.emergencyContact?.phone && (
                          <p className="mt-2 text-error-500 text-md">{errors.emergencyContact.phone.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Payment Information */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
              <p className="text-lg text-gray-600 mb-6">Select payment method and provide details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'cash')}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'bg-primary-500' : 'bg-gray-200'
                    }`}>
                      <DollarSign className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Cash</h3>
                  </div>
                  <p className="text-md text-gray-600">Pay with cash</p>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'insurance' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'insurance')}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'insurance' ? 'bg-primary-500' : 'bg-gray-200'
                    }`}>
                      <Building2 className={`h-5 w-5 ${paymentMethod === 'insurance' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Insurance</h3>
                  </div>
                  <p className="text-md text-gray-600">Pay with insurance</p>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'credit_card' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'credit_card')}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'credit_card' ? 'bg-primary-500' : 'bg-gray-200'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${paymentMethod === 'credit_card' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Credit Card</h3>
                  </div>
                  <p className="text-md text-gray-600">Pay with credit card</p>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'mpesa' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'mpesa')}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'mpesa' ? 'bg-primary-500' : 'bg-gray-200'
                    }`}>
                      <Smartphone className={`h-5 w-5 ${paymentMethod === 'mpesa' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">M-Pesa</h3>
                  </div>
                  <p className="text-md text-gray-600">Pay with M-Pesa</p>
                </div>
              </div>
              
              {/* Insurance Information */}
              {paymentMethod === 'insurance' && (
                <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-900">Insurance Information</h3>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Insurance Provider <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('insuranceInfo.provider', { 
                          required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false 
                        })}
                        className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                          errors.insuranceInfo?.provider ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="Enter insurance provider"
                      />
                    </div>
                    {errors.insuranceInfo?.provider && (
                      <p className="mt-2 text-error-500 text-md">{errors.insuranceInfo.provider.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Policy Number <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('insuranceInfo.policyNumber', { 
                          required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                        })}
                        className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                          errors.insuranceInfo?.policyNumber ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="Enter policy number"
                      />
                    </div>
                    {errors.insuranceInfo?.policyNumber && (
                      <p className="mt-2 text-error-500 text-md">{errors.insuranceInfo.policyNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Expiry Date <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        {...register('insuranceInfo.expiryDate', { 
                          required: paymentMethod === 'insurance' ? 'Expiry date is required' : false 
                        })}
                        className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                          errors.insuranceInfo?.expiryDate ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                      />
                    </div>
                    {errors.insuranceInfo?.expiryDate && (
                      <p className="mt-2 text-error-500 text-md">{errors.insuranceInfo.expiryDate.message}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Credit Card Information */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-900">Credit Card Information</h3>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Card Number <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('creditCardInfo.cardNumber', { 
                          required: paymentMethod === 'credit_card' ? 'Card number is required' : false,
                          pattern: {
                            value: /^[0-9]{13,19}$/,
                            message: 'Invalid card number'
                          }
                        })}
                        className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                          errors.creditCardInfo?.cardNumber ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="Enter card number"
                      />
                    </div>
                    {errors.creditCardInfo?.cardNumber && (
                      <p className="mt-2 text-error-500 text-md">{errors.creditCardInfo.cardNumber.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-2">
                        Expiry Date <span className="text-error-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register('creditCardInfo.expiryDate', { 
                            required: paymentMethod === 'credit_card' ? 'Expiry date is required' : false,
                            pattern: {
                              value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                              message: 'Format: MM/YY'
                            }
                          })}
                          className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                            errors.creditCardInfo?.expiryDate ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                          }`}
                          placeholder="MM/YY"
                        />
                      </div>
                      {errors.creditCardInfo?.expiryDate && (
                        <p className="mt-2 text-error-500 text-md">{errors.creditCardInfo.expiryDate.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-2">
                        CVV <span className="text-error-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register('creditCardInfo.cvv', { 
                            required: paymentMethod === 'credit_card' ? 'CVV is required' : false,
                            pattern: {
                              value: /^[0-9]{3,4}$/,
                              message: 'Invalid CVV'
                            }
                          })}
                          className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                            errors.creditCardInfo?.cvv ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                          }`}
                          placeholder="Enter CVV"
                        />
                      </div>
                      {errors.creditCardInfo?.cvv && (
                        <p className="mt-2 text-error-500 text-md">{errors.creditCardInfo.cvv.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* M-Pesa Information */}
              {paymentMethod === 'mpesa' && (
                <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-900">M-Pesa Information</h3>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Smartphone className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('mpesaInfo.phoneNumber', { 
                          required: paymentMethod === 'mpesa' ? 'Phone number is required' : false
                        })}
                        className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                          errors.mpesaInfo?.phoneNumber ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="Enter M-Pesa phone number"
                      />
                    </div>
                    {errors.mpesaInfo?.phoneNumber && (
                      <p className="mt-2 text-error-500 text-md">{errors.mpesaInfo.phoneNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Transaction ID <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('mpesaInfo.transactionId', { 
                          required: paymentMethod === 'mpesa' ? 'Transaction ID is required' : false
                        })}
                        className={`pl-12 pr-4 py-3 w-full border-2 rounded-lg text-lg ${
                          errors.mpesaInfo?.transactionId ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="Enter M-Pesa transaction ID"
                      />
                    </div>
                    {errors.mpesaInfo?.transactionId && (
                      <p className="mt-2 text-error-500 text-md">{errors.mpesaInfo.transactionId.message}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <div className="relative">
                  <textarea
                    {...register('notes')}
                    className="p-4 w-full border-2 border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-lg"
                    rows={3}
                    placeholder="Enter any additional notes or information"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Information</h2>
              <p className="text-lg text-gray-600 mb-6">Please review the patient information before submitting</p>
              
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-md font-medium text-gray-500">First Name</p>
                      <p className="text-lg text-gray-900">{watch('firstName')}</p>
                    </div>
                    <div>
                      <p className="text-md font-medium text-gray-500">Last Name</p>
                      <p className="text-lg text-gray-900">{watch('lastName')}</p>
                    </div>
                    <div>
                      <p className="text-md font-medium text-gray-500">Age</p>
                      <p className="text-lg text-gray-900">{watch('age')} years</p>
                    </div>
                    <div>
                      <p className="text-md font-medium text-gray-500">Gender</p>
                      <p className="text-lg text-gray-900">{watch('gender')}</p>
                    </div>
                    <div>
                      <p className="text-md font-medium text-gray-500">Patient ID</p>
                      <p className="text-lg text-gray-900">{patientId}</p>
                    </div>
                    {watch('dateOfBirth') && (
                      <div>
                        <p className="text-md font-medium text-gray-500">Date of Birth</p>
                        <p className="text-lg text-gray-900">{watch('dateOfBirth')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-md font-medium text-gray-500">Phone Number</p>
                      <p className="text-lg text-gray-900">{watch('contactNumber')}</p>
                    </div>
                    {watch('email') && (
                      <div>
                        <p className="text-md font-medium text-gray-500">Email</p>
                        <p className="text-lg text-gray-900">{watch('email')}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-md font-medium text-gray-500">Address</p>
                      <p className="text-lg text-gray-900">{watch('address')}</p>
                    </div>
                  </div>
                </div>
                
                {hasEmergencyContact && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-md font-medium text-gray-500">Name</p>
                        <p className="text-lg text-gray-900">{watch('emergencyContact.name')}</p>
                      </div>
                      <div>
                        <p className="text-md font-medium text-gray-500">Relationship</p>
                        <p className="text-lg text-gray-900">{watch('emergencyContact.relationship')}</p>
                      </div>
                      <div>
                        <p className="text-md font-medium text-gray-500">Phone Number</p>
                        <p className="text-lg text-gray-900">{watch('emergencyContact.phone')}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Payment Information</h3>
                  <div>
                    <p className="text-md font-medium text-gray-500">Payment Method</p>
                    <p className="text-lg text-gray-900 capitalize">{watch('paymentMethod').replace('_', ' ')}</p>
                  </div>
                  
                  {paymentMethod === 'insurance' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-md font-medium text-gray-500">Insurance Provider</p>
                        <p className="text-lg text-gray-900">{watch('insuranceInfo.provider')}</p>
                      </div>
                      <div>
                        <p className="text-md font-medium text-gray-500">Policy Number</p>
                        <p className="text-lg text-gray-900">{watch('insuranceInfo.policyNumber')}</p>
                      </div>
                      <div>
                        <p className="text-md font-medium text-gray-500">Expiry Date</p>
                        <p className="text-lg text-gray-900">{watch('insuranceInfo.expiryDate')}</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'credit_card' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-md font-medium text-gray-500">Card Number</p>
                        <p className="text-lg text-gray-900">
                          **** **** **** {watch('creditCardInfo.cardNumber')?.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-md font-medium text-gray-500">Expiry Date</p>
                        <p className="text-lg text-gray-900">{watch('creditCardInfo.expiryDate')}</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'mpesa' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-md font-medium text-gray-500">M-Pesa Phone Number</p>
                        <p className="text-lg text-gray-900">{watch('mpesaInfo.phoneNumber')}</p>
                      </div>
                      <div>
                        <p className="text-md font-medium text-gray-500">Transaction ID</p>
                        <p className="text-lg text-gray-900">{watch('mpesaInfo.transactionId')}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {watch('notes') && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Additional Notes</h3>
                    <p className="text-lg text-gray-900">{watch('notes')}</p>
                  </div>
                )}
                
                {isEmergency && (
                  <div className="p-6 bg-error-50 border-2 border-error-200 rounded-lg flex items-start">
                    <AlertTriangle className="h-6 w-6 text-error-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-error-800 text-lg">Emergency Patient</h3>
                      <p className="text-error-700 text-md">
                        This patient will be fast-tracked for immediate medical attention.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center text-lg px-6 py-3"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex items-center text-lg px-6 py-3"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Cancel
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center text-lg px-6 py-3"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center text-lg px-6 py-3"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Register Patient
                  <CheckCircle className="h-5 w-5 ml-2" />
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