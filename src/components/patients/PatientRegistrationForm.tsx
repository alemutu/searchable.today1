import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Search,
  CreditCard,
  Banknote,
  Building,
  ArrowLeft,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface PatientFormData {
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth?: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  paymentMethod: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
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
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [patientType, setPatientType] = useState<'new' | 'existing' | 'emergency'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExistingPatient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    fetchItems: fetchPatients,
    data: existingPatients,
    loading: patientsLoading,
    error: patientsError
  } = useHybridStorage<ExistingPatient>('patients');
  
  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      age: undefined as unknown as number,
      gender: 'Male',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      paymentMethod: 'cash'
    }
  });
  
  const selectedPaymentMethod = watch('paymentMethod');
  
  useEffect(() => {
    // Fetch existing patients for search
    fetchPatients();
  }, [fetchPatients]);
  
  useEffect(() => {
    // If a patient is selected, fill the form with their data
    if (selectedPatient) {
      setValue('firstName', selectedPatient.first_name);
      setValue('lastName', selectedPatient.last_name);
      if (selectedPatient.date_of_birth) {
        // Calculate age from date of birth
        const birthDate = new Date(selectedPatient.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setValue('age', age);
        setValue('dateOfBirth', selectedPatient.date_of_birth);
      }
      setValue('gender', selectedPatient.gender);
      setValue('contactNumber', selectedPatient.contact_number);
      setValue('email', selectedPatient.email || '');
      setValue('address', selectedPatient.address);
      setValue('emergencyContact', selectedPatient.emergency_contact);
    }
  }, [selectedPatient, setValue]);
  
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Filter existing patients based on search term
      if (Array.isArray(existingPatients)) {
        const results = existingPatients.filter(patient => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          return fullName.includes(searchTerm.toLowerCase());
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
  
  const selectPatient = (patient: ExistingPatient) => {
    setSelectedPatient(patient);
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
      // Format the data for storage
      const patientData = {
        id: selectedPatient?.id || `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email || null,
        address: data.address,
        emergency_contact: data.emergencyContact,
        status: 'active',
        current_flow_step: patientType === 'emergency' ? 'emergency' : 'triage',
        priority_level: patientType === 'emergency' ? 'critical' : 'normal',
        medical_history: {},
        arrival_time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      // Save the patient data
      await savePatient(patientData, patientData.id);
      
      // Show success notification
      addNotification({
        message: `Patient ${selectedPatient ? 'updated' : 'registered'} successfully`,
        type: 'success'
      });
      
      // Redirect to triage
      navigate(`/patients/${patientData.id}/triage`);
    } catch (error: any) {
      console.error('Error saving patient:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Patient Type</h3>
            <p className="text-sm text-gray-600 mb-4">Select the appropriate patient type</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                className={`border rounded-md p-3 cursor-pointer transition-colors ${
                  patientType === 'new' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPatientType('new')}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">New Patient</h4>
                    <p className="text-xs text-gray-500">Register a new patient</p>
                  </div>
                  {patientType === 'new' && (
                    <CheckCircle className="ml-auto h-5 w-5 text-primary-500" />
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-md p-3 cursor-pointer transition-colors ${
                  patientType === 'existing' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPatientType('existing')}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Search className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Existing Patient</h4>
                    <p className="text-xs text-gray-500">Find patient records</p>
                  </div>
                  {patientType === 'existing' && (
                    <CheckCircle className="ml-auto h-5 w-5 text-primary-500" />
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-md p-3 cursor-pointer transition-colors ${
                  patientType === 'emergency' 
                    ? 'border-error-500 bg-error-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPatientType('emergency')}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-error-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-error-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Emergency</h4>
                    <p className="text-xs text-gray-500">Fast-track emergency case</p>
                  </div>
                  {patientType === 'emergency' && (
                    <CheckCircle className="ml-auto h-5 w-5 text-error-500" />
                  )}
                </div>
              </div>
            </div>
            
            {patientType === 'existing' && (
              <div className="mt-4">
                <div className="flex space-x-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input pl-9 py-2 text-sm w-full"
                      placeholder="Search by patient name..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching || !searchTerm.trim()}
                    className="btn btn-primary py-2 text-sm"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {isSearching ? (
                  <div className="mt-3 text-center py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-1 text-sm text-gray-500">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="mt-3 border rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div 
                        key={patient.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer flex items-center"
                        onClick={() => selectPatient(patient)}
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</p>
                          <p className="text-xs text-gray-500">{patient.contact_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm && !isSearching ? (
                  <div className="mt-3 text-center py-3 border rounded-md border-gray-200">
                    <p className="text-sm text-gray-500">No patients found matching "{searchTerm}"</p>
                  </div>
                ) : null}
                
                {selectedPatient && (
                  <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Selected: {selectedPatient.first_name} {selectedPatient.last_name}</p>
                        <p className="text-xs text-gray-500">{selectedPatient.contact_number}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="ml-auto text-xs text-primary-600 hover:text-primary-800"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Personal Information</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the patient's personal details</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="form-label text-sm required">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className={`form-input pl-8 py-2 text-sm ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <p className="form-error text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm required">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className={`form-input pl-8 py-2 text-sm ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="form-error text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm required">Age</label>
                <input
                  type="number"
                  {...register('age', { 
                    required: 'Age is required',
                    min: { value: 0, message: 'Age must be positive' },
                    max: { value: 120, message: 'Age must be less than 120' }
                  })}
                  className={`form-input py-2 text-sm ${errors.age ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter age"
                />
                {errors.age && (
                  <p className="form-error text-xs mt-1">{errors.age.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    className="form-input pl-8 py-2 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Optional</p>
              </div>
              
              <div>
                <label className="form-label text-sm required">Gender</label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`form-input py-2 text-sm ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="form-error text-xs mt-1">{errors.gender.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm required">Contact Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register('contactNumber', { required: 'Contact number is required' })}
                    className={`form-input pl-8 py-2 text-sm ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Phone number"
                  />
                </div>
                {errors.contactNumber && (
                  <p className="form-error text-xs mt-1">{errors.contactNumber.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className="form-input pl-8 py-2 text-sm"
                    placeholder="Email address (optional)"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="form-label text-sm required">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    {...register('address', { required: 'Address is required' })}
                    className={`form-input pl-8 py-2 text-sm ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    rows={2}
                    placeholder="Full address"
                  />
                </div>
                {errors.address && (
                  <p className="form-error text-xs mt-1">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Contact Information</h3>
            <p className="text-sm text-gray-600 mb-4">Enter emergency contact details</p>
            
            <div className="space-y-3">
              <div>
                <label className="form-label text-sm required">Emergency Contact Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                    className={`form-input pl-8 py-2 text-sm ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Full name"
                  />
                </div>
                {errors.emergencyContact?.name && (
                  <p className="form-error text-xs mt-1">{errors.emergencyContact.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm required">Relationship</label>
                <input
                  type="text"
                  {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                  className={`form-input py-2 text-sm ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="e.g., Spouse, Parent, Child"
                />
                {errors.emergencyContact?.relationship && (
                  <p className="form-error text-xs mt-1">{errors.emergencyContact.relationship.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label text-sm required">Emergency Contact Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                    className={`form-input pl-8 py-2 text-sm ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Phone number"
                  />
                </div>
                {errors.emergencyContact?.phone && (
                  <p className="form-error text-xs mt-1">{errors.emergencyContact.phone.message}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Payment Information</h3>
            <p className="text-sm text-gray-600 mb-4">Select payment method</p>
            
            <div className="space-y-3">
              <div>
                <label className="form-label text-sm required">Payment Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div 
                    className={`border rounded-md p-2.5 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'cash' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'cash')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <Banknote className="h-3.5 w-3.5 text-primary-600" />
                      </div>
                      <div className="ml-2">
                        <h4 className="text-sm font-medium text-gray-900">Cash</h4>
                      </div>
                      {selectedPaymentMethod === 'cash' && (
                        <CheckCircle className="ml-auto h-4 w-4 text-primary-500" />
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-md p-2.5 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'card' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'card')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5 text-primary-600" />
                      </div>
                      <div className="ml-2">
                        <h4 className="text-sm font-medium text-gray-900">Card</h4>
                      </div>
                      {selectedPaymentMethod === 'card' && (
                        <CheckCircle className="ml-auto h-4 w-4 text-primary-500" />
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-md p-2.5 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'insurance' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'insurance')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <Building className="h-3.5 w-3.5 text-primary-600" />
                      </div>
                      <div className="ml-2">
                        <h4 className="text-sm font-medium text-gray-900">Insurance</h4>
                      </div>
                      {selectedPaymentMethod === 'insurance' && (
                        <CheckCircle className="ml-auto h-4 w-4 text-primary-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedPaymentMethod === 'insurance' && (
                <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-md">
                  <div>
                    <label className="form-label text-sm required">Insurance Provider</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.provider', { 
                        required: selectedPaymentMethod === 'insurance' ? 'Insurance provider is required' : false 
                      })}
                      className={`form-input py-2 text-sm ${errors.insuranceInfo?.provider ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Insurance company name"
                    />
                    {errors.insuranceInfo?.provider && (
                      <p className="form-error text-xs mt-1">{errors.insuranceInfo.provider.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label text-sm required">Policy Number</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.policyNumber', { 
                        required: selectedPaymentMethod === 'insurance' ? 'Policy number is required' : false 
                      })}
                      className={`form-input py-2 text-sm ${errors.insuranceInfo?.policyNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Policy number"
                    />
                    {errors.insuranceInfo?.policyNumber && (
                      <p className="form-error text-xs mt-1">{errors.insuranceInfo.policyNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Group Number (Optional)</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.groupNumber')}
                      className="form-input py-2 text-sm"
                      placeholder="Group number (if applicable)"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Priority</h3>
            <p className="text-sm text-gray-600 mb-4">Set patient priority level</p>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-error-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-error-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Emergency</h4>
                      <p className="text-xs text-gray-500">Critical condition requiring immediate attention</p>
                    </div>
                    {patientType === 'emergency' && (
                      <CheckCircle className="ml-auto h-5 w-5 text-error-500" />
                    )}
                  </div>
                </div>
              </div>
              
              {patientType === 'emergency' && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-error-800">Emergency Patient</p>
                      <p className="text-xs text-error-700 mt-1">
                        This patient will be marked as an emergency case and will be prioritized for immediate medical attention.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-t-lg p-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-1 rounded-full text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Patient Registration</h1>
            <p className="text-primary-100 text-xs">Register new or manage existing patients</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-b-lg shadow-sm p-4">
        {/* Progress Steps */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-3.5 w-3.5" /> : 1}
              </div>
              <div className={`h-0.5 w-5 ${
                currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <CheckCircle className="h-3.5 w-3.5" /> : 2}
              </div>
              <div className={`h-0.5 w-5 ${
                currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 3 ? <CheckCircle className="h-3.5 w-3.5" /> : 3}
              </div>
              <div className={`h-0.5 w-5 ${
                currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 4 ? <CheckCircle className="h-3.5 w-3.5" /> : 4}
              </div>
              <div className={`h-0.5 w-5 ${
                currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                5
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Step {currentStep} of 5
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Type</div>
            <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal</div>
            <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
            <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Payment</div>
            <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Priority</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent()}
          
          <div className="flex justify-between mt-5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline py-1.5 px-3 text-sm flex items-center"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline py-1.5 px-3 text-sm flex items-center"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </button>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary py-1.5 px-3 text-sm flex items-center"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary py-1.5 px-3 text-sm flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white mr-1.5"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
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