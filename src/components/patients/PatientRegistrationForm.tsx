import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../lib/store';
import { v4 as uuidv4 } from 'uuid';
import { saveData } from '../../lib/storage';

interface PatientRegistrationFormData {
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
    allergies: boolean;
    allergyDetails: string;
    chronicConditions: string[];
    otherConditions: string;
    currentMedications: string;
    pastSurgeries: string;
    familyHistory: string;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PatientRegistrationFormData>();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasAllergies = watch('medicalHistory.allergies');
  const chronicConditions = watch('medicalHistory.chronicConditions') || [];

  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create patient object
      const patientId = uuidv4();
      const patient = {
        id: patientId,
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
        medical_info: {
          allergies: hasAllergies ? data.medicalHistory.allergyDetails.split(',').map(a => ({
            allergen: a.trim(),
            reaction: 'Unknown',
            severity: 'unknown'
          })) : [],
          chronicConditions: chronicConditions,
          currentMedications: data.medicalHistory.currentMedications ? 
            data.medicalHistory.currentMedications.split(',').map(m => ({
              name: m.trim(),
              dosage: 'Unknown',
              frequency: 'Unknown'
            })) : [],
          pastSurgeries: data.medicalHistory.pastSurgeries,
          familyHistory: data.medicalHistory.familyHistory
        },
        status: 'active',
        current_flow_step: 'registration',
        created_at: new Date().toISOString()
      };
      
      // Save to local storage
      await saveData('patients', patient, patientId);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Navigate to patient list
      navigate('/patients');
    } catch (error: any) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Error registering patient: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="form-label required">First Name</label>
              <input
                id="firstName"
                type="text"
                {...register('firstName', { required: 'First name is required' })}
                className={`form-input ${errors.firstName ? 'border-error-300' : ''}`}
              />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            
            <div>
              <label htmlFor="lastName" className="form-label required">Last Name</label>
              <input
                id="lastName"
                type="text"
                {...register('lastName', { required: 'Last name is required' })}
                className={`form-input ${errors.lastName ? 'border-error-300' : ''}`}
              />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
            
            <div>
              <label htmlFor="dateOfBirth" className="form-label required">Date of Birth</label>
              <input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className={`form-input ${errors.dateOfBirth ? 'border-error-300' : ''}`}
              />
              {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
            </div>
            
            <div>
              <label htmlFor="gender" className="form-label required">Gender</label>
              <select
                id="gender"
                {...register('gender', { required: 'Gender is required' })}
                className={`form-input ${errors.gender ? 'border-error-300' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender.message}</p>}
            </div>
            
            <div>
              <label htmlFor="contactNumber" className="form-label required">Contact Number</label>
              <input
                id="contactNumber"
                type="tel"
                {...register('contactNumber', { required: 'Contact number is required' })}
                className={`form-input ${errors.contactNumber ? 'border-error-300' : ''}`}
              />
              {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="form-input"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="address" className="form-label required">Address</label>
              <textarea
                id="address"
                rows={3}
                {...register('address', { required: 'Address is required' })}
                className={`form-input ${errors.address ? 'border-error-300' : ''}`}
              />
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="emergencyContactName" className="form-label required">Name</label>
              <input
                id="emergencyContactName"
                type="text"
                {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                className={`form-input ${errors.emergencyContactName ? 'border-error-300' : ''}`}
              />
              {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
            </div>
            
            <div>
              <label htmlFor="emergencyContactRelationship" className="form-label required">Relationship</label>
              <input
                id="emergencyContactRelationship"
                type="text"
                {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
                className={`form-input ${errors.emergencyContactRelationship ? 'border-error-300' : ''}`}
              />
              {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
            </div>
            
            <div>
              <label htmlFor="emergencyContactPhone" className="form-label required">Phone Number</label>
              <input
                id="emergencyContactPhone"
                type="tel"
                {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                className={`form-input ${errors.emergencyContactPhone ? 'border-error-300' : ''}`}
              />
              {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medical History</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center">
                <input
                  id="allergies"
                  type="checkbox"
                  {...register('medicalHistory.allergies')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="allergies" className="ml-2 block text-sm text-gray-900">
                  Does the patient have any allergies?
                </label>
              </div>
              
              {hasAllergies && (
                <div className="mt-3">
                  <label htmlFor="allergyDetails" className="form-label">Allergy Details</label>
                  <textarea
                    id="allergyDetails"
                    rows={2}
                    {...register('medicalHistory.allergyDetails')}
                    className="form-input"
                    placeholder="List allergies, separated by commas"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="form-label">Chronic Conditions</label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center">
                  <input
                    id="diabetes"
                    type="checkbox"
                    value="Diabetes"
                    {...register('medicalHistory.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="diabetes" className="ml-2 block text-sm text-gray-900">
                    Diabetes
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="hypertension"
                    type="checkbox"
                    value="Hypertension"
                    {...register('medicalHistory.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hypertension" className="ml-2 block text-sm text-gray-900">
                    Hypertension
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="asthma"
                    type="checkbox"
                    value="Asthma"
                    {...register('medicalHistory.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="asthma" className="ml-2 block text-sm text-gray-900">
                    Asthma
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="heartDisease"
                    type="checkbox"
                    value="Heart Disease"
                    {...register('medicalHistory.chronicConditions')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="heartDisease" className="ml-2 block text-sm text-gray-900">
                    Heart Disease
                  </label>
                </div>
              </div>
              
              <div className="mt-3">
                <label htmlFor="otherConditions" className="form-label">Other Conditions</label>
                <textarea
                  id="otherConditions"
                  rows={2}
                  {...register('medicalHistory.otherConditions')}
                  className="form-input"
                  placeholder="List any other conditions"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="currentMedications" className="form-label">Current Medications</label>
              <textarea
                id="currentMedications"
                rows={2}
                {...register('medicalHistory.currentMedications')}
                className="form-input"
                placeholder="List current medications, separated by commas"
              />
            </div>
            
            <div>
              <label htmlFor="pastSurgeries" className="form-label">Past Surgeries</label>
              <textarea
                id="pastSurgeries"
                rows={2}
                {...register('medicalHistory.pastSurgeries')}
                className="form-input"
                placeholder="List any past surgeries"
              />
            </div>
            
            <div>
              <label htmlFor="familyHistory" className="form-label">Family History</label>
              <textarea
                id="familyHistory"
                rows={2}
                {...register('medicalHistory.familyHistory')}
                className="form-input"
                placeholder="List any relevant family medical history"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Registering...
              </>
            ) : (
              'Complete Registration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;