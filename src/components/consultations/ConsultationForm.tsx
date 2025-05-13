import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Save, ArrowLeft, User, Calendar, FileText, Pill, Stethoscope, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp, Microscope, FileImage, Heart, Settings as Lungs, Activity, Brain, Bone, Thermometer, Droplets, Clipboard, ClipboardCheck, Briefcase, Home, DollarSign, Users, Utensils, Wine, Cigarette, Dumbbell, Bed, Eye, Ear, Skull, Stethoscope as StethoscopeIcon } from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  history: {
    presentingIllness: string;
    gynecologicalHistory: string;
    pastMedicalHistory: string;
    pastSurgicalHistory: string;
  };
  familyHistory: string;
  socialHistory: {
    occupation: string;
    economicStatus: string;
    livingConditions: string;
    dietaryHabits: string;
    alcoholConsumption: string;
    smokingStatus: string;
    physicalActivity: string;
    sleepPatterns: string;
  };
  generalExamination: string;
  systemicExamination: {
    cardiovascular: {
      inspection: string;
      palpation: string;
      percussion: string;
      auscultation: string;
    };
    respiratory: {
      inspection: string;
      palpation: string;
      percussion: string;
      auscultation: string;
    };
    gastrointestinal: {
      inspection: string;
      palpation: string;
      percussion: string;
      auscultation: string;
    };
    genitourinary: string;
    neurological: {
      mentalStatus: string;
      cranialNerves: string;
      motorSystem: string;
      sensorySystem: string;
      reflexes: string;
    };
    musculoskeletal: string;
    breast: string;
  };
  diagnosis: string;
  differentialDiagnosis: string;
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
  orders: {
    type: 'lab' | 'radiology';
    name: string;
    instructions: string;
    urgency: 'routine' | 'urgent' | 'stat';
  }[];
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'orders' | 'prescriptions' | 'notes'>('assessment');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familyAndSocial: false,
    generalExamination: false,
    systemicExamination: false
  });
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      history: {
        presentingIllness: '',
        gynecologicalHistory: '',
        pastMedicalHistory: '',
        pastSurgicalHistory: ''
      },
      familyHistory: '',
      socialHistory: {
        occupation: '',
        economicStatus: '',
        livingConditions: '',
        dietaryHabits: '',
        alcoholConsumption: '',
        smokingStatus: '',
        physicalActivity: '',
        sleepPatterns: ''
      },
      generalExamination: '',
      systemicExamination: {
        cardiovascular: {
          inspection: '',
          palpation: '',
          percussion: '',
          auscultation: ''
        },
        respiratory: {
          inspection: '',
          palpation: '',
          percussion: '',
          auscultation: ''
        },
        gastrointestinal: {
          inspection: '',
          palpation: '',
          percussion: '',
          auscultation: ''
        },
        genitourinary: '',
        neurological: {
          mentalStatus: '',
          cranialNerves: '',
          motorSystem: '',
          sensorySystem: '',
          reflexes: ''
        },
        musculoskeletal: '',
        breast: ''
      },
      diagnosis: '',
      differentialDiagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      prescriptions: [],
      orders: []
    }
  });
  
  const prescriptions = watch('prescriptions');
  const orders = watch('orders');
  const patientGender = patient?.gender;

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId, hospital]);

  const fetchPatient = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
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

  const addOrder = () => {
    setValue('orders', [
      ...orders,
      { type: 'lab', name: '', instructions: '', urgency: 'routine' }
    ]);
  };

  const removeOrder = (index: number) => {
    setValue('orders', orders.filter((_, i) => i !== index));
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
        
        navigate('/patients');
        return;
      }
      
      // Create consultation record
      const { data: consultationData, error: consultationError } = await supabase
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
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab orders if any
      if (data.orders.filter(o => o.type === 'lab').length > 0) {
        const labOrders = data.orders.filter(o => o.type === 'lab');
        
        for (const order of labOrders) {
          const { error: labError } = await supabase
            .from('lab_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: order.name.toLowerCase().replace(/\s+/g, '_'),
              test_date: new Date().toISOString(),
              status: 'pending',
              is_emergency: order.urgency === 'stat'
            });
            
          if (labError) throw labError;
        }
      }
      
      // Create radiology orders if any
      if (data.orders.filter(o => o.type === 'radiology').length > 0) {
        const radiologyOrders = data.orders.filter(o => o.type === 'radiology');
        
        for (const order of radiologyOrders) {
          const { error: radiologyError } = await supabase
            .from('radiology_results')
            .insert({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: order.name.toLowerCase().replace(/\s+/g, '_'),
              scan_date: new Date().toISOString(),
              status: 'pending',
              is_emergency: order.urgency === 'stat'
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
            is_emergency: data.orders.some(o => o.urgency === 'stat')
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: data.orders.length > 0 ? 
            (data.orders.some(o => o.type === 'lab') ? 'lab_tests' : 
             data.orders.some(o => o.type === 'radiology') ? 'radiology' : 
             'pharmacy') : 
            (data.prescriptions.length > 0 ? 'pharmacy' : 'billing')
        })
        .eq('id', patient.id);
        
      if (patientError) throw patientError;
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      navigate('/patients');
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
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold shadow-sm">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center text-primary-100 text-sm">
                <User className="h-4 w-4 mr-1" />
                <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
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
              className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                activeTab === 'orders'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <FileImage className="h-4 w-4 inline mr-1" />
              Orders
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                activeTab === 'prescriptions'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <Pill className="h-4 w-4 inline mr-1" />
              Prescriptions
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                activeTab === 'notes'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              Notes
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Assessment Tab */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              <div>
                <label className="form-label required">Chief Complaint</label>
                <textarea
                  {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                  className="form-input"
                  rows={2}
                  placeholder="Describe the patient's main complaint"
                />
                {errors.chiefComplaint && (
                  <p className="form-error">{errors.chiefComplaint.message}</p>
                )}
              </div>
              
              {/* Patient History Section - Collapsible */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className={`flex justify-between items-center p-3 cursor-pointer ${expandedSections.patientHistory ? 'bg-primary-50' : 'bg-gray-50'}`}
                  onClick={() => toggleSection('patientHistory')}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-md font-medium">Patient History</h3>
                  </div>
                  {expandedSections.patientHistory ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.patientHistory && (
                  <div className="p-4 space-y-4 border-t">
                    <div>
                      <label className="form-label">History of Presenting Illness</label>
                      <textarea
                        {...register('history.presentingIllness')}
                        className="form-input"
                        rows={3}
                        placeholder="Detailed description of the current illness including onset, duration, and progression"
                      />
                    </div>
                    
                    {patientGender === 'Female' && (
                      <div>
                        <label className="form-label">Gynecological/Obstetric History</label>
                        <textarea
                          {...register('history.gynecologicalHistory')}
                          className="form-input"
                          rows={2}
                          placeholder="Menstrual history, pregnancies, deliveries, gynecological procedures, etc."
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="form-label">Past Medical History</label>
                      <textarea
                        {...register('history.pastMedicalHistory')}
                        className="form-input"
                        rows={2}
                        placeholder="Previous diagnoses, hospitalizations, chronic conditions, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Past Surgical History</label>
                      <textarea
                        {...register('history.pastSurgicalHistory')}
                        className="form-input"
                        rows={2}
                        placeholder="Previous surgeries, procedures, etc."
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Family and Socioeconomic History Section - Collapsible */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className={`flex justify-between items-center p-3 cursor-pointer ${expandedSections.familyAndSocial ? 'bg-primary-50' : 'bg-gray-50'}`}
                  onClick={() => toggleSection('familyAndSocial')}
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-md font-medium">Family and Socioeconomic History</h3>
                  </div>
                  {expandedSections.familyAndSocial ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.familyAndSocial && (
                  <div className="p-4 space-y-4 border-t">
                    <div>
                      <label className="form-label">Family History</label>
                      <textarea
                        {...register('familyHistory')}
                        className="form-input"
                        rows={2}
                        placeholder="Family history of diseases, genetic conditions, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Occupation</label>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            {...register('socialHistory.occupation')}
                            className="form-input"
                            placeholder="Current occupation"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label">Economic Status</label>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <select
                            {...register('socialHistory.economicStatus')}
                            className="form-input"
                          >
                            <option value="">Select status</option>
                            <option value="low">Low income</option>
                            <option value="middle">Middle income</option>
                            <option value="high">High income</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Living Conditions</label>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            {...register('socialHistory.livingConditions')}
                            className="form-input"
                            placeholder="Housing situation"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label">Dietary Habits</label>
                        <div className="flex items-center">
                          <Utensils className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            {...register('socialHistory.dietaryHabits')}
                            className="form-input"
                            placeholder="Diet description"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Alcohol Consumption</label>
                        <div className="flex items-center">
                          <Wine className="h-4 w-4 text-gray-400 mr-2" />
                          <select
                            {...register('socialHistory.alcoholConsumption')}
                            className="form-input"
                          >
                            <option value="">Select option</option>
                            <option value="none">None</option>
                            <option value="occasional">Occasional</option>
                            <option value="moderate">Moderate</option>
                            <option value="heavy">Heavy</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label">Smoking Status</label>
                        <div className="flex items-center">
                          <Cigarette className="h-4 w-4 text-gray-400 mr-2" />
                          <select
                            {...register('socialHistory.smokingStatus')}
                            className="form-input"
                          >
                            <option value="">Select status</option>
                            <option value="never">Never smoker</option>
                            <option value="former">Former smoker</option>
                            <option value="current">Current smoker</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Physical Activity</label>
                        <div className="flex items-center">
                          <Dumbbell className="h-4 w-4 text-gray-400 mr-2" />
                          <select
                            {...register('socialHistory.physicalActivity')}
                            className="form-input"
                          >
                            <option value="">Select level</option>
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="vigorous">Vigorous</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label">Sleep Patterns</label>
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            {...register('socialHistory.sleepPatterns')}
                            className="form-input"
                            placeholder="Hours of sleep, quality"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* General Examination Section - Collapsible */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className={`flex justify-between items-center p-3 cursor-pointer ${expandedSections.generalExamination ? 'bg-primary-50' : 'bg-gray-50'}`}
                  onClick={() => toggleSection('generalExamination')}
                >
                  <div className="flex items-center">
                    <Clipboard className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-md font-medium">General Examination</h3>
                  </div>
                  {expandedSections.generalExamination ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.generalExamination && (
                  <div className="p-4 border-t">
                    <textarea
                      {...register('generalExamination')}
                      className="form-input"
                      rows={4}
                      placeholder="General appearance, consciousness, hydration, pallor, cyanosis, jaundice, clubbing, edema, lymphadenopathy, etc."
                    />
                  </div>
                )}
              </div>
              
              {/* Systemic Examination Section - Collapsible */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className={`flex justify-between items-center p-3 cursor-pointer ${expandedSections.systemicExamination ? 'bg-primary-50' : 'bg-gray-50'}`}
                  onClick={() => toggleSection('systemicExamination')}
                >
                  <div className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 text-primary-500 mr-2" />
                    <h3 className="text-md font-medium">Systemic Examination</h3>
                  </div>
                  {expandedSections.systemicExamination ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.systemicExamination && (
                  <div className="p-4 border-t space-y-6 max-h-[500px] overflow-y-auto">
                    {/* Cardiovascular System */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Heart className="h-4 w-4 text-error-500 mr-2" />
                        Cardiovascular System
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Inspection</label>
                          <textarea
                            {...register('systemicExamination.cardiovascular.inspection')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Visible pulsations, scars, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Palpation</label>
                          <textarea
                            {...register('systemicExamination.cardiovascular.palpation')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Apex beat, thrills, etc."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Percussion</label>
                          <textarea
                            {...register('systemicExamination.cardiovascular.percussion')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Cardiac borders, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Auscultation</label>
                          <textarea
                            {...register('systemicExamination.cardiovascular.auscultation')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Heart sounds, murmurs, etc."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Respiratory System */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Lungs className="h-4 w-4 text-blue-500 mr-2" />
                        Respiratory System
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Inspection</label>
                          <textarea
                            {...register('systemicExamination.respiratory.inspection')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Respiratory rate, pattern, chest movements, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Palpation</label>
                          <textarea
                            {...register('systemicExamination.respiratory.palpation')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Chest expansion, tactile fremitus, etc."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Percussion</label>
                          <textarea
                            {...register('systemicExamination.respiratory.percussion')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Resonance, dullness, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Auscultation</label>
                          <textarea
                            {...register('systemicExamination.respiratory.auscultation')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Breath sounds, added sounds, etc."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Gastrointestinal System */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Activity className="h-4 w-4 text-green-500 mr-2" />
                        Gastrointestinal System
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Inspection</label>
                          <textarea
                            {...register('systemicExamination.gastrointestinal.inspection')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Abdominal contour, visible peristalsis, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Palpation</label>
                          <textarea
                            {...register('systemicExamination.gastrointestinal.palpation')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Tenderness, masses, organomegaly, etc."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Percussion</label>
                          <textarea
                            {...register('systemicExamination.gastrointestinal.percussion')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Liver span, shifting dullness, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Auscultation</label>
                          <textarea
                            {...register('systemicExamination.gastrointestinal.auscultation')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Bowel sounds, bruits, etc."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Genitourinary System */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Droplets className="h-4 w-4 text-yellow-500 mr-2" />
                        Genitourinary System
                      </h4>
                      <textarea
                        {...register('systemicExamination.genitourinary')}
                        className="form-input text-sm"
                        rows={3}
                        placeholder="External genitalia, urethral meatus, etc."
                      />
                    </div>
                    
                    {/* Neurological System */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Brain className="h-4 w-4 text-purple-500 mr-2" />
                        Neurological System
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Mental Status</label>
                          <textarea
                            {...register('systemicExamination.neurological.mentalStatus')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Consciousness, orientation, memory, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Cranial Nerves</label>
                          <textarea
                            {...register('systemicExamination.neurological.cranialNerves')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Examination of cranial nerves I-XII"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label text-sm">Motor System</label>
                          <textarea
                            {...register('systemicExamination.neurological.motorSystem')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Tone, power, coordination, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Sensory System</label>
                          <textarea
                            {...register('systemicExamination.neurological.sensorySystem')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Touch, pain, temperature, etc."
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Reflexes</label>
                          <textarea
                            {...register('systemicExamination.neurological.reflexes')}
                            className="form-input text-sm"
                            rows={2}
                            placeholder="Deep tendon reflexes, plantar, etc."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Musculoskeletal System */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Bone className="h-4 w-4 text-gray-500 mr-2" />
                        Musculoskeletal System
                      </h4>
                      <textarea
                        {...register('systemicExamination.musculoskeletal')}
                        className="form-input text-sm"
                        rows={3}
                        placeholder="Joints, muscles, deformities, range of motion, etc."
                      />
                    </div>
                    
                    {/* Breast Examination */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium flex items-center">
                        <Activity className="h-4 w-4 text-pink-500 mr-2" />
                        Breast Examination
                      </h4>
                      <textarea
                        {...register('systemicExamination.breast')}
                        className="form-input text-sm"
                        rows={3}
                        placeholder="Inspection, palpation, lymph nodes, etc."
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label required">Diagnosis</label>
                <textarea
                  {...register('diagnosis', { required: 'Diagnosis is required' })}
                  className="form-input"
                  rows={2}
                  placeholder="Primary diagnosis"
                />
                {errors.diagnosis && (
                  <p className="form-error">{errors.diagnosis.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label">Differential Diagnosis</label>
                <textarea
                  {...register('differentialDiagnosis')}
                  className="form-input"
                  rows={2}
                  placeholder="Alternative diagnoses to consider"
                />
              </div>
              
              <div>
                <label className="form-label required">Treatment Plan</label>
                <textarea
                  {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                  className="form-input"
                  rows={3}
                  placeholder="Detailed treatment plan"
                />
                {errors.treatmentPlan && (
                  <p className="form-error">{errors.treatmentPlan.message}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Laboratory & Radiology Orders</h3>
                <button
                  type="button"
                  onClick={addOrder}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Order
                </button>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <FileImage className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No orders added</h3>
                  <p className="text-sm text-gray-500 mb-4">Add laboratory tests or radiology scans</p>
                  <button
                    type="button"
                    onClick={addOrder}
                    className="btn btn-primary btn-sm"
                  >
                    Add Order
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <div key={index} className="border rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={() => removeOrder(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="form-label">Order Type</label>
                          <div className="flex items-center">
                            {order.type === 'lab' ? (
                              <Microscope className="h-5 w-5 text-primary-500 mr-2" />
                            ) : (
                              <FileImage className="h-5 w-5 text-secondary-500 mr-2" />
                            )}
                            <select
                              value={order.type}
                              onChange={(e) => {
                                const newOrders = [...orders];
                                newOrders[index].type = e.target.value as 'lab' | 'radiology';
                                setValue('orders', newOrders);
                              }}
                              className="form-input"
                            >
                              <option value="lab">Laboratory Test</option>
                              <option value="radiology">Radiology Scan</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label">Urgency</label>
                          <select
                            value={order.urgency}
                            onChange={(e) => {
                              const newOrders = [...orders];
                              newOrders[index].urgency = e.target.value as 'routine' | 'urgent' | 'stat';
                              setValue('orders', newOrders);
                            }}
                            className="form-input"
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="stat">STAT (Emergency)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label">Test/Scan Name</label>
                        <input
                          type="text"
                          value={order.name}
                          onChange={(e) => {
                            const newOrders = [...orders];
                            newOrders[index].name = e.target.value;
                            setValue('orders', newOrders);
                          }}
                          className="form-input"
                          placeholder={order.type === 'lab' ? 'e.g., Complete Blood Count, Liver Function Test' : 'e.g., Chest X-Ray, CT Scan, MRI'}
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Instructions</label>
                        <textarea
                          value={order.instructions}
                          onChange={(e) => {
                            const newOrders = [...orders];
                            newOrders[index].instructions = e.target.value;
                            setValue('orders', newOrders);
                          }}
                          className="form-input"
                          rows={2}
                          placeholder="Special instructions or clinical information"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Prescriptions</h3>
                <button
                  type="button"
                  onClick={addPrescription}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </button>
              </div>
              
              {prescriptions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Pill className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No medications added</h3>
                  <p className="text-sm text-gray-500 mb-4">Add medications to the prescription</p>
                  <button
                    type="button"
                    onClick={addPrescription}
                    className="btn btn-primary btn-sm"
                  >
                    Add Medication
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((prescription, index) => (
                    <div key={index} className="border rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="form-label">Medication</label>
                          <input
                            type="text"
                            value={prescription.medication}
                            onChange={(e) => {
                              const newPrescriptions = [...prescriptions];
                              newPrescriptions[index].medication = e.target.value;
                              setValue('prescriptions', newPrescriptions);
                            }}
                            className="form-input"
                            placeholder="Medication name"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Dosage</label>
                          <input
                            type="text"
                            value={prescription.dosage}
                            onChange={(e) => {
                              const newPrescriptions = [...prescriptions];
                              newPrescriptions[index].dosage = e.target.value;
                              setValue('prescriptions', newPrescriptions);
                            }}
                            className="form-input"
                            placeholder="e.g., 500mg, 10ml"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="form-label">Frequency</label>
                          <input
                            type="text"
                            value={prescription.frequency}
                            onChange={(e) => {
                              const newPrescriptions = [...prescriptions];
                              newPrescriptions[index].frequency = e.target.value;
                              setValue('prescriptions', newPrescriptions);
                            }}
                            className="form-input"
                            placeholder="e.g., Once daily, Twice daily"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Duration</label>
                          <input
                            type="text"
                            value={prescription.duration}
                            onChange={(e) => {
                              const newPrescriptions = [...prescriptions];
                              newPrescriptions[index].duration = e.target.value;
                              setValue('prescriptions', newPrescriptions);
                            }}
                            className="form-input"
                            placeholder="e.g., 7 days, 2 weeks"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label">Instructions</label>
                        <textarea
                          value={prescription.instructions}
                          onChange={(e) => {
                            const newPrescriptions = [...prescriptions];
                            newPrescriptions[index].instructions = e.target.value;
                            setValue('prescriptions', newPrescriptions);
                          }}
                          className="form-input"
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
            <div className="space-y-4">
              <div>
                <label className="form-label">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-input"
                  rows={6}
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
                <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                  Issue medical certificate
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
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