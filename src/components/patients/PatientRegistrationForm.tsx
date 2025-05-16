import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  UserPlus, 
  Save, 
  ArrowLeft, 
  AlertTriangle, 
  Search,
  CreditCard,
  Building2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileText
} from 'lucide-react';

interface PatientRegistrationFormData {
  firstName: string;
  lastName: string;
  age: number;
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
    currentMedications: string;
    bloodType: string;
    smoker: boolean;
    alcoholConsumption: string;
  };
  paymentInfo: {
    method: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    cardholderName?: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
  };
  priorityInfo: {
    conditionSeverity: string;
    visitPurpose: string;
    urgencyLevel: string;
    preferredDoctor?: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      age: 0,
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
        currentMedications: '',
        bloodType: '',
        smoker: false,
        alcoholConsumption: ''
      },
      paymentInfo: {
        method: 'cash'
      },
      priorityInfo: {
        conditionSeverity: 'mild',
        visitPurpose: 'consultation',
        urgencyLevel: 'low',
        preferredDoctor: ''
      }
    }
  });
  
  // Watch all form values for the review section
  const formValues = useWatch({ control });
  
  // Generate a patient ID
  useEffect(() => {
    generatePatientId();
  }, []);
  
  const generatePatientId = () => {
    const prefix = 'PT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setPatientId(`${prefix}${timestamp}${random}`);
  };
  
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      // In a real app, this would search the database
      // For now, we'll simulate a search with mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockResults = [
        {
          id: 'PT123456789',
          first_name: 'John',
          last_name: 'Doe',
          age: 45,
          gender: 'male',
          contact_number: '555-123-4567',
          email: 'john.doe@example.com',
          address: '123 Main St, Anytown, USA'
        },
        {
          id: 'PT987654321',
          first_name: 'Jane',
          last_name: 'Smith',
          age: 32,
          gender: 'female',
          contact_number: '555-987-6543',
          email: 'jane.smith@example.com',
          address: '456 Oak Ave, Somewhere, USA'
        }
      ];
      
      // Filter results based on search term
      const filteredResults = mockResults.filter(patient => 
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contact_number.includes(searchTerm) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching for patients:', error);
      addNotification({
        message: 'Error searching for patients',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const fillPatientData = (patient: any) => {
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('age', patient.age);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email);
    setValue('address', patient.address);
    
    // Close search results
    setShowSearchResults(false);
    
    addNotification({
      message: 'Patient data loaded successfully',
      type: 'success'
    });
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsLoading(true);
    
    try {
      // Convert age to date of birth (approximate)
      const today = new Date();
      const birthYear = today.getFullYear() - data.age;
      const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split('T')[0]; // January 1st of birth year
      
      // Format medical info
      const medicalHistory = {
        allergies: data.medicalInfo.allergies.filter(Boolean).map(allergy => ({
          allergen: allergy,
          reaction: 'Unknown',
          severity: 'Unknown'
        })),
        chronicConditions: data.medicalInfo.chronicConditions.filter(Boolean),
        currentMedications: data.medicalInfo.currentMedications ? 
          data.medicalInfo.currentMedications.split(',').map(med => ({ name: med.trim() })) : [],
        bloodType: data.medicalInfo.bloodType,
        smoker: data.medicalInfo.smoker,
        alcoholConsumption: data.medicalInfo.alcoholConsumption
      };
      
      // Create patient record
      const { data: patient, error } = await supabase
        .from('patients')
        .insert([
          {
            first_name: data.firstName,
            last_name: data.lastName,
            date_of_birth: dateOfBirth,
            gender: data.gender,
            contact_number: data.contactNumber,
            email: data.email || null,
            address: data.address,
            emergency_contact: data.emergencyContact,
            medical_history: medicalHistory,
            status: 'active',
            current_flow_step: 'registration'
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Navigate to the patient's detail page or back to the patient list
      navigate('/patients');
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error registering patient: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const nextStep = () => {
    setActiveStep(prev => Math.min(prev + 1, 5));
  };
  
  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <UserPlus className="h-5 w-5 text-primary-500 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">Patient Registration</h1>
        </div>
        <div className="text-sm text-gray-500">
          Patient ID: <span className="font-mono font-medium">{patientId}</span>
        </div>
      </div>
      
      {/* Returning Patient Search */}
      <div className="mb-4 bg-gray-50 p-3 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Returning Patient
        </div>
        <div className="text-xs text-gray-500 mb-2">
          Please search for the patient using their name, phone number, or ID before proceeding.
        </div>
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input py-1.5 text-sm w-full pr-10"
              placeholder="Search by name, phone, or ID..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchTerm || isSearching}
            className="btn btn-primary py-1.5 text-sm"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">
                Found {searchResults.length} matching patients
              </span>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="px-3 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => fillPatientData(patient)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {patient.id} • {patient.gender} • {patient.age} years
                      </div>
                    </div>
                    <button
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        fillPatientData(patient);
                      }}
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showSearchResults && searchResults.length === 0 && (
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
            <p className="text-sm text-gray-500">No matching patients found</p>
          </div>
        )}
      </div>
      
      {/* Progress Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  activeStep === step
                    ? 'bg-primary-500 text-white'
                    : activeStep > step
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {step}
              </div>
              <span className="mt-1 text-xs text-gray-500">
                {step === 1 && 'Personal'}
                {step === 2 && 'Medical'}
                {step === 3 && 'Payment'}
                {step === 4 && 'Priority'}
                {step === 5 && 'Review'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 h-1 bg-gray-200 rounded-full">
          <div 
            className="h-1 bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(activeStep - 1) * 25}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1: Personal Information */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label required text-sm">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input pl-9 py-1.5 text-sm ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                </div>
                {errors.firstName && <p className="form-error text-xs">{errors.firstName.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`form-input py-1.5 text-sm ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.lastName && <p className="form-error text-xs">{errors.lastName.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Age</label>
                <input
                  type="number"
                  {...register('age', { 
                    required: 'Age is required',
                    min: { value: 0, message: 'Age must be positive' },
                    max: { value: 120, message: 'Age must be less than 120' }
                  })}
                  className={`form-input py-1.5 text-sm ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.age && <p className="form-error text-xs">{errors.age.message}</p>}
              </div>
              
              <div>
                <label className="form-label required text-sm">Gender</label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`form-input py-1.5 text-sm ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="form-error text-xs">{errors.gender.message}</p>}
              </div>
            </div>
            
            <div>
              <label className="form-label required text-sm">Contact Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('contactNumber', { required: 'Contact number is required' })}
                  className={`form-input pl-9 py-1.5 text-sm ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="(555) 123-4567"
                />
              </div>
              {errors.contactNumber && <p className="form-error text-xs">{errors.contactNumber.message}</p>}
            </div>
            
            <div>
              <label className="form-label text-sm">Email Address</label>
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
                  className={`form-input pl-9 py-1.5 text-sm ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="patient@example.com"
                />
              </div>
              {errors.email && <p className="form-error text-xs">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="form-label required text-sm">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className={`form-input pl-9 py-1.5 text-sm ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={2}
                  placeholder="Street address, city, state, zip code"
                />
              </div>
              {errors.address && <p className="form-error text-xs">{errors.address.message}</p>}
            </div>
            
            {/* Emergency Contact (Collapsible) */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 px-3 py-2 flex justify-between items-center cursor-pointer"
                onClick={() => setShowEmergencyContact(!showEmergencyContact)}
              >
                <span className="text-sm font-medium text-gray-700">Emergency Contact (Optional)</span>
                {showEmergencyContact ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {showEmergencyContact && (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="form-label text-sm">Contact Name</label>
                    <input
                      type="text"
                      {...register('emergencyContact.name')}
                      className="form-input py-1.5 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="form-label text-sm">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship')}
                        className="form-input py-1.5 text-sm"
                        placeholder="Spouse, Parent, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Phone Number</label>
                      <input
                        type="tel"
                        {...register('emergencyContact.phone')}
                        className="form-input py-1.5 text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 2: Medical Information */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Medical Information</h2>
            
            <div>
              <label className="form-label text-sm">Allergies</label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allergy-penicillin"
                      {...register('medicalInfo.allergies')}
                      value="Penicillin"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allergy-penicillin" className="ml-2 text-xs text-gray-700">
                      Penicillin
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allergy-nsaids"
                      {...register('medicalInfo.allergies')}
                      value="NSAIDs"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allergy-nsaids" className="ml-2 text-xs text-gray-700">
                      NSAIDs
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allergy-latex"
                      {...register('medicalInfo.allergies')}
                      value="Latex"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allergy-latex" className="ml-2 text-xs text-gray-700">
                      Latex
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allergy-nuts"
                      {...register('medicalInfo.allergies')}
                      value="Nuts"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allergy-nuts" className="ml-2 text-xs text-gray-700">
                      Nuts
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Chronic Conditions</label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="condition-diabetes"
                      {...register('medicalInfo.chronicConditions')}
                      value="Diabetes"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="condition-diabetes" className="ml-2 text-xs text-gray-700">
                      Diabetes
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="condition-hypertension"
                      {...register('medicalInfo.chronicConditions')}
                      value="Hypertension"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="condition-hypertension" className="ml-2 text-xs text-gray-700">
                      Hypertension
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="condition-asthma"
                      {...register('medicalInfo.chronicConditions')}
                      value="Asthma"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="condition-asthma" className="ml-2 text-xs text-gray-700">
                      Asthma
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="condition-heart-disease"
                      {...register('medicalInfo.chronicConditions')}
                      value="Heart Disease"
                      className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="condition-heart-disease" className="ml-2 text-xs text-gray-700">
                      Heart Disease
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Current Medications</label>
              <textarea
                {...register('medicalInfo.currentMedications')}
                className="form-input py-1.5 text-sm"
                rows={2}
                placeholder="List medications separated by commas"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label text-sm">Blood Type</label>
                <select
                  {...register('medicalInfo.bloodType')}
                  className="form-input py-1.5 text-sm"
                >
                  <option value="">Select Blood Type</option>
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
                <label className="form-label text-sm">Alcohol Consumption</label>
                <select
                  {...register('medicalInfo.alcoholConsumption')}
                  className="form-input py-1.5 text-sm"
                >
                  <option value="">Select Option</option>
                  <option value="none">None</option>
                  <option value="occasional">Occasional</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smoker"
                  {...register('medicalInfo.smoker')}
                  className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="smoker" className="ml-2 text-sm text-gray-700">
                  Smoker
                </label>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Payment Information */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
            
            <div>
              <label className="form-label required text-sm">Payment Method</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-cash"
                    {...register('paymentInfo.method', { required: 'Payment method is required' })}
                    value="cash"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="payment-cash" className="ml-2 text-sm text-gray-700 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                    Cash
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-credit-card"
                    {...register('paymentInfo.method', { required: 'Payment method is required' })}
                    value="credit_card"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="payment-credit-card" className="ml-2 text-sm text-gray-700 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                    Credit Card
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-insurance"
                    {...register('paymentInfo.method', { required: 'Payment method is required' })}
                    value="insurance"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="payment-insurance" className="ml-2 text-sm text-gray-700 flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                    Insurance
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-mobile"
                    {...register('paymentInfo.method', { required: 'Payment method is required' })}
                    value="mobile_payment"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="payment-mobile" className="ml-2 text-sm text-gray-700 flex items-center">
                    <Smartphone className="h-4 w-4 mr-1 text-gray-400" />
                    Mobile Payment
                  </label>
                </div>
              </div>
              {errors.paymentInfo?.method && <p className="form-error text-xs">{errors.paymentInfo.method.message}</p>}
            </div>
            
            {/* Conditional fields based on payment method */}
            {watch('paymentInfo.method') === 'credit_card' && (
              <div className="space-y-3 border-t border-gray-200 pt-3">
                <div>
                  <label className="form-label required text-sm">Cardholder Name</label>
                  <input
                    type="text"
                    {...register('paymentInfo.cardholderName', { 
                      required: 'Cardholder name is required' 
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>
                
                <div>
                  <label className="form-label required text-sm">Card Number</label>
                  <input
                    type="text"
                    {...register('paymentInfo.cardNumber', { 
                      required: 'Card number is required',
                      pattern: {
                        value: /^[0-9]{16}$/,
                        message: 'Please enter a valid 16-digit card number'
                      }
                    })}
                    className="form-input py-1.5 text-sm"
                    placeholder="XXXX XXXX XXXX XXXX"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label required text-sm">Expiry Date</label>
                    <input
                      type="text"
                      {...register('paymentInfo.expiryDate', { 
                        required: 'Expiry date is required',
                        pattern: {
                          value: /^(0[1-9]|1[0-2])\/[0-9]{2}$/,
                          message: 'Please enter a valid expiry date (MM/YY)'
                        }
                      })}
                      className="form-input py-1.5 text-sm"
                      placeholder="MM/YY"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label required text-sm">CVV</label>
                    <input
                      type="text"
                      {...register('paymentInfo.cvv', { 
                        required: 'CVV is required',
                        pattern: {
                          value: /^[0-9]{3,4}$/,
                          message: 'Please enter a valid CVV'
                        }
                      })}
                      className="form-input py-1.5 text-sm"
                      placeholder="XXX"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {watch('paymentInfo.method') === 'insurance' && (
              <div className="space-y-3 border-t border-gray-200 pt-3">
                <div>
                  <label className="form-label required text-sm">Insurance Provider</label>
                  <input
                    type="text"
                    {...register('paymentInfo.insuranceProvider', { 
                      required: 'Insurance provider is required' 
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>
                
                <div>
                  <label className="form-label required text-sm">Policy Number</label>
                  <input
                    type="text"
                    {...register('paymentInfo.insurancePolicyNumber', { 
                      required: 'Policy number is required' 
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 4: Priority Information */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Priority Information</h2>
            
            <div>
              <label className="form-label required text-sm">Condition Severity</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="severity-mild"
                    {...register('priorityInfo.conditionSeverity', { required: 'Condition severity is required' })}
                    value="mild"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="severity-mild" className="ml-2 text-sm text-gray-700">
                    Mild
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="severity-moderate"
                    {...register('priorityInfo.conditionSeverity', { required: 'Condition severity is required' })}
                    value="moderate"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="severity-moderate" className="ml-2 text-sm text-gray-700">
                    Moderate
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="severity-severe"
                    {...register('priorityInfo.conditionSeverity', { required: 'Condition severity is required' })}
                    value="severe"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="severity-severe" className="ml-2 text-sm text-gray-700">
                    Severe
                  </label>
                </div>
              </div>
              {errors.priorityInfo?.conditionSeverity && <p className="form-error text-xs">{errors.priorityInfo.conditionSeverity.message}</p>}
            </div>
            
            <div>
              <label className="form-label required text-sm">Visit Purpose</label>
              <select
                {...register('priorityInfo.visitPurpose', { required: 'Visit purpose is required' })}
                className="form-input py-1.5 text-sm"
              >
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="procedure">Procedure</option>
                <option value="vaccination">Vaccination</option>
                <option value="lab_test">Lab Test</option>
              </select>
              {errors.priorityInfo?.visitPurpose && <p className="form-error text-xs">{errors.priorityInfo.visitPurpose.message}</p>}
            </div>
            
            <div>
              <label className="form-label required text-sm">Urgency Level</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="urgency-low"
                    {...register('priorityInfo.urgencyLevel', { required: 'Urgency level is required' })}
                    value="low"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="urgency-low" className="ml-2 text-sm text-gray-700">
                    Low
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="urgency-medium"
                    {...register('priorityInfo.urgencyLevel', { required: 'Urgency level is required' })}
                    value="medium"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="urgency-medium" className="ml-2 text-sm text-gray-700">
                    Medium
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="urgency-high"
                    {...register('priorityInfo.urgencyLevel', { required: 'Urgency level is required' })}
                    value="high"
                    className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="urgency-high" className="ml-2 text-sm text-gray-700">
                    High
                  </label>
                </div>
              </div>
              {errors.priorityInfo?.urgencyLevel && <p className="form-error text-xs">{errors.priorityInfo.urgencyLevel.message}</p>}
            </div>
            
            <div>
              <label className="form-label text-sm">Preferred Doctor (Optional)</label>
              <select
                {...register('priorityInfo.preferredDoctor')}
                className="form-input py-1.5 text-sm"
              >
                <option value="">No Preference</option>
                <option value="dr_smith">Dr. Smith</option>
                <option value="dr_johnson">Dr. Johnson</option>
                <option value="dr_williams">Dr. Williams</option>
                <option value="dr_brown">Dr. Brown</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Step 5: Review */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Review Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Personal Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Personal Information</h3>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name:</span>
                    <span className="text-xs text-gray-900">{formValues.firstName} {formValues.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Age:</span>
                    <span className="text-xs text-gray-900">{formValues.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Gender:</span>
                    <span className="text-xs text-gray-900">{formValues.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Contact:</span>
                    <span className="text-xs text-gray-900">{formValues.contactNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Email:</span>
                    <span className="text-xs text-gray-900">{formValues.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Address:</span>
                    <span className="text-xs text-gray-900 text-right max-w-[200px] break-words">{formValues.address}</span>
                  </div>
                </div>
              </div>
              
              {/* Medical Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Medical Information</h3>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Allergies:</span>
                    <span className="text-xs text-gray-900 text-right">
                      {formValues.medicalInfo?.allergies?.length ? 
                        formValues.medicalInfo.allergies.join(', ') : 
                        'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Chronic Conditions:</span>
                    <span className="text-xs text-gray-900 text-right">
                      {formValues.medicalInfo?.chronicConditions?.length ? 
                        formValues.medicalInfo.chronicConditions.join(', ') : 
                        'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Medications:</span>
                    <span className="text-xs text-gray-900 text-right max-w-[200px] break-words">
                      {formValues.medicalInfo?.currentMedications || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Blood Type:</span>
                    <span className="text-xs text-gray-900">{formValues.medicalInfo?.bloodType || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Smoker:</span>
                    <span className="text-xs text-gray-900">{formValues.medicalInfo?.smoker ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Payment Information</h3>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Method:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.paymentInfo?.method === 'cash' && 'Cash'}
                      {formValues.paymentInfo?.method === 'credit_card' && 'Credit Card'}
                      {formValues.paymentInfo?.method === 'insurance' && 'Insurance'}
                      {formValues.paymentInfo?.method === 'mobile_payment' && 'Mobile Payment'}
                    </span>
                  </div>
                  
                  {formValues.paymentInfo?.method === 'credit_card' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Cardholder:</span>
                        <span className="text-xs text-gray-900">{formValues.paymentInfo?.cardholderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Card Number:</span>
                        <span className="text-xs text-gray-900">
                          {formValues.paymentInfo?.cardNumber ? 
                            `XXXX-XXXX-XXXX-${formValues.paymentInfo.cardNumber.slice(-4)}` : 
                            'Not provided'}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {formValues.paymentInfo?.method === 'insurance' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Provider:</span>
                        <span className="text-xs text-gray-900">{formValues.paymentInfo?.insuranceProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Policy Number:</span>
                        <span className="text-xs text-gray-900">{formValues.paymentInfo?.insurancePolicyNumber}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Priority Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Priority Information</h3>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Severity:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.priorityInfo?.conditionSeverity?.charAt(0).toUpperCase() + 
                        formValues.priorityInfo?.conditionSeverity?.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Visit Purpose:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.priorityInfo?.visitPurpose?.replace('_', ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Urgency Level:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.priorityInfo?.urgencyLevel?.charAt(0).toUpperCase() + 
                        formValues.priorityInfo?.urgencyLevel?.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Preferred Doctor:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.priorityInfo?.preferredDoctor ? 
                        formValues.priorityInfo.preferredDoctor
                          .replace('dr_', 'Dr. ')
                          .replace(/\b\w/g, l => l.toUpperCase()) : 
                        'No preference'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Emergency Contact Review (if provided) */}
            {(formValues.emergencyContact?.name || formValues.emergencyContact?.phone) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Emergency Contact</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep(1);
                      setShowEmergencyContact(true);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name:</span>
                    <span className="text-xs text-gray-900">{formValues.emergencyContact?.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Relationship:</span>
                    <span className="text-xs text-gray-900">{formValues.emergencyContact?.relationship || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Phone:</span>
                    <span className="text-xs text-gray-900">{formValues.emergencyContact?.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Please review all information</p>
                <p className="text-xs text-blue-600 mt-1">
                  Ensure all details are correct before completing the registration. Click the "Edit" button in any section to make changes.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2 border-t border-gray-200">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline py-1.5 text-sm flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn btn-outline py-1.5 text-sm"
            >
              Cancel
            </button>
          )}
          
          {activeStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary py-1.5 text-sm"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary py-1.5 text-sm flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
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