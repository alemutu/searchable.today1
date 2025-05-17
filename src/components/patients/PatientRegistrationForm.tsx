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
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string;
  bloodType: string;
  
  // Payment Information
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'mpesa';
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  creditCardNumber?: string;
  creditCardExpiry?: string;
  creditCardCVV?: string;
  mpesaPhoneNumber?: string;
  mpesaTransactionId?: string;
  
  // Additional Information
  isEmergency: boolean;
  notes: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllergies, setShowAllergies] = useState(false);
  const [showChronicConditions, setShowChronicConditions] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [generatedPatientId, setGeneratedPatientId] = useState('');
  
  const { 
    saveItem: savePatient,
    error: saveError
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
      hasEmergencyContact: false,
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      allergies: [],
      chronicConditions: [],
      currentMedications: '',
      bloodType: '',
      paymentMethod: 'cash',
      isEmergency: false,
      notes: ''
    }
  });
  
  const paymentMethod = watch('paymentMethod');
  const hasEmergencyContact = watch('hasEmergencyContact');
  const isEmergency = watch('isEmergency');
  
  // Generate a unique patient ID when the component mounts
  useEffect(() => {
    generatePatientId();
  }, []);
  
  const generatePatientId = () => {
    // Generate a unique ID with format PT + 6 random digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const patientId = `PT${randomDigits}`;
    setGeneratedPatientId(patientId);
    setValue('patientId', patientId);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create patient object
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
        } : {
          name: '',
          relationship: '',
          phone: ''
        },
        medical_info: {
          allergies: data.allergies.filter(a => a),
          chronicConditions: data.chronicConditions.filter(c => c),
          currentMedications: data.currentMedications ? data.currentMedications.split(',').map(med => ({ name: med.trim() })) : [],
          bloodType: data.bloodType
        },
        payment_info: {
          method: data.paymentMethod,
          details: data.paymentMethod === 'insurance' ? {
            provider: data.insuranceProvider,
            policyNumber: data.insurancePolicyNumber
          } : data.paymentMethod === 'credit_card' ? {
            cardNumber: data.creditCardNumber?.replace(/\d(?=\d{4})/g, '*'),
            expiry: data.creditCardExpiry
          } : data.paymentMethod === 'mpesa' ? {
            phoneNumber: data.mpesaPhoneNumber,
            transactionId: data.mpesaTransactionId
          } : {}
        },
        status: 'active',
        current_flow_step: data.isEmergency ? 'emergency' : 'registration',
        priority_level: data.isEmergency ? 'critical' : 'normal',
        patient_id: data.patientId || generatedPatientId,
        created_at: new Date().toISOString()
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
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === step
                  ? 'bg-primary-500 text-white'
                  : currentStep > step
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <span className="mt-1 text-xs text-gray-500">
                {step === 1 && 'Patient Type'}
                {step === 2 && 'Personal Info'}
                {step === 3 && 'Contact'}
                {step === 4 && 'Priority'}
                {step === 5 && 'Review'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-right text-xs text-gray-500">
          Step {currentStep} of 5
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-3xl mx-auto">
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
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-b-lg shadow-sm p-6">
        {renderStepIndicator()}
        
        {/* Step 1: Patient Type */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
            <p className="text-sm text-gray-600 mb-6">Select the appropriate patient type</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 bg-primary-50 border-primary-200">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-primary-500 mr-2" />
                  <h3 className="font-medium text-gray-900">New Patient</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Register a new patient</p>
                <div className="flex justify-end">
                  <CheckCircle className="h-5 w-5 text-primary-500" />
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/patients/search')}>
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="font-medium text-gray-900">Existing Patient</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Find patient records</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 ${isEmergency ? 'bg-error-50 border-error-200' : 'hover:bg-gray-50'} cursor-pointer`}
                onClick={() => setValue('isEmergency', !isEmergency)}
              >
                <div className="flex items-center mb-2">
                  <AlertTriangle className={`h-5 w-5 ${isEmergency ? 'text-error-500' : 'text-gray-400'} mr-2`} />
                  <h3 className="font-medium text-gray-900">Emergency</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Fast-track emergency case</p>
                {isEmergency && (
                  <div className="flex justify-end">
                    <CheckCircle className="h-5 w-5 text-error-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
            <p className="text-sm text-gray-600 mb-6">Enter the patient's personal details</p>
            
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
                    className={`form-input pl-10 ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
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
                  />
                </div>
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
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
                    max: { value: 150, message: 'Age cannot exceed 150' }
                  })}
                  className={`form-input ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.age && <p className="form-error">{errors.age.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    value={generatedPatientId}
                    readOnly
                    className="form-input pl-10 bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto-generated unique identifier</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <p className="text-sm text-gray-600 mb-6">Enter the patient's contact details</p>
            
            <div className="mb-4">
              <label className="form-label required">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('contactNumber', { required: 'Phone number is required' })}
                  className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
            </div>
            
            <div className="mb-4">
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
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            
            <div className="mb-6">
              <label className="form-label required">Address</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={3}
                  placeholder="Enter complete address"
                />
              </div>
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
            
            {/* Collapsible Emergency Contact Section */}
            <div className="border rounded-lg p-4 mb-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setShowEmergencyContact(!showEmergencyContact);
                  setValue('hasEmergencyContact', !showEmergencyContact);
                }}
              >
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="font-medium text-gray-900">Emergency Contact</h3>
                </div>
                {showEmergencyContact ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              {showEmergencyContact && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="form-label required">Name</label>
                    <input
                      type="text"
                      {...register('emergencyContactName', { 
                        required: hasEmergencyContact ? 'Emergency contact name is required' : false
                      })}
                      className={`form-input ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                    {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Relationship</label>
                    <input
                      type="text"
                      {...register('emergencyContactRelationship', { 
                        required: hasEmergencyContact ? 'Relationship is required' : false
                      })}
                      className={`form-input ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                    {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('emergencyContactPhone', { 
                          required: hasEmergencyContact ? 'Emergency contact phone is required' : false
                        })}
                        className={`form-input pl-10 ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 4: Medical & Payment Information */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Medical & Payment Information</h2>
            <p className="text-sm text-gray-600 mb-6">Enter medical history and payment details</p>
            
            {/* Medical Information */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-3">Medical Information</h3>
              
              <div className="mb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => setShowAllergies(!showAllergies)}
                >
                  <label className="form-label mb-0">Allergies</label>
                  {showAllergies ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                {showAllergies && (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allergy-penicillin"
                        value="Penicillin"
                        {...register('allergies')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allergy-penicillin" className="ml-2 block text-sm text-gray-900">
                        Penicillin
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allergy-nsaids"
                        value="NSAIDs"
                        {...register('allergies')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allergy-nsaids" className="ml-2 block text-sm text-gray-900">
                        NSAIDs (Aspirin, Ibuprofen)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allergy-latex"
                        value="Latex"
                        {...register('allergies')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allergy-latex" className="ml-2 block text-sm text-gray-900">
                        Latex
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allergy-nuts"
                        value="Nuts"
                        {...register('allergies')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allergy-nuts" className="ml-2 block text-sm text-gray-900">
                        Nuts
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => setShowChronicConditions(!showChronicConditions)}
                >
                  <label className="form-label mb-0">Chronic Conditions</label>
                  {showChronicConditions ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                {showChronicConditions && (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="condition-diabetes"
                        value="Diabetes"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="condition-diabetes" className="ml-2 block text-sm text-gray-900">
                        Diabetes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="condition-hypertension"
                        value="Hypertension"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="condition-hypertension" className="ml-2 block text-sm text-gray-900">
                        Hypertension
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="condition-asthma"
                        value="Asthma"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="condition-asthma" className="ml-2 block text-sm text-gray-900">
                        Asthma
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="condition-heart-disease"
                        value="Heart Disease"
                        {...register('chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="condition-heart-disease" className="ml-2 block text-sm text-gray-900">
                        Heart Disease
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="form-label">Current Medications</label>
                <textarea
                  {...register('currentMedications')}
                  className="form-input"
                  rows={2}
                  placeholder="Enter current medications, separated by commas"
                />
              </div>
              
              <div className="mb-4">
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
            </div>
            
            {/* Payment Information */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Payment Information</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${paymentMethod === 'cash' ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'}`}
                  onClick={() => setValue('paymentMethod', 'cash')}
                >
                  <div className="flex flex-col items-center">
                    <DollarSign className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="mt-1 text-sm font-medium">Cash</span>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${paymentMethod === 'insurance' ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'}`}
                  onClick={() => setValue('paymentMethod', 'insurance')}
                >
                  <div className="flex flex-col items-center">
                    <Building2 className={`h-6 w-6 ${paymentMethod === 'insurance' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="mt-1 text-sm font-medium">Insurance</span>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${paymentMethod === 'credit_card' ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'}`}
                  onClick={() => setValue('paymentMethod', 'credit_card')}
                >
                  <div className="flex flex-col items-center">
                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'credit_card' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="mt-1 text-sm font-medium">Credit Card</span>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${paymentMethod === 'mpesa' ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'}`}
                  onClick={() => setValue('paymentMethod', 'mpesa')}
                >
                  <div className="flex flex-col items-center">
                    <Smartphone className={`h-6 w-6 ${paymentMethod === 'mpesa' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="mt-1 text-sm font-medium">M-Pesa</span>
                  </div>
                </div>
              </div>
              
              {/* Insurance Information */}
              {paymentMethod === 'insurance' && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">Insurance Information</h4>
                  
                  <div className="mb-3">
                    <label className="form-label required">Insurance Provider</label>
                    <input
                      type="text"
                      {...register('insuranceProvider', { 
                        required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false
                      })}
                      className={`form-input ${errors.insuranceProvider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                    {errors.insuranceProvider && <p className="form-error">{errors.insuranceProvider.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Policy Number</label>
                    <input
                      type="text"
                      {...register('insurancePolicyNumber', { 
                        required: paymentMethod === 'insurance' ? 'Policy number is required' : false
                      })}
                      className={`form-input ${errors.insurancePolicyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                    {errors.insurancePolicyNumber && <p className="form-error">{errors.insurancePolicyNumber.message}</p>}
                  </div>
                </div>
              )}
              
              {/* Credit Card Information */}
              {paymentMethod === 'credit_card' && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">Credit Card Information</h4>
                  
                  <div className="mb-3">
                    <label className="form-label required">Card Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('creditCardNumber', { 
                          required: paymentMethod === 'credit_card' ? 'Card number is required' : false,
                          pattern: {
                            value: /^[0-9]{16}$/,
                            message: 'Please enter a valid 16-digit card number'
                          }
                        })}
                        className={`form-input pl-10 ${errors.creditCardNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    {errors.creditCardNumber && <p className="form-error">{errors.creditCardNumber.message}</p>}
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
                            message: 'Please enter a valid expiry date (MM/YY)'
                          }
                        })}
                        className={`form-input ${errors.creditCardExpiry ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="MM/YY"
                      />
                      {errors.creditCardExpiry && <p className="form-error">{errors.creditCardExpiry.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">CVV</label>
                      <input
                        type="text"
                        {...register('creditCardCVV', { 
                          required: paymentMethod === 'credit_card' ? 'CVV is required' : false,
                          pattern: {
                            value: /^[0-9]{3,4}$/,
                            message: 'Please enter a valid CVV'
                          }
                        })}
                        className={`form-input ${errors.creditCardCVV ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="123"
                      />
                      {errors.creditCardCVV && <p className="form-error">{errors.creditCardCVV.message}</p>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* M-Pesa Information */}
              {paymentMethod === 'mpesa' && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">M-Pesa Information</h4>
                  
                  <div className="mb-3">
                    <label className="form-label required">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Smartphone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('mpesaPhoneNumber', { 
                          required: paymentMethod === 'mpesa' ? 'Phone number is required' : false,
                          pattern: {
                            value: /^[0-9+]{10,15}$/,
                            message: 'Please enter a valid phone number'
                          }
                        })}
                        className={`form-input pl-10 ${errors.mpesaPhoneNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="e.g., 254712345678"
                      />
                    </div>
                    {errors.mpesaPhoneNumber && <p className="form-error">{errors.mpesaPhoneNumber.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label required">Transaction ID</label>
                    <input
                      type="text"
                      {...register('mpesaTransactionId', { 
                        required: paymentMethod === 'mpesa' ? 'Transaction ID is required' : false
                      })}
                      className={`form-input ${errors.mpesaTransactionId ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="e.g., QJI5XTKLA9"
                    />
                    {errors.mpesaTransactionId && <p className="form-error">{errors.mpesaTransactionId.message}</p>}
                  </div>
                </div>
              )}
              
              <div>
                <label className="form-label">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-input"
                  rows={3}
                  placeholder="Enter any additional information about the patient"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Review Information</h2>
            <p className="text-sm text-gray-600 mb-6">Please review the patient information before submitting</p>
            
            {isEmergency && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-error-800 font-medium">Emergency Case</h3>
                  <p className="text-error-600 text-sm">This patient will be fast-tracked through the system.</p>
                </div>
              </div>
            )}
            
            <div className="border rounded-lg divide-y">
              {/* Personal Information */}
              <div className="p-4">
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-sm font-medium">{watch('firstName')} {watch('lastName')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="text-sm font-medium">{watch('gender')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="text-sm font-medium">{watch('age')} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium">{watch('dateOfBirth') || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="text-sm font-medium">{generatedPatientId}</p>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="p-4">
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{watch('contactNumber')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium">{watch('email') || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm font-medium">{watch('address')}</p>
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              {hasEmergencyContact && (
                <div className="p-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-gray-400 mr-2" />
                    Emergency Contact
                  </h3>
                  
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
              
              {/* Medical Information */}
              <div className="p-4">
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <Activity className="h-5 w-5 text-gray-400 mr-2" />
                  Medical Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Allergies</p>
                    <p className="text-sm font-medium">
                      {watch('allergies')?.filter(Boolean).length > 0 
                        ? watch('allergies').filter(Boolean).join(', ') 
                        : 'None reported'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chronic Conditions</p>
                    <p className="text-sm font-medium">
                      {watch('chronicConditions')?.filter(Boolean).length > 0 
                        ? watch('chronicConditions').filter(Boolean).join(', ') 
                        : 'None reported'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Medications</p>
                    <p className="text-sm font-medium">{watch('currentMedications') || 'None reported'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="text-sm font-medium">{watch('bloodType') || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="p-4">
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  Payment Information
                </h3>
                
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
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Insurance Provider</p>
                      <p className="text-sm font-medium">{watch('insuranceProvider')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Policy Number</p>
                      <p className="text-sm font-medium">{watch('insurancePolicyNumber')}</p>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'credit_card' && (
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Card Number</p>
                      <p className="text-sm font-medium">
                        {watch('creditCardNumber')?.replace(/\d(?=\d{4})/g, '*')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="text-sm font-medium">{watch('creditCardExpiry')}</p>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'mpesa' && (
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">M-Pesa Phone Number</p>
                      <p className="text-sm font-medium">{watch('mpesaPhoneNumber')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="text-sm font-medium">{watch('mpesaTransactionId')}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Additional Notes */}
              {watch('notes') && (
                <div className="p-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    Additional Notes
                  </h3>
                  
                  <p className="text-sm">{watch('notes')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
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
              onClick={() => navigate('/reception')}
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
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
              disabled={isSubmitting}
              className="btn btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
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