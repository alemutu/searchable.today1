import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  ArrowLeft, 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  UserPlus, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  UserRound,
  Users,
  Heart
} from 'lucide-react';
import { debounce } from 'lodash';

interface PatientFormData {
  patientType: 'new' | 'existing' | 'emergency';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  priority: 'normal' | 'urgent' | 'critical';
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: string;
  current_flow_step: string | null;
  medical_info?: any;
}

const PatientRegistrationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      patientType: 'new',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      priority: 'normal'
    }
  });
  
  const patientType = watch('patientType');
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    fetchItems: fetchPatients,
    data: patientsData,
    loading: patientsLoading,
    error: patientsError
  } = useHybridStorage<Patient>('patients');
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      // Fetch patients and filter by search term
      fetchPatients()
        .then(() => {
          if (Array.isArray(patientsData)) {
            const results = patientsData.filter(patient => {
              const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
              return fullName.includes(term.toLowerCase()) || 
                    patient.contact_number.includes(term) ||
                    (patient.email && patient.email.toLowerCase().includes(term.toLowerCase()));
            });
            setSearchResults(results);
          }
        })
        .catch(error => {
          console.error('Error searching patients:', error);
          addNotification({
            message: 'Error searching for patients',
            type: 'error'
          });
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300),
    [fetchPatients, patientsData]
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length >= 2) {
      debouncedSearch.flush();
    }
  };
  
  // Select an existing patient
  const selectExistingPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('firstName', patient.first_name);
    setValue('lastName', patient.last_name);
    setValue('dateOfBirth', patient.date_of_birth);
    setValue('gender', patient.gender);
    setValue('contactNumber', patient.contact_number);
    setValue('email', patient.email || '');
    setValue('address', patient.address);
    setValue('emergencyContactName', patient.emergency_contact.name);
    setValue('emergencyContactRelationship', patient.emergency_contact.relationship);
    setValue('emergencyContactPhone', patient.emergency_contact.phone);
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
    
    // Move to next step
    setCurrentStep(2);
  };
  
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
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      
      // If we're updating an existing patient
      if (data.patientType === 'existing' && selectedPatient) {
        const updatedPatient = {
          ...selectedPatient,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          contact_number: data.contactNumber,
          email: data.email,
          address: data.address,
          emergency_contact: {
            name: data.emergencyContactName,
            relationship: data.emergencyContactRelationship,
            phone: data.emergencyContactPhone
          },
          current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration',
          priority_level: data.priority
        };
        
        await savePatient(updatedPatient, selectedPatient.id);
        
        addNotification({
          message: 'Patient information updated successfully',
          type: 'success'
        });
        
        // Navigate to appropriate next step
        if (data.patientType === 'emergency') {
          navigate(`/patients/${selectedPatient.id}/triage`);
        } else {
          navigate(`/patients/${selectedPatient.id}`);
        }
      } 
      // If we're creating a new patient
      else {
        const newPatient: Omit<Patient, 'id'> = {
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          contact_number: data.contactNumber,
          email: data.email || null,
          address: data.address,
          emergency_contact: {
            name: data.emergencyContactName,
            relationship: data.emergencyContactRelationship,
            phone: data.emergencyContactPhone
          },
          status: 'active',
          current_flow_step: data.patientType === 'emergency' ? 'emergency' : 'registration',
          medical_info: {}
        };
        
        // Generate a unique ID for the patient
        const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Save the patient
        const savedPatient = await savePatient(newPatient, patientId);
        
        addNotification({
          message: 'Patient registered successfully',
          type: 'success'
        });
        
        // Navigate to appropriate next step
        if (data.patientType === 'emergency') {
          navigate(`/patients/${patientId}/triage`);
        } else {
          navigate(`/patients/${patientId}`);
        }
      }
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
  
  // Generate steps based on patient type
  const getSteps = () => {
    const steps = ['Patient Type', 'Personal Info', 'Contact', 'Priority', 'Review'];
    return steps;
  };
  
  const steps = getSteps();
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-primary-600 rounded-lg shadow-md p-3 mb-3">
          <div className="flex items-center">
            <Link to="/patients" className="text-white mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Patient Registration</h1>
              <p className="text-primary-100 text-xs">Register new or manage existing patients</p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm mb-3">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      currentStep > index + 1 ? 'bg-primary-500 text-white' : 
                      currentStep === index + 1 ? 'bg-primary-500 text-white' : 
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > index + 1 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-1 w-8 ${
                        currentStep > index + 1 ? 'bg-primary-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Step {currentStep} of {steps.length}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`text-center ${currentStep === index + 1 ? 'text-primary-600 font-medium' : ''}`}
                  style={{ width: `${100 / steps.length}%` }}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
          {/* Step 1: Patient Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Patient Type</h2>
              <p className="text-sm text-gray-600 mb-4">Select the appropriate patient type</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer transition-colors ${
                      patientType === 'new' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="new"
                      {...register('patientType')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        patientType === 'new' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <UserPlus className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">New Patient</div>
                        <div className="text-xs text-gray-500">Register a new patient</div>
                      </div>
                    </div>
                    {patientType === 'new' && (
                      <CheckCircle className="h-5 w-5 text-primary-500 ml-auto" />
                    )}
                  </label>
                  
                  <label 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer transition-colors ${
                      patientType === 'existing' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="existing"
                      {...register('patientType')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        patientType === 'existing' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Existing Patient</div>
                        <div className="text-xs text-gray-500">Find patient records</div>
                      </div>
                    </div>
                    {patientType === 'existing' && (
                      <CheckCircle className="h-5 w-5 text-primary-500 ml-auto" />
                    )}
                  </label>
                  
                  <label 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer transition-colors ${
                      patientType === 'emergency' ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="emergency"
                      {...register('patientType')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        patientType === 'emergency' ? 'bg-error-100 text-error-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Emergency</div>
                        <div className="text-xs text-gray-500">Fast-track emergency case</div>
                      </div>
                    </div>
                    {patientType === 'emergency' && (
                      <CheckCircle className="h-5 w-5 text-error-500 ml-auto" />
                    )}
                  </label>
                </div>
                
                {/* Existing Patient Search */}
                {patientType === 'existing' && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Find Existing Patient</h3>
                    <form onSubmit={handleSearchSubmit} className="mb-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="form-input pl-9 w-full"
                          placeholder="Search by name, phone, or email..."
                        />
                        <button
                          type="submit"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <Search className="h-4 w-4 text-primary-500" />
                        </button>
                      </div>
                    </form>
                    
                    {isSearching ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <div 
                            key={patient.id}
                            onClick={() => selectExistingPatient(patient)}
                            className="p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer flex items-center"
                          >
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm mr-3">
                              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{patient.first_name} {patient.last_name}</div>
                              <div className="text-xs text-gray-500">
                                {calculateAge(patient.date_of_birth)} years • {patient.gender} • {patient.contact_number}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchTerm.length >= 2 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">No patients found matching "{searchTerm}"</p>
                        <button
                          type="button"
                          onClick={() => {
                            setValue('patientType', 'new');
                            setValue('firstName', '');
                            setValue('lastName', '');
                          }}
                          className="btn btn-outline text-xs py-1 px-2"
                        >
                          Register as new patient
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h2>
              <p className="text-sm text-gray-600 mb-4">Enter the patient's personal details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required text-sm">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserRound className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="form-error text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required text-sm">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserRound className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="form-error text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required text-sm">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfBirth', { required: 'Date of birth is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="form-error text-xs mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required text-sm">Gender</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      {...register('gender', { required: 'Gender is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <p className="form-error text-xs mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-4">Enter the patient's contact details</p>
              
              <div className="space-y-3">
                <div>
                  <label className="form-label required text-sm">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { required: 'Phone number is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="form-error text-xs mt-1">{errors.contactNumber.message}</p>
                  )}
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
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="e.g., patient@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label required text-sm">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`form-input pl-9 py-2 text-sm ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={2}
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && (
                    <p className="form-error text-xs mt-1">{errors.address.message}</p>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label required text-sm">Name</label>
                      <input
                        type="text"
                        {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                        className={`form-input py-2 text-sm ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                      {errors.emergencyContactName && (
                        <p className="form-error text-xs mt-1">{errors.emergencyContactName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required text-sm">Relationship</label>
                      <input
                        type="text"
                        {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
                        className={`form-input py-2 text-sm ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                      {errors.emergencyContactRelationship && (
                        <p className="form-error text-xs mt-1">{errors.emergencyContactRelationship.message}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label required text-sm">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                          className={`form-input pl-9 py-2 text-sm ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                          placeholder="e.g., +1 (555) 123-4567"
                        />
                      </div>
                      {errors.emergencyContactPhone && (
                        <p className="form-error text-xs mt-1">{errors.emergencyContactPhone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Priority */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Priority Level</h2>
              <p className="text-sm text-gray-600 mb-4">Select the appropriate priority level for this patient</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer transition-colors ${
                      watch('priority') === 'normal' ? 'border-success-500 bg-success-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="normal"
                      {...register('priority')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        watch('priority') === 'normal' ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Heart className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Normal</div>
                        <div className="text-xs text-gray-500">Standard care priority</div>
                      </div>
                    </div>
                    {watch('priority') === 'normal' && (
                      <CheckCircle className="h-5 w-5 text-success-500 ml-auto" />
                    )}
                  </label>
                  
                  <label 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer transition-colors ${
                      watch('priority') === 'urgent' ? 'border-warning-500 bg-warning-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="urgent"
                      {...register('priority')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        watch('priority') === 'urgent' ? 'bg-warning-100 text-warning-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Heart className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Urgent</div>
                        <div className="text-xs text-gray-500">Requires prompt attention</div>
                      </div>
                    </div>
                    {watch('priority') === 'urgent' && (
                      <CheckCircle className="h-5 w-5 text-warning-500 ml-auto" />
                    )}
                  </label>
                  
                  <label 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer transition-colors ${
                      watch('priority') === 'critical' ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="critical"
                      {...register('priority')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        watch('priority') === 'critical' ? 'bg-error-100 text-error-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Heart className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Critical</div>
                        <div className="text-xs text-gray-500">Immediate medical attention</div>
                      </div>
                    </div>
                    {watch('priority') === 'critical' && (
                      <CheckCircle className="h-5 w-5 text-error-500 ml-auto" />
                    )}
                  </label>
                </div>
                
                {watch('priority') === 'urgent' && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg mt-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-warning-800">Urgent Care Required</h4>
                        <p className="text-xs text-warning-700 mt-1">
                          This patient will be prioritized in the queue and should be seen promptly by a healthcare provider.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {watch('priority') === 'critical' && (
                  <div className="p-3 bg-error-50 border border-error-200 rounded-lg mt-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-error-800">Critical Condition</h4>
                        <p className="text-xs text-error-700 mt-1">
                          This patient requires immediate medical attention. Alert the emergency response team immediately.
                        </p>
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
              <h2 className="text-lg font-medium text-gray-900 mb-3">Review Information</h2>
              <p className="text-sm text-gray-600 mb-4">Please review the patient information before submitting</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium">{watch('firstName')} {watch('lastName')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date of Birth:</span>
                        <span className="font-medium">{watch('dateOfBirth')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gender:</span>
                        <span className="font-medium">{watch('gender')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{watch('contactNumber')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{watch('email') || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Address:</span>
                        <span className="font-medium truncate max-w-[200px]">{watch('address')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium">{watch('emergencyContactName')}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Relationship:</span>
                      <div className="font-medium">{watch('emergencyContactRelationship')}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium">{watch('emergencyContactPhone')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Registration Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Patient Type:</span>
                      <div className="font-medium capitalize">{watch('patientType')}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority Level:</span>
                      <div className="font-medium capitalize">{watch('priority')}</div>
                    </div>
                  </div>
                </div>
                
                {watch('patientType') === 'emergency' && (
                  <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-error-800">Emergency Registration</h4>
                        <p className="text-xs text-error-700 mt-1">
                          This patient will be registered as an emergency case and will be immediately directed to triage.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
              className="btn btn-outline flex items-center py-1.5 px-3 text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          ) : (
            <Link
              to="/patients"
              className="btn btn-outline flex items-center py-1.5 px-3 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cancel
            </Link>
          )}
          
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={currentStep === 1 && patientType === 'existing' && !selectedPatient}
              className="btn btn-primary flex items-center py-1.5 px-3 text-sm"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center py-1.5 px-3 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
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