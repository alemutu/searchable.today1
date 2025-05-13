import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Stethoscope, Pill, FileText, ClipboardList, CheckSquare, Search, Plus, X, Activity, Heart, Thermometer, Settings as Lungs, Droplets, Clock, Calendar, AlertTriangle, AlertCircle, ChevronRight, ChevronDown, Save, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_info?: {
    allergies?: {
      allergen: string;
      reaction: string;
      severity: string;
    }[];
    chronicConditions?: string[];
    currentMedications?: {
      name: string;
      dosage: string;
      frequency: string;
    }[];
    bloodType?: string;
    smoker?: boolean;
    alcoholConsumption?: string;
  };
}

interface VitalSigns {
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  painLevel?: number;
  recordedAt?: string;
}

interface ConsultationFormData {
  chiefComplaint: string;
  presentIllness: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  followUpDate?: string;
  followUpNotes?: string;
  medicalCertificate: boolean;
  medicalCertificateDays?: number;
  prescriptions: {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  diagnosticTests: {
    id: string;
    testName: string;
    instructions: string;
    urgency: 'routine' | 'urgent' | 'stat';
  }[];
  departmentSpecificData?: any;
}

// Common medications for autocomplete
const commonMedications = [
  'Acetaminophen (Tylenol)',
  'Ibuprofen (Advil, Motrin)',
  'Aspirin',
  'Amoxicillin',
  'Azithromycin',
  'Lisinopril',
  'Atorvastatin (Lipitor)',
  'Metformin',
  'Levothyroxine (Synthroid)',
  'Amlodipine',
  'Omeprazole (Prilosec)',
  'Albuterol (Ventolin)',
  'Prednisone',
  'Metoprolol',
  'Gabapentin',
  'Hydrochlorothiazide',
  'Sertraline (Zoloft)',
  'Fluoxetine (Prozac)',
  'Losartan',
  'Simvastatin (Zocor)'
];

// Department-specific form fields
const departmentSpecificFields: Record<string, React.ReactNode> = {
  cardiology: (
    <div className="space-y-4">
      <div>
        <label className="form-label">Cardiovascular Examination</label>
        <textarea
          name="cardiovascularExam"
          className="form-input"
          rows={3}
          placeholder="Document heart sounds, murmurs, rhythm, etc."
        />
      </div>
      <div>
        <label className="form-label">ECG Findings</label>
        <textarea
          name="ecgFindings"
          className="form-input"
          rows={2}
          placeholder="Document ECG results if available"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Chest Pain Scale (0-10)</label>
          <input
            type="number"
            name="chestPainScale"
            className="form-input"
            min={0}
            max={10}
          />
        </div>
        <div>
          <label className="form-label">Cardiac Risk Factors</label>
          <select name="cardiacRiskLevel" className="form-input">
            <option value="">Select risk level</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </select>
        </div>
      </div>
    </div>
  ),
  
  orthopedic: (
    <div className="space-y-4">
      <div>
        <label className="form-label">Musculoskeletal Examination</label>
        <textarea
          name="musculoskeletalExam"
          className="form-input"
          rows={3}
          placeholder="Document range of motion, strength, stability, etc."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Affected Joint/Bone</label>
          <select name="affectedArea" className="form-input">
            <option value="">Select area</option>
            <option value="shoulder">Shoulder</option>
            <option value="elbow">Elbow</option>
            <option value="wrist">Wrist</option>
            <option value="hand">Hand</option>
            <option value="hip">Hip</option>
            <option value="knee">Knee</option>
            <option value="ankle">Ankle</option>
            <option value="foot">Foot</option>
            <option value="spine">Spine</option>
          </select>
        </div>
        <div>
          <label className="form-label">Injury Type</label>
          <select name="injuryType" className="form-input">
            <option value="">Select type</option>
            <option value="fracture">Fracture</option>
            <option value="sprain">Sprain</option>
            <option value="strain">Strain</option>
            <option value="dislocation">Dislocation</option>
            <option value="tear">Tear</option>
            <option value="degenerative">Degenerative</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Mobility Assessment</label>
        <select name="mobilityAssessment" className="form-input">
          <option value="">Select mobility level</option>
          <option value="normal">Normal</option>
          <option value="slightly_limited">Slightly Limited</option>
          <option value="moderately_limited">Moderately Limited</option>
          <option value="severely_limited">Severely Limited</option>
          <option value="immobile">Immobile</option>
        </select>
      </div>
    </div>
  ),
  
  eye: (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Visual Acuity (Right)</label>
          <input
            type="text"
            name="visualAcuityRight"
            className="form-input"
            placeholder="e.g., 20/20"
          />
        </div>
        <div>
          <label className="form-label">Visual Acuity (Left)</label>
          <input
            type="text"
            name="visualAcuityLeft"
            className="form-input"
            placeholder="e.g., 20/20"
          />
        </div>
      </div>
      <div>
        <label className="form-label">Intraocular Pressure</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <span>Right:</span>
            <input
              type="number"
              name="iop_right"
              className="form-input"
              placeholder="mmHg"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span>Left:</span>
            <input
              type="number"
              name="iop_left"
              className="form-input"
              placeholder="mmHg"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="form-label">Fundus Examination</label>
        <textarea
          name="fundusExam"
          className="form-input"
          rows={2}
          placeholder="Document optic disc, macula, vessels, etc."
        />
      </div>
      <div>
        <label className="form-label">Eye Condition</label>
        <select name="eyeCondition" className="form-input">
          <option value="">Select condition</option>
          <option value="cataract">Cataract</option>
          <option value="glaucoma">Glaucoma</option>
          <option value="macular_degeneration">Macular Degeneration</option>
          <option value="diabetic_retinopathy">Diabetic Retinopathy</option>
          <option value="dry_eye">Dry Eye</option>
          <option value="conjunctivitis">Conjunctivitis</option>
          <option value="refractive_error">Refractive Error</option>
        </select>
      </div>
    </div>
  ),
  
  dental: (
    <div className="space-y-4">
      <div>
        <label className="form-label">Dental Examination</label>
        <textarea
          name="dentalExam"
          className="form-input"
          rows={3}
          placeholder="Document dental findings"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Procedure Type</label>
          <select name="procedureType" className="form-input">
            <option value="">Select procedure</option>
            <option value="cleaning">Cleaning</option>
            <option value="filling">Filling</option>
            <option value="extraction">Extraction</option>
            <option value="root_canal">Root Canal</option>
            <option value="crown">Crown</option>
            <option value="bridge">Bridge</option>
            <option value="dentures">Dentures</option>
            <option value="implant">Implant</option>
          </select>
        </div>
        <div>
          <label className="form-label">Affected Teeth</label>
          <input
            type="text"
            name="affectedTeeth"
            className="form-input"
            placeholder="e.g., 14, 15, 16"
          />
        </div>
      </div>
      <div>
        <label className="form-label">Oral Hygiene Status</label>
        <select name="oralHygieneStatus" className="form-input">
          <option value="">Select status</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
      </div>
    </div>
  ),
  
  pediatrics: (
    <div className="space-y-4">
      <div>
        <label className="form-label">Developmental Assessment</label>
        <select name="developmentalAssessment" className="form-input">
          <option value="">Select assessment</option>
          <option value="normal">Normal for age</option>
          <option value="mild_delay">Mild delay</option>
          <option value="moderate_delay">Moderate delay</option>
          <option value="severe_delay">Severe delay</option>
        </select>
      </div>
      <div>
        <label className="form-label">Growth Percentiles</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500">Height</label>
            <div className="flex items-center">
              <input
                type="number"
                name="heightPercentile"
                className="form-input"
                placeholder="%"
              />
              <span className="ml-1">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Weight</label>
            <div className="flex items-center">
              <input
                type="number"
                name="weightPercentile"
                className="form-input"
                placeholder="%"
              />
              <span className="ml-1">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Head Circ.</label>
            <div className="flex items-center">
              <input
                type="number"
                name="headCircumferencePercentile"
                className="form-input"
                placeholder="%"
              />
              <span className="ml-1">%</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label className="form-label">Immunization Status</label>
        <select name="immunizationStatus" className="form-input">
          <option value="">Select status</option>
          <option value="up_to_date">Up to date</option>
          <option value="due_now">Due now</option>
          <option value="overdue">Overdue</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>
    </div>
  ),
  
  gynecology: (
    <div className="space-y-4">
      <div>
        <label className="form-label">Gynecological Examination</label>
        <textarea
          name="gynecologicalExam"
          className="form-input"
          rows={3}
          placeholder="Document examination findings"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Last Menstrual Period</label>
          <input
            type="date"
            name="lastMenstrualPeriod"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Pregnancy Status</label>
          <select name="pregnancyStatus" className="form-input">
            <option value="">Select status</option>
            <option value="not_pregnant">Not Pregnant</option>
            <option value="pregnant">Pregnant</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Pap Smear Status</label>
        <select name="papSmearStatus" className="form-input">
          <option value="">Select status</option>
          <option value="up_to_date">Up to date</option>
          <option value="due_now">Due now</option>
          <option value="overdue">Overdue</option>
          <option value="never">Never done</option>
        </select>
      </div>
    </div>
  ),
  
  general: (
    <div className="space-y-4">
      <div>
        <label className="form-label">General Physical Examination</label>
        <textarea
          name="generalExam"
          className="form-input"
          rows={3}
          placeholder="Document general physical findings"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">General Appearance</label>
          <select name="generalAppearance" className="form-input">
            <option value="">Select appearance</option>
            <option value="well">Well-appearing</option>
            <option value="mild_distress">Mild distress</option>
            <option value="moderate_distress">Moderate distress</option>
            <option value="severe_distress">Severe distress</option>
          </select>
        </div>
        <div>
          <label className="form-label">Hydration Status</label>
          <select name="hydrationStatus" className="form-input">
            <option value="">Select status</option>
            <option value="well_hydrated">Well hydrated</option>
            <option value="mild_dehydration">Mild dehydration</option>
            <option value="moderate_dehydration">Moderate dehydration</option>
            <option value="severe_dehydration">Severe dehydration</option>
          </select>
        </div>
      </div>
    </div>
  ),
  
  physiotherapy: (
    <div className="space-y-4">
      <div>
        <label className="form-label">Functional Assessment</label>
        <textarea
          name="functionalAssessment"
          className="form-input"
          rows={3}
          placeholder="Document functional limitations and capabilities"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Pain Assessment</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              name="painScore"
              className="form-input"
              min={0}
              max={10}
              placeholder="0-10"
            />
            <span className="text-sm text-gray-500">/10</span>
          </div>
        </div>
        <div>
          <label className="form-label">Mobility Status</label>
          <select name="mobilityStatus" className="form-input">
            <option value="">Select status</option>
            <option value="independent">Independent</option>
            <option value="minimal_assistance">Minimal assistance</option>
            <option value="moderate_assistance">Moderate assistance</option>
            <option value="maximum_assistance">Maximum assistance</option>
            <option value="dependent">Dependent</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Treatment Plan</label>
        <select name="treatmentModality" className="form-input">
          <option value="">Select primary modality</option>
          <option value="therapeutic_exercise">Therapeutic Exercise</option>
          <option value="manual_therapy">Manual Therapy</option>
          <option value="electrotherapy">Electrotherapy</option>
          <option value="heat_therapy">Heat Therapy</option>
          <option value="cold_therapy">Cold Therapy</option>
          <option value="ultrasound">Ultrasound</option>
          <option value="gait_training">Gait Training</option>
        </select>
      </div>
    </div>
  )
};

const ConsultationForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'medications' | 'diagnostics' | 'notes' | 'summary'>('assessment');
  const [medicationSearch, setMedicationSearch] = useState('');
  const [filteredMedications, setFilteredMedications] = useState<string[]>([]);
  const [showMedicationResults, setShowMedicationResults] = useState(false);
  const [showCustomMedicationForm, setShowCustomMedicationForm] = useState(false);
  const [customMedication, setCustomMedication] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [departmentType, setDepartmentType] = useState<string>('general');
  const [showMedicalHistory, setShowMedicalHistory] = useState(true);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      presentIllness: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      followUpDate: undefined,
      followUpNotes: '',
      medicalCertificate: false,
      medicalCertificateDays: 0,
      prescriptions: [],
      diagnosticTests: [],
      departmentSpecificData: {}
    }
  });
  
  const prescriptions = watch('prescriptions');
  const diagnosticTests = watch('diagnosticTests');
  const medicalCertificate = watch('medicalCertificate');
  
  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchLatestVitalSigns();
    }
  }, [patientId]);
  
  useEffect(() => {
    if (medicationSearch.length > 1) {
      const filtered = commonMedications.filter(med => 
        med.toLowerCase().includes(medicationSearch.toLowerCase())
      );
      setFilteredMedications(filtered);
      setShowMedicationResults(true);
    } else {
      setShowMedicationResults(false);
    }
  }, [medicationSearch]);
  
  const fetchPatient = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockPatient: Patient = {
          id: patientId || '00000000-0000-0000-0000-000000000001',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1980-05-15',
          gender: 'Male',
          medical_info: {
            allergies: [
              { allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' },
              { allergen: 'Peanuts', reaction: 'Anaphylaxis', severity: 'severe' }
            ],
            chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
            currentMedications: [
              { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' },
              { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
            ],
            bloodType: 'O+',
            smoker: false,
            alcoholConsumption: 'occasional'
          }
        };
        setPatient(mockPatient);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error loading patient:', error);
      addNotification({
        message: 'Failed to load patient information',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchLatestVitalSigns = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockVitalSigns: VitalSigns = {
          temperature: 37.2,
          heartRate: 72,
          respiratoryRate: 16,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 98,
          weight: 70,
          height: 175,
          bmi: 22.9,
          painLevel: 0,
          recordedAt: new Date().toISOString()
        };
        setVitalSigns(mockVitalSigns);
        return;
      }

      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned
          throw error;
        }
        return;
      }
      
      setVitalSigns({
        temperature: data.temperature,
        heartRate: data.heart_rate,
        respiratoryRate: data.respiratory_rate,
        bloodPressureSystolic: data.blood_pressure_systolic,
        bloodPressureDiastolic: data.blood_pressure_diastolic,
        oxygenSaturation: data.oxygen_saturation,
        weight: data.weight,
        height: data.height,
        bmi: data.bmi,
        painLevel: data.pain_level,
        recordedAt: data.recorded_at
      });
    } catch (error) {
      console.error('Error loading vital signs:', error);
    }
  };
  
  const handleAddMedication = (medication: string) => {
    const newPrescription = {
      id: uuidv4(),
      medication,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    
    setValue('prescriptions', [...prescriptions, newPrescription]);
    setMedicationSearch('');
    setShowMedicationResults(false);
  };
  
  const handleAddCustomMedication = () => {
    if (!customMedication.medication) return;
    
    const newPrescription = {
      id: uuidv4(),
      medication: customMedication.medication,
      dosage: customMedication.dosage,
      frequency: customMedication.frequency,
      duration: customMedication.duration,
      instructions: customMedication.instructions
    };
    
    setValue('prescriptions', [...prescriptions, newPrescription]);
    setCustomMedication({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setShowCustomMedicationForm(false);
  };
  
  const handleRemoveMedication = (id: string) => {
    setValue('prescriptions', prescriptions.filter(p => p.id !== id));
  };
  
  const handleAddDiagnosticTest = () => {
    const newTest = {
      id: uuidv4(),
      testName: '',
      instructions: '',
      urgency: 'routine' as const
    };
    
    setValue('diagnosticTests', [...diagnosticTests, newTest]);
  };
  
  const handleRemoveDiagnosticTest = (id: string) => {
    setValue('diagnosticTests', diagnosticTests.filter(t => t.id !== id));
  };
  
  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
        navigate('/consultations');
        return;
      }
      
      // Create consultation record
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patient.id,
          doctor_id: user.id,
          hospital_id: hospital.id,
          consultation_date: new Date().toISOString(),
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatment_plan: data.treatmentPlan,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          prescriptions: data.prescriptions.length > 0 ? data.prescriptions : null,
          department_id: '00000000-0000-0000-0000-000000000000' // Replace with actual department ID
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // If prescriptions were added, create pharmacy order
      if (data.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultation.id,
            medications: data.prescriptions.map(p => ({
              medication: p.medication,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
              quantity: 1,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending'
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // If diagnostic tests were ordered, create lab/radiology orders
      if (data.diagnosticTests.length > 0) {
        // Implementation would depend on your schema for lab/radiology orders
        console.log('Diagnostic tests ordered:', data.diagnosticTests);
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: data.prescriptions.length > 0 ? 'pharmacy' : 'billing'
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      navigate('/consultations');
    } catch (error: any) {
      console.error('Error submitting consultation form:', error.message);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-3 mb-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold shadow-sm">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-white">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center text-primary-100 text-xs">
                <User className="h-3 w-3 mr-1" />
                <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3 mr-1" />
                <span className="bg-black bg-opacity-20 px-1.5 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          {/* Left Side - Vital Signs and Medical History */}
          <div className="w-1/4 space-y-3">
            {/* Vital Signs Card */}
            <div className="bg-white rounded-lg shadow-sm p-3 h-[calc(50vh-80px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                  Vital Signs
                </h3>
                {vitalSigns?.recordedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(vitalSigns.recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Temperature</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.temperature ? `${vitalSigns.temperature}°C` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Heart className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Heart Rate</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.heartRate ? `${vitalSigns.heartRate} bpm` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Respiratory Rate</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.respiratoryRate ? `${vitalSigns.respiratoryRate} bpm` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Blood Pressure</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.bloodPressureSystolic && vitalSigns?.bloodPressureDiastolic 
                      ? `${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic} mmHg` 
                      : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Oxygen Saturation</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.oxygenSaturation ? `${vitalSigns.oxygenSaturation}%` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Weight</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.weight ? `${vitalSigns.weight} kg` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">Height</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.height ? `${vitalSigns.height} cm` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">BMI</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns?.bmi ? vitalSigns.bmi.toFixed(1) : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Medical History Card */}
            <div className="bg-white rounded-lg shadow-sm p-3 h-[calc(50vh-80px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
                  Medical History
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowMedicalHistory(!showMedicalHistory)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {showMedicalHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
              
              {showMedicalHistory && (
                <div className="space-y-3">
                  {/* Allergies */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 flex items-center">
                      <AlertCircle className="h-3 w-3 text-error-500 mr-1" />
                      Allergies
                    </h4>
                    {patient.medical_info?.allergies && patient.medical_info.allergies.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {patient.medical_info.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-1 mr-1.5 ${
                              allergy.severity === 'severe' ? 'bg-error-500' : 
                              allergy.severity === 'moderate' ? 'bg-warning-500' : 
                              'bg-gray-400'
                            }`} />
                            <div>
                              <p className="text-xs font-medium">{allergy.allergen}</p>
                              <p className="text-xs text-gray-500">{allergy.reaction}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">No known allergies</p>
                    )}
                  </div>
                  
                  {/* Chronic Conditions */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 flex items-center">
                      <Activity className="h-3 w-3 text-warning-500 mr-1" />
                      Chronic Conditions
                    </h4>
                    {patient.medical_info?.chronicConditions && patient.medical_info.chronicConditions.length > 0 ? (
                      <div className="mt-1">
                        <ul className="text-xs space-y-1">
                          {patient.medical_info.chronicConditions.map((condition, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-warning-500 mr-1.5" />
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">No chronic conditions</p>
                    )}
                  </div>
                  
                  {/* Current Medications */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 flex items-center">
                      <Pill className="h-3 w-3 text-primary-500 mr-1" />
                      Current Medications
                    </h4>
                    {patient.medical_info?.currentMedications && patient.medical_info.currentMedications.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {patient.medical_info.currentMedications.map((medication, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 mr-1.5" />
                            <div>
                              <p className="text-xs font-medium">{medication.name}</p>
                              <p className="text-xs text-gray-500">{medication.dosage} - {medication.frequency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">No current medications</p>
                    )}
                  </div>
                  
                  {/* Other Medical Info */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700">Other Information</h4>
                    <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                      {patient.medical_info?.bloodType && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Blood Type:</span>
                          <span className="text-xs font-medium ml-1">{patient.medical_info.bloodType}</span>
                        </div>
                      )}
                      {patient.medical_info?.smoker !== undefined && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Smoker:</span>
                          <span className="text-xs font-medium ml-1">{patient.medical_info.smoker ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      {patient.medical_info?.alcoholConsumption && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Alcohol:</span>
                          <span className="text-xs font-medium ml-1">{patient.medical_info.alcoholConsumption}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side - Main Consultation Form */}
          <div className="w-3/4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[calc(100vh-160px)]">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                    activeTab === 'assessment'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('assessment')}
                >
                  <Stethoscope className="h-4 w-4 inline mr-1" />
                  Assessment
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                    activeTab === 'medications'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('medications')}
                >
                  <Pill className="h-4 w-4 inline mr-1" />
                  Medications
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                    activeTab === 'diagnostics'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('diagnostics')}
                >
                  <ClipboardList className="h-4 w-4 inline mr-1" />
                  Diagnostic Tests
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                    activeTab === 'notes'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('notes')}
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Notes
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                    activeTab === 'summary'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('summary')}
                >
                  <CheckSquare className="h-4 w-4 inline mr-1" />
                  Summary
                </button>
              </div>
              
              {/* Tab Content - Scrollable */}
              <div className="p-4 overflow-y-auto h-[calc(100vh-220px)]">
                {/* Assessment Tab */}
                {activeTab === 'assessment' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label required">Chief Complaint</label>
                      <textarea
                        {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                        className={`form-input ${errors.chiefComplaint ? 'border-error-300' : ''}`}
                        rows={2}
                        placeholder="Patient's main complaint"
                      />
                      {errors.chiefComplaint && (
                        <p className="form-error">{errors.chiefComplaint.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">History of Present Illness</label>
                      <textarea
                        {...register('presentIllness', { required: 'Present illness is required' })}
                        className={`form-input ${errors.presentIllness ? 'border-error-300' : ''}`}
                        rows={3}
                        placeholder="Detailed description of the present illness"
                      />
                      {errors.presentIllness && (
                        <p className="form-error">{errors.presentIllness.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">Department</label>
                      <select 
                        className="form-input"
                        value={departmentType}
                        onChange={(e) => setDepartmentType(e.target.value)}
                      >
                        <option value="general">General Medicine</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="orthopedic">Orthopedic</option>
                        <option value="eye">Eye Clinic</option>
                        <option value="dental">Dental</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="gynecology">Gynecology</option>
                        <option value="physiotherapy">Physiotherapy</option>
                      </select>
                    </div>
                    
                    {/* Department-specific fields */}
                    {departmentSpecificFields[departmentType]}
                    
                    <div>
                      <label className="form-label required">Diagnosis</label>
                      <textarea
                        {...register('diagnosis', { required: 'Diagnosis is required' })}
                        className={`form-input ${errors.diagnosis ? 'border-error-300' : ''}`}
                        rows={2}
                        placeholder="Primary and differential diagnoses"
                      />
                      {errors.diagnosis && (
                        <p className="form-error">{errors.diagnosis.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label required">Treatment Plan</label>
                      <textarea
                        {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                        className={`form-input ${errors.treatmentPlan ? 'border-error-300' : ''}`}
                        rows={3}
                        placeholder="Detailed treatment plan"
                      />
                      {errors.treatmentPlan && (
                        <p className="form-error">{errors.treatmentPlan.message}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Medications Tab */}
                {activeTab === 'medications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative flex-grow mr-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={medicationSearch}
                          onChange={(e) => setMedicationSearch(e.target.value)}
                          className="form-input pl-10 w-full"
                          placeholder="Search medications..."
                        />
                        {showMedicationResults && filteredMedications.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                            {filteredMedications.map((med, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleAddMedication(med)}
                              >
                                {med}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomMedicationForm(true)}
                        className="btn btn-primary flex items-center"
                      >
                        <Plus className="h-5 w-5 mr-1" />
                        Add Custom
                      </button>
                    </div>
                    
                    {showCustomMedicationForm && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-medium text-gray-900">Add Custom Medication</h3>
                          <button
                            type="button"
                            onClick={() => setShowCustomMedicationForm(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="form-label required">Medication Name</label>
                            <input
                              type="text"
                              value={customMedication.medication}
                              onChange={(e) => setCustomMedication({...customMedication, medication: e.target.value})}
                              className="form-input"
                              placeholder="Enter medication name"
                            />
                          </div>
                          <div>
                            <label className="form-label">Dosage</label>
                            <input
                              type="text"
                              value={customMedication.dosage}
                              onChange={(e) => setCustomMedication({...customMedication, dosage: e.target.value})}
                              className="form-input"
                              placeholder="e.g., 500mg"
                            />
                          </div>
                          <div>
                            <label className="form-label">Frequency</label>
                            <input
                              type="text"
                              value={customMedication.frequency}
                              onChange={(e) => setCustomMedication({...customMedication, frequency: e.target.value})}
                              className="form-input"
                              placeholder="e.g., Twice daily"
                            />
                          </div>
                          <div>
                            <label className="form-label">Duration</label>
                            <input
                              type="text"
                              value={customMedication.duration}
                              onChange={(e) => setCustomMedication({...customMedication, duration: e.target.value})}
                              className="form-input"
                              placeholder="e.g., 7 days"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="form-label">Instructions</label>
                            <input
                              type="text"
                              value={customMedication.instructions}
                              onChange={(e) => setCustomMedication({...customMedication, instructions: e.target.value})}
                              className="form-input"
                              placeholder="e.g., Take with food"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddCustomMedication}
                            disabled={!customMedication.medication}
                            className="btn btn-primary"
                          >
                            Add Medication
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {prescriptions.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                          <Pill className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No medications prescribed yet</h3>
                        <p className="text-sm text-gray-500">
                          Search above or click Add Custom to prescribe medications
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('diagnostics')}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          Skip prescribing medications
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prescriptions.map((prescription, index) => (
                          <div key={prescription.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 flex-grow">
                                <div className="flex items-center">
                                  <Pill className="h-5 w-5 text-primary-500 mr-2" />
                                  <h3 className="text-md font-medium text-gray-900">{prescription.medication}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="form-label">Dosage</label>
                                    <input
                                      type="text"
                                      value={prescription.dosage}
                                      onChange={(e) => {
                                        const updatedPrescriptions = [...prescriptions];
                                        updatedPrescriptions[index].dosage = e.target.value;
                                        setValue('prescriptions', updatedPrescriptions);
                                      }}
                                      className="form-input"
                                      placeholder="e.g., 500mg"
                                    />
                                  </div>
                                  <div>
                                    <label className="form-label">Frequency</label>
                                    <input
                                      type="text"
                                      value={prescription.frequency}
                                      onChange={(e) => {
                                        const updatedPrescriptions = [...prescriptions];
                                        updatedPrescriptions[index].frequency = e.target.value;
                                        setValue('prescriptions', updatedPrescriptions);
                                      }}
                                      className="form-input"
                                      placeholder="e.g., Twice daily"
                                    />
                                  </div>
                                  <div>
                                    <label className="form-label">Duration</label>
                                    <input
                                      type="text"
                                      value={prescription.duration}
                                      onChange={(e) => {
                                        const updatedPrescriptions = [...prescriptions];
                                        updatedPrescriptions[index].duration = e.target.value;
                                        setValue('prescriptions', updatedPrescriptions);
                                      }}
                                      className="form-input"
                                      placeholder="e.g., 7 days"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="form-label">Instructions</label>
                                    <input
                                      type="text"
                                      value={prescription.instructions}
                                      onChange={(e) => {
                                        const updatedPrescriptions = [...prescriptions];
                                        updatedPrescriptions[index].instructions = e.target.value;
                                        setValue('prescriptions', updatedPrescriptions);
                                      }}
                                      className="form-input"
                                      placeholder="e.g., Take with food"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(prescription.id)}
                                className="text-gray-400 hover:text-gray-500 ml-2"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Diagnostic Tests Tab */}
                {activeTab === 'diagnostics' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddDiagnosticTest}
                        className="btn btn-primary flex items-center"
                      >
                        <Plus className="h-5 w-5 mr-1" />
                        Add Test
                      </button>
                    </div>
                    
                    {diagnosticTests.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                          <ClipboardList className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No diagnostic tests ordered</h3>
                        <p className="text-sm text-gray-500">
                          Click "Add Test" to order laboratory or imaging tests
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('notes')}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          Skip ordering tests
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {diagnosticTests.map((test, index) => (
                          <div key={test.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3 flex-grow">
                                <div>
                                  <label className="form-label required">Test Name</label>
                                  <input
                                    type="text"
                
                                    value={test.testName}
                                    onChange={(e) => {
                                      const updatedTests = [...diagnosticTests];
                                      updatedTests[index].testName = e.target.value;
                                      setValue('diagnosticTests', updatedTests);
                                    }}
                                    className="form-input"
                                    placeholder="e.g., Complete Blood Count"
                                  />
                                </div>
                                <div>
                                  <label className="form-label">Instructions</label>
                                  <textarea
                                    value={test.instructions}
                                    onChange={(e) => {
                                      const updatedTests = [...diagnosticTests];
                                      updatedTests[index].instructions = e.target.value;
                                      setValue('diagnosticTests', updatedTests);
                                    }}
                                    className="form-input"
                                    rows={2}
                                    placeholder="Special instructions for this test"
                                  />
                                </div>
                                <div>
                                  <label className="form-label">Urgency</label>
                                  <select
                                    value={test.urgency}
                                    onChange={(e) => {
                                      const updatedTests = [...diagnosticTests];
                                      updatedTests[index].urgency = e.target.value as 'routine' | 'urgent' | 'stat';
                                      setValue('diagnosticTests', updatedTests);
                                    }}
                                    className="form-input"
                                  >
                                    <option value="routine">Routine</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="stat">STAT (Immediate)</option>
                                  </select>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveDiagnosticTest(test.id)}
                                className="text-gray-400 hover:text-gray-500 ml-2"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Additional Notes</label>
                      <textarea
                        {...register('notes')}
                        className="form-input"
                        rows={5}
                        placeholder="Any additional notes about the patient's condition or treatment"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Follow-up</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500">Follow-up Date</label>
                          <input
                            type="date"
                            {...register('followUpDate')}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Follow-up Notes</label>
                          <input
                            type="text"
                            {...register('followUpNotes')}
                            className="form-input"
                            placeholder="e.g., Return for lab results"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
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
                      
                      {medicalCertificate && (
                        <div className="mt-3 pl-6">
                          <label className="form-label">Number of Days</label>
                          <input
                            type="number"
                            {...register('medicalCertificateDays')}
                            className="form-input w-24"
                            min={1}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Assessment</h3>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Chief Complaint:</span>
                          <p className="text-sm text-gray-600">{watch('chiefComplaint') || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Diagnosis:</span>
                          <p className="text-sm text-gray-600">{watch('diagnosis') || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Treatment Plan:</span>
                          <p className="text-sm text-gray-600">{watch('treatmentPlan') || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Medications</h3>
                      {prescriptions.length > 0 ? (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {prescriptions.map((prescription) => (
                            <div key={prescription.id} className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0">
                              <div className="flex items-center">
                                <Pill className="h-4 w-4 text-primary-500 mr-2" />
                                <span className="text-sm font-medium">{prescription.medication}</span>
                              </div>
                              <div className="ml-6 text-xs text-gray-600">
                                {prescription.dosage && <span>{prescription.dosage} </span>}
                                {prescription.frequency && <span>- {prescription.frequency} </span>}
                                {prescription.duration && <span>for {prescription.duration}</span>}
                                {prescription.instructions && (
                                  <p className="mt-1">{prescription.instructions}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No medications prescribed</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Diagnostic Tests</h3>
                      {diagnosticTests.length > 0 ? (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {diagnosticTests.map((test) => (
                            <div key={test.id} className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0">
                              <div className="flex items-center">
                                <ClipboardList className="h-4 w-4 text-primary-500 mr-2" />
                                <span className="text-sm font-medium">{test.testName}</span>
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                  test.urgency === 'stat' ? 'bg-error-100 text-error-800' :
                                  test.urgency === 'urgent' ? 'bg-warning-100 text-warning-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {test.urgency.toUpperCase()}
                                </span>
                              </div>
                              {test.instructions && (
                                <p className="ml-6 text-xs text-gray-600 mt-1">{test.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No diagnostic tests ordered</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Additional Information</h3>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        {watch('notes') && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Notes:</span>
                            <p className="text-sm text-gray-600">{watch('notes')}</p>
                          </div>
                        )}
                        
                        {watch('followUpDate') && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Follow-up:</span>
                            <p className="text-sm text-gray-600">
                              {new Date(watch('followUpDate')).toLocaleDateString()}
                              {watch('followUpNotes') && ` - ${watch('followUpNotes')}`}
                            </p>
                          </div>
                        )}
                        
                        {watch('medicalCertificate') && (
                          <div className="flex items-center">
                            <CheckSquare className="h-4 w-4 text-success-500 mr-2" />
                            <span className="text-sm text-gray-700">
                              Medical Certificate for {watch('medicalCertificateDays')} day(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Form Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                
                <div className="flex space-x-2">
                  {activeTab !== 'assessment' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['assessment', 'medications', 'diagnostics', 'notes', 'summary'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1] as any);
                        }
                      }}
                      className="btn btn-outline"
                    >
                      Previous
                    </button>
                  )}
                  
                  {activeTab !== 'summary' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['assessment', 'medications', 'diagnostics', 'notes', 'summary'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1] as any);
                        }
                      }}
                      className="btn btn-primary"
                    >
                      Next
                    </button>
                  ) : (
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
                          <Save className="h-5 w-5 mr-2" />
                          Complete Consultation
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;