import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Save, 
  ArrowLeft,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';

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
  isEmergency: boolean;
}

const PatientRegistrationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  
  // Patient storage hook
  const { 
    saveItem: savePatient,
    error: patientError
  } = useHybridStorage<any>('patients');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PatientRegistrationFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      isEmergency: false
    }
  });
  
  const watchIsEmergency = watch('isEmergency');
  
  useEffect(() => {
    // Update local state when form value changes
    setIsEmergency(watchIsEmergency);
  }, [watchIsEmergency]);
  
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
      
      // Validate required fields for non-emergency cases
      if (!data.isEmergency) {
        if (!data.dateOfBirth) {
          setFormError("Date of birth is required");
          setIsLoading(false);
          return;
        }
        
        if (!data.contactNumber) {
          setFormError("Contact number is required");
          setIsLoading(false);
          return;
        }
        
        if (!data.address) {
          setFormError("Address is required");
          setIsLoading(false);
          return;
        }
        
        if (!data.emergencyContact.name || !data.emergencyContact.phone) {
          setFormError("Emergency contact information is required");
          setIsLoading(false);
          return;
        }
      }
      
      // Create a unique ID for the patient record
      const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Set initial flow step based on emergency status
      const initialFlowStep = data.isEmergency ? 'emergency' : 'registration';
      
      // Create patient record
      const patientRecord = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date().toISOString().split('T')[0], // Default to today if emergency
        gender: data.gender,
        contact_number: data.contactNumber || 'Unknown', // Default for emergency
        email: data.email,
        address: data.address || 'Unknown', // Default for emergency
        emergency_contact: data.isEmergency ? {
          name: data.emergencyContact.name || 'Unknown',
          relationship: data.emergencyContact.relationship || 'Unknown',
          phone: data.emergencyContact.phone || 'Unknown'
        } : data.emergencyContact,
        medical_history: {
          allergies: [],
          chronicConditions: [],
          currentMedications: []
        },
        status: 'active',
        current_flow_step: initialFlowStep,
        priority_level: data.isEmergency ? 'critical' : 'normal',
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      // Save the patient record
      await savePatient(patientRecord, patientId);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Navigate based on emergency status
      if (data.isEmergency) {
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
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              {isEmergency ? 'Emergency Patient Registration' : 'Patient Registration'}
            </h1>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isEmergency"
                {...register('isEmergency')}
                className="h-4 w-4 text-error-600 focus:ring-error-500 border-gray-300 rounded"
              />
              <label htmlFor="isEmergency" className="ml-2 flex items-center text-sm font-medium text-error-700">
                <AlertTriangle className="h-4 w-4 mr-1 text-error-500" />
                Emergency Case
              </label>
            </div>
          </div>
          
          {isEmergency && (
            <div className="mt-3 bg-error-50 border border-error-200 text-error-700 px-3 py-2 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-error-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Emergency Registration</p>
                <p className="text-sm">Only name is required. Other details can be completed later.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Form Error Message */}
        {formError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          
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
              {errors.firstName && (
                <p className="form-error">{errors.firstName.message}</p>
              )}
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
              {errors.lastName && (
                <p className="form-error">{errors.lastName.message}</p>
              )}
            </div>
            
            <div className={isEmergency ? 'opacity-60' : ''}>
              <label className={`form-label ${!isEmergency ? 'required' : ''}`}>Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  {...register('dateOfBirth', { required: !isEmergency })}
                  className={`form-input pl-10 ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="form-error">{errors.dateOfBirth.message}</p>
              )}
              {isEmergency && (
                <p className="text-xs text-gray-500 mt-1">Can be completed later</p>
              )}
            </div>
            
            <div>
              <label className="form-label required">Gender</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="form-error">{errors.gender.message}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 ${isEmergency ? 'opacity-60' : ''}`}>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={`form-label ${!isEmergency ? 'required' : ''}`}>Contact Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('contactNumber', { required: !isEmergency })}
                  className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter contact number"
                />
              </div>
              {errors.contactNumber && (
                <p className="form-error">{errors.contactNumber.message}</p>
              )}
              {isEmergency && (
                <p className="text-xs text-gray-500 mt-1">Can be completed later</p>
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
                  {...register('email')}
                  className="form-input pl-10"
                  placeholder="Enter email address (optional)"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label className={`form-label ${!isEmergency ? 'required' : ''}`}>Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  {...register('address', { required: !isEmergency })}
                  className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={3}
                  placeholder="Enter complete address"
                />
              </div>
              {errors.address && (
                <p className="form-error">{errors.address.message}</p>
              )}
              {isEmergency && (
                <p className="text-xs text-gray-500 mt-1">Can be completed later</p>
              )}
            </div>
          </div>
        </div>
        
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 ${isEmergency ? 'opacity-60' : ''}`}>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={`form-label ${!isEmergency ? 'required' : ''}`}>Contact Name</label>
              <input
                type="text"
                {...register('emergencyContact.name', { required: !isEmergency })}
                className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="Enter emergency contact name"
              />
              {errors.emergencyContact?.name && (
                <p className="form-error">{errors.emergencyContact.name.message}</p>
              )}
              {isEmergency && (
                <p className="text-xs text-gray-500 mt-1">Can be completed later</p>
              )}
            </div>
            
            <div>
              <label className="form-label">Relationship</label>
              <input
                type="text"
                {...register('emergencyContact.relationship')}
                className="form-input"
                placeholder="Enter relationship (e.g., Spouse, Parent)"
              />
            </div>
            
            <div>
              <label className={`form-label ${!isEmergency ? 'required' : ''}`}>Contact Phone</label>
              <input
                type="tel"
                {...register('emergencyContact.phone', { required: !isEmergency })}
                className={`form-input ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="Enter emergency contact phone"
              />
              {errors.emergencyContact?.phone && (
                <p className="form-error">{errors.emergencyContact.phone.message}</p>
              )}
              {isEmergency && (
                <p className="text-xs text-gray-500 mt-1">Can be completed later</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`btn flex items-center ${isEmergency ? 'btn-error' : 'btn-primary'}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : isEmergency ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Register as Emergency
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
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