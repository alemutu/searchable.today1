import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Save, 
  ArrowLeft, 
  AlertTriangle,
  UserPlus,
  Users,
  Clock,
  Search,
  CreditCard,
  Building2,
  Shield,
  Star,
  ChevronRight,
  ChevronLeft,
  CheckCircle
} from 'lucide-react';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { v4 as uuidv4 } from 'uuid';

interface PatientRegistrationFormData {
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
  patientType: 'new' | 'existing' | 'emergency';
  priority: 'normal' | 'emergency' | 'referral' | 'vip';
  priorityNotes?: string;
  paymentMode: 'cash' | 'nhif' | 'insurance' | 'corporate' | 'waiver';
  paymentDetails?: {
    nhifNumber?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    corporateName?: string;
    waiverReason?: string;
  };
  emergencyDetails?: {
    chiefComplaint: string;
    referredBy?: string;
    referredFrom?: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    error: patientError,
    fetchItems: fetchPatients,
    data: existingPatients
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isValid } } = useForm<PatientRegistrationFormData>({
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
      paymentMode: 'cash'
    },
    mode: 'onChange'
  });

  const patientType = watch('patientType');
  const priority = watch('priority');
  const paymentMode = watch('paymentMode');
  
  // Display error notification if there's a patient error
  useEffect(() => {
    if (patientError) {
      addNotification({
        message: `Error with patient data: ${patientError.message}`,
        type: 'error'
      });
    }
  }, [patientError, addNotification]);
  
  // Fetch existing patients for search
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  // Search for existing patients
  const handleSearch = () => {
    if (!searchQuery || !Array.isArray(existingPatients)) return;
    
    setIsSearching(true);
    
    try {
      const results = existingPatients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const phone = patient.contact_number?.toLowerCase() || '';
        const id = patient.id?.toLowerCase() || '';
        
        return fullName.includes(searchQuery.toLowerCase()) || 
               phone.includes(searchQuery.toLowerCase()) || 
               id.includes(searchQuery.toLowerCase());
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Select an existing patient
  const selectExistingPatient = (patient: any) => {
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
    setSearchQuery('');
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    try {
      setIsLoading(true);
      setFormError(null);
      
      console.log('Patient registration form submitted:', data);
      
      // Create a unique ID for the patient record
      const patientId = uuidv4();
      
      // Determine the initial flow step based on patient type and priority
      let initialFlowStep = 'registration';
      let priorityLevel = 'normal';
      
      if (data.patientType === 'emergency' || data.priority === 'emergency') {
        initialFlowStep = 'emergency';
        priorityLevel = 'critical';
      } else if (data.priority === 'vip') {
        priorityLevel = 'urgent';
      } else if (data.priority === 'referral') {
        priorityLevel = 'urgent';
      }
      
      // Create patient record
      const patientRecord = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date().toISOString().split('T')[0], // Default to today if not provided
        gender: data.gender,
        contact_number: data.contactNumber || 'Unknown', // Default value for emergency cases
        email: data.email,
        address: data.address || 'To be updated', // Default value for emergency cases
        emergency_contact: data.patientType === 'emergency' ? 
          { name: 'To be updated', relationship: 'To be updated', phone: 'To be updated' } : 
          data.emergencyContact,
        medical_history: null,
        status: 'active',
        current_flow_step: initialFlowStep,
        priority_level: priorityLevel,
        created_at: new Date().toISOString(),
        chief_complaint: data.emergencyDetails?.chiefComplaint || null,
        payment_info: {
          mode: data.paymentMode,
          details: data.paymentDetails || {}
        },
        is_emergency: data.patientType === 'emergency' || data.priority === 'emergency'
      };
      
      // Save the patient record
      await savePatient(patientRecord, patientId);
      
      // Show success notification
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Redirect to the appropriate page based on patient type
      if (data.patientType === 'emergency' || data.priority === 'emergency') {
        navigate(`/patients/${patientId}/triage`);
      } else {
        navigate('/patients');
      }
    } catch (error: any) {
      console.error('Error submitting patient registration form:', error.message);
      
      // Set form error
      setFormError(`Error: ${error.message}`);
      
      // Show error notification
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render form steps
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Patient Type Selection */}
            <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer ${
                    patientType === 'new' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'new')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="new"
                      {...register('patientType')}
                      value="new"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={patientType === 'new'}
                      onChange={() => {}}
                    />
                    <label htmlFor="new" className="ml-2 block text-sm font-medium text-gray-900">
                      New Patient
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 ml-6">
                    First-time registration
                  </p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer ${
                    patientType === 'existing' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'existing')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="existing"
                      {...register('patientType')}
                      value="existing"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={patientType === 'existing'}
                      onChange={() => {}}
                    />
                    <label htmlFor="existing" className="ml-2 block text-sm font-medium text-gray-900">
                      Existing Patient
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 ml-6">
                    Search for registered patient
                  </p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer ${
                    patientType === 'emergency' 
                      ? 'border-error-500 bg-error-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('patientType', 'emergency')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="emergency"
                      {...register('patientType')}
                      value="emergency"
                      className="h-4 w-4 text-error-600 focus:ring-error-500 border-gray-300"
                      checked={patientType === 'emergency'}
                      onChange={() => {}}
                    />
                    <label htmlFor="emergency" className="ml-2 block text-sm font-medium text-gray-900">
                      Emergency Case
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 ml-6">
                    Expedited registration
                  </p>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-input pl-10"
                        placeholder="Search by name, ID, or phone number"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="btn btn-primary"
                      disabled={isSearching || !searchQuery}
                    >
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-60 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <div 
                            key={patient.id} 
                            className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                            onClick={() => selectExistingPatient(patient)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                                <div className="text-sm text-gray-500">
                                  {patient.contact_number} • {new Date(patient.date_of_birth).toLocaleDateString()}
                                </div>
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
                    </div>
                  )}
                  
                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="mt-2 text-sm text-gray-500">
                      No matching patients found. Please try a different search or register as a new patient.
                    </div>
                  )}
                </div>
              )}
              
              {patientType === 'emergency' && (
                <div className="mt-4 p-4 border border-error-200 rounded-lg bg-error-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-error-800">Emergency Registration</h3>
                      <p className="mt-1 text-sm text-error-700">
                        Only patient name is required for emergency registration. All other details can be filled later.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div>
                      <label className="form-label">Chief Complaint</label>
                      <textarea
                        {...register('emergencyDetails.chiefComplaint')}
                        className="form-input"
                        rows={2}
                        placeholder="Brief description of emergency condition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`form-input pl-10 ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
                
                {patientType !== 'emergency' && (
                  <>
                    <div>
                      <label className="form-label required">Date of Birth</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          {...register('dateOfBirth', { 
                            required: patientType === 'emergency' ? false : 'Date of birth is required' 
                          })}
                          className={`form-input pl-10 ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
                    </div>
                    
                    <div>
                      <label className="form-label required">Gender</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          {...register('gender', { required: 'Gender is required' })}
                          className={`form-input pl-10 ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      {errors.gender && <p className="form-error">{errors.gender.message}</p>}
                    </div>
                  </>
                )}
              </div>
              
              {/* Priority Field */}
              <div className="mt-5">
                <label className="form-label">Priority</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer ${
                      priority === 'normal' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'normal')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-normal"
                        {...register('priority')}
                        value="normal"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        checked={priority === 'normal'}
                        onChange={() => {}}
                      />
                      <label htmlFor="priority-normal" className="ml-2 block text-sm font-medium text-gray-900">
                        Normal
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer ${
                      priority === 'emergency' 
                        ? 'border-error-500 bg-error-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'emergency')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-emergency"
                        {...register('priority')}
                        value="emergency"
                        className="h-4 w-4 text-error-600 focus:ring-error-500 border-gray-300"
                        checked={priority === 'emergency'}
                        onChange={() => {}}
                      />
                      <label htmlFor="priority-emergency" className="ml-2 block text-sm font-medium text-gray-900">
                        Emergency
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer ${
                      priority === 'referral' 
                        ? 'border-secondary-500 bg-secondary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'referral')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-referral"
                        {...register('priority')}
                        value="referral"
                        className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300"
                        checked={priority === 'referral'}
                        onChange={() => {}}
                      />
                      <label htmlFor="priority-referral" className="ml-2 block text-sm font-medium text-gray-900">
                        Referral
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer ${
                      priority === 'vip' 
                        ? 'border-warning-500 bg-warning-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('priority', 'vip')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="priority-vip"
                        {...register('priority')}
                        value="vip"
                        className="h-4 w-4 text-warning-600 focus:ring-warning-500 border-gray-300"
                        checked={priority === 'vip'}
                        onChange={() => {}}
                      />
                      <label htmlFor="priority-vip" className="ml-2 block text-sm font-medium text-gray-900">
                        VIP
                      </label>
                    </div>
                  </div>
                </div>
                
                {(priority === 'emergency' || priority === 'referral' || priority === 'vip') && (
                  <div className="mt-3">
                    <label className="form-label">Priority Notes</label>
                    <textarea
                      {...register('priorityNotes')}
                      className="form-input"
                      rows={2}
                      placeholder={
                        priority === 'emergency' ? "Describe emergency situation" : 
                        priority === 'referral' ? "Enter referral details" :
                        "Enter VIP details"
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            {/* Contact Information - Only required for regular patients */}
            <div className={`bg-white rounded-lg shadow-sm p-5 mb-5 ${patientType === 'emergency' ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
                {patientType === 'emergency' && (
                  <div className="text-sm text-gray-500 italic">Optional for emergency cases</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={`form-label ${patientType === 'emergency' ? '' : 'required'}`}>Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('contactNumber', { 
                        required: patientType === 'emergency' ? false : 'Phone number is required' 
                      })}
                      className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter phone number"
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
                
                <div className="md:col-span-2">
                  <label className={`form-label ${patientType === 'emergency' ? '' : 'required'}`}>Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', { 
                        required: patientType === 'emergency' ? false : 'Address is required' 
                      })}
                      className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      rows={3}
                      placeholder="Enter full address"
                    />
                  </div>
                  {errors.address && <p className="form-error">{errors.address.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Emergency Contact - Only required for regular patients */}
            <div className={`bg-white rounded-lg shadow-sm p-5 mb-5 ${patientType === 'emergency' ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Emergency Contact</h2>
                {patientType === 'emergency' && (
                  <div className="text-sm text-gray-500 italic">Optional for emergency cases</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={`form-label ${patientType === 'emergency' ? '' : 'required'}`}>Contact Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('emergencyContact.name', { 
                        required: patientType === 'emergency' ? false : 'Emergency contact name is required' 
                      })}
                      className={`form-input pl-10 ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  {errors.emergencyContact?.name && <p className="form-error">{errors.emergencyContact.name.message}</p>}
                </div>
                
                <div>
                  <label className={`form-label ${patientType === 'emergency' ? '' : 'required'}`}>Relationship</label>
                  <input
                    type="text"
                    {...register('emergencyContact.relationship', { 
                      required: patientType === 'emergency' ? false : 'Relationship is required' 
                    })}
                    className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                  {errors.emergencyContact?.relationship && <p className="form-error">{errors.emergencyContact.relationship.message}</p>}
                </div>
                
                <div>
                  <label className={`form-label ${patientType === 'emergency' ? '' : 'required'}`}>Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register('emergencyContact.phone', { 
                        required: patientType === 'emergency' ? false : 'Emergency contact phone is required' 
                      })}
                      className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                  {errors.emergencyContact?.phone && <p className="form-error">{errors.emergencyContact.phone.message}</p>}
                </div>
              </div>
            </div>
          </>
        );
        
      case 3:
        return (
          <>
            {/* Mode of Payment */}
            <div className={`bg-white rounded-lg shadow-sm p-5 mb-5 ${patientType === 'emergency' ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Mode of Payment</h2>
                {patientType === 'emergency' && (
                  <div className="text-sm text-gray-500 italic">Optional for emergency cases</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${
                    paymentMode === 'cash' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMode', 'cash')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-cash"
                      {...register('paymentMode')}
                      value="cash"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={paymentMode === 'cash'}
                      onChange={() => {}}
                    />
                    <label htmlFor="payment-cash" className="ml-2 block text-sm font-medium text-gray-900">
                      Cash
                    </label>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${
                    paymentMode === 'nhif' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMode', 'nhif')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-nhif"
                      {...register('paymentMode')}
                      value="nhif"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={paymentMode === 'nhif'}
                      onChange={() => {}}
                    />
                    <label htmlFor="payment-nhif" className="ml-2 block text-sm font-medium text-gray-900">
                      NHIF
                    </label>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${
                    paymentMode === 'insurance' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMode', 'insurance')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-insurance"
                      {...register('paymentMode')}
                      value="insurance"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={paymentMode === 'insurance'}
                      onChange={() => {}}
                    />
                    <label htmlFor="payment-insurance" className="ml-2 block text-sm font-medium text-gray-900">
                      Insurance
                    </label>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${
                    paymentMode === 'corporate' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMode', 'corporate')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-corporate"
                      {...register('paymentMode')}
                      value="corporate"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={paymentMode === 'corporate'}
                      onChange={() => {}}
                    />
                    <label htmlFor="payment-corporate" className="ml-2 block text-sm font-medium text-gray-900">
                      Corporate
                    </label>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer ${
                    paymentMode === 'waiver' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('paymentMode', 'waiver')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-waiver"
                      {...register('paymentMode')}
                      value="waiver"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      checked={paymentMode === 'waiver'}
                      onChange={() => {}}
                    />
                    <label htmlFor="payment-waiver" className="ml-2 block text-sm font-medium text-gray-900">
                      Waiver
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Additional fields based on payment mode */}
              {paymentMode === 'nhif' && (
                <div className="mt-4">
                  <label className="form-label required">NHIF Number</label>
                  <input
                    type="text"
                    {...register('paymentDetails.nhifNumber', { 
                      required: paymentMode === 'nhif' ? 'NHIF number is required' : false 
                    })}
                    className="form-input"
                    placeholder="Enter NHIF number"
                  />
                  {errors.paymentDetails?.nhifNumber && (
                    <p className="form-error">{errors.paymentDetails.nhifNumber.message}</p>
                  )}
                </div>
              )}
              
              {paymentMode === 'insurance' && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="form-label required">Insurance Provider</label>
                    <input
                      type="text"
                      {...register('paymentDetails.insuranceProvider', { 
                        required: paymentMode === 'insurance' ? 'Insurance provider is required' : false 
                      })}
                      className="form-input"
                      placeholder="Enter insurance provider name"
                    />
                    {errors.paymentDetails?.insuranceProvider && (
                      <p className="form-error">{errors.paymentDetails.insuranceProvider.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Policy Number</label>
                    <input
                      type="text"
                      {...register('paymentDetails.insurancePolicyNumber', { 
                        required: paymentMode === 'insurance' ? 'Policy number is required' : false 
                      })}
                      className="form-input"
                      placeholder="Enter insurance policy number"
                    />
                    {errors.paymentDetails?.insurancePolicyNumber && (
                      <p className="form-error">{errors.paymentDetails.insurancePolicyNumber.message}</p>
                    )}
                  </div>
                </div>
              )}
              
              {paymentMode === 'corporate' && (
                <div className="mt-4">
                  <label className="form-label required">Corporate Name</label>
                  <input
                    type="text"
                    {...register('paymentDetails.corporateName', { 
                      required: paymentMode === 'corporate' ? 'Corporate name is required' : false 
                    })}
                    className="form-input"
                    placeholder="Enter corporate company name"
                  />
                  {errors.paymentDetails?.corporateName && (
                    <p className="form-error">{errors.paymentDetails.corporateName.message}</p>
                  )}
                </div>
              )}
              
              {paymentMode === 'waiver' && (
                <div className="mt-4">
                  <label className="form-label required">Waiver Reason</label>
                  <textarea
                    {...register('paymentDetails.waiverReason', { 
                      required: paymentMode === 'waiver' ? 'Waiver reason is required' : false 
                    })}
                    className="form-input"
                    rows={3}
                    placeholder="Enter reason for waiver"
                  />
                  {errors.paymentDetails?.waiverReason && (
                    <p className="form-error">{errors.paymentDetails.waiverReason.message}</p>
                  )}
                </div>
              )}
            </div>
          </>
        );
        
      case 4:
        // Review & Complete Registration
        const formData = watch();
        return (
          <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Review & Complete Registration</h2>
              <div className="flex items-center text-success-600">
                <CheckCircle className="h-5 w-5 mr-1.5" />
                <span className="text-sm font-medium">Please review before submitting</span>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Patient Type & Priority */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Type & Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Patient Type</p>
                    <p className="text-sm text-gray-900">
                      {formData.patientType === 'new' ? 'New Patient' : 
                       formData.patientType === 'existing' ? 'Existing Patient' : 
                       'Emergency Case'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Priority</p>
                    <p className="text-sm text-gray-900">
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                      {formData.priorityNotes && ` - ${formData.priorityNotes}`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Personal Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-900">{formData.firstName} {formData.lastName}</p>
                  </div>
                  {formData.dateOfBirth && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                      <p className="text-sm text-gray-900">{formData.dateOfBirth}</p>
                    </div>
                  )}
                  {formData.gender && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Gender</p>
                      <p className="text-sm text-gray-900">{formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contact Information */}
              {(formData.contactNumber || formData.email || formData.address) && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.contactNumber && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{formData.contactNumber}</p>
                      </div>
                    )}
                    {formData.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{formData.email}</p>
                      </div>
                    )}
                    {formData.address && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-sm text-gray-900">{formData.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Emergency Contact */}
              {(formData.emergencyContact?.name || formData.emergencyContact?.phone) && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.emergencyContact?.name && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Name</p>
                        <p className="text-sm text-gray-900">{formData.emergencyContact.name}</p>
                      </div>
                    )}
                    {formData.emergencyContact?.relationship && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Relationship</p>
                        <p className="text-sm text-gray-900">{formData.emergencyContact.relationship}</p>
                      </div>
                    )}
                    {formData.emergencyContact?.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{formData.emergencyContact.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Mode</p>
                    <p className="text-sm text-gray-900">{formData.paymentMode.charAt(0).toUpperCase() + formData.paymentMode.slice(1)}</p>
                  </div>
                  
                  {formData.paymentMode === 'nhif' && formData.paymentDetails?.nhifNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">NHIF Number</p>
                      <p className="text-sm text-gray-900">{formData.paymentDetails.nhifNumber}</p>
                    </div>
                  )}
                  
                  {formData.paymentMode === 'insurance' && (
                    <>
                      {formData.paymentDetails?.insuranceProvider && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Insurance Provider</p>
                          <p className="text-sm text-gray-900">{formData.paymentDetails.insuranceProvider}</p>
                        </div>
                      )}
                      {formData.paymentDetails?.insurancePolicyNumber && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Policy Number</p>
                          <p className="text-sm text-gray-900">{formData.paymentDetails.insurancePolicyNumber}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {formData.paymentMode === 'corporate' && formData.paymentDetails?.corporateName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Corporate Name</p>
                      <p className="text-sm text-gray-900">{formData.paymentDetails.corporateName}</p>
                    </div>
                  )}
                  
                  {formData.paymentMode === 'waiver' && formData.paymentDetails?.waiverReason && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">Waiver Reason</p>
                      <p className="text-sm text-gray-900">{formData.paymentDetails.waiverReason}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Emergency Details */}
              {formData.emergencyDetails?.chiefComplaint && (
                <div className="mt-4 p-4 border border-error-200 rounded-lg bg-error-50">
                  <h3 className="text-sm font-medium text-error-800 mb-2">Emergency Details</h3>
                  <p className="text-sm text-error-700">{formData.emergencyDetails.chiefComplaint}</p>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Progress indicator
  const renderProgressIndicator = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-5">
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
          <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Info</div>
          <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Contact</div>
          <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Payment</div>
          <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Review</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">Patient Registration</h1>
                <p className="text-sm text-gray-500">Register a new patient in the system</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Error Message */}
        {formError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-5 flex items-start">
            <AlertTriangle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}
        
        {/* Progress Indicator */}
        {renderProgressIndicator()}
        
        {/* Form Steps */}
        {renderFormStep()}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Cancel
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center"
              disabled={
                (currentStep === 1 && !watch('firstName') && !watch('lastName')) ||
                (currentStep === 3 && 
                  ((paymentMode === 'nhif' && !watch('paymentDetails.nhifNumber')) ||
                   (paymentMode === 'insurance' && (!watch('paymentDetails.insuranceProvider') || !watch('paymentDetails.insurancePolicyNumber'))) ||
                   (paymentMode === 'corporate' && !watch('paymentDetails.corporateName')) ||
                   (paymentMode === 'waiver' && !watch('paymentDetails.waiverReason')))
                )
              }
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
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