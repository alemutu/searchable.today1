import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { FileText, Plus, Trash2, User, ChevronDown, ChevronRight, Heart, Thermometer, Lungs, Droplets, Activity, Search } from 'lucide-react';

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
  labTests: {
    testName: string;
    price: number;
    priority: string;
    notes: string;
  }[];
  radiologyTests: {
    testName: string;
    price: number;
    priority: string;
    notes: string;
  }[];
  patientHistory: {
    historyOfPresentingIllness: string;
    gynecologicalHistory: string;
    pastMedicalSurgicalHistory: string;
  };
  familySocioeconomicHistory: string;
  generalExamination: string;
  systemicExamination: {
    cardiovascular: string;
    respiratory: string;
    gastrointestinal: string;
    centralNervous: string;
    musculoskeletal: string;
    other: string;
  };
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [prescriptionCount, setPrescriptionCount] = useState(1);
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnostics' | 'medications' | 'notes'>('assessment');
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    patientHistory: true,
    familySocioeconomicHistory: false,
    generalExamination: false,
    systemicExamination: false
  });
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue, watch } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      labTests: [],
      radiologyTests: [],
      medicalCertificate: false,
      patientHistory: {
        historyOfPresentingIllness: '',
        gynecologicalHistory: '',
        pastMedicalSurgicalHistory: ''
      },
      familySocioeconomicHistory: '',
      generalExamination: '',
      systemicExamination: {
        cardiovascular: '',
        respiratory: '',
        gastrointestinal: '',
        centralNervous: '',
        musculoskeletal: '',
        other: ''
      }
    }
  });

  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');
  const prescriptions = watch('prescriptions');

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockPatient = {
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
        message: 'Error loading patient data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (!hospital || !user || !patient) throw new Error('Missing required data');

      setIsSaving(true);

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
          department_id: user.department_id
        });

      if (consultationError) throw consultationError;

      // Determine the next flow step based on ordered tests and prescriptions
      let nextFlowStep = 'post_consultation';
      
      if (data.labTests.length > 0) {
        nextFlowStep = 'lab_tests';
      } else if (data.radiologyTests.length > 0) {
        nextFlowStep = 'radiology';
      } else if (data.prescriptions.some(p => p.medication)) {
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

      // If lab tests were ordered, create lab orders
      if (data.labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(data.labTests.map(test => ({
            patient_id: patientId,
            hospital_id: hospital.id,
            test_type: test.testName,
            test_date: new Date().toISOString(),
            status: 'pending',
            is_emergency: test.priority === 'urgent',
            notes: test.notes
          })));

        if (labError) throw labError;
      }

      // If radiology tests were ordered, create radiology orders
      if (data.radiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(data.radiologyTests.map(test => ({
            patient_id: patientId,
            hospital_id: hospital.id,
            scan_type: test.testName,
            scan_date: new Date().toISOString(),
            status: 'pending',
            is_emergency: test.priority === 'urgent',
            notes: test.notes
          })));

        if (radiologyError) throw radiologyError;
      }

      // If prescriptions were added, create pharmacy order
      if (data.prescriptions.some(p => p.medication)) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            medications: data.prescriptions.filter(p => p.medication).map(p => ({
              ...p,
              quantity: 1,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: false
          });

        if (pharmacyError) throw pharmacyError;
      }

      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });

      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation:', error.message);
      addNotification({
        message: `Error saving consultation: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Available lab tests with prices
  const availableLabTests = [
    { category: 'Hematology', tests: [
      { name: 'Complete Blood Count (CBC)', price: 1200 },
      { name: 'Hemoglobin A1c', price: 1500 },
      { name: 'Blood Type & Rh Factor', price: 800 }
    ]},
    { category: 'Clinical Chemistry', tests: [
      { name: 'Liver Function Test', price: 1500 },
      { name: 'Lipid Profile', price: 1200 },
      { name: 'Kidney Function Test', price: 1500 },
      { name: 'Electrolytes Panel', price: 1000 }
    ]},
    { category: 'Microbiology', tests: [
      { name: 'Urine Culture', price: 1800 },
      { name: 'Stool Analysis', price: 1500 },
      { name: 'Throat Swab Culture', price: 1800 }
    ]},
    { category: 'Serology', tests: [
      { name: 'HIV Test', price: 2000 },
      { name: 'Hepatitis Panel', price: 2500 },
      { name: 'COVID-19 Antibody Test', price: 3000 }
    ]}
  ];

  // Available radiology tests with prices
  const availableRadiologyTests = [
    { category: 'X-Ray', tests: [
      { name: 'Chest X-Ray', price: 2000 },
      { name: 'Abdominal X-Ray', price: 2000 },
      { name: 'Bone X-Ray', price: 1800 }
    ]},
    { category: 'Ultrasound', tests: [
      { name: 'Abdominal Ultrasound', price: 3500 },
      { name: 'Pelvic Ultrasound', price: 3500 },
      { name: 'Thyroid Ultrasound', price: 3000 }
    ]},
    { category: 'CT Scan', tests: [
      { name: 'CT Scan - Head', price: 8000 },
      { name: 'CT Scan - Chest', price: 8500 },
      { name: 'CT Scan - Abdomen', price: 9000 }
    ]},
    { category: 'MRI', tests: [
      { name: 'MRI - Brain', price: 12000 },
      { name: 'MRI - Spine', price: 15000 },
      { name: 'MRI - Knee', price: 10000 }
    ]}
  ];

  // Available medications
  const availableMedications = [
    { name: 'Amoxicillin', category: 'Antibiotic', dosages: ['250mg', '500mg'] },
    { name: 'Paracetamol', category: 'Analgesic', dosages: ['500mg', '1g'] },
    { name: 'Ibuprofen', category: 'NSAID', dosages: ['200mg', '400mg', '600mg'] },
    { name: 'Omeprazole', category: 'PPI', dosages: ['20mg', '40mg'] },
    { name: 'Metformin', category: 'Antidiabetic', dosages: ['500mg', '850mg', '1000mg'] },
    { name: 'Atorvastatin', category: 'Statin', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Lisinopril', category: 'ACE Inhibitor', dosages: ['5mg', '10mg', '20mg'] },
    { name: 'Amlodipine', category: 'Calcium Channel Blocker', dosages: ['5mg', '10mg'] },
    { name: 'Metoprolol', category: 'Beta Blocker', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Loratadine', category: 'Antihistamine', dosages: ['10mg'] }
  ];

  // Frequency options
  const frequencyOptions = [
    { value: 'Once daily', label: 'Once daily' },
    { value: 'Twice daily', label: 'Twice daily' },
    { value: 'Three times daily', label: 'Three times daily' },
    { value: 'Four times daily', label: 'Four times daily' },
    { value: 'Every morning', label: 'Every morning' },
    { value: 'Every night', label: 'Every night' },
    { value: 'Every 4 hours', label: 'Every 4 hours' },
    { value: 'Every 6 hours', label: 'Every 6 hours' },
    { value: 'Every 8 hours', label: 'Every 8 hours' },
    { value: 'Every 12 hours', label: 'Every 12 hours' },
    { value: 'As needed', label: 'As needed (PRN)' },
    { value: 'Weekly', label: 'Weekly' }
  ];

  // Duration options
  const durationOptions = [
    { value: '3 days', label: '3 days' },
    { value: '5 days', label: '5 days' },
    { value: '7 days', label: '7 days' },
    { value: '10 days', label: '10 days' },
    { value: '14 days', label: '14 days' },
    { value: '1 month', label: '1 month' },
    { value: '2 months', label: '2 months' },
    { value: '3 months', label: '3 months' },
    { value: '6 months', label: '6 months' },
    { value: 'Long term', label: 'Long term' }
  ];

  const addLabTest = (test: { name: string, price: number }) => {
    const currentTests = watch('labTests') || [];
    setValue('labTests', [
      ...currentTests,
      {
        testName: test.name,
        price: test.price,
        priority: 'normal',
        notes: ''
      }
    ]);
    setShowLabTestModal(false);
    
    addNotification({
      message: `${test.name} added to lab tests`,
      type: 'success',
      duration: 2000
    });
  };

  const addRadiologyTest = (test: { name: string, price: number }) => {
    const currentTests = watch('radiologyTests') || [];
    setValue('radiologyTests', [
      ...currentTests,
      {
        testName: test.name,
        price: test.price,
        priority: 'normal',
        notes: ''
      }
    ]);
    setShowRadiologyModal(false);
    
    addNotification({
      message: `${test.name} added to radiology tests`,
      type: 'success',
      duration: 2000
    });
  };

  const removeLabTest = (index: number) => {
    const currentTests = watch('labTests');
    setValue('labTests', currentTests.filter((_, i) => i !== index));
    
    addNotification({
      message: 'Lab test removed',
      type: 'info',
      duration: 2000
    });
  };

  const removeRadiologyTest = (index: number) => {
    const currentTests = watch('radiologyTests');
    setValue('radiologyTests', currentTests.filter((_, i) => i !== index));
    
    addNotification({
      message: 'Radiology test removed',
      type: 'info',
      duration: 2000
    });
  };

  const updateLabTestPriority = (index: number, priority: string) => {
    const currentTests = watch('labTests');
    const updatedTests = [...currentTests];
    updatedTests[index].priority = priority;
    setValue('labTests', updatedTests);
  };

  const updateRadiologyTestPriority = (index: number, priority: string) => {
    const currentTests = watch('radiologyTests');
    const updatedTests = [...currentTests];
    updatedTests[index].priority = priority;
    setValue('radiologyTests', updatedTests);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredMedications = medicationSearch
    ? availableMedications.filter(med => 
        med.name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
        med.category.toLowerCase().includes(medicationSearch.toLowerCase())
      )
    : [];

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <span>{new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years • {patient.gender}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar - Vital Signs and Medical History */}
          <div className="w-full md:w-1/4 space-y-4">
            {/* Vital Signs */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Vital Signs</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-error-500 mr-2" />
                    <span className="text-sm">BP</span>
                  </div>
                  <span className="text-sm font-medium">120/80 mmHg</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-primary-500 mr-2" />
                    <span className="text-sm">Pulse</span>
                  </div>
                  <span className="text-sm font-medium">72 bpm</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 text-warning-500 mr-2" />
                    <span className="text-sm">Temp</span>
                  </div>
                  <span className="text-sm font-medium">37.2°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 text-secondary-500 mr-2" />
                    <span className="text-sm">SpO2</span>
                  </div>
                  <span className="text-sm font-medium">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Lungs className="h-4 w-4 text-success-500 mr-2" />
                    <span className="text-sm">Resp</span>
                  </div>
                  <span className="text-sm font-medium">16/min</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                Recorded: {new Date().toLocaleString()}
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Medical History</h3>
              
              {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-error-600 flex items-center">
                    <span className="inline-block w-2 h-2 bg-error-500 rounded-full mr-2"></span>
                    Allergies
                  </h4>
                  <ul className="mt-1 pl-4 text-sm">
                    {patient.medical_history.allergies.map((allergy: any, index: number) => (
                      <li key={index} className="text-gray-700">{allergy.allergen} - {allergy.reaction}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_history?.chronicConditions && patient.medical_history.chronicConditions.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-warning-600 flex items-center">
                    <span className="inline-block w-2 h-2 bg-warning-500 rounded-full mr-2"></span>
                    Chronic Conditions
                  </h4>
                  <ul className="mt-1 pl-4 text-sm">
                    {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                      <li key={index} className="text-gray-700">{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_history?.currentMedications && patient.medical_history.currentMedications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-primary-600 flex items-center">
                    <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                    Current Medications
                  </h4>
                  <ul className="mt-1 pl-4 text-sm">
                    {patient.medical_history.currentMedications.map((med: any, index: number) => (
                      <li key={index} className="text-gray-700">{med.name} {med.dosage}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(!patient.medical_history?.allergies || patient.medical_history.allergies.length === 0) &&
               (!patient.medical_history?.chronicConditions || patient.medical_history.chronicConditions.length === 0) &&
               (!patient.medical_history?.currentMedications || patient.medical_history.currentMedications.length === 0) && (
                <p className="text-sm text-gray-500 italic">No medical history recorded</p>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full md:w-3/4">
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
                  Assessment
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'diagnostics'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('diagnostics')}
                >
                  Diagnostic Tests
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'medications'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('medications')}
                >
                  Medications
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
                  Notes
                </button>
              </div>
            </div>

            {/* Assessment Tab */}
            {activeTab === 'assessment' && (
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Patient Assessment</h2>
                
                <div>
                  <label htmlFor="chiefComplaint" className="form-label">Chief Complaint</label>
                  <textarea
                    id="chiefComplaint"
                    rows={3}
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    className="form-input"
                    placeholder="Patient's main complaint"
                  />
                  {errors.chiefComplaint && (
                    <p className="form-error">{errors.chiefComplaint.message}</p>
                  )}
                </div>

                {/* 1. Patient History (Collapsible) */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection('patientHistory')}
                  >
                    <h3 className="text-md font-medium text-gray-900">Patient History</h3>
                    {expandedSections.patientHistory ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                  </div>
                  
                  {expandedSections.patientHistory && (
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">History of Presenting Illness</h4>
                        <textarea
                          rows={3}
                          className="form-input text-sm"
                          placeholder="Enter details about the history of presenting illness..."
                          {...register('patientHistory.historyOfPresentingIllness')}
                        />
                      </div>
                      
                      {patient.gender === 'Female' && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Gynecological/Obstetric History</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter gynecological or obstetric history if applicable..."
                            {...register('patientHistory.gynecologicalHistory')}
                          />
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Past Medical and Surgical History</h4>
                        <textarea
                          rows={2}
                          className="form-input text-sm"
                          placeholder="Enter past medical and surgical history..."
                          {...register('patientHistory.pastMedicalSurgicalHistory')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Family and Socioeconomic History */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection('familySocioeconomicHistory')}
                  >
                    <h3 className="text-md font-medium text-gray-900">Family and Socioeconomic History</h3>
                    {expandedSections.familySocioeconomicHistory ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                  </div>
                  
                  {expandedSections.familySocioeconomicHistory && (
                    <div className="p-4">
                      <textarea
                        rows={3}
                        className="form-input"
                        placeholder="Enter family history and socioeconomic information..."
                        {...register('familySocioeconomicHistory')}
                      />
                    </div>
                  )}
                </div>

                {/* 3. General Examination */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection('generalExamination')}
                  >
                    <h3 className="text-md font-medium text-gray-900">General Examination</h3>
                    {expandedSections.generalExamination ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                  </div>
                  
                  {expandedSections.generalExamination && (
                    <div className="p-4">
                      <textarea
                        rows={3}
                        className="form-input"
                        placeholder="Enter general examination findings..."
                        {...register('generalExamination')}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Systemic Examination */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection('systemicExamination')}
                  >
                    <h3 className="text-md font-medium text-gray-900">Systemic Examination</h3>
                    {expandedSections.systemicExamination ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                  </div>
                  
                  {expandedSections.systemicExamination && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Cardiovascular System</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter cardiovascular findings..."
                            {...register('systemicExamination.cardiovascular')}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Respiratory System</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter respiratory findings..."
                            {...register('systemicExamination.respiratory')}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Gastrointestinal System</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter gastrointestinal findings..."
                            {...register('systemicExamination.gastrointestinal')}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Central Nervous System</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter neurological findings..."
                            {...register('systemicExamination.centralNervous')}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Musculoskeletal</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter musculoskeletal findings..."
                            {...register('systemicExamination.musculoskeletal')}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Other Systems/Examination</h4>
                          <textarea
                            rows={2}
                            className="form-input text-sm"
                            placeholder="Enter other examination findings..."
                            {...register('systemicExamination.other')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="diagnosis" className="form-label">Diagnosis</label>
                  <textarea
                    id="diagnosis"
                    rows={3}
                    {...register('diagnosis', { required: 'Diagnosis is required' })}
                    className="form-input"
                    placeholder="Clinical diagnosis"
                  />
                  {errors.diagnosis && (
                    <p className="form-error">{errors.diagnosis.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Diagnostic Tests Tab */}
            {activeTab === 'diagnostics' && (
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Diagnostic Tests</h2>
                
                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowLabTestModal(true)}
                      className="btn btn-primary inline-flex items-center"
                    >
                      Order Lab Tests
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRadiologyModal(true)}
                      className="btn btn-secondary inline-flex items-center"
                    >
                      Order Radiology
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {labTests.length + radiologyTests.length} test(s) ordered
                  </div>
                </div>
                
                {/* Lab Tests Section */}
                {labTests.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Laboratory Tests</h3>
                    <div className="space-y-3">
                      {labTests.map((test, index) => (
                        <div key={index} className="flex items-start justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{test.testName}</span>
                              <span className="ml-2 text-sm font-medium text-primary-600">{formatCurrency(test.price)}</span>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                test.priority === 'urgent' 
                                  ? 'bg-error-100 text-error-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {test.priority === 'urgent' ? 'Urgent' : 'Normal'}
                              </span>
                            </div>
                            {test.notes && (
                              <p className="mt-1 text-sm text-gray-600">{test.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <select 
                              className="form-input py-1 text-sm"
                              value={test.priority}
                              onChange={(e) => updateLabTestPriority(index, e.target.value)}
                            >
                              <option value="normal">Normal</option>
                              <option value="urgent">Urgent</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeLabTest(index)}
                              className="text-error-600 hover:text-error-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Radiology Tests Section */}
                {radiologyTests.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Radiology Tests</h3>
                    <div className="space-y-3">
                      {radiologyTests.map((test, index) => (
                        <div key={index} className="flex items-start justify-between p-3 border rounded-lg bg-indigo-50 border-indigo-200">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{test.testName}</span>
                              <span className="ml-2 text-sm font-medium text-primary-600">{formatCurrency(test.price)}</span>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                test.priority === 'urgent' 
                                  ? 'bg-error-100 text-error-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {test.priority === 'urgent' ? 'Urgent' : 'Normal'}
                              </span>
                            </div>
                            {test.notes && (
                              <p className="mt-1 text-sm text-gray-600">{test.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <select 
                              className="form-input py-1 text-sm"
                              value={test.priority}
                              onChange={(e) => updateRadiologyTestPriority(index, e.target.value)}
                            >
                              <option value="normal">Normal</option>
                              <option value="urgent">Urgent</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeRadiologyTest(index)}
                              className="text-error-600 hover:text-error-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {labTests.length === 0 && radiologyTests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 text-gray-300 mb-4 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No diagnostic tests ordered yet</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Order lab tests or radiology using the buttons above
                    </p>
                  </div>
                )}
                
                {/* Total Cost Summary */}
                {(labTests.length > 0 || radiologyTests.length > 0) && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-gray-900">Total Cost</h3>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(
                          labTests.reduce((sum, test) => sum + test.price, 0) +
                          radiologyTests.reduce((sum, test) => sum + test.price, 0)
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Patient will be directed to billing for payment after test ordering
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Medications Tab */}
            {activeTab === 'medications' && (
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Prescriptions</h2>
                  <button
                    type="button"
                    onClick={() => setPrescriptionCount(prev => prev + 1)}
                    className="btn btn-outline inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </button>
                </div>
                
                {/* Medication Search */}
                <div className="relative">
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
                  
                  {medicationSearch && filteredMedications.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                      {filteredMedications.map((med, idx) => (
                        <div 
                          key={idx}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            // Update the first empty medication field
                            const emptyIndex = prescriptions.findIndex(p => !p.medication);
                            if (emptyIndex >= 0) {
                              const updatedPrescriptions = [...prescriptions];
                              updatedPrescriptions[emptyIndex] = {
                                ...updatedPrescriptions[emptyIndex],
                                medication: med.name,
                                dosage: med.dosages[0]
                              };
                              setValue('prescriptions', updatedPrescriptions);
                            } else {
                              // Add a new prescription
                              setPrescriptionCount(prev => prev + 1);
                              const updatedPrescriptions = [...prescriptions, {
                                medication: med.name,
                                dosage: med.dosages[0],
                                frequency: '',
                                duration: '',
                                instructions: ''
                              }];
                              setValue('prescriptions', updatedPrescriptions);
                            }
                            setMedicationSearch('');
                            
                            addNotification({
                              message: `${med.name} added to prescription`,
                              type: 'success',
                              duration: 2000
                            });
                          }}
                        >
                          <div className="font-medium text-gray-900">{med.name}</div>
                          <div className="text-xs text-gray-500">
                            {med.category} • Available dosages: {med.dosages.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {Array.from({ length: prescriptionCount }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Medication #{index + 1}</h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPrescriptions = [...prescriptions];
                            updatedPrescriptions.splice(index, 1);
                            setValue('prescriptions', updatedPrescriptions);
                            setPrescriptionCount(prev => prev - 1);
                            
                            addNotification({
                              message: 'Medication removed',
                              type: 'info',
                              duration: 2000
                            });
                          }}
                          className="text-error-600 hover:text-error-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label">Medication Name</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.medication` as const, {
                            required: 'Medication name is required'
                          })}
                          className="form-input"
                          placeholder="Enter medication name"
                        />
                        {errors.prescriptions?.[index]?.medication && (
                          <p className="form-error text-xs">{errors.prescriptions[index]?.medication?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Dosage</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.dosage` as const, {
                            required: 'Dosage is required'
                          })}
                          className="form-input"
                          placeholder="e.g., 500mg"
                        />
                        {errors.prescriptions?.[index]?.dosage && (
                          <p className="form-error text-xs">{errors.prescriptions[index]?.dosage?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Frequency</label>
                        <select
                          {...register(`prescriptions.${index}.frequency` as const, {
                            required: 'Frequency is required'
                          })}
                          className="form-input"
                        >
                          <option value="">Select frequency</option>
                          {frequencyOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {errors.prescriptions?.[index]?.frequency && (
                          <p className="form-error text-xs">{errors.prescriptions[index]?.frequency?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Duration</label>
                        <select
                          {...register(`prescriptions.${index}.duration` as const, {
                            required: 'Duration is required'
                          })}
                          className="form-input"
                        >
                          <option value="">Select duration</option>
                          {durationOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {errors.prescriptions?.[index]?.duration && (
                          <p className="form-error text-xs">{errors.prescriptions[index]?.duration?.message}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="form-label">Special Instructions</label>
                        <textarea
                          {...register(`prescriptions.${index}.instructions` as const)}
                          className="form-input"
                          rows={2}
                          placeholder="e.g., Take with food, avoid alcohol"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {prescriptionCount === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 text-gray-300 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No medications prescribed yet</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Add medications using the button above or search for medications
                    </p>
                    <button
                      type="button"
                      onClick={() => setPrescriptionCount(1)}
                      className="btn btn-primary"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Medication
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
                
                <div>
                  <label htmlFor="treatmentPlan" className="form-label">Treatment Plan</label>
                  <textarea
                    id="treatmentPlan"
                    rows={4}
                    {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                    className="form-input"
                    placeholder="Detailed treatment plan"
                  />
                  {errors.treatmentPlan && (
                    <p className="form-error">{errors.treatmentPlan.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    id="notes"
                    rows={4}
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
                    <FileText className="h-5 w-5 mr-1" />
                    Issue Medical Certificate
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Consultation'}
          </button>
        </div>
      </form>

      {/* Lab Test Modal */}
      {showLabTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Order Laboratory Tests</h3>
              <button 
                onClick={() => setShowLabTestModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">
                  Payment required before processing. Patient will be directed to billing after test ordering.
                </p>
              </div>
            </div>
            
            <div className="flex h-[calc(90vh-8rem)]">
              {/* Categories */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CATEGORIES</h4>
                <div className="space-y-2">
                  {availableLabTests.map((category, index) => (
                    <div key={index} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <h5 className="font-medium text-gray-900">{category.category}</h5>
                      <p className="text-xs text-gray-500">
                        {category.tests.length} test{category.tests.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">PRIORITY</h4>
                <div className="space-y-2">
                  <div className="flex items-center p-2">
                    <input type="radio" id="normal" name="priority" className="h-4 w-4 text-primary-600" defaultChecked />
                    <label htmlFor="normal" className="ml-2 text-sm text-gray-700">Normal</label>
                    <p className="ml-auto text-xs text-gray-500">Standard processing time</p>
                  </div>
                  <div className="flex items-center p-2">
                    <input type="radio" id="urgent" name="priority" className="h-4 w-4 text-error-600" />
                    <label htmlFor="urgent" className="ml-2 text-sm text-gray-700">Urgent</label>
                    <p className="ml-auto text-xs text-gray-500">Expedited processing</p>
                  </div>
                </div>
              </div>
              
              {/* Test List */}
              <div className="w-2/3 overflow-y-auto p-4">
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      className="form-input pl-10 w-full"
                      placeholder="Search for laboratory tests by name or category..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available Tests</h4>
                
                {availableLabTests.map((category) => (
                  <div key={category.category} className="mb-6">
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category.category}</h5>
                    <div className="space-y-2">
                      {category.tests.map((test, testIndex) => (
                        <div 
                          key={testIndex} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer"
                          onClick={() => addLabTest(test)}
                        >
                          <div>
                            <h6 className="text-sm font-medium text-gray-900">{test.name}</h6>
                            <p className="text-xs text-gray-500">
                              {category.category} • Standard processing
                            </p>
                          </div>
                          <div className="text-sm font-medium text-primary-600">
                            {formatCurrency(test.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLabTestModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Radiology Modal */}
      {showRadiologyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Order Radiology Tests</h3>
              <button 
                onClick={() => setShowRadiologyModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 bg-indigo-50 border-b border-indigo-200">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-indigo-700">
                  Payment required before processing. Patient will be directed to billing after test ordering.
                </p>
              </div>
            </div>
            
            <div className="flex h-[calc(90vh-8rem)]">
              {/* Categories */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CATEGORIES</h4>
                <div className="space-y-2">
                  {availableRadiologyTests.map((category, index) => (
                    <div key={index} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <h5 className="font-medium text-gray-900">{category.category}</h5>
                      <p className="text-xs text-gray-500">
                        {category.tests.length} test{category.tests.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">PRIORITY</h4>
                <div className="space-y-2">
                  <div className="flex items-center p-2">
                    <input type="radio" id="normal-rad" name="priority-rad" className="h-4 w-4 text-primary-600" defaultChecked />
                    <label htmlFor="normal-rad" className="ml-2 text-sm text-gray-700">Normal</label>
                    <p className="ml-auto text-xs text-gray-500">Standard processing time</p>
                  </div>
                  <div className="flex items-center p-2">
                    <input type="radio" id="urgent-rad" name="priority-rad" className="h-4 w-4 text-error-600" />
                    <label htmlFor="urgent-rad" className="ml-2 text-sm text-gray-700">Urgent</label>
                    <p className="ml-auto text-xs text-gray-500">Expedited processing</p>
                  </div>
                </div>
              </div>
              
              {/* Test List */}
              <div className="w-2/3 overflow-y-auto p-4">
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      className="form-input pl-10 w-full"
                      placeholder="Search for radiology tests by name or category..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available Tests</h4>
                
                {availableRadiologyTests.map((category) => (
                  <div key={category.category} className="mb-6">
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category.category}</h5>
                    <div className="space-y-2">
                      {category.tests.map((test, testIndex) => (
                        <div 
                          key={testIndex} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-indigo-50 cursor-pointer"
                          onClick={() => addRadiologyTest(test)}
                        >
                          <div>
                            <h6 className="text-sm font-medium text-gray-900">{test.name}</h6>
                            <p className="text-xs text-gray-500">
                              {category.category} • Standard processing
                            </p>
                          </div>
                          <div className="text-sm font-medium text-primary-600">
                            {formatCurrency(test.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRadiologyModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;