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
  Activity, 
  AlertTriangle, 
  Stethoscope, 
  Heart, 
  Lungs, 
  Thermometer, 
  Droplets, 
  Brain, 
  Bone, 
  Microscope, 
  FileImage, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  X, 
  Check, 
  ArrowRight, 
  Clipboard, 
  ClipboardList, 
  Loader2 
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
    breast: string;
    other: string;
  };
  diagnosis: string;
  differentialDiagnosis: string;
  investigations: {
    laboratory: {
      selected: boolean;
      tests: string[];
    };
    radiology: {
      selected: boolean;
      tests: string[];
    };
    other: {
      selected: boolean;
      tests: string[];
    };
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

const defaultFormData: ConsultationFormData = {
  patientId: '',
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
    oxygenSaturation: '',
  },
  systemicExamination: {
    cardiovascular: '',
    respiratory: '',
    gastrointestinal: '',
    neurological: '',
    musculoskeletal: '',
    genitourinary: '',
    breast: '',
    other: '',
  },
  diagnosis: '',
  differentialDiagnosis: '',
  investigations: {
    laboratory: {
      selected: false,
      tests: [],
    },
    radiology: {
      selected: false,
      tests: [],
    },
    other: {
      selected: false,
      tests: [],
    },
  },
  treatmentPlan: '',
  medications_prescribed: [],
  followUp: '',
  notes: '',
  medicalCertificate: false,
  medicalCertificateDays: 0,
};

const laboratoryTests = [
  'Complete Blood Count (CBC)',
  'Comprehensive Metabolic Panel (CMP)',
  'Lipid Panel',
  'Thyroid Function Tests',
  'Hemoglobin A1C',
  'Urinalysis',
  'Liver Function Tests',
  'Kidney Function Tests',
  'Electrolytes',
  'Blood Glucose',
  'Coagulation Studies',
  'C-Reactive Protein (CRP)',
  'Erythrocyte Sedimentation Rate (ESR)',
  'Blood Culture',
  'Urine Culture',
  'Stool Analysis',
  'Hepatitis Panel',
  'HIV Test',
  'Tuberculosis Test',
  'Pregnancy Test',
];

const radiologyTests = [
  'Chest X-ray',
  'Abdominal X-ray',
  'Bone X-ray',
  'CT Scan - Head',
  'CT Scan - Chest',
  'CT Scan - Abdomen',
  'MRI - Brain',
  'MRI - Spine',
  'MRI - Joints',
  'Ultrasound - Abdomen',
  'Ultrasound - Pelvis',
  'Ultrasound - Cardiac',
  'Mammogram',
  'Bone Density Scan',
  'PET Scan',
  'Angiography',
  'Fluoroscopy',
  'Barium Study',
  'Myelography',
  'Echocardiogram',
];

const otherTests = [
  'Electrocardiogram (ECG/EKG)',
  'Electroencephalogram (EEG)',
  'Electromyography (EMG)',
  'Nerve Conduction Study',
  'Pulmonary Function Tests',
  'Sleep Study',
  'Endoscopy',
  'Colonoscopy',
  'Bronchoscopy',
  'Cystoscopy',
  'Biopsy',
  'Allergy Testing',
  'Audiometry',
  'Vision Testing',
  'Stress Test',
  'Holter Monitor',
  'Spirometry',
  'Tonometry',
  'Lumbar Puncture',
  'Bone Marrow Aspiration',
];

const ConsultationForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [formData, setFormData] = useState<ConsultationFormData>(defaultFormData);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'examination' | 'diagnosis' | 'orders' | 'treatment' | 'summary'>('history');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    patientHistory: true,
    familyHistory: false,
    generalExamination: false,
    systemicExamination: false,
    diagnosis: false,
    investigations: false,
    treatmentPlan: false,
    medications: false,
    followUp: false,
  });
  const [newMedication, setNewMedication] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [selectedLaboratoryTests, setSelectedLaboratoryTests] = useState<string[]>([]);
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState<string[]>([]);
  const [selectedOtherTests, setSelectedOtherTests] = useState<string[]>([]);
  const [customLaboratoryTest, setCustomLaboratoryTest] = useState('');
  const [customRadiologyTest, setCustomRadiologyTest] = useState('');
  const [customOtherTest, setCustomOtherTest] = useState('');

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
        setFormData(prev => ({
          ...prev,
          patientId: mockPatient.id,
          allergies: mockPatient.medical_history?.allergies?.map((a: any) => `${a.allergen} (${a.reaction}, ${a.severity})`).join('\n') || '',
          medications: mockPatient.medical_history?.currentMedications?.map((m: any) => `${m.name} ${m.dosage} ${m.frequency}`).join('\n') || '',
          pastMedicalHistory: mockPatient.medical_history?.chronicConditions?.join(', ') || '',
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
      
      // Pre-fill form with patient data
      if (data.medical_history) {
        setFormData(prev => ({
          ...prev,
          patientId: data.id,
          allergies: data.medical_history?.allergies?.map((a: any) => `${a.allergen} (${a.reaction}, ${a.severity})`).join('\n') || '',
          medications: data.medical_history?.currentMedications?.map((m: any) => `${m.name} ${m.dosage} ${m.frequency}`).join('\n') || '',
          pastMedicalHistory: data.medical_history?.chronicConditions?.join(', ') || '',
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ConsultationFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddMedication = () => {
    if (!newMedication.medication || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      addNotification({
        message: 'Please fill in all required medication fields',
        type: 'warning'
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      medications_prescribed: [...prev.medications_prescribed, { ...newMedication }]
    }));
    
    setNewMedication({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
    
    setShowAddMedication(false);
  };

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications_prescribed: prev.medications_prescribed.filter((_, i) => i !== index)
    }));
  };

  const handleTestSelection = (category: 'laboratory' | 'radiology' | 'other', test: string) => {
    if (category === 'laboratory') {
      if (selectedLaboratoryTests.includes(test)) {
        setSelectedLaboratoryTests(prev => prev.filter(t => t !== test));
      } else {
        setSelectedLaboratoryTests(prev => [...prev, test]);
      }
    } else if (category === 'radiology') {
      if (selectedRadiologyTests.includes(test)) {
        setSelectedRadiologyTests(prev => prev.filter(t => t !== test));
      } else {
        setSelectedRadiologyTests(prev => [...prev, test]);
      }
    } else {
      if (selectedOtherTests.includes(test)) {
        setSelectedOtherTests(prev => prev.filter(t => t !== test));
      } else {
        setSelectedOtherTests(prev => [...prev, test]);
      }
    }
  };

  const handleAddCustomTest = (category: 'laboratory' | 'radiology' | 'other') => {
    if (category === 'laboratory' && customLaboratoryTest) {
      setSelectedLaboratoryTests(prev => [...prev, customLaboratoryTest]);
      setCustomLaboratoryTest('');
    } else if (category === 'radiology' && customRadiologyTest) {
      setSelectedRadiologyTests(prev => [...prev, customRadiologyTest]);
      setCustomRadiologyTest('');
    } else if (category === 'other' && customOtherTest) {
      setSelectedOtherTests(prev => [...prev, customOtherTest]);
      setCustomOtherTest('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!formData.chiefComplaint || !formData.diagnosis) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        return;
      }
      
      // Prepare investigations data
      const investigations = {
        laboratory: {
          selected: selectedLaboratoryTests.length > 0,
          tests: selectedLaboratoryTests
        },
        radiology: {
          selected: selectedRadiologyTests.length > 0,
          tests: selectedRadiologyTests
        },
        other: {
          selected: selectedOtherTests.length > 0,
          tests: selectedOtherTests
        }
      };
      
      // Prepare prescriptions data
      const prescriptions = formData.medications_prescribed.map(med => ({
        medication: med.medication,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || ''
      }));
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', {
          ...formData,
          investigations,
          prescriptions
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
          hospital_id: hospital?.id,
          consultation_date: new Date().toISOString(),
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          notes: formData.notes,
          medical_certificate: formData.medicalCertificate,
          prescriptions: prescriptions.length > 0 ? prescriptions : null,
          department_id: user.department_id || null,
          // Additional fields
          history_of_presenting_illness: formData.historyOfPresentingIllness,
          past_medical_history: formData.pastMedicalHistory,
          past_surgical_history: formData.pastSurgicalHistory,
          family_history: formData.familyHistory,
          social_history: formData.socialHistory,
          gynecological_history: formData.gynecologicalHistory,
          general_examination: formData.generalExamination,
          vital_signs: formData.vitalSigns,
          systemic_examination: formData.systemicExamination,
          differential_diagnosis: formData.differentialDiagnosis,
          investigations: investigations,
          follow_up: formData.followUp,
          medical_certificate_days: formData.medicalCertificateDays || 0
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab tests if ordered
      if (investigations.laboratory.selected && investigations.laboratory.tests.length > 0) {
        const labTests = investigations.laboratory.tests.map(test => ({
          patient_id: patient.id,
          hospital_id: hospital?.id,
          test_type: test.toLowerCase().replace(/\s+/g, '_'),
          test_date: new Date().toISOString(),
          status: 'pending',
          is_emergency: formData.chiefComplaint.toLowerCase().includes('emergency') || 
                       formData.chiefComplaint.toLowerCase().includes('urgent')
        }));
        
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(labTests);
          
        if (labError) throw labError;
      }
      
      // Create radiology orders if ordered
      if (investigations.radiology.selected && investigations.radiology.tests.length > 0) {
        const radiologyOrders = investigations.radiology.tests.map(test => ({
          patient_id: patient.id,
          hospital_id: hospital?.id,
          scan_type: test.toLowerCase().includes('x-ray') ? 'x_ray' :
                    test.toLowerCase().includes('ct') ? 'ct_scan' :
                    test.toLowerCase().includes('mri') ? 'mri' :
                    test.toLowerCase().includes('ultrasound') ? 'ultrasound' :
                    test.toLowerCase().includes('mammogram') ? 'mammogram' :
                    test.toLowerCase().includes('pet') ? 'pet_scan' :
                    test.toLowerCase().includes('bone density') ? 'dexa_scan' :
                    test.toLowerCase().includes('fluoroscopy') ? 'fluoroscopy' :
                    'other',
          scan_date: new Date().toISOString(),
          status: 'pending',
          is_emergency: formData.chiefComplaint.toLowerCase().includes('emergency') || 
                       formData.chiefComplaint.toLowerCase().includes('urgent')
        }));
        
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(radiologyOrders);
          
        if (radiologyError) throw radiologyError;
      }
      
      // Create pharmacy order if medications prescribed
      if (prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital?.id,
            prescription_id: consultation.id,
            medications: prescriptions.map(med => ({
              medication: med.medication,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              instructions: med.instructions,
              quantity: parseInt(med.duration.split(' ')[0]) || 1,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: formData.chiefComplaint.toLowerCase().includes('emergency') || 
                         formData.chiefComplaint.toLowerCase().includes('urgent')
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      // Create billing record
      const services = [
        {
          name: 'Consultation',
          amount: 150,
          quantity: 1
        }
      ];
      
      if (investigations.laboratory.selected) {
        services.push({
          name: 'Laboratory Tests',
          amount: 75 * investigations.laboratory.tests.length,
          quantity: investigations.laboratory.tests.length
        });
      }
      
      if (investigations.radiology.selected) {
        services.push({
          name: 'Radiology Tests',
          amount: 120 * investigations.radiology.tests.length,
          quantity: investigations.radiology.tests.length
        });
      }
      
      if (prescriptions.length > 0) {
        services.push({
          name: 'Medications',
          amount: 50 * prescriptions.length,
          quantity: prescriptions.length
        });
      }
      
      const totalAmount = services.reduce((sum, service) => sum + service.amount, 0);
      
      const { error: billingError } = await supabase
        .from('billing')
        .insert({
          patient_id: patient.id,
          hospital_id: hospital?.id,
          consultation_id: consultation.id,
          services,
          total_amount: totalAmount,
          paid_amount: 0,
          payment_status: 'pending'
        });
        
      if (billingError) throw billingError;
      
      // Update patient flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
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
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                type="button" 
                onClick={() => navigate(-1)} 
                className="mr-3 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold">
                  {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to={`/patients/${patient.id}`} className="btn btn-outline text-sm">
                View Patient Record
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            <button
              type="button"
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              Patient History
            </button>
            <button
              type="button"
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'examination'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('examination')}
            >
              <Stethoscope className="h-4 w-4 inline mr-1" />
              Examination
            </button>
            <button
              type="button"
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'diagnosis'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('diagnosis')}
            >
              <Activity className="h-4 w-4 inline mr-1" />
              Diagnosis
            </button>
            <button
              type="button"
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'orders'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <ClipboardList className="h-4 w-4 inline mr-1" />
              Orders
            </button>
            <button
              type="button"
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'treatment'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('treatment')}
            >
              <Pill className="h-4 w-4 inline mr-1" />
              Treatment
            </button>
            <button
              type="button"
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'summary'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              <Clipboard className="h-4 w-4 inline mr-1" />
              Summary
            </button>
          </div>
        </div>

        {/* Patient History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Patient History Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('patientHistory')}
              >
                <h2 className="text-base font-medium text-gray-900">Patient History</h2>
                <button type="button">
                  {expandedSections.patientHistory ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.patientHistory && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label required text-sm">Chief Complaint</label>
                    <textarea
                      name="chiefComplaint"
                      value={formData.chiefComplaint}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Enter the patient's main complaint"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">History of Presenting Illness</label>
                    <textarea
                      name="historyOfPresentingIllness"
                      value={formData.historyOfPresentingIllness}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={3}
                      placeholder="Describe the history of the current illness"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Past Medical History</label>
                      <textarea
                        name="pastMedicalHistory"
                        value={formData.pastMedicalHistory}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="List chronic conditions, previous diagnoses, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Past Surgical History</label>
                      <textarea
                        name="pastSurgicalHistory"
                        value={formData.pastSurgicalHistory}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="List previous surgeries with dates if known"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Current Medications</label>
                      <textarea
                        name="medications"
                        value={formData.medications}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="List current medications, dosages, and frequencies"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Allergies</label>
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="List allergies and reactions"
                      />
                    </div>
                  </div>
                  
                  {patient.gender === 'Female' && (
                    <div>
                      <label className="form-label text-sm">Gynecological/Obstetric History</label>
                      <textarea
                        name="gynecologicalHistory"
                        value={formData.gynecologicalHistory}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Menstrual history, pregnancies, deliveries, etc."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Family and Social History Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('familyHistory')}
              >
                <h2 className="text-base font-medium text-gray-900">Family and Socioeconomic History</h2>
                <button type="button">
                  {expandedSections.familyHistory ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.familyHistory && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">Family History</label>
                    <textarea
                      name="familyHistory"
                      value={formData.familyHistory}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Family history of diseases, genetic conditions, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Social History</label>
                    <textarea
                      name="socialHistory"
                      value={formData.socialHistory}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Occupation, living situation, habits (smoking, alcohol, etc.)"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Examination Tab */}
        {activeTab === 'examination' && (
          <div className="space-y-4">
            {/* General Examination Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('generalExamination')}
              >
                <h2 className="text-base font-medium text-gray-900">General Examination</h2>
                <button type="button">
                  {expandedSections.generalExamination ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.generalExamination && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">General Appearance</label>
                    <textarea
                      name="generalExamination"
                      value={formData.generalExamination}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={3}
                      placeholder="General appearance, level of distress, etc."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="form-label text-sm">Temperature (°C)</label>
                      <div className="flex items-center">
                        <Thermometer className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          name="vitalSigns.temperature"
                          value={formData.vitalSigns.temperature}
                          onChange={handleInputChange}
                          className="form-input text-sm"
                          placeholder="36.8"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Heart Rate (bpm)</label>
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          name="vitalSigns.heartRate"
                          value={formData.vitalSigns.heartRate}
                          onChange={handleInputChange}
                          className="form-input text-sm"
                          placeholder="72"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Respiratory Rate</label>
                      <div className="flex items-center">
                        <Lungs className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          name="vitalSigns.respiratoryRate"
                          value={formData.vitalSigns.respiratoryRate}
                          onChange={handleInputChange}
                          className="form-input text-sm"
                          placeholder="16"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">Blood Pressure</label>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          name="vitalSigns.bloodPressure"
                          value={formData.vitalSigns.bloodPressure}
                          onChange={handleInputChange}
                          className="form-input text-sm"
                          placeholder="120/80"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label text-sm">O₂ Saturation (%)</label>
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          name="vitalSigns.oxygenSaturation"
                          value={formData.vitalSigns.oxygenSaturation}
                          onChange={handleInputChange}
                          className="form-input text-sm"
                          placeholder="98"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Systemic Examination Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('systemicExamination')}
              >
                <h2 className="text-base font-medium text-gray-900">Systemic Examination</h2>
                <button type="button">
                  {expandedSections.systemicExamination ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.systemicExamination && (
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm flex items-center">
                        <Heart className="h-4 w-4 text-gray-400 mr-2" />
                        Cardiovascular System
                      </label>
                      <textarea
                        name="systemicExamination.cardiovascular"
                        value={formData.systemicExamination.cardiovascular}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Heart sounds, rate, rhythm, murmurs, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm flex items-center">
                        <Brain className="h-4 w-4 text-gray-400 mr-2" />
                        Central Nervous System
                      </label>
                      <textarea
                        name="systemicExamination.neurological"
                        value={formData.systemicExamination.neurological}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Mental status, cranial nerves, motor, sensory, reflexes, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm flex items-center">
                        <Lungs className="h-4 w-4 text-gray-400 mr-2" />
                        Respiratory System
                      </label>
                      <textarea
                        name="systemicExamination.respiratory"
                        value={formData.systemicExamination.respiratory}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Breath sounds, respiratory effort, percussion, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm flex items-center">
                        <Activity className="h-4 w-4 text-gray-400 mr-2" />
                        Gastrointestinal System
                      </label>
                      <textarea
                        name="systemicExamination.gastrointestinal"
                        value={formData.systemicExamination.gastrointestinal}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Abdomen, bowel sounds, tenderness, organomegaly, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm flex items-center">
                        <Droplets className="h-4 w-4 text-gray-400 mr-2" />
                        Genitourinary System
                      </label>
                      <textarea
                        name="systemicExamination.genitourinary"
                        value={formData.systemicExamination.genitourinary}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Genitourinary findings if examined"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-sm flex items-center">
                        <Bone className="h-4 w-4 text-gray-400 mr-2" />
                        Musculoskeletal
                      </label>
                      <textarea
                        name="systemicExamination.musculoskeletal"
                        value={formData.systemicExamination.musculoskeletal}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Joints, muscles, range of motion, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patient.gender === 'Female' && (
                      <div>
                        <label className="form-label text-sm">Breast Examination</label>
                        <textarea
                          name="systemicExamination.breast"
                          value={formData.systemicExamination.breast}
                          onChange={handleInputChange}
                          className="form-input text-sm"
                          rows={2}
                          placeholder="Breast examination findings if performed"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="form-label text-sm">Other Systems/Examination</label>
                      <textarea
                        name="systemicExamination.other"
                        value={formData.systemicExamination.other}
                        onChange={handleInputChange}
                        className="form-input text-sm"
                        rows={2}
                        placeholder="Any other examination findings"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnosis Tab */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('diagnosis')}
              >
                <h2 className="text-base font-medium text-gray-900">Diagnosis</h2>
                <button type="button">
                  {expandedSections.diagnosis ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.diagnosis && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label required text-sm">Primary Diagnosis</label>
                    <textarea
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Enter the primary diagnosis"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Differential Diagnosis</label>
                    <textarea
                      name="differentialDiagnosis"
                      value={formData.differentialDiagnosis}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="List alternative diagnoses to consider"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('investigations')}
              >
                <h2 className="text-base font-medium text-gray-900">Investigations</h2>
                <button type="button">
                  {expandedSections.investigations ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.investigations && (
                <div className="p-4 space-y-6">
                  {/* Laboratory Tests */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Microscope className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-base font-medium text-gray-900">Laboratory Tests</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                      {laboratoryTests.map((test) => (
                        <div key={test} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleTestSelection('laboratory', test)}
                            className="flex items-center"
                          >
                            {selectedLaboratoryTests.includes(test) ? (
                              <CheckSquare className="h-4 w-4 text-primary-500 mr-2" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-700">{test}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customLaboratoryTest}
                        onChange={(e) => setCustomLaboratoryTest(e.target.value)}
                        className="form-input text-sm flex-1"
                        placeholder="Add custom laboratory test"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomTest('laboratory')}
                        disabled={!customLaboratoryTest}
                        className="btn btn-primary text-sm py-1 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {selectedLaboratoryTests.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700">Selected Tests:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLaboratoryTests.map((test) => (
                            <span 
                              key={test} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {test}
                              <button
                                type="button"
                                onClick={() => handleTestSelection('laboratory', test)}
                                className="ml-1 text-primary-600 hover:text-primary-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Radiology Tests */}
                  <div>
                    <div className="flex items-center mb-2">
                      <FileImage className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-base font-medium text-gray-900">Radiology Tests</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                      {radiologyTests.map((test) => (
                        <div key={test} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleTestSelection('radiology', test)}
                            className="flex items-center"
                          >
                            {selectedRadiologyTests.includes(test) ? (
                              <CheckSquare className="h-4 w-4 text-primary-500 mr-2" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-700">{test}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customRadiologyTest}
                        onChange={(e) => setCustomRadiologyTest(e.target.value)}
                        className="form-input text-sm flex-1"
                        placeholder="Add custom radiology test"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomTest('radiology')}
                        disabled={!customRadiologyTest}
                        className="btn btn-primary text-sm py-1 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {selectedRadiologyTests.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700">Selected Tests:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRadiologyTests.map((test) => (
                            <span 
                              key={test} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {test}
                              <button
                                type="button"
                                onClick={() => handleTestSelection('radiology', test)}
                                className="ml-1 text-primary-600 hover:text-primary-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Other Tests */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Activity className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-base font-medium text-gray-900">Other Tests</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                      {otherTests.map((test) => (
                        <div key={test} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleTestSelection('other', test)}
                            className="flex items-center"
                          >
                            {selectedOtherTests.includes(test) ? (
                              <CheckSquare className="h-4 w-4 text-primary-500 mr-2" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-700">{test}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customOtherTest}
                        onChange={(e) => setCustomOtherTest(e.target.value)}
                        className="form-input text-sm flex-1"
                        placeholder="Add custom test"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomTest('other')}
                        disabled={!customOtherTest}
                        className="btn btn-primary text-sm py-1 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {selectedOtherTests.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700">Selected Tests:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedOtherTests.map((test) => (
                            <span 
                              key={test} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {test}
                              <button
                                type="button"
                                onClick={() => handleTestSelection('other', test)}
                                className="ml-1 text-primary-600 hover:text-primary-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Treatment Tab */}
        {activeTab === 'treatment' && (
          <div className="space-y-4">
            {/* Treatment Plan Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('treatmentPlan')}
              >
                <h2 className="text-base font-medium text-gray-900">Treatment Plan</h2>
                <button type="button">
                  {expandedSections.treatmentPlan ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.treatmentPlan && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">Treatment Plan</label>
                    <textarea
                      name="treatmentPlan"
                      value={formData.treatmentPlan}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={3}
                      placeholder="Describe the treatment plan"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Medications Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('medications')}
              >
                <h2 className="text-base font-medium text-gray-900">Medications</h2>
                <button type="button">
                  {expandedSections.medications ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.medications && (
                <div className="p-4 space-y-4">
                  {formData.medications_prescribed.length > 0 ? (
                    <div className="space-y-3">
                      {formData.medications_prescribed.map((medication, index) => (
                        <div key={index} className="flex items-start justify-between p-3 border border-gray-200 rounded-md">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">{medication.medication}</p>
                            <p className="text-xs text-gray-600">
                              {medication.dosage} - {medication.frequency} for {medication.duration}
                            </p>
                            {medication.instructions && (
                              <p className="text-xs text-gray-500">
                                Instructions: {medication.instructions}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(index)}
                            className="text-gray-400 hover:text-error-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">No medications prescribed yet</p>
                  )}
                  
                  {showAddMedication ? (
                    <div className="border border-gray-200 rounded-md p-4 space-y-3">
                      <h3 className="text-sm font-medium text-gray-900">Add Medication</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label required text-xs">Medication</label>
                          <input
                            type="text"
                            value={newMedication.medication}
                            onChange={(e) => setNewMedication({...newMedication, medication: e.target.value})}
                            className="form-input text-sm"
                            placeholder="Medication name"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label required text-xs">Dosage</label>
                          <input
                            type="text"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                            className="form-input text-sm"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label required text-xs">Frequency</label>
                          <input
                            type="text"
                            value={newMedication.frequency}
                            onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                            className="form-input text-sm"
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label required text-xs">Duration</label>
                          <input
                            type="text"
                            value={newMedication.duration}
                            onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                            className="form-input text-sm"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Instructions</label>
                        <input
                          type="text"
                          value={newMedication.instructions}
                          onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                          className="form-input text-sm"
                          placeholder="e.g., Take with food"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddMedication(false)}
                          className="btn btn-outline text-sm py-1 px-3"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="btn btn-primary text-sm py-1 px-3"
                        >
                          Add Medication
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddMedication(true)}
                      className="btn btn-outline w-full text-sm py-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Follow-up Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('followUp')}
              >
                <h2 className="text-base font-medium text-gray-900">Follow-up & Additional Notes</h2>
                <button type="button">
                  {expandedSections.followUp ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {expandedSections.followUp && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="form-label text-sm">Follow-up Plan</label>
                    <textarea
                      name="followUp"
                      value={formData.followUp}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Follow-up instructions, timeline, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Any additional notes or comments"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="medicalCertificate"
                      name="medicalCertificate"
                      checked={formData.medicalCertificate}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                      Issue Medical Certificate
                    </label>
                  </div>
                  
                  {formData.medicalCertificate && (
                    <div>
                      <label className="form-label text-sm">Number of Days</label>
                      <input
                        type="number"
                        name="medicalCertificateDays"
                        value={formData.medicalCertificateDays}
                        onChange={handleInputChange}
                        min="1"
                        className="form-input text-sm w-24"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Consultation Summary</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Patient Information</h3>
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {patient.first_name} {patient.last_name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Age/Gender:</span> {calculateAge(patient.date_of_birth)} years / {patient.gender}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Chief Complaint</h3>
                  <p className="text-sm">{formData.chiefComplaint || 'Not specified'}</p>
                </div>
                
                {formData.diagnosis && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Diagnosis</h3>
                    <p className="text-sm">{formData.diagnosis}</p>
                  </div>
                )}
                
                {(selectedLaboratoryTests.length > 0 || selectedRadiologyTests.length > 0 || selectedOtherTests.length > 0) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Ordered Investigations</h3>
                    
                    {selectedLaboratoryTests.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Laboratory:</p>
                        <ul className="list-disc list-inside text-sm pl-2">
                          {selectedLaboratoryTests.map((test, index) => (
                            <li key={index}>{test}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedRadiologyTests.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Radiology:</p>
                        <ul className="list-disc list-inside text-sm pl-2">
                          {selectedRadiologyTests.map((test, index) => (
                            <li key={index}>{test}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedOtherTests.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Other Tests:</p>
                        <ul className="list-disc list-inside text-sm pl-2">
                          {selectedOtherTests.map((test, index) => (
                            <li key={index}>{test}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {formData.medications_prescribed.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Prescribed Medications</h3>
                    <ul className="space-y-2">
                      {formData.medications_prescribed.map((med, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">{med.medication}</span> {med.dosage}, {med.frequency} for {med.duration}
                          {med.instructions && <span className="block text-gray-500 text-xs">Instructions: {med.instructions}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {formData.treatmentPlan && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Treatment Plan</h3>
                    <p className="text-sm">{formData.treatmentPlan}</p>
                  </div>
                )}
                
                {formData.followUp && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-1 mb-2">Follow-up Plan</h3>
                    <p className="text-sm">{formData.followUp}</p>
                  </div>
                )}
                
                {formData.medicalCertificate && (
                  <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
                    <p className="text-sm font-medium text-primary-700">
                      Medical Certificate: {formData.medicalCertificateDays} day(s)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline text-sm"
          >
            Cancel
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