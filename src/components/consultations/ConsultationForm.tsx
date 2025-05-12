import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { User } from '@supabase/supabase-js';
import { FileText, Plus, Trash2, Save, ArrowLeft, Pill, Activity, Heart, Bone, Bluetooth as Tooth, Eye, ActivitySquare, Syringe, UserRound, Baby, AlertTriangle, X, ChevronRight, ChevronDown, Microscope, FileImage, Stethoscope, Settings as Lungs, Thermometer, Scale, Ruler, Brain } from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  symptoms: string[];
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
  // Patient History
  historyOfPresentingIllness?: string;
  gynecologicalHistory?: string;
  pastMedicalHistory?: string;
  pastSurgicalHistory?: string;
  // Family and Socioeconomic History
  familyHistory?: string;
  socioeconomicHistory?: string;
  // General Examination
  generalExamination?: string;
  // Systemic Examination
  cardiovascularSystem?: string;
  centralNervousSystem?: string;
  respiratorySystem?: string;
  gastrointestinalSystem?: string;
  genitourinarySystem?: string;
  musculoskeletalSystem?: string;
  breastExamination?: string;
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
  // Lab and Radiology
  labTests?: string[];
  radiologyTests?: string[];
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'medications' | 'diagnosticTests' | 'notes' | 'summary'>('assessment');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [patientHistoryExpanded, setPatientHistoryExpanded] = useState(false);
  const [familyHistoryExpanded, setFamilyHistoryExpanded] = useState(false);
  const [generalExamExpanded, setGeneralExamExpanded] = useState(false);
  const [systemicExamExpanded, setSystemicExamExpanded] = useState(false);
  const [labTests, setLabTests] = useState<string[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<string[]>([]);
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue, watch } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      medicalCertificate: false,
      symptoms: []
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

  const addSymptom = () => {
    if (symptomInput.trim()) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const toggleLabTest = (test: string) => {
    if (labTests.includes(test)) {
      setLabTests(labTests.filter(t => t !== test));
    } else {
      setLabTests([...labTests, test]);
    }
  };

  const toggleRadiologyTest = (test: string) => {
    if (radiologyTests.includes(test)) {
      setRadiologyTests(radiologyTests.filter(t => t !== test));
    } else {
      setRadiologyTests([...radiologyTests, test]);
    }
  };

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (!hospital || !user || !patientId) throw new Error('Missing required data');

      // Add symptoms to data
      data.symptoms = symptoms;
      data.labTests = labTests;
      data.radiologyTests = radiologyTests;

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
          // Patient history
          history_of_presenting_illness: data.historyOfPresentingIllness,
          gynecological_history: data.gynecologicalHistory,
          past_medical_history: data.pastMedicalHistory,
          past_surgical_history: data.pastSurgicalHistory,
          // Family and socioeconomic history
          family_history: data.familyHistory,
          socioeconomic_history: data.socioeconomicHistory,
          // General examination
          general_examination: data.generalExamination,
          // Systemic examination
          cardiovascular_system: data.cardiovascularSystem,
          central_nervous_system: data.centralNervousSystem,
          respiratory_system: data.respiratorySystem,
          gastrointestinal_system: data.gastrointestinalSystem,
          genitourinary_system: data.genitourinarySystem,
          musculoskeletal_system: data.musculoskeletalSystem,
          breast_examination: data.breastExamination,
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

      // Determine next flow step based on lab/radiology tests and prescriptions
      let nextFlowStep = 'post_consultation';
      
      // Create lab orders if tests were selected
      if (labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            test_type: labTests.join(', '),
            test_date: new Date().toISOString(),
            status: 'pending',
            is_emergency: isEmergency
          });

        if (labError) throw labError;
        nextFlowStep = 'lab_tests';
      }

      // Create radiology orders if tests were selected
      if (radiologyTests.length > 0 && nextFlowStep === 'post_consultation') {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            scan_type: radiologyTests[0], // Primary scan type
            scan_date: new Date().toISOString(),
            status: 'pending',
            is_emergency: isEmergency,
            results: { 
              ordered_scans: radiologyTests 
            }
          });

        if (radiologyError) throw radiologyError;
        nextFlowStep = 'radiology';
      }

      // Create pharmacy order if prescriptions were added
      if (data.prescriptions && data.prescriptions.length > 0 && data.prescriptions[0].medication && nextFlowStep === 'post_consultation') {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            medications: data.prescriptions.map(p => ({
              medication: p.medication,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
              quantity: 1, // Default quantity
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: isEmergency
          });

        if (pharmacyError) throw pharmacyError;
        nextFlowStep = 'pharmacy';
      }

      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: nextFlowStep
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

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm">
      {/* Header with patient info and close button */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
            {patientInfo?.first_name?.charAt(0) || 'P'}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {patientInfo?.first_name || 'Patient'} {patientInfo?.last_name || ''}
              </h2>
              {isEmergency && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 text-error-800">
                  Emergency
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>{calculateAge(patientInfo?.date_of_birth)} years, {patientInfo?.gender?.toLowerCase()}</span>
              <span className="mx-2">•</span>
              <span>{getDepartmentTitle()}</span>
              <span className="mx-2">•</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Vital Signs Panel */}
      <div className="flex">
        {/* Left sidebar with vital signs */}
        <div className="w-1/4 border-r border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Vital Signs</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">BP</span>
              <span className="text-sm font-medium">120/80</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Pulse</span>
              <span className="text-sm font-medium">72 bpm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Temp</span>
              <span className="text-sm font-medium">36.5°C</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">SpO2</span>
              <span className="text-sm font-medium">98%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Resp</span>
              <span className="text-sm font-medium">16/min</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Medical History</h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Allergies:</span> Penicillin
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Chronic Conditions:</span> Hypertension
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Current Medications:</span> Lisinopril 10mg
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Patient History Summary</h3>
            <button className="text-xs text-primary-600 hover:text-primary-700">
              Show patient history summary
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Analyzing Patient Data</h3>
            <div className="text-xs text-gray-600">
              Evaluating vital signs and symptoms to suggest possible diagnoses...
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="w-3/4 p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('assessment')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assessment'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-1" />
                  Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('medications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'medications'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Pill className="h-4 w-4 inline mr-1" />
                  Medications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnosticTests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'diagnosticTests'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Microscope className="h-4 w-4 inline mr-1" />
                  Diagnostic Tests
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notes'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Summary
                </button>
              </nav>
            </div>

            {/* Assessment Tab */}
            {activeTab === 'assessment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaints</label>
                  <textarea
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    rows={2}
                    className="form-input w-full text-sm"
                    placeholder="Enter chief complaints, separated by commas..."
                  />
                  {errors.chiefComplaint && (
                    <p className="mt-1 text-sm text-error-600">{errors.chiefComplaint.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      className="form-input text-sm flex-grow"
                      placeholder="Enter symptom..."
                    />
                    <button
                      type="button"
                      onClick={addSymptom}
                      className="ml-2 p-2 bg-primary-100 text-primary-600 rounded-md hover:bg-primary-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {symptoms.length === 0 ? (
                    <p className="text-sm text-gray-500">No symptoms added yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {symptoms.map((symptom, index) => (
                        <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                          <span className="text-sm">{symptom}</span>
                          <button
                            type="button"
                            onClick={() => removeSymptom(index)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1. Patient History Section */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => setPatientHistoryExpanded(!patientHistoryExpanded)}
                  >
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
                      Patient History
                    </h3>
                    {patientHistoryExpanded ? 
                      <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    }
                  </div>
                  
                  {patientHistoryExpanded && (
                    <div className="p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">History of Presenting Illness</label>
                        <textarea
                          {...register('historyOfPresentingIllness')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Describe the history of the current illness..."
                        />
                      </div>
                      
                      {department === 'gynecology' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Gynecological/Obstetric History</label>
                          <textarea
                            {...register('gynecologicalHistory')}
                            rows={2}
                            className="form-input w-full text-sm"
                            placeholder="Menstrual history, pregnancies, etc..."
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Past Medical History</label>
                        <textarea
                          {...register('pastMedicalHistory')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Previous medical conditions, chronic illnesses..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Past Surgical History</label>
                        <textarea
                          {...register('pastSurgicalHistory')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Previous surgeries, procedures..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Family and Socioeconomic History */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => setFamilyHistoryExpanded(!familyHistoryExpanded)}
                  >
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <UserRound className="h-4 w-4 mr-1.5 text-gray-500" />
                      Family and Socioeconomic History
                    </h3>
                    {familyHistoryExpanded ? 
                      <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    }
                  </div>
                  
                  {familyHistoryExpanded && (
                    <div className="p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Family History</label>
                        <textarea
                          {...register('familyHistory')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Family history of diseases, genetic conditions..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Socioeconomic History</label>
                        <textarea
                          {...register('socioeconomicHistory')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Occupation, living conditions, social support..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. General Examination */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => setGeneralExamExpanded(!generalExamExpanded)}
                  >
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <Stethoscope className="h-4 w-4 mr-1.5 text-gray-500" />
                      General Examination
                    </h3>
                    {generalExamExpanded ? 
                      <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    }
                  </div>
                  
                  {generalExamExpanded && (
                    <div className="p-3">
                      <textarea
                        {...register('generalExamination')}
                        rows={3}
                        className="form-input w-full text-sm"
                        placeholder="General appearance, vital signs, etc..."
                      />
                    </div>
                  )}
                </div>

                {/* 4. Systemic Examination */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => setSystemicExamExpanded(!systemicExamExpanded)}
                  >
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <Activity className="h-4 w-4 mr-1.5 text-gray-500" />
                      Systemic Examination
                    </h3>
                    {systemicExamExpanded ? 
                      <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    }
                  </div>
                  
                  {systemicExamExpanded && (
                    <div className="p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cardiovascular System</label>
                        <textarea
                          {...register('cardiovascularSystem')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Heart sounds, pulses, etc..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Central Nervous System</label>
                        <textarea
                          {...register('centralNervousSystem')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Mental status, reflexes, etc..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Respiratory System</label>
                        <textarea
                          {...register('respiratorySystem')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Breath sounds, respiratory effort, etc..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Gastrointestinal System</label>
                        <textarea
                          {...register('gastrointestinalSystem')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Abdomen, bowel sounds, etc..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Genitourinary System</label>
                        <textarea
                          {...register('genitourinarySystem')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Urinary symptoms, genital examination if relevant..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Musculoskeletal System</label>
                        <textarea
                          {...register('musculoskeletalSystem')}
                          rows={2}
                          className="form-input w-full text-sm"
                          placeholder="Joints, muscles, range of motion..."
                        />
                      </div>
                      
                      {(department === 'gynecology' || patientInfo?.gender === 'Female') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Breast Examination</label>
                          <textarea
                            {...register('breastExamination')}
                            rows={2}
                            className="form-input w-full text-sm"
                            placeholder="Breast examination findings..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Department-specific fields */}
                {department === 'cardiology' && (
                  <div className="border rounded-lg p-3 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <Heart className="h-4 w-4 mr-1.5 text-error-500" />
                      Cardiac Assessment
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                        <input
                          type="text"
                          {...register('vitalSigns.bloodPressure')}
                          className="form-input text-sm"
                          placeholder="e.g., 120/80"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">ECG Results</label>
                        <input
                          type="text"
                          {...register('ecgResults')}
                          className="form-input text-sm"
                          placeholder="e.g., Normal sinus rhythm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {department === 'pediatrics' && (
                  <div className="border rounded-lg p-3 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <Baby className="h-4 w-4 mr-1.5 text-primary-500" />
                      Pediatric Assessment
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Growth Percentile</label>
                        <input
                          type="text"
                          {...register('growthPercentile')}
                          className="form-input text-sm"
                          placeholder="e.g., 75th percentile"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Developmental Assessment</label>
                        <input
                          type="text"
                          {...register('developmentalAssessment')}
                          className="form-input text-sm"
                          placeholder="e.g., Age-appropriate"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Medications Tab */}
            {activeTab === 'medications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Prescriptions</h3>
                  <button
                    type="button"
                    onClick={() => setPrescriptionCount(prev => prev + 1)}
                    className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Medication
                  </button>
                </div>
                
                {Array.from({ length: prescriptionCount }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700">Medication #{index + 1}</h4>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Medication Name</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.medication` as const, {
                            required: 'Medication name is required'
                          })}
                          className="form-input py-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.dosage` as const, {
                            required: 'Dosage is required'
                          })}
                          className="form-input py-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.frequency` as const, {
                            required: 'Frequency is required'
                          })}
                          className="form-input py-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.duration` as const, {
                            required: 'Duration is required'
                          })}
                          className="form-input py-1 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                        <textarea
                          {...register(`prescriptions.${index}.instructions` as const)}
                          className="form-input py-1 text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Diagnostic Tests Tab */}
            {activeTab === 'diagnosticTests' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Laboratory Tests */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Microscope className="h-4 w-4 mr-1.5 text-primary-500" />
                        Laboratory Tests
                      </h3>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={labTests.includes('Complete Blood Count')}
                              onChange={() => toggleLabTest('Complete Blood Count')}
                            />
                            <span className="ml-2 text-sm">Complete Blood Count</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={labTests.includes('Comprehensive Metabolic Panel')}
                              onChange={() => toggleLabTest('Comprehensive Metabolic Panel')}
                            />
                            <span className="ml-2 text-sm">Metabolic Panel</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={labTests.includes('Urinalysis')}
                              onChange={() => toggleLabTest('Urinalysis')}
                            />
                            <span className="ml-2 text-sm">Urinalysis</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={labTests.includes('Lipid Profile')}
                              onChange={() => toggleLabTest('Lipid Profile')}
                            />
                            <span className="ml-2 text-sm">Lipid Profile</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={labTests.includes('Liver Function Test')}
                              onChange={() => toggleLabTest('Liver Function Test')}
                            />
                            <span className="ml-2 text-sm">Liver Function</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={labTests.includes('Renal Function Test')}
                              onChange={() => toggleLabTest('Renal Function Test')}
                            />
                            <span className="ml-2 text-sm">Renal Function</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Additional Tests</label>
                        <textarea
                          className="form-input w-full text-sm"
                          rows={2}
                          placeholder="Specify any additional tests..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Radiology Tests */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <FileImage className="h-4 w-4 mr-1.5 text-primary-500" />
                        Radiology Tests
                      </h3>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={radiologyTests.includes('x_ray')}
                              onChange={() => toggleRadiologyTest('x_ray')}
                            />
                            <span className="ml-2 text-sm">X-Ray</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={radiologyTests.includes('ct_scan')}
                              onChange={() => toggleRadiologyTest('ct_scan')}
                            />
                            <span className="ml-2 text-sm">CT Scan</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={radiologyTests.includes('mri')}
                              onChange={() => toggleRadiologyTest('mri')}
                            />
                            <span className="ml-2 text-sm">MRI</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={radiologyTests.includes('ultrasound')}
                              onChange={() => toggleRadiologyTest('ultrasound')}
                            />
                            <span className="ml-2 text-sm">Ultrasound</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={radiologyTests.includes('mammogram')}
                              onChange={() => toggleRadiologyTest('mammogram')}
                            />
                            <span className="ml-2 text-sm">Mammogram</span>
                          </label>
                        </div>
                        
                        <div className="border rounded-lg p-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-primary-600 rounded"
                              checked={radiologyTests.includes('dexa_scan')}
                              onChange={() => toggleRadiologyTest('dexa_scan')}
                            />
                            <span className="ml-2 text-sm">DEXA Scan</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Additional Imaging</label>
                        <textarea
                          className="form-input w-full text-sm"
                          rows={2}
                          placeholder="Specify any additional imaging..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Special Instructions for Tests</h3>
                  <textarea
                    className="form-input w-full text-sm"
                    rows={3}
                    placeholder="Enter any special instructions for the ordered tests..."
                  />
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <textarea
                    {...register('diagnosis', { required: 'Diagnosis is required' })}
                    rows={3}
                    className="form-input w-full text-sm"
                    placeholder="Enter diagnosis..."
                  />
                  {errors.diagnosis && (
                    <p className="mt-1 text-sm text-error-600">{errors.diagnosis.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                  <textarea
                    {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                    rows={3}
                    className="form-input w-full text-sm"
                    placeholder="Enter treatment plan..."
                  />
                  {errors.treatmentPlan && (
                    <p className="mt-1 text-sm text-error-600">{errors.treatmentPlan.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="form-input w-full text-sm"
                    placeholder="Enter any additional notes..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="medicalCertificate"
                    {...register('medicalCertificate')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                    Issue Medical Certificate
                  </label>
                </div>
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Consultation Summary</h3>
                
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Chief Complaints</h4>
                    <p className="text-sm">{watch('chiefComplaint') || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Symptoms</h4>
                    {symptoms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {symptoms.map((symptom, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">None recorded</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Diagnosis</h4>
                    <p className="text-sm">{watch('diagnosis') || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Treatment Plan</h4>
                    <p className="text-sm">{watch('treatmentPlan') || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Medications</h4>
                    {watch('prescriptions')?.length > 0 ? (
                      <ul className="text-sm list-disc pl-5">
                        {watch('prescriptions').map((prescription, index) => (
                          prescription.medication && (
                            <li key={index}>
                              {prescription.medication} {prescription.dosage} - {prescription.frequency} for {prescription.duration}
                            </li>
                          )
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm">No medications prescribed</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Diagnostic Tests</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h5 className="text-xs font-medium">Laboratory</h5>
                        {labTests.length > 0 ? (
                          <ul className="text-sm list-disc pl-5">
                            {labTests.map((test, index) => (
                              <li key={index}>{test}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm">No lab tests ordered</p>
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-medium">Radiology</h5>
                        {radiologyTests.length > 0 ? (
                          <ul className="text-sm list-disc pl-5">
                            {radiologyTests.map((test, index) => (
                              <li key={index}>{test.replace('_', ' ').toUpperCase()}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm">No imaging ordered</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline text-sm py-1.5"
              >
                Cancel
              </button>
              
              {activeTab !== 'summary' ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['assessment', 'medications', 'diagnosticTests', 'notes', 'summary'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1] as any);
                    }
                  }}
                  className="btn btn-primary text-sm py-1.5"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary text-sm py-1.5"
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
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsultationForm;