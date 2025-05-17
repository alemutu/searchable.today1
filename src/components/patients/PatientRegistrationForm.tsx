import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  CreditCard,
  Building2,
  DollarSign,
  Smartphone
} from 'lucide-react';

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
  patientType: 'new' | 'existing';
  existingPatientId?: string;
  priority: 'normal' | 'urgent' | 'critical';
  paymentMethod: 'cash' | 'credit_card' | 'insurance' | 'mobile_payment';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showInsuranceFields, setShowInsuranceFields] = useState(false);
  
  const { 
    saveItem: savePatient,
    fetchItems: searchPatients,
    error: patientError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      patientType: 'new',
      priority: 'normal',
      paymentMethod: 'cash'
    }
  });
  
  const patientType = watch('patientType');
  const priority = watch('priority');
  const paymentMethod = watch('paymentMethod');
  
  // Watch for payment method changes to show/hide insurance fields
  useEffect(() => {
    setShowInsuranceFields(paymentMethod === 'insurance');
  }, [paymentMethod]);
  
  // Handle patient search
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
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('dateOfBirth', patient.date_of_birth);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    
    if (patient.emergency_contact) {
      setValue('emergencyContact.name', patient.emergency_contact.name);
      setValue('emergencyContact.relationship', patient.emergency_contact.relationship);
      setValue('emergencyContact.phone', patient.emergency_contact.phone);
    }
    
    setSearchResults([]);
    setSearchTerm('');
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientFormData) => {
    setIsLoading(true);
    
    try {
      if (data.patientType === 'existing' && data.existingPatientId) {
        // Update existing patient with new priority and flow step
        const patientData = {
          id: data.existingPatientId,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          contact_number: data.contactNumber,
          email: data.email,
          address: data.address,
          emergency_contact: data.emergencyContact,
          priority_level: data.priority,
          current_flow_step: 'registration',
          status: 'active',
          payment_method: data.paymentMethod,
          insurance_info: data.paymentMethod === 'insurance' ? data.insuranceInfo : null
        };
        
        await savePatient(patientData, data.existingPatientId);
      } else {
        // Create new patient
        const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const patientData = {
          id: patientId,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          contact_number: data.contactNumber,
          email: data.email,
          address: data.address,
          emergency_contact: data.emergencyContact,
          priority_level: data.priority,
          current_flow_step: 'registration',
          status: 'active',
          payment_method: data.paymentMethod,
          insurance_info: data.paymentMethod === 'insurance' ? data.insuranceInfo : null
        };
        
        await savePatient(patientData, patientId);
      }
      
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-gray-900">
                Patient Registration
              </h1>
              <p className="text-sm text-gray-500">
                Register a new patient or update an existing one
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-4">
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
              <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
              <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Patient Details</div>
              <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Review</div>
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div 
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      patientType === 'new' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('patientType', 'new')}
                  >
                    <div className="flex items-center">
                      <UserPlus className={`h-5 w-5 ${patientType === 'new' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className="ml-2 font-medium">New Patient</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Register a new patient in the system
                    </p>
                  </div>
                  
                  <div 
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      patientType === 'existing' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('patientType', 'existing')}
                  >
                    <div className="flex items-center">
                      <User className={`h-5 w-5 ${patientType === 'existing' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className="ml-2 font-medium">Existing Patient</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Search for an existing patient
                    </p>
                  </div>
                </div>
                
                {patientType === 'existing' && (
                  <div className="mt-4 space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-input pl-10"
                          placeholder="Search by name, ID, or phone number"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching || !searchTerm}
                        className="btn btn-primary"
                      >
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        ) : (
                          'Search'
                        )}
                      </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {searchResults.map((patient) => (
                              <tr key={patient.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {patient.first_name} {patient.last_name}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(patient.date_of_birth).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {patient.contact_number}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => selectExistingPatient(patient)}
                                    className="text-primary-600 hover:text-primary-900 text-sm font-medium"
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
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No patients found matching "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Patient Priority</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        priority === 'normal' 
                          ? 'border-success-500 bg-success-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('priority', 'normal')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Normal</span>
                        <div className={`w-3 h-3 rounded-full ${priority === 'normal' ? 'bg-success-500' : 'bg-gray-200'}`}></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Standard priority for routine visits
                      </p>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        priority === 'urgent' 
                          ? 'border-warning-500 bg-warning-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('priority', 'urgent')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Urgent</span>
                        <div className={`w-3 h-3 rounded-full ${priority === 'urgent' ? 'bg-warning-500' : 'bg-gray-200'}`}></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Needs prompt attention
                      </p>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        priority === 'critical' 
                          ? 'border-error-500 bg-error-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('priority', 'critical')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Critical</span>
                        <div className={`w-3 h-3 rounded-full ${priority === 'critical' ? 'bg-error-500' : 'bg-gray-200'}`}></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Requires immediate attention
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'cash' 
                          ? 'border-success-500 bg-success-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'cash')}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <DollarSign className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-success-500' : 'text-gray-400'}`} />
                          <span className="ml-2 font-medium">Cash</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${paymentMethod === 'cash' ? 'bg-success-500' : 'bg-gray-200'}`}></div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'credit_card' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'credit_card')}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <CreditCard className={`h-5 w-5 ${paymentMethod === 'credit_card' ? 'text-primary-500' : 'text-gray-400'}`} />
                          <span className="ml-2 font-medium">Credit Card</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${paymentMethod === 'credit_card' ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'insurance' 
                          ? 'border-secondary-500 bg-secondary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'insurance')}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Building2 className={`h-5 w-5 ${paymentMethod === 'insurance' ? 'text-secondary-500' : 'text-gray-400'}`} />
                          <span className="ml-2 font-medium">Insurance</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${paymentMethod === 'insurance' ? 'bg-secondary-500' : 'bg-gray-200'}`}></div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'mobile_payment' 
                          ? 'border-accent-500 bg-accent-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'mobile_payment')}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Smartphone className={`h-5 w-5 ${paymentMethod === 'mobile_payment' ? 'text-accent-500' : 'text-gray-400'}`} />
                          <span className="ml-2 font-medium">Mobile Payment</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${paymentMethod === 'mobile_payment' ? 'bg-accent-500' : 'bg-gray-200'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {showInsuranceFields && (
                    <div className="mt-4 p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                      <h4 className="text-sm font-medium text-secondary-800 mb-3">Insurance Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label required">Insurance Provider</label>
                          <input
                            type="text"
                            {...register('insuranceInfo.provider', { required: 'Provider is required' })}
                            className={`form-input ${errors.insuranceInfo?.provider ? 'border-error-300' : ''}`}
                          />
                          {errors.insuranceInfo?.provider && (
                            <p className="form-error">{errors.insuranceInfo.provider.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="form-label required">Policy Number</label>
                          <input
                            type="text"
                            {...register('insuranceInfo.policyNumber', { required: 'Policy number is required' })}
                            className={`form-input ${errors.insuranceInfo?.policyNumber ? 'border-error-300' : ''}`}
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
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Patient Details */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Details</h2>
              
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
                      className={`form-input pl-10 ${errors.firstName ? 'border-error-300' : ''}`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
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
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-10 ${errors.lastName ? 'border-error-300' : ''}`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
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
                      {...register('dateOfBirth', { required: 'Date of birth is required' })}
                      className={`form-input pl-10 ${errors.dateOfBirth ? 'border-error-300' : ''}`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="form-error">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Gender</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input ${errors.gender ? 'border-error-300' : ''}`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="form-error">{errors.gender.message}</p>
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
                      {...register('contactNumber', { required: 'Contact number is required' })}
                      className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300' : ''}`}
                      placeholder="Enter contact number"
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
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
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
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-10 ${errors.address ? 'border-error-300' : ''}`}
                      rows={2}
                      placeholder="Enter full address"
                    ></textarea>
                  </div>
                  {errors.address && (
                    <p className="form-error">{errors.address.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label required">Name</label>
                    <input
                      type="text"
                      {...register('emergencyContact.name', { required: 'Name is required' })}
                      className={`form-input ${errors.emergencyContact?.name ? 'border-error-300' : ''}`}
                      placeholder="Enter contact name"
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
                      className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300' : ''}`}
                      placeholder="E.g., Spouse, Parent"
                    />
                    {errors.emergencyContact?.relationship && (
                      <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Phone Number</label>
                    <input
                      type="tel"
                      {...register('emergencyContact.phone', { required: 'Phone number is required' })}
                      className={`form-input ${errors.emergencyContact?.phone ? 'border-error-300' : ''}`}
                      placeholder="Enter phone number"
                    />
                    {errors.emergencyContact?.phone && (
                      <p className="form-error">{errors.emergencyContact.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review Information</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Patient Type</h3>
                  <p className="text-gray-700">
                    {patientType === 'new' ? 'New Patient' : 'Existing Patient'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Priority</h3>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      priority === 'normal' ? 'bg-success-500' : 
                      priority === 'urgent' ? 'bg-warning-500' : 
                      'bg-error-500'
                    }`}></div>
                    <span className="ml-2 text-gray-700">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Payment Information</h3>
                  <div className="flex items-center">
                    {paymentMethod === 'cash' && <DollarSign className="h-5 w-5 text-success-500 mr-2" />}
                    {paymentMethod === 'credit_card' && <CreditCard className="h-5 w-5 text-primary-500 mr-2" />}
                    {paymentMethod === 'insurance' && <Building2 className="h-5 w-5 text-secondary-500 mr-2" />}
                    {paymentMethod === 'mobile_payment' && <Smartphone className="h-5 w-5 text-accent-500 mr-2" />}
                    <span className="text-gray-700">
                      {paymentMethod === 'cash' ? 'Cash' : 
                       paymentMethod === 'credit_card' ? 'Credit Card' :
                       paymentMethod === 'insurance' ? 'Insurance' : 'Mobile Payment'}
                    </span>
                  </div>
                  
                  {paymentMethod === 'insurance' && (
                    <div className="mt-2 ml-7 text-sm text-gray-600">
                      <p><span className="font-medium">Provider:</span> {watch('insuranceInfo.provider')}</p>
                      <p><span className="font-medium">Policy Number:</span> {watch('insuranceInfo.policyNumber')}</p>
                      {watch('insuranceInfo.groupNumber') && (
                        <p><span className="font-medium">Group Number:</span> {watch('insuranceInfo.groupNumber')}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-gray-700">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="text-gray-700">{watch('dateOfBirth')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-gray-700">{watch('gender')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Number</p>
                      <p className="text-gray-700">{watch('contactNumber')}</p>
                    </div>
                    {watch('email') && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-700">{watch('email')}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-700">{watch('address')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-gray-700">{watch('emergencyContact.name')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Relationship</p>
                      <p className="text-gray-700">{watch('emergencyContact.relationship')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-gray-700">{watch('emergencyContact.phone')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
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
              onClick={() => navigate('/patients')}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center"
            >
              {isLoading ? (
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