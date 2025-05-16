import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { v4 as uuidv4 } from 'uuid';
import { saveData } from '../../lib/storage';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Save, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface PatientFormData {
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
  medicalHistory: {
    allergies: string;
    chronicConditions: string;
    currentMedications: string;
    pastSurgeries: string;
    familyHistory: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormData>();
  const navigate = useNavigate();
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      // Format the data for storage
      const patientData = {
        id: uuidv4(),
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
        medical_history: {
          allergies: data.medicalHistory.allergies ? data.medicalHistory.allergies.split(',').map(a => a.trim()) : [],
          chronicConditions: data.medicalHistory.chronicConditions ? data.medicalHistory.chronicConditions.split(',').map(c => c.trim()) : [],
          currentMedications: data.medicalHistory.currentMedications ? data.medicalHistory.currentMedications.split(',').map(m => ({ name: m.trim() })) : [],
          pastSurgeries: data.medicalHistory.pastSurgeries ? data.medicalHistory.pastSurgeries.split(',').map(s => s.trim()) : [],
          familyHistory: data.medicalHistory.familyHistory || ''
        },
        status: 'active',
        current_flow_step: 'registration',
        created_at: new Date().toISOString()
      };

      // Save to local storage
      await saveData('patients', patientData);

      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });

      // Navigate to the patient list
      navigate('/patients');
    } catch (error) {
      console.error('Error registering patient:', error);
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => navigate('/patients')}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Patient Registration</h1>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary inline-flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Register Patient
                </>
              )}
            </button>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              {errors.gender && <p className="form-error">{errors.gender.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  {...register('email', { 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`form-input pl-10 ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter email address (optional)"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
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
                  rows={3}
                  placeholder="Enter complete address"
                />
              </div>
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="form-label required">Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                  className={`form-input pl-10 ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter emergency contact name"
                />
              </div>
              {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
            </div>

            <div>
              <label className="form-label required">Relationship</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
                  className={`form-input pl-10 ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="e.g., Spouse, Parent, Child"
                />
              </div>
              {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
            </div>

            <div>
              <label className="form-label required">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                  className={`form-input pl-10 ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter emergency contact phone"
                />
              </div>
              {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medical History</h2>
          <div className="space-y-6">
            <div>
              <label className="form-label">Allergies</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('medicalHistory.allergies')}
                  className="form-input pl-10"
                  placeholder="List allergies, separated by commas"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Chronic Conditions</label>
              <input
                type="text"
                {...register('medicalHistory.chronicConditions')}
                className="form-input"
                placeholder="List chronic conditions, separated by commas"
              />
            </div>

            <div>
              <label className="form-label">Current Medications</label>
              <input
                type="text"
                {...register('medicalHistory.currentMedications')}
                className="form-input"
                placeholder="List current medications, separated by commas"
              />
            </div>

            <div>
              <label className="form-label">Past Surgeries</label>
              <input
                type="text"
                {...register('medicalHistory.pastSurgeries')}
                className="form-input"
                placeholder="List past surgeries, separated by commas"
              />
            </div>

            <div>
              <label className="form-label">Family History</label>
              <textarea
                {...register('medicalHistory.familyHistory')}
                className="form-input"
                rows={3}
                placeholder="Enter relevant family medical history"
              />
            </div>
          </div>
        </div>

        {/* Submit Button (Mobile) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sm:hidden">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full inline-flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
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