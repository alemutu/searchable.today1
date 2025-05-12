import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Pill, 
  Activity, 
  Heart, 
  Bone, 
  Bluetooth as Tooth, 
  Eye, 
  ActivitySquare, 
  Syringe, 
  UserRound, 
  Baby,
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
  // Department-specific fields
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  // Surgical fields
  procedureType?: string;
  procedureDate?: string;
  anesthesiaType?: string;
  preOpInstructions?: string;
  // Orthopedic fields
  mobilityAssessment?: string;
  painLevel?: number;
  jointRangeOfMotion?: string;
  // Dental fields
  dentalProcedure?: string;
  oralHygieneStatus?: string;
  followUpRequired?: boolean;
  // Eye clinic fields
  visualAcuity?: {
    rightEye?: string;
    leftEye?: string;
  };
  intraocularPressure?: {
    rightEye?: number;
    leftEye?: number;
  };
  // Physiotherapy fields
  exercisePlan?: string;
  therapyFrequency?: string;
  estimatedSessions?: number;
  // Gynecology fields
  pregnancyStatus?: boolean;
  gestationalAge?: number;
  // Cardiology fields
  ecgResults?: string;
  // Pediatrics fields
  growthPercentile?: string;
  developmentalAssessment?: string;
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [prescriptionCount, setPrescriptionCount] = useState(1);
  const [department, setDepartment] = useState<string>('general');
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      medicalCertificate: false
    }
  });

  // Determine department from URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/departments/general')) {
      setDepartment('general');
    } else if (path.includes('/departments/cardiology')) {
      setDepartment('cardiology');
    } else if (path.includes('/departments/pediatrics')) {
      setDepartment('pediatrics');
    } else if (path.includes('/departments/gynecology')) {
      setDepartment('gynecology');
    } else if (path.includes('/departments/surgical')) {
      setDepartment('surgical');
    } else if (path.includes('/departments/orthopedic')) {
      setDepartment('orthopedic');
    } else if (path.includes('/departments/dental')) {
      setDepartment('dental');
    } else if (path.includes('/departments/eye')) {
      setDepartment('eye');
    } else if (path.includes('/departments/physiotherapy')) {
      setDepartment('physiotherapy');
    } else {
      // Default to general medicine if no specific department is found
      setDepartment('general');
    }
  }, [location]);

  // Fetch patient information
  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
          
        if (error) throw error;
        setPatientInfo(data);
        
        // Check if this is an emergency case
        if (data.current_flow_step === 'emergency' || data.priority_level === 'critical') {
          setIsEmergency(true);
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
    };
    
    fetchPatient();
  }, [patientId]);

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (!hospital || !user || !patientId) throw new Error('Missing required data');

      // Create consultation record
      const { error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          hospital_id: hospital.id,
          consultation_date: new Date().toISOString(),
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatment_plan: data.treatmentPlan,
          prescriptions: data.prescriptions,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          department_id: user.department_id,
          // Include department-specific data based on department
          ...(department === 'surgical' && {
            procedure_type: data.procedureType,
            procedure_date: data.procedureDate,
            anesthesia_type: data.anesthesiaType,
            pre_op_instructions: data.preOpInstructions
          }),
          ...(department === 'orthopedic' && {
            mobility_assessment: data.mobilityAssessment,
            pain_level: data.painLevel,
            joint_range_of_motion: data.jointRangeOfMotion
          }),
          ...(department === 'dental' && {
            dental_procedure: data.dentalProcedure,
            oral_hygiene_status: data.oralHygieneStatus,
            follow_up_required: data.followUpRequired
          }),
          ...(department === 'eye' && {
            visual_acuity: data.visualAcuity,
            intraocular_pressure: data.intraocularPressure
          }),
          ...(department === 'physiotherapy' && {
            exercise_plan: data.exercisePlan,
            therapy_frequency: data.therapyFrequency,
            estimated_sessions: data.estimatedSessions
          }),
          ...(department === 'gynecology' && {
            pregnancy_status: data.pregnancyStatus,
            gestational_age: data.gestationalAge
          }),
          ...(department === 'cardiology' && {
            ecg_results: data.ecgResults,
            vital_signs: data.vitalSigns
          }),
          ...(department === 'pediatrics' && {
            growth_percentile: data.growthPercentile,
            developmental_assessment: data.developmentalAssessment
          })
        });

      if (consultationError) throw consultationError;

      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
        })
        .eq('id', patientId);

      if (patientError) throw patientError;

      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation:', error.message);
    }
  };

  // Get department icon
  const getDepartmentIcon = () => {
    switch (department) {
      case 'cardiology':
        return <Heart className="h-5 w-5 mr-2 text-error-500" />;
      case 'pediatrics':
        return <Baby className="h-5 w-5 mr-2 text-primary-500" />;
      case 'gynecology':
        return <UserRound className="h-5 w-5 mr-2 text-primary-500" />;
      case 'surgical':
        return <Syringe className="h-5 w-5 mr-2 text-primary-500" />;
      case 'orthopedic':
        return <Bone className="h-5 w-5 mr-2 text-primary-500" />;
      case 'dental':
        return <Tooth className="h-5 w-5 mr-2 text-primary-500" />;
      case 'eye':
        return <Eye className="h-5 w-5 mr-2 text-primary-500" />;
      case 'physiotherapy':
        return <ActivitySquare className="h-5 w-5 mr-2 text-primary-500" />;
      default:
        return <Activity className="h-5 w-5 mr-2 text-primary-500" />;
    }
  };

  // Get department title
  const getDepartmentTitle = () => {
    switch (department) {
      case 'cardiology':
        return "Cardiology Consultation";
      case 'pediatrics':
        return "Pediatric Consultation";
      case 'gynecology':
        return "Gynecology & Obstetrics Consultation";
      case 'surgical':
        return "Surgical Consultation";
      case 'orthopedic':
        return "Orthopedic Consultation";
      case 'dental':
        return "Dental Treatment";
      case 'eye':
        return "Ophthalmology Examination";
      case 'physiotherapy':
        return "Physiotherapy Session";
      default:
        return "Medical Consultation";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header with Department Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-3 p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                {getDepartmentIcon()}
                {getDepartmentTitle()}
              </h1>
              {patientInfo && (
                <p className="text-sm text-gray-500">
                  Patient: {patientInfo.first_name} {patientInfo.last_name}
                </p>
              )}
            </div>
          </div>
          
          {isEmergency && (
            <div className="bg-error-50 text-error-700 px-3 py-1 rounded-md flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Emergency Case</span>
            </div>
          )}
        </div>

        {/* Chief Complaint and Diagnosis */}
        <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Consultation Details</h2>
          
          <div>
            <label htmlFor="chiefComplaint" className="form-label">Chief Complaint</label>
            <textarea
              id="chiefComplaint"
              rows={2}
              {...register('chiefComplaint', { required: 'Chief complaint is required' })}
              className="form-input"
              placeholder="Patient's main complaint"
            />
            {errors.chiefComplaint && (
              <p className="form-error">{errors.chiefComplaint.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="diagnosis" className="form-label">Diagnosis</label>
            <textarea
              id="diagnosis"
              rows={2}
              {...register('diagnosis', { required: 'Diagnosis is required' })}
              className="form-input"
              placeholder="Clinical diagnosis"
            />
            {errors.diagnosis && (
              <p className="form-error">{errors.diagnosis.message}</p>
            )}
          </div>
        </div>

        {/* Department-specific fields */}
        {department === 'cardiology' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-error-500" />
              Cardiac Assessment
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  {...register('vitalSigns.bloodPressure')}
                  className="form-input"
                  placeholder="e.g., 120/80"
                />
              </div>
              
              <div>
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  {...register('vitalSigns.heartRate')}
                  className="form-input"
                  placeholder="e.g., 72"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">ECG Results</label>
              <textarea
                {...register('ecgResults')}
                rows={2}
                className="form-input"
                placeholder="ECG findings"
              />
            </div>
          </div>
        )}

        {department === 'pediatrics' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Baby className="h-5 w-5 mr-2 text-primary-500" />
              Pediatric Assessment
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Growth Percentile</label>
                <input
                  type="text"
                  {...register('growthPercentile')}
                  className="form-input"
                  placeholder="e.g., 75th percentile"
                />
              </div>
              
              <div>
                <label className="form-label">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('vitalSigns.temperature')}
                  className="form-input"
                  placeholder="e.g., 37.0"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">Developmental Assessment</label>
              <textarea
                {...register('developmentalAssessment')}
                rows={2}
                className="form-input"
                placeholder="Developmental milestones and assessment"
              />
            </div>
          </div>
        )}

        {department === 'gynecology' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserRound className="h-5 w-5 mr-2 text-primary-500" />
              Gynecological Assessment
            </h2>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="pregnancyStatus"
                {...register('pregnancyStatus')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="pregnancyStatus" className="ml-2 block text-sm text-gray-900">
                Patient is pregnant
              </label>
            </div>
            
            {watch('pregnancyStatus') && (
              <div>
                <label className="form-label">Gestational Age (weeks)</label>
                <input
                  type="number"
                  {...register('gestationalAge')}
                  className="form-input"
                  placeholder="e.g., 24"
                />
              </div>
            )}
          </div>
        )}

        {department === 'surgical' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Syringe className="h-5 w-5 mr-2 text-primary-500" />
              Surgical Assessment
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Procedure Type</label>
                <input
                  type="text"
                  {...register('procedureType')}
                  className="form-input"
                  placeholder="e.g., Appendectomy"
                />
              </div>
              
              <div>
                <label className="form-label">Proposed Date</label>
                <input
                  type="date"
                  {...register('procedureDate')}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Anesthesia Type</label>
                <select
                  {...register('anesthesiaType')}
                  className="form-input"
                >
                  <option value="">Select type</option>
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="general">General</option>
                  <option value="sedation">Sedation</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="form-label">Pre-operative Instructions</label>
              <textarea
                {...register('preOpInstructions')}
                rows={2}
                className="form-input"
                placeholder="Instructions for patient before surgery"
              />
            </div>
          </div>
        )}

        {department === 'orthopedic' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bone className="h-5 w-5 mr-2 text-primary-500" />
              Orthopedic Assessment
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Mobility Assessment</label>
                <select
                  {...register('mobilityAssessment')}
                  className="form-input"
                >
                  <option value="">Select assessment</option>
                  <option value="normal">Normal</option>
                  <option value="limited">Limited</option>
                  <option value="severely_limited">Severely Limited</option>
                  <option value="immobile">Immobile</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Pain Level (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  {...register('painLevel')}
                  className="form-input"
                  placeholder="e.g., 5"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">Joint Range of Motion</label>
              <textarea
                {...register('jointRangeOfMotion')}
                rows={2}
                className="form-input"
                placeholder="Describe range of motion in affected joints"
              />
            </div>
          </div>
        )}

        {department === 'dental' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Tooth className="h-5 w-5 mr-2 text-primary-500" />
              Dental Assessment
            </h2>
            
            <div>
              <label className="form-label">Dental Procedure</label>
              <select
                {...register('dentalProcedure')}
                className="form-input"
              >
                <option value="">Select procedure</option>
                <option value="cleaning">Dental Cleaning</option>
                <option value="filling">Cavity Filling</option>
                <option value="extraction">Tooth Extraction</option>
                <option value="root_canal">Root Canal</option>
                <option value="crown">Crown</option>
                <option value="bridge">Bridge</option>
                <option value="dentures">Dentures</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="form-label">Oral Hygiene Status</label>
              <select
                {...register('oralHygieneStatus')}
                className="form-input"
              >
                <option value="">Select status</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="very_poor">Very Poor</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="followUpRequired"
                {...register('followUpRequired')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                Follow-up appointment required
              </label>
            </div>
          </div>
        )}

        {department === 'eye' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-primary-500" />
              Vision Assessment
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Visual Acuity - Right Eye</label>
                <input
                  type="text"
                  {...register('visualAcuity.rightEye')}
                  className="form-input"
                  placeholder="e.g., 20/20"
                />
              </div>
              
              <div>
                <label className="form-label">Visual Acuity - Left Eye</label>
                <input
                  type="text"
                  {...register('visualAcuity.leftEye')}
                  className="form-input"
                  placeholder="e.g., 20/40"
                />
              </div>
              
              <div>
                <label className="form-label">Intraocular Pressure - Right Eye (mmHg)</label>
                <input
                  type="number"
                  {...register('intraocularPressure.rightEye')}
                  className="form-input"
                  placeholder="e.g., 15"
                />
              </div>
              
              <div>
                <label className="form-label">Intraocular Pressure - Left Eye (mmHg)</label>
                <input
                  type="number"
                  {...register('intraocularPressure.leftEye')}
                  className="form-input"
                  placeholder="e.g., 16"
                />
              </div>
            </div>
          </div>
        )}

        {department === 'physiotherapy' && (
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ActivitySquare className="h-5 w-5 mr-2 text-primary-500" />
              Therapy Assessment
            </h2>
            
            <div>
              <label className="form-label">Exercise Plan</label>
              <textarea
                {...register('exercisePlan')}
                rows={3}
                className="form-input"
                placeholder="Detailed exercise plan for patient"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Therapy Frequency</label>
                <select
                  {...register('therapyFrequency')}
                  className="form-input"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="twice_weekly">Twice Weekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Estimated Sessions</label>
                <input
                  type="number"
                  {...register('estimatedSessions')}
                  className="form-input"
                  placeholder="e.g., 10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Treatment Plan */}
        <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Treatment Plan</h2>
          
          <div>
            <label htmlFor="treatmentPlan" className="form-label">Treatment Plan</label>
            <textarea
              id="treatmentPlan"
              rows={3}
              {...register('treatmentPlan', { required: 'Treatment plan is required' })}
              className="form-input"
              placeholder="Detailed treatment plan"
            />
            {errors.treatmentPlan && (
              <p className="form-error">{errors.treatmentPlan.message}</p>
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
            <button
              type="button"
              onClick={() => setPrescriptionCount(prev => prev + 1)}
              className="btn btn-outline inline-flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </button>
          </div>
          
          {Array.from({ length: prescriptionCount }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-gray-900">Medication #{index + 1}</h3>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrescriptionCount(prev => prev - 1)}
                    className="text-error-600 hover:text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label text-sm">Medication Name</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.medication` as const, {
                      required: 'Medication name is required'
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Dosage</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.dosage` as const, {
                      required: 'Dosage is required'
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Frequency</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.frequency` as const, {
                      required: 'Frequency is required'
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Duration</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.duration` as const, {
                      required: 'Duration is required'
                    })}
                    className="form-input py-1.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label text-sm">Special Instructions</label>
                  <textarea
                    {...register(`prescriptions.${index}.instructions` as const)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Notes */}
        <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
          
          <div>
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="form-input"
              placeholder="Any additional notes or observations"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="medicalCertificate"
              {...register('medicalCertificate')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="medicalCertificate" className="ml-2 flex items-center text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 mr-1" />
              Issue Medical Certificate
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
              <>
                <Save className="h-4 w-4 mr-2" />
                Complete {department === 'dental' ? 'Treatment' : 
                          department === 'eye' ? 'Examination' : 
                          department === 'physiotherapy' ? 'Therapy' : 
                          'Consultation'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;