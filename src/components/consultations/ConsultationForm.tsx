import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Stethoscope, Save, ArrowLeft, User, Calendar, FileText, Pill, CheckSquare, Brain, Activity, Thermometer, Heart, Settings as Lungs, Droplets, AlertTriangle, Search, Plus, Trash2, XCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ConsultationFormData {
  patientId: string;
  chiefComplaint: string;
  vitalSigns: {
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    oxygenSaturation: number | null;
    painLevel: number | null;
  };
  history: string;
  examination: string;
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
    quantity: number;
  }[];
  departmentId: string;
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
  medical_info: any;
  hospital_id: string;
  status: string;
  current_flow_step: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Medication {
  id: string;
  name: string;
  dosages: string[];
  frequencies: string[];
  durations: string[];
  instructions: string[];
  category: string;
  contraindications?: string[];
}

interface DiagnosisSuggestion {
  code: string;
  name: string;
  description: string;
  category: string;
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ConsultationFormData>({
    patientId: patientId || '',
    chiefComplaint: '',
    vitalSigns: {
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      oxygenSaturation: null,
      painLevel: null
    },
    history: '',
    examination: '',
    diagnosis: '',
    treatmentPlan: '',
    notes: '',
    medicalCertificate: false,
    prescriptions: [],
    departmentId: ''
  });
  
  // Medication suggestions
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  
  // Diagnosis suggestions
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<DiagnosisSuggestion[]>([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [filteredDiagnoses, setFilteredDiagnoses] = useState<DiagnosisSuggestion[]>([]);
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  
  // AI assistance
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    diagnosis: string[];
    treatment: string[];
    medications: string[];
  } | null>(null);

  useEffect(() => {
    if (hospital) {
      fetchDepartments();
      fetchMedications();
      fetchDiagnosisCodes();
    }
    
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [hospital, patientId]);
  
  useEffect(() => {
    // Filter medications based on search term
    if (medicationSearch.trim() === '') {
      setFilteredMedications([]);
    } else {
      const filtered = medications.filter(med => 
        med.name.toLowerCase().includes(medicationSearch.toLowerCase())
      );
      setFilteredMedications(filtered.slice(0, 10)); // Limit to 10 results
    }
  }, [medicationSearch, medications]);
  
  useEffect(() => {
    // Filter diagnoses based on search term
    if (diagnosisSearch.trim() === '') {
      setFilteredDiagnoses([]);
    } else {
      const filtered = diagnosisSuggestions.filter(diag => 
        diag.name.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
        diag.code.toLowerCase().includes(diagnosisSearch.toLowerCase())
      );
      setFilteredDiagnoses(filtered.slice(0, 10)); // Limit to 10 results
    }
  }, [diagnosisSearch, diagnosisSuggestions]);

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
          medical_info: {
            allergies: [
              { allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }
            ],
            chronicConditions: ['Hypertension'],
            currentMedications: [
              { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' }
            ],
            bloodType: 'O+',
            smoker: false,
            alcoholConsumption: 'occasional'
          },
          hospital_id: hospital?.id || '00000000-0000-0000-0000-000000000000',
          status: 'active',
          current_flow_step: 'consultation'
        };
        setPatient(mockPatient);
        
        // Fetch the latest vital signs
        const mockVitalSigns = {
          temperature: 37.2,
          heartRate: 72,
          respiratoryRate: 16,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 98,
          painLevel: 2
        };
        
        setFormData(prev => ({
          ...prev,
          vitalSigns: mockVitalSigns
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
      
      // Fetch the latest vital signs
      const { data: vitalSignsData, error: vitalSignsError } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!vitalSignsError && vitalSignsData) {
        setFormData(prev => ({
          ...prev,
          vitalSigns: {
            temperature: vitalSignsData.temperature,
            heartRate: vitalSignsData.heart_rate,
            respiratoryRate: vitalSignsData.respiratory_rate,
            bloodPressureSystolic: vitalSignsData.blood_pressure_systolic,
            bloodPressureDiastolic: vitalSignsData.blood_pressure_diastolic,
            oxygenSaturation: vitalSignsData.oxygen_saturation,
            painLevel: vitalSignsData.pain_level
          }
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
        
        // Set default department
        if (user?.department_id) {
          setFormData(prev => ({
            ...prev,
            departmentId: user.department_id
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            departmentId: mockDepartments[0].id
          }));
        }
        
        return;
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospital?.id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
      
      // Set default department
      if (user?.department_id) {
        setFormData(prev => ({
          ...prev,
          departmentId: user.department_id
        }));
      } else if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          departmentId: data[0].id
        }));
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };
  
  const fetchMedications = async () => {
    try {
      // In a real app, we would fetch from a database
      // For now, we'll use mock data
      const mockMedications: Medication[] = [
        {
          id: '1',
          name: 'Amoxicillin',
          dosages: ['250mg', '500mg', '875mg'],
          frequencies: ['Once daily', 'Twice daily', 'Three times daily'],
          durations: ['5 days', '7 days', '10 days', '14 days'],
          instructions: ['Take with food', 'Take on an empty stomach', 'Take with plenty of water'],
          category: 'antibiotic',
          contraindications: ['Penicillin allergy']
        },
        {
          id: '2',
          name: 'Lisinopril',
          dosages: ['5mg', '10mg', '20mg', '40mg'],
          frequencies: ['Once daily'],
          durations: ['30 days', '90 days', 'Ongoing'],
          instructions: ['Take in the morning', 'Take at the same time each day'],
          category: 'antihypertensive'
        },
        {
          id: '3',
          name: 'Atorvastatin',
          dosages: ['10mg', '20mg', '40mg', '80mg'],
          frequencies: ['Once daily'],
          durations: ['30 days', '90 days', 'Ongoing'],
          instructions: ['Take in the evening', 'Take with or without food'],
          category: 'statin'
        },
        {
          id: '4',
          name: 'Metformin',
          dosages: ['500mg', '850mg', '1000mg'],
          frequencies: ['Once daily', 'Twice daily', 'Three times daily'],
          durations: ['30 days', '90 days', 'Ongoing'],
          instructions: ['Take with meals', 'Take with food to reduce stomach upset'],
          category: 'antidiabetic'
        },
        {
          id: '5',
          name: 'Ibuprofen',
          dosages: ['200mg', '400mg', '600mg', '800mg'],
          frequencies: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed'],
          durations: ['3 days', '5 days', '7 days', '10 days', 'As needed'],
          instructions: ['Take with food', 'Do not take on an empty stomach'],
          category: 'nsaid'
        },
        {
          id: '6',
          name: 'Paracetamol',
          dosages: ['500mg', '1000mg'],
          frequencies: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed'],
          durations: ['3 days', '5 days', '7 days', 'As needed'],
          instructions: ['Take with or without food', 'Do not exceed 4000mg in 24 hours'],
          category: 'analgesic'
        },
        {
          id: '7',
          name: 'Omeprazole',
          dosages: ['10mg', '20mg', '40mg'],
          frequencies: ['Once daily', 'Twice daily'],
          durations: ['14 days', '28 days', '8 weeks', 'Ongoing'],
          instructions: ['Take before meals', 'Take in the morning'],
          category: 'ppi'
        },
        {
          id: '8',
          name: 'Amlodipine',
          dosages: ['2.5mg', '5mg', '10mg'],
          frequencies: ['Once daily'],
          durations: ['30 days', '90 days', 'Ongoing'],
          instructions: ['Take at the same time each day'],
          category: 'antihypertensive'
        },
        {
          id: '9',
          name: 'Levothyroxine',
          dosages: ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg'],
          frequencies: ['Once daily'],
          durations: ['30 days', '90 days', 'Ongoing'],
          instructions: ['Take on an empty stomach', 'Take 30-60 minutes before breakfast'],
          category: 'thyroid'
        },
        {
          id: '10',
          name: 'Sertraline',
          dosages: ['25mg', '50mg', '100mg'],
          frequencies: ['Once daily'],
          durations: ['30 days', '90 days', 'Ongoing'],
          instructions: ['Take with food', 'Take in the morning or evening'],
          category: 'ssri'
        }
      ];
      
      setMedications(mockMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };
  
  const fetchDiagnosisCodes = async () => {
    try {
      // In a real app, we would fetch from a database
      // For now, we'll use mock data
      const mockDiagnoses: DiagnosisSuggestion[] = [
        {
          code: 'I10',
          name: 'Essential (primary) hypertension',
          description: 'High blood pressure with no identifiable cause',
          category: 'cardiovascular'
        },
        {
          code: 'E11.9',
          name: 'Type 2 diabetes mellitus without complications',
          description: 'Non-insulin-dependent diabetes mellitus',
          category: 'endocrine'
        },
        {
          code: 'J45.909',
          name: 'Unspecified asthma, uncomplicated',
          description: 'Bronchial asthma NOS',
          category: 'respiratory'
        },
        {
          code: 'M54.5',
          name: 'Low back pain',
          description: 'Lumbago NOS',
          category: 'musculoskeletal'
        },
        {
          code: 'J02.9',
          name: 'Acute pharyngitis, unspecified',
          description: 'Sore throat NOS',
          category: 'respiratory'
        },
        {
          code: 'N39.0',
          name: 'Urinary tract infection, site not specified',
          description: 'UTI NOS',
          category: 'genitourinary'
        },
        {
          code: 'K21.9',
          name: 'Gastro-esophageal reflux disease without esophagitis',
          description: 'GERD',
          category: 'digestive'
        },
        {
          code: 'F41.9',
          name: 'Anxiety disorder, unspecified',
          description: 'Anxiety NOS',
          category: 'mental'
        },
        {
          code: 'F32.9',
          name: 'Major depressive disorder, single episode, unspecified',
          description: 'Depression NOS',
          category: 'mental'
        },
        {
          code: 'M25.50',
          name: 'Pain in unspecified joint',
          description: 'Joint pain NOS',
          category: 'musculoskeletal'
        },
        {
          code: 'R51',
          name: 'Headache',
          description: 'Pain in head NOS',
          category: 'neurological'
        },
        {
          code: 'J06.9',
          name: 'Acute upper respiratory infection, unspecified',
          description: 'URI NOS',
          category: 'respiratory'
        },
        {
          code: 'B34.9',
          name: 'Viral infection, unspecified',
          description: 'Viral illness NOS',
          category: 'infectious'
        },
        {
          code: 'R10.9',
          name: 'Unspecified abdominal pain',
          description: 'Abdominal pain NOS',
          category: 'digestive'
        },
        {
          code: 'H66.90',
          name: 'Otitis media, unspecified, unspecified ear',
          description: 'Ear infection NOS',
          category: 'ear'
        }
      ];
      
      setDiagnosisSuggestions(mockDiagnoses);
    } catch (error) {
      console.error('Error loading diagnosis codes:', error);
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
  
  const handleInputChange = (field: keyof ConsultationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleVitalSignChange = (field: keyof ConsultationFormData['vitalSigns'], value: number | null) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };
  
  const handleAddPrescription = () => {
    if (!selectedMedication) return;
    
    const newPrescription = {
      medication: selectedMedication.name,
      dosage: selectedMedication.dosages[0],
      frequency: selectedMedication.frequencies[0],
      duration: selectedMedication.durations[0],
      instructions: selectedMedication.instructions[0],
      quantity: 1
    };
    
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, newPrescription]
    }));
    
    setSelectedMedication(null);
    setMedicationSearch('');
    setShowMedicationDropdown(false);
  };
  
  const handleRemovePrescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };
  
  const handlePrescriptionChange = (index: number, field: keyof ConsultationFormData['prescriptions'][0], value: string | number) => {
    setFormData(prev => {
      const updatedPrescriptions = [...prev.prescriptions];
      updatedPrescriptions[index] = {
        ...updatedPrescriptions[index],
        [field]: value
      };
      return {
        ...prev,
        prescriptions: updatedPrescriptions
      };
    });
  };
  
  const handleSelectMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setMedicationSearch(medication.name);
    setShowMedicationDropdown(false);
  };
  
  const handleSelectDiagnosis = (diagnosis: DiagnosisSuggestion) => {
    setFormData(prev => ({
      ...prev,
      diagnosis: `${diagnosis.code} - ${diagnosis.name}`
    }));
    setDiagnosisSearch('');
    setShowDiagnosisDropdown(false);
  };
  
  const analyzePatientData = async () => {
    setIsAnalyzing(true);
    
    try {
      // In a real app, this would call an AI service
      // For now, we'll simulate an AI response based on the form data
      
      // Wait for a short delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock suggestions based on chief complaint and vital signs
      const chiefComplaint = formData.chiefComplaint.toLowerCase();
      const vitalSigns = formData.vitalSigns;
      
      let diagnosisSuggestions: string[] = [];
      let treatmentSuggestions: string[] = [];
      let medicationSuggestions: string[] = [];
      
      // Check for fever
      if (vitalSigns.temperature && vitalSigns.temperature > 38) {
        diagnosisSuggestions.push("Consider fever-related conditions");
        
        if (chiefComplaint.includes('cough') || chiefComplaint.includes('throat') || chiefComplaint.includes('congestion')) {
          diagnosisSuggestions.push("J06.9 - Acute upper respiratory infection");
          treatmentSuggestions.push("Rest and increased fluid intake");
          medicationSuggestions.push("Paracetamol for fever");
          medicationSuggestions.push("Consider throat lozenges for symptomatic relief");
        }
        
        if (chiefComplaint.includes('ear') || chiefComplaint.includes('hearing')) {
          diagnosisSuggestions.push("H66.90 - Otitis media");
          treatmentSuggestions.push("Keep ear dry");
          medicationSuggestions.push("Consider antibiotics if bacterial infection suspected");
        }
      }
      
      // Check for hypertension
      if (vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureDiastolic && 
          (vitalSigns.bloodPressureSystolic > 140 || vitalSigns.bloodPressureDiastolic > 90)) {
        diagnosisSuggestions.push("I10 - Essential hypertension");
        treatmentSuggestions.push("Dietary sodium restriction");
        treatmentSuggestions.push("Regular exercise regimen");
        medicationSuggestions.push("Consider antihypertensive medication");
        
        if (chiefComplaint.includes('headache') || chiefComplaint.includes('dizz')) {
          treatmentSuggestions.push("Monitor blood pressure regularly");
        }
      }
      
      // Check for tachycardia
      if (vitalSigns.heartRate && vitalSigns.heartRate > 100) {
        diagnosisSuggestions.push("Consider causes of tachycardia");
        
        if (chiefComplaint.includes('chest') || chiefComplaint.includes('heart') || chiefComplaint.includes('palpitation')) {
          diagnosisSuggestions.push("R00.0 - Tachycardia, unspecified");
          treatmentSuggestions.push("ECG monitoring");
          treatmentSuggestions.push("Cardiac evaluation");
        }
      }
      
      // Check for respiratory issues
      if (vitalSigns.respiratoryRate && vitalSigns.respiratoryRate > 20) {
        diagnosisSuggestions.push("Consider respiratory conditions");
        
        if (chiefComplaint.includes('breath') || chiefComplaint.includes('cough')) {
          if (chiefComplaint.includes('wheez') || patient?.medical_info?.chronicConditions?.includes('Asthma')) {
            diagnosisSuggestions.push("J45.909 - Unspecified asthma");
            treatmentSuggestions.push("Avoid triggers");
            medicationSuggestions.push("Consider bronchodilator");
          } else {
            diagnosisSuggestions.push("J98.9 - Respiratory disorder, unspecified");
            treatmentSuggestions.push("Respiratory assessment");
          }
        }
      }
      
      // Check for pain
      if (vitalSigns.painLevel && vitalSigns.painLevel >= 7) {
        treatmentSuggestions.push("Pain management");
        medicationSuggestions.push("Consider appropriate analgesic");
        
        if (chiefComplaint.includes('back') || chiefComplaint.includes('spine')) {
          diagnosisSuggestions.push("M54.5 - Low back pain");
          treatmentSuggestions.push("Physical therapy referral");
          medicationSuggestions.push("NSAIDs for pain relief");
        }
        
        if (chiefComplaint.includes('head') || chiefComplaint.includes('migraine')) {
          diagnosisSuggestions.push("R51 - Headache");
          treatmentSuggestions.push("Identify and avoid triggers");
        }
        
        if (chiefComplaint.includes('stomach') || chiefComplaint.includes('abdomen')) {
          diagnosisSuggestions.push("R10.9 - Unspecified abdominal pain");
          treatmentSuggestions.push("Abdominal examination");
        }
      }
      
      // Check for diabetes-related complaints
      if (patient?.medical_info?.chronicConditions?.includes('Diabetes')) {
        if (chiefComplaint.includes('thirst') || chiefComplaint.includes('urination') || chiefComplaint.includes('fatigue')) {
          diagnosisSuggestions.push("E11.9 - Type 2 diabetes mellitus without complications");
          treatmentSuggestions.push("Blood glucose monitoring");
          treatmentSuggestions.push("Dietary management");
          medicationSuggestions.push("Review current diabetes medications");
        }
      }
      
      // Default suggestions if none of the above apply
      if (diagnosisSuggestions.length === 0) {
        diagnosisSuggestions.push("Consider additional diagnostic tests");
        treatmentSuggestions.push("Symptomatic treatment based on presentation");
      }
      
      // Set the AI suggestions
      setAiSuggestions({
        diagnosis: diagnosisSuggestions,
        treatment: treatmentSuggestions,
        medications: medicationSuggestions
      });
      
    } catch (error) {
      console.error('Error analyzing patient data:', error);
      addNotification({
        message: 'Failed to analyze patient data',
        type: 'error'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async () => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!formData.chiefComplaint || !formData.diagnosis || !formData.treatmentPlan || !formData.departmentId) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        setIsSaving(false);
        return;
      }
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', formData);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success notification
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
        // Navigate back to patients list
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
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          notes: formData.notes,
          medical_certificate: formData.medicalCertificate,
          prescriptions: formData.prescriptions.length > 0 ? formData.prescriptions : null,
          department_id: formData.departmentId
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create pharmacy order if prescriptions exist
      if (formData.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
            medications: formData.prescriptions,
            status: 'pending',
            payment_status: 'pending',
            is_emergency: patient.current_flow_step === 'emergency'
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: formData.prescriptions.length > 0 ? 'pharmacy' : 'billing'
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
      // Show success notification
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      // Navigate back to patients list
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

      <div className="space-y-4">
        {/* Chief Complaint and Vital Signs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
              Chief Complaint
            </h3>
            <textarea
              value={formData.chiefComplaint}
              onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
              className="form-input py-2 text-sm w-full"
              rows={3}
              placeholder="Enter patient's chief complaint"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                Vital Signs
              </h3>
              <button
                onClick={analyzePatientData}
                disabled={isAnalyzing || !formData.chiefComplaint}
                className="btn btn-sm btn-outline flex items-center text-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3 mr-1" />
                    Analyze Data
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label text-xs">Temperature (°C)</label>
                <div className="flex items-center">
                  <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitalSigns.temperature || ''}
                    onChange={(e) => handleVitalSignChange('temperature', e.target.value ? parseFloat(e.target.value) : null)}
                    className={`form-input py-1 text-sm ${formData.vitalSigns.temperature && formData.vitalSigns.temperature > 38 ? 'border-error-300 text-error-700' : ''}`}
                    placeholder="36.5"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Heart Rate (bpm)</label>
                <div className="flex items-center">
                  <Heart className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    value={formData.vitalSigns.heartRate || ''}
                    onChange={(e) => handleVitalSignChange('heartRate', e.target.value ? parseInt(e.target.value) : null)}
                    className={`form-input py-1 text-sm ${formData.vitalSigns.heartRate && (formData.vitalSigns.heartRate < 60 || formData.vitalSigns.heartRate > 100) ? 'border-error-300 text-error-700' : ''}`}
                    placeholder="75"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Respiratory Rate</label>
                <div className="flex items-center">
                  <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    value={formData.vitalSigns.respiratoryRate || ''}
                    onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value ? parseInt(e.target.value) : null)}
                    className={`form-input py-1 text-sm ${formData.vitalSigns.respiratoryRate && (formData.vitalSigns.respiratoryRate < 12 || formData.vitalSigns.respiratoryRate > 20) ? 'border-error-300 text-error-700' : ''}`}
                    placeholder="16"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Blood Pressure (mmHg)</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={formData.vitalSigns.bloodPressureSystolic || ''}
                    onChange={(e) => handleVitalSignChange('bloodPressureSystolic', e.target.value ? parseInt(e.target.value) : null)}
                    className={`form-input py-1 text-sm w-1/2 ${formData.vitalSigns.bloodPressureSystolic && formData.vitalSigns.bloodPressureSystolic > 140 ? 'border-error-300 text-error-700' : ''}`}
                    placeholder="120"
                  />
                  <span className="text-gray-500">/</span>
                  <input
                    type="number"
                    value={formData.vitalSigns.bloodPressureDiastolic || ''}
                    onChange={(e) => handleVitalSignChange('bloodPressureDiastolic', e.target.value ? parseInt(e.target.value) : null)}
                    className={`form-input py-1 text-sm w-1/2 ${formData.vitalSigns.bloodPressureDiastolic && formData.vitalSigns.bloodPressureDiastolic > 90 ? 'border-error-300 text-error-700' : ''}`}
                    placeholder="80"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Oxygen Saturation (%)</label>
                <div className="flex items-center">
                  <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.vitalSigns.oxygenSaturation || ''}
                    onChange={(e) => handleVitalSignChange('oxygenSaturation', e.target.value ? parseInt(e.target.value) : null)}
                    className={`form-input py-1 text-sm ${formData.vitalSigns.oxygenSaturation && formData.vitalSigns.oxygenSaturation < 95 ? 'border-error-300 text-error-700' : ''}`}
                    placeholder="98"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Pain Level (0-10)</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={formData.vitalSigns.painLevel || 0}
                  onChange={(e) => handleVitalSignChange('painLevel', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Medical History and Allergies Alert */}
        {(patient.medical_info?.allergies?.length > 0 || patient.medical_info?.chronicConditions?.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-warning-500 mr-1.5" />
              <h3 className="text-md font-medium text-gray-900">Medical History & Alerts</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.medical_info?.allergies?.length > 0 && (
                <div className="bg-error-50 p-3 rounded-lg border border-error-100">
                  <h4 className="text-sm font-medium text-error-800 mb-1">Allergies</h4>
                  <ul className="space-y-1">
                    {patient.medical_info.allergies.map((allergy: any, index: number) => (
                      <li key={index} className="text-sm text-error-700 flex items-start">
                        <AlertTriangle className="h-3 w-3 text-error-500 mt-0.5 mr-1" />
                        <span>
                          <strong>{allergy.allergen}</strong>: {allergy.reaction} ({allergy.severity})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_info?.chronicConditions?.length > 0 && (
                <div className="bg-warning-50 p-3 rounded-lg border border-warning-100">
                  <h4 className="text-sm font-medium text-warning-800 mb-1">Chronic Conditions</h4>
                  <ul className="space-y-1">
                    {patient.medical_info.chronicConditions.map((condition: string, index: number) => (
                      <li key={index} className="text-sm text-warning-700 flex items-start">
                        <Activity className="h-3 w-3 text-warning-500 mt-0.5 mr-1" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Suggestions */}
        {aiSuggestions && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-3">
              <Brain className="h-4 w-4 text-secondary-500 mr-1.5" />
              <h3 className="text-md font-medium text-gray-900">AI Suggestions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                <h4 className="text-sm font-medium text-secondary-800 mb-1">Possible Diagnoses</h4>
                <ul className="space-y-1">
                  {aiSuggestions.diagnosis.map((diagnosis, index) => (
                    <li key={index} className="text-sm text-secondary-700 flex items-start">
                      <button 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            diagnosis: diagnosis
                          }));
                        }}
                        className="flex items-center hover:text-secondary-900"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {diagnosis}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                <h4 className="text-sm font-medium text-secondary-800 mb-1">Treatment Suggestions</h4>
                <ul className="space-y-1">
                  {aiSuggestions.treatment.map((treatment, index) => (
                    <li key={index} className="text-sm text-secondary-700 flex items-start">
                      <button 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            treatmentPlan: prev.treatmentPlan ? `${prev.treatmentPlan}\n- ${treatment}` : `- ${treatment}`
                          }));
                        }}
                        className="flex items-center hover:text-secondary-900"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {treatment}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                <h4 className="text-sm font-medium text-secondary-800 mb-1">Medication Suggestions</h4>
                <ul className="space-y-1">
                  {aiSuggestions.medications.map((medication, index) => (
                    <li key={index} className="text-sm text-secondary-700 flex items-start">
                      <button 
                        onClick={() => {
                          const med = medications.find(m => m.name.toLowerCase() === medication.toLowerCase() || medication.toLowerCase().includes(m.name.toLowerCase()));
                          if (med) {
                            setSelectedMedication(med);
                            setMedicationSearch(med.name);
                            handleAddPrescription();
                          } else {
                            setMedicationSearch(medication);
                            setShowMedicationDropdown(true);
                          }
                        }}
                        className="flex items-center hover:text-secondary-900"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {medication}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* History, Examination, Diagnosis, Treatment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">History</h3>
            <textarea
              value={formData.history}
              onChange={(e) => handleInputChange('history', e.target.value)}
              className="form-input py-2 text-sm w-full"
              rows={4}
              placeholder="Enter patient's history"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Examination</h3>
            <textarea
              value={formData.examination}
              onChange={(e) => handleInputChange('examination', e.target.value)}
              className="form-input py-2 text-sm w-full"
              rows={4}
              placeholder="Enter examination findings"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Diagnosis</h3>
            <div className="relative">
              <div className="flex items-center">
                <input
                  type="text"
                  value={diagnosisSearch}
                  onChange={(e) => {
                    setDiagnosisSearch(e.target.value);
                    setShowDiagnosisDropdown(true);
                  }}
                  onFocus={() => setShowDiagnosisDropdown(true)}
                  className="form-input py-2 text-sm w-full"
                  placeholder="Search for diagnosis codes..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              {showDiagnosisDropdown && filteredDiagnoses.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  {filteredDiagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis.code}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectDiagnosis(diagnosis)}
                    >
                      <div className="font-medium text-sm">{diagnosis.code} - {diagnosis.name}</div>
                      <div className="text-xs text-gray-500">{diagnosis.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <textarea
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              className="form-input py-2 text-sm w-full mt-2"
              rows={3}
              placeholder="Enter diagnosis"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Treatment Plan</h3>
            <textarea
              value={formData.treatmentPlan}
              onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
              className="form-input py-2 text-sm w-full"
              rows={4}
              placeholder="Enter treatment plan"
            />
          </div>
        </div>
        
        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center">
              <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
              Prescriptions
            </h3>
            <button
              onClick={handleAddPrescription}
              disabled={!selectedMedication}
              className="btn btn-sm btn-outline flex items-center text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Medication
            </button>
          </div>
          
          <div className="relative mb-3">
            <div className="flex items-center">
              <input
                type="text"
                value={medicationSearch}
                onChange={(e) => {
                  setMedicationSearch(e.target.value);
                  setShowMedicationDropdown(true);
                }}
                onFocus={() => setShowMedicationDropdown(true)}
                className="form-input py-2 text-sm w-full"
                placeholder="Search for medications..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {showMedicationDropdown && filteredMedications.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                {filteredMedications.map((medication) => (
                  <div
                    key={medication.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectMedication(medication)}
                  >
                    <div className="font-medium text-sm">{medication.name}</div>
                    <div className="text-xs text-gray-500">{medication.category} • {medication.dosages.join(', ')}</div>
                    {medication.contraindications && (
                      <div className="text-xs text-error-600 mt-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Contraindications: {medication.contraindications.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {formData.prescriptions.length > 0 ? (
            <div className="space-y-3">
              {formData.prescriptions.map((prescription, index) => (
                <div key={index} className="border rounded-lg p-3 relative">
                  <button
                    onClick={() => handleRemovePrescription(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">Medication</label>
                      <input
                        type="text"
                        value={prescription.medication}
                        onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                        className="form-input py-1.5 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Dosage</label>
                      <select
                        value={prescription.dosage}
                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                        className="form-input py-1.5 text-sm"
                      >
                        {medications.find(m => m.name === prescription.medication)?.dosages.map((dosage) => (
                          <option key={dosage} value={dosage}>{dosage}</option>
                        )) || (
                          <option value={prescription.dosage}>{prescription.dosage}</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Frequency</label>
                      <select
                        value={prescription.frequency}
                        onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                        className="form-input py-1.5 text-sm"
                      >
                        {medications.find(m => m.name === prescription.medication)?.frequencies.map((frequency) => (
                          <option key={frequency} value={frequency}>{frequency}</option>
                        )) || (
                          <option value={prescription.frequency}>{prescription.frequency}</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Duration</label>
                      <select
                        value={prescription.duration}
                        onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                        className="form-input py-1.5 text-sm"
                      >
                        {medications.find(m => m.name === prescription.medication)?.durations.map((duration) => (
                          <option key={duration} value={duration}>{duration}</option>
                        )) || (
                          <option value={prescription.duration}>{prescription.duration}</option>
                        )}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label text-xs">Instructions</label>
                      <select
                        value={prescription.instructions}
                        onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                        className="form-input py-1.5 text-sm"
                      >
                        {medications.find(m => m.name === prescription.medication)?.instructions.map((instruction) => (
                          <option key={instruction} value={instruction}>{instruction}</option>
                        )) || (
                          <option value={prescription.instructions}>{prescription.instructions}</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={prescription.quantity}
                        onChange={(e) => handlePrescriptionChange(index, 'quantity', parseInt(e.target.value))}
                        className="form-input py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Pill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">No medications prescribed</p>
              <p className="text-xs text-gray-400">Search for medications above to add prescriptions</p>
            </div>
          )}
        </div>
        
        {/* Notes and Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Additional Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="form-input py-2 text-sm w-full"
              rows={3}
              placeholder="Enter any additional notes"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Department & Options</h3>
            
            <div className="mb-3">
              <label className="form-label text-sm">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => handleInputChange('departmentId', e.target.value)}
                className="form-input py-2 text-sm"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
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
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-sm btn-outline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <button
            type="button"
            onClick={onSubmit}
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
    </div>
  );
};

export default ConsultationForm;