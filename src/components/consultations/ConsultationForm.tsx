import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { User, Calendar, FileText, Pill, Save, ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle, Stethoscope, Clipboard, ClipboardCheck, Heart, Settings as Lungs, Brain, Bone, Activity, FileImage, Microscope, Scan } from 'lucide-react';

interface ConsultationFormData {
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
    neurological: string;
    musculoskeletal: string;
    other: string;
    breast: string;
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
    specialtyDepartment: string;
    reason: string;
    urgency: string;
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'orders' | 'prescriptions' | 'notes'>('assessment');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familyHistory: false,
    examination: true,
    systemicExamination: true
  });
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
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
        neurological: '',
        musculoskeletal: '',
        other: '',
        breast: ''
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

  const vitalSigns = watch('vitalSigns');
  const prescriptions = watch('prescriptions');
  const labOrders = watch('labOrders');
  const radiologyOrders = watch('radiologyOrders');
  const referrals = watch('referrals');
  const medicalCertificate = watch('medicalCertificate');
  
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
  
  useEffect(() => {
    // Calculate BMI if height and weight are available
    if (vitalSigns.height && vitalSigns.weight) {
      const heightInMeters = vitalSigns.height / 100;
      const bmi = vitalSigns.weight / (heightInMeters * heightInMeters);
      setValue('vitalSigns.bmi', parseFloat(bmi.toFixed(1)));
    }
  }, [vitalSigns.height, vitalSigns.weight, setValue]);

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
        if (mockPatient.medical_history) {
          if (mockPatient.medical_history.allergies) {
            setValue('allergies', mockPatient.medical_history.allergies.map(a => 
              `${a.allergen} (${a.reaction}, ${a.severity})`
            ).join('\n'));
          }
          
          if (mockPatient.medical_history.currentMedications) {
            setValue('currentMedications', mockPatient.medical_history.currentMedications.map(m => 
              `${m.name} ${m.dosage} ${m.frequency}`
            ).join('\n'));
          }
        }
        
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
        if (data.medical_history.allergies) {
          setValue('allergies', data.medical_history.allergies.map((a: any) => 
            `${a.allergen} (${a.reaction}, ${a.severity})`
          ).join('\n'));
        }
        
        if (data.medical_history.currentMedications) {
          setValue('currentMedications', data.medical_history.currentMedications.map((m: any) => 
            `${m.name} ${m.dosage || ''} ${m.frequency || ''}`
          ).join('\n'));
        }
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

  const fetchDepartments = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockDepartments: Department[] = [
          { id: '1', name: 'General Medicine' },
          { id: '2', name: 'Cardiology' },
          { id: '3', name: 'Pediatrics' },
          { id: '4', name: 'Orthopedics' },
          { id: '5', name: 'Gynecology' }
        ];
        setDepartments(mockDepartments);
        setSelectedDepartment(mockDepartments[0].id);
        return;
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospital?.id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
      if (data && data.length > 0) {
        setSelectedDepartment(data[0].id);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      addNotification({
        message: 'Failed to load departments',
        type: 'error'
      });
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

  const addPrescription = () => {
    setValue('prescriptions', [
      ...prescriptions,
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removePrescription = (index: number) => {
    setValue('prescriptions', prescriptions.filter((_, i) => i !== index));
  };

  const addLabOrder = () => {
    setValue('labOrders', [
      ...labOrders,
      { testName: '', instructions: '', urgency: 'routine' }
    ]);
  };

  const removeLabOrder = (index: number) => {
    setValue('labOrders', labOrders.filter((_, i) => i !== index));
  };

  const addRadiologyOrder = () => {
    setValue('radiologyOrders', [
      ...radiologyOrders,
      { scanType: '', bodyPart: '', instructions: '', urgency: 'routine' }
    ]);
  };

  const removeRadiologyOrder = (index: number) => {
    setValue('radiologyOrders', radiologyOrders.filter((_, i) => i !== index));
  };

  const addReferral = () => {
    setValue('referrals', [
      ...referrals,
      { specialtyDepartment: '', reason: '', urgency: 'routine' }
    ]);
  };

  const removeReferral = (index: number) => {
    setValue('referrals', referrals.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient || !selectedDepartment) {
      addNotification({
        message: 'Missing required information',
        type: 'error'
      });
      return;
    }
    
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
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patient.id,
          doctor_id: user.id,
          hospital_id: hospital.id,
          department_id: selectedDepartment,
          consultation_date: new Date().toISOString(),
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatment_plan: data.treatmentPlan,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          prescriptions: data.prescriptions.length > 0 ? data.prescriptions : null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation',
          medical_history: {
            ...patient.medical_history,
            pastMedicalHistory: data.pastMedicalHistory,
            pastSurgicalHistory: data.pastSurgicalHistory,
            familyHistory: data.familyHistory,
            socialHistory: data.socialHistory
          }
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
      // Create lab orders if any
      if (data.labOrders.length > 0) {
        for (const order of data.labOrders) {
          const { error: labError } = await supabase
            .from('lab_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: order.testName.toLowerCase().replace(/\s+/g, '_'),
              test_date: new Date().toISOString(),
              status: 'pending',
              is_emergency: order.urgency === 'emergency',
              notes: order.instructions
            });
            
          if (labError) throw labError;
        }
      }
      
      // Create radiology orders if any
      if (data.radiologyOrders.length > 0) {
        for (const order of data.radiologyOrders) {
          const { error: radiologyError } = await supabase
            .from('radiology_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: order.scanType.toLowerCase().replace(/\s+/g, '_'),
              scan_date: new Date().toISOString(),
              status: 'pending',
              is_emergency: order.urgency === 'emergency',
              notes: order.instructions
            });
            
          if (radiologyError) throw radiologyError;
        }
      }
      
      // Create pharmacy order if prescriptions exist
      if (data.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
            medications: data.prescriptions.map(p => ({
              medication: p.medication,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
              quantity: parseInt(p.duration.split(' ')[0]) || 1,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: data.prescriptions.some(p => p.instructions.toLowerCase().includes('emergency'))
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      // Create referrals if any
      if (data.referrals.length > 0) {
        for (const referral of data.referrals) {
          const { error: referralError } = await supabase
            .from('referrals')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              referring_doctor_id: user.id,
              referral_date: new Date().toISOString(),
              reason: referral.reason,
              urgency: referral.urgency,
              status: 'pending'
            });
            
          if (referralError) throw referralError;
        }
      }
      
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
              className={`flex-1 py-2.5 px-3 text-center text-xs font-medium ${
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
              className={`flex-1 py-2.5 px-3 text-center text-xs font-medium ${
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
              className={`flex-1 py-2.5 px-3 text-center text-xs font-medium ${
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
              className={`flex-1 py-2.5 px-3 text-center text-xs font-medium ${
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
          <div className="space-y-3">
            {/* Chief Complaint */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="mb-3">
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
              
              <div className="mb-3">
                <label className="form-label text-xs">History of Presenting Illness</label>
                <textarea
                  {...register('historyOfPresentingIllness')}
                  className="form-input py-1.5 text-sm"
                  rows={3}
                  placeholder="Detailed description of the current illness"
                />
              </div>
            </div>
            
            {/* Patient History Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('patientHistory')}>
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Clipboard className="h-4 w-4 mr-1.5 text-primary-500" />
                  Patient History
                </h3>
                {expandedSections.patientHistory ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.patientHistory && (
                <div className="mt-2 space-y-3">
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
                      <label className="form-label text-xs">Allergies</label>
                      <textarea
                        {...register('allergies')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Known allergies and reactions"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Current Medications</label>
                      <textarea
                        {...register('currentMedications')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Current medications and dosages"
                      />
                    </div>
                  </div>
                  
                  {patient.gender === 'Female' && (
                    <div>
                      <label className="form-label text-xs">Gynecological/Obstetric History</label>
                      <textarea
                        {...register('gynecologicalHistory')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Gynecological and obstetric history"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Family and Social History */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('familyHistory')}>
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Clipboard className="h-4 w-4 mr-1.5 text-primary-500" />
                  Family and Socioeconomic History
                </h3>
                {expandedSections.familyHistory ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.familyHistory && (
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="form-label text-xs">Family History</label>
                    <textarea
                      {...register('familyHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Family medical history"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Social History</label>
                    <textarea
                      {...register('socialHistory')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Social, occupational, and lifestyle factors"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Examination Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('examination')}>
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-1.5 text-primary-500" />
                  General Examination
                </h3>
                {expandedSections.examination ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.examination && (
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="form-label text-xs">General Examination</label>
                    <textarea
                      {...register('generalExamination')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="General physical examination findings"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="form-label text-xs">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('vitalSigns.temperature')}
                        className="form-input py-1.5 text-sm"
                        placeholder="36.5"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Heart Rate (bpm)</label>
                      <input
                        type="number"
                        {...register('vitalSigns.heartRate')}
                        className="form-input py-1.5 text-sm"
                        placeholder="75"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Respiratory Rate</label>
                      <input
                        type="number"
                        {...register('vitalSigns.respiratoryRate')}
                        className="form-input py-1.5 text-sm"
                        placeholder="16"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Blood Pressure</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          {...register('vitalSigns.bloodPressureSystolic')}
                          className="form-input py-1.5 text-sm w-1/2"
                          placeholder="120"
                        />
                        <span className="text-gray-500">/</span>
                        <input
                          type="number"
                          {...register('vitalSigns.bloodPressureDiastolic')}
                          className="form-input py-1.5 text-sm w-1/2"
                          placeholder="80"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">O₂ Saturation (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        {...register('vitalSigns.oxygenSaturation')}
                        className="form-input py-1.5 text-sm"
                        placeholder="98"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('vitalSigns.weight')}
                        className="form-input py-1.5 text-sm"
                        placeholder="70"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Height (cm)</label>
                      <input
                        type="number"
                        {...register('vitalSigns.height')}
                        className="form-input py-1.5 text-sm"
                        placeholder="170"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">BMI</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('vitalSigns.bmi')}
                        className="form-input py-1.5 text-sm bg-gray-50"
                        placeholder="Calculated"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Systemic Examination */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('systemicExamination')}>
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-1.5 text-primary-500" />
                  Systemic Examination
                </h3>
                {expandedSections.systemicExamination ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandedSections.systemicExamination && (
                <div className="mt-2 space-y-3 max-h-96 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs flex items-center">
                        <Heart className="h-3.5 w-3.5 mr-1 text-error-500" />
                        Cardiovascular System
                      </label>
                      <textarea
                        {...register('systemicExamination.cardiovascular')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Heart sounds, murmurs, pulses, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs flex items-center">
                        <Lungs className="h-3.5 w-3.5 mr-1 text-blue-500" />
                        Respiratory System
                      </label>
                      <textarea
                        {...register('systemicExamination.respiratory')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Breath sounds, respiratory rate, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs flex items-center">
                        <Brain className="h-3.5 w-3.5 mr-1 text-purple-500" />
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
                        <Bone className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        Musculoskeletal
                      </label>
                      <textarea
                        {...register('systemicExamination.musculoskeletal')}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Joints, muscles, bones, etc."
                      />
                    </div>
                  </div>
                  
                  {patient.gender === 'Female' && (
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
                    <label className="form-label text-xs">Other Systems/Examination</label>
                    <textarea
                      {...register('systemicExamination.other')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Any other examination findings"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Diagnosis and Treatment */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="mb-3">
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
              
              <div className="mb-3">
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
            </div>
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {/* Lab Orders */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Microscope className="h-4 w-4 mr-1.5 text-primary-500" />
                  Laboratory Orders
                </h3>
                <button
                  type="button"
                  onClick={addLabOrder}
                  className="btn btn-sm btn-outline py-1 px-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Test
                </button>
              </div>
              
              {labOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No laboratory tests ordered
                </div>
              ) : (
                <div className="space-y-3">
                  {labOrders.map((_, index) => (
                    <div key={index} className="border rounded-lg p-3 relative">
                      <button
                        type="button"
                        onClick={() => removeLabOrder(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="form-label text-xs required">Test Name</label>
                          <select
                            {...register(`labOrders.${index}.testName` as const, { required: true })}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="">Select Test</option>
                            <option value="Complete Blood Count">Complete Blood Count (CBC)</option>
                            <option value="Liver Function Test">Liver Function Test (LFT)</option>
                            <option value="Kidney Function Test">Kidney Function Test</option>
                            <option value="Lipid Profile">Lipid Profile</option>
                            <option value="Blood Glucose">Blood Glucose</option>
                            <option value="Urinalysis">Urinalysis</option>
                            <option value="Thyroid Function Test">Thyroid Function Test</option>
                            <option value="Electrolytes Panel">Electrolytes Panel</option>
                            <option value="HbA1c">HbA1c</option>
                            <option value="Coagulation Profile">Coagulation Profile</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Urgency</label>
                          <select
                            {...register(`labOrders.${index}.urgency` as const)}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="form-label text-xs">Instructions</label>
                        <textarea
                          {...register(`labOrders.${index}.instructions` as const)}
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder="Special instructions for this test"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Radiology Orders */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Scan className="h-4 w-4 mr-1.5 text-secondary-500" />
                  Radiology Orders
                </h3>
                <button
                  type="button"
                  onClick={addRadiologyOrder}
                  className="btn btn-sm btn-outline py-1 px-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Scan
                </button>
              </div>
              
              {radiologyOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No radiology scans ordered
                </div>
              ) : (
                <div className="space-y-3">
                  {radiologyOrders.map((_, index) => (
                    <div key={index} className="border rounded-lg p-3 relative">
                      <button
                        type="button"
                        onClick={() => removeRadiologyOrder(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="form-label text-xs required">Scan Type</label>
                          <select
                            {...register(`radiologyOrders.${index}.scanType` as const, { required: true })}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="">Select Scan Type</option>
                            <option value="X-Ray">X-Ray</option>
                            <option value="CT Scan">CT Scan</option>
                            <option value="MRI">MRI</option>
                            <option value="Ultrasound">Ultrasound</option>
                            <option value="Mammogram">Mammogram</option>
                            <option value="PET Scan">PET Scan</option>
                            <option value="DEXA Scan">DEXA Scan</option>
                            <option value="Fluoroscopy">Fluoroscopy</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label text-xs required">Body Part</label>
                          <input
                            type="text"
                            {...register(`radiologyOrders.${index}.bodyPart` as const, { required: true })}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., Chest, Abdomen, Left Knee"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label text-xs">Instructions</label>
                          <textarea
                            {...register(`radiologyOrders.${index}.instructions` as const)}
                            className="form-input py-1.5 text-sm"
                            rows={2}
                            placeholder="Special instructions for this scan"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Urgency</label>
                          <select
                            {...register(`radiologyOrders.${index}.urgency` as const)}
                            className="form-input py-1.5 text-sm"
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
            
            {/* Referrals */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-1.5 text-accent-500" />
                  Referrals
                </h3>
                <button
                  type="button"
                  onClick={addReferral}
                  className="btn btn-sm btn-outline py-1 px-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Referral
                </button>
              </div>
              
              {referrals.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No referrals added
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((_, index) => (
                    <div key={index} className="border rounded-lg p-3 relative">
                      <button
                        type="button"
                        onClick={() => removeReferral(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="form-label text-xs required">Specialty/Department</label>
                          <select
                            {...register(`referrals.${index}.specialtyDepartment` as const, { required: true })}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="">Select Specialty</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                            <option value="Cardiology">Cardiology</option>
                            <option value="Neurology">Neurology</option>
                            <option value="Orthopedics">Orthopedics</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="Ophthalmology">Ophthalmology</option>
                            <option value="ENT">ENT</option>
                            <option value="Psychiatry">Psychiatry</option>
                            <option value="Urology">Urology</option>
                            <option value="Gastroenterology">Gastroenterology</option>
                            <option value="Endocrinology">Endocrinology</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Urgency</label>
                          <select
                            {...register(`referrals.${index}.urgency` as const)}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="form-label text-xs required">Reason for Referral</label>
                        <textarea
                          {...register(`referrals.${index}.reason` as const, { required: true })}
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder="Reason for referral"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Pill className="h-4 w-4 mr-1.5 text-primary-500" />
                Prescriptions
              </h3>
              <button
                type="button"
                onClick={addPrescription}
                className="btn btn-sm btn-outline py-1 px-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Medication
              </button>
            </div>
            
            {prescriptions.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No medications prescribed
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((_, index) => (
                  <div key={index} className="border rounded-lg p-3 relative">
                    <button
                      type="button"
                      onClick={() => removePrescription(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="form-label text-xs required">Medication</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.medication` as const, { required: true })}
                          className="form-input py-1.5 text-sm"
                          placeholder="Medication name"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs required">Dosage</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.dosage` as const, { required: true })}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="form-label text-xs required">Frequency</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.frequency` as const, { required: true })}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label text-xs required">Duration</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.duration` as const, { required: true })}
                          className="form-input py-1.5 text-sm"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="form-label text-xs">Instructions</label>
                      <textarea
                        {...register(`prescriptions.${index}.instructions` as const)}
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Special instructions (e.g., take with food)"
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
          <div className="space-y-3">
            {/* Department Selection */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <label className="form-label text-xs required">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="form-input py-1.5 text-sm"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            {/* Follow-up and Notes */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="mb-3">
                <label className="form-label text-xs">Follow-up Instructions</label>
                <textarea
                  {...register('followUp')}
                  className="form-input py-1.5 text-sm"
                  rows={2}
                  placeholder="Follow-up instructions for the patient"
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-input py-1.5 text-sm"
                  rows={3}
                  placeholder="Any additional notes or comments"
                />
              </div>
            </div>
            
            {/* Medical Certificate */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center mb-3">
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
                    min="1"
                    {...register('medicalCertificateDays')}
                    className="form-input py-1.5 text-sm w-24"
                    placeholder="Days"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
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