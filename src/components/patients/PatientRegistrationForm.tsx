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
  Clock
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
  patientType: string;
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
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    error: patientError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientRegistrationFormData>({
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
      patientType: 'regular'
    }
  });

  const patientType = watch('patientType');
  
  // Display error notification if there's a patient error
  useEffect(() => {
    if (patientError) {
      addNotification({
        message: `Error with patient data: ${patientError.message}`,
        type: 'error'
      });
    }
  }, [patientError, addNotification]);
  
  const onSubmit = async (data: PatientRegistrationFormData) => {
    try {
      setIsLoading(true);
      setFormError(null);
      
      console.log('Patient registration form submitted:', data);
      
      // Create a unique ID for the patient record
      const patientId = uuidv4();
      
      // Determine the initial flow step based on patient type
      let initialFlowStep = 'registration';
      let priorityLevel = 'normal';
      
      if (data.patientType === 'emergency') {
        initialFlowStep = 'emergency';
        priorityLevel = 'critical';
      }
      
      // Create patient record
      const patientRecord = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email,
        address: data.address,
        emergency_contact: data.emergencyContact,
        medical_history: null,
        status: 'active',
        current_flow_step: initialFlowStep,
        priority_level: priorityLevel,
        created_at: new Date().toISOString(),
        chief_complaint: data.emergencyDetails?.chiefComplaint || null
      };
      
      // Save the patient record
      await savePatient(patientRecord, patientId);
      
      // Show success notification
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
      // Redirect to the appropriate page based on patient type
      if (data.patientType === 'emergency') {
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}
        
        {/* Patient Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                patientType === 'regular' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setValue('patientType', 'regular')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id="regular"
                  {...register('patientType')}
                  value="regular"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  checked={patientType === 'regular'}
                  onChange={() => {}}
                />
                <label htmlFor="regular" className="ml-2 block text-sm font-medium text-gray-900">
                  Regular Patient
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 ml-6">
                Standard registration for non-emergency patients
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
                Expedited registration for emergency patients
              </p>
            </div>
          </div>
          
          {patientType === 'emergency' && (
            <div className="mt-4 p-4 border border-error-200 rounded-lg bg-error-50">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-error-800">Emergency Registration</h3>
                  <p className="mt-1 text-sm text-error-700">
                    This patient will be prioritized in the system. Please complete the basic information below and provide emergency details.
                  </p>
                </div>
              </div>
              
              <div className="mt-3 space-y-3">
                <div>
                  <label className="form-label required">Chief Complaint</label>
                  <textarea
                    {...register('emergencyDetails.chiefComplaint', { 
                      required: patientType === 'emergency' ? 'Chief complaint is required for emergency patients' : false 
                    })}
                    className={`form-input ${errors.emergencyDetails?.chiefComplaint ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    rows={2}
                    placeholder="Describe the emergency condition"
                  />
                  {errors.emergencyDetails?.chiefComplaint && (
                    <p className="form-error">{errors.emergencyDetails.chiefComplaint.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Referred By</label>
                    <input
                      type="text"
                      {...register('emergencyDetails.referredBy')}
                      className="form-input"
                      placeholder="Doctor or facility name"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Referred From</label>
                    <input
                      type="text"
                      {...register('emergencyDetails.referredFrom')}
                      className="form-input"
                      placeholder="Hospital or clinic name"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            
            <div>
              <label className="form-label required">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
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
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <label className="form-label required">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={3}
                  placeholder="Enter full address"
                />
              </div>
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="form-label required">Contact Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                  className={`form-input pl-10 ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter emergency contact name"
                />
              </div>
              {errors.emergencyContact?.name && <p className="form-error">{errors.emergencyContact.name.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Relationship</label>
              <input
                type="text"
                {...register('emergencyContact.relationship', { required: 'Relationship is required' })}
                className={`form-input ${errors.emergencyContact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="e.g., Spouse, Parent, Sibling"
              />
              {errors.emergencyContact?.relationship && <p className="form-error">{errors.emergencyContact.relationship.message}</p>}
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
                  placeholder="Enter emergency contact phone"
                />
              </div>
              {errors.emergencyContact?.phone && <p className="form-error">{errors.emergencyContact.phone.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Cancel
          </button>
          
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
                Register Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;