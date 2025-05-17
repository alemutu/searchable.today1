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
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Building2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Save,
  Hash,
  Smartphone
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  hasEmergencyContact: boolean;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'mpesa';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  creditCardInfo?: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  };
  mpesaInfo?: {
    phoneNumber: string;
    transactionId: string;
  };
  isEmergency: boolean;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [isEmergencyCase, setIsEmergencyCase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  
  const { saveItem } = useHybridStorage('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset, trigger } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: '',
      gender: 'Male',
      contactNumber: '',
      email: '',
      address: '',
      hasEmergencyContact: true,
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      paymentMethod: 'cash',
      isEmergency: false
    }
  });
  
  const paymentMethod = watch('paymentMethod');
  const isEmergency = watch('isEmergency');
  const hasEmergencyContact = watch('hasEmergencyContact');
  
  // Generate a unique patient ID when the component mounts
  useEffect(() => {
    generatePatientId();
  }, []);
  
  // Update emergency case state when isEmergency changes
  useEffect(() => {
    setIsEmergencyCase(isEmergency);
  }, [isEmergency]);
  
  const generatePatientId = () => {
    // Generate a unique ID based on timestamp and random number
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newPatientId = `PT${timestamp}${random}`;
    setPatientId(newPatientId);
  };
  
  const nextStep = async () => {
    const fieldsToValidate = getFieldsToValidateForStep(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  const getFieldsToValidateForStep = (step: number) => {
    switch (step) {
      case 1: // Personal Information
        return ['firstName', 'lastName', 'age', 'gender', 'contactNumber', 'address'];
      case 2: // Contact & Emergency
        const fields = ['email'];
        if (hasEmergencyContact) {
          fields.push('emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phone');
        }
        return fields;
      case 3: // Payment Information
        if (paymentMethod === 'insurance') {
          return ['paymentMethod', 'insuranceInfo.provider', 'insuranceInfo.policyNumber'];
        } else if (paymentMethod === 'credit_card') {
          return ['paymentMethod', 'creditCardInfo.cardNumber', 'creditCardInfo.cardholderName', 'creditCardInfo.expiryDate', 'creditCardInfo.cvv'];
        } else if (paymentMethod === 'mpesa') {
          return ['paymentMethod', 'mpesaInfo.phoneNumber', 'mpesaInfo.transactionId'];
        }
        return ['paymentMethod'];
      default:
        return [];
    }
  };
  
  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create patient object
      const patient = {
        id: uuidv4(),
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date().toISOString().split('T')[0], // Use current date if not provided
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email,
        address: data.address,
        emergency_contact: data.hasEmergencyContact ? {
          name: data.emergencyContact.name,
          relationship: data.emergencyContact.relationship,
          phone: data.emergencyContact.phone
        } : {
          name: '',
          relationship: '',
          phone: ''
        },
        medical_history: null,
        status: 'active',
        current_flow_step: data.isEmergency ? 'emergency' : 'triage', // Set to triage to forward to waiting area
        patient_id: patientId,
        payment_info: {
          method: data.paymentMethod,
          ...(data.paymentMethod === 'insurance' && {
            insurance: data.insuranceInfo
          }),
          ...(data.paymentMethod === 'credit_card' && {
            credit_card: {
              ...data.creditCardInfo,
              // Mask card number for security
              cardNumber: data.creditCardInfo?.cardNumber.replace(/\d(?=\d{4})/g, '*')
            }
          }),
          ...(data.paymentMethod === 'mpesa' && {
            mpesa: data.mpesaInfo
          })
        },
        is_emergency: data.isEmergency,
        registration_date: new Date().toISOString()
      };
      
      // Save patient data
      await saveItem(patient, patient.id);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Reset form
      reset();
      
      // Redirect to triage page for the new patient
      if (data.isEmergency) {
        navigate(`/patients/${patient.id}/triage`);
      } else {
        navigate('/triage'); // Go to triage waiting area
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
              4
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Step {currentStep} of 4
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500 px-1">
          <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Personal</div>
          <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Contact</div>
          <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Payment</div>
          <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Review</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-primary-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-1 rounded-full hover:bg-primary-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Patient Registration</h1>
            <p className="text-sm text-primary-100">Register new or manage existing patients</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-b-lg shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepIndicator()}
          
          {isEmergencyCase && (
            <div className="mb-6 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-error-700">Emergency Case</p>
                <p className="text-sm text-error-600">This patient is being registered as an emergency case and will be prioritized.</p>
              </div>
            </div>
          )}
          
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-500">Enter the patient's basic information</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-10 ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      max={new Date().toISOString().split('T')[0]}
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
                      max: { value: 150, message: 'Age cannot be greater than 150' }
                    })}
                    className={`form-input ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter age"
                  />
                  {errors.age && <p className="form-error">{errors.age.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label required">Gender</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="form-error">{errors.gender.message}</p>}
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
                  <p className="text-xs text-gray-500 mt-1">Auto-generated unique identifier</p>
                </div>
              </div>
              
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
                    placeholder="Enter contact number"
                  />
                </div>
                {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
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
                    rows={2}
                    placeholder="Enter address"
                  />
                </div>
                {errors.address && <p className="form-error">{errors.address.message}</p>}
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="isEmergency"
                  {...register('isEmergency')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isEmergency" className="ml-2 block text-sm text-gray-900 font-medium">
                  This is an emergency case
                </label>
              </div>
            </div>
          )}
          
          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-500">Enter the patient's contact details</p>
              
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
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasEmergencyContact"
                      {...register('hasEmergencyContact')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasEmergencyContact" className="ml-2 block text-base font-medium text-gray-900">
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
                  <div className="space-y-4">
                    <div>
                      <label className="form-label required">Name</label>
                      <input
                        type="text"
                        {...register('emergencyContact.name', { 
                          required: hasEmergencyContact ? 'Emergency contact name is required' : false 
                        })}
                        className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter emergency contact name"
                      />
                      {errors.emergencyContact?.name && <p className="form-error">{errors.emergencyContact.name.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship', { 
                          required: hasEmergencyContact ? 'Relationship is required' : false 
                        })}
                        className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter relationship to patient"
                      />
                      {errors.emergencyContact?.relationship && <p className="form-error">{errors.emergencyContact.relationship.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone', { 
                            required: hasEmergencyContact ? 'Emergency contact phone is required' : false 
                          })}
                          className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                          placeholder="Enter emergency contact number"
                        />
                      </div>
                      {errors.emergencyContact?.phone && <p className="form-error">{errors.emergencyContact.phone.message}</p>}
                    </div>
                  </div>
                )}
                
                {!showEmergencyContact && hasEmergencyContact && (
                  <p className="text-sm text-gray-500 italic">Emergency contact information will be collected</p>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3: Payment Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
              <p className="text-sm text-gray-500">Select payment method</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-colors ${
                    paymentMethod === 'cash' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'cash')}
                >
                  <DollarSign className={`h-6 w-6 mb-1 ${paymentMethod === 'cash' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-primary-700' : 'text-gray-700'}`}>Cash</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-colors ${
                    paymentMethod === 'insurance' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'insurance')}
                >
                  <Building2 className={`h-6 w-6 mb-1 ${paymentMethod === 'insurance' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === 'insurance' ? 'text-primary-700' : 'text-gray-700'}`}>Insurance</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-colors ${
                    paymentMethod === 'credit_card' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'credit_card')}
                >
                  <CreditCard className={`h-6 w-6 mb-1 ${paymentMethod === 'credit_card' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === 'credit_card' ? 'text-primary-700' : 'text-gray-700'}`}>Credit Card</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-colors ${
                    paymentMethod === 'mpesa' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMethod', 'mpesa')}
                >
                  <Smartphone className={`h-6 w-6 mb-1 ${paymentMethod === 'mpesa' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === 'mpesa' ? 'text-primary-700' : 'text-gray-700'}`}>M-Pesa</span>
                </div>
              </div>
              
              {paymentMethod === 'insurance' && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Insurance Information</h3>
                  
                  <div>
                    <label className="form-label required">Insurance Provider</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.provider', { required: 'Insurance provider is required' })}
                      className={`form-input ${errors.insuranceInfo?.provider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter insurance provider"
                    />
                    {errors.insuranceInfo?.provider && <p className="form-error">{errors.insuranceInfo.provider.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Policy Number</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.policyNumber', { required: 'Policy number is required' })}
                      className={`form-input ${errors.insuranceInfo?.policyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter policy number"
                    />
                    {errors.insuranceInfo?.policyNumber && <p className="form-error">{errors.insuranceInfo.policyNumber.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      {...register('insuranceInfo.expiryDate')}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}
              
              {paymentMethod === 'credit_card' && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Credit Card Information</h3>
                  
                  <div>
                    <label className="form-label required">Card Number</label>
                    <input
                      type="text"
                      {...register('creditCardInfo.cardNumber', { 
                        required: 'Card number is required',
                        pattern: {
                          value: /^[0-9]{13,19}$/,
                          message: 'Invalid card number'
                        }
                      })}
                      className={`form-input ${errors.creditCardInfo?.cardNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter card number"
                    />
                    {errors.creditCardInfo?.cardNumber && <p className="form-error">{errors.creditCardInfo.cardNumber.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Cardholder Name</label>
                    <input
                      type="text"
                      {...register('creditCardInfo.cardholderName', { required: 'Cardholder name is required' })}
                      className={`form-input ${errors.creditCardInfo?.cardholderName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter cardholder name"
                    />
                    {errors.creditCardInfo?.cardholderName && <p className="form-error">{errors.creditCardInfo.cardholderName.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Expiry Date</label>
                      <input
                        type="text"
                        {...register('creditCardInfo.expiryDate', { 
                          required: 'Expiry date is required',
                          pattern: {
                            value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                            message: 'Format: MM/YY'
                          }
                        })}
                        className={`form-input ${errors.creditCardInfo?.expiryDate ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="MM/YY"
                      />
                      {errors.creditCardInfo?.expiryDate && <p className="form-error">{errors.creditCardInfo.expiryDate.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">CVV</label>
                      <input
                        type="text"
                        {...register('creditCardInfo.cvv', { 
                          required: 'CVV is required',
                          pattern: {
                            value: /^[0-9]{3,4}$/,
                            message: 'Invalid CVV'
                          }
                        })}
                        className={`form-input ${errors.creditCardInfo?.cvv ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter CVV"
                      />
                      {errors.creditCardInfo?.cvv && <p className="form-error">{errors.creditCardInfo.cvv.message}</p>}
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'mpesa' && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium text-gray-900">M-Pesa Information</h3>
                  
                  <div>
                    <label className="form-label required">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Smartphone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('mpesaInfo.phoneNumber', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9+\s-]{10,15}$/,
                            message: 'Invalid phone number'
                          }
                        })}
                        className={`form-input pl-10 ${errors.mpesaInfo?.phoneNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter M-Pesa phone number"
                      />
                    </div>
                    {errors.mpesaInfo?.phoneNumber && <p className="form-error">{errors.mpesaInfo.phoneNumber.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Transaction ID</label>
                    <input
                      type="text"
                      {...register('mpesaInfo.transactionId', { required: 'Transaction ID is required' })}
                      className={`form-input ${errors.mpesaInfo?.transactionId ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter M-Pesa transaction ID"
                    />
                    {errors.mpesaInfo?.transactionId && <p className="form-error">{errors.mpesaInfo.transactionId.message}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 4: Review Information */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Review Information</h2>
              <p className="text-sm text-gray-500">Please review the patient information before submitting</p>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-medium text-gray-900">Personal Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient ID</p>
                      <p className="text-sm text-gray-900">{patientId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-sm text-gray-900">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Age</p>
                      <p className="text-sm text-gray-900">{watch('age')} years</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="text-sm text-gray-900">{watch('gender')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{watch('address')}</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-medium text-gray-900">Contact Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact Number</p>
                      <p className="text-sm text-gray-900">{watch('contactNumber')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{watch('email') || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {hasEmergencyContact && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                      <p className="text-sm text-gray-900">
                        {watch('emergencyContact.name')} ({watch('emergencyContact.relationship')}) - {watch('emergencyContact.phone')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-medium text-gray-900">Payment Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payment Method</p>
                    <p className="text-sm text-gray-900">
                      {paymentMethod === 'cash' && 'Cash'}
                      {paymentMethod === 'insurance' && 'Insurance'}
                      {paymentMethod === 'credit_card' && 'Credit Card'}
                      {paymentMethod === 'mpesa' && 'M-Pesa'}
                    </p>
                  </div>
                  
                  {paymentMethod === 'insurance' && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Insurance Details</p>
                      <p className="text-sm text-gray-900">
                        {watch('insuranceInfo.provider')} - Policy: {watch('insuranceInfo.policyNumber')}
                        {watch('insuranceInfo.expiryDate') && ` (Expires: ${watch('insuranceInfo.expiryDate')})`}
                      </p>
                    </div>
                  )}
                  
                  {paymentMethod === 'credit_card' && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Credit Card Details</p>
                      <p className="text-sm text-gray-900">
                        {watch('creditCardInfo.cardholderName')} - Card ending in {watch('creditCardInfo.cardNumber')?.slice(-4)}
                      </p>
                    </div>
                  )}
                  
                  {paymentMethod === 'mpesa' && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">M-Pesa Details</p>
                      <p className="text-sm text-gray-900">
                        Phone: {watch('mpesaInfo.phoneNumber')} - Transaction ID: {watch('mpesaInfo.transactionId')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {isEmergencyCase && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0" />
                  <p className="text-sm font-medium text-error-700">This patient will be registered as an emergency case</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center"
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
    </div>
  );
};

export default PatientRegistrationForm;