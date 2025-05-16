import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { v4 as uuidv4 } from 'uuid';

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
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveItem } = useHybridStorage('patients');
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      gender: 'male',
      medicalHistory: {
        allergies: false,
        chronicConditions: [],
      }
    }
  });
  
  const hasAllergies = watch('medicalHistory.allergies');
  
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
        medical_info: {
          allergies: hasAllergies ? data.medicalHistory.allergyDetails.split(',').map(a => ({
            allergen: a.trim(),
            reaction: '',
            severity: 'unknown'
          })) : [],
          chronicConditions: data.medicalHistory.chronicConditions || [],
          currentMedications: data.medicalHistory.currentMedications ? 
            data.medicalHistory.currentMedications.split(',').map(m => ({
              name: m.trim(),
              dosage: '',
              frequency: ''
            })) : [],
          pastSurgeries: data.medicalHistory.pastSurgeries,
          familyHistory: data.medicalHistory.familyHistory,
          otherConditions: data.medicalHistory.otherConditions
        },
        status: 'active',
        current_flow_step: 'registration',
        created_at: new Date().toISOString()
      };
      
      // Save the patient data
      await saveItem(patientData);
      
      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
      // Navigate to the patient list
      navigate('/patients');
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-primary-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and contact information</p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="firstName" className="form-label required">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  {...register('firstName', { required: 'First name is required' })}
                  className={`form-input ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="lastName" className="form-label required">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="dateOfBirth" className="form-label required">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  className={`form-input ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="gender" className="form-label required">Gender</label>
                <select
                  id="gender"
                  {...register('gender', { required: 'Gender is required' })}
                  className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="form-error">{errors.gender.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="contactNumber" className="form-label required">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  {...register('contactNumber', { required: 'Contact number is required' })}
                  className={`form-input ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className="form-input"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="form-label required">Address</label>
                <textarea
                  id="address"
                  rows={3}
                  {...register('address', { required: 'Address is required' })}
                  className={`form-input ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.address && <p className="form-error">{errors.address.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-primary-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Emergency Contact</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Person to contact in case of emergency</p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="emergencyContactName" className="form-label required">Name</label>
                <input
                  type="text"
                  id="emergencyContactName"
                  {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                  className={`form-input ${errors.emergencyContactName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="emergencyContactRelationship" className="form-label required">Relationship</label>
                <input
                  type="text"
                  id="emergencyContactRelationship"
                  {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
                  className={`form-input ${errors.emergencyContactRelationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="emergencyContactPhone" className="form-label required">Phone Number</label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                  className={`form-input ${errors.emergencyContactPhone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-primary-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Medical History</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Health information and pre-existing conditions</p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="allergies"
                      type="checkbox"
                      {...register('medicalHistory.allergies')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="allergies" className="font-medium text-gray-700">Allergies</label>
                    <p className="text-gray-500">Does the patient have any known allergies?</p>
                  </div>
                </div>
                
                {hasAllergies && (
                  <div className="mt-3">
                    <label htmlFor="allergyDetails" className="form-label">Allergy Details</label>
                    <textarea
                      id="allergyDetails"
                      {...register('medicalHistory.allergyDetails', { 
                        required: hasAllergies ? 'Please provide allergy details' : false 
                      })}
                      className={`form-input ${errors.medicalHistory?.allergyDetails ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="List allergies, separated by commas"
                    />
                    {errors.medicalHistory?.allergyDetails && <p className="form-error">{errors.medicalHistory.allergyDetails.message}</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Chronic Conditions</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="diabetes"
                        type="checkbox"
                        value="Diabetes"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="diabetes" className="font-medium text-gray-700">Diabetes</label>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="hypertension"
                        type="checkbox"
                        value="Hypertension"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="hypertension" className="font-medium text-gray-700">Hypertension</label>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="asthma"
                        type="checkbox"
                        value="Asthma"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="asthma" className="font-medium text-gray-700">Asthma</label>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="heartDisease"
                        type="checkbox"
                        value="Heart Disease"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="heartDisease" className="font-medium text-gray-700">Heart Disease</label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="otherConditions" className="form-label">Other Medical Conditions</label>
                <textarea
                  id="otherConditions"
                  {...register('medicalHistory.otherConditions')}
                  className="form-input"
                  placeholder="List any other medical conditions"
                />
              </div>

              <div>
                <label htmlFor="currentMedications" className="form-label">Current Medications</label>
                <textarea
                  id="currentMedications"
                  {...register('medicalHistory.currentMedications')}
                  className="form-input"
                  placeholder="List current medications, separated by commas"
                />
              </div>

              <div>
                <label htmlFor="pastSurgeries" className="form-label">Past Surgeries</label>
                <textarea
                  id="pastSurgeries"
                  {...register('medicalHistory.pastSurgeries')}
                  className="form-input"
                  placeholder="List any past surgeries with dates if known"
                />
              </div>

              <div>
                <label htmlFor="familyHistory" className="form-label">Family Medical History</label>
                <textarea
                  id="familyHistory"
                  {...register('medicalHistory.familyHistory')}
                  className="form-input"
                  placeholder="List relevant family medical history"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
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
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </>
            ) : (
              'Register Patient'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;