import React, { useState } from 'react';
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
  ChevronRight, 
  ChevronLeft,
  Save,
  CreditCard,
  Wallet,
  Building2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PatientRegistrationFormData {
  patientType: 'new' | 'existing';
  existingPatientId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    contactNumber: string;
    email: string;
    address: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    bloodType: string;
    smoker: boolean;
    alcoholConsumption: string;
  };
  patientPriority: 'normal' | 'urgent' | 'critical';
  paymentMethod: 'cash' | 'insurance' | 'credit_card' | 'mobile_payment';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    holderName: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use the hybrid storage hook for patients
  const { saveItem, fetchItems } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      patientType: 'new',
      personalInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        contactNumber: '',
        email: '',
        address: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalInfo: {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        bloodType: '',
        smoker: false,
        alcoholConsumption: 'none'
      },
      patientPriority: 'normal',
      paymentMethod: 'cash'
    }
  });
  
  const patientType = watch('patientType');
  const paymentMethod = watch('paymentMethod');
  
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    try {
      const patients = await fetchItems({ search: searchTerm });
      setSearchResults(Array.isArray(patients) ? patients : []);
    } catch (error) {
      console.error('Error searching patients:', error);
      addNotification({
        message: 'Failed to search patients',
        type: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectExistingPatient = (patient: any) => {
    setValue('existingPatientId', patient.id);
    setValue('personalInfo', {
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      contactNumber: patient.contact_number,
      email: patient.email || '',
      address: patient.address
    });
    setValue('emergencyContact', patient.emergency_contact);
    setValue('medicalInfo', patient.medical_info || {
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      bloodType: '',
      smoker: false,
      alcoholConsumption: 'none'
    });
    setSearchResults([]);
    setSearchTerm('');
    
    // Move to next step after selecting a patient
    setCurrentStep(2);
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsSubmitting(true);
    
    try {
      // If it's an existing patient, update their record
      if (data.patientType === 'existing' && data.existingPatientId) {
        // Format the data for the existing patient
        const updatedPatient = {
          id: data.existingPatientId,
          first_name: data.personalInfo.firstName,
          last_name: data.personalInfo.lastName,
          date_of_birth: data.personalInfo.dateOfBirth,
          gender: data.personalInfo.gender,
          contact_number: data.personalInfo.contactNumber,
          email: data.personalInfo.email,
          address: data.personalInfo.address,
          emergency_contact: data.emergencyContact,
          medical_info: data.medicalInfo,
          status: 'active',
          current_flow_step: 'registration', // Set to registration so they can be triaged next
          priority_level: data.patientPriority,
          payment_method: data.paymentMethod,
          insurance_info: data.paymentMethod === 'insurance' ? data.insuranceInfo : null
        };
        
        // Save the updated patient
        await saveItem(updatedPatient, data.existingPatientId);
        
        addNotification({
          message: 'Patient information updated successfully',
          type: 'success'
        });
        
        // Navigate to triage for this patient
        navigate(`/patients/${data.existingPatientId}/triage`);
      } else {
        // Format the data for a new patient
        const newPatient = {
          id: uuidv4(), // Generate a new UUID for the patient
          first_name: data.personalInfo.firstName,
          last_name: data.personalInfo.lastName,
          date_of_birth: data.personalInfo.dateOfBirth,
          gender: data.personalInfo.gender,
          contact_number: data.personalInfo.contactNumber,
          email: data.personalInfo.email,
          address: data.personalInfo.address,
          emergency_contact: data.emergencyContact,
          medical_info: data.medicalInfo,
          status: 'active',
          current_flow_step: 'registration', // Set to registration so they can be triaged next
          priority_level: data.patientPriority,
          payment_method: data.paymentMethod,
          insurance_info: data.paymentMethod === 'insurance' ? data.insuranceInfo : null,
          created_at: new Date().toISOString()
        };
        
        // Save the new patient
        const savedPatient = await saveItem(newPatient, newPatient.id);
        
        addNotification({
          message: 'Patient registered successfully',
          type: 'success'
        });
        
        // Navigate to triage for this patient
        navigate(`/patients/${savedPatient.id}/triage`);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
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
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === step
                    ? 'bg-primary-500 text-white'
                    : currentStep > step
                    ? 'bg-success-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                <span className="mt-2 text-xs text-gray-500">
                  {step === 1 && 'Patient Info'}
                  {step === 2 && 'Priority'}
                  {step === 3 && 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Step 1: Patient Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="newPatient"
                    value="new"
                    {...register('patientType')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="newPatient" className="ml-2 block text-sm text-gray-700">
                    New Patient
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="existingPatient"
                    value="existing"
                    {...register('patientType')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="existingPatient" className="ml-2 block text-sm text-gray-700">
                    Existing Patient
                  </label>
                </div>
              </div>
              
              {patientType === 'existing' && (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input flex-1"
                      placeholder="Search by name, phone, or ID"
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="btn btn-primary"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {searchResults.map((patient) => (
                            <tr key={patient.id}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {patient.first_name} {patient.last_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {new Date(patient.date_of_birth).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {patient.contact_number}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => selectExistingPatient(patient)}
                                  className="text-primary-600 hover:text-primary-900"
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
                    <div className="text-sm text-gray-500 mt-2">
                      No patients found. Please try a different search term or register as a new patient.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {(patientType === 'new' || (patientType === 'existing' && watch('existingPatientId'))) && (
              <>
                <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label required">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('personalInfo.firstName', { required: 'First name is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                    </div>
                    {errors.personalInfo?.firstName && (
                      <p className="form-error">{errors.personalInfo.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Last Name</label>
                    <input
                      type="text"
                      {...register('personalInfo.lastName', { required: 'Last name is required' })}
                      className={`form-input ${errors.personalInfo?.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                    {errors.personalInfo?.lastName && (
                      <p className="form-error">{errors.personalInfo.lastName.message}</p>
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
                        {...register('personalInfo.dateOfBirth', { required: 'Date of birth is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                    </div>
                    {errors.personalInfo?.dateOfBirth && (
                      <p className="form-error">{errors.personalInfo.dateOfBirth.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Gender</label>
                    <select
                      {...register('personalInfo.gender', { required: 'Gender is required' })}
                      className={`form-input ${errors.personalInfo?.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.personalInfo?.gender && (
                      <p className="form-error">{errors.personalInfo.gender.message}</p>
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
                        {...register('personalInfo.contactNumber', { required: 'Contact number is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                    </div>
                    {errors.personalInfo?.contactNumber && (
                      <p className="form-error">{errors.personalInfo.contactNumber.message}</p>
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
                        {...register('personalInfo.email')}
                        className="form-input pl-10"
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
                        {...register('personalInfo.address', { required: 'Address is required' })}
                        className={`form-input pl-10 ${errors.personalInfo?.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        rows={2}
                      />
                    </div>
                    {errors.personalInfo?.address && (
                      <p className="form-error">{errors.personalInfo.address.message}</p>
                    )}
                  </div>
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Emergency Contact</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label required">Name</label>
                    <input
                      type="text"
                      {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                      className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
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
                      className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    />
                    {errors.emergencyContact?.relationship && (
                      <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label required">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                        className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      />
                    </div>
                    {errors.emergencyContact?.phone && (
                      <p className="form-error">{errors.emergencyContact.phone.message}</p>
                    )}
                  </div>
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Medical Information</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label">Blood Type</label>
                    <select
                      {...register('medicalInfo.bloodType')}
                      className="form-input"
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
                    <label className="form-label">Allergies</label>
                    <input
                      type="text"
                      placeholder="Separate with commas"
                      className="form-input"
                      onChange={(e) => {
                        const allergies = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                        setValue('medicalInfo.allergies', allergies);
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Chronic Conditions</label>
                    <input
                      type="text"
                      placeholder="Separate with commas"
                      className="form-input"
                      onChange={(e) => {
                        const conditions = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                        setValue('medicalInfo.chronicConditions', conditions);
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Current Medications</label>
                    <input
                      type="text"
                      placeholder="Separate with commas"
                      className="form-input"
                      onChange={(e) => {
                        const medications = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                        setValue('medicalInfo.currentMedications', medications);
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Smoker</label>
                    <div className="flex space-x-4 mt-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="smokerYes"
                          value="true"
                          {...register('medicalInfo.smoker')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          onChange={() => setValue('medicalInfo.smoker', true)}
                        />
                        <label htmlFor="smokerYes" className="ml-2 block text-sm text-gray-700">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="smokerNo"
                          value="false"
                          {...register('medicalInfo.smoker')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          onChange={() => setValue('medicalInfo.smoker', false)}
                        />
                        <label htmlFor="smokerNo" className="ml-2 block text-sm text-gray-700">
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Alcohol Consumption</label>
                    <select
                      {...register('medicalInfo.alcoholConsumption')}
                      className="form-input"
                    >
                      <option value="none">None</option>
                      <option value="occasional">Occasional</option>
                      <option value="moderate">Moderate</option>
                      <option value="heavy">Heavy</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Step 2: Patient Priority and Payment Method */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Priority</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  watch('patientPriority') === 'normal' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('patientPriority', 'normal')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Normal</h3>
                  <div className={`w-5 h-5 rounded-full ${
                    watch('patientPriority') === 'normal' ? 'bg-success-500' : 'bg-gray-200'
                  }`}></div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Standard priority for routine cases</p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  watch('patientPriority') === 'urgent' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('patientPriority', 'urgent')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Urgent</h3>
                  <div className={`w-5 h-5 rounded-full ${
                    watch('patientPriority') === 'urgent' ? 'bg-warning-500' : 'bg-gray-200'
                  }`}></div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Requires prompt attention</p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  watch('patientPriority') === 'critical' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('patientPriority', 'critical')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Critical</h3>
                  <div className={`w-5 h-5 rounded-full ${
                    watch('patientPriority') === 'critical' ? 'bg-error-500' : 'bg-gray-200'
                  }`}></div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Immediate medical attention required</p>
                {watch('patientPriority') === 'critical' && (
                  <div className="mt-2 flex items-center text-error-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Will be directed to emergency care</span>
                  </div>
                )}
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'cash')}
              >
                <div className="flex items-center mb-2">
                  <Wallet className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">Cash</h3>
                </div>
                <p className="text-xs text-gray-500">Pay with cash at the facility</p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'insurance')}
              >
                <div className="flex items-center mb-2">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">Insurance</h3>
                </div>
                <p className="text-xs text-gray-500">Bill to insurance provider</p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'credit_card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'credit_card')}
              >
                <div className="flex items-center mb-2">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">Credit Card</h3>
                </div>
                <p className="text-xs text-gray-500">Pay with credit/debit card</p>
              </div>
              
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'mobile_payment' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('paymentMethod', 'mobile_payment')}
              >
                <div className="flex items-center mb-2">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">Mobile Payment</h3>
                </div>
                <p className="text-xs text-gray-500">Pay with mobile payment app</p>
              </div>
            </div>
            
            {paymentMethod === 'insurance' && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Insurance Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label required">Insurance Provider</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.provider', { 
                        required: paymentMethod === 'insurance' ? 'Provider name is required' : false 
                      })}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label required">Policy Number</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.policyNumber', { 
                        required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                      })}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Group Number</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.groupNumber')}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label required">Policy Holder Name</label>
                    <input
                      type="text"
                      {...register('insuranceInfo.holderName', { 
                        required: paymentMethod === 'insurance' ? 'Policy holder name is required' : false 
                      })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Review Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Personal Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('personalInfo.firstName')} {watch('personalInfo.lastName')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('personalInfo.dateOfBirth')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Gender:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('personalInfo.gender')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('personalInfo.contactNumber')}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-gray-500">Address:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('personalInfo.address')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Emergency Contact</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('emergencyContact.name')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Relationship:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('emergencyContact.relationship')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('emergencyContact.phone')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Priority & Payment</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Priority:</span>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        watch('patientPriority') === 'normal' ? 'bg-success-100 text-success-800' :
                        watch('patientPriority') === 'urgent' ? 'bg-warning-100 text-warning-800' :
                        'bg-error-100 text-error-800'
                      }`}>
                        {watch('patientPriority').charAt(0).toUpperCase() + watch('patientPriority').slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Payment Method:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('paymentMethod').replace('_', ' ').charAt(0).toUpperCase() + watch('paymentMethod').replace('_', ' ').slice(1)}
                      </span>
                    </div>
                    
                    {watch('paymentMethod') === 'insurance' && (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Insurance Provider:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {watch('insuranceInfo.provider')}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Policy Number:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {watch('insuranceInfo.policyNumber')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Medical Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 gap-2">
                    {watch('medicalInfo.allergies').length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Allergies:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('medicalInfo.allergies').join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {watch('medicalInfo.chronicConditions').length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Chronic Conditions:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('medicalInfo.chronicConditions').join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {watch('medicalInfo.currentMedications').length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Current Medications:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('medicalInfo.currentMedications').join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {watch('medicalInfo.bloodType') && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Blood Type:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {watch('medicalInfo.bloodType')}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Smoker:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('medicalInfo.smoker') ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Alcohol Consumption:</span>
                      <span className="text-sm text-gray-900 ml-2">
                        {watch('medicalInfo.alcoholConsumption').charAt(0).toUpperCase() + watch('medicalInfo.alcoholConsumption').slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
          ) : (
            <div></div>
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center"
              disabled={patientType === 'existing' && !watch('existingPatientId') && currentStep === 1}
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
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