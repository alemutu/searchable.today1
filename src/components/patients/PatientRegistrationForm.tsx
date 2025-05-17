import React, { useState, useEffect } from 'react';
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
  Search,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Wallet
} from 'lucide-react';

interface PatientFormData {
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
  medicalInfo: {
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: { name: string; dosage?: string }[];
    bloodType?: string;
    smoker?: boolean;
    alcoholConsumption?: string;
  };
  paymentMethod: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    holderName?: string;
  };
}

interface ExistingPatient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender: string;
  contact_number: string;
  email?: string;
  address: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<PatientFormData>();
  const [currentStep, setCurrentStep] = useState(1);
  const [patientType, setPatientType] = useState<'new' | 'existing' | 'emergency'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExistingPatient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the hybrid storage hook for patients
  const { 
    saveItem: savePatient, 
    fetchItems: fetchPatients,
    data: existingPatients,
    loading: patientsLoading
  } = useHybridStorage<any>('patients');
  
  // Watch form values
  const watchPaymentMethod = watch('paymentMethod');
  
  useEffect(() => {
    // Fetch existing patients for search
    fetchPatients();
  }, [fetchPatients]);
  
  useEffect(() => {
    // Set priority level based on patient type
    if (patientType === 'emergency') {
      setValue('medicalInfo.priority', 'critical');
    }
  }, [patientType, setValue]);
  
  const handleSearch = () => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    setIsSearching(true);
    
    try {
      // Filter existing patients based on search term
      if (Array.isArray(existingPatients)) {
        const results = existingPatients.filter(patient => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          const contactNumber = patient.contact_number || '';
          
          return fullName.includes(searchTerm.toLowerCase()) || 
                 contactNumber.includes(searchTerm);
        });
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
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
  
  const selectExistingPatient = (patient: ExistingPatient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    
    // Pre-fill form with existing patient data
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    
    // Move to next step
    setCurrentStep(2);
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
      // Prepare patient data
      const patientData = {
        id: selectedPatient?.id, // Will be undefined for new patients
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email || null,
        address: data.address,
        emergency_contact: {
          name: data.emergencyContact.name,
          relationship: data.emergencyContact.relationship,
          phone: data.emergencyContact.phone
        },
        medical_info: {
          allergies: data.medicalInfo.allergies || [],
          chronicConditions: data.medicalInfo.chronicConditions || [],
          currentMedications: data.medicalInfo.currentMedications || [],
          bloodType: data.medicalInfo.bloodType || null,
          smoker: data.medicalInfo.smoker || false,
          alcoholConsumption: data.medicalInfo.alcoholConsumption || 'none'
        },
        payment_method: data.paymentMethod,
        insurance_info: data.paymentMethod === 'insurance' ? data.insuranceInfo : null,
        status: 'active',
        current_flow_step: patientType === 'emergency' ? 'emergency' : 'triage',
        priority_level: patientType === 'emergency' ? 'critical' : 'normal',
        arrival_time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      // Save patient data
      const savedPatient = await savePatient(patientData, selectedPatient?.id);
      
      // Show success notification
      addNotification({
        message: `Patient ${selectedPatient ? 'updated' : 'registered'} successfully`,
        type: 'success'
      });
      
      // Redirect to triage
      navigate(`/patients/${savedPatient.id}/triage`);
    } catch (error) {
      console.error('Error saving patient:', error);
      addNotification({
        message: 'Error saving patient information',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-teal-600 rounded-t-md p-3 mb-3">
        <div className="flex items-center">
          <ArrowLeft className="h-5 w-5 text-white mr-2" onClick={() => navigate(-1)} style={{cursor: 'pointer'}} />
          <h1 className="text-lg font-medium text-white">
            Patient Registration
          </h1>
        </div>
        <p className="text-xs text-teal-100 ml-7">Register new or manage existing patients</p>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : 1}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 1 ? 'bg-teal-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : 2}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 2 ? 'bg-teal-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : 3}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 3 ? 'bg-teal-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              currentStep >= 4 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 4 ? <CheckCircle className="h-4 w-4" /> : 4}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 4 ? 'bg-teal-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              currentStep >= 5 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              5
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Step {currentStep} of 5
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <div className={currentStep === 1 ? 'text-teal-600 font-medium' : ''}>Patient Type</div>
          <div className={currentStep === 2 ? 'text-teal-600 font-medium' : ''}>Personal Info</div>
          <div className={currentStep === 3 ? 'text-teal-600 font-medium' : ''}>Contact</div>
          <div className={currentStep === 4 ? 'text-teal-600 font-medium' : ''}>Priority</div>
          <div className={currentStep === 5 ? 'text-teal-600 font-medium' : ''}>Review</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-md shadow-sm p-4">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-2">Patient Type</h2>
              <p className="text-sm text-gray-600 mb-3">Select the appropriate patient type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    patientType === 'new' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPatientType('new')}
                >
                  <div className="flex items-center mb-1">
                    <User className="h-5 w-5 text-teal-500 mr-2" />
                    <h3 className="text-sm font-medium">New Patient</h3>
                  </div>
                  <p className="text-xs text-gray-500">Register a new patient</p>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    patientType === 'existing' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPatientType('existing')}
                >
                  <div className="flex items-center mb-1">
                    <Search className="h-5 w-5 text-teal-500 mr-2" />
                    <h3 className="text-sm font-medium">Existing Patient</h3>
                  </div>
                  <p className="text-xs text-gray-500">Find patient records</p>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    patientType === 'emergency' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPatientType('emergency')}
                >
                  <div className="flex items-center mb-1">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="text-sm font-medium">Emergency</h3>
                  </div>
                  <p className="text-xs text-gray-500">Fast-track emergency case</p>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <Search className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium">Search Existing Patient</h3>
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-8 py-1.5 text-sm w-full"
                        placeholder="Search by name or phone number"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching || searchTerm.length < 2}
                      className="btn btn-primary py-1.5 text-sm"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  
                  {isSearching ? (
                    <div className="mt-2 text-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-1">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="mt-2 border rounded-md divide-y max-h-60 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <div 
                          key={patient.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => selectExistingPatient(patient)}
                        >
                          <div>
                            <div className="text-sm font-medium">{patient.first_name} {patient.last_name}</div>
                            <div className="text-xs text-gray-500">
                              {patient.contact_number}
                              {patient.date_of_birth && ` • ${new Date(patient.date_of_birth).toLocaleDateString()}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-xs text-teal-600 hover:text-teal-800"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm && !isSearching ? (
                    <div className="mt-2 text-center py-2">
                      <p className="text-sm text-gray-500">No patients found matching "{searchTerm}"</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-2">Personal Information</h2>
              <p className="text-sm text-gray-600 mb-3">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs required">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`form-input pl-7 py-1.5 text-sm ${errors.firstName ? 'border-red-300' : ''}`}
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-7 py-1.5 text-sm ${errors.lastName ? 'border-red-300' : ''}`}
                    />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label text-xs required">Age</label>
                  <input
                    type="number"
                    {...register('age', { 
                      required: 'Age is required',
                      min: { value: 0, message: 'Age must be positive' },
                      max: { value: 120, message: 'Age must be less than 120' }
                    })}
                    className={`form-input py-1.5 text-sm ${errors.age ? 'border-red-300' : ''}`}
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
                </div>
                
                <div>
                  <label className="form-label text-xs">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="form-input pl-7 py-1.5 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label text-xs required">Gender</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`form-input py-1.5 text-sm ${errors.gender ? 'border-red-300' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-2">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-3">Enter the patient's contact details</p>
              
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Phone number is required' })}
                      className={`form-input pl-7 py-1.5 text-sm ${errors.contactNumber ? 'border-red-300' : ''}`}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>}
                </div>
                
                <div>
                  <label className="form-label text-xs">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="form-input pl-7 py-1.5 text-sm"
                      placeholder="patient@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label text-xs required">Address</label>
                  <div className="relative">
                    <div className="absolute top-2 left-2 flex-shrink-0">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-7 py-1.5 text-sm ${errors.address ? 'border-red-300' : ''}`}
                      rows={2}
                    />
                  </div>
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs required">Name</label>
                      <input
                        type="text"
                        {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                        className={`form-input py-1.5 text-sm ${errors.emergencyContact?.name ? 'border-red-300' : ''}`}
                      />
                      {errors.emergencyContact?.name && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.name.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label text-xs required">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                        className={`form-input py-1.5 text-sm ${errors.emergencyContact?.relationship ? 'border-red-300' : ''}`}
                      />
                      {errors.emergencyContact?.relationship && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.relationship.message}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label text-xs required">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                          className={`form-input pl-7 py-1.5 text-sm ${errors.emergencyContact?.phone ? 'border-red-300' : ''}`}
                          placeholder="(123) 456-7890"
                        />
                      </div>
                      {errors.emergencyContact?.phone && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.phone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority & Payment */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-2">Priority & Payment</h2>
              <p className="text-sm text-gray-600 mb-3">Set priority level and payment information</p>
              
              <div className="space-y-4">
                {/* Priority Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Priority Level</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-normal"
                        value="normal"
                        {...register('medicalInfo.priority')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        disabled={patientType === 'emergency'}
                      />
                      <label htmlFor="priority-normal" className="ml-2 block text-sm text-gray-700">
                        Normal
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-urgent"
                        value="urgent"
                        {...register('medicalInfo.priority')}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                        disabled={patientType === 'emergency'}
                      />
                      <label htmlFor="priority-urgent" className="ml-2 block text-sm text-gray-700">
                        Urgent
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-critical"
                        value="critical"
                        {...register('medicalInfo.priority')}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                        checked={patientType === 'emergency'}
                        readOnly={patientType === 'emergency'}
                      />
                      <label htmlFor="priority-critical" className="ml-2 block text-sm text-gray-700">
                        Critical
                      </label>
                    </div>
                  </div>
                  
                  {patientType === 'emergency' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-xs text-red-700">
                        This patient has been marked as an emergency case and will be prioritized accordingly.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Payment Method Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div 
                      className={`border rounded-md p-2 cursor-pointer transition-colors ${
                        watchPaymentMethod === 'cash' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'cash')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="payment-cash"
                          value="cash"
                          {...register('paymentMethod')}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <label htmlFor="payment-cash" className="ml-2 flex items-center text-sm text-gray-700">
                          <Wallet className="h-4 w-4 mr-1.5 text-gray-500" />
                          Cash
                        </label>
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-2 cursor-pointer transition-colors ${
                        watchPaymentMethod === 'card' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'card')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="payment-card"
                          value="card"
                          {...register('paymentMethod')}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <label htmlFor="payment-card" className="ml-2 flex items-center text-sm text-gray-700">
                          <CreditCard className="h-4 w-4 mr-1.5 text-gray-500" />
                          Credit/Debit Card
                        </label>
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-2 cursor-pointer transition-colors ${
                        watchPaymentMethod === 'insurance' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'insurance')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="payment-insurance"
                          value="insurance"
                          {...register('paymentMethod')}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <label htmlFor="payment-insurance" className="ml-2 flex items-center text-sm text-gray-700">
                          <CreditCard className="h-4 w-4 mr-1.5 text-gray-500" />
                          Insurance
                        </label>
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-2 cursor-pointer transition-colors ${
                        watchPaymentMethod === 'free' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('paymentMethod', 'free')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="payment-free"
                          value="free"
                          {...register('paymentMethod')}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <label htmlFor="payment-free" className="ml-2 flex items-center text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 mr-1.5 text-gray-500" />
                          Free Treatment
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insurance Information */}
                  {watchPaymentMethod === 'insurance' && (
                    <div className="mt-3 p-3 border border-gray-200 rounded-md">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Insurance Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="form-label text-xs required">Provider</label>
                          <input
                            type="text"
                            {...register('insuranceInfo.provider', { 
                              required: watchPaymentMethod === 'insurance' ? 'Provider is required' : false 
                            })}
                            className="form-input py-1.5 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs required">Policy Number</label>
                          <input
                            type="text"
                            {...register('insuranceInfo.policyNumber', { 
                              required: watchPaymentMethod === 'insurance' ? 'Policy number is required' : false 
                            })}
                            className="form-input py-1.5 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Group Number</label>
                          <input
                            type="text"
                            {...register('insuranceInfo.groupNumber')}
                            className="form-input py-1.5 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Policy Holder Name</label>
                          <input
                            type="text"
                            {...register('insuranceInfo.holderName')}
                            className="form-input py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-2">Review Information</h2>
              <p className="text-sm text-gray-600 mb-3">Please review the patient information before submitting</p>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-1 font-medium">{watch('firstName')} {watch('lastName')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Age:</span>
                      <span className="ml-1 font-medium">{watch('age')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Gender:</span>
                      <span className="ml-1 font-medium">{watch('gender')}</span>
                    </div>
                    {watch('dateOfBirth') && (
                      <div>
                        <span className="text-gray-500">Date of Birth:</span>
                        <span className="ml-1 font-medium">{watch('dateOfBirth')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-1 font-medium">{watch('contactNumber')}</span>
                    </div>
                    {watch('email') && (
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-1 font-medium">{watch('email')}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-500">Address:</span>
                      <span className="ml-1 font-medium">{watch('address')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-1 font-medium">{watch('emergencyContact.name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Relationship:</span>
                      <span className="ml-1 font-medium">{watch('emergencyContact.relationship')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-1 font-medium">{watch('emergencyContact.phone')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Priority & Payment</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className={`ml-1 font-medium ${
                        watch('medicalInfo.priority') === 'critical' ? 'text-red-600' :
                        watch('medicalInfo.priority') === 'urgent' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {watch('medicalInfo.priority')?.charAt(0).toUpperCase() + watch('medicalInfo.priority')?.slice(1) || 'Normal'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="ml-1 font-medium">
                        {watch('paymentMethod')?.charAt(0).toUpperCase() + watch('paymentMethod')?.slice(1) || 'Not specified'}
                      </span>
                    </div>
                    
                    {watch('paymentMethod') === 'insurance' && (
                      <>
                        <div>
                          <span className="text-gray-500">Insurance Provider:</span>
                          <span className="ml-1 font-medium">{watch('insuranceInfo.provider')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Policy Number:</span>
                          <span className="ml-1 font-medium">{watch('insuranceInfo.policyNumber')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {patientType === 'emergency' && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-800">Emergency Case</p>
                      <p className="text-xs text-red-700">
                        This patient will be fast-tracked through the system as an emergency case.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline py-1.5 px-3 text-sm flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline py-1.5 px-3 text-sm flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Cancel
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !patientType) ||
                (patientType === 'existing' && currentStep === 1 && !selectedPatient)
              }
              className="btn btn-primary py-1.5 px-3 text-sm flex items-center"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary py-1.5 px-3 text-sm flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Register Patient
                  <ArrowRight className="h-4 w-4 ml-1.5" />
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