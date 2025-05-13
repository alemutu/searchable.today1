import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { User, Calendar, FileText, Save, ArrowLeft, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Stethoscope, Heart, Settings as Lungs, Pill, Activity, Brain, Microscope, FileImage, Search, Plus, Trash2, Clock, CalendarClock, FileCheck, Send, Printer, Loader2, X, Check, ArrowRight, Clipboard, ClipboardCheck, Bone, Thermometer, Droplets, Scale, Ruler, Calculator } from 'lucide-react';

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

interface VitalSigns {
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  pain_level: number | null;
}

interface Medication {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  inStock: boolean;
  isCustom: boolean;
}

interface LabTest {
  id: string;
  name: string;
  status: 'ordered' | 'in_progress' | 'completed';
  results?: any;
  ordered_at: string;
  completed_at?: string;
}

interface RadiologyTest {
  id: string;
  name: string;
  status: 'ordered' | 'in_progress' | 'completed';
  results?: any;
  ordered_at: string;
  completed_at?: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  purpose: string;
  department: string;
  doctor: string;
}

const ConsultationForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'lab-radiology' | 'medications' | 'notes'>('assessment');
  
  // Assessment state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [gynecologicalHistory, setGynecologicalHistory] = useState('');
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [socialHistory, setSocialHistory] = useState('');
  const [generalExamination, setGeneralExamination] = useState('');
  const [systemicExamination, setSystemicExamination] = useState<{[key: string]: string}>({
    cardiovascular: '',
    respiratory: '',
    gastrointestinal: '',
    neurological: '',
    musculoskeletal: '',
    genitourinary: '',
    breast: '',
    other: ''
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState('');
  
  // Lab & Radiology state
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [newLabTest, setNewLabTest] = useState('');
  const [newRadiologyTest, setNewRadiologyTest] = useState('');
  const [isWaitingForResults, setIsWaitingForResults] = useState(false);
  
  // Medications state
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchMedication, setSearchMedication] = useState('');
  const [searchResults, setSearchResults] = useState<{name: string, dosage: string, inStock: boolean}[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<{name: string, dosage: string} | null>(null);
  const [medicationFrequency, setMedicationFrequency] = useState('');
  const [medicationDuration, setMedicationDuration] = useState('');
  const [medicationInstructions, setMedicationInstructions] = useState('');
  const [medicationQuantity, setMedicationQuantity] = useState(0);
  const [isCustomMedication, setIsCustomMedication] = useState(false);
  
  // Notes state
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [medicalCertificate, setMedicalCertificate] = useState(false);
  const [medicalCertificateDays, setMedicalCertificateDays] = useState(1);
  const [medicalCertificateReason, setMedicalCertificateReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  
  // Vital signs
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    temperature: null,
    heart_rate: null,
    respiratory_rate: null,
    blood_pressure_systolic: null,
    blood_pressure_diastolic: null,
    oxygen_saturation: null,
    weight: null,
    height: null,
    bmi: null,
    pain_level: null
  });
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familySocial: false,
    examination: false,
    diagnosis: false,
    vitals: false
  });
  
  // Workflow state
  const [consultationStatus, setConsultationStatus] = useState<'draft' | 'in_progress' | 'completed'>('in_progress');
  const [nextSteps, setNextSteps] = useState<'lab' | 'radiology' | 'pharmacy' | 'discharge' | null>(null);
  
  // Notifications
  const [notificationMethod, setNotificationMethod] = useState<'sms' | 'email' | 'both' | 'none'>('sms');
  
  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchVitalSigns();
      fetchLabTests();
      fetchRadiologyTests();
      fetchMedications();
    }
  }, [patientId, hospital]);
  
  useEffect(() => {
    // Calculate BMI if height and weight are available
    if (vitalSigns.height && vitalSigns.weight) {
      const heightInMeters = vitalSigns.height / 100;
      const bmi = vitalSigns.weight / (heightInMeters * heightInMeters);
      setVitalSigns(prev => ({
        ...prev,
        bmi: parseFloat(bmi.toFixed(1))
      }));
    }
  }, [vitalSigns.height, vitalSigns.weight]);
  
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
  
  const fetchVitalSigns = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
        const mockVitalSigns: VitalSigns = {
          temperature: 37.2,
          heart_rate: 72,
          respiratory_rate: 16,
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          oxygen_saturation: 98,
          weight: 70,
          height: 175,
          bmi: 22.9,
          pain_level: 0
        };
        setVitalSigns(mockVitalSigns);
        return;
      }
      
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned
          throw error;
        }
        return;
      }
      
      if (data) {
        setVitalSigns({
          temperature: data.temperature,
          heart_rate: data.heart_rate,
          respiratory_rate: data.respiratory_rate,
          blood_pressure_systolic: data.blood_pressure_systolic,
          blood_pressure_diastolic: data.blood_pressure_diastolic,
          oxygen_saturation: data.oxygen_saturation,
          weight: data.weight,
          height: data.height,
          bmi: data.bmi,
          pain_level: data.pain_level
        });
      }
    } catch (error) {
      console.error('Error loading vital signs:', error);
    }
  };
  
  const fetchLabTests = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
        const mockLabTests: LabTest[] = [
          {
            id: '1',
            name: 'Complete Blood Count',
            status: 'completed',
            results: {
              wbc: 7.5,
              rbc: 4.8,
              hemoglobin: 14.2,
              hematocrit: 42,
              platelets: 250
            },
            ordered_at: '2025-05-10T09:00:00Z',
            completed_at: '2025-05-10T11:30:00Z'
          },
          {
            id: '2',
            name: 'Liver Function Test',
            status: 'in_progress',
            ordered_at: '2025-05-11T10:15:00Z'
          }
        ];
        setLabTests(mockLabTests);
        return;
      }
      
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setLabTests(data.map(test => ({
          id: test.id,
          name: test.test_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status: test.status === 'completed' ? 'completed' : test.status === 'pending' ? 'ordered' : 'in_progress',
          results: test.results,
          ordered_at: test.created_at,
          completed_at: test.reviewed_at
        })));
      }
    } catch (error) {
      console.error('Error loading lab tests:', error);
    }
  };
  
  const fetchRadiologyTests = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
        const mockRadiologyTests: RadiologyTest[] = [
          {
            id: '1',
            name: 'Chest X-Ray',
            status: 'completed',
            results: {
              findings: 'Normal study. No acute cardiopulmonary process.',
              impression: 'No acute findings.'
            },
            ordered_at: '2025-05-09T14:00:00Z',
            completed_at: '2025-05-09T15:45:00Z'
          }
        ];
        setRadiologyTests(mockRadiologyTests);
        return;
      }
      
      const { data, error } = await supabase
        .from('radiology_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setRadiologyTests(data.map(test => ({
          id: test.id,
          name: test.scan_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status: test.status === 'completed' ? 'completed' : test.status === 'pending' ? 'ordered' : 'in_progress',
          results: test.results,
          ordered_at: test.created_at,
          completed_at: test.reviewed_at
        })));
      }
    } catch (error) {
      console.error('Error loading radiology tests:', error);
    }
  };
  
  const fetchMedications = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
        const mockMedications: Medication[] = [];
        setMedications(mockMedications);
        return;
      }
      
      // In a real app, we would fetch from the database
      // For now, we'll just set an empty array
      setMedications([]);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };
  
  const searchMedications = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    try {
      // In a real app, we would search the database
      // For now, we'll use mock data
      const mockResults = [
        { name: 'Amoxicillin', dosage: '500mg', inStock: true },
        { name: 'Amoxicillin', dosage: '250mg', inStock: true },
        { name: 'Azithromycin', dosage: '250mg', inStock: true },
        { name: 'Atorvastatin', dosage: '20mg', inStock: true },
        { name: 'Amlodipine', dosage: '5mg', inStock: true },
        { name: 'Aspirin', dosage: '81mg', inStock: true },
        { name: 'Acetaminophen', dosage: '500mg', inStock: true },
        { name: 'Albuterol', dosage: '90mcg', inStock: false }
      ].filter(med => med.name.toLowerCase().includes(query.toLowerCase()));
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching medications:', error);
    }
  };
  
  const handleAddMedication = () => {
    if (!selectedMedication && !isCustomMedication) return;
    
    const newMedication: Medication = {
      id: Date.now().toString(),
      medication: isCustomMedication ? searchMedication : selectedMedication!.name,
      dosage: isCustomMedication ? '' : selectedMedication!.dosage,
      frequency: medicationFrequency,
      duration: medicationDuration,
      instructions: medicationInstructions,
      quantity: medicationQuantity,
      inStock: isCustomMedication ? false : true,
      isCustom: isCustomMedication
    };
    
    setMedications([...medications, newMedication]);
    
    // Reset form
    setSearchMedication('');
    setSelectedMedication(null);
    setMedicationFrequency('');
    setMedicationDuration('');
    setMedicationInstructions('');
    setMedicationQuantity(0);
    setIsCustomMedication(false);
    setSearchResults([]);
  };
  
  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };
  
  const handleAddLabTest = () => {
    if (!newLabTest) return;
    
    const newTest: LabTest = {
      id: Date.now().toString(),
      name: newLabTest,
      status: 'ordered',
      ordered_at: new Date().toISOString()
    };
    
    setLabTests([...labTests, newTest]);
    setNewLabTest('');
  };
  
  const handleAddRadiologyTest = () => {
    if (!newRadiologyTest) return;
    
    const newTest: RadiologyTest = {
      id: Date.now().toString(),
      name: newRadiologyTest,
      status: 'ordered',
      ordered_at: new Date().toISOString()
    };
    
    setRadiologyTests([...radiologyTests, newTest]);
    setNewRadiologyTest('');
  };
  
  const handleRemoveLabTest = (id: string) => {
    setLabTests(labTests.filter(test => test.id !== id));
  };
  
  const handleRemoveRadiologyTest = (id: string) => {
    setRadiologyTests(radiologyTests.filter(test => test.id !== id));
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
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
  
  const handleSaveConsultation = async () => {
    if (!patient || !hospital || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!chiefComplaint || !diagnosis) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', {
          patient_id: patient.id,
          doctor_id: user.id,
          hospital_id: hospital.id,
          chief_complaint: chiefComplaint,
          diagnosis,
          treatment_plan: treatmentPlan,
          notes: additionalNotes,
          medical_certificate: medicalCertificate,
          prescriptions: medications.map(med => ({
            medication: med.medication,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
          }))
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Determine next steps
        let nextStep = 'post_consultation';
        
        if (labTests.some(test => test.status === 'ordered')) {
          nextStep = 'lab_tests';
          setNextSteps('lab');
        } else if (radiologyTests.some(test => test.status === 'ordered')) {
          nextStep = 'radiology';
          setNextSteps('radiology');
        } else if (medications.length > 0) {
          nextStep = 'pharmacy';
          setNextSteps('pharmacy');
        } else {
          setNextSteps('discharge');
        }
        
        // Update consultation status
        setConsultationStatus('completed');
        
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
        // If we have a follow-up appointment, create it
        if (followUpDate) {
          console.log('Follow-up appointment created:', {
            patient_id: patient.id,
            doctor_id: user.id,
            date: followUpDate,
            notes: followUpNotes
          });
          
          addNotification({
            message: 'Follow-up appointment scheduled',
            type: 'success'
          });
        }
        
        // If we have a medical certificate, create it
        if (medicalCertificate) {
          console.log('Medical certificate created:', {
            patient_id: patient.id,
            doctor_id: user.id,
            days: medicalCertificateDays,
            reason: medicalCertificateReason
          });
          
          addNotification({
            message: 'Medical certificate created',
            type: 'success'
          });
        }
        
        // Send notifications if enabled
        if (notificationMethod !== 'none') {
          console.log('Notification sent via:', notificationMethod);
          
          addNotification({
            message: `Notification sent to patient via ${notificationMethod}`,
            type: 'success'
          });
        }
        
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
          chief_complaint: chiefComplaint,
          diagnosis,
          treatment_plan: treatmentPlan,
          notes: additionalNotes,
          medical_certificate: medicalCertificate,
          prescriptions: medications.map(med => ({
            medication: med.medication,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
          }))
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab tests if any
      for (const test of labTests.filter(t => t.status === 'ordered')) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            test_type: test.name.toLowerCase().replace(/\s+/g, '_'),
            test_date: new Date().toISOString(),
            status: 'pending'
          });
          
        if (labError) throw labError;
      }
      
      // Create radiology tests if any
      for (const test of radiologyTests.filter(t => t.status === 'ordered')) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            scan_type: test.name.toLowerCase().replace(/\s+/g, '_'),
            scan_date: new Date().toISOString(),
            status: 'pending'
          });
          
        if (radiologyError) throw radiologyError;
      }
      
      // Create pharmacy order if any medications
      if (medications.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
            medications: medications.map(med => ({
              medication: med.medication,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              instructions: med.instructions,
              quantity: med.quantity,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending'
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      // Create follow-up appointment if specified
      if (followUpDate) {
        const appointmentTime = '09:00:00'; // Default to 9 AM
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            patient_id: patient.id,
            doctor_id: user.id,
            hospital_id: hospital.id,
            department_id: user.department_id,
            date: followUpDate,
            start_time: appointmentTime,
            end_time: '09:30:00', // 30 minute appointment
            status: 'scheduled',
            notes: followUpNotes
          });
          
        if (appointmentError) throw appointmentError;
      }
      
      // Determine next steps
      let nextStep = 'post_consultation';
      
      if (labTests.some(test => test.status === 'ordered')) {
        nextStep = 'lab_tests';
      } else if (radiologyTests.some(test => test.status === 'ordered')) {
        nextStep = 'radiology';
      } else if (medications.length > 0) {
        nextStep = 'pharmacy';
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: nextStep
        })
        .eq('id', patient.id);
        
      if (patientError) throw patientError;
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      addNotification({
        message: `Error saving consultation: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePrintPrescription = () => {
    if (medications.length === 0) {
      addNotification({
        message: 'No medications to print',
        type: 'warning'
      });
      return;
    }
    
    // In a real app, this would open a print dialog with a formatted prescription
    window.print();
  };
  
  const handlePrintMedicalCertificate = () => {
    if (!medicalCertificate) {
      addNotification({
        message: 'No medical certificate to print',
        type: 'warning'
      });
      return;
    }
    
    // In a real app, this would open a print dialog with a formatted medical certificate
    window.print();
  };
  
  const handleSendToPharmacy = () => {
    if (medications.length === 0) {
      addNotification({
        message: 'No medications to send to pharmacy',
        type: 'warning'
      });
      return;
    }
    
    addNotification({
      message: 'Prescription sent to pharmacy',
      type: 'success'
    });
    
    setNextSteps('pharmacy');
  };
  
  const handleOrderLabTests = () => {
    if (labTests.filter(t => t.status === 'ordered').length === 0) {
      addNotification({
        message: 'No lab tests to order',
        type: 'warning'
      });
      return;
    }
    
    addNotification({
      message: 'Lab tests ordered successfully',
      type: 'success'
    });
    
    setNextSteps('lab');
    setIsWaitingForResults(true);
  };
  
  const handleOrderRadiologyTests = () => {
    if (radiologyTests.filter(t => t.status === 'ordered').length === 0) {
      addNotification({
        message: 'No radiology tests to order',
        type: 'warning'
      });
      return;
    }
    
    addNotification({
      message: 'Radiology tests ordered successfully',
      type: 'success'
    });
    
    setNextSteps('radiology');
    setIsWaitingForResults(true);
  };
  
  const handleDischargePatient = () => {
    addNotification({
      message: 'Patient discharged successfully',
      type: 'success'
    });
    
    setNextSteps('discharge');
    setConsultationStatus('completed');
    
    // In a real app, this would update the patient's status in the database
    // and navigate back to the patient list
    setTimeout(() => {
      navigate('/patients');
    }, 1500);
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-full text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Patient Consultation</h1>
                <div className="flex items-center text-primary-100 text-sm">
                  <User className="h-4 w-4 mr-1" />
                  <span>{patient.first_name} {patient.last_name}</span>
                  <span className="mx-2">•</span>
                  <span>{calculateAge(patient.date_of_birth)} years</span>
                  <span className="mx-2">•</span>
                  <span>{patient.gender}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {consultationStatus === 'draft' && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  Draft
                </span>
              )}
              {consultationStatus === 'in_progress' && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                  In Progress
                </span>
              )}
              {consultationStatus === 'completed' && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                  Completed
                </span>
              )}
              
              <button
                onClick={handleSaveConsultation}
                disabled={isSaving}
                className="btn btn-primary inline-flex items-center"
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
        <div className="px-6 py-2 border-b border-gray-200 flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'assessment'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              Assessment
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('lab-radiology')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'lab-radiology'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Microscope className="h-4 w-4 mr-2" />
              Lab & Radiology
              {(labTests.some(t => t.status === 'in_progress') || radiologyTests.some(t => t.status === 'in_progress')) && (
                <div className="ml-2 h-2 w-2 rounded-full bg-warning-500 animate-pulse"></div>
              )}
              {(labTests.some(t => t.status === 'completed' && !t.results?.viewed) || 
                radiologyTests.some(t => t.status === 'completed' && !t.results?.viewed)) && (
                <div className="ml-2 h-2 w-2 rounded-full bg-success-500"></div>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('medications')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'medications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Pill className="h-4 w-4 mr-2" />
              Medications
              {medications.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  {medications.length}
                </span>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'notes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Notes & Plan
            </div>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left column - Main form */}
        <div className="w-full lg:w-3/4 space-y-4">
          {/* Assessment Tab */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              {/* Patient History Section */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('patientHistory')}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Patient History</h2>
                  </div>
                  {expandedSections.patientHistory ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.patientHistory && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="form-label required">Chief Complaint</label>
                      <textarea
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter the patient's main complaint"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">History of Present Illness</label>
                      <textarea
                        value={historyOfPresentIllness}
                        onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                        className="form-input"
                        rows={3}
                        placeholder="Describe the history of the present illness"
                      />
                    </div>
                    
                    {patient.gender === 'Female' && (
                      <div>
                        <label className="form-label">Gynecological/Obstetric History</label>
                        <textarea
                          value={gynecologicalHistory}
                          onChange={(e) => setGynecologicalHistory(e.target.value)}
                          className="form-input"
                          rows={2}
                          placeholder="Enter gynecological or obstetric history if applicable"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="form-label">Past Medical and Surgical History</label>
                      <textarea
                        value={pastMedicalHistory}
                        onChange={(e) => setPastMedicalHistory(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter past medical and surgical history"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Family and Social History */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('familySocial')}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Family & Social History</h2>
                  </div>
                  {expandedSections.familySocial ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.familySocial && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="form-label">Family History</label>
                      <textarea
                        value={familyHistory}
                        onChange={(e) => setFamilyHistory(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter relevant family medical history"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Social History</label>
                      <textarea
                        value={socialHistory}
                        onChange={(e) => setSocialHistory(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter social history including occupation, habits, etc."
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Vital Signs */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('vitals')}
                >
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Vital Signs</h2>
                  </div>
                  {expandedSections.vitals ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.vitals && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="form-label text-sm">Temperature (°C)</label>
                        <div className="flex items-center">
                          <Thermometer className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            step="0.1"
                            value={vitalSigns.temperature || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value ? parseFloat(e.target.value) : null})}
                            className="form-input py-2 text-sm"
                            placeholder="36.5"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Heart Rate (bpm)</label>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            value={vitalSigns.heart_rate || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, heart_rate: e.target.value ? parseInt(e.target.value) : null})}
                            className="form-input py-2 text-sm"
                            placeholder="75"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Respiratory Rate (breaths/min)</label>
                        <div className="flex items-center">
                          <Lungs className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            value={vitalSigns.respiratory_rate || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, respiratory_rate: e.target.value ? parseInt(e.target.value) : null})}
                            className="form-input py-2 text-sm"
                            placeholder="16"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Blood Pressure (mmHg)</label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            value={vitalSigns.blood_pressure_systolic || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, blood_pressure_systolic: e.target.value ? parseInt(e.target.value) : null})}
                            className="form-input py-2 text-sm w-1/2"
                            placeholder="120"
                          />
                          <span className="text-gray-500">/</span>
                          <input
                            type="number"
                            value={vitalSigns.blood_pressure_diastolic || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, blood_pressure_diastolic: e.target.value ? parseInt(e.target.value) : null})}
                            className="form-input py-2 text-sm w-1/2"
                            placeholder="80"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Oxygen Saturation (%)</label>
                        <div className="flex items-center">
                          <Droplets className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={vitalSigns.oxygen_saturation || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, oxygen_saturation: e.target.value ? parseInt(e.target.value) : null})}
                            className="form-input py-2 text-sm"
                            placeholder="98"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Pain Level (0-10)</label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={vitalSigns.pain_level || 0}
                          onChange={(e) => setVitalSigns({...vitalSigns, pain_level: parseInt(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Weight (kg)</label>
                        <div className="flex items-center">
                          <Scale className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            step="0.1"
                            value={vitalSigns.weight || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value ? parseFloat(e.target.value) : null})}
                            className="form-input py-2 text-sm"
                            placeholder="70"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">Height (cm)</label>
                        <div className="flex items-center">
                          <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            value={vitalSigns.height || ''}
                            onChange={(e) => setVitalSigns({...vitalSigns, height: e.target.value ? parseInt(e.target.value) : null})}
                            className="form-input py-2 text-sm"
                            placeholder="170"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-sm">BMI</label>
                        <div className="flex items-center">
                          <Calculator className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            step="0.1"
                            value={vitalSigns.bmi || ''}
                            className="form-input py-2 text-sm bg-gray-50"
                            placeholder="Calculated"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Examination */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('examination')}
                >
                  <div className="flex items-center">
                    <Stethoscope className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Examination</h2>
                  </div>
                  {expandedSections.examination ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.examination && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="form-label">General Examination</label>
                      <textarea
                        value={generalExamination}
                        onChange={(e) => setGeneralExamination(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter general examination findings"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <label className="form-label">Systemic Examination</label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Cardiovascular System</label>
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 text-gray-400 mr-2" />
                            <textarea
                              value={systemicExamination.cardiovascular}
                              onChange={(e) => setSystemicExamination({...systemicExamination, cardiovascular: e.target.value})}
                              className="form-input py-2 text-sm"
                              rows={2}
                              placeholder="Enter cardiovascular findings"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label text-sm">Respiratory System</label>
                          <div className="flex items-center">
                            <Lungs className="h-4 w-4 text-gray-400 mr-2" />
                            <textarea
                              value={systemicExamination.respiratory}
                              onChange={(e) => setSystemicExamination({...systemicExamination, respiratory: e.target.value})}
                              className="form-input py-2 text-sm"
                              rows={2}
                              placeholder="Enter respiratory findings"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label text-sm">Gastrointestinal System</label>
                          <textarea
                            value={systemicExamination.gastrointestinal}
                            onChange={(e) => setSystemicExamination({...systemicExamination, gastrointestinal: e.target.value})}
                            className="form-input py-2 text-sm"
                            rows={2}
                            placeholder="Enter gastrointestinal findings"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-sm">Central Nervous System</label>
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 text-gray-400 mr-2" />
                            <textarea
                              value={systemicExamination.neurological}
                              onChange={(e) => setSystemicExamination({...systemicExamination, neurological: e.target.value})}
                              className="form-input py-2 text-sm"
                              rows={2}
                              placeholder="Enter neurological findings"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label text-sm">Musculoskeletal</label>
                          <div className="flex items-center">
                            <Bone className="h-4 w-4 text-gray-400 mr-2" />
                            <textarea
                              value={systemicExamination.musculoskeletal}
                              onChange={(e) => setSystemicExamination({...systemicExamination, musculoskeletal: e.target.value})}
                              className="form-input py-2 text-sm"
                              rows={2}
                              placeholder="Enter musculoskeletal findings"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label text-sm">Genitourinary System</label>
                          <textarea
                            value={systemicExamination.genitourinary}
                            onChange={(e) => setSystemicExamination({...systemicExamination, genitourinary: e.target.value})}
                            className="form-input py-2 text-sm"
                            rows={2}
                            placeholder="Enter genitourinary findings"
                          />
                        </div>
                        
                        {patient.gender === 'Female' && (
                          <div>
                            <label className="form-label text-sm">Breast Examination</label>
                            <textarea
                              value={systemicExamination.breast}
                              onChange={(e) => setSystemicExamination({...systemicExamination, breast: e.target.value})}
                              className="form-input py-2 text-sm"
                              rows={2}
                              placeholder="Enter breast examination findings"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="form-label text-sm">Other Findings</label>
                          <textarea
                            value={systemicExamination.other}
                            onChange={(e) => setSystemicExamination({...systemicExamination, other: e.target.value})}
                            className="form-input py-2 text-sm"
                            rows={2}
                            placeholder="Enter any other examination findings"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Diagnosis */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('diagnosis')}
                >
                  <div className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Diagnosis</h2>
                  </div>
                  {expandedSections.diagnosis ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.diagnosis && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="form-label required">Diagnosis</label>
                      <textarea
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter the primary diagnosis"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Differential Diagnosis</label>
                      <textarea
                        value={differentialDiagnosis}
                        onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                        className="form-input"
                        rows={2}
                        placeholder="Enter any differential diagnoses"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Lab & Radiology Tab */}
          {activeTab === 'lab-radiology' && (
            <div className="space-y-4">
              {/* Lab Tests */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <Flask className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Laboratory Tests</h2>
                  </div>
                  <button
                    onClick={handleOrderLabTests}
                    disabled={labTests.filter(t => t.status === 'ordered').length === 0}
                    className="btn btn-sm btn-primary"
                  >
                    Order Tests
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={newLabTest}
                        onChange={(e) => setNewLabTest(e.target.value)}
                        className="form-input pr-10"
                        placeholder="Add a new lab test..."
                      />
                      <button
                        onClick={handleAddLabTest}
                        disabled={!newLabTest}
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                      >
                        <Plus className="h-5 w-5 text-gray-400 hover:text-primary-500" />
                      </button>
                    </div>
                  </div>
                  
                  {labTests.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No lab tests ordered yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {labTests.map((test) => (
                        <div 
                          key={test.id} 
                          className={`p-4 rounded-lg border ${
                            test.status === 'completed' ? 'border-success-200 bg-success-50' : 
                            test.status === 'in_progress' ? 'border-warning-200 bg-warning-50' : 
                            'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="mt-0.5">
                                {test.status === 'completed' ? (
                                  <CheckCircle className="h-5 w-5 text-success-500" />
                                ) : test.status === 'in_progress' ? (
                                  <Loader2 className="h-5 w-5 text-warning-500 animate-spin" />
                                ) : (
                                  <Flask className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                                <p className="text-xs text-gray-500">
                                  {test.status === 'completed' ? 
                                    `Completed: ${new Date(test.completed_at!).toLocaleString()}` : 
                                    test.status === 'in_progress' ? 
                                    'In progress...' : 
                                    `Ordered: ${new Date(test.ordered_at).toLocaleString()}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              {test.status === 'completed' && (
                                <button
                                  onClick={() => {
                                    // Mark as viewed and show results
                                    const updatedTests = labTests.map(t => 
                                      t.id === test.id ? {...t, results: {...t.results, viewed: true}} : t
                                    );
                                    setLabTests(updatedTests);
                                    
                                    // In a real app, this would open a modal with the results
                                    alert(`Results for ${test.name}:\n${JSON.stringify(test.results, null, 2)}`);
                                  }}
                                  className="text-primary-600 hover:text-primary-800"
                                >
                                  <FileText className="h-5 w-5" />
                                </button>
                              )}
                              
                              {test.status === 'ordered' && (
                                <button
                                  onClick={() => handleRemoveLabTest(test.id)}
                                  className="text-error-600 hover:text-error-800"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {test.status === 'completed' && test.results && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-700">
                                <strong>Results Summary:</strong> {test.results.summary || 'Normal findings'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Radiology Tests */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <FileImage className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Radiology Tests</h2>
                  </div>
                  <button
                    onClick={handleOrderRadiologyTests}
                    disabled={radiologyTests.filter(t => t.status === 'ordered').length === 0}
                    className="btn btn-sm btn-primary"
                  >
                    Order Tests
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={newRadiologyTest}
                        onChange={(e) => setNewRadiologyTest(e.target.value)}
                        className="form-input pr-10"
                        placeholder="Add a new radiology test..."
                      />
                      <button
                        onClick={handleAddRadiologyTest}
                        disabled={!newRadiologyTest}
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                      >
                        <Plus className="h-5 w-5 text-gray-400 hover:text-primary-500" />
                      </button>
                    </div>
                  </div>
                  
                  {radiologyTests.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No radiology tests ordered yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {radiologyTests.map((test) => (
                        <div 
                          key={test.id} 
                          className={`p-4 rounded-lg border ${
                            test.status === 'completed' ? 'border-success-200 bg-success-50' : 
                            test.status === 'in_progress' ? 'border-warning-200 bg-warning-50' : 
                            'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="mt-0.5">
                                {test.status === 'completed' ? (
                                  <CheckCircle className="h-5 w-5 text-success-500" />
                                ) : test.status === 'in_progress' ? (
                                  <Loader2 className="h-5 w-5 text-warning-500 animate-spin" />
                                ) : (
                                  <FileImage className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                                <p className="text-xs text-gray-500">
                                  {test.status === 'completed' ? 
                                    `Completed: ${new Date(test.completed_at!).toLocaleString()}` : 
                                    test.status === 'in_progress' ? 
                                    'In progress...' : 
                                    `Ordered: ${new Date(test.ordered_at).toLocaleString()}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              {test.status === 'completed' && (
                                <button
                                  onClick={() => {
                                    // Mark as viewed and show results
                                    const updatedTests = radiologyTests.map(t => 
                                      t.id === test.id ? {...t, results: {...t.results, viewed: true}} : t
                                    );
                                    setRadiologyTests(updatedTests);
                                    
                                    // In a real app, this would open a modal with the results
                                    alert(`Results for ${test.name}:\n${JSON.stringify(test.results, null, 2)}`);
                                  }}
                                  className="text-primary-600 hover:text-primary-800"
                                >
                                  <FileText className="h-5 w-5" />
                                </button>
                              )}
                              
                              {test.status === 'ordered' && (
                                <button
                                  onClick={() => handleRemoveRadiologyTest(test.id)}
                                  className="text-error-600 hover:text-error-800"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {test.status === 'completed' && test.results && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-700">
                                <strong>Findings:</strong> {test.results.findings || 'Normal study'}
                              </div>
                              {test.results.impression && (
                                <div className="text-xs text-gray-700 mt-1">
                                  <strong>Impression:</strong> {test.results.impression}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Waiting for Results */}
              {isWaitingForResults && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                  <div className="mr-4 flex-shrink-0">
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Waiting for test results</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You can continue with other patients while waiting for the results. You'll be notified when they're ready.
                    </p>
                    <button 
                      className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                      onClick={() => navigate('/patients')}
                    >
                      Return to patient list
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Pill className="h-5 w-5 text-primary-500 mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Prescribe Medications</h2>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePrintPrescription}
                        disabled={medications.length === 0}
                        className="btn btn-sm btn-outline"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </button>
                      <button
                        onClick={handleSendToPharmacy}
                        disabled={medications.length === 0}
                        className="btn btn-sm btn-primary"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send to Pharmacy
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Search Medication</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchMedication}
                          onChange={(e) => {
                            setSearchMedication(e.target.value);
                            searchMedications(e.target.value);
                          }}
                          className="form-input pl-10"
                          placeholder="Search for medications..."
                        />
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                              onClick={() => {
                                setSelectedMedication(result);
                                setSearchMedication(`${result.name} ${result.dosage}`);
                                setSearchResults([]);
                              }}
                            >
                              <div>
                                <span className="font-medium">{result.name}</span>
                                <span className="text-gray-500 ml-2">{result.dosage}</span>
                              </div>
                              {result.inStock ? (
                                <span className="text-xs text-success-600 font-medium">In Stock</span>
                              ) : (
                                <span className="text-xs text-error-600 font-medium">Out of Stock</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          id="customMedication"
                          checked={isCustomMedication}
                          onChange={(e) => {
                            setIsCustomMedication(e.target.checked);
                            if (e.target.checked) {
                              setSelectedMedication(null);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="customMedication" className="ml-2 block text-sm text-gray-900">
                          Add custom medication (not in inventory)
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Frequency</label>
                        <select
                          value={medicationFrequency}
                          onChange={(e) => setMedicationFrequency(e.target.value)}
                          className="form-input"
                        >
                          <option value="">Select frequency</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="Four times daily">Four times daily</option>
                          <option value="Every 4 hours">Every 4 hours</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                          <option value="As needed">As needed (PRN)</option>
                          <option value="Before meals">Before meals</option>
                          <option value="After meals">After meals</option>
                          <option value="At bedtime">At bedtime</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Duration</label>
                        <select
                          value={medicationDuration}
                          onChange={(e) => setMedicationDuration(e.target.value)}
                          className="form-input"
                        >
                          <option value="">Select duration</option>
                          <option value="3 days">3 days</option>
                          <option value="5 days">5 days</option>
                          <option value="7 days">7 days</option>
                          <option value="10 days">10 days</option>
                          <option value="14 days">14 days</option>
                          <option value="1 month">1 month</option>
                          <option value="2 months">2 months</option>
                          <option value="3 months">3 months</option>
                          <option value="6 months">6 months</option>
                          <option value="Indefinite">Indefinite</option>
                          <option value="Single dose">Single dose</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          value={medicationQuantity}
                          onChange={(e) => setMedicationQuantity(parseInt(e.target.value))}
                          min="0"
                          className="form-input"
                          placeholder="Enter quantity"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Instructions</label>
                        <input
                          type="text"
                          value={medicationInstructions}
                          onChange={(e) => setMedicationInstructions(e.target.value)}
                          className="form-input"
                          placeholder="E.g., Take with food"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddMedication}
                        disabled={(!selectedMedication && !isCustomMedication) || !medicationFrequency || !medicationDuration}
                        className="btn btn-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Prescription</h3>
                    
                    {medications.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No medications added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {medications.map((medication) => (
                          <div 
                            key={medication.id} 
                            className={`p-4 rounded-lg border ${
                              medication.isCustom ? 'border-warning-200 bg-warning-50' : 
                              medication.inStock ? 'border-gray-200' : 'border-error-200 bg-error-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <Pill className="h-5 w-5 text-primary-500 mr-2" />
                                  <h4 className="text-base font-medium text-gray-900">
                                    {medication.medication} {medication.dosage}
                                  </h4>
                                  {medication.isCustom && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-warning-100 text-warning-800">
                                      Custom
                                    </span>
                                  )}
                                  {!medication.inStock && !medication.isCustom && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 text-error-800">
                                      Out of Stock
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {medication.frequency}, {medication.duration}
                                </p>
                                {medication.instructions && (
                                  <p className="text-sm text-gray-600">
                                    Instructions: {medication.instructions}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Quantity: {medication.quantity}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveMedication(medication.id)}
                                className="text-gray-400 hover:text-error-500"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Notes & Plan Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Treatment Plan & Notes</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="form-label">Treatment Plan</label>
                    <textarea
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      className="form-input"
                      rows={3}
                      placeholder="Enter the treatment plan for the patient"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="form-input"
                      rows={3}
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              </div>
              
              {/* Follow-up Appointment */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center">
                    <CalendarClock className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Follow-up Appointment</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Follow-up Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="form-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Follow-up Notes</label>
                      <input
                        type="text"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        className="form-input"
                        placeholder="E.g., Review lab results"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Medical Certificate */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileCheck className="h-5 w-5 text-primary-500 mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Medical Certificate</h2>
                    </div>
                    {medicalCertificate && (
                      <button
                        onClick={handlePrintMedicalCertificate}
                        className="btn btn-sm btn-outline"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print Certificate
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="medicalCertificate"
                      checked={medicalCertificate}
                      onChange={(e) => setMedicalCertificate(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                      Issue medical certificate
                    </label>
                  </div>
                  
                  {medicalCertificate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="form-label">Number of Days</label>
                        <input
                          type="number"
                          value={medicalCertificateDays}
                          onChange={(e) => setMedicalCertificateDays(parseInt(e.target.value))}
                          min="1"
                          className="form-input"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Reason</label>
                        <input
                          type="text"
                          value={medicalCertificateReason}
                          onChange={(e) => setMedicalCertificateReason(e.target.value)}
                          className="form-input"
                          placeholder="E.g., Acute illness"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notifications */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-2">
                    <label className="form-label">Notification Method</label>
                    <div className="flex flex-wrap gap-3">
                      <div 
                        className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                          notificationMethod === 'sms' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => setNotificationMethod('sms')}
                      >
                        <input
                          type="radio"
                          checked={notificationMethod === 'sms'}
                          onChange={() => setNotificationMethod('sms')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          SMS
                        </label>
                      </div>
                      
                      <div 
                        className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                          notificationMethod === 'email' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => setNotificationMethod('email')}
                      >
                        <input
                          type="radio"
                          checked={notificationMethod === 'email'}
                          onChange={() => setNotificationMethod('email')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Email
                        </label>
                      </div>
                      
                      <div 
                        className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                          notificationMethod === 'both' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => setNotificationMethod('both')}
                      >
                        <input
                          type="radio"
                          checked={notificationMethod === 'both'}
                          onChange={() => setNotificationMethod('both')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Both
                        </label>
                      </div>
                      
                      <div 
                        className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                          notificationMethod === 'none' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => setNotificationMethod('none')}
                      >
                        <input
                          type="radio"
                          checked={notificationMethod === 'none'}
                          onChange={() => setNotificationMethod('none')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          None
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column - Summary and actions */}
        <div className="w-full lg:w-1/4 space-y-4">
          {/* Patient Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Patient Summary</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold">
                  {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</h3>
                  <p className="text-xs text-gray-500">{calculateAge(patient.date_of_birth)} years • {patient.gender}</p>
                </div>
              </div>
              
              {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-md">
                  <h4 className="text-xs font-medium text-error-800 flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Allergies
                  </h4>
                  <ul className="mt-1 text-xs text-error-700 space-y-1">
                    {patient.medical_history.allergies.map((allergy: any, index: number) => (
                      <li key={index}>
                        {allergy.allergen} - {allergy.reaction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_history?.chronicConditions && patient.medical_history.chronicConditions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700">Chronic Conditions</h4>
                  <ul className="mt-1 text-xs text-gray-600 space-y-1">
                    {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_history?.currentMedications && patient.medical_history.currentMedications.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700">Current Medications</h4>
                  <ul className="mt-1 text-xs text-gray-600 space-y-1">
                    {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                      <li key={index}>
                        {medication.name} {medication.dosage && `- ${medication.dosage}`} {medication.frequency && `(${medication.frequency})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Vital Signs Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Vital Signs</h2>
            </div>
            
            <div className="p-5 space-y-2">
              {vitalSigns.temperature && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Temperature</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    vitalSigns.temperature < 36 || vitalSigns.temperature > 38 ? 'text-error-600' : 'text-gray-900'
                  }`}>
                    {vitalSigns.temperature} °C
                  </span>
                </div>
              )}
              
              {vitalSigns.heart_rate && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Heart Rate</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    vitalSigns.heart_rate < 60 || vitalSigns.heart_rate > 100 ? 'text-error-600' : 'text-gray-900'
                  }`}>
                    {vitalSigns.heart_rate} bpm
                  </span>
                </div>
              )}
              
              {vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Blood Pressure</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    vitalSigns.blood_pressure_systolic > 140 || vitalSigns.blood_pressure_diastolic > 90 ? 'text-error-600' : 'text-gray-900'
                  }`}>
                    {vitalSigns.blood_pressure_systolic}/{vitalSigns.blood_pressure_diastolic} mmHg
                  </span>
                </div>
              )}
              
              {vitalSigns.respiratory_rate && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Lungs className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Respiratory Rate</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    vitalSigns.respiratory_rate < 12 || vitalSigns.respiratory_rate > 20 ? 'text-error-600' : 'text-gray-900'
                  }`}>
                    {vitalSigns.respiratory_rate} /min
                  </span>
                </div>
              )}
              
              {vitalSigns.oxygen_saturation && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">O₂ Saturation</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    vitalSigns.oxygen_saturation < 95 ? 'text-error-600' : 'text-gray-900'
                  }`}>
                    {vitalSigns.oxygen_saturation}%
                  </span>
                </div>
              )}
              
              {vitalSigns.bmi && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calculator className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">BMI</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    vitalSigns.bmi < 18.5 || vitalSigns.bmi > 30 ? 'text-warning-600' : 'text-gray-900'
                  }`}>
                    {vitalSigns.bmi}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Consultation Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Consultation Summary</h2>
            </div>
            
            <div className="p-5 space-y-3">
              {chiefComplaint && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700">Chief Complaint</h3>
                  <p className="text-sm text-gray-900 mt-1">{chiefComplaint}</p>
                </div>
              )}
              
              {diagnosis && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700">Diagnosis</h3>
                  <p className="text-sm text-gray-900 mt-1">{diagnosis}</p>
                </div>
              )}
              
              {medications.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700">Medications</h3>
                  <ul className="mt-1 text-sm text-gray-900 space-y-1">
                    {medications.map((med) => (
                      <li key={med.id} className="flex items-center">
                        <Pill className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                        {med.medication} {med.dosage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {labTests.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700">Lab Tests</h3>
                  <ul className="mt-1 text-sm text-gray-900 space-y-1">
                    {labTests.map((test) => (
                      <li key={test.id} className="flex items-center">
                        <Flask className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                        {test.name}
                        {test.status === 'completed' && (
                          <CheckCircle className="h-3.5 w-3.5 text-success-500 ml-1.5" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {radiologyTests.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700">Radiology Tests</h3>
                  <ul className="mt-1 text-sm text-gray-900 space-y-1">
                    {radiologyTests.map((test) => (
                      <li key={test.id} className="flex items-center">
                        <FileImage className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                        {test.name}
                        {test.status === 'completed' && (
                          <CheckCircle className="h-3.5 w-3.5 text-success-500 ml-1.5" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {followUpDate && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700">Follow-up</h3>
                  <p className="text-sm text-gray-900 mt-1">
                    <Calendar className="h-3.5 w-3.5 text-primary-500 inline mr-1.5" />
                    {new Date(followUpDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Actions</h2>
            </div>
            
            <div className="p-5 space-y-3">
              <button
                onClick={handleSaveConsultation}
                disabled={isSaving}
                className="btn btn-primary w-full justify-center"
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
              
              {nextSteps === 'lab' && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <h3 className="text-sm font-medium text-blue-800 flex items-center">
                    <Flask className="h-4 w-4 mr-1.5" />
                    Lab Tests Ordered
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Patient has been sent to the laboratory. You can continue with other patients.
                  </p>
                  <button 
                    className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                    onClick={() => navigate('/patients')}
                  >
                    Return to patient list
                  </button>
                </div>
              )}
              
              {nextSteps === 'radiology' && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <h3 className="text-sm font-medium text-blue-800 flex items-center">
                    <FileImage className="h-4 w-4 mr-1.5" />
                    Radiology Tests Ordered
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Patient has been sent to radiology. You can continue with other patients.
                  </p>
                  <button 
                    className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                    onClick={() => navigate('/patients')}
                  >
                    Return to patient list
                  </button>
                </div>
              )}
              
              {nextSteps === 'pharmacy' && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <h3 className="text-sm font-medium text-blue-800 flex items-center">
                    <Pill className="h-4 w-4 mr-1.5" />
                    Prescription Sent
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Patient has been sent to the pharmacy. You can continue with other patients.
                  </p>
                  <button 
                    className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                    onClick={() => navigate('/patients')}
                  >
                    Return to patient list
                  </button>
                </div>
              )}
              
              {nextSteps === 'discharge' && (
                <div className="p-3 bg-success-50 border border-success-100 rounded-md">
                  <h3 className="text-sm font-medium text-success-800 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Patient Discharged
                  </h3>
                  <p className="text-xs text-success-700 mt-1">
                    The patient has been successfully discharged.
                  </p>
                  <button 
                    className="mt-2 text-xs font-medium text-success-700 hover:text-success-900 underline"
                    onClick={() => navigate('/patients')}
                  >
                    Return to patient list
                  </button>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3 space-y-3">
                <button
                  onClick={handleDischargePatient}
                  className="btn btn-outline w-full justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete & Discharge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationForm;