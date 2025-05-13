import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { FileText, Plus, Trash2, User, Search, X, Pill, AlertTriangle, Activity, Heart, Thermometer, Settings as Lungs, Droplets, Clock, Scale, Ruler, Calculator, Brain, FileBarChart2, AlertCircle } from 'lucide-react';

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
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnostics' | 'medications' | 'notes'>('assessment');
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<any[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customMedication, setCustomMedication] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [vitals, setVitals] = useState<any>(null);
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue, watch } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [],
      labTests: [],
      radiologyTests: [],
      medicalCertificate: false
    }
  });

  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');

  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchVitals();
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
        message: 'Failed to load patient information',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVitals = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockVitals = {
        temperature: 37.2,
        heart_rate: 72,
        respiratory_rate: 16,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        oxygen_saturation: 98,
        weight: 70,
        height: 175,
        bmi: 22.9,
        pain_level: 0,
        recorded_at: new Date().toISOString()
      };
      
      setVitals(mockVitals);
    } catch (error) {
      console.error('Error loading vitals:', error);
    }
  };

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (!hospital || !user || !patient) throw new Error('Missing required data');

      setIsSaving(true);

      // Use selected medications for prescriptions
      data.prescriptions = selectedMedications;

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
      } else if (data.prescriptions.length > 0) {
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
      if (data.prescriptions.length > 0) {
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
        message: 'Consultation completed successfully',
        type: 'success'
      });

      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation:', error.message);
      addNotification({
        message: `Error: ${error.message}`,
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
  };

  const removeLabTest = (index: number) => {
    const currentTests = watch('labTests');
    setValue('labTests', currentTests.filter((_, i) => i !== index));
  };

  const removeRadiologyTest = (index: number) => {
    const currentTests = watch('radiologyTests');
    setValue('radiologyTests', currentTests.filter((_, i) => i !== index));
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

  // Handle medication search
  const handleMedicationSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    // Mock medication database
    const medications = [
      { id: 1, name: 'Amoxicillin', dosages: ['250mg', '500mg'] },
      { id: 2, name: 'Paracetamol', dosages: ['500mg', '1g'] },
      { id: 3, name: 'Ibuprofen', dosages: ['200mg', '400mg'] },
      { id: 4, name: 'Omeprazole', dosages: ['20mg', '40mg'] },
      { id: 5, name: 'Atorvastatin', dosages: ['10mg', '20mg', '40mg'] },
      { id: 6, name: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
      { id: 7, name: 'Amlodipine', dosages: ['5mg', '10mg'] },
      { id: 8, name: 'Lisinopril', dosages: ['5mg', '10mg', '20mg'] },
      { id: 9, name: 'Simvastatin', dosages: ['10mg', '20mg', '40mg'] },
      { id: 10, name: 'Aspirin', dosages: ['75mg', '81mg', '325mg'] }
    ];

    const results = medications.filter(med => 
      med.name.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  // Add medication to prescription
  const addMedication = (medication: any, dosage: string) => {
    const newMedication = {
      medication: medication.name,
      dosage: dosage,
      frequency: '',
      duration: '',
      instructions: ''
    };
    
    setSelectedMedications([...selectedMedications, newMedication]);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Add custom medication
  const addCustomMedication = () => {
    if (customMedication.medication && customMedication.dosage) {
      setSelectedMedications([...selectedMedications, {...customMedication}]);
      setCustomMedication({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
      setShowCustomForm(false);
    }
  };

  // Remove medication from prescription
  const removeMedication = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  // Update medication details
  const updateMedication = (index: number, field: string, value: string) => {
    const updatedMedications = [...selectedMedications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setSelectedMedications(updatedMedications);
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

        {/* Vitals and Medical History Section */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Side - Vitals and Medical History */}
          <div className="w-full md:w-1/3 space-y-4">
            {/* Vital Signs Card */}
            {vitals && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">Temp:</span>
                    <span className="font-medium">{vitals.temperature}°C</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">HR:</span>
                    <span className="font-medium">{vitals.heart_rate} bpm</span>
                  </div>
                  <div className="flex items-center">
                    <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">RR:</span>
                    <span className="font-medium">{vitals.respiratory_rate} br/min</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">BP:</span>
                    <span className="font-medium">{vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">O₂:</span>
                    <span className="font-medium">{vitals.oxygen_saturation}%</span>
                  </div>
                  <div className="flex items-center">
                    <Calculator className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">BMI:</span>
                    <span className="font-medium">{vitals.bmi}</span>
                  </div>
                  <div className="flex items-center">
                    <Scale className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">Weight:</span>
                    <span className="font-medium">{vitals.weight} kg</span>
                  </div>
                  <div className="flex items-center">
                    <Ruler className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-gray-500 mr-1">Height:</span>
                    <span className="font-medium">{vitals.height} cm</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Recorded: {new Date(vitals.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            )}

            {/* Medical History Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <FileBarChart2 className="h-4 w-4 text-primary-500 mr-1.5" />
                Medical History
              </h3>
              
              {/* Allergies */}
              {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <AlertCircle className="h-3 w-3 text-error-500 mr-1" />
                    Allergies
                  </h4>
                  <ul className="text-sm space-y-1">
                    {patient.medical_history.allergies.map((allergy: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          allergy.severity === 'severe' ? 'bg-error-100 text-error-800' : 'bg-warning-100 text-warning-800'
                        } mr-1`}>
                          {allergy.severity}
                        </span>
                        <span>{allergy.allergen} - {allergy.reaction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Chronic Conditions */}
              {patient.medical_history?.chronicConditions && patient.medical_history.chronicConditions.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Chronic Conditions</h4>
                  <ul className="text-sm">
                    {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning-500 mr-1.5"></div>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Current Medications */}
              {patient.medical_history?.currentMedications && patient.medical_history.currentMedications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Pill className="h-3 w-3 text-primary-500 mr-1" />
                    Current Medications
                  </h4>
                  <ul className="text-sm">
                    {patient.medical_history.currentMedications.map((med: any, index: number) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5"></div>
                        {med.name} {med.dosage && `- ${med.dosage}`} {med.frequency && `(${med.frequency})`}
                      </li>
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

          {/* Right Side - Main Content */}
          <div className="w-full md:w-2/3">
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

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">Patient History</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">History of Presenting Illness</h4>
                    <textarea
                      rows={3}
                      className="form-input text-sm"
                      placeholder="Enter details about the history of presenting illness..."
                    />
                    
                    {patient.gender === 'Female' && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Gynecological/Obstetric History</h4>
                        <textarea
                          rows={2}
                          className="form-input text-sm"
                          placeholder="Enter gynecological or obstetric history if applicable..."
                        />
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Past Medical and Surgical History</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter past medical and surgical history..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">Family and Socioeconomic History</h3>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Enter family history and socioeconomic information..."
                  />
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">General Examination</h3>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Enter general examination findings..."
                  />
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">Systemic Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Cardiovascular System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter cardiovascular findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Respiratory System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter respiratory findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Gastrointestinal System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter gastrointestinal findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Central Nervous System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter neurological findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Musculoskeletal</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter musculoskeletal findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Other Systems/Examination</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter other examination findings..."
                      />
                    </div>
                  </div>
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
                <h2 className="text-xl font-semibold text-gray-900">Medications</h2>
                
                {/* Search and Add Custom Button */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleMedicationSearch(e.target.value)}
                      className="form-input pl-10 w-full"
                      placeholder="Search medications..."
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setSearchResults([]);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(true)}
                    className="btn btn-primary inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom
                  </button>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-white border rounded-md shadow-sm max-h-60 overflow-y-auto">
                    {searchResults.map((medication) => (
                      <div key={medication.id} className="p-2 hover:bg-gray-50 border-b last:border-b-0">
                        <div className="font-medium">{medication.name}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {medication.dosages.map((dosage: string) => (
                            <button
                              key={dosage}
                              type="button"
                              onClick={() => addMedication(medication, dosage)}
                              className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100"
                            >
                              {dosage}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Custom Medication Form */}
                {showCustomForm && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-900">Add Custom Medication</h3>
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label text-sm">Medication Name</label>
                        <input
                          type="text"
                          value={customMedication.medication}
                          onChange={(e) => setCustomMedication({...customMedication, medication: e.target.value})}
                          className="form-input"
                          placeholder="Enter medication name"
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Dosage</label>
                        <input
                          type="text"
                          value={customMedication.dosage}
                          onChange={(e) => setCustomMedication({...customMedication, dosage: e.target.value})}
                          className="form-input"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Frequency</label>
                        <input
                          type="text"
                          value={customMedication.frequency}
                          onChange={(e) => setCustomMedication({...customMedication, frequency: e.target.value})}
                          className="form-input"
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Duration</label>
                        <input
                          type="text"
                          value={customMedication.duration}
                          onChange={(e) => setCustomMedication({...customMedication, duration: e.target.value})}
                          className="form-input"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label text-sm">Instructions</label>
                        <textarea
                          value={customMedication.instructions}
                          onChange={(e) => setCustomMedication({...customMedication, instructions: e.target.value})}
                          className="form-input"
                          rows={2}
                          placeholder="Special instructions"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={addCustomMedication}
                        disabled={!customMedication.medication || !customMedication.dosage}
                        className="btn btn-primary"
                      >
                        Add Medication
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Selected Medications */}
                {selectedMedications.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900">Prescribed Medications</h3>
                    {selectedMedications.map((medication, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Pill className="h-4 w-4 text-primary-500 mr-2" />
                              <h4 className="font-medium text-gray-900">{medication.medication} - {medication.dosage}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              <div>
                                <label className="form-label text-xs">Frequency</label>
                                <input
                                  type="text"
                                  value={medication.frequency}
                                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                  className="form-input py-1"
                                  placeholder="e.g., Twice daily"
                                />
                              </div>
                              <div>
                                <label className="form-label text-xs">Duration</label>
                                <input
                                  type="text"
                                  value={medication.duration}
                                  onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                  className="form-input py-1"
                                  placeholder="e.g., 7 days"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="form-label text-xs">Instructions</label>
                                <textarea
                                  value={medication.instructions}
                                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                  className="form-input py-1"
                                  rows={2}
                                  placeholder="Special instructions"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-error-600 hover:text-error-900 ml-2"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 text-gray-300 mb-4">
                      <Pill className="h-16 w-16" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No medications prescribed yet</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Search above or click Add Custom to prescribe medications
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(true)}
                      className="btn btn-outline"
                    >
                      Skip prescribing medications
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

            <div className="flex justify-end space-x-4 mt-4">
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
          </div>
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