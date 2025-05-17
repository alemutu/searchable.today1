import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Save, 
  ArrowLeft, 
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  UserPlus,
  Users,
  Heart
} from 'lucide-react';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
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
}

const PatientRegistrationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    error: patientError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, formState: { errors, isValid, isDirty } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
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
      }
    },
    mode: 'onChange'
  });
  
  // Watch form values for review
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
  
  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Check personal information fields
      if (!formValues.firstName || !formValues.lastName || !formValues.dateOfBirth || 
          !formValues.gender || !formValues.contactNumber || !formValues.address) {
        setFormError("Please fill in all required fields before proceeding");
        return;
      }
    } else if (currentStep === 2) {
      // Check emergency contact fields
      if (!formValues.emergencyContact.name || !formValues.emergencyContact.relationship || 
          !formValues.emergencyContact.phone) {
        setFormError("Please fill in all emergency contact fields before proceeding");
        return;
      }
    }
    
    setFormError(null);
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show review before submission
      setShowReview(true);
    }
  };
  
  const prevStep = () => {
    if (showReview) {
      setShowReview(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsLoading(true);
      setFormError(null);
      
      // Create patient record
      const patientRecord = {
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email || null,
        address: data.address,
        emergency_contact: {
          name: data.emergencyContact.name,
          relationship: data.emergencyContact.relationship,
          phone: data.emergencyContact.phone
        },
        medical_history: {
          allergies: data.medicalInfo.allergies,
          chronicConditions: data.medicalInfo.chronicConditions,
          currentMedications: data.medicalInfo.currentMedications.map(med => ({ name: med })),
          bloodType: data.medicalInfo.bloodType,
          smoker: data.medicalInfo.smoker,
          alcoholConsumption: data.medicalInfo.alcoholConsumption
        },
        status: 'active',
        current_flow_step: 'registration'
      };
      
      // Generate a unique ID for the patient record
      const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Save the patient record
      await savePatient(patientRecord, patientId);
      
      // Show success notification
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Navigate to patient list
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting patient form:', error.message);
      
      // Set form error
      setFormError(`Error: ${error.message}`);
      
      // Show error notification
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years`;
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-md p-3 mb-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-white">
                Patient Registration
              </h2>
              <p className="text-primary-100 text-xs">
                {showReview ? 'Review Information' : 
                 currentStep === 1 ? 'Personal Information' : 
                 currentStep === 2 ? 'Emergency Contact' : 
                 'Medical Information'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Error Message */}
        {formError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-3 py-2 rounded-md mb-3 flex items-start">
            <AlertTriangle className="h-4 w-4 text-error-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Error</p>
              <p className="text-sm">{formError}</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {!showReview && (
          <div className="bg-white rounded-lg shadow-md mb-3">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : 1}
                  </div>
                  <div className={`h-1 w-10 ${
                    currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
                  }`}></div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : 2}
                  </div>
                  <div className={`h-1 w-10 ${
                    currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
                  }`}></div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Step {currentStep} of 3
                </div>
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
                <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Emergency Contact</div>
                <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Medical Info</div>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-3">
          {/* Review Step */}
          {showReview && (
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <CheckCircle className="h-4 w-4 text-primary-500 mr-1.5" />
                Review Patient Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Name:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.firstName} {formValues.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Date of Birth:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.dateOfBirth} ({calculateAge(formValues.dateOfBirth)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Gender:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Contact:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.contactNumber}</span>
                    </div>
                    {formValues.email && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Email:</span>
                        <span className="text-xs font-medium text-gray-900">{formValues.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Address:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Name:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Relationship:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.emergencyContact.relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Phone:</span>
                      <span className="text-xs font-medium text-gray-900">{formValues.emergencyContact.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700">Allergies</h5>
                      {formValues.medicalInfo.allergies && formValues.medicalInfo.allergies.length > 0 ? (
                        <ul className="text-xs text-gray-900 mt-1 list-disc list-inside">
                          {formValues.medicalInfo.allergies.map((allergy, index) => (
                            <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">None reported</p>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-gray-700">Chronic Conditions</h5>
                      {formValues.medicalInfo.chronicConditions && formValues.medicalInfo.chronicConditions.length > 0 ? (
                        <ul className="text-xs text-gray-900 mt-1 list-disc list-inside">
                          {formValues.medicalInfo.chronicConditions.map((condition, index) => (
                            <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">None reported</p>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-gray-700">Current Medications</h5>
                      {formValues.medicalInfo.currentMedications && formValues.medicalInfo.currentMedications.length > 0 ? (
                        <ul className="text-xs text-gray-900 mt-1 list-disc list-inside">
                          {formValues.medicalInfo.currentMedications.map((medication, index) => (
                            <li key={index}>{medication}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">None reported</p>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-gray-700">Other Information</h5>
                      <div className="text-xs text-gray-900 mt-1 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Blood Type:</span>
                          <span>{formValues.medicalInfo.bloodType || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Smoker:</span>
                          <span>{formValues.medicalInfo.smoker ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Alcohol Consumption:</span>
                          <span>{formValues.medicalInfo.alcoholConsumption.charAt(0).toUpperCase() + formValues.medicalInfo.alcoholConsumption.slice(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">Please confirm</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Review the information above carefully. Once submitted, this patient will be registered in the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 1: Personal Information */}
          {currentStep === 1 && !showReview && (
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <User className="h-4 w-4 text-primary-500 mr-1.5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs required">First Name</label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input py-1.5 text-sm ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="form-error text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input py-1.5 text-sm ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="form-error text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth', { required: 'Date of birth is required' })}
                      className={`form-input pl-8 py-1.5 text-sm ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="form-error text-xs mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Gender</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input py-1.5 text-sm ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="form-error text-xs mt-1">{errors.gender.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Contact Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Contact number is required' })}
                      className={`form-input pl-8 py-1.5 text-sm ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter contact number"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="form-error text-xs mt-1">{errors.contactNumber.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="form-input pl-8 py-1.5 text-sm"
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label text-xs required">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-8 py-1.5 text-sm ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={2}
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && (
                    <p className="form-error text-xs mt-1">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Emergency Contact */}
          {currentStep === 2 && !showReview && (
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Users className="h-4 w-4 text-primary-500 mr-1.5" />
                Emergency Contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="form-label text-xs required">Full Name</label>
                  <input
                    type="text"
                    {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                    className={`form-input py-1.5 text-sm ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter emergency contact's full name"
                  />
                  {errors.emergencyContact?.name && (
                    <p className="form-error text-xs mt-1">{errors.emergencyContact.name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Relationship</label>
                  <input
                    type="text"
                    {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                    className={`form-input py-1.5 text-sm ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="e.g., Spouse, Parent, Child"
                  />
                  {errors.emergencyContact?.relationship && (
                    <p className="form-error text-xs mt-1">{errors.emergencyContact.relationship.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                      className={`form-input pl-8 py-1.5 text-sm ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter emergency contact's phone"
                    />
                  </div>
                  {errors.emergencyContact?.phone && (
                    <p className="form-error text-xs mt-1">{errors.emergencyContact.phone.message}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-xs text-blue-600">
                      Emergency contacts are crucial for patient safety. Please ensure the contact information is accurate and up-to-date.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Medical Information */}
          {currentStep === 3 && !showReview && (
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Heart className="h-4 w-4 text-primary-500 mr-1.5" />
                Medical Information
              </h3>
              
              <div>
                <label className="form-label text-xs">Allergies</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="penicillin"
                      value="Penicillin"
                      {...register('medicalInfo.allergies')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="penicillin" className="text-xs text-gray-700">
                      Penicillin
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="nsaids"
                      value="NSAIDs"
                      {...register('medicalInfo.allergies')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="nsaids" className="text-xs text-gray-700">
                      NSAIDs
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="sulfa"
                      value="Sulfa Drugs"
                      {...register('medicalInfo.allergies')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sulfa" className="text-xs text-gray-700">
                      Sulfa Drugs
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="latex"
                      value="Latex"
                      {...register('medicalInfo.allergies')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="latex" className="text-xs text-gray-700">
                      Latex
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="nuts"
                      value="Nuts"
                      {...register('medicalInfo.allergies')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="nuts" className="text-xs text-gray-700">
                      Nuts
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="shellfish"
                      value="Shellfish"
                      {...register('medicalInfo.allergies')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="shellfish" className="text-xs text-gray-700">
                      Shellfish
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Chronic Conditions</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="diabetes"
                      value="Diabetes"
                      {...register('medicalInfo.chronicConditions')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="diabetes" className="text-xs text-gray-700">
                      Diabetes
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="hypertension"
                      value="Hypertension"
                      {...register('medicalInfo.chronicConditions')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hypertension" className="text-xs text-gray-700">
                      Hypertension
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="asthma"
                      value="Asthma"
                      {...register('medicalInfo.chronicConditions')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="asthma" className="text-xs text-gray-700">
                      Asthma
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="heart_disease"
                      value="Heart Disease"
                      {...register('medicalInfo.chronicConditions')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="heart_disease" className="text-xs text-gray-700">
                      Heart Disease
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="arthritis"
                      value="Arthritis"
                      {...register('medicalInfo.chronicConditions')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="arthritis" className="text-xs text-gray-700">
                      Arthritis
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="cancer"
                      value="Cancer"
                      {...register('medicalInfo.chronicConditions')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cancer" className="text-xs text-gray-700">
                      Cancer
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Current Medications</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="insulin"
                      value="Insulin"
                      {...register('medicalInfo.currentMedications')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="insulin" className="text-xs text-gray-700">
                      Insulin
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="antihypertensives"
                      value="Antihypertensives"
                      {...register('medicalInfo.currentMedications')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="antihypertensives" className="text-xs text-gray-700">
                      Antihypertensives
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="statins"
                      value="Statins"
                      {...register('medicalInfo.currentMedications')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="statins" className="text-xs text-gray-700">
                      Statins
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="anticoagulants"
                      value="Anticoagulants"
                      {...register('medicalInfo.currentMedications')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="anticoagulants" className="text-xs text-gray-700">
                      Anticoagulants
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="antidepressants"
                      value="Antidepressants"
                      {...register('medicalInfo.currentMedications')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="antidepressants" className="text-xs text-gray-700">
                      Antidepressants
                    </label>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-50 p-1.5 rounded-md">
                    <input
                      type="checkbox"
                      id="painkillers"
                      value="Painkillers"
                      {...register('medicalInfo.currentMedications')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="painkillers" className="text-xs text-gray-700">
                      Painkillers
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Blood Type</label>
                  <select
                    {...register('medicalInfo.bloodType')}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="">Unknown</option>
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
                  <label className="form-label text-xs">Alcohol Consumption</label>
                  <select
                    {...register('medicalInfo.alcoholConsumption')}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="none">None</option>
                    <option value="occasional">Occasional</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smoker"
                      {...register('medicalInfo.smoker')}
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="smoker" className="ml-1.5 text-xs text-gray-700">
                      Patient is a smoker
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="btn btn-outline flex items-center py-1.5 px-3 text-sm"
          >
            {showReview ? (
              <>
                <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to Form
              </>
            ) : (
              <>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </>
            )}
          </button>

          {showReview ? (
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center py-1.5 px-3 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white mr-1.5"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Register Patient
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center py-1.5 px-3 text-sm"
            >
              {currentStep === 3 ? 'Review' : 'Next'}
              <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;