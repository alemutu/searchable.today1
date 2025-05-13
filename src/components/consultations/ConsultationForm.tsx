import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Calendar, 
  FileText, 
  Pill, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  FileImage,
  Stethoscope,
  Heart,
  Brain,
  Lungs,
  Droplets,
  Activity,
  Thermometer,
  Clipboard,
  ClipboardList,
  Pencil,
  X
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_history?: any;
}

interface ConsultationFormData {
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  pastMedicalHistory: string;
  pastSurgicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  medications: string;
  allergies: string;
  gynecologicalHistory: string;
  generalExamination: string;
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    bloodPressure: string;
    oxygenSaturation: string;
  };
  systemicExamination: {
    cardiovascular: string;
    respiratory: string;
    gastrointestinal: string;
    genitourinary: string;
    musculoskeletal: string;
    neurological: string;
    breast: string;
    other: string;
  };
  diagnosis: string;
  differentialDiagnosis: string;
  treatmentPlan: string;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  labOrders: {
    testName: string;
    instructions: string;
    urgency: string;
  }[];
  radiologyOrders: {
    scanType: string;
    bodyPart: string;
    instructions: string;
    urgency: string;
  }[];
  referrals: {
    speciality: string;
    reason: string;
    urgency: string;
  }[];
  followUp: string;
  notes: string;
  medicalCertificate: boolean;
  medicalCertificateDays: number;
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'orders' | 'prescriptions' | 'notes'>('assessment');
  const [activeAssessmentSection, setActiveAssessmentSection] = useState<'history' | 'examination' | 'diagnosis'>('history');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      historyOfPresentingIllness: '',
      pastMedicalHistory: '',
      pastSurgicalHistory: '',
      familyHistory: '',
      socialHistory: '',
      medications: '',
      allergies: '',
      gynecologicalHistory: '',
      generalExamination: '',
      vitalSigns: {
        temperature: '',
        heartRate: '',
        respiratoryRate: '',
        bloodPressure: '',
        oxygenSaturation: ''
      },
      systemicExamination: {
        cardiovascular: '',
        respiratory: '',
        gastrointestinal: '',
        genitourinary: '',
        musculoskeletal: '',
        neurological: '',
        breast: '',
        other: ''
      },
      diagnosis: '',
      differentialDiagnosis: '',
      treatmentPlan: '',
      prescriptions: [],
      labOrders: [],
      radiologyOrders: [],
      referrals: [],
      followUp: '',
      notes: '',
      medicalCertificate: false,
      medicalCertificateDays: 0
    }
  });
  
  const medicalCertificate = watch('medicalCertificate');
  const patientGender = patient?.gender || '';
  
  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId, hospital]);
  
  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
        
      if (error) throw error;
      setPatient(data);
      
      // Pre-fill allergies if available in medical history
      if (data.medical_history?.allergies) {
        const allergyText = Array.isArray(data.medical_history.allergies) 
          ? data.medical_history.allergies.map((a: any) => 
              typeof a === 'string' ? a : a.allergen || a
            ).join(', ')
          : '';
        
        setValue('allergies', allergyText);
      }
      
      // Pre-fill medications if available in medical history
      if (data.medical_history?.currentMedications) {
        const medicationsText = Array.isArray(data.medical_history.currentMedications) 
          ? data.medical_history.currentMedications.map((m: any) => 
              typeof m === 'string' ? m : m.name || m
            ).join(', ')
          : '';
        
        setValue('medications', medicationsText);
      }
      
      // Pre-fill past medical history if available
      if (data.medical_history?.chronicConditions) {
        const conditionsText = Array.isArray(data.medical_history.chronicConditions) 
          ? data.medical_history.chronicConditions.join(', ')
          : '';
        
        setValue('pastMedicalHistory', conditionsText);
      }
      
    } catch (error) {
      console.error('Error fetching patient:', error);
      addNotification({
        message: 'Failed to load patient information',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
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
  
  const addPrescription = () => {
    const prescriptions = watch('prescriptions');
    setValue('prescriptions', [
      ...prescriptions, 
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };
  
  const removePrescription = (index: number) => {
    const prescriptions = watch('prescriptions');
    setValue('prescriptions', prescriptions.filter((_, i) => i !== index));
  };
  
  const addLabOrder = () => {
    const labOrders = watch('labOrders');
    setValue('labOrders', [
      ...labOrders, 
      { testName: '', instructions: '', urgency: 'routine' }
    ]);
  };
  
  const removeLabOrder = (index: number) => {
    const labOrders = watch('labOrders');
    setValue('labOrders', labOrders.filter((_, i) => i !== index));
  };
  
  const addRadiologyOrder = () => {
    const radiologyOrders = watch('radiologyOrders');
    setValue('radiologyOrders', [
      ...radiologyOrders, 
      { scanType: '', bodyPart: '', instructions: '', urgency: 'routine' }
    ]);
  };
  
  const removeRadiologyOrder = (index: number) => {
    const radiologyOrders = watch('radiologyOrders');
    setValue('radiologyOrders', radiologyOrders.filter((_, i) => i !== index));
  };
  
  const addReferral = () => {
    const referrals = watch('referrals');
    setValue('referrals', [
      ...referrals, 
      { speciality: '', reason: '', urgency: 'routine' }
    ]);
  };
  
  const removeReferral = (index: number) => {
    const referrals = watch('referrals');
    setValue('referrals', referrals.filter((_, i) => i !== index));
  };
  
  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      // In a real app, we would save to Supabase
      console.log('Consultation form submitted:', data);
      
      // Simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation form:', error);
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
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-2.5 mb-2">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold shadow-sm">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div className="ml-2.5">
              <h2 className="text-base font-bold text-white">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center text-primary-100 text-xs">
                <User className="h-3 w-3 mr-1" />
                <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
                <span className="mx-1">•</span>
                <Calendar className="h-3 w-3 mr-1" />
                <span className="bg-black bg-opacity-20 px-1.5 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-2">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                activeTab === 'assessment'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('assessment')}
            >
              <Stethoscope className="h-3.5 w-3.5 inline mr-1" />
              Assessment
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                activeTab === 'orders'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <FileImage className="h-3.5 w-3.5 inline mr-1" />
              Orders
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                activeTab === 'prescriptions'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <Pill className="h-3.5 w-3.5 inline mr-1" />
              Prescriptions
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                activeTab === 'notes'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1" />
              Notes
            </button>
          </div>
        </div>

        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            {/* Assessment Sub-tabs */}
            <div className="flex border-b border-gray-200 mb-3">
              <button
                type="button"
                className={`flex-1 py-1.5 px-2 text-center text-xs font-medium ${
                  activeAssessmentSection === 'history'
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveAssessmentSection('history')}
              >
                <ClipboardList className="h-3.5 w-3.5 inline mr-1" />
                Patient History
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-2 text-center text-xs font-medium ${
                  activeAssessmentSection === 'examination'
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveAssessmentSection('examination')}
              >
                <Stethoscope className="h-3.5 w-3.5 inline mr-1" />
                Examination
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-2 text-center text-xs font-medium ${
                  activeAssessmentSection === 'diagnosis'
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveAssessmentSection('diagnosis')}
              >
                <Clipboard className="h-3.5 w-3.5 inline mr-1" />
                Diagnosis & Plan
              </button>
            </div>
            
            {/* History Section */}
            {activeAssessmentSection === 'history' && (
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs required">Chief Complaint</label>
                  <textarea
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Patient's main complaint"
                  />
                  {errors.chiefComplaint && (
                    <p className="form-error text-xs">{errors.chiefComplaint.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs">History of Presenting Illness</label>
                  <textarea
                    {...register('historyOfPresentingIllness')}
                    className="form-input py-1.5 text-sm"
                    rows={3}
                    placeholder="Detailed description of the current illness"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Past Medical History</label>
                    <textarea
                      {...register('pastMedicalHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Previous medical conditions"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Past Surgical History</label>
                    <textarea
                      {...register('pastSurgicalHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Previous surgeries"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Current Medications</label>
                    <textarea
                      {...register('medications')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Current medications"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Allergies</label>
                    <textarea
                      {...register('allergies')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Known allergies"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Family History</label>
                    <textarea
                      {...register('familyHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Relevant family medical history"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Social History</label>
                    <textarea
                      {...register('socialHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Social habits, occupation, living situation"
                    />
                  </div>
                </div>
                
                {patientGender === 'Female' && (
                  <div>
                    <label className="form-label text-xs">Gynecological/Obstetric History</label>
                    <textarea
                      {...register('gynecologicalHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Menstrual history, pregnancies, etc."
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Examination Section */}
            {activeAssessmentSection === 'examination' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div>
                    <label className="form-label text-xs">Temperature (°C)</label>
                    <div className="flex items-center">
                      <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                      <input
                        type="text"
                        {...register('vitalSigns.temperature')}
                        className="form-input py-1.5 text-sm"
                        placeholder="36.5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Heart Rate (bpm)</label>
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 text-gray-400 mr-1" />
                      <input
                        type="text"
                        {...register('vitalSigns.heartRate')}
                        className="form-input py-1.5 text-sm"
                        placeholder="75"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Resp. Rate (bpm)</label>
                    <div className="flex items-center">
                      <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                      <input
                        type="text"
                        {...register('vitalSigns.respiratoryRate')}
                        className="form-input py-1.5 text-sm"
                        placeholder="16"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Blood Pressure</label>
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 text-gray-400 mr-1" />
                      <input
                        type="text"
                        {...register('vitalSigns.bloodPressure')}
                        className="form-input py-1.5 text-sm"
                        placeholder="120/80"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">O₂ Saturation (%)</label>
                    <div className="flex items-center">
                      <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                      <input
                        type="text"
                        {...register('vitalSigns.oxygenSaturation')}
                        className="form-input py-1.5 text-sm"
                        placeholder="98"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="form-label text-xs">General Examination</label>
                  <textarea
                    {...register('generalExamination')}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="General appearance, mental status, etc."
                  />
                </div>
                
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  <div className="space-y-2.5">
                    <div>
                      <label className="form-label text-xs flex items-center">
                        <Heart className="h-3.5 w-3.5 text-error-500 mr-1" />
                        Cardiovascular System
                      </label>
                      <textarea
                        {...register('systemicExamination.cardiovascular')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Heart sounds, pulses, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs flex items-center">
                        <Brain className="h-3.5 w-3.5 text-secondary-500 mr-1" />
                        Central Nervous System
                      </label>
                      <textarea
                        {...register('systemicExamination.neurological')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Mental status, cranial nerves, motor, sensory, reflexes, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs flex items-center">
                        <Lungs className="h-3.5 w-3.5 text-primary-500 mr-1" />
                        Respiratory System
                      </label>
                      <textarea
                        {...register('systemicExamination.respiratory')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Breath sounds, respiratory effort, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Gastrointestinal System</label>
                      <textarea
                        {...register('systemicExamination.gastrointestinal')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Abdomen, bowel sounds, liver, spleen, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Genitourinary System</label>
                      <textarea
                        {...register('systemicExamination.genitourinary')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Genitourinary findings if examined"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Musculoskeletal</label>
                      <textarea
                        {...register('systemicExamination.musculoskeletal')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Joints, muscles, gait, etc."
                      />
                    </div>
                    
                    {patientGender === 'Female' && (
                      <div>
                        <label className="form-label text-xs">Breast Examination</label>
                        <textarea
                          {...register('systemicExamination.breast')}
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder="Breast examination findings if performed"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="form-label text-xs">Other Findings</label>
                      <textarea
                        {...register('systemicExamination.other')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Any other examination findings"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Diagnosis Section */}
            {activeAssessmentSection === 'diagnosis' && (
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs required">Diagnosis</label>
                  <textarea
                    {...register('diagnosis', { required: 'Diagnosis is required' })}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Primary diagnosis"
                  />
                  {errors.diagnosis && (
                    <p className="form-error text-xs">{errors.diagnosis.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs">Differential Diagnosis</label>
                  <textarea
                    {...register('differentialDiagnosis')}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Alternative diagnoses to consider"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs required">Treatment Plan</label>
                  <textarea
                    {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                    className="form-input py-1.5 text-sm"
                    rows={3}
                    placeholder="Detailed treatment plan"
                  />
                  {errors.treatmentPlan && (
                    <p className="form-error text-xs">{errors.treatmentPlan.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-xs">Follow-up Plan</label>
                  <textarea
                    {...register('followUp')}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Follow-up instructions and timeline"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            <div className="space-y-3">
              {/* Lab Orders */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label text-xs mb-0">Laboratory Orders</label>
                  <button
                    type="button"
                    onClick={addLabOrder}
                    className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Test
                  </button>
                </div>
                
                {watch('labOrders').length === 0 ? (
                  <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500">No laboratory tests ordered</p>
                    <button
                      type="button"
                      onClick={addLabOrder}
                      className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Add a laboratory test
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watch('labOrders').map((_, index) => (
                      <div key={index} className="p-2 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <input
                              {...register(`labOrders.${index}.testName` as const)}
                              className="form-input py-1 text-sm font-medium"
                              placeholder="Test name"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLabOrder(index)}
                            className="ml-2 text-gray-400 hover:text-error-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <textarea
                              {...register(`labOrders.${index}.instructions` as const)}
                              className="form-input py-1 text-xs"
                              rows={2}
                              placeholder="Special instructions"
                            />
                          </div>
                          
                          <div>
                            <select
                              {...register(`labOrders.${index}.urgency` as const)}
                              className="form-input py-1 text-xs"
                            >
                              <option value="routine">Routine</option>
                              <option value="urgent">Urgent</option>
                              <option value="stat">STAT (Emergency)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Radiology Orders */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label text-xs mb-0">Radiology Orders</label>
                  <button
                    type="button"
                    onClick={addRadiologyOrder}
                    className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Scan
                  </button>
                </div>
                
                {watch('radiologyOrders').length === 0 ? (
                  <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500">No radiology scans ordered</p>
                    <button
                      type="button"
                      onClick={addRadiologyOrder}
                      className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Add a radiology scan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watch('radiologyOrders').map((_, index) => (
                      <div key={index} className="p-2 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              {...register(`radiologyOrders.${index}.scanType` as const)}
                              className="form-input py-1 text-sm font-medium"
                              placeholder="Scan type (e.g., X-Ray, CT, MRI)"
                            />
                            <input
                              {...register(`radiologyOrders.${index}.bodyPart` as const)}
                              className="form-input py-1 text-sm"
                              placeholder="Body part"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRadiologyOrder(index)}
                            className="ml-2 text-gray-400 hover:text-error-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <textarea
                              {...register(`radiologyOrders.${index}.instructions` as const)}
                              className="form-input py-1 text-xs"
                              rows={2}
                              placeholder="Special instructions"
                            />
                          </div>
                          
                          <div>
                            <select
                              {...register(`radiologyOrders.${index}.urgency` as const)}
                              className="form-input py-1 text-xs"
                            >
                              <option value="routine">Routine</option>
                              <option value="urgent">Urgent</option>
                              <option value="stat">STAT (Emergency)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Referrals */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label text-xs mb-0">Referrals</label>
                  <button
                    type="button"
                    onClick={addReferral}
                    className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Referral
                  </button>
                </div>
                
                {watch('referrals').length === 0 ? (
                  <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500">No referrals added</p>
                    <button
                      type="button"
                      onClick={addReferral}
                      className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Add a referral
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watch('referrals').map((_, index) => (
                      <div key={index} className="p-2 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <input
                              {...register(`referrals.${index}.speciality` as const)}
                              className="form-input py-1 text-sm font-medium"
                              placeholder="Speciality (e.g., Cardiology, Neurology)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReferral(index)}
                            className="ml-2 text-gray-400 hover:text-error-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <textarea
                              {...register(`referrals.${index}.reason` as const)}
                              className="form-input py-1 text-xs"
                              rows={2}
                              placeholder="Reason for referral"
                            />
                          </div>
                          
                          <div>
                            <select
                              {...register(`referrals.${index}.urgency` as const)}
                              className="form-input py-1 text-xs"
                            >
                              <option value="routine">Routine</option>
                              <option value="urgent">Urgent</option>
                              <option value="emergency">Emergency</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            <div className="flex justify-between items-center mb-2">
              <label className="form-label text-xs mb-0">Prescriptions</label>
              <button
                type="button"
                onClick={addPrescription}
                className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Medication
              </button>
            </div>
            
            {watch('prescriptions').length === 0 ? (
              <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-xs text-gray-500">No medications prescribed</p>
                <button
                  type="button"
                  onClick={addPrescription}
                  className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  Add a medication
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {watch('prescriptions').map((_, index) => (
                  <div key={index} className="p-2 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <input
                          {...register(`prescriptions.${index}.medication` as const)}
                          className="form-input py-1 text-sm font-medium"
                          placeholder="Medication name"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="ml-2 text-gray-400 hover:text-error-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        {...register(`prescriptions.${index}.dosage` as const)}
                        className="form-input py-1 text-xs"
                        placeholder="Dosage (e.g., 500mg)"
                      />
                      <input
                        {...register(`prescriptions.${index}.frequency` as const)}
                        className="form-input py-1 text-xs"
                        placeholder="Frequency (e.g., twice daily)"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        {...register(`prescriptions.${index}.duration` as const)}
                        className="form-input py-1 text-xs"
                        placeholder="Duration (e.g., 7 days)"
                      />
                      <input
                        {...register(`prescriptions.${index}.instructions` as const)}
                        className="form-input py-1 text-xs"
                        placeholder="Special instructions"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            <div className="space-y-3">
              <div>
                <label className="form-label text-xs">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-input py-1.5 text-sm"
                  rows={4}
                  placeholder="Any additional notes about the consultation"
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
              
              {medicalCertificate && (
                <div>
                  <label className="form-label text-xs">Number of Days</label>
                  <input
                    type="number"
                    {...register('medicalCertificateDays')}
                    className="form-input py-1.5 text-sm w-24"
                    min="1"
                    placeholder="Days"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-outline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-sm btn-primary flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Consultation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;