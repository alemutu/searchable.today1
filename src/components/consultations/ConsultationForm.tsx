import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Save, ArrowLeft, User, Calendar, Stethoscope, FileText, Pill, Activity, AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, ClipboardList, Heart, Brain, Settings as Lungs, Microscope, FlaskRound as Flask, FileImage, DollarSign, Bone, Thermometer, Droplets, Scale, Ruler, Syringe, Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medical_history: any;
  hospital_id: string;
  status: string;
  current_flow_step: string | null;
}

interface ConsultationFormData {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId: string;
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  pastMedicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  allergies: string;
  medications: string;
  gynecologicalHistory: string | null;
  generalExamination: string;
  vitalSigns: {
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    oxygenSaturation: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    painLevel: number | null;
  };
  systemicExamination: {
    cardiovascular: string;
    respiratory: string;
    gastrointestinal: string;
    genitourinary: string;
    musculoskeletal: string;
    neurological: string;
    endocrine: string;
    skin: string;
    psychiatric: string;
    other: string;
  };
  diagnosis: string;
  differentialDiagnosis: string;
  investigations: {
    laboratory: {
      test: string;
      notes: string;
    }[];
    radiology: {
      scan: string;
      notes: string;
    }[];
  };
  treatmentPlan: string;
  medications: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnosis' | 'orders' | 'prescription' | 'summary'>('assessment');
  const [formData, setFormData] = useState<ConsultationFormData>({
    patientId: patientId || '',
    doctorId: user?.id || '',
    hospitalId: hospital?.id || '',
    departmentId: user?.department_id || '',
    chiefComplaint: '',
    historyOfPresentingIllness: '',
    pastMedicalHistory: '',
    familyHistory: '',
    socialHistory: '',
    allergies: '',
    medications: '',
    gynecologicalHistory: null,
    generalExamination: '',
    vitalSigns: {
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      oxygenSaturation: null,
      weight: null,
      height: null,
      bmi: null,
      painLevel: null
    },
    systemicExamination: {
      cardiovascular: '',
      respiratory: '',
      gastrointestinal: '',
      genitourinary: '',
      musculoskeletal: '',
      neurological: '',
      endocrine: '',
      skin: '',
      psychiatric: '',
      other: ''
    },
    diagnosis: '',
    differentialDiagnosis: '',
    investigations: {
      laboratory: [],
      radiology: []
    },
    treatmentPlan: '',
    medications: [],
    followUp: '',
    notes: '',
    medicalCertificate: false,
    medicalCertificateDays: 0
  });
  
  // UI state
  const [patientHistoryExpanded, setPatientHistoryExpanded] = useState(true);
  const [examinationExpanded, setExaminationExpanded] = useState(true);
  const [systemicExamExpanded, setSystemicExamExpanded] = useState(true);
  
