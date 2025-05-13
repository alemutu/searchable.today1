import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Save, User, Calendar, Clock, FileText, Pill, ArrowLeft, ChevronDown, ChevronRight, CheckCircle, Plus, Trash2, AlertCircle, Stethoscope, Heart, Activity, Settings as Lungs, Microscope, FlaskRound as Flask, FileImage, Syringe, Loader2, Home, Users, Building2 } from 'lucide-react';

interface ConsultationFormData {
  patientId: string;
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  pastMedicalHistory: string;
  pastSurgicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  allergies: string;
  currentMedications: string;
  gynecologicalHistory: string;
  generalExamination: string;
  vitalSigns: {
    temperature: string;
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
    weight: string;
    height: string;
  };
  systemicExamination: {
    cardiovascular: string;
    respiratory: string;
    gastrointestinal: string;
    genitourinary: string;
    neurological: string;
    musculoskeletal: string;
    other: string;
    breast: string;
  };
  diagnosis: string;
  differentialDiagnosis: string;
  investigations: {
    id: string;
    name: string;
    type: string;
    notes: string;
  }[];
  treatmentPlan: string;
  prescriptions: {
    id: string;
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

interface Department {
  id: string;
  name: string;
}

const ConsultationForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'examination' | 'diagnosis' | 'orders' | 'treatment' | 'summary'>('history');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familyHistory: true,
    generalExamination: true,
    cardiovascular: true,
    respiratory: true,
    gastrointestinal: true,
    genitourinary: true,
    neurological: true,
    musculoskeletal: true,
    other: false,
    breast: false
  });
  
  const [formData, setFormData] = useState<ConsultationFormData>({
    patientId: patientId || '',
    chiefComplaint: '',
    historyOfPresentingIllness: '',
    pastMedicalHistory: '',
    pastSurgicalHistory: '',
    familyHistory: '',
    socialHistory: '',
    allergies: '',
    currentMedications: '',
    gynecologicalHistory: '',
    generalExamination: '',
    vitalSigns: {
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: ''
    },
    systemicExamination: {
      cardiovascular: '',
      respiratory: '',
      gastrointestinal: '',
      genitourinary: '',
      neurological: '',
      musculoskeletal: '',
      other: '',
      breast: ''
    },
    diagnosis: '',
    differentialDiagnosis: '',
    investigations: [],
    treatmentPlan: '',
    prescriptions: [],
    followUp: '',
    notes: '',
    medicalCertificate: false,
    medicalCertificateDays: 1
  });

  useEffect(() => {
    if (hospital) {
      fetchDepartments();
    }
    
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [hospital, patientId]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospital?.id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
      
      // Set default department if available
      if (data && data.length > 0) {
        const generalMedicine = data.find(dept => 
          dept.name.toLowerCase().includes('general') || 
          dept.name.toLowerCase().includes('medicine')
        );
        
        if (generalMedicine) {
          setSelectedDepartment(generalMedicine.id);
        } else {
          setSelectedDepartment(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
      
      // Pre-fill form with patient data if available
      if (data.medical_history) {
        setFormData(prevData => ({
          ...prevData,
          allergies: data.medical_history.allergies ? 
            (Array.isArray(data.medical_history.allergies) ? 
              data.medical_history.allergies.join(', ') : 
              data.medical_history.allergies) : 
            '',
          pastMedicalHistory: data.medical_history.chronicConditions ? 
            (Array.isArray(data.medical_history.chronicConditions) ? 
              data.medical_history.chronicConditions.join(', ') : 
              data.medical_history.chronicConditions) : 
            '',
          currentMedications: data.medical_history.currentMedications ? 
            (Array.isArray(data.medical_history.currentMedications) ? 
              data.medical_history.currentMedications.map((med: any) => 
                typeof med === 'string' ? med : med.name
              ).join(', ') : 
              data.medical_history.currentMedications) : 
            '',
          familyHistory: data.medical_history.familyHistory || ''
        }));
      }
    } catch (error) {
      console.error('Error loading patient:', error);
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    const fieldParts = field.split('.');
    
    if (fieldParts.length === 1) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (fieldParts.length === 2) {
      const [section, subField] = fieldParts;
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [subField]: value
        }
      }));
    }
  };

  const addInvestigation = () => {
    const newInvestigation = {
      id: Date.now().toString(),
      name: '',
      type: 'laboratory',
      notes: ''
    };
    
    setFormData(prev => ({
      ...prev,
      investigations: [...prev.investigations, newInvestigation]
    }));
  };

  const updateInvestigation = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      investigations: prev.investigations.map(inv => 
        inv.id === id ? { ...inv, [field]: value } : inv
      )
    }));
  };

  const removeInvestigation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      investigations: prev.investigations.filter(inv => inv.id !== id)
    }));
  };

  const addPrescription = () => {
    const newPrescription = {
      id: Date.now().toString(),
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, newPrescription]
    }));
  };

  const updatePrescription = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(presc => 
        presc.id === id ? { ...presc, [field]: value } : presc
      )
    }));
  };

  const removePrescription = (id: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(presc => presc.id !== id)
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
    
    if (!selectedDepartment) {
      addNotification({
        message: 'Please select a department',
        type: 'warning'
      });
      return;
    }
    
    if (!formData.chiefComplaint) {
      addNotification({
        message: 'Chief complaint is required',
        type: 'warning'
      });
      return;
    }
    
    if (!formData.diagnosis) {
      addNotification({
        message: 'Diagnosis is required',
        type: 'warning'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare prescriptions data - remove empty prescriptions
      const validPrescriptions = formData.prescriptions.filter(p => 
        p.medication.trim() !== '' && p.dosage.trim() !== ''
      );
      
      // Prepare investigations data - remove empty investigations
      const validInvestigations = formData.investigations.filter(i => 
        i.name.trim() !== ''
      );
      
      // Create consultation record
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patient.id,
          doctor_id: user.id,
          hospital_id: hospital.id,
          department_id: selectedDepartment,
          consultation_date: new Date().toISOString(),
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          prescriptions: validPrescriptions.length > 0 ? validPrescriptions : null,
          notes: JSON.stringify({
            historyOfPresentingIllness: formData.historyOfPresentingIllness,
            pastMedicalHistory: formData.pastMedicalHistory,
            pastSurgicalHistory: formData.pastSurgicalHistory,
            familyHistory: formData.familyHistory,
            socialHistory: formData.socialHistory,
            allergies: formData.allergies,
            currentMedications: formData.currentMedications,
            gynecologicalHistory: formData.gynecologicalHistory,
            generalExamination: formData.generalExamination,
            vitalSigns: formData.vitalSigns,
            systemicExamination: formData.systemicExamination,
            differentialDiagnosis: formData.differentialDiagnosis,
            investigations: validInvestigations,
            followUp: formData.followUp,
            additionalNotes: formData.notes
          }),
          medical_certificate: formData.medicalCertificate
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab test orders if needed
      const labTests = validInvestigations.filter(i => i.type === 'laboratory');
      if (labTests.length > 0) {
        for (const test of labTests) {
          const { error: labError } = await supabase
            .from('lab_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: test.name.toLowerCase().replace(/\s+/g, '_'),
              test_date: new Date().toISOString(),
              status: 'pending',
              notes: test.notes
            });
            
          if (labError) console.error('Error creating lab test:', labError);
        }
      }
      
      // Create radiology orders if needed
      const radiologyTests = validInvestigations.filter(i => i.type === 'radiology');
      if (radiologyTests.length > 0) {
        for (const test of radiologyTests) {
          const { error: radiologyError } = await supabase
            .from('radiology_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: test.name.toLowerCase().replace(/\s+/g, '_'),
              scan_date: new Date().toISOString(),
              status: 'pending',
              notes: test.notes
            });
            
          if (radiologyError) console.error('Error creating radiology test:', radiologyError);
        }
      }
      
      // Create pharmacy order if needed
      if (validPrescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultation?.id,
            medications: validPrescriptions,
            status: 'pending',
            payment_status: 'pending'
          });
          
        if (pharmacyError) console.error('Error creating pharmacy order:', pharmacyError);
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
        })
        .eq('id', patient.id);
        
      if (patientError) console.error('Error updating patient flow step:', patientError);
      
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
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mr-3 p-1.5 rounded-full text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Clinical Consultation</h1>
                  <div className="flex items-center text-primary-100 text-sm">
                    <Stethoscope className="h-4 w-4 mr-1" />
                    <span>New consultation for {patient.first_name} {patient.last_name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn bg-white text-primary-600 hover:bg-white/90 shadow-sm flex items-center py-1.5 px-3 text-sm"
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
          </div>
          
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold">
                  {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </h2>
                  <div className="flex flex-wrap items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-1" />
                      {calculateAge(patient.date_of_birth)} years • {patient.gender}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div>
                  <label htmlFor="department" className="block text-xs font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    id="department"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="form-input py-1.5 text-sm rounded-lg w-full sm:w-auto"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="chiefComplaint" className="block text-xs font-medium text-gray-700 mb-1">
                    Chief Complaint
                  </label>
                  <input
                    id="chiefComplaint"
                    type="text"
                    value={formData.chiefComplaint}
                    onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                    className="form-input py-1.5 text-sm rounded-lg w-full"
                    placeholder="Primary reason for visit"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                History
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('examination')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'examination'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Stethoscope className="h-4 w-4 mr-1.5" />
                Examination
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Flask className="h-4 w-4 mr-1.5" />
                Orders
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diagnosis')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'diagnosis'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-1.5" />
                Diagnosis
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('treatment')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'treatment'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Pill className="h-4 w-4 mr-1.5" />
                Treatment
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                Summary
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              {/* Patient History */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('patientHistory')}
                >
                  <h3 className="text-sm font-medium text-gray-900">Patient History</h3>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.patientHistory ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedSections.patientHistory && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="form-label text-sm">History of Presenting Illness</label>
                      <textarea
                        value={formData.historyOfPresentingIllness}
                        onChange={(e) => handleInputChange('historyOfPresentingIllness', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Describe the history of the current illness"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label text-sm">Past Medical History</label>
                        <textarea
                          value={formData.pastMedicalHistory}
                          onChange={(e) => handleInputChange('pastMedicalHistory', e.target.value)}
                          className="form-input py-2 text-sm"
                          rows={3}
                          placeholder="Previous medical conditions"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Past Surgical History</label>
                        <textarea
                          value={formData.pastSurgicalHistory}
                          onChange={(e) => handleInputChange('pastSurgicalHistory', e.target.value)}
                          className="form-input py-2 text-sm"
                          rows={3}
                          placeholder="Previous surgeries"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label text-sm">Allergies</label>
                        <textarea
                          value={formData.allergies}
                          onChange={(e) => handleInputChange('allergies', e.target.value)}
                          className="form-input py-2 text-sm"
                          rows={2}
                          placeholder="Known allergies"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Current Medications</label>
                        <textarea
                          value={formData.currentMedications}
                          onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                          className="form-input py-2 text-sm"
                          rows={2}
                          placeholder="Current medications"
                        />
                      </div>
                    </div>
                    
                    {patient.gender === 'Female' && (
                      <div>
                        <label className="form-label text-sm">Gynecological/Obstetric History</label>
                        <textarea
                          value={formData.gynecologicalHistory}
                          onChange={(e) => handleInputChange('gynecologicalHistory', e.target.value)}
                          className="form-input py-2 text-sm"
                          rows={2}
                          placeholder="For female patients only"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Family and Socioeconomic History */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('familyHistory')}
                >
                  <h3 className="text-sm font-medium text-gray-900">Family & Socioeconomic History</h3>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.familyHistory ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedSections.familyHistory && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="form-label text-sm">Family History</label>
                      <textarea
                        value={formData.familyHistory}
                        onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={2}
                        placeholder="Family medical history"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Social History</label>
                      <textarea
                        value={formData.socialHistory}
                        onChange={(e) => handleInputChange('socialHistory', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={2}
                        placeholder="Social, occupational, and lifestyle factors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Examination Tab */}
          {activeTab === 'examination' && (
            <div className="space-y-5">
              {/* General Examination */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('generalExamination')}
                >
                  <h3 className="text-sm font-medium text-gray-900">General Examination</h3>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.generalExamination ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedSections.generalExamination && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="form-label text-sm">General Appearance</label>
                      <textarea
                        value={formData.generalExamination}
                        onChange={(e) => handleInputChange('generalExamination', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="General appearance, mental status, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="form-label text-sm">Temperature (°C)</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.temperature}
                          onChange={(e) => handleInputChange('vitalSigns.temperature', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="36.5"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Blood Pressure (mmHg)</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.bloodPressure}
                          onChange={(e) => handleInputChange('vitalSigns.bloodPressure', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="120/80"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Heart Rate (bpm)</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.heartRate}
                          onChange={(e) => handleInputChange('vitalSigns.heartRate', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="72"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Respiratory Rate</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.respiratoryRate}
                          onChange={(e) => handleInputChange('vitalSigns.respiratoryRate', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="16"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">O₂ Saturation (%)</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.oxygenSaturation}
                          onChange={(e) => handleInputChange('vitalSigns.oxygenSaturation', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="98"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Weight (kg)</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.weight}
                          onChange={(e) => handleInputChange('vitalSigns.weight', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="70"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Height (cm)</label>
                        <input
                          type="text"
                          value={formData.vitalSigns.height}
                          onChange={(e) => handleInputChange('vitalSigns.height', e.target.value)}
                          className="form-input py-2 text-sm"
                          placeholder="170"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Systemic Examination */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 px-1">Systemic Examination</h3>
                
                {/* Cardiovascular System */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('cardiovascular')}
                  >
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 text-error-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Cardiovascular System</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.cardiovascular ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.cardiovascular && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.cardiovascular}
                        onChange={(e) => handleInputChange('systemicExamination.cardiovascular', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Heart sounds, murmurs, pulses, etc."
                      />
                    </div>
                  )}
                </div>
                
                {/* Respiratory System */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('respiratory')}
                  >
                    <div className="flex items-center">
                      <Lungs className="h-4 w-4 text-blue-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Respiratory System</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.respiratory ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.respiratory && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.respiratory}
                        onChange={(e) => handleInputChange('systemicExamination.respiratory', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Breath sounds, respiratory effort, etc."
                      />
                    </div>
                  )}
                </div>
                
                {/* Gastrointestinal System */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('gastrointestinal')}
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-green-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Gastrointestinal System</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.gastrointestinal ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.gastrointestinal && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.gastrointestinal}
                        onChange={(e) => handleInputChange('systemicExamination.gastrointestinal', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Abdomen, bowel sounds, tenderness, etc."
                      />
                    </div>
                  )}
                </div>
                
                {/* Genitourinary System */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('genitourinary')}
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-yellow-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Genitourinary System</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.genitourinary ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.genitourinary && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.genitourinary}
                        onChange={(e) => handleInputChange('systemicExamination.genitourinary', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Genitourinary findings"
                      />
                    </div>
                  )}
                </div>
                
                {/* Neurological System */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('neurological')}
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-purple-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Central Nervous System</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.neurological ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.neurological && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.neurological}
                        onChange={(e) => handleInputChange('systemicExamination.neurological', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Mental status, cranial nerves, motor, sensory, reflexes, etc."
                      />
                    </div>
                  )}
                </div>
                
                {/* Musculoskeletal System */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('musculoskeletal')}
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-orange-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Musculoskeletal</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.musculoskeletal ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.musculoskeletal && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.musculoskeletal}
                        onChange={(e) => handleInputChange('systemicExamination.musculoskeletal', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Joints, muscles, range of motion, etc."
                      />
                    </div>
                  )}
                </div>
                
                {/* Breast Examination */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('breast')}
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-pink-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Breast</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.breast ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.breast && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.breast}
                        onChange={(e) => handleInputChange('systemicExamination.breast', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Breast examination findings"
                      />
                    </div>
                  )}
                </div>
                
                {/* Other Systems */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('other')}
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-gray-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Other Systems/Examination</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.other ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedSections.other && (
                    <div className="p-4">
                      <textarea
                        value={formData.systemicExamination.other}
                        onChange={(e) => handleInputChange('systemicExamination.other', e.target.value)}
                        className="form-input py-2 text-sm"
                        rows={3}
                        placeholder="Other examination findings"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">Investigations & Orders</h3>
                  <button
                    type="button"
                    onClick={addInvestigation}
                    className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Investigation
                  </button>
                </div>
                
                <div className="p-4">
                  {formData.investigations.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Microscope className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No investigations ordered yet</p>
                      <button
                        type="button"
                        onClick={addInvestigation}
                        className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Add an investigation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.investigations.map((investigation, index) => (
                        <div key={investigation.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              {investigation.type === 'laboratory' ? (
                                <Flask className="h-5 w-5 text-primary-500 mr-2" />
                              ) : investigation.type === 'radiology' ? (
                                <FileImage className="h-5 w-5 text-secondary-500 mr-2" />
                              ) : (
                                <Activity className="h-5 w-5 text-gray-500 mr-2" />
                              )}
                              <h4 className="text-sm font-medium text-gray-900">Investigation #{index + 1}</h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeInvestigation(investigation.id)}
                              className="text-gray-400 hover:text-error-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="form-label text-xs">Investigation Name</label>
                              <input
                                type="text"
                                value={investigation.name}
                                onChange={(e) => updateInvestigation(investigation.id, 'name', e.target.value)}
                                className="form-input py-1.5 text-sm"
                                placeholder="e.g., Complete Blood Count"
                              />
                            </div>
                            
                            <div>
                              <label className="form-label text-xs">Type</label>
                              <select
                                value={investigation.type}
                                onChange={(e) => updateInvestigation(investigation.id, 'type', e.target.value)}
                                className="form-input py-1.5 text-sm"
                              >
                                <option value="laboratory">Laboratory</option>
                                <option value="radiology">Radiology</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <label className="form-label text-xs">Notes/Instructions</label>
                            <textarea
                              value={investigation.notes}
                              onChange={(e) => updateInvestigation(investigation.id, 'notes', e.target.value)}
                              className="form-input py-1.5 text-sm"
                              rows={2}
                              placeholder="Special instructions or notes for this investigation"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Diagnosis Tab */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-5">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-medium text-gray-900">Diagnosis</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm required">Primary Diagnosis</label>
                    <textarea
                      value={formData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      className="form-input py-2 text-sm"
                      rows={2}
                      placeholder="Primary diagnosis"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Differential Diagnosis</label>
                    <textarea
                      value={formData.differentialDiagnosis}
                      onChange={(e) => handleInputChange('differentialDiagnosis', e.target.value)}
                      className="form-input py-2 text-sm"
                      rows={2}
                      placeholder="Alternative diagnoses being considered"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Treatment Tab */}
          {activeTab === 'treatment' && (
            <div className="space-y-5">
              {/* Treatment Plan */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-medium text-gray-900">Treatment Plan</h3>
                </div>
                
                <div className="p-4">
                  <textarea
                    value={formData.treatmentPlan}
                    onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={3}
                    placeholder="Treatment plan and recommendations"
                  />
                </div>
              </div>
              
              {/* Prescriptions */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">Prescriptions</h3>
                  <button
                    type="button"
                    onClick={addPrescription}
                    className="btn btn-sm btn-outline py-1 px-2 text-xs flex items-center"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Prescription
                  </button>
                </div>
                
                <div className="p-4">
                  {formData.prescriptions.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Pill className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No prescriptions added yet</p>
                      <button
                        type="button"
                        onClick={addPrescription}
                        className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Add a prescription
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.prescriptions.map((prescription, index) => (
                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-sm font-medium text-gray-900 flex items-center">
                              <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
                              Prescription #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removePrescription(prescription.id)}
                              className="text-gray-400 hover:text-error-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="form-label text-xs">Medication</label>
                              <input
                                type="text"
                                value={prescription.medication}
                                onChange={(e) => updatePrescription(prescription.id, 'medication', e.target.value)}
                                className="form-input py-1.5 text-sm"
                                placeholder="Medication name"
                              />
                            </div>
                            
                            <div>
                              <label className="form-label text-xs">Dosage</label>
                              <input
                                type="text"
                                value={prescription.dosage}
                                onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                                className="form-input py-1.5 text-sm"
                                placeholder="e.g., 500mg"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <label className="form-label text-xs">Frequency</label>
                              <input
                                type="text"
                                value={prescription.frequency}
                                onChange={(e) => updatePrescription(prescription.id, 'frequency', e.target.value)}
                                className="form-input py-1.5 text-sm"
                                placeholder="e.g., Twice daily"
                              />
                            </div>
                            
                            <div>
                              <label className="form-label text-xs">Duration</label>
                              <input
                                type="text"
                                value={prescription.duration}
                                onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                                className="form-input py-1.5 text-sm"
                                placeholder="e.g., 7 days"
                              />
                            </div>
                            
                            <div className="md:col-span-1">
                              <label className="form-label text-xs">Instructions</label>
                              <input
                                type="text"
                                value={prescription.instructions}
                                onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
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
              </div>
              
              {/* Follow-up and Notes */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-medium text-gray-900">Follow-up & Additional Notes</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">Follow-up Plan</label>
                    <textarea
                      value={formData.followUp}
                      onChange={(e) => handleInputChange('followUp', e.target.value)}
                      className="form-input py-2 text-sm"
                      rows={2}
                      placeholder="Follow-up instructions"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="form-input py-2 text-sm"
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
                    <div className="pl-6">
                      <label className="form-label text-sm">Number of Days</label>
                      <input
                        type="number"
                        value={formData.medicalCertificateDays}
                        onChange={(e) => handleInputChange('medicalCertificateDays', parseInt(e.target.value))}
                        min="1"
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
            <div className="space-y-5">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-medium text-gray-900">Consultation Summary</h3>
                </div>
                
                <div className="p-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patient Information</h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span> {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Age/Gender:</span> {calculateAge(patient.date_of_birth)} years, {patient.gender}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Chief Complaint:</span> {formData.chiefComplaint || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vital Signs</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.vitalSigns.temperature && (
                          <p className="text-sm">
                            <span className="font-medium">Temp:</span> {formData.vitalSigns.temperature}°C
                          </p>
                        )}
                        {formData.vitalSigns.bloodPressure && (
                          <p className="text-sm">
                            <span className="font-medium">BP:</span> {formData.vitalSigns.bloodPressure} mmHg
                          </p>
                        )}
                        {formData.vitalSigns.heartRate && (
                          <p className="text-sm">
                            <span className="font-medium">HR:</span> {formData.vitalSigns.heartRate} bpm
                          </p>
                        )}
                        {formData.vitalSigns.respiratoryRate && (
                          <p className="text-sm">
                            <span className="font-medium">RR:</span> {formData.vitalSigns.respiratoryRate} /min
                          </p>
                        )}
                        {formData.vitalSigns.oxygenSaturation && (
                          <p className="text-sm">
                            <span className="font-medium">O₂ Sat:</span> {formData.vitalSigns.oxygenSaturation}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Diagnosis & Plan</h4>
                    <div className="space-y-3">
                      {formData.diagnosis && (
                        <div>
                          <p className="text-sm font-medium">Diagnosis:</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{formData.diagnosis}</p>
                        </div>
                      )}
                      
                      {formData.treatmentPlan && (
                        <div>
                          <p className="text-sm font-medium">Treatment Plan:</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{formData.treatmentPlan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {formData.prescriptions.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prescriptions</h4>
                      <div className="space-y-2">
                        {formData.prescriptions.map((prescription, index) => (
                          prescription.medication && (
                            <div key={prescription.id} className="bg-gray-50 p-2 rounded">
                              <p className="text-sm">
                                <span className="font-medium">{index + 1}. {prescription.medication}</span> {prescription.dosage && `- ${prescription.dosage}`}
                                {prescription.frequency && `, ${prescription.frequency}`}
                                {prescription.duration && ` for ${prescription.duration}`}
                                {prescription.instructions && ` (${prescription.instructions})`}
                              </p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.investigations.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Investigations Ordered</h4>
                      <div className="space-y-2">
                        {formData.investigations.map((investigation, index) => (
                          investigation.name && (
                            <div key={investigation.id} className="bg-gray-50 p-2 rounded flex items-center">
                              {investigation.type === 'laboratory' ? (
                                <Flask className="h-4 w-4 text-primary-500 mr-2" />
                              ) : investigation.type === 'radiology' ? (
                                <FileImage className="h-4 w-4 text-secondary-500 mr-2" />
                              ) : (
                                <Activity className="h-4 w-4 text-gray-500 mr-2" />
                              )}
                              <p className="text-sm">
                                <span className="font-medium">{investigation.name}</span>
                                {investigation.notes && ` - ${investigation.notes}`}
                              </p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.followUp && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Follow-up</h4>
                      <p className="text-sm bg-gray-50 p-2 rounded">{formData.followUp}</p>
                    </div>
                  )}
                  
                  {formData.medicalCertificate && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                        <p className="text-sm font-medium text-success-700">
                          Medical Certificate will be issued for {formData.medicalCertificateDays} day{formData.medicalCertificateDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline py-2 text-sm px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary py-2 text-sm px-4"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
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
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              const tabs = ['history', 'examination', 'orders', 'diagnosis', 'treatment', 'summary'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1] as any);
              }
            }}
            className="btn btn-outline py-2 text-sm px-4"
            disabled={activeTab === 'history'}
          >
            Previous
          </button>
          
          <button
            type="button"
            onClick={() => {
              const tabs = ['history', 'examination', 'orders', 'diagnosis', 'treatment', 'summary'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1] as any);
              }
            }}
            className="btn btn-primary py-2 text-sm px-4"
            disabled={activeTab === 'summary'}
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;