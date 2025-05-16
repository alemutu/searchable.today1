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
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Search,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign
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
    allergies: {
      hasAllergies: boolean;
      allergyList: string;
    };
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
    preferredDoctor: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  
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
        allergies: {
          hasAllergies: false,
          allergyList: ''
        },
        chronicConditions: [],
        currentMedications: '',
        bloodType: '',
        smoker: false,
        alcoholConsumption: 'none'
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
  
  // Watch for form values to use in the review step
  const formValues = useWatch({ control });
  
  // Generate a patient ID
  useEffect(() => {
    generatePatientId();
  }, []);
  
  const generatePatientId = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setPatientId(`PT${timestamp}${random}`);
  };
  
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    try {
      // In a real app, this would search the database
      // For now, we'll just simulate a search
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      if (searchTerm.toLowerCase().includes('john')) {
        setSearchResults([
          {
            id: 'PT123456789',
            firstName: 'John',
            lastName: 'Doe',
            age: 45,
            gender: 'Male',
            contactNumber: '555-1234',
            email: 'john.doe@example.com'
          }
        ]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for patients:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectExistingPatient = (patient: any) => {
    // Fill the form with the selected patient's data
    setValue('firstName', patient.firstName);
    setValue('lastName', patient.lastName);
    setValue('age', patient.age);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contactNumber);
    setValue('email', patient.email);
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
    
    // Show notification
    addNotification({
      message: `Patient ${patient.firstName} ${patient.lastName} selected`,
      type: 'success'
    });
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsLoading(true);
    
    try {
      // Calculate date of birth from age
      const today = new Date();
      const birthYear = today.getFullYear() - data.age;
      const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split('T')[0]; // January 1st of birth year
      
      // Format medical history
      const medicalHistory = {
        allergies: data.medicalInfo.allergies.hasAllergies ? 
          data.medicalInfo.allergies.allergyList.split(',').map(a => ({ allergen: a.trim(), reaction: '', severity: 'unknown' })) : 
          [],
        chronicConditions: data.medicalInfo.chronicConditions || [],
        currentMedications: data.medicalInfo.currentMedications ? 
          data.medicalInfo.currentMedications.split(',').map(m => ({ name: m.trim(), dosage: '', frequency: '' })) : 
          [],
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
            email: data.email,
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
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Navigate to patient details page
      navigate(`/patients/${patient.id}`);
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
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Patient Registration</h1>
      
      {/* Patient ID */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Patient ID</p>
          <p className="text-lg font-mono font-medium text-primary-600">{patientId}</p>
        </div>
        <div className="text-xs text-gray-500">Auto-generated</div>
      </div>
      
      {/* Returning Patient Search */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <h2 className="text-sm font-medium text-blue-800 mb-2">Returning Patient</h2>
        <p className="text-xs text-blue-700 mb-2">Please search for the patient using their name, phone number, or ID before proceeding.</p>
        
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 py-1.5 text-sm w-full"
              placeholder="Search by name, phone, or ID..."
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchTerm}
            className="btn btn-primary py-1.5 text-sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">Contact</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-blue-800">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-200">
                {searchResults.map((patient) => (
                  <tr key={patient.id} className="hover:bg-blue-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{patient.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{patient.contactNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectExistingPatient(patient)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
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
          <p className="mt-2 text-xs text-blue-700">No matching patients found. Please proceed with registration.</p>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h2>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label text-sm required">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input pl-9 py-1.5 text-sm ${errors.firstName ? 'border-error-300' : ''}`}
                  />
                </div>
                {errors.firstName && <p className="form-error text-xs">{errors.firstName.message}</p>}
              </div>
              
              <div>
                <label className="form-label text-sm required">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`form-input py-1.5 text-sm ${errors.lastName ? 'border-error-300' : ''}`}
                />
                {errors.lastName && <p className="form-error text-xs">{errors.lastName.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label text-sm required">Age</label>
                <input
                  type="number"
                  {...register('age', { 
                    required: 'Age is required',
                    min: { value: 0, message: 'Age must be positive' },
                    max: { value: 120, message: 'Age must be less than 120' }
                  })}
                  className={`form-input py-1.5 text-sm ${errors.age ? 'border-error-300' : ''}`}
                />
                {errors.age && <p className="form-error text-xs">{errors.age.message}</p>}
              </div>
              
              <div>
                <label className="form-label text-sm required">Gender</label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`form-input py-1.5 text-sm ${errors.gender ? 'border-error-300' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="form-error text-xs">{errors.gender.message}</p>}
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm required">Contact Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('contactNumber', { required: 'Contact number is required' })}
                  className={`form-input pl-9 py-1.5 text-sm ${errors.contactNumber ? 'border-error-300' : ''}`}
                  placeholder="e.g., +1 (555) 123-4567"
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
                  {...register('email')}
                  className="form-input pl-9 py-1.5 text-sm"
                  placeholder="e.g., patient@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm required">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className={`form-input pl-9 py-1.5 text-sm ${errors.address ? 'border-error-300' : ''}`}
                  rows={2}
                  placeholder="Enter full address"
                />
              </div>
              {errors.address && <p className="form-error text-xs">{errors.address.message}</p>}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                  className="flex items-center text-sm font-medium text-gray-700"
                >
                  Emergency Contact (Optional)
                  {showEmergencyContact ? (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </button>
              </div>
              
              {showEmergencyContact && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="form-label text-sm">Name</label>
                    <input
                      type="text"
                      {...register('emergencyContact.name')}
                      className="form-input py-1.5 text-sm"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="form-label text-sm">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContact.relationship')}
                        className="form-input py-1.5 text-sm"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Phone Number</label>
                      <input
                        type="tel"
                        {...register('emergencyContact.phone')}
                        className="form-input py-1.5 text-sm"
                        placeholder="e.g., +1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary py-1.5 text-sm"
              >
                Next: Medical Information
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Medical Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Medical Information</h2>
            
            <div>
              <div className="flex items-center mb-2">
                <label className="form-label text-sm mb-0">Allergies</label>
              </div>
              
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasAllergies"
                  {...register('medicalInfo.allergies.hasAllergies')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasAllergies" className="ml-2 block text-sm text-gray-700">
                  Patient has allergies
                </label>
              </div>
              
              {watch('medicalInfo.allergies.hasAllergies') && (
                <div>
                  <textarea
                    {...register('medicalInfo.allergies.allergyList')}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="List allergies, separated by commas (e.g., Penicillin, Peanuts, Latex)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please list all known allergies, including medications, foods, and environmental factors.
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label className="form-label text-sm">Chronic Conditions</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="diabetes"
                    value="Diabetes"
                    {...register('medicalInfo.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="diabetes" className="ml-2 block text-sm text-gray-700">
                    Diabetes
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hypertension"
                    value="Hypertension"
                    {...register('medicalInfo.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hypertension" className="ml-2 block text-sm text-gray-700">
                    Hypertension
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="asthma"
                    value="Asthma"
                    {...register('medicalInfo.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="asthma" className="ml-2 block text-sm text-gray-700">
                    Asthma
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="heartDisease"
                    value="Heart Disease"
                    {...register('medicalInfo.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="heartDisease" className="ml-2 block text-sm text-gray-700">
                    Heart Disease
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cancer"
                    value="Cancer"
                    {...register('medicalInfo.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cancer" className="ml-2 block text-sm text-gray-700">
                    Cancer
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="arthritis"
                    value="Arthritis"
                    {...register('medicalInfo.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="arthritis" className="ml-2 block text-sm text-gray-700">
                    Arthritis
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Current Medications</label>
              <textarea
                {...register('medicalInfo.currentMedications')}
                className="form-input py-1.5 text-sm"
                rows={2}
                placeholder="List current medications, separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include dosage if known (e.g., Lisinopril 10mg, Metformin 500mg)
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label text-sm">Blood Type</label>
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
                <label className="form-label text-sm">Alcohol Consumption</label>
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
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smoker"
                {...register('medicalInfo.smoker')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="smoker" className="ml-2 block text-sm text-gray-700">
                Patient is a smoker
              </label>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline py-1.5 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary py-1.5 text-sm"
              >
                Next: Payment Information
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Payment Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h2>
            
            <div>
              <label className="form-label text-sm required">Payment Method</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cash"
                    value="cash"
                    {...register('paymentInfo.method', { required: true })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="cash" className="ml-2 block text-sm text-gray-700">
                    <DollarSign className="h-4 w-4 inline mr-1 text-gray-500" />
                    Cash
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="creditCard"
                    value="credit_card"
                    {...register('paymentInfo.method', { required: true })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="creditCard" className="ml-2 block text-sm text-gray-700">
                    <CreditCard className="h-4 w-4 inline mr-1 text-gray-500" />
                    Credit Card
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="insurance"
                    value="insurance"
                    {...register('paymentInfo.method', { required: true })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="insurance" className="ml-2 block text-sm text-gray-700">
                    <Building2 className="h-4 w-4 inline mr-1 text-gray-500" />
                    Insurance
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="mobilePayment"
                    value="mobile_payment"
                    {...register('paymentInfo.method', { required: true })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="mobilePayment" className="ml-2 block text-sm text-gray-700">
                    <Smartphone className="h-4 w-4 inline mr-1 text-gray-500" />
                    Mobile Payment
                  </label>
                </div>
              </div>
            </div>
            
            {/* Credit Card Details */}
            {watch('paymentInfo.method') === 'credit_card' && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="form-label text-sm required">Cardholder Name</label>
                  <input
                    type="text"
                    {...register('paymentInfo.cardholderName', { 
                      required: watch('paymentInfo.method') === 'credit_card' ? 'Cardholder name is required' : false 
                    })}
                    className="form-input py-1.5 text-sm"
                    placeholder="Name as it appears on card"
                  />
                </div>
                
                <div>
                  <label className="form-label text-sm required">Card Number</label>
                  <input
                    type="text"
                    {...register('paymentInfo.cardNumber', { 
                      required: watch('paymentInfo.method') === 'credit_card' ? 'Card number is required' : false 
                    })}
                    className="form-input py-1.5 text-sm"
                    placeholder="XXXX XXXX XXXX XXXX"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-sm required">Expiry Date</label>
                    <input
                      type="text"
                      {...register('paymentInfo.expiryDate', { 
                        required: watch('paymentInfo.method') === 'credit_card' ? 'Expiry date is required' : false 
                      })}
                      className="form-input py-1.5 text-sm"
                      placeholder="MM/YY"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm required">CVV</label>
                    <input
                      type="text"
                      {...register('paymentInfo.cvv', { 
                        required: watch('paymentInfo.method') === 'credit_card' ? 'CVV is required' : false 
                      })}
                      className="form-input py-1.5 text-sm"
                      placeholder="XXX"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Insurance Details */}
            {watch('paymentInfo.method') === 'insurance' && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="form-label text-sm required">Insurance Provider</label>
                  <input
                    type="text"
                    {...register('paymentInfo.insuranceProvider', { 
                      required: watch('paymentInfo.method') === 'insurance' ? 'Insurance provider is required' : false 
                    })}
                    className="form-input py-1.5 text-sm"
                    placeholder="e.g., Blue Cross, Aetna"
                  />
                </div>
                
                <div>
                  <label className="form-label text-sm required">Policy Number</label>
                  <input
                    type="text"
                    {...register('paymentInfo.insurancePolicyNumber', { 
                      required: watch('paymentInfo.method') === 'insurance' ? 'Policy number is required' : false 
                    })}
                    className="form-input py-1.5 text-sm"
                    placeholder="Enter policy number"
                  />
                </div>
              </div>
            )}
            
            {/* Priority Information */}
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Priority Information</h2>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label text-sm required">Condition Severity</label>
                  <select
                    {...register('priorityInfo.conditionSeverity', { required: true })}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label text-sm required">Visit Purpose</label>
                  <select
                    {...register('priorityInfo.visitPurpose', { required: true })}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="routine_checkup">Routine Checkup</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="procedure">Procedure</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="form-label text-sm required">Urgency Level</label>
                  <select
                    {...register('priorityInfo.urgencyLevel', { required: true })}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label text-sm">Preferred Doctor</label>
                  <select
                    {...register('priorityInfo.preferredDoctor')}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="">No preference</option>
                    <option value="dr_smith">Dr. Smith</option>
                    <option value="dr_johnson">Dr. Johnson</option>
                    <option value="dr_williams">Dr. Williams</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline py-1.5 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary py-1.5 text-sm"
              >
                Review Information
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Review Information</h2>
            
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Basic Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name:</span>
                    <span className="text-xs text-gray-900 font-medium">
                      {formValues.firstName} {formValues.lastName}
                    </span>
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
                    <span className="text-xs text-gray-900 text-right max-w-[200px]">{formValues.address}</span>
                  </div>
                </div>
                
                {formValues.emergencyContact?.name && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <h4 className="text-xs font-medium text-gray-900 mb-1">Emergency Contact</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Name:</span>
                        <span className="text-xs text-gray-900">{formValues.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Relationship:</span>
                        <span className="text-xs text-gray-900">{formValues.emergencyContact.relationship}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Phone:</span>
                        <span className="text-xs text-gray-900">{formValues.emergencyContact.phone}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Medical Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Medical Information</h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-gray-500">Allergies:</span>
                    <span className="text-xs text-gray-900 ml-1">
                      {formValues.medicalInfo?.allergies?.hasAllergies 
                        ? formValues.medicalInfo.allergies.allergyList || 'Yes (not specified)' 
                        : 'None reported'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-500">Chronic Conditions:</span>
                    <span className="text-xs text-gray-900 ml-1">
                      {formValues.medicalInfo?.chronicConditions?.length 
                        ? formValues.medicalInfo.chronicConditions.join(', ') 
                        : 'None reported'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-500">Current Medications:</span>
                    <span className="text-xs text-gray-900 ml-1">
                      {formValues.medicalInfo?.currentMedications || 'None reported'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Blood Type:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.medicalInfo?.bloodType || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Smoker:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.medicalInfo?.smoker ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Alcohol Consumption:</span>
                    <span className="text-xs text-gray-900">
                      {formValues.medicalInfo?.alcoholConsumption?.charAt(0).toUpperCase() + 
                       formValues.medicalInfo?.alcoholConsumption?.slice(1) || 'None'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Payment Information Review */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Payment Information</h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Payment Method:</span>
                    <span className="text-xs text-gray-900 font-medium">
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
                        <span className="text-xs text-gray-900">{formValues.paymentInfo.cardholderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Card Number:</span>
                        <span className="text-xs text-gray-900">
                          {formValues.paymentInfo.cardNumber ? 
                            '****' + formValues.paymentInfo.cardNumber.slice(-4) : 
                            'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Expiry Date:</span>
                        <span className="text-xs text-gray-900">{formValues.paymentInfo.expiryDate}</span>
                      </div>
                    </>
                  )}
                  
                  {formValues.paymentInfo?.method === 'insurance' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Provider:</span>
                        <span className="text-xs text-gray-900">{formValues.paymentInfo.insuranceProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Policy Number:</span>
                        <span className="text-xs text-gray-900">{formValues.paymentInfo.insurancePolicyNumber}</span>
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
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Condition Severity:</span>
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
            
            <div className="bg-blue-50 p-3 rounded-lg flex items-start mt-4">
              <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Please verify all information</p>
                <p className="text-xs text-blue-700 mt-1">
                  By submitting this form, you confirm that all the information provided is accurate to the best of your knowledge.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline py-1.5 text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary py-1.5 text-sm"
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientRegistrationForm;