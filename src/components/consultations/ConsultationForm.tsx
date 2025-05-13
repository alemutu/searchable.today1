import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Save, ArrowLeft, User, Calendar, FileText, Pill, Activity, Stethoscope, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2, Brain, Heart, Settings as Lungs, Droplets, Bone, Microscope, FileImage, FlaskRound as Flask, DollarSign, Clipboard, ClipboardCheck, Layers } from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  historyOfPresentIllness: string;
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
    skin: string;
    breast: string;
  };
  diagnosis: string;
  differentialDiagnosis: string;
  investigations: {
    laboratory: {
      name: string;
      details: string;
    }[];
    radiology: {
      name: string;
      details: string;
    }[];
  };
  treatmentPlan: string;
  prescriptions: {
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

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_history: any;
}

const ConsultationForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'orders' | 'prescriptions' | 'summary'>('assessment');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familySocial: false,
    examination: false,
    systemicExamination: false
  });
  
  const [formData, setFormData] = useState<ConsultationFormData>({
    chiefComplaint: '',
    historyOfPresentIllness: '',
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
      skin: '',
      breast: ''
    },
    diagnosis: '',
    differentialDiagnosis: '',
    investigations: {
      laboratory: [],
      radiology: []
    },
    treatmentPlan: '',
    prescriptions: [],
    followUp: '',
    notes: '',
    medicalCertificate: false,
    medicalCertificateDays: 0
  });

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId, hospital]);

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
          medical_history: {
            allergies: [
              { allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }
            ],
            chronicConditions: ['Hypertension'],
            currentMedications: [
              { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' }
            ]
          }
        };
        setPatient(mockPatient);
        
        // Pre-fill form with patient data
        setFormData(prev => ({
          ...prev,
          allergies: mockPatient.medical_history?.allergies?.map(a => `${a.allergen} (${a.reaction}, ${a.severity})`).join('\n') || '',
          medications: mockPatient.medical_history?.currentMedications?.map(m => `${m.name} ${m.dosage} ${m.frequency}`).join('\n') || '',
          pastMedicalHistory: mockPatient.medical_history?.chronicConditions?.join('\n') || ''
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
      if (data.medical_history) {
        setFormData(prev => ({
          ...prev,
          allergies: data.medical_history?.allergies?.map((a: any) => `${a.allergen} (${a.reaction}, ${a.severity})`).join('\n') || '',
          medications: data.medical_history?.currentMedications?.map((m: any) => `${m.name} ${m.dosage} ${m.frequency}`).join('\n') || '',
          pastMedicalHistory: data.medical_history?.chronicConditions?.join('\n') || ''
        }));
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ConsultationFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        {
          medication: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: ''
        }
      ]
    }));
  };

  const handleRemovePrescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((prescription, i) => 
        i === index ? { ...prescription, [field]: value } : prescription
      )
    }));
  };

  const handleAddInvestigation = (type: 'laboratory' | 'radiology') => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        [type]: [
          ...prev.investigations[type],
          {
            name: '',
            details: ''
          }
        ]
      }
    }));
  };

  const handleRemoveInvestigation = (type: 'laboratory' | 'radiology', index: number) => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        [type]: prev.investigations[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleInvestigationChange = (type: 'laboratory' | 'radiology', index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        [type]: prev.investigations[type].map((investigation, i) => 
          i === index ? { ...investigation, [field]: value } : investigation
        )
      }
    }));
  };

  const handleSubmit = async () => {
    if (!patient || !hospital || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!formData.chiefComplaint || !formData.diagnosis) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'error'
        });
        setIsSaving(false);
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
        
        navigate('/patients');
        return;
      }
      
      // Create consultation record
      const { data, error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patient.id,
          doctor_id: user.id,
          hospital_id: hospital.id,
          consultation_date: new Date().toISOString(),
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          prescriptions: formData.prescriptions.length > 0 ? formData.prescriptions : null,
          notes: formData.notes,
          medical_certificate: formData.medicalCertificate,
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update patient's current flow step
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;
      
      // Create pharmacy order if prescriptions exist
      if (formData.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: data.id,
            medications: formData.prescriptions.map(p => ({
              medication: p.medication,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
              quantity: 1, // Default quantity
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending'
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // Create lab orders if laboratory investigations exist
      if (formData.investigations.laboratory.length > 0) {
        for (const lab of formData.investigations.laboratory) {
          const { error: labError } = await supabase
            .from('lab_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: lab.name.toLowerCase().replace(/\s+/g, '_'),
              test_date: new Date().toISOString(),
              status: 'pending',
              workflow_stage: 'pending',
              is_emergency: false
            });

          if (labError) throw labError;
        }
      }
      
      // Create radiology orders if radiology investigations exist
      if (formData.investigations.radiology.length > 0) {
        for (const rad of formData.investigations.radiology) {
          const { error: radError } = await supabase
            .from('radiology_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: rad.name.toLowerCase().replace(/\s+/g, '_'),
              scan_date: new Date().toISOString(),
              status: 'pending',
              workflow_stage: 'pending',
              is_emergency: false
            });

          if (radError) throw radError;
        }
      }
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error saving consultation:', error);
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
            <Stethoscope className="h-3 w-3 inline mr-1" />
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
            <Clipboard className="h-3 w-3 inline mr-1" />
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
            <Pill className="h-3 w-3 inline mr-1" />
            Prescriptions
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
            <ClipboardCheck className="h-3 w-3 inline mr-1" />
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
              onClick={() => toggleSection('patientHistory')}
            >
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <FileText className="h-4 w-4 text-gray-500 mr-1.5" />
                Patient History
              </h3>
              {expandedSections.patientHistory ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {expandedSections.patientHistory && (
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
                  <label className="form-label text-xs">History of Present Illness</label>
                  <textarea
                    value={formData.historyOfPresentIllness}
                    onChange={(e) => handleInputChange('historyOfPresentIllness', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={3}
                    placeholder="Detailed description of the current illness"
                  />
                </div>
                
                {patient.gender === 'Female' && (
                  <div>
                    <label className="form-label text-xs">Gynecological/Obstetric History</label>
                    <textarea
                      value={formData.gynecologicalHistory}
                      onChange={(e) => handleInputChange('gynecologicalHistory', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Menstrual history, pregnancies, etc."
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Past Medical History</label>
                    <textarea
                      value={formData.pastMedicalHistory}
                      onChange={(e) => handleInputChange('pastMedicalHistory', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Previous medical conditions"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Past Surgical History</label>
                    <textarea
                      value={formData.pastSurgicalHistory}
                      onChange={(e) => handleInputChange('pastSurgicalHistory', e.target.value)}
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
                      value={formData.medications}
                      onChange={(e) => handleInputChange('medications', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Current medications"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Allergies</label>
                    <textarea
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Known allergies"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Family and Socioeconomic History */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('familySocial')}
            >
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-1.5" />
                Family & Socioeconomic History
              </h3>
              {expandedSections.familySocial ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {expandedSections.familySocial && (
              <div className="mt-3 space-y-3">
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
                    placeholder="Occupation, living situation, habits, etc."
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* General Examination */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('examination')}
            >
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Activity className="h-4 w-4 text-gray-500 mr-1.5" />
                General Examination
              </h3>
              {expandedSections.examination ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {expandedSections.examination && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="form-label text-xs">General Examination</label>
                  <textarea
                    value={formData.generalExamination}
                    onChange={(e) => handleInputChange('generalExamination', e.target.value)}
                    className="form-input py-1.5 text-sm"
                    rows={3}
                    placeholder="General appearance, mental status, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="form-label text-xs">Temperature (°C)</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.temperature}
                      onChange={(e) => handleInputChange('vitalSigns.temperature', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      placeholder="36.5"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Heart Rate (bpm)</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.heartRate}
                      onChange={(e) => handleInputChange('vitalSigns.heartRate', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      placeholder="75"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Resp. Rate (bpm)</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.respiratoryRate}
                      onChange={(e) => handleInputChange('vitalSigns.respiratoryRate', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      placeholder="16"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">BP (mmHg)</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.bloodPressure}
                      onChange={(e) => handleInputChange('vitalSigns.bloodPressure', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      placeholder="120/80"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">O₂ Sat (%)</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.oxygenSaturation}
                      onChange={(e) => handleInputChange('vitalSigns.oxygenSaturation', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      placeholder="98"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Systemic Examination */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('systemicExamination')}
            >
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Stethoscope className="h-4 w-4 text-gray-500 mr-1.5" />
                Systemic Examination
              </h3>
              {expandedSections.systemicExamination ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {expandedSections.systemicExamination && (
              <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Heart className="h-3.5 w-3.5 text-error-500 mr-1" />
                      Cardiovascular System
                    </label>
                    <textarea
                      value={formData.systemicExamination.cardiovascular}
                      onChange={(e) => handleInputChange('systemicExamination.cardiovascular', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Heart sounds, pulses, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Brain className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      Central Nervous System
                    </label>
                    <textarea
                      value={formData.systemicExamination.neurological}
                      onChange={(e) => handleInputChange('systemicExamination.neurological', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Mental status, cranial nerves, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Lungs className="h-3.5 w-3.5 text-blue-500 mr-1" />
                      Respiratory System
                    </label>
                    <textarea
                      value={formData.systemicExamination.respiratory}
                      onChange={(e) => handleInputChange('systemicExamination.respiratory', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Breath sounds, respiratory effort, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Droplets className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                      Gastrointestinal System
                    </label>
                    <textarea
                      value={formData.systemicExamination.gastrointestinal}
                      onChange={(e) => handleInputChange('systemicExamination.gastrointestinal', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Abdomen, bowel sounds, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Genitourinary System</label>
                    <textarea
                      value={formData.systemicExamination.genitourinary}
                      onChange={(e) => handleInputChange('systemicExamination.genitourinary', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Genitourinary findings"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Bone className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      Musculoskeletal
                    </label>
                    <textarea
                      value={formData.systemicExamination.musculoskeletal}
                      onChange={(e) => handleInputChange('systemicExamination.musculoskeletal', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Joints, muscles, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Skin</label>
                    <textarea
                      value={formData.systemicExamination.skin}
                      onChange={(e) => handleInputChange('systemicExamination.skin', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Skin findings"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Breast Examination</label>
                    <textarea
                      value={formData.systemicExamination.breast}
                      onChange={(e) => handleInputChange('systemicExamination.breast', e.target.value)}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Breast examination findings"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Diagnosis */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Diagnosis</h3>
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
                  placeholder="Differential diagnosis"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {/* Laboratory Tests */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Flask className="h-4 w-4 text-primary-500 mr-1.5" />
                Laboratory Tests
              </h3>
              <button
                type="button"
                onClick={() => handleAddInvestigation('laboratory')}
                className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Test
              </button>
            </div>
            
            {formData.investigations.laboratory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">No laboratory tests ordered</p>
            ) : (
              <div className="space-y-3">
                {formData.investigations.laboratory.map((test, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label text-xs">Test Name</label>
                          <input
                            type="text"
                            value={test.name}
                            onChange={(e) => handleInvestigationChange('laboratory', index, 'name', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., Complete Blood Count"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Details/Notes</label>
                          <input
                            type="text"
                            value={test.details}
                            onChange={(e) => handleInvestigationChange('laboratory', index, 'details', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="Any specific instructions"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigation('laboratory', index)}
                        className="ml-2 text-error-500 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Radiology Tests */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <FileImage className="h-4 w-4 text-secondary-500 mr-1.5" />
                Radiology Tests
              </h3>
              <button
                type="button"
                onClick={() => handleAddInvestigation('radiology')}
                className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Scan
              </button>
            </div>
            
            {formData.investigations.radiology.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">No radiology tests ordered</p>
            ) : (
              <div className="space-y-3">
                {formData.investigations.radiology.map((scan, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label text-xs">Scan Type</label>
                          <input
                            type="text"
                            value={scan.name}
                            onChange={(e) => handleInvestigationChange('radiology', index, 'name', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., Chest X-Ray"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Details/Notes</label>
                          <input
                            type="text"
                            value={scan.details}
                            onChange={(e) => handleInvestigationChange('radiology', index, 'details', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="Any specific instructions"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigation('radiology', index)}
                        className="ml-2 text-error-500 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Treatment Plan */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Treatment Plan</h3>
            <div>
              <textarea
                value={formData.treatmentPlan}
                onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                className="form-input py-1.5 text-sm"
                rows={4}
                placeholder="Detailed treatment plan"
              />
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
                Prescriptions
              </h3>
              <button
                type="button"
                onClick={handleAddPrescription}
                className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Medication
              </button>
            </div>
            
            {formData.prescriptions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">No medications prescribed</p>
            ) : (
              <div className="space-y-3">
                {formData.prescriptions.map((prescription, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">Medication #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(index)}
                        className="text-error-500 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label text-xs">Medication Name</label>
                        <input
                          type="text"
                          value={prescription.medication}
                          onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., Amoxicillin"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Dosage</label>
                        <input
                          type="text"
                          value={prescription.dosage}
                          onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Frequency</label>
                        <input
                          type="text"
                          value={prescription.frequency}
                          onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., Three times daily"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Duration</label>
                        <input
                          type="text"
                          value={prescription.duration}
                          onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="form-label text-xs">Instructions</label>
                        <input
                          type="text"
                          value={prescription.instructions}
                          onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., Take with food"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Follow-up and Notes */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Follow-up & Notes</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label text-xs">Follow-up Instructions</label>
                <textarea
                  value={formData.followUp}
                  onChange={(e) => handleInputChange('followUp', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Follow-up instructions"
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Additional notes"
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
                  <label className="form-label text-xs">Number of Days</label>
                  <input
                    type="number"
                    value={formData.medicalCertificateDays}
                    onChange={(e) => handleInputChange('medicalCertificateDays', parseInt(e.target.value))}
                    min={1}
                    className="form-input py-1.5 text-sm w-24"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Consultation Summary</h3>
            
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Chief Complaint</h4>
                <p className="text-sm text-gray-900">{formData.chiefComplaint || 'Not specified'}</p>
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Diagnosis</h4>
                <p className="text-sm text-gray-900">{formData.diagnosis || 'Not specified'}</p>
                
                {formData.differentialDiagnosis && (
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-gray-700">Differential Diagnosis</h5>
                    <p className="text-sm text-gray-900">{formData.differentialDiagnosis}</p>
                  </div>
                )}
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Investigations</h4>
                {formData.investigations.laboratory.length === 0 && formData.investigations.radiology.length === 0 ? (
                  <p className="text-sm text-gray-500">No investigations ordered</p>
                ) : (
                  <div className="space-y-2">
                    {formData.investigations.laboratory.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 flex items-center">
                          <Flask className="h-3.5 w-3.5 text-primary-500 mr-1" />
                          Laboratory Tests
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-900 ml-4">
                          {formData.investigations.laboratory.map((test, index) => (
                            <li key={index}>{test.name}{test.details ? ` - ${test.details}` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {formData.investigations.radiology.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 flex items-center">
                          <FileImage className="h-3.5 w-3.5 text-secondary-500 mr-1" />
                          Radiology Tests
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-900 ml-4">
                          {formData.investigations.radiology.map((scan, index) => (
                            <li key={index}>{scan.name}{scan.details ? ` - ${scan.details}` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Treatment Plan</h4>
                <p className="text-sm text-gray-900">{formData.treatmentPlan || 'Not specified'}</p>
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Prescriptions</h4>
                {formData.prescriptions.length === 0 ? (
                  <p className="text-sm text-gray-500">No medications prescribed</p>
                ) : (
                  <div className="space-y-2">
                    {formData.prescriptions.map((prescription, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">{prescription.medication} {prescription.dosage}</p>
                        <p className="text-xs text-gray-600">
                          {prescription.frequency}, {prescription.duration}
                          {prescription.instructions && ` - ${prescription.instructions}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Follow-up & Notes</h4>
                {formData.followUp && (
                  <div className="mb-2">
                    <h5 className="text-xs font-medium text-gray-700">Follow-up</h5>
                    <p className="text-sm text-gray-900">{formData.followUp}</p>
                  </div>
                )}
                
                {formData.notes && (
                  <div className="mb-2">
                    <h5 className="text-xs font-medium text-gray-700">Additional Notes</h5>
                    <p className="text-sm text-gray-900">{formData.notes}</p>
                  </div>
                )}
                
                {formData.medicalCertificate && (
                  <div className="flex items-center mt-2 p-2 bg-primary-50 rounded-md">
                    <CheckCircle className="h-4 w-4 text-primary-500 mr-2" />
                    <span className="text-sm text-primary-700">
                      Medical Certificate Issued for {formData.medicalCertificateDays} day{formData.medicalCertificateDays !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-sm btn-outline flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
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
              Complete Consultation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConsultationForm;