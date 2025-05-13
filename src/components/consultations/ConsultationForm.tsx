import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { User, Calendar, FileText, Save, ArrowLeft, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Stethoscope, Heart, Settings as Lungs, Pill, Activity, Brain, Microscope, FileImage, Search, Plus, Trash2, Clock, CalendarClock, FileCheck, Send, Printer, Loader2, X, Check, ArrowRight, Clipboard, ClipboardCheck, Bone, Thermometer, Droplets, Scale, Ruler, Calculator, Bell, FlaskConical as Flask, Info, UserRound, Home, Briefcase, Users, Scroll, Layers, Dna, Settings as LungsIcon, Skull, Stethoscope as StethoscopeIcon, Utensils, LucideKey as Kidney, Baby } from 'lucide-react';

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

// Patient History interfaces
interface PatientHistory {
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  gynecologicalHistory: string;
  pastMedicalHistory: string;
  pastSurgicalHistory: string;
  isExpanded: boolean;
}

interface FamilySocioeconomicHistory {
  familyHistory: string;
  socialHistory: string;
  occupationalHistory: string;
  economicStatus: string;
  isExpanded: boolean;
}

interface GeneralExamination {
  generalAppearance: string;
  consciousness: string;
  hydration: string;
  pallor: string;
  cyanosis: string;
  jaundice: string;
  clubbing: string;
  lymphadenopathy: string;
  edema: string;
  isExpanded: boolean;
}

interface SystemicExamination {
  cardiovascular: {
    inspection: string;
    palpation: string;
    percussion: string;
    auscultation: string;
    isExpanded: boolean;
  };
  respiratory: {
    inspection: string;
    palpation: string;
    percussion: string;
    auscultation: string;
    isExpanded: boolean;
  };
  gastrointestinal: {
    inspection: string;
    palpation: string;
    percussion: string;
    auscultation: string;
    isExpanded: boolean;
  };
  genitourinary: {
    examination: string;
    isExpanded: boolean;
  };
  neurological: {
    mentalStatus: string;
    cranialNerves: string;
    motorSystem: string;
    sensorySystem: string;
    reflexes: string;
    isExpanded: boolean;
  };
  musculoskeletal: {
    examination: string;
    isExpanded: boolean;
  };
  breast: {
    examination: string;
    isExpanded: boolean;
  };
  isExpanded: boolean;
}

const ConsultationForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'prescriptions' | 'orders' | 'notes'>('assessment');
  
  // Assessment state
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [medicalCertificate, setMedicalCertificate] = useState(false);
  const [medicalCertificateDays, setMedicalCertificateDays] = useState(1);
  
  // Prescriptions state
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState<Medication>({
    id: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    quantity: 0,
    inStock: true,
    isCustom: false
  });
  const [showAddMedication, setShowAddMedication] = useState(false);
  
  // Orders state
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [showAddLabTest, setShowAddLabTest] = useState(false);
  const [showAddRadiologyTest, setShowAddRadiologyTest] = useState(false);
  const [newLabTest, setNewLabTest] = useState('');
  const [newRadiologyTest, setNewRadiologyTest] = useState('');
  
  // Follow-up state
  const [followUpAppointment, setFollowUpAppointment] = useState<Appointment | null>(null);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpPurpose, setFollowUpPurpose] = useState('');
  
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
  
  // Patient History
  const [patientHistory, setPatientHistory] = useState<PatientHistory>({
    chiefComplaint: '',
    historyOfPresentingIllness: '',
    gynecologicalHistory: '',
    pastMedicalHistory: '',
    pastSurgicalHistory: '',
    isExpanded: true
  });

  // Family and Socioeconomic History
  const [familySocioeconomicHistory, setFamilySocioeconomicHistory] = useState<FamilySocioeconomicHistory>({
    familyHistory: '',
    socialHistory: '',
    occupationalHistory: '',
    economicStatus: '',
    isExpanded: true
  });

  // General Examination
  const [generalExamination, setGeneralExamination] = useState<GeneralExamination>({
    generalAppearance: '',
    consciousness: 'Alert and oriented',
    hydration: 'Well hydrated',
    pallor: 'Absent',
    cyanosis: 'Absent',
    jaundice: 'Absent',
    clubbing: 'Absent',
    lymphadenopathy: 'Absent',
    edema: 'Absent',
    isExpanded: true
  });

  // Systemic Examination
  const [systemicExamination, setSystemicExamination] = useState<SystemicExamination>({
    cardiovascular: {
      inspection: '',
      palpation: '',
      percussion: '',
      auscultation: '',
      isExpanded: true
    },
    respiratory: {
      inspection: '',
      palpation: '',
      percussion: '',
      auscultation: '',
      isExpanded: true
    },
    gastrointestinal: {
      inspection: '',
      palpation: '',
      percussion: '',
      auscultation: '',
      isExpanded: true
    },
    genitourinary: {
      examination: '',
      isExpanded: true
    },
    neurological: {
      mentalStatus: '',
      cranialNerves: '',
      motorSystem: '',
      sensorySystem: '',
      reflexes: '',
      isExpanded: true
    },
    musculoskeletal: {
      examination: '',
      isExpanded: true
    },
    breast: {
      examination: '',
      isExpanded: true
    },
    isExpanded: true
  });
  
  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchVitalSigns();
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
        
        // Set chief complaint
        setPatientHistory(prev => ({
          ...prev,
          chiefComplaint: 'Chest pain and shortness of breath for 3 days'
        }));
        
        // Mock medications
        setMedications([
          {
            id: '1',
            medication: 'Amoxicillin',
            dosage: '500mg',
            frequency: 'Three times daily',
            duration: '7 days',
            instructions: 'Take with food',
            quantity: 21,
            inStock: true,
            isCustom: false
          }
        ]);
        
        // Mock lab tests
        setLabTests([
          {
            id: '1',
            name: 'Complete Blood Count',
            status: 'ordered',
            ordered_at: new Date().toISOString()
          }
        ]);
        
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
        // Mock vital signs for development
        setVitalSigns({
          temperature: 37.2,
          heart_rate: 72,
          respiratory_rate: 16,
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          oxygen_saturation: 98,
          weight: 70,
          height: 175,
          bmi: 22.9,
          pain_level: 2
        });
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
        if (error.code !== 'PGRST116') { // Not found error
          throw error;
        }
      } else if (data) {
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

  const handleAddMedication = () => {
    if (!newMedication.medication || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      addNotification({
        message: 'Please fill in all required medication fields',
        type: 'warning'
      });
      return;
    }
    
    const medicationWithId = {
      ...newMedication,
      id: Date.now().toString()
    };
    
    setMedications([...medications, medicationWithId]);
    setNewMedication({
      id: '',
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: 0,
      inStock: true,
      isCustom: false
    });
    setShowAddMedication(false);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleAddLabTest = () => {
    if (!newLabTest) {
      addNotification({
        message: 'Please select a lab test',
        type: 'warning'
      });
      return;
    }
    
    const test: LabTest = {
      id: Date.now().toString(),
      name: newLabTest,
      status: 'ordered',
      ordered_at: new Date().toISOString()
    };
    
    setLabTests([...labTests, test]);
    setNewLabTest('');
    setShowAddLabTest(false);
  };

  const handleRemoveLabTest = (id: string) => {
    setLabTests(labTests.filter(test => test.id !== id));
  };

  const handleAddRadiologyTest = () => {
    if (!newRadiologyTest) {
      addNotification({
        message: 'Please select a radiology test',
        type: 'warning'
      });
      return;
    }
    
    const test: RadiologyTest = {
      id: Date.now().toString(),
      name: newRadiologyTest,
      status: 'ordered',
      ordered_at: new Date().toISOString()
    };
    
    setRadiologyTests([...radiologyTests, test]);
    setNewRadiologyTest('');
    setShowAddRadiologyTest(false);
  };

  const handleRemoveRadiologyTest = (id: string) => {
    setRadiologyTests(radiologyTests.filter(test => test.id !== id));
  };

  const handleAddFollowUp = () => {
    if (!followUpDate || !followUpTime || !followUpPurpose) {
      addNotification({
        message: 'Please fill in all follow-up appointment fields',
        type: 'warning'
      });
      return;
    }
    
    const appointment: Appointment = {
      id: Date.now().toString(),
      date: followUpDate,
      time: followUpTime,
      purpose: followUpPurpose,
      department: 'General Medicine',
      doctor: `Dr. ${user?.first_name} ${user?.last_name}`
    };
    
    setFollowUpAppointment(appointment);
    setShowAddFollowUp(false);
  };

  const handleRemoveFollowUp = () => {
    setFollowUpAppointment(null);
  };

  const validateForm = () => {
    if (!patientHistory.chiefComplaint) {
      addNotification({
        message: 'Chief complaint is required',
        type: 'warning'
      });
      setActiveTab('assessment');
      return false;
    }
    
    if (!diagnosis) {
      addNotification({
        message: 'Diagnosis is required',
        type: 'warning'
      });
      setActiveTab('assessment');
      return false;
    }
    
    if (!treatmentPlan) {
      addNotification({
        message: 'Treatment plan is required',
        type: 'warning'
      });
      setActiveTab('assessment');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!patient || !user || !hospital) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', {
          patientHistory,
          familySocioeconomicHistory,
          generalExamination,
          systemicExamination,
          diagnosis,
          treatmentPlan,
          notes,
          medicalCertificate,
          medications,
          labTests,
          radiologyTests,
          followUpAppointment
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
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
          chief_complaint: patientHistory.chiefComplaint,
          diagnosis: diagnosis,
          treatment_plan: treatmentPlan,
          notes: notes,
          medical_certificate: medicalCertificate,
          prescriptions: medications.map(med => ({
            medication: med.medication,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
          })),
          department_id: user.department_id || null,
          clinical_data: {
            patient_history: patientHistory,
            family_socioeconomic_history: familySocioeconomicHistory,
            general_examination: generalExamination,
            systemic_examination: systemicExamination
          }
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab test orders if any
      if (labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(
            labTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: test.name.toLowerCase().replace(/\s+/g, '_'),
              test_date: new Date().toISOString(),
              status: 'pending',
              is_emergency: false
            }))
          );

        if (labError) throw labError;
      }
      
      // Create radiology test orders if any
      if (radiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(
            radiologyTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: test.name.toLowerCase().replace(/\s+/g, '_'),
              scan_date: new Date().toISOString(),
              status: 'pending',
              is_emergency: false
            }))
          );

        if (radiologyError) throw radiologyError;
      }
      
      // Create follow-up appointment if any
      if (followUpAppointment) {
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            patient_id: patient.id,
            doctor_id: user.id,
            hospital_id: hospital.id,
            department_id: user.department_id || null,
            date: followUpAppointment.date,
            start_time: followUpAppointment.time,
            end_time: new Date(`${followUpAppointment.date}T${followUpAppointment.time}`).getTime() + 30 * 60 * 1000,
            status: 'scheduled',
            notes: followUpAppointment.purpose
          });

        if (appointmentError) throw appointmentError;
      }
      
      // Create pharmacy order if medications are prescribed
      if (medications.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultation.id,
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
            payment_status: 'pending',
            is_emergency: false
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // Update patient's current flow step
      const nextStep = medications.length > 0 ? 'pharmacy' : 
                      (labTests.length > 0 ? 'lab_tests' : 
                      (radiologyTests.length > 0 ? 'radiology' : 'post_consultation'));
      
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
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-3 p-1.5 rounded-full text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Consultation</h1>
              <p className="text-primary-100 text-xs">
                {patient.first_name} {patient.last_name} • {calculateAge(patient.date_of_birth)} years • {patient.gender}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfirmation(true)}
              className="btn bg-white text-primary-600 hover:bg-white/90 shadow-sm flex items-center py-1.5 px-3 text-sm"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Complete & Save
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              activeTab === 'assessment'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Stethoscope className="h-4 w-4 inline mr-1.5" />
            Assessment
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              activeTab === 'prescriptions'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Pill className="h-4 w-4 inline mr-1.5" />
            Prescriptions {medications.length > 0 && `(${medications.length})`}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              activeTab === 'orders'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Flask className="h-4 w-4 inline mr-1.5" />
            Orders {(labTests.length + radiologyTests.length) > 0 && `(${labTests.length + radiologyTests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              activeTab === 'notes'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-1.5" />
            Notes
          </button>
        </div>
      </div>

      {/* Patient Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vital Signs */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900 flex items-center">
              <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
              Vital Signs
            </h2>
            <span className="text-xs text-gray-500">Last recorded</span>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <Thermometer className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                  <span className="text-xs text-gray-500">Temperature</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {vitalSigns.temperature ? `${vitalSigns.temperature}°C` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <Heart className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                  <span className="text-xs text-gray-500">Heart Rate</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {vitalSigns.heart_rate ? `${vitalSigns.heart_rate} bpm` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <Lungs className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                  <span className="text-xs text-gray-500">Respiratory Rate</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {vitalSigns.respiratory_rate ? `${vitalSigns.respiratory_rate} bpm` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <Activity className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                  <span className="text-xs text-gray-500">Blood Pressure</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic 
                    ? `${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic} mmHg` 
                    : 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <Droplets className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                  <span className="text-xs text-gray-500">O₂ Saturation</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {vitalSigns.oxygen_saturation ? `${vitalSigns.oxygen_saturation}%` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <Scale className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                  <span className="text-xs text-gray-500">Weight</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {vitalSigns.weight ? `${vitalSigns.weight} kg` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Allergies */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-4 w-4 text-error-500 mr-1.5" />
              Allergies
            </h2>
            <Link to={`/patients/${patient.id}/allergies`} className="text-xs text-primary-600 hover:text-primary-800">
              View All
            </Link>
          </div>
          
          <div className="space-y-2">
            {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 ? (
              patient.medical_history.allergies.map((allergy: any, index: number) => (
                <div key={index} className="bg-error-50 p-2 rounded-lg border border-error-100">
                  <p className="text-sm font-medium text-error-800">{allergy.allergen}</p>
                  <p className="text-xs text-error-600 mt-0.5">
                    {allergy.reaction} • {allergy.severity}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-sm text-gray-500">No known allergies</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Chronic Conditions */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900 flex items-center">
              <Activity className="h-4 w-4 text-warning-500 mr-1.5" />
              Chronic Conditions
            </h2>
            <Link to={`/patients/${patient.id}/medical-history`} className="text-xs text-primary-600 hover:text-primary-800">
              View All
            </Link>
          </div>
          
          <div className="space-y-2">
            {patient.medical_history?.chronicConditions && patient.medical_history.chronicConditions.length > 0 ? (
              patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                <div key={index} className="bg-warning-50 p-2 rounded-lg border border-warning-100">
                  <p className="text-sm font-medium text-warning-800">{condition}</p>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-sm text-gray-500">No chronic conditions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="p-5 space-y-5 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Patient History Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => setPatientHistory({...patientHistory, isExpanded: !patientHistory.isExpanded})}
              >
                <div className="flex items-center">
                  <Scroll className="h-4 w-4 text-primary-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">1. Patient History</h3>
                </div>
                {patientHistory.isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {patientHistory.isExpanded && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label required text-sm">Chief Complaint</label>
                    <textarea
                      value={patientHistory.chiefComplaint}
                      onChange={(e) => setPatientHistory({...patientHistory, chiefComplaint: e.target.value})}
                      className="form-input py-2 text-sm rounded-lg"
                      rows={2}
                      placeholder="Enter the patient's main complaint"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">History of Presenting Illness</label>
                    <textarea
                      value={patientHistory.historyOfPresentingIllness}
                      onChange={(e) => setPatientHistory({...patientHistory, historyOfPresentingIllness: e.target.value})}
                      className="form-input py-2 text-sm rounded-lg"
                      rows={3}
                      placeholder="Describe the onset, duration, and progression of symptoms"
                    />
                  </div>
                  
                  {patient.gender === 'Female' && (
                    <div>
                      <label className="form-label text-sm">Gynecological/Obstetric History</label>
                      <textarea
                        value={patientHistory.gynecologicalHistory}
                        onChange={(e) => setPatientHistory({...patientHistory, gynecologicalHistory: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                        rows={2}
                        placeholder="LMP, pregnancies, deliveries, gynecological conditions"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Past Medical History</label>
                      <textarea
                        value={patientHistory.pastMedicalHistory}
                        onChange={(e) => setPatientHistory({...patientHistory, pastMedicalHistory: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                        rows={2}
                        placeholder="Previous medical conditions, hospitalizations"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Past Surgical History</label>
                      <textarea
                        value={patientHistory.pastSurgicalHistory}
                        onChange={(e) => setPatientHistory({...patientHistory, pastSurgicalHistory: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                        rows={2}
                        placeholder="Previous surgeries, procedures, dates"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Family and Socioeconomic History */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => setFamilySocioeconomicHistory({...familySocioeconomicHistory, isExpanded: !familySocioeconomicHistory.isExpanded})}
              >
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-primary-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">2. Family and Socioeconomic History</h3>
                </div>
                {familySocioeconomicHistory.isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {familySocioeconomicHistory.isExpanded && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">Family History</label>
                    <textarea
                      value={familySocioeconomicHistory.familyHistory}
                      onChange={(e) => setFamilySocioeconomicHistory({...familySocioeconomicHistory, familyHistory: e.target.value})}
                      className="form-input py-2 text-sm rounded-lg"
                      rows={2}
                      placeholder="Family history of diseases, genetic conditions"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Social History</label>
                      <textarea
                        value={familySocioeconomicHistory.socialHistory}
                        onChange={(e) => setFamilySocioeconomicHistory({...familySocioeconomicHistory, socialHistory: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                        rows={2}
                        placeholder="Smoking, alcohol, substance use, living situation"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Occupational History</label>
                      <textarea
                        value={familySocioeconomicHistory.occupationalHistory}
                        onChange={(e) => setFamilySocioeconomicHistory({...familySocioeconomicHistory, occupationalHistory: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                        rows={2}
                        placeholder="Current and past occupations, exposures"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Economic Status</label>
                    <select
                      value={familySocioeconomicHistory.economicStatus}
                      onChange={(e) => setFamilySocioeconomicHistory({...familySocioeconomicHistory, economicStatus: e.target.value})}
                      className="form-input py-2 text-sm rounded-lg"
                    >
                      <option value="">Select economic status</option>
                      <option value="Low income">Low income</option>
                      <option value="Middle income">Middle income</option>
                      <option value="High income">High income</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Retired">Retired</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* General Examination */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => setGeneralExamination({...generalExamination, isExpanded: !generalExamination.isExpanded})}
              >
                <div className="flex items-center">
                  <UserRound className="h-4 w-4 text-primary-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">3. General Examination</h3>
                </div>
                {generalExamination.isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {generalExamination.isExpanded && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">General Appearance</label>
                    <textarea
                      value={generalExamination.generalAppearance}
                      onChange={(e) => setGeneralExamination({...generalExamination, generalAppearance: e.target.value})}
                      className="form-input py-2 text-sm rounded-lg"
                      rows={2}
                      placeholder="Overall appearance, distress level, posture, gait"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="form-label text-sm">Consciousness</label>
                      <select
                        value={generalExamination.consciousness}
                        onChange={(e) => setGeneralExamination({...generalExamination, consciousness: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Alert and oriented">Alert and oriented</option>
                        <option value="Drowsy">Drowsy</option>
                        <option value="Lethargic">Lethargic</option>
                        <option value="Obtunded">Obtunded</option>
                        <option value="Stuporous">Stuporous</option>
                        <option value="Comatose">Comatose</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Hydration</label>
                      <select
                        value={generalExamination.hydration}
                        onChange={(e) => setGeneralExamination({...generalExamination, hydration: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Well hydrated">Well hydrated</option>
                        <option value="Mildly dehydrated">Mildly dehydrated</option>
                        <option value="Moderately dehydrated">Moderately dehydrated</option>
                        <option value="Severely dehydrated">Severely dehydrated</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Pallor</label>
                      <select
                        value={generalExamination.pallor}
                        onChange={(e) => setGeneralExamination({...generalExamination, pallor: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Absent">Absent</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Cyanosis</label>
                      <select
                        value={generalExamination.cyanosis}
                        onChange={(e) => setGeneralExamination({...generalExamination, cyanosis: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Absent">Absent</option>
                        <option value="Central">Central</option>
                        <option value="Peripheral">Peripheral</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Jaundice</label>
                      <select
                        value={generalExamination.jaundice}
                        onChange={(e) => setGeneralExamination({...generalExamination, jaundice: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Absent">Absent</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Clubbing</label>
                      <select
                        value={generalExamination.clubbing}
                        onChange={(e) => setGeneralExamination({...generalExamination, clubbing: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Absent">Absent</option>
                        <option value="Grade 1">Grade 1</option>
                        <option value="Grade 2">Grade 2</option>
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Lymphadenopathy</label>
                      <select
                        value={generalExamination.lymphadenopathy}
                        onChange={(e) => setGeneralExamination({...generalExamination, lymphadenopathy: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Absent">Absent</option>
                        <option value="Cervical">Cervical</option>
                        <option value="Axillary">Axillary</option>
                        <option value="Inguinal">Inguinal</option>
                        <option value="Generalized">Generalized</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Edema</label>
                      <select
                        value={generalExamination.edema}
                        onChange={(e) => setGeneralExamination({...generalExamination, edema: e.target.value})}
                        className="form-input py-2 text-sm rounded-lg"
                      >
                        <option value="Absent">Absent</option>
                        <option value="Pedal">Pedal</option>
                        <option value="Pretibial">Pretibial</option>
                        <option value="Anasarca">Anasarca</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Systemic Examination */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => setSystemicExamination({...systemicExamination, isExpanded: !systemicExamination.isExpanded})}
              >
                <div className="flex items-center">
                  <Layers className="h-4 w-4 text-primary-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">4. Systemic Examination</h3>
                </div>
                {systemicExamination.isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {systemicExamination.isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Cardiovascular System */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        cardiovascular: {
                          ...systemicExamination.cardiovascular,
                          isExpanded: !systemicExamination.cardiovascular.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 text-error-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Cardiovascular System</h4>
                      </div>
                      {systemicExamination.cardiovascular.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.cardiovascular.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Inspection</label>
                          <textarea
                            value={systemicExamination.cardiovascular.inspection}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              cardiovascular: {
                                ...systemicExamination.cardiovascular,
                                inspection: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Visible pulsations, scars, deformities"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Palpation</label>
                          <textarea
                            value={systemicExamination.cardiovascular.palpation}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              cardiovascular: {
                                ...systemicExamination.cardiovascular,
                                palpation: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Apex beat, thrills, heaves"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Percussion</label>
                          <textarea
                            value={systemicExamination.cardiovascular.percussion}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              cardiovascular: {
                                ...systemicExamination.cardiovascular,
                                percussion: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Cardiac borders"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Auscultation</label>
                          <textarea
                            value={systemicExamination.cardiovascular.auscultation}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              cardiovascular: {
                                ...systemicExamination.cardiovascular,
                                auscultation: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Heart sounds, murmurs, rubs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Respiratory System */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        respiratory: {
                          ...systemicExamination.respiratory,
                          isExpanded: !systemicExamination.respiratory.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <LungsIcon className="h-4 w-4 text-primary-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Respiratory System</h4>
                      </div>
                      {systemicExamination.respiratory.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.respiratory.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Inspection</label>
                          <textarea
                            value={systemicExamination.respiratory.inspection}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              respiratory: {
                                ...systemicExamination.respiratory,
                                inspection: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Respiratory rate, pattern, use of accessory muscles"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Palpation</label>
                          <textarea
                            value={systemicExamination.respiratory.palpation}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              respiratory: {
                                ...systemicExamination.respiratory,
                                palpation: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Chest expansion, tactile fremitus"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Percussion</label>
                          <textarea
                            value={systemicExamination.respiratory.percussion}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              respiratory: {
                                ...systemicExamination.respiratory,
                                percussion: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Resonance, dullness"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Auscultation</label>
                          <textarea
                            value={systemicExamination.respiratory.auscultation}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              respiratory: {
                                ...systemicExamination.respiratory,
                                auscultation: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Breath sounds, added sounds"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Gastrointestinal System */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        gastrointestinal: {
                          ...systemicExamination.gastrointestinal,
                          isExpanded: !systemicExamination.gastrointestinal.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <Utensils className="h-4 w-4 text-warning-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Gastrointestinal System</h4>
                      </div>
                      {systemicExamination.gastrointestinal.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.gastrointestinal.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Inspection</label>
                          <textarea
                            value={systemicExamination.gastrointestinal.inspection}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              gastrointestinal: {
                                ...systemicExamination.gastrointestinal,
                                inspection: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Abdominal contour, visible peristalsis, scars"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Palpation</label>
                          <textarea
                            value={systemicExamination.gastrointestinal.palpation}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              gastrointestinal: {
                                ...systemicExamination.gastrointestinal,
                                palpation: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Tenderness, organomegaly, masses"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Percussion</label>
                          <textarea
                            value={systemicExamination.gastrointestinal.percussion}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              gastrointestinal: {
                                ...systemicExamination.gastrointestinal,
                                percussion: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Liver span, shifting dullness"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Auscultation</label>
                          <textarea
                            value={systemicExamination.gastrointestinal.auscultation}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              gastrointestinal: {
                                ...systemicExamination.gastrointestinal,
                                auscultation: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Bowel sounds, bruits"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Genitourinary System */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        genitourinary: {
                          ...systemicExamination.genitourinary,
                          isExpanded: !systemicExamination.genitourinary.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <Kidney className="h-4 w-4 text-secondary-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Genitourinary System</h4>
                      </div>
                      {systemicExamination.genitourinary.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.genitourinary.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Examination</label>
                          <textarea
                            value={systemicExamination.genitourinary.examination}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              genitourinary: {
                                ...systemicExamination.genitourinary,
                                examination: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={2}
                            placeholder="External genitalia, renal angle tenderness, suprapubic tenderness"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Neurological System */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        neurological: {
                          ...systemicExamination.neurological,
                          isExpanded: !systemicExamination.neurological.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 text-accent-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Neurological System</h4>
                      </div>
                      {systemicExamination.neurological.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.neurological.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Mental Status</label>
                          <textarea
                            value={systemicExamination.neurological.mentalStatus}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              neurological: {
                                ...systemicExamination.neurological,
                                mentalStatus: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Level of consciousness, orientation, memory, speech"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Cranial Nerves</label>
                          <textarea
                            value={systemicExamination.neurological.cranialNerves}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              neurological: {
                                ...systemicExamination.neurological,
                                cranialNerves: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={1}
                            placeholder="Examination of cranial nerves I-XII"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="form-label text-xs">Motor System</label>
                            <textarea
                              value={systemicExamination.neurological.motorSystem}
                              onChange={(e) => setSystemicExamination({
                                ...systemicExamination,
                                neurological: {
                                  ...systemicExamination.neurological,
                                  motorSystem: e.target.value
                                }
                              })}
                              className="form-input py-1.5 text-sm rounded-lg"
                              rows={1}
                              placeholder="Tone, power, coordination"
                            />
                          </div>
                          
                          <div>
                            <label className="form-label text-xs">Sensory System</label>
                            <textarea
                              value={systemicExamination.neurological.sensorySystem}
                              onChange={(e) => setSystemicExamination({
                                ...systemicExamination,
                                neurological: {
                                  ...systemicExamination.neurological,
                                  sensorySystem: e.target.value
                                }
                              })}
                              className="form-input py-1.5 text-sm rounded-lg"
                              rows={1}
                              placeholder="Touch, pain, temperature, position"
                            />
                          </div>
                          
                          <div>
                            <label className="form-label text-xs">Reflexes</label>
                            <textarea
                              value={systemicExamination.neurological.reflexes}
                              onChange={(e) => setSystemicExamination({
                                ...systemicExamination,
                                neurological: {
                                  ...systemicExamination.neurological,
                                  reflexes: e.target.value
                                }
                              })}
                              className="form-input py-1.5 text-sm rounded-lg"
                              rows={1}
                              placeholder="Deep tendon reflexes, plantar response"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Musculoskeletal System */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        musculoskeletal: {
                          ...systemicExamination.musculoskeletal,
                          isExpanded: !systemicExamination.musculoskeletal.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <Bone className="h-4 w-4 text-warning-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Musculoskeletal System</h4>
                      </div>
                      {systemicExamination.musculoskeletal.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.musculoskeletal.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Examination</label>
                          <textarea
                            value={systemicExamination.musculoskeletal.examination}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              musculoskeletal: {
                                ...systemicExamination.musculoskeletal,
                                examination: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={2}
                            placeholder="Joints, muscles, range of motion, deformities, tenderness"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Breast Examination */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer"
                      onClick={() => setSystemicExamination({
                        ...systemicExamination, 
                        breast: {
                          ...systemicExamination.breast,
                          isExpanded: !systemicExamination.breast.isExpanded
                        }
                      })}
                    >
                      <div className="flex items-center">
                        <UserRound className="h-4 w-4 text-primary-500 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Breast Examination</h4>
                      </div>
                      {systemicExamination.breast.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {systemicExamination.breast.isExpanded && (
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="form-label text-xs">Examination</label>
                          <textarea
                            value={systemicExamination.breast.examination}
                            onChange={(e) => setSystemicExamination({
                              ...systemicExamination,
                              breast: {
                                ...systemicExamination.breast,
                                examination: e.target.value
                              }
                            })}
                            className="form-input py-1.5 text-sm rounded-lg"
                            rows={2}
                            placeholder="Inspection, palpation, masses, discharge, lymph nodes"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Diagnosis and Treatment Plan */}
            <div>
              <label className="form-label required text-sm">Diagnosis</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="form-input py-2 text-sm rounded-lg"
                rows={2}
                placeholder="Enter diagnosis"
              />
            </div>
            
            <div>
              <label className="form-label required text-sm">Treatment Plan</label>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className="form-input py-2 text-sm rounded-lg"
                rows={3}
                placeholder="Enter treatment plan"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="medicalCertificate"
                checked={medicalCertificate}
                onChange={(e) => setMedicalCertificate(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                Issue Medical Certificate
              </label>
              
              {medicalCertificate && (
                <div className="ml-4 flex items-center">
                  <span className="text-sm text-gray-700 mr-2">for</span>
                  <input
                    type="number"
                    value={medicalCertificateDays}
                    onChange={(e) => setMedicalCertificateDays(parseInt(e.target.value))}
                    min={1}
                    max={30}
                    className="form-input py-1 text-sm w-16 rounded-lg"
                  />
                  <span className="text-sm text-gray-700 ml-2">day(s)</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="p-5 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-medium text-gray-900">Medications</h2>
              <button
                onClick={() => setShowAddMedication(true)}
                className="btn btn-primary inline-flex items-center text-xs py-1.5 px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Medication
              </button>
            </div>
            
            {medications.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Pill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No medications prescribed yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Medication" to prescribe medications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((medication) => (
                  <div key={medication.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{medication.medication}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {medication.dosage} • {medication.frequency} • {medication.duration}
                        </p>
                        {medication.instructions && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Instructions:</span> {medication.instructions}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Quantity:</span> {medication.quantity} units
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${medication.inStock ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'}`}>
                          {medication.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <button
                          onClick={() => handleRemoveMedication(medication.id)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showAddMedication && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Add Medication</h3>
                  <button
                    onClick={() => setShowAddMedication(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="form-label required text-xs">Medication</label>
                    <input
                      type="text"
                      value={newMedication.medication}
                      onChange={(e) => setNewMedication({...newMedication, medication: e.target.value})}
                      className="form-input py-1.5 text-sm rounded-lg"
                      placeholder="Medication name"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label required text-xs">Dosage</label>
                    <input
                      type="text"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                      className="form-input py-1.5 text-sm rounded-lg"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label required text-xs">Frequency</label>
                    <select
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                      className="form-input py-1.5 text-sm rounded-lg"
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
                      <option value="As needed">As needed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label required text-xs">Duration</label>
                    <select
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                      className="form-input py-1.5 text-sm rounded-lg"
                    >
                      <option value="">Select duration</option>
                      <option value="3 days">3 days</option>
                      <option value="5 days">5 days</option>
                      <option value="7 days">7 days</option>
                      <option value="10 days">10 days</option>
                      <option value="14 days">14 days</option>
                      <option value="1 month">1 month</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="Indefinite">Indefinite</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label text-xs">Instructions</label>
                    <input
                      type="text"
                      value={newMedication.instructions}
                      onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                      className="form-input py-1.5 text-sm rounded-lg"
                      placeholder="e.g., Take with food"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label required text-xs">Quantity</label>
                    <input
                      type="number"
                      value={newMedication.quantity || ''}
                      onChange={(e) => setNewMedication({...newMedication, quantity: parseInt(e.target.value)})}
                      min={1}
                      className="form-input py-1.5 text-sm rounded-lg"
                      placeholder="Number of units"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddMedication(false)}
                    className="btn btn-outline py-1.5 text-xs px-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMedication}
                    className="btn btn-primary py-1.5 text-xs px-3"
                  >
                    Add Medication
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="p-5 space-y-5">
            {/* Lab Tests */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-medium text-gray-900">Laboratory Tests</h2>
                <button
                  onClick={() => setShowAddLabTest(true)}
                  className="btn btn-primary inline-flex items-center text-xs py-1.5 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Order Lab Test
                </button>
              </div>
              
              {labTests.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <Flask className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No laboratory tests ordered yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Order Lab Test" to request laboratory tests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {labTests.map((test) => (
                    <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <Flask className="h-4 w-4 text-primary-500 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Ordered: {new Date(test.ordered_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">
                            Pending
                          </span>
                          <button
                            onClick={() => handleRemoveLabTest(test.id)}
                            className="text-gray-400 hover:text-error-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showAddLabTest && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Order Laboratory Test</h3>
                    <button
                      onClick={() => setShowAddLabTest(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="form-label required text-xs">Test Type</label>
                      <select
                        value={newLabTest}
                        onChange={(e) => setNewLabTest(e.target.value)}
                        className="form-input py-1.5 text-sm rounded-lg"
                      >
                        <option value="">Select test type</option>
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
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowAddLabTest(false)}
                        className="btn btn-outline py-1.5 text-xs px-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddLabTest}
                        className="btn btn-primary py-1.5 text-xs px-3"
                      >
                        Order Test
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Radiology Tests */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-medium text-gray-900">Radiology Tests</h2>
                <button
                  onClick={() => setShowAddRadiologyTest(true)}
                  className="btn btn-primary inline-flex items-center text-xs py-1.5 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Order Radiology
                </button>
              </div>
              
              {radiologyTests.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No radiology tests ordered yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Order Radiology" to request imaging tests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {radiologyTests.map((test) => (
                    <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <FileImage className="h-4 w-4 text-secondary-500 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Ordered: {new Date(test.ordered_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">
                            Pending
                          </span>
                          <button
                            onClick={() => handleRemoveRadiologyTest(test.id)}
                            className="text-gray-400 hover:text-error-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showAddRadiologyTest && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Order Radiology Test</h3>
                    <button
                      onClick={() => setShowAddRadiologyTest(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="form-label required text-xs">Scan Type</label>
                      <select
                        value={newRadiologyTest}
                        onChange={(e) => setNewRadiologyTest(e.target.value)}
                        className="form-input py-1.5 text-sm rounded-lg"
                      >
                        <option value="">Select scan type</option>
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
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowAddRadiologyTest(false)}
                        className="btn btn-outline py-1.5 text-xs px-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddRadiologyTest}
                        className="btn btn-primary py-1.5 text-xs px-3"
                      >
                        Order Scan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Follow-up Appointment */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-medium text-gray-900">Follow-up Appointment</h2>
                {!followUpAppointment && (
                  <button
                    onClick={() => setShowAddFollowUp(true)}
                    className="btn btn-primary inline-flex items-center text-xs py-1.5 px-3"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Schedule Follow-up
                  </button>
                )}
              </div>
              
              {!followUpAppointment ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No follow-up appointment scheduled</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Schedule Follow-up" to set a follow-up appointment</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-primary-500 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Follow-up Appointment</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(followUpAppointment.date).toLocaleDateString()} at {followUpAppointment.time}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Purpose: {followUpAppointment.purpose}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                        Scheduled
                      </span>
                      <button
                        onClick={handleRemoveFollowUp}
                        className="text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {showAddFollowUp && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Schedule Follow-up</h3>
                    <button
                      onClick={() => setShowAddFollowUp(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label required text-xs">Date</label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="form-input py-1.5 text-sm rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label required text-xs">Time</label>
                        <input
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="form-input py-1.5 text-sm rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label required text-xs">Purpose</label>
                      <input
                        type="text"
                        value={followUpPurpose}
                        onChange={(e) => setFollowUpPurpose(e.target.value)}
                        className="form-input py-1.5 text-sm rounded-lg"
                        placeholder="e.g., Follow-up on treatment progress"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowAddFollowUp(false)}
                        className="btn btn-outline py-1.5 text-xs px-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddFollowUp}
                        className="btn btn-primary py-1.5 text-xs px-3"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-5 space-y-5">
            <div>
              <label className="form-label text-sm">Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input py-2 text-sm rounded-lg"
                rows={6}
                placeholder="Enter any additional notes about the patient's condition, treatment, or follow-up instructions..."
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Documentation Guidelines</h3>
                  <ul className="mt-1 text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Document all relevant clinical findings</li>
                    <li>Include your clinical reasoning for diagnosis and treatment</li>
                    <li>Note any patient education provided</li>
                    <li>Document any referrals or follow-up plans</li>
                    <li>Include any specific instructions given to the patient</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline py-2 text-sm px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </button>
        <div className="space-x-3">
          <button
            onClick={() => setShowConfirmation(true)}
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
                Complete & Save
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Complete Consultation</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to complete this consultation? This will:
            </p>
            <ul className="mb-4 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Save the consultation notes and diagnosis</span>
              </li>
              {medications.length > 0 && (
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Send {medications.length} medication(s) to pharmacy</span>
                </li>
              )}
              {labTests.length > 0 && (
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Order {labTests.length} laboratory test(s)</span>
                </li>
              )}
              {radiologyTests.length > 0 && (
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Order {radiologyTests.length} radiology scan(s)</span>
                </li>
              )}
              {followUpAppointment && (
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Schedule a follow-up appointment</span>
                </li>
              )}
              {medicalCertificate && (
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Issue a medical certificate for {medicalCertificateDays} day(s)</span>
                </li>
              )}
            </ul>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn btn-outline py-2 text-sm px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary py-2 text-sm px-4"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm & Complete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;