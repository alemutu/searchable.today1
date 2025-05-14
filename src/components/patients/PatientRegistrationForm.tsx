import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle,
  CreditCard,
  Building,
  Smartphone,
  DollarSign,
  CheckCircle,
  Hash,
  UserPlus,
  UserCheck,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Ambulance
} from 'lucide-react';

interface PatientFormData {
  registrationType: 'new' | 'returning' | 'emergency';
  idNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  priorityLevel: 'normal' | 'urgent' | 'critical';
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'debit_card' | 'mobile_payment';
  paymentDetails: {
    insuranceProvider?: string;
    policyNumber?: string;
    expiryDate?: string;
    cardType?: string;
    lastFourDigits?: string;
    mobileProvider?: string;
    mobileNumber?: string;
    transactionId?: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { hospital } = useAuthStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [emergencyContactExpanded, setEmergencyContactExpanded] = useState(false);
  const { register, handleSubmit, control, setValue, formState: { errors }, watch } = useForm<PatientFormData>({
    defaultValues: {
      registrationType: 'new',
      priorityLevel: 'normal',
      paymentMethod: 'cash',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      paymentDetails: {}
    }
  });

  const registrationType = watch('registrationType');
  const priorityLevel = watch('priorityLevel');
  const paymentMethod = watch('paymentMethod');
  const dateOfBirth = watch('dateOfBirth');
  const age = watch('age');

  // Generate a patient ID
  useEffect(() => {
    if (hospital) {
      // Generate a simple ID for display purposes
      // In a real app, this would follow the hospital's ID format
      const randomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const prefix = hospital.patient_id_prefix || 'PT';
      setPatientId(`${prefix}${randomId}`);
    }
  }, [hospital]);

  const onSubmit = async (data: PatientFormData) => {
    if (!hospital) return;
    
    setIsSubmitting(true);
    
    try {
      // Format the data for the API
      const patientData = {
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        contact_number: data.contactNumber || null,
        email: data.email || null,
        address: data.address || null,
        emergency_contact: data.emergencyContact,
        hospital_id: hospital.id,
        status: 'active',
        current_flow_step: data.registrationType === 'emergency' ? 'emergency' : 'registration',
        id_number: data.idNumber || null,
        priority_level: data.registrationType === 'emergency' ? 'critical' : data.priorityLevel,
        registration_type: data.registrationType === 'emergency' ? 'new' : data.registrationType,
        payment_method: data.paymentMethod,
        initial_status: 'registered',
        medical_info: {
          paymentDetails: data.paymentDetails,
          isEmergencyRegistration: data.registrationType === 'emergency'
        }
      };
      
      // Insert the patient record
      const { data: newPatient, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Navigate to the patient list or triage form
      if (data.registrationType === 'emergency' || data.priorityLevel === 'critical') {
        navigate(`/patients/${newPatient.id}/triage`);
      } else {
        navigate('/patients');
      }
    } catch (error: any) {
      console.error('Error registering patient:', error.message);
      alert(`Error registering patient: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Skip priority step for emergency patients
    if (registrationType === 'emergency' && currentStep === 3) {
      setCurrentStep(5);
    } else {
      setCurrentStep(currentStep + 1);
    }
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    // Skip priority step for emergency patients when going back
    if (registrationType === 'emergency' && currentStep === 5) {
      setCurrentStep(3);
    } else {
      setCurrentStep(currentStep - 1);
    }
    window.scrollTo(0, 0);
  };

  const toggleEmergencyContact = () => {
    setEmergencyContactExpanded(!emergencyContactExpanded);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Form Header with Background */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-t-lg shadow-sm p-4 mb-4">
        <div className="flex items-center">
          <ClipboardList className="h-6 w-6 text-white mr-2" />
          <h1 className="text-xl font-bold text-white">Patient Registration</h1>
        </div>
        <p className="text-primary-100 text-sm mt-1">Register a new, existing, or emergency patient using this form.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step indicator */}
        <div className="mb-4 bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Patient Type' },
              { step: 2, label: 'Personal Info' },
              { step: 3, label: 'Contact' },
              { step: 4, label: 'Priority', skip: registrationType === 'emergency' },
              { step: 5, label: 'Payment' },
              { step: 6, label: 'Review' }
            ].filter(item => !item.skip).map((item) => (
              <div 
                key={item.step} 
                className={`flex flex-col items-center ${
                  currentStep === item.step 
                    ? 'text-primary-600' 
                    : currentStep > item.step 
                      ? 'text-success-500' 
                      : 'text-gray-400'
                }`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                  currentStep === item.step 
                    ? 'bg-primary-100 text-primary-600 border border-primary-500' 
                    : currentStep > item.step 
                      ? 'bg-success-100 text-success-600' 
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {currentStep > item.step ? <CheckCircle className="h-4 w-4" /> : item.step}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-6 gap-0">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div 
                key={step}
                className={`h-1 ${
                  currentStep > step 
                    ? 'bg-success-500' 
                    : currentStep === step 
                      ? 'bg-primary-500' 
                      : 'bg-gray-200'
                } ${registrationType === 'emergency' && step === 4 ? 'hidden' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Patient Type */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Patient Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  registrationType === 'new' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('registrationType', 'new')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    registrationType === 'new' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {registrationType === 'new' && (
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <UserPlus className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">New Patient</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  First-time visit to our facility. Complete registration required.
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  registrationType === 'returning' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('registrationType', 'returning')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    registrationType === 'returning' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {registrationType === 'returning' && (
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Returning Patient</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  Previous patient returning for care. Verification required.
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  registrationType === 'emergency' 
                    ? 'border-error-500 bg-error-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('registrationType', 'emergency')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    registrationType === 'emergency' ? 'border-error-500' : 'border-gray-300'
                  }`}>
                    {registrationType === 'emergency' && (
                      <div className="w-3 h-3 rounded-full bg-error-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Ambulance className="h-5 w-5 text-error-500 mr-2" />
                    <span className="font-medium text-gray-900">Emergency</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  Urgent care needed. Minimal information required.
                </p>
              </div>
            </div>
            
            {registrationType === 'emergency' && (
              <div className="mt-4 bg-error-50 border border-error-200 rounded-lg p-3 flex items-start">
                <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-error-800">Emergency Patient</p>
                  <p className="text-xs text-error-600 mt-1">
                    Only patient name is required. All other fields are optional. The patient will be flagged as critical priority and sent directly to triage.
                  </p>
                </div>
              </div>
            )}
            
            {registrationType === 'returning' && (
              <div className="mt-4">
                <label className="form-label">Patient ID Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('idNumber')}
                    className="form-input pl-9"
                    placeholder="Enter ID number or search by name"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the patient's ID number or search by name to retrieve their records.
                </p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600 flex items-center">
                <Hash className="h-3 w-3 mr-1" />
                ID: {patientId}
              </div>
            </div>
            
            <div className="space-y-3">
              {registrationType === 'new' && (
                <div>
                  <label className="form-label">ID Number (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('idNumber')}
                      className="form-input pl-9"
                      placeholder="National ID, Passport, etc."
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required">First Name</label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input ${errors.firstName ? 'border-error-300' : ''}`}
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
                    className={`form-input ${errors.lastName ? 'border-error-300' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dateOfBirth', { 
                      required: registrationType !== 'emergency' ? 'Date of birth is required' : false 
                    })}
                    className={`form-input ${errors.dateOfBirth ? 'border-error-300' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="form-error">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    {...register('age', { 
                      required: registrationType !== 'emergency' ? 'Age is required' : false,
                      min: 0, 
                      max: 120 
                    })}
                    className="form-input"
                  />
                  {errors.age && (
                    <p className="form-error">{errors.age.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Gender</label>
                  <select
                    {...register('gender', { 
                      required: registrationType !== 'emergency' ? 'Gender is required' : false 
                    })}
                    className={`form-input ${errors.gender ? 'border-error-300' : ''}`}
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
            
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h2>
            
            <div className="space-y-3">
              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register('contactNumber', { 
                      required: registrationType !== 'emergency' ? 'Phone number is required' : false 
                    })}
                    className={`form-input pl-9 ${errors.contactNumber ? 'border-error-300' : ''}`}
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
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`form-input pl-9 ${errors.email ? 'border-error-300' : ''}`}
                    placeholder="patient@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    {...register('address', { 
                      required: registrationType !== 'emergency' ? 'Address is required' : false 
                    })}
                    className={`form-input pl-9 ${errors.address ? 'border-error-300' : ''}`}
                    rows={2}
                    placeholder="Street address, City, State, ZIP"
                  />
                </div>
                {errors.address && (
                  <p className="form-error">{errors.address.message}</p>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleEmergencyContact}>
                  <h3 className="text-sm font-medium text-gray-700">Emergency Contact</h3>
                  {emergencyContactExpanded ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </div>
                
                {emergencyContactExpanded && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          {...register('emergencyContact.name', { 
                            required: registrationType !== 'emergency' ? 'Emergency contact name is required' : false 
                          })}
                          className={`form-input ${errors.emergencyContact?.name ? 'border-error-300' : ''}`}
                          placeholder="Full name"
                        />
                        {errors.emergencyContact?.name && (
                          <p className="form-error">{errors.emergencyContact.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label">Relationship</label>
                        <input
                          type="text"
                          {...register('emergencyContact.relationship', { 
                            required: registrationType !== 'emergency' ? 'Relationship is required' : false 
                          })}
                          className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300' : ''}`}
                          placeholder="e.g., Spouse, Parent, Child"
                        />
                        {errors.emergencyContact?.relationship && (
                          <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone', { 
                            required: registrationType !== 'emergency' ? 'Emergency contact phone is required' : false 
                          })}
                          className={`form-input pl-9 ${errors.emergencyContact?.phone ? 'border-error-300' : ''}`}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      {errors.emergencyContact?.phone && (
                        <p className="form-error">{errors.emergencyContact.phone.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Priority Level */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Priority Level</h2>
            
            <div className="space-y-3">
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  priorityLevel === 'normal' 
                    ? 'border-success-500 bg-success-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('priorityLevel', 'normal')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    priorityLevel === 'normal' ? 'border-success-500' : 'border-gray-300'
                  }`}>
                    {priorityLevel === 'normal' && (
                      <div className="w-3 h-3 rounded-full bg-success-500"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Normal</span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-success-100 text-success-800">
                    Standard
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  Routine care. Non-urgent condition. Standard processing time.
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  priorityLevel === 'urgent' 
                    ? 'border-warning-500 bg-warning-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('priorityLevel', 'urgent')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    priorityLevel === 'urgent' ? 'border-warning-500' : 'border-gray-300'
                  }`}>
                    {priorityLevel === 'urgent' && (
                      <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Urgent</span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-warning-100 text-warning-800">
                    Expedited
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  Requires prompt attention. Condition needs timely care. Expedited processing.
                </p>
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  priorityLevel === 'critical' 
                    ? 'border-error-500 bg-error-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('priorityLevel', 'critical')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    priorityLevel === 'critical' ? 'border-error-500' : 'border-gray-300'
                  }`}>
                    {priorityLevel === 'critical' && (
                      <div className="w-3 h-3 rounded-full bg-error-500"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Critical</span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-error-100 text-error-800">
                    Immediate
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  Requires immediate attention. Life-threatening condition. Highest priority.
                </p>
              </div>
              
              {priorityLevel === 'critical' && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3 mt-3 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-error-800">Critical Priority Selected</p>
                    <p className="text-xs text-error-600 mt-1">
                      This patient will be flagged for immediate attention and will bypass normal registration flow.
                      After registration, they will be immediately directed to triage.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Payment Method */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h2>
            
            <div className="space-y-3">
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'cash' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'cash')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    paymentMethod === 'cash' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'cash' && (
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Cash</span>
                  </div>
                </div>
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'insurance' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'insurance')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    paymentMethod === 'insurance' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'insurance' && (
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Insurance</span>
                  </div>
                </div>
                
                {paymentMethod === 'insurance' && (
                  <div className="mt-3 ml-7 space-y-3">
                    <div>
                      <label className="form-label required text-xs">Insurance Provider</label>
                      <input
                        type="text"
                        {...register('paymentDetails.insuranceProvider', { 
                          required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false 
                        })}
                        className="form-input"
                        placeholder="e.g., Blue Cross, Aetna"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label required text-xs">Policy Number</label>
                        <input
                          type="text"
                          {...register('paymentDetails.policyNumber', { 
                            required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                          })}
                          className="form-input"
                          placeholder="Policy #"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Expiry Date</label>
                        <input
                          type="date"
                          {...register('paymentDetails.expiryDate')}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'credit_card')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    paymentMethod === 'credit_card' || paymentMethod === 'debit_card' 
                      ? 'border-primary-500' 
                      : 'border-gray-300'
                  }`}>
                    {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Credit/Debit Card</span>
                  </div>
                </div>
                
                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <div className="mt-3 ml-7 space-y-3">
                    <div>
                      <label className="form-label required text-xs">Card Type</label>
                      <select
                        {...register('paymentDetails.cardType', { 
                          required: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' 
                            ? 'Card type is required' 
                            : false 
                        })}
                        className="form-input"
                      >
                        <option value="">Select card type</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">American Express</option>
                        <option value="discover">Discover</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label required text-xs">Last 4 Digits</label>
                      <input
                        type="text"
                        {...register('paymentDetails.lastFourDigits', { 
                          required: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' 
                            ? 'Last 4 digits are required' 
                            : false,
                          pattern: {
                            value: /^\d{4}$/,
                            message: 'Must be exactly 4 digits'
                          }
                        })}
                        className="form-input"
                        placeholder="Last 4 digits only"
                        maxLength={4}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'mobile_payment' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'mobile_payment')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                    paymentMethod === 'mobile_payment' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'mobile_payment' && (
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Mobile Payment</span>
                  </div>
                </div>
                
                {paymentMethod === 'mobile_payment' && (
                  <div className="mt-3 ml-7 space-y-3">
                    <div>
                      <label className="form-label required text-xs">Provider</label>
                      <select
                        {...register('paymentDetails.mobileProvider', { 
                          required: paymentMethod === 'mobile_payment' ? 'Provider is required' : false 
                        })}
                        className="form-input"
                      >
                        <option value="">Select provider</option>
                        <option value="apple_pay">Apple Pay</option>
                        <option value="google_pay">Google Pay</option>
                        <option value="samsung_pay">Samsung Pay</option>
                        <option value="venmo">Venmo</option>
                        <option value="paypal">PayPal</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Mobile Number</label>
                      <input
                        type="tel"
                        {...register('paymentDetails.mobileNumber')}
                        className="form-input"
                        placeholder="Associated phone number"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Review Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600 flex items-center">
                  <Hash className="h-3 w-3 mr-1" />
                  ID: {patientId}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  registrationType === 'emergency' || priorityLevel === 'critical'
                    ? 'bg-error-100 text-error-800'
                    : priorityLevel === 'urgent'
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-success-100 text-success-800'
                }`}>
                  {registrationType === 'emergency' ? 'Emergency' : priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)} Priority
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Patient Type</h3>
                <p className="text-sm text-gray-900">
                  {registrationType === 'new' ? 'New Patient' : 
                   registrationType === 'returning' ? 'Returning Patient' : 
                   'Emergency Patient'}
                  {watch('idNumber') && ` • ID: ${watch('idNumber')}`}
                </p>
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="text-gray-900">{watch('firstName')} {watch('lastName')}</span>
                  </div>
                  {watch('gender') && (
                    <div>
                      <span className="text-gray-500">Gender:</span>{' '}
                      <span className="text-gray-900">{watch('gender')}</span>
                    </div>
                  )}
                  {watch('dateOfBirth') && (
                    <div>
                      <span className="text-gray-500">Date of Birth:</span>{' '}
                      <span className="text-gray-900">{watch('dateOfBirth')}</span>
                    </div>
                  )}
                  {watch('age') && (
                    <div>
                      <span className="text-gray-500">Age:</span>{' '}
                      <span className="text-gray-900">{watch('age')} years</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                <div className="space-y-1 text-sm">
                  {watch('contactNumber') && (
                    <div>
                      <span className="text-gray-500">Phone:</span>{' '}
                      <span className="text-gray-900">{watch('contactNumber')}</span>
                    </div>
                  )}
                  {watch('email') && (
                    <div>
                      <span className="text-gray-500">Email:</span>{' '}
                      <span className="text-gray-900">{watch('email')}</span>
                    </div>
                  )}
                  {watch('address') && (
                    <div>
                      <span className="text-gray-500">Address:</span>{' '}
                      <span className="text-gray-900">{watch('address')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {watch('emergencyContact.name') && (
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>{' '}
                      <span className="text-gray-900">{watch('emergencyContact.name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Relationship:</span>{' '}
                      <span className="text-gray-900">{watch('emergencyContact.relationship')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>{' '}
                      <span className="text-gray-900">{watch('emergencyContact.phone')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                <div className="text-sm">
                  <div>
                    <span className="text-gray-500">Method:</span>{' '}
                    <span className="text-gray-900">
                      {paymentMethod === 'cash' && 'Cash'}
                      {paymentMethod === 'insurance' && 'Insurance'}
                      {paymentMethod === 'credit_card' && 'Credit Card'}
                      {paymentMethod === 'debit_card' && 'Debit Card'}
                      {paymentMethod === 'mobile_payment' && 'Mobile Payment'}
                    </span>
                  </div>
                  
                  {paymentMethod === 'insurance' && watch('paymentDetails.insuranceProvider') && (
                    <div className="mt-1 ml-4 text-xs space-y-1">
                      <div>
                        <span className="text-gray-500">Provider:</span>{' '}
                        <span className="text-gray-900">{watch('paymentDetails.insuranceProvider')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Policy Number:</span>{' '}
                        <span className="text-gray-900">{watch('paymentDetails.policyNumber')}</span>
                      </div>
                      {watch('paymentDetails.expiryDate') && (
                        <div>
                          <span className="text-gray-500">Expiry Date:</span>{' '}
                          <span className="text-gray-900">{watch('paymentDetails.expiryDate')}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && watch('paymentDetails.cardType') && (
                    <div className="mt-1 ml-4 text-xs space-y-1">
                      <div>
                        <span className="text-gray-500">Card Type:</span>{' '}
                        <span className="text-gray-900">{watch('paymentDetails.cardType')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last 4 Digits:</span>{' '}
                        <span className="text-gray-900">XXXX-XXXX-XXXX-{watch('paymentDetails.lastFourDigits')}</span>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'mobile_payment' && watch('paymentDetails.mobileProvider') && (
                    <div className="mt-1 ml-4 text-xs space-y-1">
                      <div>
                        <span className="text-gray-500">Provider:</span>{' '}
                        <span className="text-gray-900">{watch('paymentDetails.mobileProvider')}</span>
                      </div>
                      {watch('paymentDetails.mobileNumber') && (
                        <div>
                          <span className="text-gray-500">Mobile Number:</span>{' '}
                          <span className="text-gray-900">{watch('paymentDetails.mobileNumber')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn ${
                  registrationType === 'emergency' || priorityLevel === 'critical' 
                    ? 'bg-error-500 hover:bg-error-600 text-white' 
                    : 'btn-primary'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {registrationType === 'emergency' || priorityLevel === 'critical' 
                      ? 'Register & Proceed to Triage' 
                      : 'Complete Registration'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientRegistrationForm;