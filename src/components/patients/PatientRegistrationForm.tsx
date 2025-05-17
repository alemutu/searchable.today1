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
  Building2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientRegistrationFormData {
  patientType: 'new' | 'existing';
  existingPatientId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep === 1
                  ? 'bg-primary-500 text-white'
                  : currentStep > 1
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <User className="h-4 w-4" /> : 1}
              </div>
              <div className={`h-1 w-10 ${
                currentStep > 1 ? 'bg-success-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep === 2
                  ? 'bg-primary-500 text-white'
                  : currentStep > 2
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <AlertTriangle className="h-4 w-4" /> : 2}
              </div>
              <div className={`h-1 w-10 ${
                currentStep > 2 ? 'bg-success-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep === 3
                  ? 'bg-primary-500 text-white'
                  : currentStep > 3
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Step {currentStep} of 3
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
            <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Medical Info</div>
            <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Review</div>
          </div>
        </div>
        
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="newPatient"
                    value="new"
                    {...register('patientType')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="newPatient" className="ml-2 block text-sm text-gray-700">
                    New Patient
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="existingPatient"
                    value="existing"
                    {...register('patientType')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="existingPatient" className="ml-2 block text-sm text-gray-700">
                    Existing Patient
                  </label>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="space-y-3">
                  <div className="flex space-x-2">
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
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <input
                  type="text"
                  {...register('personalInfo.lastName', { required: 'Last name is required' })}
                  className={`form-input ${errors.personalInfo?.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter last name"
                />
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
              
              <div className="sm:col-span-2">
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
            
            <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Emergency Contact</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label required">Name</label>
                <input
                  type="text"
                  {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                  className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter emergency contact name"
                />
                {errors.emergencyContact?.name && (
                  <p className="form-error">{errors.emergencyContact.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label required">Relationship</label>
                <input
                  type="text"
                  {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                  className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter relationship"
                />
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
        )}
        
        {/* Step 2: Medical Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Allergies</label>
                <textarea
                  {...register('medicalInfo.allergies')}
                  className="form-input"
                  rows={2}
                  placeholder="Enter allergies (separated by commas)"
                />
              </div>
              
              <div>
                <label className="form-label">Chronic Conditions</label>
                <textarea
                  {...register('medicalInfo.chronicConditions')}
                  className="form-input"
                  rows={2}
                  placeholder="Enter chronic conditions (separated by commas)"
                />
              </div>
              
              <div>
                <label className="form-label">Current Medications</label>
                <textarea
                  {...register('medicalInfo.currentMedications')}
                  className="form-input"
                  rows={2}
                  placeholder="Enter current medications (separated by commas)"
                />
              </div>
              
              <div>
                <label className="form-label">Past Surgeries</label>
                <textarea
                  {...register('medicalInfo.pastSurgeries')}
                  className="form-input"
                  rows={2}
                  placeholder="Enter past surgeries (separated by commas)"
                />
              </div>
              
              <div>
                <label className="form-label">Family History</label>
                <textarea
                  {...register('medicalInfo.familyHistory')}
                  className="form-input"
                  rows={2}
                  placeholder="Enter family medical history"
                />
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Patient Priority</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="normalPriority"
                    value="normal"
                    {...register('patientPriority')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="normalPriority" className="ml-2 block text-sm text-gray-700">
                    Normal
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="urgentPriority"
                    value="urgent"
                    {...register('patientPriority')}
                    className="h-4 w-4 text-warning-600 focus:ring-warning-500 border-gray-300"
                  />
                  <label htmlFor="urgentPriority" className="ml-2 block text-sm text-gray-700">
                    Urgent
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="emergencyPriority"
                    value="emergency"
                    {...register('patientPriority')}
                    className="h-4 w-4 text-error-600 focus:ring-error-500 border-gray-300"
                  />
                  <label htmlFor="emergencyPriority" className="ml-2 block text-sm text-gray-700">
                    Emergency
                  </label>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Payment Method</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'cash')}
              >
                <div className="flex items-center justify-center mb-2">
                  <Wallet className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Cash</div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'insurance')}
              >
                <div className="flex items-center justify-center mb-2">
                  <Building2 className={`h-6 w-6 ${paymentMethod === 'insurance' ? 'text-primary-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Insurance</div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'credit_card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'credit_card')}
              >
                <div className="flex items-center justify-center mb-2">
                  <CreditCard className={`h-6 w-6 ${paymentMethod === 'credit_card' ? 'text-primary-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Credit Card</div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  paymentMethod === 'mobile_payment' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'mobile_payment')}
              >
                <div className="flex items-center justify-center mb-2">
                  <Phone className={`h-6 w-6 ${paymentMethod === 'mobile_payment' ? 'text-primary-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Mobile Payment</div>
                </div>
              </div>
            </div>
            
            {paymentMethod === 'insurance' && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Insurance Information</h3>
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
        )}
        
        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Review Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Personal Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <h3 className="text-md font-medium text-gray-900 mb-2">Emergency Contact</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <h3 className="text-md font-medium text-gray-900 mb-2">Medical Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Allergies:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('medicalInfo.allergies') || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Chronic Conditions:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('medicalInfo.chronicConditions') || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Current Medications:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('medicalInfo.currentMedications') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Priority & Payment</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        <div className="flex justify-between mt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
          ) : (
            <div></div>
          )}
          
          {currentStep < 3 ? (
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
  );
};

export default PatientRegistrationForm;