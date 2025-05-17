import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  Save, 
  ArrowLeft, 
  ChevronRight,
  UserPlus,
  Search,
  Clock,
  CreditCard,
  Building2,
  Shield,
  FileText,
  CheckCircle,
  ChevronDown,
  Hash
} from 'lucide-react';

interface PatientFormData {
  patientType: 'new' | 'existing' | 'emergency';
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth?: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  showEmergencyContact: boolean;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  priority: 'normal' | 'emergency' | 'referral' | 'vip';
  priorityNotes?: string;
  paymentMethod: 'cash' | 'nhif' | 'insurance' | 'corporate' | 'waiver';
  nhifNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  corporateName?: string;
  waiverReason?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  date_of_birth?: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  } | null;
  status: string;
  current_flow_step: string | null;
  medical_info?: any;
  priority_level?: string;
  payment_method?: string;
  payment_details?: any;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [patientId, setPatientId] = useState<string>('');
  
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      age: 0,
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      showEmergencyContact: false,
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      priority: 'normal',
      paymentMethod: 'cash'
    }
  });
  
  const { saveItem } = useHybridStorage<Patient>('patients');
  const { data: existingPatients, fetchItems: fetchPatients } = useHybridStorage<Patient>('patients');
  
  const patientType = watch('patientType');
  const priority = watch('priority');
  const paymentMethod = watch('paymentMethod');
  const showEmergencyContact = watch('showEmergencyContact');
  
  useEffect(() => {
    // Fetch existing patients for search
    fetchPatients();
    
    // Generate a unique patient ID
    generatePatientId();
  }, [fetchPatients]);
  
  useEffect(() => {
    // Reset form when patient type changes
    if (patientType === 'emergency') {
      setValue('priority', 'emergency');
    } else if (patientType === 'new' && priority === 'emergency') {
      setValue('priority', 'normal');
    }
  }, [patientType, priority, setValue]);
  
  const generatePatientId = () => {
    // Generate a unique ID with format PT-YYYYMMDD-XXXX
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    
    setPatientId(`PT-${year}${month}${day}-${random}`);
  };
  
  const searchPatients = () => {
    if (!searchTerm || !Array.isArray(existingPatients)) return;
    
    setIsSearching(true);
    
    try {
      const results = existingPatients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const contactNumber = patient.contact_number;
        
        return fullName.includes(searchTerm.toLowerCase()) || 
               contactNumber.includes(searchTerm);
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectExistingPatient = (patient: Patient) => {
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('age', patient.age || 0);
    setValue('dateOfBirth', patient.date_of_birth || '');
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    
    if (patient.emergency_contact) {
      setValue('showEmergencyContact', true);
      setValue('emergencyContact', patient.emergency_contact);
    } else {
      setValue('showEmergencyContact', false);
    }
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
    
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
    setIsLoading(true);
    
    try {
      // Prepare patient data
      const patientData: Patient = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        date_of_birth: data.dateOfBirth,
        gender: data.gender || 'Unknown', // Default for emergency cases
        contact_number: data.contactNumber || 'Unknown', // Default for emergency cases
        email: data.email || null,
        address: data.address || 'Unknown', // Default for emergency cases
        emergency_contact: data.showEmergencyContact ? data.emergencyContact : null,
        status: 'active',
        current_flow_step: data.priority === 'emergency' ? 'emergency' : 'registration',
        priority_level: data.priority,
        payment_method: data.paymentMethod,
        payment_details: {
          nhif_number: data.nhifNumber,
          insurance_provider: data.insuranceProvider,
          insurance_policy_number: data.insurancePolicyNumber,
          corporate_name: data.corporateName,
          waiver_reason: data.waiverReason
        }
      };
      
      // Save patient data
      await saveItem(patientData, patientId);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Redirect based on priority
      if (data.priority === 'emergency') {
        navigate(`/patients/${patientId}/triage`);
      } else {
        navigate('/patients');
      }
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
  
  const renderStepIndicator = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm mb-4">
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
                {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : 3}
              </div>
              <div className={`h-1 w-10 ${
                currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                4
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Step {currentStep} of 4
            </div>
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-500">
            <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
            <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
            <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Priority</div>
            <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Review</div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center">
          <Link to="/patients" className="mr-3 p-1.5 rounded-full text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Patient Registration</h1>
            <p className="text-primary-100 text-sm">Register new or manage existing patients</p>
          </div>
        </div>
      </div>
      
      {renderStepIndicator()}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'new' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'new')}
                >
                  <div className="flex items-center mb-2">
                    <UserPlus className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-base font-medium text-gray-900">New Patient</h3>
                  </div>
                  <p className="text-sm text-gray-500">Register a new patient</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'existing' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'existing')}
                >
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-base font-medium text-gray-900">Existing Patient</h3>
                  </div>
                  <p className="text-sm text-gray-500">Find patient records</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    patientType === 'emergency' ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'emergency')}
                >
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                    <h3 className="text-base font-medium text-gray-900">Emergency</h3>
                  </div>
                  <p className="text-sm text-gray-500">Fast-track emergency case</p>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input pl-10 w-full"
                      placeholder="Search by name, ID, or phone number..."
                    />
                    <button
                      type="button"
                      onClick={searchPatients}
                      className="absolute inset-y-0 right-0 px-3 flex items-center bg-primary-500 text-white rounded-r-md"
                    >
                      Search
                    </button>
                  </div>
                  
                  {isSearching ? (
                    <div className="mt-2 flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="mt-2 border rounded-lg divide-y">
                      {searchResults.map((patient) => (
                        <div 
                          key={patient.id} 
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => selectExistingPatient(patient)}
                        >
                          <div>
                            <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                            <div className="text-sm text-gray-500">
                              {patient.age} years • {patient.contact_number}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : searchTerm && (
                    <div className="mt-2 text-center p-3 border rounded-lg bg-gray-50">
                      <p className="text-gray-500">No patients found matching "{searchTerm}"</p>
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
              
              {patientType === 'emergency' && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-error-800">Emergency Case</p>
                    <p className="text-sm text-error-700">
                      Only patient name is required. Other details can be filled later.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Patient ID</p>
                    <p className="text-base font-mono text-primary-600">{patientId}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Auto-generated</div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
                
                {patientType !== 'emergency' && (
                  <>
                    <div>
                      <label className="form-label required">Age</label>
                      <input
                        type="number"
                        {...register('age', { 
                          required: 'Age is required',
                          min: { value: 0, message: 'Age must be a positive number' },
                          valueAsNumber: true
                        })}
                        className={`form-input ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter age"
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
                          max={new Date().toISOString().split('T')[0]}
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
                      <label className="form-label">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          {...register('email')}
                          className="form-input pl-10"
                          placeholder="Enter email address (optional)"
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
                          {...register('address', { required: 'Address is required' })}
                          className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                          rows={2}
                          placeholder="Enter address"
                        />
                      </div>
                      {errors.address && <p className="form-error">{errors.address.message}</p>}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        className="flex items-center text-primary-600 hover:text-primary-800 mb-2"
                        onClick={() => setValue('showEmergencyContact', !showEmergencyContact)}
                      >
                        {showEmergencyContact ? (
                          <ChevronDown className="h-5 w-5 mr-1" />
                        ) : (
                          <ChevronRight className="h-5 w-5 mr-1" />
                        )}
                        <span className="font-medium">Emergency Contact (Optional)</span>
                      </button>
                      
                      {showEmergencyContact && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 border border-gray-200 rounded-lg">
                          <div>
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              {...register('emergencyContact.name')}
                              className="form-input"
                              placeholder="Enter contact name"
                            />
                          </div>
                          
                          <div>
                            <label className="form-label">Relationship</label>
                            <input
                              type="text"
                              {...register('emergencyContact.relationship')}
                              className="form-input"
                              placeholder="E.g., Spouse, Parent, Sibling"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label className="form-label">Phone Number</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                {...register('emergencyContact.phone')}
                                className="form-input pl-10"
                                placeholder="Enter emergency contact number"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3: Priority & Payment */}
          {currentStep === 3 && (
            <div>
              {/* Priority Section */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Priority</h2>
                
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      priority === 'normal' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'normal')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Normal</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      priority === 'emergency' ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'emergency')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="h-6 w-6 text-error-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Emergency</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      priority === 'referral' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'referral')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Referral</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      priority === 'vip' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'vip')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Shield className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">VIP</p>
                  </div>
                </div>
                
                {(priority === 'emergency' || priority === 'referral' || priority === 'vip') && (
                  <div className="mt-4">
                    <label className="form-label">Priority Notes</label>
                    <textarea
                      {...register('priorityNotes')}
                      className="form-input"
                      rows={2}
                      placeholder={`Please provide details about this ${priority} case...`}
                    />
                  </div>
                )}
              </div>
              
              {/* Payment Method Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Mode of Payment</h2>
                
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-4">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'cash')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <CreditCard className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Cash</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      paymentMethod === 'nhif' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'nhif')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Shield className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">NHIF</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'insurance')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Shield className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Insurance</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      paymentMethod === 'corporate' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'corporate')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Building2 className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Corporate</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      paymentMethod === 'waiver' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'waiver')}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-center text-sm font-medium">Waiver</p>
                  </div>
                </div>
                
                {/* Additional fields based on payment method */}
                {paymentMethod === 'nhif' && (
                  <div className="mt-4">
                    <label className="form-label required">NHIF Number</label>
                    <input
                      type="text"
                      {...register('nhifNumber', { required: 'NHIF number is required' })}
                      className={`form-input ${errors.nhifNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter NHIF number"
                    />
                    {errors.nhifNumber && <p className="form-error">{errors.nhifNumber.message}</p>}
                  </div>
                )}
                
                {paymentMethod === 'insurance' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <div>
                      <label className="form-label required">Insurance Provider</label>
                      <input
                        type="text"
                        {...register('insuranceProvider', { required: 'Insurance provider is required' })}
                        className={`form-input ${errors.insuranceProvider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter insurance provider"
                      />
                      {errors.insuranceProvider && <p className="form-error">{errors.insuranceProvider.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Policy Number</label>
                      <input
                        type="text"
                        {...register('insurancePolicyNumber', { required: 'Policy number is required' })}
                        className={`form-input ${errors.insurancePolicyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="Enter policy number"
                      />
                      {errors.insurancePolicyNumber && <p className="form-error">{errors.insurancePolicyNumber.message}</p>}
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'corporate' && (
                  <div className="mt-4">
                    <label className="form-label required">Company Name</label>
                    <input
                      type="text"
                      {...register('corporateName', { required: 'Company name is required' })}
                      className={`form-input ${errors.corporateName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter company name"
                    />
                    {errors.corporateName && <p className="form-error">{errors.corporateName.message}</p>}
                  </div>
                )}
                
                {paymentMethod === 'waiver' && (
                  <div className="mt-4">
                    <label className="form-label required">Waiver Reason</label>
                    <textarea
                      {...register('waiverReason', { required: 'Waiver reason is required' })}
                      className={`form-input ${errors.waiverReason ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={2}
                      placeholder="Enter reason for waiver"
                    />
                    {errors.waiverReason && <p className="form-error">{errors.waiverReason.message}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review & Complete Registration</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-gray-900">Patient Information</h3>
                    <div className="text-sm font-mono text-primary-600">{patientId}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient Type</p>
                      <p className="text-sm text-gray-900">
                        {patientType === 'new' ? 'New Patient' : 
                         patientType === 'existing' ? 'Existing Patient' : 
                         'Emergency Case'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <p className="text-sm text-gray-900">
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        {priority !== 'normal' && watch('priorityNotes') && (
                          <span className="block text-xs text-gray-500 mt-1">{watch('priorityNotes')}</span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-sm text-gray-900">{watch('firstName')} {watch('lastName')}</p>
                    </div>
                    
                    {patientType !== 'emergency' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Age</p>
                          <p className="text-sm text-gray-900">{watch('age')} years</p>
                        </div>
                        
                        {watch('dateOfBirth') && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                            <p className="text-sm text-gray-900">{watch('dateOfBirth')}</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Gender</p>
                          <p className="text-sm text-gray-900">{watch('gender')}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Contact Number</p>
                          <p className="text-sm text-gray-900">{watch('contactNumber')}</p>
                        </div>
                        
                        {watch('email') && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-sm text-gray-900">{watch('email')}</p>
                          </div>
                        )}
                        
                        <div className="sm:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{watch('address')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {patientType !== 'emergency' && showEmergencyContact && watch('emergencyContact.name') && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-base font-medium text-gray-900 mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="text-sm text-gray-900">{watch('emergencyContact.name')}</p>
                      </div>
                      
                      {watch('emergencyContact.relationship') && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Relationship</p>
                          <p className="text-sm text-gray-900">{watch('emergencyContact.relationship')}</p>
                        </div>
                      )}
                      
                      {watch('emergencyContact.phone') && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone Number</p>
                          <p className="text-sm text-gray-900">{watch('emergencyContact.phone')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-sm text-gray-900">
                        {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                      </p>
                    </div>
                    
                    {paymentMethod === 'nhif' && watch('nhifNumber') && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">NHIF Number</p>
                        <p className="text-sm text-gray-900">{watch('nhifNumber')}</p>
                      </div>
                    )}
                    
                    {paymentMethod === 'insurance' && (
                      <>
                        {watch('insuranceProvider') && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Insurance Provider</p>
                            <p className="text-sm text-gray-900">{watch('insuranceProvider')}</p>
                          </div>
                        )}
                        
                        {watch('insurancePolicyNumber') && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Policy Number</p>
                            <p className="text-sm text-gray-900">{watch('insurancePolicyNumber')}</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {paymentMethod === 'corporate' && watch('corporateName') && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Company Name</p>
                        <p className="text-sm text-gray-900">{watch('corporateName')}</p>
                      </div>
                    )}
                    
                    {paymentMethod === 'waiver' && watch('waiverReason') && (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-gray-500">Waiver Reason</p>
                        <p className="text-sm text-gray-900">{watch('waiverReason')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
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
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !patientType) ||
                (currentStep === 2 && patientType !== 'emergency' && (!watch('firstName') || !watch('lastName') || !watch('age')))
              }
              className="btn btn-primary flex items-center"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
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
                  Complete Registration
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