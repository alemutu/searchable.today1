import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Search, 
  UserPlus, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Save,
  Clock,
  Star,
  Zap,
  Import,
  CheckCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientFormData {
  patientType: 'new' | 'existing' | 'emergency';
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth?: string;
  gender: string;
  contactNumber: string;
  email?: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  priority: 'normal' | 'emergency' | 'referral' | 'vip';
  priorityNotes?: string;
  paymentMode: 'cash' | 'nhif' | 'insurance' | 'corporate' | 'waiver';
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  nhifNumber?: string;
  corporateName?: string;
  waiverReason?: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patientId, setPatientId] = useState<string>('');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      age: 0,
      gender: '',
      contactNumber: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      priority: 'normal',
      paymentMode: 'cash'
    }
  });
  
  // Watch values for conditional rendering
  const patientType = watch('patientType');
  const paymentMode = watch('paymentMode');
  const priority = watch('priority');
  
  // Generate a unique patient ID
  useEffect(() => {
    // Generate a simple ID format: PT + random 6 digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    setPatientId(`PT${randomDigits}`);
  }, []);
  
  const searchPatient = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock search results
      if (searchTerm.toLowerCase().includes('john')) {
        setSearchResults([
          {
            id: 'PT123456',
            firstName: 'John',
            lastName: 'Doe',
            age: 45,
            gender: 'Male',
            contactNumber: '+1234567890',
            email: 'john.doe@example.com',
            address: '123 Main St, Anytown',
            emergencyContact: {
              name: 'Jane Doe',
              relationship: 'Spouse',
              phone: '+0987654321'
            }
          }
        ]);
      } else if (searchTerm.toLowerCase().includes('jane')) {
        setSearchResults([
          {
            id: 'PT234567',
            firstName: 'Jane',
            lastName: 'Smith',
            age: 32,
            gender: 'Female',
            contactNumber: '+2345678901',
            email: 'jane.smith@example.com',
            address: '456 Oak St, Somewhere',
            emergencyContact: {
              name: 'John Smith',
              relationship: 'Husband',
              phone: '+1987654321'
            }
          }
        ]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for patient:', error);
      addNotification({
        message: 'Failed to search for patient',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectExistingPatient = (patient: any) => {
    setValue('firstName', patient.firstName);
    setValue('lastName', patient.lastName);
    setValue('age', patient.age);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contactNumber);
    setValue('email', patient.email);
    setValue('address', patient.address);
    setValue('emergencyContact', patient.emergencyContact);
    
    // Clear search results
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
    setIsSubmitting(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Patient data submitted:', data);
      
      // Show success notification
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Redirect to patient list
      navigate('/patients');
    } catch (error) {
      console.error('Error registering patient:', error);
      addNotification({
        message: 'Failed to register patient',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-primary-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-primary-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Patient Registration</h1>
            <p className="text-primary-100">Register new or manage existing patients</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-b-lg shadow-md">
        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-6 w-6" /> : 1}
              </div>
              <div className={`h-1 w-12 ${
                currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <CheckCircle className="h-6 w-6" /> : 2}
              </div>
              <div className={`h-1 w-12 ${
                currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 3 ? <CheckCircle className="h-6 w-6" /> : 3}
              </div>
              <div className={`h-1 w-12 ${
                currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 4 ? <CheckCircle className="h-6 w-6" /> : 4}
              </div>
              <div className={`h-1 w-12 ${
                currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
            <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
            <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
            <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
            <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
            <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Select Patient Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    patientType === 'new' 
                      ? 'border-primary-500 bg-primary-50 shadow-md' 
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('patientType', 'new')}
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary-100 rounded-full">
                      <UserPlus className="h-6 w-6 text-primary-600" />
                    </div>
                    {patientType === 'new' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">New Patient</h3>
                  <p className="text-sm text-gray-500 mt-1">Register a new patient</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    patientType === 'existing' 
                      ? 'border-primary-500 bg-primary-50 shadow-md' 
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('patientType', 'existing')}
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary-100 rounded-full">
                      <Search className="h-6 w-6 text-primary-600" />
                    </div>
                    {patientType === 'existing' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Existing Patient</h3>
                  <p className="text-sm text-gray-500 mt-1">Find patient records</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50 shadow-md' 
                      : 'border-gray-200 hover:border-error-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('patientType', 'emergency')}
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-error-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-error-600" />
                    </div>
                    {patientType === 'emergency' && (
                      <CheckCircle className="h-5 w-5 text-error-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Emergency</h3>
                  <p className="text-sm text-gray-500 mt-1">Fast-track emergency case</p>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-10 pr-10 w-full"
                        placeholder="Search by name, ID, NHIF number, or phone..."
                      />
                      {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={searchPatient}
                      className="btn btn-primary"
                    >
                      Search
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4 border rounded-lg divide-y">
                      {searchResults.map((patient, index) => (
                        <div 
                          key={index} 
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectExistingPatient(patient)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                              <div className="text-sm text-gray-500">ID: {patient.id} • {patient.age} years • {patient.gender}</div>
                            </div>
                            <button
                              type="button"
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchTerm && searchResults.length === 0 && !isSearching && (
                    <div className="mt-4 p-4 text-center bg-white rounded-lg border">
                      <p className="text-gray-500">No patients found matching "{searchTerm}"</p>
                      <button
                        type="button"
                        onClick={() => setValue('patientType', 'new')}
                        className="mt-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Register as new patient instead
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {patientType === 'emergency' && (
                <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-error-800">Emergency Patient</h3>
                      <p className="text-sm text-error-700 mt-1">
                        For emergency cases, you can proceed with minimal information. 
                        Additional details can be collected later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center">
                <div className="bg-white p-2 rounded-lg mr-3">
                  <User className="h-6 w-6 text-primary-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-800">Patient ID: {patientId}</div>
                  <div className="text-sm text-blue-600">Unique identifier for this patient</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label required">First Name</label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label required">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label required">Age</label>
                  <input
                    type="number"
                    {...register('age', { 
                      required: 'Age is required',
                      min: { value: 0, message: 'Age must be positive' },
                      max: { value: 120, message: 'Age must be less than 120' }
                    })}
                    className={`form-input ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.age && <p className="form-error">{errors.age.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">Date of Birth (Optional)</label>
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
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div>
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
                
                <div>
                  <label className="form-label">Email Address (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="form-input pl-10"
                      placeholder="patient@example.com"
                    />
                  </div>
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
                      rows={3}
                      placeholder="Enter patient's address"
                    />
                  </div>
                  {errors.address && <p className="form-error">{errors.address.message}</p>}
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
                    <span className="text-xs text-gray-500">Optional</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        {...register('emergencyContact.name')}
                        className="form-input"
                        placeholder="Contact name"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship')}
                        className="form-input"
                        placeholder="e.g., Spouse, Parent, Child"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone')}
                          className="form-input pl-10"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority */}
          {currentStep === 4 && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Patient Priority</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div 
                  className={`border rounded-lg p-5 cursor-pointer transition-all ${
                    priority === 'normal' 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('priority', 'normal')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-primary-100 rounded-full">
                        <Clock className="h-6 w-6 text-primary-600" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mt-3">Normal</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">Standard priority</p>
                    </div>
                    {priority === 'normal' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-5 cursor-pointer transition-all ${
                    priority === 'emergency' 
                      ? 'border-error-500 ring-2 ring-error-200' 
                      : 'border-gray-200 hover:border-error-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('priority', 'emergency')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-error-100 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-error-600" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mt-3">Emergency</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">Urgent medical attention</p>
                    </div>
                    {priority === 'emergency' && (
                      <CheckCircle className="h-5 w-5 text-error-500" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-5 cursor-pointer transition-all ${
                    priority === 'referral' 
                      ? 'border-secondary-500 ring-2 ring-secondary-200' 
                      : 'border-gray-200 hover:border-secondary-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('priority', 'referral')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-secondary-100 rounded-full">
                        <Import className="h-6 w-6 text-secondary-600" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mt-3">Referral</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">Referred from another facility</p>
                    </div>
                    {priority === 'referral' && (
                      <CheckCircle className="h-5 w-5 text-secondary-500" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-5 cursor-pointer transition-all ${
                    priority === 'vip' 
                      ? 'border-warning-500 ring-2 ring-warning-200' 
                      : 'border-gray-200 hover:border-warning-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setValue('priority', 'vip')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-warning-100 rounded-full">
                        <Star className="h-6 w-6 text-warning-600" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mt-3">VIP</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">Priority service</p>
                    </div>
                    {priority === 'vip' && (
                      <CheckCircle className="h-5 w-5 text-warning-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="form-label">
                  Priority Notes
                  {priority === 'emergency' && <span className="text-error-600 ml-1">*</span>}
                </label>
                <textarea
                  {...register('priorityNotes', { 
                    required: priority === 'emergency' ? 'Please provide details about the emergency' : false 
                  })}
                  className={`form-input ${errors.priorityNotes ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={3}
                  placeholder={
                    priority === 'emergency' 
                      ? 'Describe the emergency situation and symptoms...' 
                      : priority === 'referral'
                      ? 'Enter referral details, referring doctor, and facility...'
                      : priority === 'vip'
                      ? 'Enter VIP status details and any special requirements...'
                      : 'Add any notes about patient priority...'
                  }
                />
                {errors.priorityNotes && <p className="form-error">{errors.priorityNotes.message}</p>}
                
                {priority === 'emergency' && (
                  <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                      <p className="text-sm text-error-700">
                        Emergency cases will bypass normal payment requirements. 
                        Treatment will be prioritized and payment can be processed later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mode of Payment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMode === 'cash' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setValue('paymentMode', 'cash')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cash"
                        checked={paymentMode === 'cash'}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="cash" className="ml-2 block text-sm font-medium text-gray-700">
                        Cash
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMode === 'nhif' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setValue('paymentMode', 'nhif')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="nhif"
                        checked={paymentMode === 'nhif'}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="nhif" className="ml-2 block text-sm font-medium text-gray-700">
                        NHIF
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMode === 'insurance' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setValue('paymentMode', 'insurance')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="insurance"
                        checked={paymentMode === 'insurance'}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="insurance" className="ml-2 block text-sm font-medium text-gray-700">
                        Insurance
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMode === 'corporate' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setValue('paymentMode', 'corporate')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="corporate"
                        checked={paymentMode === 'corporate'}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="corporate" className="ml-2 block text-sm font-medium text-gray-700">
                        Corporate
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMode === 'waiver' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setValue('paymentMode', 'waiver')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="waiver"
                        checked={paymentMode === 'waiver'}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="waiver" className="ml-2 block text-sm font-medium text-gray-700">
                        Waiver
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Conditional fields based on payment mode */}
                {paymentMode === 'nhif' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="form-label required">NHIF Number</label>
                    <input
                      type="text"
                      {...register('nhifNumber', { 
                        required: paymentMode === 'nhif' ? 'NHIF number is required' : false 
                      })}
                      className={`form-input ${errors.nhifNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter NHIF number"
                    />
                    {errors.nhifNumber && <p className="form-error">{errors.nhifNumber.message}</p>}
                  </div>
                )}
                
                {paymentMode === 'insurance' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label required">Insurance Provider</label>
                        <input
                          type="text"
                          {...register('insuranceDetails.provider', { 
                            required: paymentMode === 'insurance' ? 'Insurance provider is required' : false 
                          })}
                          className="form-input"
                          placeholder="Enter insurance provider"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label required">Policy Number</label>
                        <input
                          type="text"
                          {...register('insuranceDetails.policyNumber', { 
                            required: paymentMode === 'insurance' ? 'Policy number is required' : false 
                          })}
                          className="form-input"
                          placeholder="Enter policy number"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label required">Expiry Date</label>
                        <input
                          type="date"
                          {...register('insuranceDetails.expiryDate', { 
                            required: paymentMode === 'insurance' ? 'Expiry date is required' : false 
                          })}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMode === 'corporate' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="form-label required">Corporate Name</label>
                    <input
                      type="text"
                      {...register('corporateName', { 
                        required: paymentMode === 'corporate' ? 'Corporate name is required' : false 
                      })}
                      className={`form-input ${errors.corporateName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter corporate name"
                    />
                    {errors.corporateName && <p className="form-error">{errors.corporateName.message}</p>}
                  </div>
                )}
                
                {paymentMode === 'waiver' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="form-label required">Waiver Reason</label>
                    <textarea
                      {...register('waiverReason', { 
                        required: paymentMode === 'waiver' ? 'Waiver reason is required' : false 
                      })}
                      className={`form-input ${errors.waiverReason ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={3}
                      placeholder="Explain reason for waiver"
                    />
                    {errors.waiverReason && <p className="form-error">{errors.waiverReason.message}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Review Patient Information</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Patient ID: {patientId}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    priority === 'normal' ? 'bg-primary-100 text-primary-800' :
                    priority === 'emergency' ? 'bg-error-100 text-error-800' :
                    priority === 'referral' ? 'bg-secondary-100 text-secondary-800' :
                    'bg-warning-100 text-warning-800'
                  }`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Personal Information</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span> {watch('firstName')} {watch('lastName')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Age:</span> {watch('age')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Gender:</span> {watch('gender')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {watch('contactNumber')}
                      </p>
                      {watch('email') && (
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {watch('email')}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Address:</span> {watch('address')}
                      </p>
                    </div>
                  </div>
                  
                  {(watch('emergencyContact.name') || watch('emergencyContact.phone')) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Emergency Contact</h4>
                      <div className="mt-2 space-y-1">
                        {watch('emergencyContact.name') && (
                          <p className="text-sm">
                            <span className="font-medium">Name:</span> {watch('emergencyContact.name')}
                          </p>
                        )}
                        {watch('emergencyContact.relationship') && (
                          <p className="text-sm">
                            <span className="font-medium">Relationship:</span> {watch('emergencyContact.relationship')}
                          </p>
                        )}
                        {watch('emergencyContact.phone') && (
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {watch('emergencyContact.phone')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Payment Information</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Payment Mode:</span> {paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)}
                      </p>
                      {paymentMode === 'nhif' && watch('nhifNumber') && (
                        <p className="text-sm">
                          <span className="font-medium">NHIF Number:</span> {watch('nhifNumber')}
                        </p>
                      )}
                      {paymentMode === 'insurance' && watch('insuranceDetails.provider') && (
                        <>
                          <p className="text-sm">
                            <span className="font-medium">Provider:</span> {watch('insuranceDetails.provider')}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Policy Number:</span> {watch('insuranceDetails.policyNumber')}
                          </p>
                        </>
                      )}
                      {paymentMode === 'corporate' && watch('corporateName') && (
                        <p className="text-sm">
                          <span className="font-medium">Corporate:</span> {watch('corporateName')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {watch('priorityNotes') && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Priority Notes</h4>
                    <p className="text-sm mt-1 p-2 bg-white rounded border border-gray-200">
                      {watch('priorityNotes')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Ready to Register</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      Please review the information above and click "Register Patient" to complete the registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="p-6 border-t border-gray-200 flex justify-between">
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
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary flex items-center"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
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