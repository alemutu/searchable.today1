import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
  UserPlus, 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Smartphone
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
  email: string;
  phone: string;
  address: string;
  
  // Emergency Contact
  hasEmergencyContact: boolean;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  
  // Medical Information
  allergies: string;
  chronicConditions: string[];
  currentMedications: string;
  bloodType: string;
  
  // Payment Information
  paymentMethod: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceGroupNumber: string;
  mpesaPhoneNumber: string;
  mpesaTransactionId: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  
  const { 
    saveItem: savePatient,
    error: storageError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, control, trigger } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: 0,
      gender: '',
      patientId: '',
      email: '',
      phone: '',
      address: '',
      hasEmergencyContact: true,
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      allergies: '',
      chronicConditions: [],
      currentMedications: '',
      bloodType: '',
      paymentMethod: 'cash',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      insuranceGroupNumber: '',
      mpesaPhoneNumber: '',
      mpesaTransactionId: ''
    }
  });
  
  const watchPaymentMethod = watch('paymentMethod');
  const watchHasEmergencyContact = watch('hasEmergencyContact');
  
  useEffect(() => {
    // Generate a patient ID when the component mounts
    generatePatientId();
  }, []);
  
  const generatePatientId = () => {
    // Generate a unique patient ID
    const prefix = 'PT';
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newPatientId = `${prefix}${randomDigits}`;
    setPatientId(newPatientId);
    setValue('patientId', newPatientId);
  };
  
  const nextStep = async () => {
    // Validate the current step before proceeding
    let fieldsToValidate: (keyof PatientRegistrationFormData)[] = [];
    
    switch (currentStep) {
      case 1: // Personal Information
        fieldsToValidate = ['firstName', 'lastName', 'age', 'gender'];
        break;
      case 2: // Contact Information
        fieldsToValidate = ['phone', 'address'];
        if (watchHasEmergencyContact) {
          fieldsToValidate.push('emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship');
        }
        break;
      case 3: // Medical Information
        fieldsToValidate = ['bloodType'];
        break;
      case 4: // Payment Information
        if (watchPaymentMethod === 'insurance') {
          fieldsToValidate = ['insuranceProvider', 'insurancePolicyNumber'];
        } else if (watchPaymentMethod === 'mpesa') {
          fieldsToValidate = ['mpesaPhoneNumber', 'mpesaTransactionId'];
        }
        break;
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare patient data
      const patientData = {
        id: crypto.randomUUID(),
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
        gender: data.gender,
        contact_number: data.phone,
        email: data.email,
        address: data.address,
        emergency_contact: watchHasEmergencyContact ? {
          name: data.emergencyContactName,
          relationship: data.emergencyContactRelationship,
          phone: data.emergencyContactPhone
        } : null,
        medical_history: {
          allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
          chronicConditions: data.chronicConditions || [],
          currentMedications: data.currentMedications ? data.currentMedications.split(',').map(m => ({ name: m.trim() })) : [],
          bloodType: data.bloodType
        },
        payment_info: {
          method: data.paymentMethod,
          insurance: data.paymentMethod === 'insurance' ? {
            provider: data.insuranceProvider,
            policyNumber: data.insurancePolicyNumber,
            groupNumber: data.insuranceGroupNumber
          } : null,
          mpesa: data.paymentMethod === 'mpesa' ? {
            phoneNumber: data.mpesaPhoneNumber,
            transactionId: data.mpesaTransactionId
          } : null
        },
        status: 'active',
        current_flow_step: isEmergency ? 'emergency' : 'registration',
        priority_level: isEmergency ? 'critical' : 'normal',
        patient_id: data.patientId
      };
      
      // Save patient data
      await savePatient(patientData, patientData.id);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Redirect based on emergency status
      if (isEmergency) {
        navigate(`/patients/${patientData.id}/triage`);
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                Patient Registration
              </h1>
              <p className="text-primary-100 text-sm">
                Register new or manage existing patients
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
            <div className="text-sm text-gray-500">
              Step {currentStep} of 5
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
            <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
            <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Contact</div>
            <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Medical</div>
            <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Payment</div>
            <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-8 py-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                  
                  {/* Emergency toggle */}
                  <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isEmergency"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        className="h-4 w-4 text-error-600 focus:ring-error-500 border-error-300 rounded"
                      />
                      <label htmlFor="isEmergency" className="ml-2 flex items-center text-error-800 font-medium">
                        <AlertTriangle className="h-5 w-5 mr-2 text-error-500" />
                        Emergency Case
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-error-600 ml-6">
                      Mark as emergency to fast-track the registration process
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-error-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="firstName"
                          {...register('firstName', { required: 'First name is required' })}
                          className={`form-input pl-10 py-2 block w-full rounded-md ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                          placeholder="Enter first name"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-error-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="lastName"
                          {...register('lastName', { required: 'Last name is required' })}
                          className={`form-input pl-10 py-2 block w-full rounded-md ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                          placeholder="Enter last name"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                        Patient ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserPlus className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="patientId"
                          value={patientId}
                          readOnly
                          className="form-input pl-10 py-2 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier</p>
                    </div>
                    
                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                        Age <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="age"
                        {...register('age', { 
                          required: 'Age is required',
                          min: { value: 0, message: 'Age must be a positive number' },
                          max: { value: 120, message: 'Age must be less than 120' }
                        })}
                        className={`form-input py-2 block w-full rounded-md ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                        placeholder="Enter age"
                      />
                      {errors.age && (
                        <p className="mt-1 text-sm text-error-600">{errors.age.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="dateOfBirth"
                          {...register('dateOfBirth')}
                          className="form-input pl-10 py-2 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-error-500">*</span>
                      </label>
                      <select
                        id="gender"
                        {...register('gender', { required: 'Gender is required' })}
                        className={`form-select py-2 block w-full rounded-md ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-sm text-error-600">{errors.gender.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-error-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          {...register('phone', { required: 'Phone number is required' })}
                          className={`form-input pl-10 py-2 block w-full rounded-md ${errors.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          {...register('email', { 
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          className={`form-input pl-10 py-2 block w-full rounded-md ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                          placeholder="Enter email address"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address <span className="text-error-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          id="address"
                          {...register('address', { required: 'Address is required' })}
                          rows={3}
                          className={`form-textarea pl-10 py-2 block w-full rounded-md ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                          placeholder="Enter full address"
                        />
                      </div>
                      {errors.address && (
                        <p className="mt-1 text-sm text-error-600">{errors.address.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Emergency Contact - Collapsible */}
                <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hasEmergencyContact"
                        {...register('hasEmergencyContact')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label htmlFor="hasEmergencyContact" className="ml-2 block text-sm font-medium text-gray-700">
                        Emergency Contact Information
                      </label>
                    </div>
                    {showEmergencyContact ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {showEmergencyContact && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Name {watchHasEmergencyContact && <span className="text-error-500">*</span>}
                          </label>
                          <input
                            type="text"
                            id="emergencyContactName"
                            {...register('emergencyContactName', { 
                              required: watchHasEmergencyContact ? 'Contact name is required' : false
                            })}
                            className={`form-input py-2 block w-full rounded-md ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                            placeholder="Enter emergency contact name"
                          />
                          {errors.emergencyContactName && (
                            <p className="mt-1 text-sm text-error-600">{errors.emergencyContactName.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700 mb-1">
                            Relationship {watchHasEmergencyContact && <span className="text-error-500">*</span>}
                          </label>
                          <input
                            type="text"
                            id="emergencyContactRelationship"
                            {...register('emergencyContactRelationship', { 
                              required: watchHasEmergencyContact ? 'Relationship is required' : false
                            })}
                            className={`form-input py-2 block w-full rounded-md ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                            placeholder="E.g., Spouse, Parent, Child"
                          />
                          {errors.emergencyContactRelationship && (
                            <p className="mt-1 text-sm text-error-600">{errors.emergencyContactRelationship.message}</p>
                          )}
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Phone {watchHasEmergencyContact && <span className="text-error-500">*</span>}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              id="emergencyContactPhone"
                              {...register('emergencyContactPhone', { 
                                required: watchHasEmergencyContact ? 'Contact phone is required' : false
                              })}
                              className={`form-input pl-10 py-2 block w-full rounded-md ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                              placeholder="Enter emergency contact phone"
                            />
                          </div>
                          {errors.emergencyContactPhone && (
                            <p className="mt-1 text-sm text-error-600">{errors.emergencyContactPhone.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 3: Medical Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Medical Information</h2>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
                        Allergies
                      </label>
                      <textarea
                        id="allergies"
                        {...register('allergies')}
                        rows={3}
                        className="form-textarea py-2 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="List any allergies, separated by commas"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Medications
                      </label>
                      <textarea
                        id="currentMedications"
                        {...register('currentMedications')}
                        rows={3}
                        className="form-textarea py-2 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="List current medications, separated by commas"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chronic Conditions
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="cancer"
                            value="Cancer"
                            {...register('chronicConditions')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="cancer" className="ml-2 block text-sm text-gray-700">
                            Cancer
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="other"
                            value="Other"
                            {...register('chronicConditions')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="other" className="ml-2 block text-sm text-gray-700">
                            Other
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-1">
                        Blood Type <span className="text-error-500">*</span>
                      </label>
                      <select
                        id="bloodType"
                        {...register('bloodType', { required: 'Blood type is required' })}
                        className={`form-select py-2 block w-full rounded-md ${errors.bloodType ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
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
                        <option value="Unknown">Unknown</option>
                      </select>
                      {errors.bloodType && (
                        <p className="mt-1 text-sm text-error-600">{errors.bloodType.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Payment Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          watchPaymentMethod === 'cash' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setValue('paymentMethod', 'cash')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="cashPayment"
                            value="cash"
                            checked={watchPaymentMethod === 'cash'}
                            {...register('paymentMethod')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            onChange={() => {}}
                          />
                          <label htmlFor="cashPayment" className="ml-2 flex items-center cursor-pointer">
                            <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">Cash</span>
                          </label>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          watchPaymentMethod === 'insurance' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setValue('paymentMethod', 'insurance')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="insurancePayment"
                            value="insurance"
                            checked={watchPaymentMethod === 'insurance'}
                            {...register('paymentMethod')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            onChange={() => {}}
                          />
                          <label htmlFor="insurancePayment" className="ml-2 flex items-center cursor-pointer">
                            <CreditCard className="h-5 w-5 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">Insurance</span>
                          </label>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          watchPaymentMethod === 'mpesa' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setValue('paymentMethod', 'mpesa')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="mpesaPayment"
                            value="mpesa"
                            checked={watchPaymentMethod === 'mpesa'}
                            {...register('paymentMethod')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            onChange={() => {}}
                          />
                          <label htmlFor="mpesaPayment" className="ml-2 flex items-center cursor-pointer">
                            <Smartphone className="h-5 w-5 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">M-Pesa</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insurance Information */}
                  {watchPaymentMethod === 'insurance' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-md font-medium text-gray-900 mb-4">Insurance Information</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-1">
                            Insurance Provider <span className="text-error-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="insuranceProvider"
                            {...register('insuranceProvider', { 
                              required: watchPaymentMethod === 'insurance' ? 'Insurance provider is required' : false
                            })}
                            className={`form-input py-2 block w-full rounded-md ${errors.insuranceProvider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                            placeholder="Enter insurance provider"
                          />
                          {errors.insuranceProvider && (
                            <p className="mt-1 text-sm text-error-600">{errors.insuranceProvider.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Policy Number <span className="text-error-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="insurancePolicyNumber"
                            {...register('insurancePolicyNumber', { 
                              required: watchPaymentMethod === 'insurance' ? 'Policy number is required' : false
                            })}
                            className={`form-input py-2 block w-full rounded-md ${errors.insurancePolicyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                            placeholder="Enter policy number"
                          />
                          {errors.insurancePolicyNumber && (
                            <p className="mt-1 text-sm text-error-600">{errors.insurancePolicyNumber.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="insuranceGroupNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Group Number
                          </label>
                          <input
                            type="text"
                            id="insuranceGroupNumber"
                            {...register('insuranceGroupNumber')}
                            className="form-input py-2 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter group number (if applicable)"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* M-Pesa Information */}
                  {watchPaymentMethod === 'mpesa' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-md font-medium text-gray-900 mb-4">M-Pesa Information</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="mpesaPhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            M-Pesa Phone Number <span className="text-error-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Smartphone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              id="mpesaPhoneNumber"
                              {...register('mpesaPhoneNumber', { 
                                required: watchPaymentMethod === 'mpesa' ? 'M-Pesa phone number is required' : false
                              })}
                              className={`form-input pl-10 py-2 block w-full rounded-md ${errors.mpesaPhoneNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                              placeholder="Enter M-Pesa phone number"
                            />
                          </div>
                          {errors.mpesaPhoneNumber && (
                            <p className="mt-1 text-sm text-error-600">{errors.mpesaPhoneNumber.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="mpesaTransactionId" className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction ID <span className="text-error-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="mpesaTransactionId"
                            {...register('mpesaTransactionId', { 
                              required: watchPaymentMethod === 'mpesa' ? 'Transaction ID is required' : false
                            })}
                            className={`form-input py-2 block w-full rounded-md ${errors.mpesaTransactionId ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                            placeholder="Enter M-Pesa transaction ID"
                          />
                          {errors.mpesaTransactionId && (
                            <p className="mt-1 text-sm text-error-600">{errors.mpesaTransactionId.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Information</h2>
                  
                  {isEmergency && (
                    <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-center">
                      <AlertTriangle className="h-6 w-6 text-error-500 mr-3" />
                      <div>
                        <h3 className="font-medium text-error-800">Emergency Case</h3>
                        <p className="text-sm text-error-600">This patient will be fast-tracked through the registration process</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900">Personal Information</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Patient ID</p>
                        <p className="mt-1 text-sm text-gray-900">{patientId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="mt-1 text-sm text-gray-900">{watch('firstName')} {watch('lastName')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Age</p>
                        <p className="mt-1 text-sm text-gray-900">{watch('age')} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Gender</p>
                        <p className="mt-1 text-sm text-gray-900">{watch('gender')}</p>
                      </div>
                      {watch('dateOfBirth') && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('dateOfBirth')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900">Contact Information</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="mt-1 text-sm text-gray-900">{watch('phone')}</p>
                      </div>
                      {watch('email') && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('email')}</p>
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="mt-1 text-sm text-gray-900">{watch('address')}</p>
                      </div>
                    </div>
                  </div>
                  
                  {watchHasEmergencyContact && (
                    <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                        <h3 className="text-md font-medium text-gray-900">Emergency Contact</h3>
                      </div>
                      <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('emergencyContactName')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Relationship</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('emergencyContactRelationship')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('emergencyContactPhone')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900">Medical Information</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Blood Type</p>
                        <p className="mt-1 text-sm text-gray-900">{watch('bloodType')}</p>
                      </div>
                      {watch('allergies') && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Allergies</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('allergies')}</p>
                        </div>
                      )}
                      {watch('chronicConditions') && watch('chronicConditions').length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Chronic Conditions</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('chronicConditions').join(', ')}</p>
                        </div>
                      )}
                      {watch('currentMedications') && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Current Medications</p>
                          <p className="mt-1 text-sm text-gray-900">{watch('currentMedications')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900">Payment Information</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Payment Method</p>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{watch('paymentMethod')}</p>
                      </div>
                      
                      {watchPaymentMethod === 'insurance' && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Insurance Provider</p>
                            <p className="mt-1 text-sm text-gray-900">{watch('insuranceProvider')}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Policy Number</p>
                            <p className="mt-1 text-sm text-gray-900">{watch('insurancePolicyNumber')}</p>
                          </div>
                          {watch('insuranceGroupNumber') && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Group Number</p>
                              <p className="mt-1 text-sm text-gray-900">{watch('insuranceGroupNumber')}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {watchPaymentMethod === 'mpesa' && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-500">M-Pesa Phone Number</p>
                            <p className="mt-1 text-sm text-gray-900">{watch('mpesaPhoneNumber')}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                            <p className="mt-1 text-sm text-gray-900">{watch('mpesaTransactionId')}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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
                className="btn btn-outline flex items-center"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                disabled={isSubmitting}
                className="btn btn-primary flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  <>
                    Register Patient
                    <CheckCircle className="h-5 w-5 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistrationForm;