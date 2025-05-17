import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  Save,
  CreditCard,
  Wallet,
  Building2,
  ArrowLeft,
  Check
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientRegistrationFormData {
  patientType: 'new' | 'existing' | 'emergency';
  existingPatientId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age?: string;
    gender: string;
    contactNumber: string;
    email: string;
    address: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo: {
    allergies: string;
    chronicConditions: string;
    currentMedications: string;
    pastSurgeries: string;
    familyHistory: string;
  };
  patientPriority: 'normal' | 'urgent' | 'emergency';
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'mobile_payment';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    holderName: string;
    relationship: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    error: patientError,
    fetchItems: searchPatients
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      patientType: 'new',
      personalInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        contactNumber: '',
        email: '',
        address: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalInfo: {
        allergies: '',
        chronicConditions: '',
        currentMedications: '',
        pastSurgeries: '',
        familyHistory: ''
      },
      patientPriority: 'normal',
      paymentMethod: 'cash'
    }
  });
  
  const patientType = watch('patientType');
  const paymentMethod = watch('paymentMethod');
  
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    try {
      const results = await searchPatients({ search: searchTerm });
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error searching patients:', error);
      addNotification({
        message: 'Error searching for patients',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectExistingPatient = (patient: any) => {
    setValue('existingPatientId', patient.id);
    setValue('personalInfo', {
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      contactNumber: patient.contact_number,
      email: patient.email || '',
      address: patient.address
    });
    setValue('emergencyContact', patient.emergency_contact);
    
    // Set medical info if available
    if (patient.medical_history) {
      setValue('medicalInfo', {
        allergies: patient.medical_history.allergies?.join(', ') || '',
        chronicConditions: patient.medical_history.chronicConditions?.join(', ') || '',
        currentMedications: patient.medical_history.currentMedications?.map((med: any) => med.name).join(', ') || '',
        pastSurgeries: patient.medical_history.pastSurgeries?.join(', ') || '',
        familyHistory: patient.medical_history.familyHistory || ''
      });
    }
    
    setSearchResults([]);
    setSearchTerm('');
    
    // Move to the next step
    setCurrentStep(2);
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsSubmitting(true);
    
    try {
      // Format the data for storage
      const patientData = {
        id: data.existingPatientId || uuidv4(),
        first_name: data.personalInfo.firstName,
        last_name: data.personalInfo.lastName,
        date_of_birth: data.personalInfo.dateOfBirth,
        gender: data.personalInfo.gender,
        contact_number: data.personalInfo.contactNumber,
        email: data.personalInfo.email,
        address: data.personalInfo.address,
        emergency_contact: data.emergencyContact,
        medical_history: {
          allergies: data.medicalInfo.allergies ? data.medicalInfo.allergies.split(',').map(item => item.trim()) : [],
          chronicConditions: data.medicalInfo.chronicConditions ? data.medicalInfo.chronicConditions.split(',').map(item => item.trim()) : [],
          currentMedications: data.medicalInfo.currentMedications ? 
            data.medicalInfo.currentMedications.split(',').map(med => ({ name: med.trim() })) : [],
          pastSurgeries: data.medicalInfo.pastSurgeries ? data.medicalInfo.pastSurgeries.split(',').map(item => item.trim()) : [],
          familyHistory: data.medicalInfo.familyHistory
        },
        status: 'active',
        current_flow_step: 'registration', // Set initial flow step to registration
        priority_level: data.patientPriority,
        payment_method: data.paymentMethod,
        insurance_info: data.paymentMethod === 'insurance' ? data.insuranceInfo : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save the patient data
      await savePatient(patientData, patientData.id);
      
      // Show success notification
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Redirect to triage
      navigate(`/patients/${patientData.id}/triage`);
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
  
  // Generate a random patient ID for display
  const generatePatientId = () => {
    return `PT${Math.floor(100000 + Math.random() * 900000)}`;
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-primary-600 p-4 rounded-t-lg">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 text-white hover:bg-primary-700 p-1 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Patient Registration</h1>
            <p className="text-primary-100 text-sm">Register new or manage existing patients</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Progress Steps */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <Check className="h-5 w-5" /> : 1}
              </div>
              <div className={`h-1 w-12 ${currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <Check className="h-5 w-5" /> : 2}
              </div>
              <div className={`h-1 w-12 ${currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 3 ? <Check className="h-5 w-5" /> : 3}
              </div>
              <div className={`h-1 w-12 ${currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 4 ? <Check className="h-5 w-5" /> : 4}
              </div>
              <div className={`h-1 w-12 ${currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                5
              </div>
            </div>
            <div className="text-sm text-gray-500">
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
        
        <div className="bg-gray-50 p-6">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
              <p className="text-sm text-gray-600 mb-6">Select the appropriate patient type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'new' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'new')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      patientType === 'new' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <h3 className="ml-3 text-base font-medium text-gray-900">New Patient</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-11">Register a new patient</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'existing' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'existing')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      patientType === 'existing' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <h3 className="ml-3 text-base font-medium text-gray-900">Existing Patient</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-11">Find patient records</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'emergency' ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'emergency')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      patientType === 'emergency' ? 'bg-error-100 text-error-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3 className="ml-3 text-base font-medium text-gray-900">Emergency</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-11">Fast-track emergency case</p>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Find Existing Patient</h3>
                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input flex-1"
                      placeholder="Search by name, ID, or phone number"
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching || !searchTerm}
                      className="btn btn-primary"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {searchResults.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {patient.first_name} {patient.last_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {new Date(patient.date_of_birth).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {patient.contact_number}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => selectExistingPatient(patient)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {searchTerm && searchResults.length === 0 && !isSearching && (
                    <div className="text-center p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No patients found. Please try a different search or register as a new patient.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              <p className="text-sm text-gray-600 mb-6">Enter the patient's personal details</p>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label required">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('personalInfo.firstName', { required: 'First name is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter first name"
                      />
                    </div>
                    {errors.personalInfo?.firstName && (
                      <p className="form-error">{errors.personalInfo.firstName.message}</p>
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
                        {...register('personalInfo.lastName', { required: 'Last name is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter last name"
                      />
                    </div>
                    {errors.personalInfo?.lastName && (
                      <p className="form-error">{errors.personalInfo.lastName.message}</p>
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
                        {...register('personalInfo.dateOfBirth', { required: 'Date of birth is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                    </div>
                    {errors.personalInfo?.dateOfBirth && (
                      <p className="form-error">{errors.personalInfo.dateOfBirth.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Age</label>
                    <input
                      type="text"
                      {...register('personalInfo.age')}
                      className="form-input bg-gray-50"
                      placeholder="Auto-calculated"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated based on date of birth</p>
                  </div>
                  
                  <div>
                    <label className="form-label required">Gender</label>
                    <select
                      {...register('personalInfo.gender', { required: 'Gender is required' })}
                      className={`form-input ${errors.personalInfo?.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.personalInfo?.gender && (
                      <p className="form-error">{errors.personalInfo.gender.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Patient ID</label>
                    <input
                      type="text"
                      value={generatePatientId()}
                      className="form-input bg-gray-50"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated unique identifier</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-6">Enter the patient's contact details and emergency contact</p>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Patient Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label required">Contact Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('personalInfo.contactNumber', { required: 'Contact number is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter contact number"
                      />
                    </div>
                    {errors.personalInfo?.contactNumber && (
                      <p className="form-error">{errors.personalInfo.contactNumber.message}</p>
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
                        {...register('personalInfo.email')}
                        className="form-input pl-10"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label required">Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        {...register('personalInfo.address', { required: 'Address is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        rows={2}
                        placeholder="Enter address"
                      />
                    </div>
                    {errors.personalInfo?.address && (
                      <p className="form-error">{errors.personalInfo.address.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label required">Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                        className={`form-input pl-10 ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                    {errors.emergencyContact?.name && (
                      <p className="form-error">{errors.emergencyContact.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Relationship</label>
                    <select
                      {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                      className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.emergencyContact?.relationship && (
                      <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('emergencyContact.phone', { required: 'Phone number is required' })}
                        className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.emergencyContact?.phone && (
                      <p className="form-error">{errors.emergencyContact.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority and Payment */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Priority & Payment</h2>
              <p className="text-sm text-gray-600 mb-6">Set patient priority and payment method</p>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Patient Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      watch('patientPriority') === 'normal' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('patientPriority', 'normal')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-medium text-gray-900">Normal</h4>
                      <div className={`w-5 h-5 rounded-full border ${
                        watch('patientPriority') === 'normal' ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {watch('patientPriority') === 'normal' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Standard priority for routine cases</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      watch('patientPriority') === 'urgent' ? 'border-warning-500 bg-warning-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('patientPriority', 'urgent')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-medium text-gray-900">Urgent</h4>
                      <div className={`w-5 h-5 rounded-full border ${
                        watch('patientPriority') === 'urgent' ? 'border-warning-500 bg-warning-500' : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {watch('patientPriority') === 'urgent' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Higher priority for urgent cases</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      watch('patientPriority') === 'emergency' ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('patientPriority', 'emergency')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-medium text-gray-900">Emergency</h4>
                      <div className={`w-5 h-5 rounded-full border ${
                        watch('patientPriority') === 'emergency' ? 'border-error-500 bg-error-500' : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {watch('patientPriority') === 'emergency' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Highest priority for emergency cases</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'cash')}
                  >
                    <div className="flex items-center justify-center mb-3">
                      <Wallet className={`h-8 w-8 ${paymentMethod === 'cash' ? 'text-primary-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Cash</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'insurance')}
                  >
                    <div className="flex items-center justify-center mb-3">
                      <Building2 className={`h-8 w-8 ${paymentMethod === 'insurance' ? 'text-primary-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Insurance</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'credit_card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'credit_card')}
                  >
                    <div className="flex items-center justify-center mb-3">
                      <CreditCard className={`h-8 w-8 ${paymentMethod === 'credit_card' ? 'text-primary-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Credit Card</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'mobile_payment' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'mobile_payment')}
                  >
                    <div className="flex items-center justify-center mb-3">
                      <Phone className={`h-8 w-8 ${paymentMethod === 'mobile_payment' ? 'text-primary-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Mobile Payment</div>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'insurance' && (
                  <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Insurance Information</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label required">Insurance Provider</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.provider', { 
                            required: paymentMethod === 'insurance' ? 'Provider is required' : false 
                          })}
                          className="form-input"
                          placeholder="Enter provider name"
                        />
                        {errors.insuranceInfo?.provider && (
                          <p className="form-error">{errors.insuranceInfo.provider.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label required">Policy Number</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.policyNumber', { 
                            required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                          })}
                          className="form-input"
                          placeholder="Enter policy number"
                        />
                        {errors.insuranceInfo?.policyNumber && (
                          <p className="form-error">{errors.insuranceInfo.policyNumber.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label">Group Number</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.groupNumber')}
                          className="form-input"
                          placeholder="Enter group number"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label required">Policy Holder Name</label>
                        <input
                          type="text"
                          {...register('insuranceInfo.holderName', { 
                            required: paymentMethod === 'insurance' ? 'Policy holder name is required' : false 
                          })}
                          className="form-input"
                          placeholder="Enter policy holder name"
                        />
                        {errors.insuranceInfo?.holderName && (
                          <p className="form-error">{errors.insuranceInfo.holderName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label required">Relationship to Patient</label>
                        <select
                          {...register('insuranceInfo.relationship', { 
                            required: paymentMethod === 'insurance' ? 'Relationship is required' : false 
                          })}
                          className="form-input"
                        >
                          <option value="">Select relationship</option>
                          <option value="self">Self</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.insuranceInfo?.relationship && (
                          <p className="form-error">{errors.insuranceInfo.relationship.message}</p>
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
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review Information</h2>
              <p className="text-sm text-gray-600 mb-6">Review and confirm patient information</p>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 text-primary-500 mr-2" />
                    Personal Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('personalInfo.firstName')} {watch('personalInfo.lastName')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('personalInfo.dateOfBirth')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Gender:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('personalInfo.gender')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Contact:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('personalInfo.contactNumber')}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-sm font-medium text-gray-500">Address:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('personalInfo.address')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Phone className="h-5 w-5 text-primary-500 mr-2" />
                    Emergency Contact
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('emergencyContact.name')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Relationship:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('emergencyContact.relationship')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('emergencyContact.phone')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-primary-500 mr-2" />
                    Priority & Payment
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Priority:</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          watch('patientPriority') === 'normal' ? 'bg-success-100 text-success-800' :
                          watch('patientPriority') === 'urgent' ? 'bg-warning-100 text-warning-800' :
                          'bg-error-100 text-error-800'
                        }`}>
                          {watch('patientPriority').charAt(0).toUpperCase() + watch('patientPriority').slice(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Payment Method:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('paymentMethod').replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                      
                      {paymentMethod === 'insurance' && (
                        <div className="sm:col-span-2 mt-2">
                          <span className="text-sm font-medium text-gray-500">Insurance:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {watch('insuranceInfo.provider')} - Policy: {watch('insuranceInfo.policyNumber')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
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
            
            {currentStep < 5 ? (
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
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;