  // Temporary state for adding new items
  const [newLabTest, setNewLabTest] = useState({ test: '', notes: '' });
  const [newRadiologyTest, setNewRadiologyTest] = useState({ scan: '', notes: '' });
  const [newMedication, setNewMedication] = useState({ 
    medication: '', 
    dosage: '', 
    frequency: '', 
    duration: '', 
    instructions: '' 
  });

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [patientId, hospital]);
  
  useEffect(() => {
    // Calculate BMI if height and weight are available
    if (formData.vitalSigns.height && formData.vitalSigns.weight) {
      const heightInMeters = formData.vitalSigns.height / 100;
      const bmi = formData.vitalSigns.weight / (heightInMeters * heightInMeters);
      setFormData(prev => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          bmi: parseFloat(bmi.toFixed(1))
        }
      }));
    }
  }, [formData.vitalSigns.height, formData.vitalSigns.weight]);

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
          contact_number: '555-1234',
          email: 'john.doe@example.com',
          address: '123 Main St',
          emergency_contact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '555-5678'
          },
          medical_history: {
            allergies: [
              { allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }
            ],
            chronicConditions: ['Hypertension'],
            currentMedications: [
              { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' }
            ]
          },
          hospital_id: hospital?.id || '00000000-0000-0000-0000-000000000000',
          status: 'active',
          current_flow_step: 'consultation'
        };
        setPatient(mockPatient);
        
        // Pre-fill form with patient data
        setFormData(prev => ({
          ...prev,
          patientId: mockPatient.id,
          allergies: mockPatient.medical_history?.allergies?.map((a: any) => 
            `${a.allergen} (${a.reaction}, ${a.severity})`
          ).join('\n') || '',
          medications: mockPatient.medical_history?.currentMedications?.map((m: any) => 
            `${m.name} ${m.dosage} ${m.frequency}`
          ).join('\n') || ''
        }));
        
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
      
      // Pre-fill form with patient data
      setFormData(prev => ({
        ...prev,
        patientId: data.id,
        allergies: data.medical_history?.allergies?.map((a: any) => 
          `${a.allergen} (${a.reaction}, ${a.severity})`
        ).join('\n') || '',
        medications: data.medical_history?.currentMedications?.map((m: any) => 
          `${m.name} ${m.dosage} ${m.frequency}`
        ).join('\n') || ''
      }));
      
      // Update patient flow step to consultation if needed
      if (data.current_flow_step !== 'consultation') {
        await supabase
          .from('patients')
          .update({ current_flow_step: 'consultation' })
          .eq('id', patientId);
      }
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
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleVitalSignChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value === '' ? null : value
      }
    }));
  };
  
  const handleSystemicExamChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      systemicExamination: {
        ...prev.systemicExamination,
        [field]: value
      }
    }));
  };
  
  const handleAddLabTest = () => {
    if (!newLabTest.test) return;
    
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        laboratory: [...prev.investigations.laboratory, newLabTest]
      }
    }));
    
    setNewLabTest({ test: '', notes: '' });
  };
  
  const handleRemoveLabTest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        laboratory: prev.investigations.laboratory.filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleAddRadiologyTest = () => {
    if (!newRadiologyTest.scan) return;
    
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        radiology: [...prev.investigations.radiology, newRadiologyTest]
      }
    }));
    
    setNewRadiologyTest({ scan: '', notes: '' });
  };
  
  const handleRemoveRadiologyTest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        radiology: prev.investigations.radiology.filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleAddMedication = () => {
    if (!newMedication.medication || !newMedication.dosage) return;
    
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
    
    setNewMedication({ 
      medication: '', 
      dosage: '', 
      frequency: '', 
      duration: '', 
      instructions: '' 
    });
  };
  
  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!formData.chiefComplaint || !formData.diagnosis) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', formData);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
        // Update patient flow step
        navigate('/patients');
        return;
      }
      
      // Create consultation record
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: formData.patientId,
          doctor_id: formData.doctorId,
          hospital_id: formData.hospitalId,
          department_id: formData.departmentId,
          consultation_date: new Date().toISOString(),
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          notes: formData.notes,
          medical_certificate: formData.medicalCertificate,
          prescriptions: formData.medications.length > 0 ? formData.medications : null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab orders if needed
      if (formData.investigations.laboratory.length > 0) {
        for (const lab of formData.investigations.laboratory) {
          const { error: labError } = await supabase
            .from('lab_results')
            .insert({
              patient_id: formData.patientId,
              hospital_id: formData.hospitalId,
              test_type: lab.test,
              test_date: new Date().toISOString(),
              status: 'pending',
              notes: lab.notes
            });
            
          if (labError) throw labError;
        }
      }
      
      // Create radiology orders if needed
      if (formData.investigations.radiology.length > 0) {
        for (const rad of formData.investigations.radiology) {
          const { error: radError } = await supabase
            .from('radiology_results')
            .insert({
              patient_id: formData.patientId,
              hospital_id: formData.hospitalId,
              scan_type: rad.scan,
              scan_date: new Date().toISOString(),
              status: 'pending',
              notes: rad.notes
            });
            
          if (radError) throw radError;
        }
      }
      
      // Create pharmacy order if needed
      if (formData.medications.length > 0) {
        const { error: pharmError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: formData.patientId,
            hospital_id: formData.hospitalId,
            prescription_id: consultation.id,
            medications: formData.medications,
            status: 'pending',
            payment_status: 'pending'
          });
          
        if (pharmError) throw pharmError;
      }
      
      // Update patient flow step
      let nextStep = 'post_consultation';
      
      if (formData.investigations.laboratory.length > 0) {
        nextStep = 'lab_tests';
      } else if (formData.investigations.radiology.length > 0) {
        nextStep = 'radiology';
      } else if (formData.medications.length > 0) {
        nextStep = 'pharmacy';
      }
      
      const { error: patientError } = await supabase
        .from('patients')
        .update({ current_flow_step: nextStep })
        .eq('id', formData.patientId);
        
      if (patientError) throw patientError;
      
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
    <div className="max-w-5xl mx-auto">
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
              <Calendar className="h-3 w-3 mr-1" />
              <span className="bg-black bg-opacity-20 px-1.5 py-0.5 rounded">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-3">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
              activeTab === 'assessment'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('assessment')}
          >
            <Activity className="h-3 w-3 inline mr-1" />
            Assessment
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
              activeTab === 'diagnosis'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('diagnosis')}
          >
            <Stethoscope className="h-3 w-3 inline mr-1" />
            Diagnosis
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
            <ClipboardList className="h-3 w-3 inline mr-1" />
            Orders
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
              activeTab === 'prescription'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('prescription')}
          >
            <Pill className="h-3 w-3 inline mr-1" />
            Prescription
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
              activeTab === 'summary'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            <FileText className="h-3 w-3 inline mr-1" />
            Summary
          </button>
        </div>
      </div>

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <div className="space-y-3">
          {/* Patient History Section */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setPatientHistoryExpanded(!patientHistoryExpanded)}
            >
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
                Patient History
              </h3>
              {patientHistoryExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {patientHistoryExpanded && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="form-label text-xs required">Chief Complaint</label>
                  <textarea
                    value={formData.chiefComplaint}
                    onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Patient's main complaint"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">History of Presenting Illness</label>
                  <textarea
                    value={formData.historyOfPresentingIllness}
                    onChange={(e) => handleInputChange('historyOfPresentingIllness', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={3}
                    placeholder="Detailed history of the current illness"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Past Medical & Surgical History</label>
                  <textarea
                    value={formData.pastMedicalHistory}
                    onChange={(e) => handleInputChange('pastMedicalHistory', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Previous medical conditions and surgeries"
                  />
                </div>
                
                {patient.gender === 'Female' && (
                  <div>
                    <label className="form-label text-xs">Gynecological/Obstetric History</label>
                    <textarea
                      value={formData.gynecologicalHistory || ''}
                      onChange={(e) => handleInputChange('gynecologicalHistory', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Gynecological and obstetric history"
                    />
                  </div>
                )}
                
                <div>
                  <label className="form-label text-xs">Allergies</label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Known allergies and reactions"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Current Medications</label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Current medications and supplements"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Family and Socioeconomic History */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
              <User className="h-4 w-4 text-primary-500 mr-1.5" />
              Family & Socioeconomic History
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="form-label text-xs">Family History</label>
                <textarea
                  value={formData.familyHistory}
                  onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Family medical history"
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Social History</label>
                <textarea
                  value={formData.socialHistory}
                  onChange={(e) => handleInputChange('socialHistory', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Social, occupational, and lifestyle factors"
                />
              </div>
            </div>
          </div>
          
          {/* Examination Section */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExaminationExpanded(!examinationExpanded)}
            >
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <Stethoscope className="h-4 w-4 text-primary-500 mr-1.5" />
                Examination
              </h3>
              {examinationExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {examinationExpanded && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="form-label text-xs">General Examination</label>
                  <textarea
                    value={formData.generalExamination}
                    onChange={(e) => handleInputChange('generalExamination', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="General appearance and examination findings"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Vital Signs</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    <div>
                      <div className="flex items-center">
                        <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">Temperature (°C)</label>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.vitalSigns.temperature || ''}
                        onChange={(e) => handleVitalSignChange('temperature', e.target.value ? parseFloat(e.target.value) : '')}
                        className="form-input py-1 text-sm"
                        placeholder="36.5"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">Heart Rate (bpm)</label>
                      </div>
                      <input
                        type="number"
                        value={formData.vitalSigns.heartRate || ''}
                        onChange={(e) => handleVitalSignChange('heartRate', e.target.value ? parseInt(e.target.value) : '')}
                        className="form-input py-1 text-sm"
                        placeholder="75"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">Respiratory Rate</label>
                      </div>
                      <input
                        type="number"
                        value={formData.vitalSigns.respiratoryRate || ''}
                        onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value ? parseInt(e.target.value) : '')}
                        className="form-input py-1 text-sm"
                        placeholder="16"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Activity className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">Blood Pressure</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={formData.vitalSigns.bloodPressureSystolic || ''}
                          onChange={(e) => handleVitalSignChange('bloodPressureSystolic', e.target.value ? parseInt(e.target.value) : '')}
                          className="form-input py-1 text-sm w-1/2"
                          placeholder="120"
                        />
                        <span className="text-gray-500">/</span>
                        <input
                          type="number"
                          value={formData.vitalSigns.bloodPressureDiastolic || ''}
                          onChange={(e) => handleVitalSignChange('bloodPressureDiastolic', e.target.value ? parseInt(e.target.value) : '')}
                          className="form-input py-1 text-sm w-1/2"
                          placeholder="80"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">O₂ Saturation (%)</label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.vitalSigns.oxygenSaturation || ''}
                        onChange={(e) => handleVitalSignChange('oxygenSaturation', e.target.value ? parseInt(e.target.value) : '')}
                        className="form-input py-1 text-sm"
                        placeholder="98"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Scale className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">Weight (kg)</label>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.vitalSigns.weight || ''}
                        onChange={(e) => handleVitalSignChange('weight', e.target.value ? parseFloat(e.target.value) : '')}
                        className="form-input py-1 text-sm"
                        placeholder="70"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Ruler className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">Height (cm)</label>
                      </div>
                      <input
                        type="number"
                        value={formData.vitalSigns.height || ''}
                        onChange={(e) => handleVitalSignChange('height', e.target.value ? parseInt(e.target.value) : '')}
                        className="form-input py-1 text-sm"
                        placeholder="170"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Activity className="h-3 w-3 text-gray-400 mr-1" />
                        <label className="text-xs text-gray-500">BMI</label>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.vitalSigns.bmi || ''}
                        className="form-input py-1 text-sm bg-gray-50"
                        placeholder="Calculated"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Systemic Examination */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setSystemicExamExpanded(!systemicExamExpanded)}
            >
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                Systemic Examination
              </h3>
              {systemicExamExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {systemicExamExpanded && (
              <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-2">
                <div>
                  <div className="flex items-center mb-1">
                    <Heart className="h-3.5 w-3.5 text-error-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Cardiovascular System</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.cardiovascular}
                    onChange={(e) => handleSystemicExamChange('cardiovascular', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Heart sounds, murmurs, pulses, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Brain className="h-3.5 w-3.5 text-secondary-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Central Nervous System</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.neurological}
                    onChange={(e) => handleSystemicExamChange('neurological', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Mental status, cranial nerves, motor, sensory, reflexes, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Lungs className="h-3.5 w-3.5 text-primary-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Respiratory System</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.respiratory}
                    onChange={(e) => handleSystemicExamChange('respiratory', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Breath sounds, respiratory rate, pattern, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Activity className="h-3.5 w-3.5 text-warning-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Gastrointestinal System</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.gastrointestinal}
                    onChange={(e) => handleSystemicExamChange('gastrointestinal', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Abdomen, bowel sounds, tenderness, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Droplets className="h-3.5 w-3.5 text-accent-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Genitourinary System</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.genitourinary}
                    onChange={(e) => handleSystemicExamChange('genitourinary', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Genitourinary findings"
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Bone className="h-3.5 w-3.5 text-gray-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Musculoskeletal</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.musculoskeletal}
                    onChange={(e) => handleSystemicExamChange('musculoskeletal', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Joints, muscles, range of motion, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Activity className="h-3.5 w-3.5 text-success-500 mr-1" />
                    <label className="text-xs font-medium text-gray-700">Other Systems/Examination</label>
                  </div>
                  <textarea
                    value={formData.systemicExamination.other}
                    onChange={(e) => handleSystemicExamChange('other', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Any other examination findings"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagnosis Tab */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
              <Stethoscope className="h-4 w-4 text-primary-500 mr-1.5" />
              Diagnosis
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="form-label text-xs required">Primary Diagnosis</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Primary diagnosis"
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Differential Diagnosis</label>
                <textarea
                  value={formData.differentialDiagnosis}
                  onChange={(e) => handleInputChange('differentialDiagnosis', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Differential diagnoses to consider"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
              <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
              Treatment Plan
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="form-label text-xs">Treatment Plan</label>
                <textarea
                  value={formData.treatmentPlan}
                  onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={3}
                  placeholder="Treatment plan and recommendations"
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Follow-up Plan</label>
                <textarea
                  value={formData.followUp}
                  onChange={(e) => handleInputChange('followUp', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Follow-up instructions and timeline"
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Any additional notes or instructions"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="medicalCertificate"
                  checked={formData.medicalCertificate}
                  onChange={(e) => handleInputChange('medicalCertificate', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                  Issue Medical Certificate
                </label>
              </div>
              
              {formData.medicalCertificate && (
                <div>
                  <label className="form-label text-xs">Days of Medical Leave</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.medicalCertificateDays}
                    onChange={(e) => handleInputChange('medicalCertificateDays', parseInt(e.target.value))}
                    className="form-input py-1.5 text-sm w-24"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
              <Flask className="h-4 w-4 text-primary-500 mr-1.5" />
              Laboratory Tests
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-col space-y-2">
                {formData.investigations.laboratory.map((lab, index) => (
                  <div key={index} className="flex items-start p-2 border border-gray-200 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Flask className="h-4 w-4 text-primary-500 mr-1.5" />
                        <span className="text-sm font-medium">{lab.test}</span>
                      </div>
                      {lab.notes && (
                        <p className="text-xs text-gray-500 mt-1 ml-5.5">{lab.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabTest(index)}
                      className="text-gray-400 hover:text-error-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <select
                    value={newLabTest.test}
                    onChange={(e) => setNewLabTest({ ...newLabTest, test: e.target.value })}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="">Select Test</option>
                    <option value="complete_blood_count">Complete Blood Count (CBC)</option>
                    <option value="liver_function">Liver Function Test</option>
                    <option value="kidney_function">Kidney Function Test</option>
                    <option value="lipid_profile">Lipid Profile</option>
                    <option value="blood_glucose">Blood Glucose</option>
                    <option value="urinalysis">Urinalysis</option>
                    <option value="thyroid_function">Thyroid Function Test</option>
                    <option value="electrolytes">Electrolytes Panel</option>
                    <option value="hba1c">HbA1c</option>
                    <option value="coagulation_profile">Coagulation Profile</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddLabTest}
                  disabled={!newLabTest.test}
                  className="btn btn-primary py-1.5 px-3 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              </div>
              
              {newLabTest.test && (
                <div>
                  <label className="form-label text-xs">Notes</label>
                  <textarea
                    value={newLabTest.notes}
                    onChange={(e) => setNewLabTest({ ...newLabTest, notes: e.target.value })}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Additional instructions for this test"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
              <FileImage className="h-4 w-4 text-secondary-500 mr-1.5" />
              Radiology Tests
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-col space-y-2">
                {formData.investigations.radiology.map((rad, index) => (
                  <div key={index} className="flex items-start p-2 border border-gray-200 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Microscope className="h-4 w-4 text-secondary-500 mr-1.5" />
                        <span className="text-sm font-medium">{rad.scan}</span>
                      </div>
                      {rad.notes && (
                        <p className="text-xs text-gray-500 mt-1 ml-5.5">{rad.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRadiologyTest(index)}
                      className="text-gray-400 hover:text-error-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <select
                    value={newRadiologyTest.scan}
                    onChange={(e) => setNewRadiologyTest({ ...newRadiologyTest, scan: e.target.value })}
                    className="form-input py-1.5 text-sm"
                  >
                    <option value="">Select Scan</option>
                    <option value="x_ray">X-Ray</option>
                    <option value="ct_scan">CT Scan</option>
                    <option value="mri">MRI</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="mammogram">Mammogram</option>
                    <option value="pet_scan">PET Scan</option>
                    <option value="dexa_scan">DEXA Scan</option>
                    <option value="fluoroscopy">Fluoroscopy</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddRadiologyTest}
                  disabled={!newRadiologyTest.scan}
                  className="btn btn-primary py-1.5 px-3 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              </div>
              
              {newRadiologyTest.scan && (
                <div>
                  <label className="form-label text-xs">Notes</label>
                  <textarea
                    value={newRadiologyTest.notes}
                    onChange={(e) => setNewRadiologyTest({ ...newRadiologyTest, notes: e.target.value })}
                    className="form-input py-1.5 text-sm"
                    rows={2}
                    placeholder="Additional instructions for this scan"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prescription Tab */}
      {activeTab === 'prescription' && (
        <div className="bg-white rounded-lg shadow-sm p-3">
          <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
            <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
            Medications
          </h3>
          
          <div className="space-y-3">
            <div className="flex flex-col space-y-2">
              {formData.medications.map((med, index) => (
                <div key={index} className="p-2 border border-gray-200 rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
                        <span className="text-sm font-medium">{med.medication}</span>
                        <span className="ml-2 text-xs text-gray-500">{med.dosage}</span>
                      </div>
                      <div className="ml-5.5 mt-1 text-xs text-gray-600">
                        <span className="inline-block mr-3">{med.frequency}</span>
                        <span className="inline-block mr-3">{med.duration}</span>
                      </div>
                      {med.instructions && (
                        <p className="text-xs text-gray-500 mt-1 ml-5.5">{med.instructions}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(index)}
                      className="text-gray-400 hover:text-error-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border border-gray-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Add Medication</h4>
              
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="form-label text-xs required">Medication</label>
                  <input
                    type="text"
                    value={newMedication.medication}
                    onChange={(e) => setNewMedication({ ...newMedication, medication: e.target.value })}
                    className="form-input py-1.5 text-sm"
                    placeholder="Medication name"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs required">Dosage</label>
                  <input
                    type="text"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                    className="form-input py-1.5 text-sm"
                    placeholder="e.g., 500mg"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Frequency</label>
                  <input
                    type="text"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                    className="form-input py-1.5 text-sm"
                    placeholder="e.g., Twice daily"
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Duration</label>
                  <input
                    type="text"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                    className="form-input py-1.5 text-sm"
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>
              
              <div className="mt-2">
                <label className="form-label text-xs">Instructions</label>
                <textarea
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Special instructions (e.g., take with food)"
                />
              </div>
              
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddMedication}
                  disabled={!newMedication.medication || !newMedication.dosage}
                  className="btn btn-primary py-1.5 px-3 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Medication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-lg shadow-sm p-3">
          <h3 className="text-md font-medium text-gray-900 flex items-center mb-3">
            <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
            Consultation Summary
          </h3>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Patient Information</h4>
              <p className="text-sm">
                <span className="font-medium">Name:</span> {patient.first_name} {patient.last_name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Age/Gender:</span> {calculateAge(patient.date_of_birth)} years, {patient.gender}
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Assessment</h4>
              
              {formData.chiefComplaint && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Chief Complaint</p>
                  <p className="text-sm">{formData.chiefComplaint}</p>
                </div>
              )}
              
              {formData.historyOfPresentingIllness && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">History of Presenting Illness</p>
                  <p className="text-sm">{formData.historyOfPresentingIllness}</p>
                </div>
              )}
              
              {formData.generalExamination && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Examination</p>
                  <p className="text-sm">{formData.generalExamination}</p>
                </div>
              )}
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Diagnosis</h4>
              
              {formData.diagnosis && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Primary Diagnosis</p>
                  <p className="text-sm">{formData.diagnosis}</p>
                </div>
              )}
              
              {formData.differentialDiagnosis && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Differential Diagnosis</p>
                  <p className="text-sm">{formData.differentialDiagnosis}</p>
                </div>
              )}
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Investigations</h4>
              
              {formData.investigations.laboratory.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Laboratory Tests</p>
                  <ul className="list-disc list-inside text-sm">
                    {formData.investigations.laboratory.map((lab, index) => (
                      <li key={index}>
                        {lab.test}
                        {lab.notes && <span className="text-xs text-gray-500 ml-1">({lab.notes})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {formData.investigations.radiology.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Radiology Tests</p>
                  <ul className="list-disc list-inside text-sm">
                    {formData.investigations.radiology.map((rad, index) => (
                      <li key={index}>
                        {rad.scan}
                        {rad.notes && <span className="text-xs text-gray-500 ml-1">({rad.notes})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Treatment Plan</h4>
              
              {formData.treatmentPlan && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Plan</p>
                  <p className="text-sm">{formData.treatmentPlan}</p>
                </div>
              )}
              
              {formData.medications.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Medications</p>
                  <ul className="list-disc list-inside text-sm">
                    {formData.medications.map((med, index) => (
                      <li key={index}>
                        {med.medication} {med.dosage}, {med.frequency}, {med.duration}
                        {med.instructions && <span className="text-xs text-gray-500 ml-1">({med.instructions})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {formData.followUp && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Follow-up</p>
                  <p className="text-sm">{formData.followUp}</p>
                </div>
              )}
              
              {formData.medicalCertificate && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700">Medical Certificate</p>
                  <p className="text-sm">Issued for {formData.medicalCertificateDays} day(s)</p>
                </div>
              )}
            </div>
            
            {formData.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Notes</h4>
                <p className="text-sm">{formData.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="btn btn-outline py-1.5 px-3 text-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="btn btn-primary py-1.5 px-3 text-sm flex items-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Save Consultation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConsultationForm;