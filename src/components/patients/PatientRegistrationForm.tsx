import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../lib/store';
import { v4 as uuidv4 } from 'uuid';
import { saveData } from '../../lib/storage';
import { ClipboardList, User, Phone, Mail, MapPin, Users, FileText, AlertTriangle, ChevronRight, AlertCircle, Search, Hash } from 'lucide-react';

interface PatientRegistrationFormData {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  medicalHistory: {
    allergies: boolean;
    allergyDetails: string;
    chronicConditions: string[];
    otherConditions: string;
    currentMedications: string;
    pastSurgeries: string;
    familyHistory: string;
  };
  priority: {
    conditionSeverity: 'mild' | 'moderate' | 'severe';
    visitPurpose: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    preferredDoctor: string;
  };
  paymentMethod: 'cash' | 'insurance' | 'credit' | 'mpesa' | 'pay_later';
  mpesaDetails?: {
    transactionCode: string;
    phoneNumber: string;
    amount: string;
    paymentDate: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors }, trigger, setValue } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      medicalHistory: {
        allergies: false,
        allergyDetails: '',
        chronicConditions: [],
        otherConditions: '',
        currentMedications: '',
        pastSurgeries: '',
        familyHistory: ''
      },
      priority: {
        conditionSeverity: 'mild',
        visitPurpose: '',
        urgencyLevel: 'low',
        preferredDoctor: ''
      }
    }
  });
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [patientType, setPatientType] = useState<'new' | 'returning' | 'emergency'>('new');
  const [patientId, setPatientId] = useState<string>(uuidv4());
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const hasAllergies = watch('medicalHistory.allergies');
  const chronicConditions = watch('medicalHistory.chronicConditions') || [];
  const paymentMethod = watch('paymentMethod');

  const steps = [
    { number: 1, title: 'Patient Type' },
    { number: 2, title: 'Personal Info' },
    { number: 3, title: 'Contact' },
    { number: 4, title: 'Priority' },
    { number: 5, title: 'Payment' },
    { number: 6, title: 'Review' }
  ];

  // Generate a formatted patient ID
  const generatePatientId = () => {
    // For demo purposes, we'll use a simple algorithm to generate a number
    const patientNumber = parseInt(patientId.substring(0, 8), 16) % 10000;
    const paddedNumber = String(patientNumber).padStart(6, '0');
    return `PT${paddedNumber}`;
  };

  const searchPatients = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    setIsSearching(true);
    
    try {
      // In a real app, this would search the database
      // For now, we'll just simulate a search
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      if (searchTerm.toLowerCase().includes('john')) {
        setSearchResults([
          {
            id: '123456',
            first_name: 'John',
            last_name: 'Doe',
            age: 45,
            gender: 'Male',
            contact_number: '555-1234'
          }
        ]);
      } else if (searchTerm.toLowerCase().includes('jane')) {
        setSearchResults([
          {
            id: '789012',
            first_name: 'Jane',
            last_name: 'Smith',
            age: 32,
            gender: 'Female',
            contact_number: '555-5678'
          }
        ]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectReturningPatient = (patient: any) => {
    // Populate form with patient data
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('age', patient.age);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    
    // Clear search results
    setSearchResults([]);
    
    // Move to next step
    setCurrentStep(2);
  };

  const nextStep = async () => {
    // For emergency cases, skip to the final step after collecting minimal info
    if (patientType === 'emergency' && currentStep === 2) {
      // Set payment method to "pay later" for emergency cases
      setValue('paymentMethod', 'pay_later');
      setCurrentStep(6);
      return;
    }
    
    // Validate current step before proceeding
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        // No validation needed for patient type
        setCurrentStep(2);
        return;
      case 2:
        // For emergency cases, only require names
        if (patientType === 'emergency') {
          fieldsToValidate = ['firstName', 'lastName'];
        } else {
          fieldsToValidate = ['firstName', 'lastName', 'age', 'gender'];
        }
        break;
      case 3:
        fieldsToValidate = ['contactNumber', 'address'];
        if (showEmergencyContact) {
          fieldsToValidate.push('emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone');
        }
        break;
      case 4:
        fieldsToValidate = ['priority.conditionSeverity', 'priority.visitPurpose', 'priority.urgencyLevel'];
        break;
      case 5:
        if (paymentMethod === 'mpesa') {
          fieldsToValidate = ['mpesaDetails.transactionCode', 'mpesaDetails.phoneNumber', 'mpesaDetails.amount', 'mpesaDetails.paymentDate'];
        }
        break;
      // No validation needed for review step
    }
    
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    // For emergency cases, go back to step 1 from review
    if (patientType === 'emergency' && currentStep === 6) {
      setCurrentStep(1);
      return;
    }
    
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsSubmitting(true);
    
    try {
      // Calculate approximate date of birth from age
      const today = new Date();
      const birthYear = today.getFullYear() - data.age;
      const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split('T')[0]; // January 1st of birth year
      
      // Create patient object with safe access to medical history
      const patient = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: dateOfBirth,
        age: data.age,
        gender: data.gender || 'Unknown', // Default for emergency
        contact_number: data.contactNumber || 'Unknown', // Default for emergency
        email: data.email || null,
        address: data.address || 'Unknown', // Default for emergency
        emergency_contact: showEmergencyContact ? {
          name: data.emergencyContactName || 'Unknown',
          relationship: data.emergencyContactRelationship || 'Unknown',
          phone: data.emergencyContactPhone || 'Unknown'
        } : null,
        medical_info: {
          allergies: data.medicalHistory?.allergies ? 
            (data.medicalHistory.allergyDetails || '').split(',').map(a => ({
              allergen: a.trim(),
              reaction: 'Unknown',
              severity: 'unknown'
            })) : [],
          chronicConditions: data.medicalHistory?.chronicConditions || [],
          currentMedications: data.medicalHistory?.currentMedications ? 
            data.medicalHistory.currentMedications.split(',').map(m => ({
              name: m.trim(),
              dosage: 'Unknown',
              frequency: 'Unknown'
            })) : [],
          pastSurgeries: data.medicalHistory?.pastSurgeries || '',
          familyHistory: data.medicalHistory?.familyHistory || ''
        },
        priority: patientType === 'emergency' ? {
          conditionSeverity: 'severe',
          urgencyLevel: 'high',
          visitPurpose: 'Emergency'
        } : data.priority,
        status: 'active',
        current_flow_step: patientType === 'emergency' ? 'emergency' : 'registration',
        created_at: new Date().toISOString(),
        payment_info: {
          method: data.paymentMethod,
          ...(data.paymentMethod === 'mpesa' && data.mpesaDetails ? {
            mpesa: data.mpesaDetails
          } : {})
        },
        patient_type: patientType
      };
      
      // Save to local storage
      await saveData('patients', patient, patientId);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully${patientType === 'emergency' ? ' as EMERGENCY case' : ''}`,
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-primary-500 text-white p-6 rounded-t-lg">
        <div className="flex items-center">
          <ClipboardList className="h-6 w-6 mr-2" />
          <div>
            <h1 className="text-xl font-bold text-white">Patient Registration</h1>
            <p className="text-sm text-white">Register a new, existing, or emergency patient using this form.</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between">
            {steps.map((step) => (
              <div 
                key={step.number} 
                className={`flex flex-col items-center ${currentStep === step.number ? 'opacity-100' : 'opacity-60'}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
                    ${currentStep === step.number 
                      ? 'bg-primary-500 text-white' 
                      : currentStep > step.number 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'bg-gray-100 text-gray-500'}`}
                >
                  {step.number}
                </div>
                <span className="text-xs text-gray-500">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 h-1 bg-gray-200 rounded-full">
            <div 
              className="h-1 bg-primary-500 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 p-6 rounded-b-lg">
        {/* Step 1: Patient Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Patient Type</h2>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${patientType === 'new' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPatientType('new')}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${patientType === 'new' ? 'border-primary-500' : 'border-gray-300'}`}>
                    {patientType === 'new' && <div className="w-3 h-3 rounded-full bg-primary-500"></div>}
                  </div>
                  <span className="ml-2 font-medium">New Patient</span>
                </div>
                <p className="text-sm text-gray-600">First-time visit to our facility. Complete registration required.</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${patientType === 'returning' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPatientType('returning')}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${patientType === 'returning' ? 'border-primary-500' : 'border-gray-300'}`}>
                    {patientType === 'returning' && <div className="w-3 h-3 rounded-full bg-primary-500"></div>}
                  </div>
                  <span className="ml-2 font-medium">Returning Patient</span>
                </div>
                <p className="text-sm text-gray-600">Previous patient returning for care. Verification required.</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${patientType === 'emergency' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPatientType('emergency')}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${patientType === 'emergency' ? 'border-primary-500' : 'border-gray-300'}`}>
                    {patientType === 'emergency' && <div className="w-3 h-3 rounded-full bg-primary-500"></div>}
                  </div>
                  <span className="ml-2 font-medium">Emergency</span>
                </div>
                <p className="text-sm text-gray-600">Urgent care needed. Minimal information required.</p>
              </div>
            </div>
            
            {patientType === 'emergency' && (
              <div className="bg-error-50 p-4 rounded-lg border border-error-200 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-error-800">Emergency Registration</h3>
                    <div className="mt-2 text-sm text-error-700">
                      <p>
                        For emergency cases, only the patient's name is required. All other information can be collected later.
                        Payment will be automatically set to "Pay Later".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {patientType === 'returning' && (
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <User className="h-5 w-5 text-primary-400" />
                  </div>
                  <div className="ml-3 w-full">
                    <h3 className="text-sm font-medium text-primary-800">Returning Patient</h3>
                    <div className="mt-2 text-sm text-primary-700">
                      <p>
                        Please search for the patient using their name, phone number, or ID before proceeding.
                      </p>
                      <div className="mt-2 flex">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            className="form-input text-sm rounded-l-md w-full"
                            placeholder="Search by name, ID, or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500"></div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary rounded-l-none py-1 px-3"
                          onClick={searchPatients}
                        >
                          Search
                        </button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="mt-3 border border-primary-200 rounded-md overflow-hidden">
                          <div className="bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800">
                            Found {searchResults.length} matching patients
                          </div>
                          <div className="divide-y divide-primary-100">
                            {searchResults.map((patient) => (
                              <div 
                                key={patient.id} 
                                className="p-3 hover:bg-primary-50 cursor-pointer"
                                onClick={() => selectReturningPatient(patient)}
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                                    <p className="text-xs text-gray-500">{patient.age} years • {patient.gender}</p>
                                  </div>
                                  <div className="text-xs text-primary-600">
                                    Select
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {searchTerm && searchResults.length === 0 && !isSearching && (
                        <div className="mt-2 text-sm text-gray-500">
                          No matching patients found. Continue with registration as a new patient.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            
            {patientType === 'emergency' && (
              <div className="bg-error-50 p-4 rounded-lg border border-error-200 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-error-800">Emergency Case</h3>
                    <div className="mt-2 text-sm text-error-700">
                      <p>
                        Only the patient's name is required. Other details can be completed later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <div className="flex items-center mb-2">
                <Hash className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-md font-medium text-gray-900">Patient ID</h3>
              </div>
              <div className="text-lg font-mono text-primary-600">{generatePatientId()}</div>
              <p className="text-xs text-gray-500 mt-1">Auto-generated unique identifier</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="form-label required">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input pl-10 ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter first name"
                  />
                </div>
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              
              <div>
                <label htmlFor="lastName" className="form-label required">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input pl-10 ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter last name"
                  />
                </div>
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
              
              {patientType !== 'emergency' && (
                <>
                  <div>
                    <label htmlFor="age" className="form-label required">Age</label>
                    <input
                      id="age"
                      type="number"
                      min="0"
                      max="120"
                      {...register('age', { 
                        required: 'Age is required',
                        min: { value: 0, message: 'Age must be at least 0' },
                        max: { value: 120, message: 'Age must be less than 120' },
                        valueAsNumber: true
                      })}
                      className={`form-input ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter age in years"
                    />
                    {errors.age && <p className="form-error">{errors.age.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="form-label required">Gender</label>
                    <select
                      id="gender"
                      {...register('gender', { required: 'Gender is required' })}
                      className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="form-error">{errors.gender.message}</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contactNumber" className="form-label required">Contact Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="contactNumber"
                    type="tel"
                    {...register('contactNumber', { required: 'Contact number is required' })}
                    className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="form-input pl-10"
                    placeholder="Enter email address (optional)"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="address" className="form-label required">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="address"
                    rows={3}
                    {...register('address', { required: 'Address is required' })}
                    className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter complete address"
                  />
                </div>
                {errors.address && <p className="form-error">{errors.address.message}</p>}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <button 
                type="button" 
                className="flex items-center text-primary-600 hover:text-primary-800 mb-4"
                onClick={() => setShowEmergencyContact(!showEmergencyContact)}
              >
                <span className="mr-2">{showEmergencyContact ? '−' : '+'}</span>
                Emergency Contact (Optional)
              </button>
              
              {showEmergencyContact && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="emergencyContactName" className="form-label">Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="emergencyContactName"
                        type="text"
                        {...register('emergencyContactName', { 
                          required: showEmergencyContact ? 'Emergency contact name is required' : false 
                        })}
                        className={`form-input pl-10 ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                    {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="emergencyContactRelationship" className="form-label">Relationship</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="emergencyContactRelationship"
                        type="text"
                        {...register('emergencyContactRelationship', { 
                          required: showEmergencyContact ? 'Relationship is required' : false 
                        })}
                        className={`form-input pl-10 ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="E.g., Spouse, Parent, Child"
                      />
                    </div>
                    {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="emergencyContactPhone" className="form-label">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="emergencyContactPhone"
                        type="tel"
                        {...register('emergencyContactPhone', { 
                          required: showEmergencyContact ? 'Emergency contact phone is required' : false 
                        })}
                        className={`form-input pl-10 ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter emergency contact phone"
                      />
                    </div>
                    {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 4: Priority */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Priority Information</h2>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="space-y-6">
                <div>
                  <label htmlFor="conditionSeverity" className="form-label required">Condition Severity</label>
                  <select
                    id="conditionSeverity"
                    {...register('priority.conditionSeverity', { required: 'Condition severity is required' })}
                    className={`form-input ${errors.priority?.conditionSeverity ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  {errors.priority?.conditionSeverity && <p className="form-error">{errors.priority.conditionSeverity.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="visitPurpose" className="form-label required">Visit Purpose</label>
                  <select
                    id="visitPurpose"
                    {...register('priority.visitPurpose', { required: 'Visit purpose is required' })}
                    className={`form-input ${errors.priority?.visitPurpose ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="">Select purpose</option>
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="routine_checkup">Routine Checkup</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="procedure">Procedure</option>
                    <option value="lab_test">Laboratory Test</option>
                  </select>
                  {errors.priority?.visitPurpose && <p className="form-error">{errors.priority.visitPurpose.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="urgencyLevel" className="form-label required">Urgency Level</label>
                  <select
                    id="urgencyLevel"
                    {...register('priority.urgencyLevel', { required: 'Urgency level is required' })}
                    className={`form-input ${errors.priority?.urgencyLevel ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  {errors.priority?.urgencyLevel && <p className="form-error">{errors.priority.urgencyLevel.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="preferredDoctor" className="form-label">Preferred Doctor (Optional)</label>
                  <select
                    id="preferredDoctor"
                    {...register('priority.preferredDoctor')}
                    className="form-input"
                  >
                    <option value="">No preference</option>
                    <option value="dr_smith">Dr. Smith</option>
                    <option value="dr_johnson">Dr. Johnson</option>
                    <option value="dr_williams">Dr. Williams</option>
                    <option value="dr_brown">Dr. Brown</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 5: Payment Information */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Information</h2>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="form-label">Payment Method</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="payment-cash"
                        type="radio"
                        value="cash"
                        {...register('paymentMethod')}
                        defaultChecked
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="payment-cash" className="ml-2 block text-sm text-gray-900">
                        Cash
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="payment-insurance"
                        type="radio"
                        value="insurance"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="payment-insurance" className="ml-2 block text-sm text-gray-900">
                        Insurance
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="payment-credit"
                        type="radio"
                        value="credit"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="payment-credit" className="ml-2 block text-sm text-gray-900">
                        Credit Card
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="payment-mpesa"
                        type="radio"
                        value="mpesa"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="payment-mpesa" className="ml-2 block text-sm text-gray-900">
                        M-PESA
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="payment-later"
                        type="radio"
                        value="pay_later"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="payment-later" className="ml-2 block text-sm text-gray-900">
                        Pay Later
                      </label>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'mpesa' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">M-PESA Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="transactionCode" className="form-label required">Transaction Code</label>
                        <input
                          id="transactionCode"
                          type="text"
                          {...register('mpesaDetails.transactionCode', { required: paymentMethod === 'mpesa' })}
                          className="form-input"
                          placeholder="e.g., QWE123456"
                        />
                      </div>
                      <div>
                        <label htmlFor="phoneNumber" className="form-label required">Phone Number</label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          {...register('mpesaDetails.phoneNumber', { required: paymentMethod === 'mpesa' })}
                          className="form-input"
                          placeholder="e.g., +254712345678"
                        />
                      </div>
                      <div>
                        <label htmlFor="amount" className="form-label required">Amount</label>
                        <input
                          id="amount"
                          type="text"
                          {...register('mpesaDetails.amount', { required: paymentMethod === 'mpesa' })}
                          className="form-input"
                          placeholder="e.g., 1000"
                        />
                      </div>
                      <div>
                        <label htmlFor="paymentDate" className="form-label required">Payment Date</label>
                        <input
                          id="paymentDate"
                          type="date"
                          {...register('mpesaDetails.paymentDate', { required: paymentMethod === 'mpesa' })}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <input
                      id="consent"
                      name="consent"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
                      I consent to the collection and processing of my personal and medical information for healthcare purposes.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review Information</h2>
            
            {patientType === 'emergency' && (
              <div className="bg-error-50 p-4 rounded-lg border border-error-200 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-error-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-error-800">EMERGENCY CASE</h3>
                    <div className="mt-2 text-sm text-error-700">
                      <p>
                        This patient is being registered as an emergency case with minimal information.
                        Additional details can be collected after treatment has begun.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-sm text-gray-900">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient ID</p>
                      <p className="text-sm font-mono text-primary-600">{generatePatientId()}</p>
                    </div>
                    {patientType !== 'emergency' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Age</p>
                          <p className="text-sm text-gray-900">{watch('age') || 'Not provided'} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Gender</p>
                          <p className="text-sm text-gray-900">{watch('gender') || 'Not provided'}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient Type</p>
                      <p className="text-sm text-gray-900">
                        {patientType === 'new' ? 'New Patient' : 
                         patientType === 'returning' ? 'Returning Patient' : 
                         'Emergency Case'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {patientType !== 'emergency' && (
                  <>
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone Number</p>
                          <p className="text-sm text-gray-900">{watch('contactNumber') || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{watch('email') || 'Not provided'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{watch('address') || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {showEmergencyContact && (
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Emergency Contact</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Name</p>
                            <p className="text-sm text-gray-900">{watch('emergencyContactName') || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Relationship</p>
                            <p className="text-sm text-gray-900">{watch('emergencyContactRelationship') || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <p className="text-sm text-gray-900">{watch('emergencyContactPhone') || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Priority Information</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Condition Severity</p>
                          <p className="text-sm text-gray-900">
                            {watch('priority.conditionSeverity') === 'mild' ? 'Mild' :
                             watch('priority.conditionSeverity') === 'moderate' ? 'Moderate' :
                             watch('priority.conditionSeverity') === 'severe' ? 'Severe' : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Visit Purpose</p>
                          <p className="text-sm text-gray-900">
                            {watch('priority.visitPurpose') ? 
                              watch('priority.visitPurpose').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                              'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Urgency Level</p>
                          <p className="text-sm text-gray-900">
                            {watch('priority.urgencyLevel') === 'low' ? 'Low' :
                             watch('priority.urgencyLevel') === 'medium' ? 'Medium' :
                             watch('priority.urgencyLevel') === 'high' ? 'High' : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Preferred Doctor</p>
                          <p className="text-sm text-gray-900">
                            {watch('priority.preferredDoctor') ? 
                              watch('priority.preferredDoctor').replace('dr_', 'Dr. ').replace(/\b\w/g, l => l.toUpperCase()) : 
                              'No preference'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-sm text-gray-900">
                        {patientType === 'emergency' ? 'Pay Later (Emergency Case)' : 
                         paymentMethod === 'cash' ? 'Cash' :
                         paymentMethod === 'insurance' ? 'Insurance' :
                         paymentMethod === 'credit' ? 'Credit Card' :
                         paymentMethod === 'mpesa' ? 'M-PESA' :
                         paymentMethod === 'pay_later' ? 'Pay Later' : 'Not specified'}
                      </p>
                    </div>
                    
                    {paymentMethod === 'mpesa' && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">M-PESA Details</p>
                        <p className="text-sm text-gray-900">
                          Transaction Code: {watch('mpesaDetails.transactionCode')}<br />
                          Phone: {watch('mpesaDetails.phoneNumber')}<br />
                          Amount: {watch('mpesaDetails.amount')}<br />
                          Date: {watch('mpesaDetails.paymentDate')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Please verify all information</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Ensure all information is accurate before submitting. Once submitted, this information will be used for medical purposes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}
          
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary inline-flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;