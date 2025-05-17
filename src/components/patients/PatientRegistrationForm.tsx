import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
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
  Building2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Hash
} from 'lucide-react';

interface PatientRegistrationFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  patientId: string;
  
  // Contact Information
  contactNumber: string;
  email: string;
  address: string;
  
  // Emergency Contact
  hasEmergencyContact: boolean;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  
  // Medical Information
  bloodType: string;
  allergies: string;
  chronicConditions: string[];
  currentMedications: string;
  
  // Payment Information
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'mpesa';
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  creditCardNumber?: string;
  creditCardExpiry?: string;
  creditCardCVV?: string;
  mpesaPhoneNumber?: string;
  mpesaTransactionId?: string;
  
  // Registration Type
  isEmergency: boolean;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  const [patientId, setPatientId] = useState('');
  
  const { 
    saveItem: savePatient,
    error: storageError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      gender: '',
      patientId: '',
      contactNumber: '',
      email: '',
      address: '',
      hasEmergencyContact: true,
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      bloodType: '',
      allergies: '',
      chronicConditions: [],
      currentMedications: '',
      paymentMethod: 'cash',
      isEmergency: false
    }
  });
  
  const paymentMethod = watch('paymentMethod');
  const isEmergency = watch('isEmergency');
  const hasEmergencyContact = watch('hasEmergencyContact');
  
  // Generate a unique patient ID
  useEffect(() => {
    const generatePatientId = () => {
      const prefix = 'PT';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}${timestamp}${random}`;
    };
    
    const newPatientId = generatePatientId();
    setPatientId(newPatientId);
    setValue('patientId', newPatientId);
  }, [setValue]);
  
  // Display error notification if there's a storage error
  useEffect(() => {
    if (storageError) {
      addNotification({
        message: `Error: ${storageError.message}`,
        type: 'error'
      });
    }
  }, [storageError, addNotification]);
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    try {
      // Create a patient object from form data
      const patient = {
        id: crypto.randomUUID(),
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email,
        address: data.address,
        emergency_contact: data.hasEmergencyContact ? {
          name: data.emergencyContactName,
          relationship: data.emergencyContactRelationship,
          phone: data.emergencyContactPhone
        } : null,
        medical_info: {
          bloodType: data.bloodType,
          allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
          chronicConditions: data.chronicConditions,
          currentMedications: data.currentMedications ? data.currentMedications.split(',').map(m => ({ name: m.trim() })) : []
        },
        payment_info: {
          method: data.paymentMethod,
          details: data.paymentMethod === 'insurance' ? {
            provider: data.insuranceProvider,
            policyNumber: data.insurancePolicyNumber
          } : data.paymentMethod === 'credit_card' ? {
            cardNumber: data.creditCardNumber?.slice(-4),
            expiry: data.creditCardExpiry
          } : data.paymentMethod === 'mpesa' ? {
            phoneNumber: data.mpesaPhoneNumber,
            transactionId: data.mpesaTransactionId
          } : null
        },
        status: 'active',
        current_flow_step: data.isEmergency ? 'emergency' : 'registration',
        priority_level: data.isEmergency ? 'critical' : 'normal',
        patient_id: data.patientId
      };
      
      // Save patient data
      await savePatient(patient, patient.id);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Redirect to reception dashboard instead of triage
      navigate('/reception');
      
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error registering patient: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : 1}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : 2}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 3 ? <CheckCircle className="h-5 w-5" /> : 3}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 4 ? <CheckCircle className="h-5 w-5" /> : 4}
            </div>
            <div className={`h-1 w-10 ${
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
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
          <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
          <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
          <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
          <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-primary-600 p-4 rounded-t-lg">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/reception')}
            className="text-white mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Patient Registration</h1>
            <p className="text-primary-100 text-sm">Register new or manage existing patients</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-b-lg shadow-md">
        {renderStepIndicator()}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Type</h2>
              <p className="text-gray-600 mb-6">Select the appropriate patient type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4 bg-primary-50 border-primary-500">
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="newPatient"
                      checked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      readOnly
                    />
                    <label htmlFor="newPatient" className="ml-2 block text-sm font-medium text-gray-700">
                      New Patient
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">Register a new patient</p>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50 border-gray-300 opacity-60">
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="existingPatient"
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="existingPatient" className="ml-2 block text-sm font-medium text-gray-700">
                      Existing Patient
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">Find patient records</p>
                </div>
                
                <div className="border rounded-lg p-4 hover:bg-red-50 hover:border-red-300 cursor-pointer" onClick={() => setValue('isEmergency', !isEmergency)}>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="emergencyCase"
                      {...register('isEmergency')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emergencyCase" className="ml-2 block text-sm font-medium text-gray-700">
                      Emergency Case
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">Fast-track emergency case</p>
                </div>
              </div>
              
              {isEmergency && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Emergency Registration</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This patient will be marked as an emergency case and prioritized in the system.
                        Only essential information is required for emergency registration.
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              <p className="text-gray-600 mb-6">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label required">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`form-input pl-10 ${errors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
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
                      className={`form-input pl-10 ${errors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="form-input pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label required">Age</label>
                  <input
                    type="number"
                    {...register('age', { 
                      required: 'Age is required',
                      min: { value: 0, message: 'Age must be a positive number' },
                      max: { value: 120, message: 'Age must be less than 120' }
                    })}
                    className={`form-input ${errors.age ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter age"
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label required">Gender</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input ${errors.gender ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">Patient ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={patientId}
                      className="form-input pl-10 bg-gray-50"
                      readOnly
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <p className="text-gray-600 mb-6">Enter the patient's contact details</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="form-label required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Phone number is required' })}
                      className={`form-input pl-10 ${errors.contactNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>}
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
                      className={`form-input pl-10 ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                
                <div>
                  <label className="form-label required">Address</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-10 ${errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      rows={3}
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasEmergencyContact"
                      {...register('hasEmergencyContact')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasEmergencyContact" className="ml-2 block text-sm font-medium text-gray-700">
                      Emergency Contact
                    </label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showEmergencyContact ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {showEmergencyContact && hasEmergencyContact && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="form-label required">Contact Name</label>
                      <input
                        type="text"
                        {...register('emergencyContactName', { 
                          required: hasEmergencyContact ? 'Emergency contact name is required' : false
                        })}
                        className={`form-input ${errors.emergencyContactName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter emergency contact name"
                      />
                      {errors.emergencyContactName && <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContactRelationship', { 
                          required: hasEmergencyContact ? 'Relationship is required' : false
                        })}
                        className={`form-input ${errors.emergencyContactRelationship ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="E.g., Spouse, Parent, Child"
                      />
                      {errors.emergencyContactRelationship && <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Contact Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContactPhone', { 
                            required: hasEmergencyContact ? 'Emergency contact phone is required' : false
                          })}
                          className={`form-input pl-10 ${errors.emergencyContactPhone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter emergency contact phone"
                        />
                      </div>
                      {errors.emergencyContactPhone && <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone.message}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Medical & Payment Information */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical & Payment Information</h2>
              <p className="text-gray-600 mb-6">Enter medical history and payment details</p>
              
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Medical Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="form-label">Blood Type</label>
                    <select
                      {...register('bloodType')}
                      className="form-input"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Allergies</label>
                    <input
                      type="text"
                      {...register('allergies')}
                      className="form-input"
                      placeholder="Enter allergies, separated by commas"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Chronic Conditions</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="diabetes"
                        value="Diabetes"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="diabetes" className="ml-2 block text-sm text-gray-700">
                        Diabetes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hypertension"
                        value="Hypertension"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hypertension" className="ml-2 block text-sm text-gray-700">
                        Hypertension
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="asthma"
                        value="Asthma"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="asthma" className="ml-2 block text-sm text-gray-700">
                        Asthma
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="heartDisease"
                        value="Heart Disease"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="heartDisease" className="ml-2 block text-sm text-gray-700">
                        Heart Disease
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Current Medications</label>
                  <input
                    type="text"
                    {...register('currentMedications')}
                    className="form-input"
                    placeholder="Enter medications, separated by commas"
                  />
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Payment Information</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50" onClick={() => setValue('paymentMethod', 'cash')}>
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="cash"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setValue('paymentMethod', 'cash')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="cash" className="ml-2 block text-sm font-medium text-gray-700">
                        Cash
                      </label>
                    </div>
                    <div className="flex justify-center">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50" onClick={() => setValue('paymentMethod', 'insurance')}>
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="insurance"
                        value="insurance"
                        checked={paymentMethod === 'insurance'}
                        onChange={() => setValue('paymentMethod', 'insurance')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="insurance" className="ml-2 block text-sm font-medium text-gray-700">
                        Insurance
                      </label>
                    </div>
                    <div className="flex justify-center">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50" onClick={() => setValue('paymentMethod', 'credit_card')}>
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="creditCard"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={() => setValue('paymentMethod', 'credit_card')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="creditCard" className="ml-2 block text-sm font-medium text-gray-700">
                        Credit Card
                      </label>
                    </div>
                    <div className="flex justify-center">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50" onClick={() => setValue('paymentMethod', 'mpesa')}>
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="mpesa"
                        value="mpesa"
                        checked={paymentMethod === 'mpesa'}
                        onChange={() => setValue('paymentMethod', 'mpesa')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="mpesa" className="ml-2 block text-sm font-medium text-gray-700">
                        M-Pesa
                      </label>
                    </div>
                    <div className="flex justify-center">
                      <Smartphone className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'insurance' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label required">Insurance Provider</label>
                      <input
                        type="text"
                        {...register('insuranceProvider', { 
                          required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false
                        })}
                        className={`form-input ${errors.insuranceProvider ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter insurance provider"
                      />
                      {errors.insuranceProvider && <p className="mt-1 text-sm text-red-600">{errors.insuranceProvider.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Policy Number</label>
                      <input
                        type="text"
                        {...register('insurancePolicyNumber', { 
                          required: paymentMethod === 'insurance' ? 'Policy number is required' : false
                        })}
                        className={`form-input ${errors.insurancePolicyNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter policy number"
                      />
                      {errors.insurancePolicyNumber && <p className="mt-1 text-sm text-red-600">{errors.insurancePolicyNumber.message}</p>}
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label required">Card Number</label>
                      <input
                        type="text"
                        {...register('creditCardNumber', { 
                          required: paymentMethod === 'credit_card' ? 'Card number is required' : false,
                          pattern: {
                            value: /^[0-9]{13,19}$/,
                            message: 'Invalid card number'
                          }
                        })}
                        className={`form-input ${errors.creditCardNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter card number"
                      />
                      {errors.creditCardNumber && <p className="mt-1 text-sm text-red-600">{errors.creditCardNumber.message}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label required">Expiry Date</label>
                        <input
                          type="text"
                          {...register('creditCardExpiry', { 
                            required: paymentMethod === 'credit_card' ? 'Expiry date is required' : false,
                            pattern: {
                              value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                              message: 'Invalid format (MM/YY)'
                            }
                          })}
                          className={`form-input ${errors.creditCardExpiry ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                          placeholder="MM/YY"
                        />
                        {errors.creditCardExpiry && <p className="mt-1 text-sm text-red-600">{errors.creditCardExpiry.message}</p>}
                      </div>
                      
                      <div>
                        <label className="form-label required">CVV</label>
                        <input
                          type="text"
                          {...register('creditCardCVV', { 
                            required: paymentMethod === 'credit_card' ? 'CVV is required' : false,
                            pattern: {
                              value: /^[0-9]{3,4}$/,
                              message: 'Invalid CVV'
                            }
                          })}
                          className={`form-input ${errors.creditCardCVV ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter CVV"
                        />
                        {errors.creditCardCVV && <p className="mt-1 text-sm text-red-600">{errors.creditCardCVV.message}</p>}
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'mpesa' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label required">M-Pesa Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Smartphone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('mpesaPhoneNumber', { 
                            required: paymentMethod === 'mpesa' ? 'M-Pesa phone number is required' : false,
                            pattern: {
                              value: /^[0-9+\s-]{10,15}$/,
                              message: 'Invalid phone number'
                            }
                          })}
                          className={`form-input pl-10 ${errors.mpesaPhoneNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter M-Pesa phone number"
                        />
                      </div>
                      {errors.mpesaPhoneNumber && <p className="mt-1 text-sm text-red-600">{errors.mpesaPhoneNumber.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Transaction ID</label>
                      <input
                        type="text"
                        {...register('mpesaTransactionId', { 
                          required: paymentMethod === 'mpesa' ? 'Transaction ID is required' : false
                        })}
                        className={`form-input ${errors.mpesaTransactionId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter M-Pesa transaction ID"
                      />
                      {errors.mpesaTransactionId && <p className="mt-1 text-sm text-red-600">{errors.mpesaTransactionId.message}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Review Information</h2>
              <p className="text-gray-600 mb-6">Please review the patient information before submitting</p>
              
              {isEmergency && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Emergency Case</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This patient will be registered as an emergency case and prioritized in the system.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border border-gray-200 rounded-lg divide-y">
                <div className="p-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-sm font-medium">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient ID</p>
                      <p className="text-sm font-medium">{watch('patientId')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="text-sm font-medium">{watch('age')} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-sm font-medium">{watch('gender')}</p>
                    </div>
                    {watch('dateOfBirth') && (
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="text-sm font-medium">{watch('dateOfBirth')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium">{watch('contactNumber')}</p>
                    </div>
                    {watch('email') && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium">{watch('email')}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium">{watch('address')}</p>
                    </div>
                  </div>
                </div>
                
                {hasEmergencyContact && (
                  <div className="p-4">
                    <h3 className="text-md font-medium text-gray-800 mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-sm font-medium">{watch('emergencyContactName')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Relationship</p>
                        <p className="text-sm font-medium">{watch('emergencyContactRelationship')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{watch('emergencyContactPhone')}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Medical Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {watch('bloodType') && (
                      <div>
                        <p className="text-sm text-gray-500">Blood Type</p>
                        <p className="text-sm font-medium">{watch('bloodType')}</p>
                      </div>
                    )}
                    {watch('allergies') && (
                      <div>
                        <p className="text-sm text-gray-500">Allergies</p>
                        <p className="text-sm font-medium">{watch('allergies')}</p>
                      </div>
                    )}
                    {watch('chronicConditions') && watch('chronicConditions').length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Chronic Conditions</p>
                        <p className="text-sm font-medium">{watch('chronicConditions').join(', ')}</p>
                      </div>
                    )}
                    {watch('currentMedications') && (
                      <div>
                        <p className="text-sm text-gray-500">Current Medications</p>
                        <p className="text-sm font-medium">{watch('currentMedications')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="text-sm font-medium">
                        {paymentMethod === 'cash' && 'Cash'}
                        {paymentMethod === 'insurance' && 'Insurance'}
                        {paymentMethod === 'credit_card' && 'Credit Card'}
                        {paymentMethod === 'mpesa' && 'M-Pesa'}
                      </p>
                    </div>
                    
                    {paymentMethod === 'insurance' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Insurance Provider</p>
                          <p className="text-sm font-medium">{watch('insuranceProvider')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Policy Number</p>
                          <p className="text-sm font-medium">{watch('insurancePolicyNumber')}</p>
                        </div>
                      </>
                    )}
                    
                    {paymentMethod === 'credit_card' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Card Number</p>
                          <p className="text-sm font-medium">**** **** **** {watch('creditCardNumber')?.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expiry Date</p>
                          <p className="text-sm font-medium">{watch('creditCardExpiry')}</p>
                        </div>
                      </>
                    )}
                    
                    {paymentMethod === 'mpesa' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">M-Pesa Phone Number</p>
                          <p className="text-sm font-medium">{watch('mpesaPhoneNumber')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Transaction ID</p>
                          <p className="text-sm font-medium">{watch('mpesaTransactionId')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline flex items-center"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/reception')}
                className="btn btn-outline flex items-center"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
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
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary flex items-center"
              >
                Register Patient
                <CheckCircle className="h-5 w-5 ml-1" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistrationForm;