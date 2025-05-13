import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { saveData } from '../../lib/storage';
import { User, Phone, Mail, MapPin, UserPlus, Save, ArrowLeft, Calendar, AlertCircle, Heart, Activity, Pill, FileText } from 'lucide-react';

interface PatientFormData {
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
  medicalInfo: {
    allergies: string;
    chronicConditions: string;
    currentMedications: string;
    pastSurgeries: string;
    familyHistory: string;
  };
  registrationType: string;
  paymentMethod: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    coveragePercentage: number;
  };
}

const PatientRegistrationForm: React.FC = () => {
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalInfo: {
        allergies: '',
        chronicConditions: '',
        currentMedications: '',
        pastSurgeries: '',
        familyHistory: ''
      },
      registrationType: 'new',
      paymentMethod: 'cash'
    }
  });
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'payment'>('personal');
  
  const paymentMethod = watch('paymentMethod');
  
  const onSubmit = async (data: PatientFormData) => {
    if (!hospital) {
      addNotification({
        message: 'Hospital information is missing',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the data for the API
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
          name: data.emergencyContact.name,
          relationship: data.emergencyContact.relationship,
          phone: data.emergencyContact.phone
        },
        medical_info: {
          allergies: data.medicalInfo.allergies ? data.medicalInfo.allergies.split(',').map(a => a.trim()) : [],
          chronicConditions: data.medicalInfo.chronicConditions ? data.medicalInfo.chronicConditions.split(',').map(c => c.trim()) : [],
          currentMedications: data.medicalInfo.currentMedications ? data.medicalInfo.currentMedications.split(',').map(m => ({ name: m.trim() })) : [],
          pastSurgeries: data.medicalInfo.pastSurgeries ? data.medicalInfo.pastSurgeries.split(',').map(s => s.trim()) : [],
          familyHistory: data.medicalInfo.familyHistory
        },
        hospital_id: hospital.id,
        status: 'active',
        current_flow_step: 'registration',
        registration_type: data.registrationType,
        payment_method: data.paymentMethod,
        priority_level: 'normal',
        initial_status: 'registered'
      };
      
      // Add insurance info if payment method is insurance
      if (data.paymentMethod === 'insurance' && data.insuranceInfo) {
        patientData.medical_info.insurance = {
          provider: data.insuranceInfo.provider,
          policy_number: data.insuranceInfo.policyNumber,
          group_number: data.insuranceInfo.groupNumber,
          coverage_percentage: data.insuranceInfo.coveragePercentage
        };
      }
      
      // In development mode, save to local storage
      if (import.meta.env.DEV) {
        await saveData('patients', patientData);
        
        addNotification({
          message: 'Patient registered successfully',
          type: 'success'
        });
        
        navigate('/patients');
        return;
      }
      
      // Save to Supabase
      const { error } = await supabase
        .from('patients')
        .insert([patientData]);
      
      if (error) throw error;
      
      addNotification({
        message: 'Patient registered successfully',
        type: 'success'
      });
      
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
  
  const nextTab = () => {
    if (activeTab === 'personal') {
      setActiveTab('medical');
    } else if (activeTab === 'medical') {
      setActiveTab('payment');
    }
  };
  
  const prevTab = () => {
    if (activeTab === 'payment') {
      setActiveTab('medical');
    } else if (activeTab === 'medical') {
      setActiveTab('personal');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Registration</h1>
                <p className="text-gray-500">Register a new patient in the system</p>
              </div>
            </div>
            <div>
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
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Register Patient
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personal'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'medical'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Medical Information
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Registration Details
                </div>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Personal Information */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label required">First Name</label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className={`form-input ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label required">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
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
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    className={`form-input pl-10 ${errors.dateOfBirth ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="form-error">{errors.dateOfBirth.message}</p>
                )}
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
                </select>
                {errors.gender && (
                  <p className="form-error">{errors.gender.message}</p>
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
                    {...register('contactNumber', { required: 'Contact number is required' })}
                    className={`form-input pl-10 ${errors.contactNumber ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {errors.contactNumber && (
                  <p className="form-error">{errors.contactNumber.message}</p>
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
                    {...register('email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`form-input pl-10 ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="patient@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
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
                {errors.address && (
                  <p className="form-error">{errors.address.message}</p>
                )}
              </div>
            </div>
            
            <h3 className="text-md font-medium text-gray-900 mt-8 mb-4">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label required">Contact Name</label>
                <input
                  type="text"
                  {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                  className={`form-input ${errors.emergencyContact?.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="Full name"
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
                  placeholder="e.g., Spouse, Parent, Child"
                />
                {errors.emergencyContact?.relationship && (
                  <p className="form-error">{errors.emergencyContact.relationship.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label required">Contact Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                    className={`form-input pl-10 ${errors.emergencyContact?.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {errors.emergencyContact?.phone && (
                  <p className="form-error">{errors.emergencyContact.phone.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={nextTab}
                className="btn btn-primary"
              >
                Next: Medical Information
              </button>
            </div>
          </div>
        )}
        
        {/* Medical Information */}
        {activeTab === 'medical' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Medical Information</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
                  <label className="form-label mb-0">Allergies</label>
                </div>
                <textarea
                  {...register('medicalInfo.allergies')}
                  className="form-input"
                  rows={2}
                  placeholder="List allergies, separated by commas (e.g., Penicillin, Peanuts, Latex)"
                />
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <Heart className="h-5 w-5 text-error-500 mr-2" />
                  <label className="form-label mb-0">Chronic Conditions</label>
                </div>
                <textarea
                  {...register('medicalInfo.chronicConditions')}
                  className="form-input"
                  rows={2}
                  placeholder="List chronic conditions, separated by commas (e.g., Hypertension, Diabetes, Asthma)"
                />
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <Pill className="h-5 w-5 text-primary-500 mr-2" />
                  <label className="form-label mb-0">Current Medications</label>
                </div>
                <textarea
                  {...register('medicalInfo.currentMedications')}
                  className="form-input"
                  rows={2}
                  placeholder="List current medications, separated by commas (e.g., Lisinopril 10mg, Metformin 500mg)"
                />
              </div>
              
              <div>
                <label className="form-label">Past Surgeries</label>
                <textarea
                  {...register('medicalInfo.pastSurgeries')}
                  className="form-input"
                  rows={2}
                  placeholder="List past surgeries, separated by commas (e.g., Appendectomy 2018, Knee replacement 2020)"
                />
              </div>
              
              <div>
                <label className="form-label">Family History</label>
                <textarea
                  {...register('medicalInfo.familyHistory')}
                  className="form-input"
                  rows={2}
                  placeholder="Relevant family medical history"
                />
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevTab}
                className="btn btn-outline"
              >
                Back: Personal Information
              </button>
              <button
                type="button"
                onClick={nextTab}
                className="btn btn-primary"
              >
                Next: Registration Details
              </button>
            </div>
          </div>
        )}
        
        {/* Registration Details */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Registration Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="form-label required">Registration Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer ${
                      watch('registrationType') === 'new' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('registrationType', 'new')}
                  >
                    <div className="flex items-center">
                      <UserPlus className="h-5 w-5 text-primary-500 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">New Patient</h3>
                        <p className="text-xs text-gray-500">First time visiting this hospital</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer ${
                      watch('registrationType') === 'returning' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('registrationType', 'returning')}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-primary-500 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Returning Patient</h3>
                        <p className="text-xs text-gray-500">Has visited before but needs re-registration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label required">Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer ${
                      watch('paymentMethod') === 'cash' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'cash')}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Cash</h3>
                      <div className="h-5 w-5 text-primary-500">
                        {watch('paymentMethod') === 'cash' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer ${
                      watch('paymentMethod') === 'insurance' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'insurance')}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Insurance</h3>
                      <div className="h-5 w-5 text-primary-500">
                        {watch('paymentMethod') === 'insurance' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer ${
                      watch('paymentMethod') === 'credit_card' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('paymentMethod', 'credit_card')}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Credit Card</h3>
                      <div className="h-5 w-5 text-primary-500">
                        {watch('paymentMethod') === 'credit_card' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {paymentMethod === 'insurance' && (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Insurance Information</h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="form-label required">Insurance Provider</label>
                      <input
                        type="text"
                        {...register('insuranceInfo.provider', { 
                          required: paymentMethod === 'insurance' ? 'Provider name is required' : false 
                        })}
                        className="form-input"
                        placeholder="e.g., Blue Cross Blue Shield"
                      />
                      {errors.insuranceInfo?.provider && (
                        <p className="form-error">{errors.insuranceInfo.provider.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Policy Number</label>
                      <input
                        type="text"
                        {...register('insuranceInfo.policyNumber', { 
                          required: paymentMethod === 'insurance' ? 'Policy number is required' : false 
                        })}
                        className="form-input"
                        placeholder="e.g., ABC123456789"
                      />
                      {errors.insuranceInfo?.policyNumber && (
                        <p className="form-error">{errors.insuranceInfo.policyNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">Group Number</label>
                      <input
                        type="text"
                        {...register('insuranceInfo.groupNumber')}
                        className="form-input"
                        placeholder="e.g., GRP12345"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label required">Coverage Percentage</label>
                      <input
                        type="number"
                        {...register('insuranceInfo.coveragePercentage', { 
                          required: paymentMethod === 'insurance' ? 'Coverage percentage is required' : false,
                          min: { value: 0, message: 'Must be between 0 and 100' },
                          max: { value: 100, message: 'Must be between 0 and 100' }
                        })}
                        className="form-input"
                        placeholder="e.g., 80"
                      />
                      {errors.insuranceInfo?.coveragePercentage && (
                        <p className="form-error">{errors.insuranceInfo.coveragePercentage.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevTab}
                className="btn btn-outline"
              >
                Back: Medical Information
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
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Register Patient
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientRegistrationForm;