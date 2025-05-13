import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { User, Calendar, FileText, Pill, Save, ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, CheckSquare, Search, Stethoscope, Heart, Settings as Lungs, Brain, Activity, Bone, Microscope, FileImage, DollarSign, CheckCircle, AlertTriangle, Briefcase, Home, Users, Building2 } from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  gynecologicalHistory?: string;
  pastMedicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  occupationalHistory: string;
  economicStatus: string;
  generalExamination: string;
  systemicExamination: {
    cardiovascular: string;
    respiratory: string;
    gastrointestinal: string;
    genitourinary: string;
    neurological: string;
    musculoskeletal: string;
    breast?: string;
  };
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
  diagnostics: {
    name: string;
    type: string;
    instructions: string;
    urgency: string;
    price: number;
  }[];
  summary: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_history?: any;
}

interface Department {
  id: string;
  name: string;
}

interface Medication {
  id: string;
  name: string;
  dosage_forms: string[];
  in_stock: boolean;
  quantity: number;
  price: number;
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familySocial: false,
    generalExam: false,
    systemicExam: false,
    diagnostics: true,
    prescriptions: true,
    notes: false,
    summary: false
  });
  const [medicationSearch, setMedicationSearch] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [showMedicationSearch, setShowMedicationSearch] = useState(false);
  const [selectedMedicationIndex, setSelectedMedicationIndex] = useState<number | null>(null);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      historyOfPresentingIllness: '',
      gynecologicalHistory: '',
      pastMedicalHistory: '',
      familyHistory: '',
      socialHistory: '',
      occupationalHistory: '',
      economicStatus: '',
      generalExamination: '',
      systemicExamination: {
        cardiovascular: '',
        respiratory: '',
        gastrointestinal: '',
        genitourinary: '',
        neurological: '',
        musculoskeletal: '',
        breast: ''
      },
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      prescriptions: [],
      diagnostics: [],
      summary: ''
    }
  });

  const watchPrescriptions = watch('prescriptions');
  const watchDiagnostics = watch('diagnostics');
  const watchGender = watch('gender');
  
  useEffect(() => {
    if (hospital) {
      fetchDepartments();
    }
    
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
    
    // Fetch medications for search
    fetchMedications();
  }, [hospital, patientId]);
  
  // Filter medications when search term changes
  useEffect(() => {
    if (medicationSearch.trim() === '') {
      setFilteredMedications([]);
      return;
    }
    
    const filtered = medications.filter(med => 
      med.name.toLowerCase().includes(medicationSearch.toLowerCase())
    );
    setFilteredMedications(filtered);
  }, [medicationSearch, medications]);

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
        return;
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospital?.id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };
  
  const fetchMedications = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockMedications: Medication[] = [
        {
          id: '1',
          name: 'Amoxicillin',
          dosage_forms: ['250mg capsule', '500mg capsule', '125mg/5ml suspension'],
          in_stock: true,
          quantity: 120,
          price: 5.99
        },
        {
          id: '2',
          name: 'Paracetamol',
          dosage_forms: ['500mg tablet', '250mg tablet', '120mg/5ml syrup'],
          in_stock: true,
          quantity: 200,
          price: 2.50
        },
        {
          id: '3',
          name: 'Ibuprofen',
          dosage_forms: ['200mg tablet', '400mg tablet', '100mg/5ml suspension'],
          in_stock: true,
          quantity: 150,
          price: 3.75
        },
        {
          id: '4',
          name: 'Metformin',
          dosage_forms: ['500mg tablet', '850mg tablet', '1000mg tablet'],
          in_stock: true,
          quantity: 80,
          price: 4.25
        },
        {
          id: '5',
          name: 'Atorvastatin',
          dosage_forms: ['10mg tablet', '20mg tablet', '40mg tablet'],
          in_stock: true,
          quantity: 60,
          price: 8.50
        },
        {
          id: '6',
          name: 'Aspirin',
          dosage_forms: ['75mg tablet', '300mg tablet'],
          in_stock: true,
          quantity: 100,
          price: 1.99
        },
        {
          id: '7',
          name: 'Salbutamol',
          dosage_forms: ['100mcg inhaler', '2mg tablet', '4mg tablet'],
          in_stock: false,
          quantity: 0,
          price: 12.99
        },
        {
          id: '8',
          name: 'Prednisolone',
          dosage_forms: ['5mg tablet', '25mg tablet'],
          in_stock: true,
          quantity: 45,
          price: 6.75
        },
        {
          id: '9',
          name: 'Omeprazole',
          dosage_forms: ['20mg capsule', '40mg capsule'],
          in_stock: false,
          quantity: 0,
          price: 5.25
        },
        {
          id: '10',
          name: 'Amlodipine',
          dosage_forms: ['5mg tablet', '10mg tablet'],
          in_stock: true,
          quantity: 75,
          price: 4.50
        }
      ];
      
      setMedications(mockMedications);
    } catch (error) {
      console.error('Error fetching medications:', error);
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
    const prescriptions = watch('prescriptions') || [];
    setValue('prescriptions', [
      ...prescriptions,
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removePrescription = (index: number) => {
    const prescriptions = watch('prescriptions') || [];
    setValue('prescriptions', prescriptions.filter((_, i) => i !== index));
  };
  
  const addDiagnostic = () => {
    const diagnostics = watch('diagnostics') || [];
    setValue('diagnostics', [
      ...diagnostics,
      { name: '', type: 'laboratory', instructions: '', urgency: 'routine', price: 0 }
    ]);
  };

  const removeDiagnostic = (index: number) => {
    const diagnostics = watch('diagnostics') || [];
    setValue('diagnostics', diagnostics.filter((_, i) => i !== index));
  };
  
  const handleMedicationSelect = (medication: Medication, index: number) => {
    const prescriptions = [...watchPrescriptions];
    prescriptions[index] = {
      ...prescriptions[index],
      medication: medication.name
    };
    setValue('prescriptions', prescriptions);
    setShowMedicationSearch(false);
    setMedicationSearch('');
    setSelectedMedicationIndex(null);
  };
  
  const getDiagnosticTypeOptions = () => {
    return [
      { value: 'laboratory', label: 'Laboratory Test' },
      { value: 'radiology', label: 'Radiology/Imaging' },
      { value: 'procedure', label: 'Procedure' },
      { value: 'referral', label: 'Specialist Referral' },
      { value: 'other', label: 'Other' }
    ];
  };
  
  const getDiagnosticUrgencyOptions = () => {
    return [
      { value: 'routine', label: 'Routine' },
      { value: 'urgent', label: 'Urgent' },
      { value: 'emergency', label: 'Emergency' }
    ];
  };
  
  const calculateTotalCost = () => {
    const diagnostics = watch('diagnostics') || [];
    const prescriptions = watch('prescriptions') || [];
    
    const diagnosticsCost = diagnostics.reduce((sum, item) => sum + (item.price || 0), 0);
    const prescriptionsCost = prescriptions.length * 5; // Assuming $5 per prescription
    
    return diagnosticsCost + prescriptionsCost;
  };
  
  const generateSummary = () => {
    const formData = watch();
    
    const summary = `
CONSULTATION SUMMARY

Patient: ${patient?.first_name} ${patient?.last_name}
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
${formData.chiefComplaint}

DIAGNOSIS:
${formData.diagnosis}

TREATMENT PLAN:
${formData.treatmentPlan}

DIAGNOSTICS ORDERED:
${formData.diagnostics.length > 0 
  ? formData.diagnostics.map(d => `- ${d.name} (${d.type}, ${d.urgency})`).join('\n')
  : 'None'
}

MEDICATIONS PRESCRIBED:
${formData.prescriptions.length > 0 
  ? formData.prescriptions.map(p => `- ${p.medication} ${p.dosage}, ${p.frequency} for ${p.duration}`).join('\n')
  : 'None'
}

${formData.medicalCertificate ? 'MEDICAL CERTIFICATE ISSUED' : ''}

FOLLOW-UP:
Please return for follow-up in 2 weeks or sooner if symptoms worsen.
`;
    
    setValue('summary', summary);
  };

  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/patients');
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
          prescriptions: data.prescriptions,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create pharmacy order if prescriptions exist
      if (data.prescriptions && data.prescriptions.length > 0) {
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
              quantity: 1, // Default quantity
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: data.diagnostics.some(d => d.urgency === 'emergency')
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // Create lab orders if lab tests exist
      const labTests = data.diagnostics.filter(d => d.type === 'laboratory');
      if (labTests.length > 0) {
        const labInserts = labTests.map(test => ({
          patient_id: patient.id,
          hospital_id: hospital.id,
          test_type: test.name.toLowerCase().replace(/\s+/g, '_'),
          test_date: new Date().toISOString(),
          status: 'pending',
          is_emergency: test.urgency === 'emergency'
        }));
        
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(labInserts);

        if (labError) throw labError;
      }
      
      // Create radiology orders if imaging tests exist
      const radiologyTests = data.diagnostics.filter(d => d.type === 'radiology');
      if (radiologyTests.length > 0) {
        const radiologyInserts = radiologyTests.map(test => ({
          patient_id: patient.id,
          hospital_id: hospital.id,
          scan_type: test.name.toLowerCase().replace(/\s+/g, '_'),
          scan_date: new Date().toISOString(),
          status: 'pending',
          is_emergency: test.urgency === 'emergency'
        }));
        
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(radiologyInserts);

        if (radiologyError) throw radiologyError;
      }
      
      // Create billing record
      const { error: billingError } = await supabase
        .from('billing')
        .insert({
          patient_id: patient.id,
          hospital_id: hospital.id,
          consultation_id: consultation.id,
          services: [
            {
              name: 'Consultation',
              amount: 150,
              quantity: 1
            },
            ...data.diagnostics.map(d => ({
              name: d.name,
              amount: d.price,
              quantity: 1
            }))
          ],
          total_amount: 150 + data.diagnostics.reduce((sum, d) => sum + d.price, 0),
          paid_amount: 0,
          payment_status: 'pending'
        });

      if (billingError) throw billingError;
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
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
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold shadow-sm">
                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-white">
                  {patient.first_name} {patient.last_name}
                </h2>
                <div className="flex flex-wrap items-center mt-1 text-primary-100">
                  <User className="h-4 w-4 mr-1" />
                  <span>{patient.gender}</span>
                  <span className="mx-2">•</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{calculateAge(patient.date_of_birth)} years</span>
                  
                  {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <div className="flex items-center text-error-200">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Allergies: {patient.medical_history.allergies.map((a: any) => a.allergen).join(', ')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Link to={`/patients/${patient.id}`} className="btn btn-outline bg-white/10 text-white hover:bg-white/20 border-white/20">
                View Patient Record
              </Link>
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="space-y-4">
          {/* Patient History Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('patientHistory')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 text-primary-500 mr-2" />
                Patient History
              </h3>
              {expandedSections.patientHistory ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.patientHistory && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="form-label required">Chief Complaint</label>
                  <textarea
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    className={`form-input ${errors.chiefComplaint ? 'border-error-300' : ''}`}
                    rows={2}
                    placeholder="Describe the patient's main complaint"
                  />
                  {errors.chiefComplaint && (
                    <p className="form-error">{errors.chiefComplaint.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">History of Presenting Illness</label>
                  <textarea
                    {...register('historyOfPresentingIllness')}
                    className="form-input"
                    rows={3}
                    placeholder="Detailed description of the current illness including onset, duration, and progression"
                  />
                </div>
                
                {patient.gender === 'Female' && (
                  <div>
                    <label className="form-label">Gynecological/Obstetric History</label>
                    <textarea
                      {...register('gynecologicalHistory')}
                      className="form-input"
                      rows={2}
                      placeholder="Menstrual history, pregnancies, deliveries, gynecological procedures, etc."
                    />
                  </div>
                )}
                
                <div>
                  <label className="form-label">Past Medical and Surgical History</label>
                  <textarea
                    {...register('pastMedicalHistory')}
                    className="form-input"
                    rows={2}
                    placeholder="Previous illnesses, hospitalizations, surgeries, etc."
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Family and Socioeconomic History */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('familySocial')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 text-primary-500 mr-2" />
                Family and Socioeconomic History
              </h3>
              {expandedSections.familySocial ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.familySocial && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="form-label">Family History</label>
                  <textarea
                    {...register('familyHistory')}
                    className="form-input"
                    rows={2}
                    placeholder="Family history of diseases, genetic conditions, etc."
                  />
                </div>
                
                <div>
                  <label className="form-label">Social History</label>
                  <textarea
                    {...register('socialHistory')}
                    className="form-input"
                    rows={2}
                    placeholder="Smoking, alcohol, recreational drugs, living situation, etc."
                  />
                </div>
                
                <div>
                  <label className="form-label">Occupational History</label>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <input
                      {...register('occupationalHistory')}
                      className="form-input"
                      placeholder="Current and past occupations, work environment, exposures, etc."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Economic Status</label>
                  <div className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-gray-400" />
                    <input
                      {...register('economicStatus')}
                      className="form-input"
                      placeholder="Housing, financial situation, insurance, etc."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* General Examination */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('generalExam')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Stethoscope className="h-5 w-5 text-primary-500 mr-2" />
                General Examination
              </h3>
              {expandedSections.generalExam ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.generalExam && (
              <div className="p-4">
                <textarea
                  {...register('generalExamination')}
                  className="form-input w-full"
                  rows={4}
                  placeholder="General appearance, consciousness, hydration, pallor, cyanosis, jaundice, edema, lymphadenopathy, etc."
                />
              </div>
            )}
          </div>
          
          {/* Systemic Examination */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('systemicExam')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 text-primary-500 mr-2" />
                Systemic Examination
              </h3>
              {expandedSections.systemicExam ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.systemicExam && (
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <div className="flex items-center mb-2">
                    <Heart className="h-5 w-5 text-error-500 mr-2" />
                    <label className="form-label mb-0">Cardiovascular System</label>
                  </div>
                  <textarea
                    {...register('systemicExamination.cardiovascular')}
                    className="form-input"
                    rows={2}
                    placeholder="Inspection, palpation, percussion, auscultation, heart sounds, murmurs, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <Lungs className="h-5 w-5 text-blue-500 mr-2" />
                    <label className="form-label mb-0">Respiratory System</label>
                  </div>
                  <textarea
                    {...register('systemicExamination.respiratory')}
                    className="form-input"
                    rows={2}
                    placeholder="Inspection, palpation, percussion, auscultation, breath sounds, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-5 w-5 flex items-center justify-center text-yellow-500 mr-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <label className="form-label mb-0">Gastrointestinal System</label>
                  </div>
                  <textarea
                    {...register('systemicExamination.gastrointestinal')}
                    className="form-input"
                    rows={2}
                    placeholder="Inspection, palpation, percussion, auscultation, abdominal tenderness, organomegaly, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-5 w-5 flex items-center justify-center text-green-500 mr-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4" />
                        <path d="M9 7h6v10H9z" />
                      </svg>
                    </div>
                    <label className="form-label mb-0">Genitourinary System</label>
                  </div>
                  <textarea
                    {...register('systemicExamination.genitourinary')}
                    className="form-input"
                    rows={2}
                    placeholder="External genitalia, urinary symptoms, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 text-purple-500 mr-2" />
                    <label className="form-label mb-0">Neurological System</label>
                  </div>
                  <textarea
                    {...register('systemicExamination.neurological')}
                    className="form-input"
                    rows={2}
                    placeholder="Mental status, cranial nerves, motor system, sensory system, reflexes, etc."
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <Bone className="h-5 w-5 text-gray-500 mr-2" />
                    <label className="form-label mb-0">Musculoskeletal System</label>
                  </div>
                  <textarea
                    {...register('systemicExamination.musculoskeletal')}
                    className="form-input"
                    rows={2}
                    placeholder="Joints, muscles, bones, gait, deformities, etc."
                  />
                </div>
                
                {patient.gender === 'Female' && (
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="h-5 w-5 flex items-center justify-center text-pink-500 mr-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <label className="form-label mb-0">Breast Examination</label>
                    </div>
                    <textarea
                      {...register('systemicExamination.breast')}
                      className="form-input"
                      rows={2}
                      placeholder="Inspection, palpation, lymph nodes, etc."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Diagnostics Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('diagnostics')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Microscope className="h-5 w-5 text-primary-500 mr-2" />
                Diagnostics
              </h3>
              {expandedSections.diagnostics ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.diagnostics && (
              <div className="p-4">
                <div className="space-y-4">
                  {watchDiagnostics.map((diagnostic, index) => (
                    <div key={index} className="p-4 border rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => removeDiagnostic(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label required">Test/Procedure Name</label>
                          <input
                            {...register(`diagnostics.${index}.name` as const, { required: true })}
                            className="form-input"
                            placeholder="e.g., Complete Blood Count, Chest X-Ray"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label required">Type</label>
                          <select
                            {...register(`diagnostics.${index}.type` as const, { required: true })}
                            className="form-input"
                          >
                            {getDiagnosticTypeOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label">Instructions</label>
                          <textarea
                            {...register(`diagnostics.${index}.instructions` as const)}
                            className="form-input"
                            rows={2}
                            placeholder="Special instructions for this diagnostic"
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="form-label">Urgency</label>
                            <select
                              {...register(`diagnostics.${index}.urgency` as const)}
                              className="form-input"
                            >
                              {getDiagnosticUrgencyOptions().map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="form-label">Price</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                {...register(`diagnostics.${index}.price` as const, { 
                                  valueAsNumber: true,
                                  min: 0
                                })}
                                className="form-input pl-10"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addDiagnostic}
                    className="btn btn-outline w-full flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Diagnostic
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Prescriptions Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('prescriptions')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Pill className="h-5 w-5 text-primary-500 mr-2" />
                Prescriptions
              </h3>
              {expandedSections.prescriptions ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.prescriptions && (
              <div className="p-4">
                <div className="space-y-4">
                  {watchPrescriptions.map((prescription, index) => (
                    <div key={index} className="p-4 border rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="form-label required">Medication</label>
                          <div className="relative">
                            <input
                              {...register(`prescriptions.${index}.medication` as const, { required: true })}
                              className="form-input pr-10"
                              placeholder="Medication name"
                              onFocus={() => {
                                setSelectedMedicationIndex(index);
                                setShowMedicationSearch(true);
                              }}
                              onChange={(e) => {
                                const prescriptions = [...watchPrescriptions];
                                prescriptions[index] = {
                                  ...prescriptions[index],
                                  medication: e.target.value
                                };
                                setValue('prescriptions', prescriptions);
                                setMedicationSearch(e.target.value);
                                setShowMedicationSearch(true);
                                setSelectedMedicationIndex(index);
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <Search className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          
                          {showMedicationSearch && selectedMedicationIndex === index && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                              {filteredMedications.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500">
                                  No medications found
                                </div>
                              ) : (
                                <ul>
                                  {filteredMedications.map((med) => (
                                    <li 
                                      key={med.id} 
                                      className={`p-3 hover:bg-gray-50 cursor-pointer ${!med.in_stock ? 'bg-error-50' : ''}`}
                                      onClick={() => handleMedicationSelect(med, index)}
                                    >
                                      <div className="flex justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{med.name}</p>
                                          <p className="text-xs text-gray-500">
                                            {med.dosage_forms.join(', ')}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className={`text-xs font-medium ${med.in_stock ? 'text-success-600' : 'text-error-600'}`}>
                                            {med.in_stock ? `${med.quantity} in stock` : 'Out of stock'}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatCurrency(med.price)}
                                          </p>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="form-label required">Dosage</label>
                          <input
                            {...register(`prescriptions.${index}.dosage` as const, { required: true })}
                            className="form-input"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label required">Frequency</label>
                          <input
                            {...register(`prescriptions.${index}.frequency` as const, { required: true })}
                            className="form-input"
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label required">Duration</label>
                          <input
                            {...register(`prescriptions.${index}.duration` as const, { required: true })}
                            className="form-input"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="form-label">Instructions</label>
                          <textarea
                            {...register(`prescriptions.${index}.instructions` as const)}
                            className="form-input"
                            rows={2}
                            placeholder="Special instructions for this medication"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addPrescription}
                    className="btn btn-outline w-full flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Prescription
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Diagnosis and Treatment Plan */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div>
              <label className="form-label required">Diagnosis</label>
              <textarea
                {...register('diagnosis', { required: 'Diagnosis is required' })}
                className={`form-input ${errors.diagnosis ? 'border-error-300' : ''}`}
                rows={2}
                placeholder="Enter diagnosis"
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
                placeholder="Describe the treatment plan"
              />
              {errors.treatmentPlan && (
                <p className="form-error">{errors.treatmentPlan.message}</p>
              )}
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('notes')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 text-primary-500 mr-2" />
                Notes
              </h3>
              {expandedSections.notes ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedSections.notes && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    {...register('notes')}
                    className="form-input"
                    rows={3}
                    placeholder="Any additional notes about the patient's condition or treatment"
                  />
                </div>
                
                <div className="flex items-center">
                  <Controller
                    name="medicalCertificate"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="medicalCertificate"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    )}
                  />
                  <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                    Issue Medical Certificate
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Summary Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('summary')}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 text-primary-500 mr-2" />
                Summary
              </h3>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateSummary();
                    setExpandedSections(prev => ({...prev, summary: true}));
                  }}
                  className="btn btn-sm btn-outline mr-2"
                >
                  Generate Summary
                </button>
                {expandedSections.summary ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {expandedSections.summary && (
              <div className="p-4">
                <textarea
                  {...register('summary')}
                  className="form-input font-mono"
                  rows={12}
                  placeholder="Consultation summary will appear here. Click 'Generate Summary' to create."
                />
              </div>
            )}
          </div>
          
          {/* Billing Summary */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 text-primary-500 mr-2" />
              Billing Summary
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Consultation</span>
                <span className="font-medium">{formatCurrency(150)}</span>
              </div>
              
              {watchDiagnostics.map((diagnostic, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-200">
                  <span>{diagnostic.name || 'Diagnostic test'}</span>
                  <span className="font-medium">{formatCurrency(diagnostic.price || 0)}</span>
                </div>
              ))}
              
              {watchPrescriptions.length > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span>Prescriptions ({watchPrescriptions.length})</span>
                  <span className="font-medium">{formatCurrency(watchPrescriptions.length * 5)}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 font-bold">
                <span>Total</span>
                <span>{formatCurrency(calculateTotalCost() + 150)}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Cancel
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
                  Complete Consultation
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default ConsultationForm;