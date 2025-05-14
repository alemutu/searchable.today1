import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { saveData } from '../../lib/storage';
import { User, Phone, Mail, MapPin, Users, Heart, AlertTriangle, Save } from 'lucide-react';

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
  idNumber: string;
  hasAllergies: boolean;
  allergies: string;
  hasChronicConditions: boolean;
  chronicConditions: string;
  hasMedications: boolean;
  medications: string;
}

const PatientRegistrationForm: React.FC = () => {
  const { hospital, devMode } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PatientFormData>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasAllergies = watch('hasAllergies');
  const hasChronicConditions = watch('hasChronicConditions');
  const hasMedications = watch('hasMedications');
  
  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    
    try {
      // Format the data for the API
      const patientData = {
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
        id_number: data.idNumber || null,
        medical_info: {
          allergies: hasAllergies ? data.allergies.split(',').map(a => {
            const parts = a.trim().split(':');
            return {
              allergen: parts[0].trim(),
              reaction: parts.length > 1 ? parts[1].trim() : 'Unknown',
              severity: 'moderate'
            };
          }) : [],
          chronicConditions: hasChronicConditions ? data.chronicConditions.split(',').map(c => c.trim()) : [],
          currentMedications: hasMedications ? data.medications.split(',').map(m => {
            const parts = m.trim().split(':');
            return {
              name: parts[0].trim(),
              dosage: parts.length > 1 ? parts[1].trim() : '',
              frequency: parts.length > 2 ? parts[2].trim() : ''
            };
          }) : []
        },
        hospital_id: hospital?.id || 'dev-hospital-id',
        status: 'active',
        current_flow_step: 'registration',
        priority_level: 'normal'
      };
      
      // In dev mode, save to local storage
      if (devMode) {
        const savedPatient = await saveData('patients', patientData);
        console.log('Patient saved in dev mode:', savedPatient);
        
        addNotification({
          message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
          type: 'success'
        });
        
        navigate('/patients');
        return;
      }
      
      // Otherwise, save to Supabase
      const { data: savedPatient, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      
      if (error) throw error;
      
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: 'success'
      });
      
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Register New Patient</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 text-primary-500 mr-2" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className={`form-input ${errors.firstName ? 'border-error-300' : ''}`}
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className={`form-input ${errors.lastName ? 'border-error-300' : ''}`}
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Date of Birth</label>
              <input
                type="date"
                className={`form-input ${errors.dateOfBirth ? 'border-error-300' : ''}`}
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
              />
              {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Gender</label>
              <select
                className={`form-input ${errors.gender ? 'border-error-300' : ''}`}
                {...register('gender', { required: 'Gender is required' })}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender.message}</p>}
            </div>
            
            <div>
              <label className="form-label">ID Number</label>
              <input
                type="text"
                className="form-input"
                {...register('idNumber')}
                placeholder="National ID, Passport, etc."
              />
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 text-primary-500 mr-2" />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="form-label required">Phone Number</label>
              <input
                type="tel"
                className={`form-input ${errors.contactNumber ? 'border-error-300' : ''}`}
                {...register('contactNumber', { required: 'Phone number is required' })}
              />
              {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
            </div>
            
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'border-error-300' : ''}`}
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            
            <div className="sm:col-span-2">
              <label className="form-label required">Address</label>
              <textarea
                rows={3}
                className={`form-input ${errors.address ? 'border-error-300' : ''}`}
                {...register('address', { required: 'Address is required' })}
              ></textarea>
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 text-primary-500 mr-2" />
            Emergency Contact
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="form-label required">Name</label>
              <input
                type="text"
                className={`form-input ${errors.emergencyContactName ? 'border-error-300' : ''}`}
                {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
              />
              {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Relationship</label>
              <input
                type="text"
                className={`form-input ${errors.emergencyContactRelationship ? 'border-error-300' : ''}`}
                {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
              />
              {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
            </div>
            
            <div>
              <label className="form-label required">Phone Number</label>
              <input
                type="tel"
                className={`form-input ${errors.emergencyContactPhone ? 'border-error-300' : ''}`}
                {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
              />
              {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Medical Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Heart className="h-5 w-5 text-primary-500 mr-2" />
            Medical Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasAllergies"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('hasAllergies')}
                />
                <label htmlFor="hasAllergies" className="ml-2 block text-sm text-gray-900 font-medium">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />
                    Patient has allergies
                  </div>
                </label>
              </div>
              
              {hasAllergies && (
                <div>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Enter allergies, separated by commas. Format: Allergen: Reaction"
                    {...register('allergies')}
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: Penicillin: Rash, Peanuts: Swelling
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasChronicConditions"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('hasChronicConditions')}
                />
                <label htmlFor="hasChronicConditions" className="ml-2 block text-sm text-gray-900 font-medium">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-error-500 mr-1" />
                    Patient has chronic conditions
                  </div>
                </label>
              </div>
              
              {hasChronicConditions && (
                <div>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Enter chronic conditions, separated by commas"
                    {...register('chronicConditions')}
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: Diabetes, Hypertension, Asthma
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hasMedications"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('hasMedications')}
                />
                <label htmlFor="hasMedications" className="ml-2 block text-sm text-gray-900 font-medium">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-primary-500 mr-1" />
                    Patient is on medications
                  </div>
                </label>
              </div>
              
              {hasMedications && (
                <div>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Enter medications, separated by commas. Format: Medication: Dosage: Frequency"
                    {...register('medications')}
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: Lisinopril: 10mg: Daily, Metformin: 500mg: Twice daily
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
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