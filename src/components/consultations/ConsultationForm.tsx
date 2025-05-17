import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { 
  User, 
  Stethoscope, 
  FileText, 
  Pill, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  medicalCertificate: boolean;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  followUpDate?: string;
  labTests: string[];
  radiologyTests: string[];
  referrals: {
    department: string;
    reason: string;
    urgency: 'routine' | 'urgent' | 'emergency';
  }[];
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_history: any;
  current_flow_step: string | null;
}

interface Department {
  id: string;
  name: string;
}

const ConsultationForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Patient storage hook
  const { 
    data: patientsData,
    loading: patientLoading,
    error: patientError,
    fetchById: fetchPatient,
    saveItem: savePatient
  } = useHybridStorage<Patient>('patients');
  
  // Departments storage hook
  const { 
    data: departmentsData,
    loading: departmentsLoading,
    fetchItems: fetchDepartments
  } = useHybridStorage<Department>('departments');
  
  // Consultations storage hook
  const { 
    saveItem: saveConsultation,
    error: consultationError
  } = useHybridStorage<any>('consultations');
  
  const { register, handleSubmit, control, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      prescriptions: [{ 
        medication: '', 
        dosage: '', 
        frequency: '', 
        duration: '', 
        instructions: '' 
      }],
      labTests: [],
      radiologyTests: [],
      referrals: []
    }
  });
  
  const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = 
    useFieldArray({ control, name: 'prescriptions' });
  
  const { fields: referralFields, append: appendReferral, remove: removeReferral } = 
    useFieldArray({ control, name: 'referrals' });
  
  useEffect(() => {
    // Clear any previous form errors
    setFormError(null);
    
    // Fetch departments data
    fetchDepartments().catch(error => {
      console.error("Error fetching departments:", error);
      addNotification({
        message: `Failed to load departments: ${error.message}`,
        type: 'error'
      });
    });
    
    if (patientId) {
      fetchPatient(patientId).catch(error => {
        console.error("Error fetching patient:", error);
        addNotification({
          message: `Failed to load patient data: ${error.message}`,
          type: 'error'
        });
      });
    } else {
      setIsLoading(false);
      setFormError("No patient ID provided");
    }
  }, [patientId, fetchPatient, fetchDepartments, addNotification]);
  
  useEffect(() => {
    // Update patient state when data is loaded
    if (patientsData) {
      setPatientData(patientsData);
    }
    
    // Set loading state based on both data fetches
    if (!patientLoading && !departmentsLoading) {
      setIsLoading(false);
    }
  }, [patientsData, patientLoading, departmentsLoading]);
  
  useEffect(() => {
    // Set departments from fetched data
    if (departmentsData && Array.isArray(departmentsData)) {
      setDepartments(departmentsData);
    }
  }, [departmentsData]);
  
  // Display error notification if there's a consultation error
  useEffect(() => {
    if (consultationError) {
      addNotification({
        message: `Error with consultation data: ${consultationError.message}`,
        type: 'error'
      });
    }
  }, [consultationError, addNotification]);
  
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const onSubmit = async (data: ConsultationFormData) => {
    // No authentication check for testing purposes
    if (!patientData) {
      setFormError("Patient data not found. Please try again.");
      addNotification({
        message: 'Patient data not found',
        type: 'error'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      setFormError(null);
      
      console.log('Consultation form submitted:', data);
      
      // Validate required fields
      if (!data.chiefComplaint) {
        setFormError("Chief complaint is required");
        addNotification({
          message: 'Chief complaint is required',
          type: 'error'
        });
        setIsSaving(false);
        return;
      }
      
      if (!data.diagnosis) {
        setFormError("Diagnosis is required");
        addNotification({
          message: 'Diagnosis is required',
          type: 'error'
        });
        setIsSaving(false);
        return;
      }
      
      // Create a unique ID for the consultation record
      const consultationId = `consultation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create consultation record
      const consultationRecord = {
        id: consultationId,
        patient_id: patientData.id,
        doctor_id: user?.id || 'admin_user', // Use admin_user if no user is logged in
        consultation_date: new Date().toISOString(),
        chief_complaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatmentPlan,
        notes: data.notes,
        medical_certificate: data.medicalCertificate,
        prescriptions: data.prescriptions.filter(p => p.medication.trim() !== ''),
        follow_up_date: data.followUpDate,
        lab_tests: data.labTests,
        radiology_tests: data.radiologyTests,
        referrals: data.referrals.filter(r => r.department && r.reason),
        department_id: '1', // Default to General Medicine for now
        created_at: new Date().toISOString()
      };
      
      // Save the consultation record
      await saveConsultation(consultationRecord, consultationId);
      
      // Update patient's current flow step
      let nextStep = 'post_consultation';
      
      // Check if lab tests were ordered
      if (data.labTests && data.labTests.length > 0) {
        nextStep = 'lab_tests';
        
        // Create lab test records
        for (const test of data.labTests) {
          const testId = `lab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // In a real app, we would save this to the lab_results table
          console.log('Creating lab test:', {
            id: testId,
            patient_id: patientData.id,
            test_type: test,
            test_date: new Date().toISOString(),
            status: 'pending',
            ordered_by: user?.id || 'admin_user'
          });
        }
      }
      
      // Check if radiology tests were ordered
      if (data.radiologyTests && data.radiologyTests.length > 0) {
        if (nextStep === 'post_consultation') {
          nextStep = 'radiology';
        }
        
        // Create radiology test records
        for (const test of data.radiologyTests) {
          const scanId = `rad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // In a real app, we would save this to the radiology_results table
          console.log('Creating radiology test:', {
            id: scanId,
            patient_id: patientData.id,
            scan_type: test,
            scan_date: new Date().toISOString(),
            status: 'pending',
            ordered_by: user?.id || 'admin_user'
          });
        }
      }
      
      // Check if prescriptions were created
      if (data.prescriptions && data.prescriptions.filter(p => p.medication.trim() !== '').length > 0) {
        if (nextStep === 'post_consultation') {
          nextStep = 'pharmacy';
        }
        
        // Create pharmacy order
        const pharmacyId = `pharm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // In a real app, we would save this to the pharmacy table
        console.log('Creating pharmacy order:', {
          id: pharmacyId,
          patient_id: patientData.id,
          prescription_id: consultationId,
          medications: data.prescriptions.filter(p => p.medication.trim() !== ''),
          status: 'pending',
          payment_status: 'pending'
        });
      }
      
      // Update patient's current flow step
      const updatedPatient = {
        ...patientData,
        current_flow_step: nextStep
      };
      
      // Save the updated patient
      await savePatient(updatedPatient, patientData.id);
      
      // Show success notification
      addNotification({
        message: 'Consultation completed successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation form:', error.message);
      
      // Set form error
      setFormError(`Error: ${error.message}`);
      
      // Show error notification
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (patientError) {
    return (
      <div className="text-center p-3">
        <p className="text-error-500">Error loading patient: {patientError.message}</p>
        <button 
          onClick={() => navigate('/patients')}
          className="mt-4 btn btn-outline"
        >
          Return to Patients
        </button>
      </div>
    );
  }
  
  if (!patientData) {
    return (
      <div className="text-center p-3">
        <p className="text-gray-500">Patient not found</p>
        <button 
          onClick={() => navigate('/patients')}
          className="mt-4 btn btn-outline"
        >
          Return to Patients
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-secondary-700 to-secondary-600 rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-white text-secondary-600 flex items-center justify-center text-lg font-bold shadow-md">
              {patientData.first_name.charAt(0)}{patientData.last_name.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">
                {patientData.first_name} {patientData.last_name}
              </h2>
              <div className="flex items-center text-secondary-100 text-sm">
                <User className="h-4 w-4 mr-1" />
                <span>{calculateAge(patientData.date_of_birth)} years • {patientData.gender}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" />
                <span className="bg-black bg-opacity-20 px-2 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
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
        
        {/* Medical History Alert */}
        {patientData.medical_history && (
          <div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-md mb-4 flex items-start">
            <AlertTriangle className="h-5 w-5 text-warning-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Important Medical History</p>
              <ul className="mt-1 list-disc list-inside">
                {patientData.medical_history.allergies && patientData.medical_history.allergies.length > 0 && (
                  <li className="text-error-600">
                    <span className="font-medium">Allergies:</span> {patientData.medical_history.allergies.join(', ')}
                  </li>
                )}
                {patientData.medical_history.chronicConditions && patientData.medical_history.chronicConditions.length > 0 && (
                  <li>
                    <span className="font-medium">Chronic Conditions:</span> {patientData.medical_history.chronicConditions.join(', ')}
                  </li>
                )}
                {patientData.medical_history.currentMedications && patientData.medical_history.currentMedications.length > 0 && (
                  <li>
                    <span className="font-medium">Current Medications:</span> {patientData.medical_history.currentMedications.map((med: any) => med.name).join(', ')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 space-y-6">
          {/* Consultation Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 text-secondary-500 mr-2" />
              Consultation Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label required">Chief Complaint</label>
                <textarea
                  {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                  className={`form-input ${errors.chiefComplaint ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={2}
                  placeholder="Describe the patient's main complaint"
                />
                {errors.chiefComplaint && (
                  <p className="form-error">{errors.chiefComplaint.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label required">Diagnosis</label>
                <textarea
                  {...register('diagnosis', { required: 'Diagnosis is required' })}
                  className={`form-input ${errors.diagnosis ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  rows={2}
                  placeholder="Enter diagnosis"
                />
                {errors.diagnosis && (
                  <p className="form-error">{errors.diagnosis.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label">Treatment Plan</label>
                <textarea
                  {...register('treatmentPlan')}
                  className="form-input"
                  rows={3}
                  placeholder="Describe the treatment plan"
                />
              </div>
              
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-input"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="medicalCertificate"
                  {...register('medicalCertificate')}
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                />
                <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                  Issue Medical Certificate
                </label>
              </div>
              
              <div>
                <label className="form-label">Follow-up Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register('followUpDate')}
                    className="form-input pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Prescriptions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Pill className="h-5 w-5 text-secondary-500 mr-2" />
              Prescriptions
            </h3>
            
            <div className="space-y-4">
              {prescriptionFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900">Prescription #{index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="text-error-600 hover:text-error-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Medication</label>
                      <input
                        type="text"
                        {...register(`prescriptions.${index}.medication`)}
                        className="form-input"
                        placeholder="Medication name"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Dosage</label>
                      <input
                        type="text"
                        {...register(`prescriptions.${index}.dosage`)}
                        className="form-input"
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Frequency</label>
                      <input
                        type="text"
                        {...register(`prescriptions.${index}.frequency`)}
                        className="form-input"
                        placeholder="e.g., Twice daily"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Duration</label>
                      <input
                        type="text"
                        {...register(`prescriptions.${index}.duration`)}
                        className="form-input"
                        placeholder="e.g., 7 days"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label text-sm">Instructions</label>
                      <input
                        type="text"
                        {...register(`prescriptions.${index}.instructions`)}
                        className="form-input"
                        placeholder="e.g., Take with food"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => appendPrescription({ 
                  medication: '', 
                  dosage: '', 
                  frequency: '', 
                  duration: '', 
                  instructions: '' 
                })}
                className="btn btn-outline flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Prescription
              </button>
            </div>
          </div>
          
          {/* Lab Tests */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-secondary-500 mr-2" />
              Lab Tests
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cbc"
                    value="complete_blood_count"
                    {...register('labTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cbc" className="text-sm text-gray-700">
                    Complete Blood Count (CBC)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lft"
                    value="liver_function"
                    {...register('labTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="lft" className="text-sm text-gray-700">
                    Liver Function Test (LFT)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="kft"
                    value="kidney_function"
                    {...register('labTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="kft" className="text-sm text-gray-700">
                    Kidney Function Test
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lipid"
                    value="lipid_profile"
                    {...register('labTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="lipid" className="text-sm text-gray-700">
                    Lipid Profile
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="glucose"
                    value="blood_glucose"
                    {...register('labTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="glucose" className="text-sm text-gray-700">
                    Blood Glucose
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="urinalysis"
                    value="urinalysis"
                    {...register('labTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="urinalysis" className="text-sm text-gray-700">
                    Urinalysis
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Radiology Tests */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-secondary-500 mr-2" />
              Radiology Tests
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="xray"
                    value="x_ray"
                    {...register('radiologyTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="xray" className="text-sm text-gray-700">
                    X-Ray
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ct"
                    value="ct_scan"
                    {...register('radiologyTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ct" className="text-sm text-gray-700">
                    CT Scan
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="mri"
                    value="mri"
                    {...register('radiologyTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mri" className="text-sm text-gray-700">
                    MRI
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ultrasound"
                    value="ultrasound"
                    {...register('radiologyTests')}
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ultrasound" className="text-sm text-gray-700">
                    Ultrasound
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Referrals */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-secondary-500 mr-2" />
              Referrals
            </h3>
            
            <div className="space-y-4">
              {referralFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900">Referral #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeReferral(index)}
                      className="text-error-600 hover:text-error-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Department</label>
                      <select
                        {...register(`referrals.${index}.department`)}
                        className="form-input"
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Urgency</label>
                      <select
                        {...register(`referrals.${index}.urgency`)}
                        className="form-input"
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label text-sm">Reason</label>
                      <textarea
                        {...register(`referrals.${index}.reason`)}
                        className="form-input"
                        rows={2}
                        placeholder="Reason for referral"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => appendReferral({ 
                  department: '', 
                  reason: '', 
                  urgency: 'routine' 
                })}
                className="btn btn-outline flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Referral
              </button>
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Complete Consultation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;