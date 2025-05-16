import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../lib/store';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Heart, AlertTriangle } from 'lucide-react';
import { usePatients, type Patient } from '../../lib/hooks/usePatients';

type PatientFormData = Omit<Patient, 'id' | 'status' | 'current_flow_step'>;

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { createPatient } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      contact_number: '',
      email: '',
      address: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone: ''
      },
      medical_info: {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        bloodType: '',
        smoker: false,
        alcoholConsumption: 'none'
      }
    }
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create the patient
      await createPatient({
        ...data,
        status: 'active',
        current_flow_step: 'registration'
      });
      
      // Navigate to the patients list
      navigate('/patients');
    } catch (error) {
      console.error('Error registering patient:', error);
      addNotification({
        message: `Failed to register patient: ${(error as Error).message}`,
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
                  Save Patient
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
                  {...register('first_name', { required: 'First name is required' })}
                  className={`form-input pl-10 ${errors.first_name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter first name"
                />
              </div>
              {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('last_name', { required: 'Last name is required' })}
                  className={`form-input pl-10 ${errors.last_name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter last name"
                />
              </div>
              {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Date of Birth</label>
              <input
                type="date"
                {...register('date_of_birth', { required: 'Date of birth is required' })}
                className={`form-input ${errors.date_of_birth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              />
              {errors.date_of_birth && <p className="form-error">{errors.date_of_birth.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Gender</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className={`form-input ${errors.gender ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
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
                  {...register('contact_number', { required: 'Phone number is required' })}
                  className={`form-input pl-10 ${errors.contact_number ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.contact_number && <p className="form-error">{errors.contact_number.message}</p>}
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
              <label className="form-label required">Contact Name</label>
              <input
                type="text"
                {...register('emergency_contact.name', { required: 'Emergency contact name is required' })}
                className={`form-input ${errors.emergency_contact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="Enter emergency contact name"
              />
              {errors.emergency_contact?.name && <p className="form-error">{errors.emergency_contact.name.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Relationship</label>
              <input
                type="text"
                {...register('emergency_contact.relationship', { required: 'Relationship is required' })}
                className={`form-input ${errors.emergency_contact?.relationship ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="E.g., Spouse, Parent, Child"
              />
              {errors.emergency_contact?.relationship && <p className="form-error">{errors.emergency_contact.relationship.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Phone Number</label>
              <input
                type="tel"
                {...register('emergency_contact.phone', { required: 'Emergency contact phone is required' })}
                className={`form-input ${errors.emergency_contact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="Enter emergency contact phone"
              />
              {errors.emergency_contact?.phone && <p className="form-error">{errors.emergency_contact.phone.message}</p>}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h2>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-warning-500 mr-2" />
              <h3 className="text-md font-medium text-gray-900">Allergies</h3>
            </div>
            <div className="pl-7">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasAllergies"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasAllergies" className="ml-2 block text-sm text-gray-900">
                  Patient has allergies
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Allergies can be added after registration in the patient's profile.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Heart className="h-5 w-5 text-error-500 mr-2" />
              <h3 className="text-md font-medium text-gray-900">Chronic Conditions</h3>
            </div>
            <div className="pl-7">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="diabetes"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="diabetes" className="ml-2 block text-sm text-gray-900">
                    Diabetes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hypertension"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hypertension" className="ml-2 block text-sm text-gray-900">
                    Hypertension
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="asthma"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="asthma" className="ml-2 block text-sm text-gray-900">
                    Asthma
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="heartDisease"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="heartDisease" className="ml-2 block text-sm text-gray-900">
                    Heart Disease
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Additional conditions can be added after registration.
              </p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smoker"
                  {...register('medical_info.smoker')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="smoker" className="ml-2 block text-sm text-gray-900">
                  Smoker
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="form-label">Blood Type</label>
              <select
                {...register('medical_info.bloodType')}
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
              <label className="form-label">Alcohol Consumption</label>
              <select
                {...register('medical_info.alcoholConsumption')}
                className="form-input"
              >
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
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
                Saving...
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