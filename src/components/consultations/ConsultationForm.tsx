import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  Save, 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Pill, 
  CheckCircle, 
  AlertTriangle, 
  Stethoscope, 
  Activity, 
  Microscope, 
  FileImage, 
  DollarSign,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ClipboardList,
  Heart,
  Lungs,
  Brain,
  Bone,
  Thermometer,
  Droplets,
  Clipboard,
  Layers,
  Scroll
} from 'lucide-react';

interface ConsultationFormData {
  patientId: string;
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
    neurological: string;
    musculoskeletal: string;
    genitourinary: string;
    other: string;
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
    other: {
      name: string;
      details: string;
    }[];
  };
  treatmentPlan: string;
  medications_prescribed: {
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
  const [activeTab, setActiveTab] = useState('history');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familySocial: true,
    examination: true,
    assessment: true,
    plan: true
  });
  
  const [formData, setFormData] = useState<ConsultationFormData>({
    patientId: patientId || '',
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
      neurological: '',
      musculoskeletal: '',
      genitourinary: '',
      other: ''
    },
    diagnosis: '',
    differentialDiagnosis: '',
    investigations: {
      laboratory: [],
      radiology: [],
      other: []
    },
    treatmentPlan: '',
    medications_prescribed: [],
    followUp: '',
    notes: '',
    medicalCertificate: false,
    medicalCertificateDays: 0
  });

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
      
      // Pre-fill allergies and medications from patient's medical history if available
      if (data.medical_history) {
        let allergiesText = '';
        if (data.medical_history.allergies && data.medical_history.allergies.length > 0) {
          allergiesText = data.medical_history.allergies.map((a: any) => 
            typeof a === 'string' ? a : a.allergen || a
          ).join(', ');
        }
        
        let medicationsText = '';
        if (data.medical_history.currentMedications && data.medical_history.currentMedications.length > 0) {
          medicationsText = data.medical_history.currentMedications.map((m: any) => 
            typeof m === 'string' ? m : m.name || m
          ).join(', ');
        }
        
        setFormData(prev => ({
          ...prev,
          allergies: allergiesText,
          medications: medicationsText
        }));
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalSignsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const handleSystemicExaminationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      systemicExamination: {
        ...prev.systemicExamination,
        [field]: value
      }
    }));
  };

  const handleAddInvestigation = (type: 'laboratory' | 'radiology' | 'other') => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        [type]: [
          ...prev.investigations[type],
          { name: '', details: '' }
        ]
      }
    }));
  };

  const handleRemoveInvestigation = (type: 'laboratory' | 'radiology' | 'other', index: number) => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        [type]: prev.investigations[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleInvestigationChange = (type: 'laboratory' | 'radiology' | 'other', index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedInvestigations = [...prev.investigations[type]];
      updatedInvestigations[index] = {
        ...updatedInvestigations[index],
        [field]: value
      };
      
      return {
        ...prev,
        investigations: {
          ...prev.investigations,
          [type]: updatedInvestigations
        }
      };
    });
  };

  const handleAddMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications_prescribed: [
        ...prev.medications_prescribed,
        { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications_prescribed: prev.medications_prescribed.filter((_, i) => i !== index)
    }));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedMedications = [...prev.medications_prescribed];
      updatedMedications[index] = {
        ...updatedMedications[index],
        [field]: value
      };
      
      return {
        ...prev,
        medications_prescribed: updatedMedications
      };
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hospital || !user || !patient) {
      addNotification({
        message: 'Missing required information',
        type: 'error'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!formData.chiefComplaint || !formData.diagnosis) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        setIsSaving(false);
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
          notes: JSON.stringify({
            historyOfPresentingIllness: formData.historyOfPresentingIllness,
            pastMedicalHistory: formData.pastMedicalHistory,
            pastSurgicalHistory: formData.pastSurgicalHistory,
            familyHistory: formData.familyHistory,
            socialHistory: formData.socialHistory,
            medications: formData.medications,
            allergies: formData.allergies,
            gynecologicalHistory: formData.gynecologicalHistory,
            generalExamination: formData.generalExamination,
            vitalSigns: formData.vitalSigns,
            systemicExamination: formData.systemicExamination,
            differentialDiagnosis: formData.differentialDiagnosis,
            investigations: formData.investigations,
            followUp: formData.followUp,
            notes: formData.notes
          }),
          prescriptions: formData.medications_prescribed.length > 0 ? formData.medications_prescribed : null,
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
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="mr-3 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Patient Consultation</h1>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  <span>{patient.first_name} {patient.last_name}</span>
                  <span className="mx-1">•</span>
                  <span>{calculateAge(patient.date_of_birth)} years</span>
                  <span className="mx-1">•</span>
                  <span>{patient.gender}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="btn btn-outline text-sm"
              >
                View Patient Record
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary text-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Consultation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
                activeTab === 'history'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              History
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
                activeTab === 'examination'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('examination')}
            >
              <Stethoscope className="h-4 w-4 inline mr-1" />
              Examination
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
                activeTab === 'assessment'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('assessment')}
            >
              <ClipboardList className="h-4 w-4 inline mr-1" />
              Assessment
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
                activeTab === 'orders'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <Clipboard className="h-4 w-4 inline mr-1" />
              Orders
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
                activeTab === 'prescription'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('prescription')}
            >
              <Pill className="h-4 w-4 inline mr-1" />
              Prescription
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
                activeTab === 'plan'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('plan')}
            >
              <Scroll className="h-4 w-4 inline mr-1" />
              Plan
            </button>
          </div>
        </div>

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            {/* Chief Complaint */}
            <div>
              <label className="form-label required text-sm">Chief Complaint</label>
              <textarea
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                className="form-input text-sm"
                rows={2}
                placeholder="Enter patient's main complaint"
              />
            </div>
            
            {/* Patient History Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('patientHistory')}
              >
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-1.5 text-primary-500" />
                  Patient History
                </h3>
                {expandedSections.patientHistory ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.patientHistory && (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="form-label text-xs">History of Presenting Illness</label>
                    <textarea
                      value={formData.historyOfPresentingIllness}
                      onChange={(e) => handleInputChange('historyOfPresentingIllness', e.target.value)}
                      className="form-input text-sm"
                      rows={3}
                      placeholder="Describe the history of the current illness"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Past Medical History</label>
                    <textarea
                      value={formData.pastMedicalHistory}
                      onChange={(e) => handleInputChange('pastMedicalHistory', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="List previous medical conditions"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Past Surgical History</label>
                    <textarea
                      value={formData.pastSurgicalHistory}
                      onChange={(e) => handleInputChange('pastSurgicalHistory', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="List previous surgeries"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Current Medications</label>
                    <textarea
                      value={formData.medications}
                      onChange={(e) => handleInputChange('medications', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="List current medications"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Allergies</label>
                    <textarea
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="List known allergies"
                    />
                  </div>
                  
                  {patient.gender === 'Female' && (
                    <div>
                      <label className="form-label text-xs">Gynecological/Obstetric History</label>
                      <textarea
                        value={formData.gynecologicalHistory}
                        onChange={(e) => handleInputChange('gynecologicalHistory', e.target.value)}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Gynecological and obstetric history"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Family and Social History */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('familySocial')}
              >
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Users className="h-4 w-4 mr-1.5 text-primary-500" />
                  Family and Socioeconomic History
                </h3>
                {expandedSections.familySocial ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.familySocial && (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="form-label text-xs">Family History</label>
                    <textarea
                      value={formData.familyHistory}
                      onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Family medical history"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Social History</label>
                    <textarea
                      value={formData.socialHistory}
                      onChange={(e) => handleInputChange('socialHistory', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Social and occupational history"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Examination Tab */}
        {activeTab === 'examination' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            {/* Vital Signs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label text-sm">Temperature (°C)</label>
                <div className="flex items-center">
                  <Thermometer className="h-4 w-4 text-gray-400 mr-1" />
                  <input
                    type="text"
                    value={formData.vitalSigns.temperature}
                    onChange={(e) => handleVitalSignsChange('temperature', e.target.value)}
                    className="form-input text-sm"
                    placeholder="36.5"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-sm">Heart Rate (bpm)</label>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 text-gray-400 mr-1" />
                  <input
                    type="text"
                    value={formData.vitalSigns.heartRate}
                    onChange={(e) => handleVitalSignsChange('heartRate', e.target.value)}
                    className="form-input text-sm"
                    placeholder="75"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-sm">Respiratory Rate (breaths/min)</label>
                <div className="flex items-center">
                  <Lungs className="h-4 w-4 text-gray-400 mr-1" />
                  <input
                    type="text"
                    value={formData.vitalSigns.respiratoryRate}
                    onChange={(e) => handleVitalSignsChange('respiratoryRate', e.target.value)}
                    className="form-input text-sm"
                    placeholder="16"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-sm">Blood Pressure (mmHg)</label>
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-gray-400 mr-1" />
                  <input
                    type="text"
                    value={formData.vitalSigns.bloodPressure}
                    onChange={(e) => handleVitalSignsChange('bloodPressure', e.target.value)}
                    className="form-input text-sm"
                    placeholder="120/80"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-sm">Oxygen Saturation (%)</label>
                <div className="flex items-center">
                  <Droplets className="h-4 w-4 text-gray-400 mr-1" />
                  <input
                    type="text"
                    value={formData.vitalSigns.oxygenSaturation}
                    onChange={(e) => handleVitalSignsChange('oxygenSaturation', e.target.value)}
                    className="form-input text-sm"
                    placeholder="98"
                  />
                </div>
              </div>
            </div>
            
            {/* General Examination */}
            <div>
              <label className="form-label text-sm">General Examination</label>
              <textarea
                value={formData.generalExamination}
                onChange={(e) => handleInputChange('generalExamination', e.target.value)}
                className="form-input text-sm"
                rows={3}
                placeholder="General appearance, level of consciousness, etc."
              />
            </div>
            
            {/* Systemic Examination */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('examination')}
              >
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-1.5 text-primary-500" />
                  Systemic Examination
                </h3>
                {expandedSections.examination ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.examination && (
                <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Heart className="h-3.5 w-3.5 mr-1 text-error-500" />
                      Cardiovascular System
                    </label>
                    <textarea
                      value={formData.systemicExamination.cardiovascular}
                      onChange={(e) => handleSystemicExaminationChange('cardiovascular', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Heart sounds, murmurs, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Lungs className="h-3.5 w-3.5 mr-1 text-primary-500" />
                      Respiratory System
                    </label>
                    <textarea
                      value={formData.systemicExamination.respiratory}
                      onChange={(e) => handleSystemicExaminationChange('respiratory', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Breath sounds, respiratory effort, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Activity className="h-3.5 w-3.5 mr-1 text-warning-500" />
                      Gastrointestinal System
                    </label>
                    <textarea
                      value={formData.systemicExamination.gastrointestinal}
                      onChange={(e) => handleSystemicExaminationChange('gastrointestinal', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Abdomen, bowel sounds, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Brain className="h-3.5 w-3.5 mr-1 text-secondary-500" />
                      Central Nervous System
                    </label>
                    <textarea
                      value={formData.systemicExamination.neurological}
                      onChange={(e) => handleSystemicExaminationChange('neurological', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Mental status, cranial nerves, motor, sensory, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs flex items-center">
                      <Bone className="h-3.5 w-3.5 mr-1 text-accent-500" />
                      Musculoskeletal
                    </label>
                    <textarea
                      value={formData.systemicExamination.musculoskeletal}
                      onChange={(e) => handleSystemicExaminationChange('musculoskeletal', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Joints, muscles, range of motion, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Genitourinary System</label>
                    <textarea
                      value={formData.systemicExamination.genitourinary}
                      onChange={(e) => handleSystemicExaminationChange('genitourinary', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Genitourinary findings"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Other Systems/Examination</label>
                    <textarea
                      value={formData.systemicExamination.other}
                      onChange={(e) => handleSystemicExaminationChange('other', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Other examination findings"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('assessment')}
              >
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <ClipboardList className="h-4 w-4 mr-1.5 text-primary-500" />
                  Assessment
                </h3>
                {expandedSections.assessment ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.assessment && (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="form-label required text-sm">Diagnosis</label>
                    <textarea
                      value={formData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Primary diagnosis"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Differential Diagnosis</label>
                    <textarea
                      value={formData.differentialDiagnosis}
                      onChange={(e) => handleInputChange('differentialDiagnosis', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Alternative diagnoses to consider"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            {/* Laboratory Tests */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label text-sm flex items-center">
                  <Flask className="h-4 w-4 mr-1.5 text-primary-500" />
                  Laboratory Tests
                </label>
                <button
                  type="button"
                  onClick={() => handleAddInvestigation('laboratory')}
                  className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Test
                </button>
              </div>
              
              {formData.investigations.laboratory.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-500">No laboratory tests ordered</p>
                  <button
                    type="button"
                    onClick={() => handleAddInvestigation('laboratory')}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                  >
                    Add Laboratory Test
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.investigations.laboratory.map((test, index) => (
                    <div key={index} className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={test.name}
                          onChange={(e) => handleInvestigationChange('laboratory', index, 'name', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Test name"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={test.details}
                          onChange={(e) => handleInvestigationChange('laboratory', index, 'details', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Details/Notes"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigation('laboratory', index)}
                        className="p-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Radiology Tests */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label text-sm flex items-center">
                  <FileImage className="h-4 w-4 mr-1.5 text-secondary-500" />
                  Radiology Tests
                </label>
                <button
                  type="button"
                  onClick={() => handleAddInvestigation('radiology')}
                  className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Test
                </button>
              </div>
              
              {formData.investigations.radiology.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-500">No radiology tests ordered</p>
                  <button
                    type="button"
                    onClick={() => handleAddInvestigation('radiology')}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                  >
                    Add Radiology Test
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.investigations.radiology.map((test, index) => (
                    <div key={index} className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={test.name}
                          onChange={(e) => handleInvestigationChange('radiology', index, 'name', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Test name"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={test.details}
                          onChange={(e) => handleInvestigationChange('radiology', index, 'details', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Details/Notes"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigation('radiology', index)}
                        className="p-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Other Tests */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label text-sm flex items-center">
                  <Microscope className="h-4 w-4 mr-1.5 text-accent-500" />
                  Other Tests/Procedures
                </label>
                <button
                  type="button"
                  onClick={() => handleAddInvestigation('other')}
                  className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Test
                </button>
              </div>
              
              {formData.investigations.other.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-500">No other tests ordered</p>
                  <button
                    type="button"
                    onClick={() => handleAddInvestigation('other')}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                  >
                    Add Other Test
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.investigations.other.map((test, index) => (
                    <div key={index} className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={test.name}
                          onChange={(e) => handleInvestigationChange('other', index, 'name', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Test name"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={test.details}
                          onChange={(e) => handleInvestigationChange('other', index, 'details', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Details/Notes"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigation('other', index)}
                        className="p-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prescription Tab */}
        {activeTab === 'prescription' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Pill className="h-4 w-4 mr-1.5 text-primary-500" />
                Medications
              </h3>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Medication
              </button>
            </div>
            
            {formData.medications_prescribed.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <Pill className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No medications prescribed</p>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                >
                  Add Medication
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.medications_prescribed.map((medication, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">Medication #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="p-1 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label text-xs">Medication Name</label>
                        <input
                          type="text"
                          value={medication.medication}
                          onChange={(e) => handleMedicationChange(index, 'medication', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Medication name"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Dosage</label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="form-input text-sm"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Frequency</label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="form-input text-sm"
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Duration</label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          className="form-input text-sm"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="form-label text-xs">Instructions</label>
                        <input
                          type="text"
                          value={medication.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          className="form-input text-sm"
                          placeholder="e.g., Take with food"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('plan')}
              >
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Scroll className="h-4 w-4 mr-1.5 text-primary-500" />
                  Treatment Plan
                </h3>
                {expandedSections.plan ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.plan && (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="form-label text-sm">Treatment Plan</label>
                    <textarea
                      value={formData.treatmentPlan}
                      onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                      className="form-input text-sm"
                      rows={3}
                      placeholder="Describe the treatment plan"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Follow-up Instructions</label>
                    <textarea
                      value={formData.followUp}
                      onChange={(e) => handleInputChange('followUp', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Follow-up instructions and timeline"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Any additional notes"
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
                      <label className="form-label text-sm">Days of Leave</label>
                      <input
                        type="number"
                        value={formData.medicalCertificateDays}
                        onChange={(e) => handleInputChange('medicalCertificateDays', parseInt(e.target.value))}
                        min="1"
                        className="form-input text-sm"
                        placeholder="Number of days"
                      />
                    </div>
                  )}
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
            className="btn btn-outline text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
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