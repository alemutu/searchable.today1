import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Check,
  X,
  CreditCard,
  Smartphone,
  Building2,
  FileText,
  DollarSign
} from 'lucide-react';

interface PatientFormData {
  patientType: 'new' | 'returning' | 'emergency';
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
  conditionSeverity: string;
  visitPurpose: string;
  urgencyLevel: string;
  preferredDoctor: string;
  paymentMethod: string;
  mpesa: {
    transactionCode: string;
    phoneNumber: string;
    amount: string;
    paymentDate: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coveragePercentage: string;
  };
  creditCard: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  };
  cash: {
    amountTendered: string;
    receiptNumber: string;
  };
  invoice: {
    invoiceNumber: string;
    dueDate: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use the hybrid storage hook for patients
  const { 
    data: patients, 
    saveItem: savePatient, 
    fetchItems: fetchPatients,
    loading: isLoadingPatients
  } = useHybridStorage<any>('patients');

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      age: 0,
      gender: 'male',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      conditionSeverity: 'mild',
      visitPurpose: 'consultation',
      urgencyLevel: 'low',
      preferredDoctor: '',
      paymentMethod: 'cash',
      mpesa: {
        transactionCode: '',
        phoneNumber: '',
        amount: '',
        paymentDate: ''
      },
      insurance: {
        provider: '',
        policyNumber: '',
        expiryDate: '',
        coveragePercentage: ''
      },
      creditCard: {
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: ''
      },
      cash: {
        amountTendered: '',
        receiptNumber: ''
      },
      invoice: {
        invoiceNumber: '',
        dueDate: ''
      }
    }
  });

  const patientType = watch('patientType');
  const paymentMethod = watch('paymentMethod');

  // Generate a patient ID when the component mounts
  useEffect(() => {
    generatePatientId();
  }, []);

  // Generate a unique patient ID
  const generatePatientId = () => {
    const prefix = 'PT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setPatientId(`${prefix}${timestamp}${random}`);
  };

  // Search for returning patients
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      await fetchPatients();
      
      if (Array.isArray(patients)) {
        const results = patients.filter(patient => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          return fullName.includes(searchQuery.toLowerCase()) || 
                 (patient.contact_number && patient.contact_number.includes(searchQuery)) ||
                 (patient.id && patient.id.includes(searchQuery));
        });
        
        setSearchResults(results);
      }
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

  // Select a returning patient
  const selectPatient = (patient: any) => {
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('age', calculateAge(patient.date_of_birth));
    setValue('gender', patient.gender.toLowerCase());
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    
    if (patient.emergency_contact) {
      setValue('emergencyContact.name', patient.emergency_contact.name);
      setValue('emergencyContact.relationship', patient.emergency_contact.relationship);
      setValue('emergencyContact.phone', patient.emergency_contact.phone);
      setShowEmergencyContact(true);
    }
    
    setSearchResults([]);
    setSearchQuery('');
    addNotification({
      message: `Patient ${patient.first_name} ${patient.last_name} found and loaded`,
      type: 'success'
    });
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Calculate approximate date of birth from age
  const calculateDateOfBirth = (age: number) => {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  };

  // Handle form submission
  const onSubmit = async (data: PatientFormData) => {
    try {
      // Create a patient object from form data
      const patientData = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: calculateDateOfBirth(data.age),
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email,
        address: data.address,
        emergency_contact: showEmergencyContact ? data.emergencyContact : null,
        medical_info: {
          condition_severity: data.conditionSeverity,
          visit_purpose: data.visitPurpose,
          urgency_level: data.urgencyLevel,
          preferred_doctor: data.preferredDoctor
        },
        payment_info: {
          method: data.paymentMethod,
          details: data.paymentMethod === 'mpesa' ? data.mpesa :
                  data.paymentMethod === 'insurance' ? data.insurance :
                  data.paymentMethod === 'credit_card' ? data.creditCard :
                  data.paymentMethod === 'cash' ? data.cash :
                  data.paymentMethod === 'invoice' ? data.invoice : null
        },
        status: 'active',
        current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration',
        created_at: new Date().toISOString()
      };

      // Save the patient
      await savePatient(patientData);

      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });

      // Navigate to the appropriate page based on patient type
      if (data.patientType === 'emergency') {
        navigate(`/patients/${patientId}/triage`);
      } else {
        navigate('/patients');
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error registering patient: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Handle next step
  const handleNextStep = () => {
    // For emergency cases, skip to review
    if (patientType === 'emergency' && currentStep === 1) {
      setCurrentStep(6);
      return;
    }
    
    setCurrentStep(currentStep + 1);
  };

  // Handle previous step
  const handlePrevStep = () => {
    // For emergency cases, go back to step 1 from review
    if (patientType === 'emergency' && currentStep === 6) {
      setCurrentStep(1);
      return;
    }
    
    setCurrentStep(currentStep - 1);
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: 'Patient Type' },
      { number: 2, label: 'Personal Info' },
      { number: 3, label: 'Contact' },
      { number: 4, label: 'Priority' },
      { number: 5, label: 'Payment' },
      { number: 6, label: 'Review' }
    ];

    return (
      <div className="flex justify-between mb-8">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === step.number 
                  ? 'bg-primary-500 text-white' 
                  : currentStep > step.number 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
            </div>
            <span className="mt-2 text-xs text-gray-500">{step.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white bg-primary-500 p-4 rounded-t-lg">Patient Registration</h1>
        <p className="text-gray-600 bg-primary-50 p-4 rounded-b-lg border-b border-x border-primary-100">
          Register a new, existing, or emergency patient using this form.
        </p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Patient Type */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Patient Type</h2>
            
            {/* Returning Patient Search */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-md font-medium text-blue-800 mb-2">Returning Patient?</h3>
              <p className="text-sm text-blue-600 mb-3">
                Please search for the patient using their name, phone number, or ID before proceeding.
              </p>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input pl-10 w-full"
                    placeholder="Search by name, phone number, or ID"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="btn btn-primary"
                >
                  {isSearching ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                    Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  <div className="divide-y divide-blue-200 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div 
                        key={patient.id} 
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => selectPatient(patient)}
                      >
                        <div>
                          <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                          <div className="text-sm text-gray-500">
                            {calculateAge(patient.date_of_birth)} years • {patient.gender} • {patient.contact_number}
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-600">No matching patients found</p>
                  <p className="text-sm text-gray-500 mt-1">Please proceed with registration as a new patient</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="radio"
                  id="patientTypeNew"
                  value="new"
                  className="sr-only"
                  {...register('patientType')}
                />
                <label
                  htmlFor="patientTypeNew"
                  className={`block p-4 border rounded-lg cursor-pointer ${
                    patientType === 'new' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      patientType === 'new' ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {patientType === 'new' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <span className="ml-2 font-medium">New Patient</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">First-time visit to our facility. Complete registration required.</p>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id="patientTypeReturning"
                  value="returning"
                  className="sr-only"
                  {...register('patientType')}
                />
                <label
                  htmlFor="patientTypeReturning"
                  className={`block p-4 border rounded-lg cursor-pointer ${
                    patientType === 'returning' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      patientType === 'returning' ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {patientType === 'returning' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <span className="ml-2 font-medium">Returning Patient</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Previous patient returning for care. Verification required.</p>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id="patientTypeEmergency"
                  value="emergency"
                  className="sr-only"
                  {...register('patientType')}
                />
                <label
                  htmlFor="patientTypeEmergency"
                  className={`block p-4 border rounded-lg cursor-pointer ${
                    patientType === 'emergency' ? 'border-error-500 bg-error-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      patientType === 'emergency' ? 'border-error-500' : 'border-gray-300'
                    }`}>
                      {patientType === 'emergency' && (
                        <div className="w-3 h-3 rounded-full bg-error-500"></div>
                      )}
                    </div>
                    <span className="ml-2 font-medium">Emergency</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Urgent care needed. Minimal information required.</p>
                </label>
              </div>
            </div>

            {patientType === 'emergency' && (
              <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-error-800 font-medium">Emergency Registration</h3>
                    <p className="text-error-600 text-sm mt-1">
                      For emergency cases, only the patient's name is required. All other fields will be skipped.
                      Payment will be handled later.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            
            {/* Display Patient ID */}
            <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-primary-800 font-medium">Patient ID</h3>
                  <p className="text-primary-600 text-sm mt-1">
                    This unique identifier will be used for all patient records
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-md border border-primary-200">
                  <span className="font-mono text-lg font-bold text-primary-700">{patientId}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label required">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className={`form-input pl-10 ${errors.firstName ? 'border-error-300' : ''}`}
                    placeholder="First name"
                    {...register('firstName', { required: 'First name is required' })}
                  />
                </div>
                {errors.firstName && <p className="text-error-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="form-label required">Last Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.lastName ? 'border-error-300' : ''}`}
                  placeholder="Last name"
                  {...register('lastName', { required: 'Last name is required' })}
                />
                {errors.lastName && <p className="text-error-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="form-label required">Age</label>
                <input
                  type="number"
                  className={`form-input ${errors.age ? 'border-error-300' : ''}`}
                  placeholder="Age in years"
                  min="0"
                  max="120"
                  {...register('age', { 
                    required: 'Age is required',
                    min: { value: 0, message: 'Age must be at least 0' },
                    max: { value: 120, message: 'Age must be less than 120' },
                    valueAsNumber: true
                  })}
                />
                {errors.age && <p className="text-error-500 text-sm mt-1">{errors.age.message}</p>}
              </div>

              <div>
                <label className="form-label required">Gender</label>
                <select
                  className={`form-input ${errors.gender ? 'border-error-300' : ''}`}
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-error-500 text-sm mt-1">{errors.gender.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="form-label required">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300' : ''}`}
                    placeholder="Phone number"
                    {...register('contactNumber', { required: 'Phone number is required' })}
                  />
                </div>
                {errors.contactNumber && <p className="text-error-500 text-sm mt-1">{errors.contactNumber.message}</p>}
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="form-input pl-10"
                    placeholder="Email address (optional)"
                    {...register('email')}
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
                    className={`form-input pl-10 ${errors.address ? 'border-error-300' : ''}`}
                    placeholder="Full address"
                    rows={3}
                    {...register('address', { required: 'Address is required' })}
                  ></textarea>
                </div>
                {errors.address && <p className="text-error-500 text-sm mt-1">{errors.address.message}</p>}
              </div>

              {/* Emergency Contact (Collapsible) */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                >
                  <h3 className="text-lg font-medium text-gray-900">Emergency Contact (Optional)</h3>
                  {showEmergencyContact ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {showEmergencyContact && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="form-label">Contact Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Emergency contact name"
                        {...register('emergencyContact.name')}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Relationship</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Relationship to patient"
                          {...register('emergencyContact.relationship')}
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Emergency contact phone"
                          {...register('emergencyContact.phone')}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Priority Information */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Priority Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="form-label required">Condition Severity</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      id="severityMild"
                      value="mild"
                      className="sr-only"
                      {...register('conditionSeverity')}
                    />
                    <label
                      htmlFor="severityMild"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        watch('conditionSeverity') === 'mild' ? 'border-success-500 bg-success-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          watch('conditionSeverity') === 'mild' ? 'border-success-500' : 'border-gray-300'
                        }`}>
                          {watch('conditionSeverity') === 'mild' && (
                            <div className="w-2 h-2 rounded-full bg-success-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Mild</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="severityModerate"
                      value="moderate"
                      className="sr-only"
                      {...register('conditionSeverity')}
                    />
                    <label
                      htmlFor="severityModerate"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        watch('conditionSeverity') === 'moderate' ? 'border-warning-500 bg-warning-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          watch('conditionSeverity') === 'moderate' ? 'border-warning-500' : 'border-gray-300'
                        }`}>
                          {watch('conditionSeverity') === 'moderate' && (
                            <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Moderate</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="severitySevere"
                      value="severe"
                      className="sr-only"
                      {...register('conditionSeverity')}
                    />
                    <label
                      htmlFor="severitySevere"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        watch('conditionSeverity') === 'severe' ? 'border-error-500 bg-error-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          watch('conditionSeverity') === 'severe' ? 'border-error-500' : 'border-gray-300'
                        }`}>
                          {watch('conditionSeverity') === 'severe' && (
                            <div className="w-2 h-2 rounded-full bg-error-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Severe</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label required">Visit Purpose</label>
                <select
                  className="form-input"
                  {...register('visitPurpose', { required: 'Visit purpose is required' })}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="procedure">Procedure</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="lab_test">Laboratory Test</option>
                  <option value="imaging">Imaging/Radiology</option>
                  <option value="prescription_refill">Prescription Refill</option>
                </select>
                {errors.visitPurpose && <p className="text-error-500 text-sm mt-1">{errors.visitPurpose.message}</p>}
              </div>
              
              <div>
                <label className="form-label required">Urgency Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      id="urgencyLow"
                      value="low"
                      className="sr-only"
                      {...register('urgencyLevel')}
                    />
                    <label
                      htmlFor="urgencyLow"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        watch('urgencyLevel') === 'low' ? 'border-success-500 bg-success-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          watch('urgencyLevel') === 'low' ? 'border-success-500' : 'border-gray-300'
                        }`}>
                          {watch('urgencyLevel') === 'low' && (
                            <div className="w-2 h-2 rounded-full bg-success-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Low</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="urgencyMedium"
                      value="medium"
                      className="sr-only"
                      {...register('urgencyLevel')}
                    />
                    <label
                      htmlFor="urgencyMedium"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        watch('urgencyLevel') === 'medium' ? 'border-warning-500 bg-warning-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          watch('urgencyLevel') === 'medium' ? 'border-warning-500' : 'border-gray-300'
                        }`}>
                          {watch('urgencyLevel') === 'medium' && (
                            <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Medium</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="urgencyHigh"
                      value="high"
                      className="sr-only"
                      {...register('urgencyLevel')}
                    />
                    <label
                      htmlFor="urgencyHigh"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        watch('urgencyLevel') === 'high' ? 'border-error-500 bg-error-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          watch('urgencyLevel') === 'high' ? 'border-error-500' : 'border-gray-300'
                        }`}>
                          {watch('urgencyLevel') === 'high' && (
                            <div className="w-2 h-2 rounded-full bg-error-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">High</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label">Preferred Doctor (Optional)</label>
                <select
                  className="form-input"
                  {...register('preferredDoctor')}
                >
                  <option value="">No preference</option>
                  <option value="dr_smith">Dr. Smith</option>
                  <option value="dr_johnson">Dr. Johnson</option>
                  <option value="dr_williams">Dr. Williams</option>
                  <option value="dr_brown">Dr. Brown</option>
                  <option value="dr_davis">Dr. Davis</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment Information */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="form-label required">Payment Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      id="paymentCash"
                      value="cash"
                      className="sr-only"
                      {...register('paymentMethod')}
                    />
                    <label
                      htmlFor="paymentCash"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'cash' ? 'border-primary-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'cash' && (
                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Cash</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="paymentMpesa"
                      value="mpesa"
                      className="sr-only"
                      {...register('paymentMethod')}
                    />
                    <label
                      htmlFor="paymentMpesa"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        paymentMethod === 'mpesa' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'mpesa' ? 'border-primary-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'mpesa' && (
                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">M-PESA</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="paymentInsurance"
                      value="insurance"
                      className="sr-only"
                      {...register('paymentMethod')}
                    />
                    <label
                      htmlFor="paymentInsurance"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'insurance' ? 'border-primary-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'insurance' && (
                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Insurance</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="paymentCreditCard"
                      value="credit_card"
                      className="sr-only"
                      {...register('paymentMethod')}
                    />
                    <label
                      htmlFor="paymentCreditCard"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        paymentMethod === 'credit_card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'credit_card' ? 'border-primary-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'credit_card' && (
                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Credit Card</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="paymentInvoice"
                      value="invoice"
                      className="sr-only"
                      {...register('paymentMethod')}
                    />
                    <label
                      htmlFor="paymentInvoice"
                      className={`block p-3 border rounded-lg cursor-pointer ${
                        paymentMethod === 'invoice' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'invoice' ? 'border-primary-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'invoice' && (
                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                          )}
                        </div>
                        <span className="ml-2 font-medium">Invoice</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Specific Fields */}
              {paymentMethod === 'mpesa' && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h3 className="font-medium flex items-center">
                    <Smartphone className="h-5 w-5 text-primary-500 mr-2" />
                    M-PESA Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Transaction Code</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., QWE123456"
                        {...register('mpesa.transactionCode', { 
                          required: paymentMethod === 'mpesa' ? 'Transaction code is required' : false 
                        })}
                      />
                      {errors.mpesa?.transactionCode && (
                        <p className="text-error-500 text-sm mt-1">{errors.mpesa.transactionCode.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="e.g., +254712345678"
                        {...register('mpesa.phoneNumber', { 
                          required: paymentMethod === 'mpesa' ? 'Phone number is required' : false 
                        })}
                      />
                      {errors.mpesa?.phoneNumber && (
                        <p className="text-error-500 text-sm mt-1">{errors.mpesa.phoneNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Amount</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., 1000"
                        {...register('mpesa.amount', { 
                          required: paymentMethod === 'mpesa' ? 'Amount is required' : false 
                        })}
                      />
                      {errors.mpesa?.amount && (
                        <p className="text-error-500 text-sm mt-1">{errors.mpesa.amount.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Payment Date</label>
                      <input
                        type="date"
                        className="form-input"
                        {...register('mpesa.paymentDate', { 
                          required: paymentMethod === 'mpesa' ? 'Payment date is required' : false 
                        })}
                      />
                      {errors.mpesa?.paymentDate && (
                        <p className="text-error-500 text-sm mt-1">{errors.mpesa.paymentDate.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'insurance' && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h3 className="font-medium flex items-center">
                    <Building2 className="h-5 w-5 text-primary-500 mr-2" />
                    Insurance Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Insurance Provider</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., NHIF, AAR, Jubilee"
                        {...register('insurance.provider', { 
                          required: paymentMethod === 'insurance' ? 'Insurance provider is required' : false 
                        })}
                      />
                      {errors.insurance?.provider && (
                        <p className="text-error-500 text-sm mt-1">{errors.insurance.provider.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Policy Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., INS123456789"
                        {...register('insurance.policyNumber', { 
                          required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                        })}
                      />
                      {errors.insurance?.policyNumber && (
                        <p className="text-error-500 text-sm mt-1">{errors.insurance.policyNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Expiry Date</label>
                      <input
                        type="date"
                        className="form-input"
                        {...register('insurance.expiryDate', { 
                          required: paymentMethod === 'insurance' ? 'Expiry date is required' : false 
                        })}
                      />
                      {errors.insurance?.expiryDate && (
                        <p className="text-error-500 text-sm mt-1">{errors.insurance.expiryDate.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Coverage Percentage</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., 80%"
                        {...register('insurance.coveragePercentage', { 
                          required: paymentMethod === 'insurance' ? 'Coverage percentage is required' : false 
                        })}
                      />
                      {errors.insurance?.coveragePercentage && (
                        <p className="text-error-500 text-sm mt-1">{errors.insurance.coveragePercentage.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'credit_card' && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h3 className="font-medium flex items-center">
                    <CreditCard className="h-5 w-5 text-primary-500 mr-2" />
                    Credit Card Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Card Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="•••• •••• •••• ••••"
                        {...register('creditCard.cardNumber', { 
                          required: paymentMethod === 'credit_card' ? 'Card number is required' : false 
                        })}
                      />
                      {errors.creditCard?.cardNumber && (
                        <p className="text-error-500 text-sm mt-1">{errors.creditCard.cardNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Cardholder Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Name on card"
                        {...register('creditCard.cardholderName', { 
                          required: paymentMethod === 'credit_card' ? 'Cardholder name is required' : false 
                        })}
                      />
                      {errors.creditCard?.cardholderName && (
                        <p className="text-error-500 text-sm mt-1">{errors.creditCard.cardholderName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Expiry Date</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        {...register('creditCard.expiryDate', { 
                          required: paymentMethod === 'credit_card' ? 'Expiry date is required' : false 
                        })}
                      />
                      {errors.creditCard?.expiryDate && (
                        <p className="text-error-500 text-sm mt-1">{errors.creditCard.expiryDate.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">CVV</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="•••"
                        {...register('creditCard.cvv', { 
                          required: paymentMethod === 'credit_card' ? 'CVV is required' : false 
                        })}
                      />
                      {errors.creditCard?.cvv && (
                        <p className="text-error-500 text-sm mt-1">{errors.creditCard.cvv.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'cash' && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h3 className="font-medium flex items-center">
                    <DollarSign className="h-5 w-5 text-primary-500 mr-2" />
                    Cash Payment Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label required">Amount Tendered</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., 1000"
                        {...register('cash.amountTendered', { 
                          required: paymentMethod === 'cash' ? 'Amount is required' : false 
                        })}
                      />
                      {errors.cash?.amountTendered && (
                        <p className="text-error-500 text-sm mt-1">{errors.cash.amountTendered.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">Receipt Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., RCT-12345"
                        {...register('cash.receiptNumber')}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'invoice' && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h3 className="font-medium flex items-center">
                    <FileText className="h-5 w-5 text-primary-500 mr-2" />
                    Invoice Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Invoice Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., INV-12345"
                        {...register('invoice.invoiceNumber')}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label required">Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        {...register('invoice.dueDate', { 
                          required: paymentMethod === 'invoice' ? 'Due date is required' : false 
                        })}
                      />
                      {errors.invoice?.dueDate && (
                        <p className="text-error-500 text-sm mt-1">{errors.invoice.dueDate.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Review Information</h2>
            
            {patientType === 'emergency' && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-error-800 font-medium">Emergency Registration</h3>
                    <p className="text-error-600 text-sm mt-1">
                      This patient is being registered as an emergency case. Only minimal information is required.
                      Payment will be processed later.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Patient ID */}
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-primary-800 font-medium">Patient ID</h3>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md border border-primary-200">
                    <span className="font-mono text-lg font-bold text-primary-700">{patientId}</span>
                  </div>
                </div>
              </div>
              
              {/* Personal Information */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{watch('firstName')} {watch('lastName')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{watch('age')} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{watch('gender')?.charAt(0).toUpperCase() + watch('gender')?.slice(1)}</p>
                  </div>
                </div>
              </div>
              
              {/* Contact Information (not shown for emergency) */}
              {patientType !== 'emergency' && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{watch('contactNumber')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{watch('email') || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{watch('address')}</p>
                    </div>
                  </div>
                  
                  {showEmergencyContact && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{watch('emergencyContact.name') || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Relationship</p>
                          <p className="font-medium">{watch('emergencyContact.relationship') || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{watch('emergencyContact.phone') || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Priority Information (not shown for emergency) */}
              {patientType !== 'emergency' && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Priority Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Condition Severity</p>
                      <p className="font-medium">{watch('conditionSeverity')?.charAt(0).toUpperCase() + watch('conditionSeverity')?.slice(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visit Purpose</p>
                      <p className="font-medium">{watch('visitPurpose')?.replace('_', ' ').charAt(0).toUpperCase() + watch('visitPurpose')?.replace('_', ' ').slice(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Urgency Level</p>
                      <p className="font-medium">{watch('urgencyLevel')?.charAt(0).toUpperCase() + watch('urgencyLevel')?.slice(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preferred Doctor</p>
                      <p className="font-medium">
                        {watch('preferredDoctor') 
                          ? watch('preferredDoctor').replace('dr_', 'Dr. ').replace('_', ' ').charAt(0).toUpperCase() + watch('preferredDoctor').replace('dr_', 'Dr. ').replace('_', ' ').slice(1)
                          : 'No preference'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payment Information (not shown for emergency) */}
              {patientType !== 'emergency' && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">
                      {paymentMethod === 'cash' && 'Cash'}
                      {paymentMethod === 'mpesa' && 'M-PESA'}
                      {paymentMethod === 'insurance' && 'Insurance'}
                      {paymentMethod === 'credit_card' && 'Credit Card'}
                      {paymentMethod === 'invoice' && 'Invoice'}
                    </p>
                  </div>
                  
                  {paymentMethod === 'mpesa' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Transaction Code</p>
                        <p className="font-medium">{watch('mpesa.transactionCode')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium">{watch('mpesa.phoneNumber')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium">{watch('mpesa.amount')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Date</p>
                        <p className="font-medium">{watch('mpesa.paymentDate')}</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'insurance' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Insurance Provider</p>
                        <p className="font-medium">{watch('insurance.provider')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Policy Number</p>
                        <p className="font-medium">{watch('insurance.policyNumber')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="font-medium">{watch('insurance.expiryDate')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Coverage Percentage</p>
                        <p className="font-medium">{watch('insurance.coveragePercentage')}</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'credit_card' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Card Number</p>
                        <p className="font-medium">•••• •••• •••• {watch('creditCard.cardNumber')?.slice(-4) || '••••'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cardholder Name</p>
                        <p className="font-medium">{watch('creditCard.cardholderName')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="font-medium">{watch('creditCard.expiryDate')}</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'cash' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Amount Tendered</p>
                        <p className="font-medium">{watch('cash.amountTendered')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Receipt Number</p>
                        <p className="font-medium">{watch('cash.receiptNumber') || 'Not provided'}</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'invoice' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Invoice Number</p>
                        <p className="font-medium">{watch('invoice.invoiceNumber') || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="font-medium">{watch('invoice.dueDate')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Emergency Payment Note */}
              {patientType === 'emergency' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Payment Information</h3>
                  <p className="text-gray-600">
                    <span className="font-medium">Payment Method:</span> Pay Later (Emergency Case)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    For emergency cases, payment will be processed after treatment. No payment information is required at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="btn btn-outline"
            >
              Back
            </button>
          )}
          
          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="btn btn-primary"
            >
              {patientType === 'emergency' && currentStep === 1 ? 'Skip to Review' : 'Next'}
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
            >
              Complete Registration
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;