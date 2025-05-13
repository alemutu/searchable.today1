import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  FileText, 
  Plus, 
  Trash2, 
  User, 
  Activity, 
  Thermometer, 
  Settings as Lungs, 
  Droplets, 
  Scale, 
  Ruler, 
  Calculator, 
  Clock, 
  AlertTriangle, 
  Stethoscope, 
  Building2, 
  Save, 
  ArrowLeft, 
  Brain, 
  FileText as FileTextIcon, 
  Pill, 
  AlertCircle, 
  Heart, 
  Eye, 
  Bone, 
  Bluetooth as Tooth, 
  Baby, 
  UserRound, 
  Syringe, 
  ActivitySquare, 
  ChevronDown, 
  ChevronUp, 
  Printer
} from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  medicalCertificate: boolean;
  medicalCertificateDetails?: {
    startDate: string;
    endDate: string;
    reason: string;
    recommendations: string;
  };
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
  // Department-specific fields
  departmentSpecific: {
    // Cardiology
    cardiology?: {
      heartRate?: number;
      bloodPressure?: string;
      ecgFindings?: string;
      heartSounds?: string;
      chestPain?: string;
      cardiovascularRiskFactors?: string[];
    };
    // Ophthalmology
    eyeClinic?: {
      visualAcuity?: {
        right: string;
        left: string;
      };
      intraocularPressure?: {
        right: number;
        left: number;
      };
      fundoscopy?: string;
      slitLampExam?: string;
      colorVision?: string;
    };
    // Dental
    dental?: {
      dentalChart?: string;
      oralHygiene?: string;
      teethCondition?: string;
      gumHealth?: string;
      dentalProcedure?: string;
    };
    // Orthopedic
    orthopedic?: {
      jointExamination?: string;
      rangeOfMotion?: string;
      muscleStrength?: string;
      gait?: string;
      deformities?: string;
    };
    // Pediatrics
    pediatrics?: {
      growthPercentile?: string;
      developmentalMilestones?: string;
      immunizationStatus?: string;
      feedingHistory?: string;
    };
    // Gynecology
    gynecology?: {
      lastMenstrualPeriod?: string;
      menstrualHistory?: string;
      pregnancyHistory?: string;
      pelvicExamination?: string;
      papSmearResults?: string;
    };
    // General Medicine
    generalMedicine?: {
      generalAppearance?: string;
      systemicReview?: string;
      chronicDiseaseStatus?: string;
    };
    // Surgical
    surgical?: {
      surgicalSite?: string;
      preOpAssessment?: string;
      surgicalProcedure?: string;
      postOpInstructions?: string;
    };
    // Physiotherapy
    physiotherapy?: {
      functionalAssessment?: string;
      painScale?: number;
      treatmentPlan?: string;
      exercisePrescription?: string;
      rehabilitationGoals?: string;
    };
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
  const [showMedicalCertificatePreview, setShowMedicalCertificatePreview] = useState(false);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState({
    patientHistory: true,
    familyHistory: false,
    generalExamination: false,
    systemicExamination: false,
    departmentSpecific: true
  });
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue, watch } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      labTests: [],
      radiologyTests: [],
      medicalCertificate: false,
      medicalCertificateDetails: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: '',
        recommendations: ''
      },
      departmentSpecific: {}
    }
  });

  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');
  const medicalCertificate = watch('medicalCertificate');
  const medicalCertificateDetails = watch('medicalCertificateDetails');

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
    
    // Get current user's department
    if (user?.department_id) {
      fetchDepartmentName(user.department_id);
    }
  }, [patientId, user]);

  const fetchDepartmentName = async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .eq('id', departmentId)
        .single();

      if (error) throw error;
      if (data) {
        setDepartmentName(data.name);
      }
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

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
        message: 'Failed to load patient data',
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
      addNotification({
        message: 'Saving consultation data...',
        type: 'info'
      });

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
          department_id: user.department_id,
          // Store department-specific data
          department_specific_data: data.departmentSpecific
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

  // Common medications for autocomplete
  const commonMedications = [
    'Acetaminophen', 'Amoxicillin', 'Atorvastatin', 'Azithromycin', 'Cephalexin',
    'Ciprofloxacin', 'Diazepam', 'Hydrochlorothiazide', 'Ibuprofen', 'Levothyroxine',
    'Lisinopril', 'Loratadine', 'Metformin', 'Metoprolol', 'Omeprazole',
    'Prednisone', 'Sertraline', 'Simvastatin', 'Tramadol', 'Warfarin'
  ];

  // Common frequencies for medication
  const commonFrequencies = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'As needed', 'Before meals', 'After meals', 'At bedtime'
  ];

  // Common durations for medication
  const commonDurations = [
    '3 days', '5 days', '7 days', '10 days', '14 days',
    '1 week', '2 weeks', '3 weeks', '1 month', '2 months',
    '3 months', '6 months', 'Indefinitely'
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
      message: `Added ${test.name} to lab tests`,
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
      message: `Added ${test.name} to radiology tests`,
      type: 'success',
      duration: 2000
    });
  };

  const removeLabTest = (index: number) => {
    const currentTests = watch('labTests');
    const testName = currentTests[index].testName;
    setValue('labTests', currentTests.filter((_, i) => i !== index));
    
    addNotification({
      message: `Removed ${testName} from lab tests`,
      type: 'info',
      duration: 2000
    });
  };

  const removeRadiologyTest = (index: number) => {
    const currentTests = watch('radiologyTests');
    const testName = currentTests[index].testName;
    setValue('radiologyTests', currentTests.filter((_, i) => i !== index));
    
    addNotification({
      message: `Removed ${testName} from radiology tests`,
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

  const renderDepartmentSpecificFields = () => {
    // Normalize department name for comparison
    const normalizedDeptName = departmentName.toLowerCase().replace(/\s+/g, '');
    
    if (normalizedDeptName.includes('cardio') || normalizedDeptName.includes('heart')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Heart className="h-4 w-4 mr-2 text-primary-500" />
            Cardiology Examination
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-sm">Heart Rate (bpm)</label>
              <input
                type="number"
                className="form-input"
                {...register('departmentSpecific.cardiology.heartRate')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Blood Pressure (mmHg)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 120/80"
                {...register('departmentSpecific.cardiology.bloodPressure')}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label text-sm">ECG Findings</label>
              <textarea
                className="form-input"
                rows={2}
                {...register('departmentSpecific.cardiology.ecgFindings')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Heart Sounds</label>
              <select className="form-input" {...register('departmentSpecific.cardiology.heartSounds')}>
                <option value="">Select</option>
                <option value="normal">Normal</option>
                <option value="s3_gallop">S3 Gallop</option>
                <option value="s4_gallop">S4 Gallop</option>
                <option value="systolic_murmur">Systolic Murmur</option>
                <option value="diastolic_murmur">Diastolic Murmur</option>
                <option value="pericardial_friction_rub">Pericardial Friction Rub</option>
              </select>
            </div>
            
            <div>
              <label className="form-label text-sm">Chest Pain Assessment</label>
              <select className="form-input" {...register('departmentSpecific.cardiology.chestPain')}>
                <option value="">Select</option>
                <option value="none">None</option>
                <option value="typical_angina">Typical Angina</option>
                <option value="atypical_angina">Atypical Angina</option>
                <option value="non_anginal">Non-anginal Pain</option>
                <option value="acute_coronary_syndrome">Acute Coronary Syndrome</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label text-sm">Cardiovascular Risk Factors</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hypertension"
                    value="hypertension"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('departmentSpecific.cardiology.cardiovascularRiskFactors')}
                  />
                  <label htmlFor="hypertension" className="ml-2 text-sm text-gray-700">Hypertension</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="diabetes"
                    value="diabetes"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('departmentSpecific.cardiology.cardiovascularRiskFactors')}
                  />
                  <label htmlFor="diabetes" className="ml-2 text-sm text-gray-700">Diabetes</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smoking"
                    value="smoking"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('departmentSpecific.cardiology.cardiovascularRiskFactors')}
                  />
                  <label htmlFor="smoking" className="ml-2 text-sm text-gray-700">Smoking</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dyslipidemia"
                    value="dyslipidemia"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('departmentSpecific.cardiology.cardiovascularRiskFactors')}
                  />
                  <label htmlFor="dyslipidemia" className="ml-2 text-sm text-gray-700">Dyslipidemia</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="family_history"
                    value="family_history"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('departmentSpecific.cardiology.cardiovascularRiskFactors')}
                  />
                  <label htmlFor="family_history" className="ml-2 text-sm text-gray-700">Family History</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="obesity"
                    value="obesity"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('departmentSpecific.cardiology.cardiovascularRiskFactors')}
                  />
                  <label htmlFor="obesity" className="ml-2 text-sm text-gray-700">Obesity</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } 
    else if (normalizedDeptName.includes('eye') || normalizedDeptName.includes('ophthal')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Eye className="h-4 w-4 mr-2 text-primary-500" />
            Ophthalmology Examination
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-sm">Visual Acuity (Right Eye)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 20/20"
                {...register('departmentSpecific.eyeClinic.visualAcuity.right')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Visual Acuity (Left Eye)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 20/20"
                {...register('departmentSpecific.eyeClinic.visualAcuity.left')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Intraocular Pressure (Right Eye, mmHg)</label>
              <input
                type="number"
                className="form-input"
                {...register('departmentSpecific.eyeClinic.intraocularPressure.right')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Intraocular Pressure (Left Eye, mmHg)</label>
              <input
                type="number"
                className="form-input"
                {...register('departmentSpecific.eyeClinic.intraocularPressure.left')}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label text-sm">Fundoscopy Findings</label>
              <textarea
                className="form-input"
                rows={2}
                {...register('departmentSpecific.eyeClinic.fundoscopy')}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label text-sm">Slit Lamp Examination</label>
              <textarea
                className="form-input"
                rows={2}
                {...register('departmentSpecific.eyeClinic.slitLampExam')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Color Vision</label>
              <select className="form-input" {...register('departmentSpecific.eyeClinic.colorVision')}>
                <option value="">Select</option>
                <option value="normal">Normal</option>
                <option value="deficient">Deficient</option>
                <option value="not_tested">Not Tested</option>
              </select>
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('dental') || normalizedDeptName.includes('tooth')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Tooth className="h-4 w-4 mr-2 text-primary-500" />
            Dental Examination
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label text-sm">Dental Chart</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Document dental chart findings"
                {...register('departmentSpecific.dental.dentalChart')}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm">Oral Hygiene</label>
                <select className="form-input" {...register('departmentSpecific.dental.oralHygiene')}>
                  <option value="">Select</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              
              <div>
                <label className="form-label text-sm">Gum Health</label>
                <select className="form-input" {...register('departmentSpecific.dental.gumHealth')}>
                  <option value="">Select</option>
                  <option value="healthy">Healthy</option>
                  <option value="gingivitis">Gingivitis</option>
                  <option value="periodontitis">Periodontitis</option>
                  <option value="severe_periodontitis">Severe Periodontitis</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Teeth Condition</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document teeth condition, cavities, etc."
                {...register('departmentSpecific.dental.teethCondition')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Dental Procedure Performed/Recommended</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document procedures performed or recommended"
                {...register('departmentSpecific.dental.dentalProcedure')}
              />
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('ortho') || normalizedDeptName.includes('bone')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Bone className="h-4 w-4 mr-2 text-primary-500" />
            Orthopedic Examination
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label text-sm">Joint Examination</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document joint examination findings"
                {...register('departmentSpecific.orthopedic.jointExamination')}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm">Range of Motion</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Document range of motion findings"
                  {...register('departmentSpecific.orthopedic.rangeOfMotion')}
                />
              </div>
              
              <div>
                <label className="form-label text-sm">Muscle Strength</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Document muscle strength findings"
                  {...register('departmentSpecific.orthopedic.muscleStrength')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm">Gait Assessment</label>
                <select className="form-input" {...register('departmentSpecific.orthopedic.gait')}>
                  <option value="">Select</option>
                  <option value="normal">Normal</option>
                  <option value="antalgic">Antalgic</option>
                  <option value="trendelenburg">Trendelenburg</option>
                  <option value="steppage">Steppage</option>
                  <option value="spastic">Spastic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="form-label text-sm">Deformities</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Document any deformities"
                  {...register('departmentSpecific.orthopedic.deformities')}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('pedia') || normalizedDeptName.includes('child')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Baby className="h-4 w-4 mr-2 text-primary-500" />
            Pediatric Examination
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm">Growth Percentile</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 75th percentile"
                  {...register('departmentSpecific.pediatrics.growthPercentile')}
                />
              </div>
              
              <div>
                <label className="form-label text-sm">Immunization Status</label>
                <select className="form-input" {...register('departmentSpecific.pediatrics.immunizationStatus')}>
                  <option value="">Select</option>
                  <option value="up_to_date">Up to date</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="delayed">Delayed</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Developmental Milestones</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document developmental milestones"
                {...register('departmentSpecific.pediatrics.developmentalMilestones')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Feeding History</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document feeding history"
                {...register('departmentSpecific.pediatrics.feedingHistory')}
              />
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('gyne') || normalizedDeptName.includes('obstet')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <UserRound className="h-4 w-4 mr-2 text-primary-500" />
            Gynecology Examination
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm">Last Menstrual Period</label>
                <input
                  type="date"
                  className="form-input"
                  {...register('departmentSpecific.gynecology.lastMenstrualPeriod')}
                />
              </div>
              
              <div>
                <label className="form-label text-sm">Menstrual History</label>
                <select className="form-input" {...register('departmentSpecific.gynecology.menstrualHistory')}>
                  <option value="">Select</option>
                  <option value="regular">Regular</option>
                  <option value="irregular">Irregular</option>
                  <option value="amenorrhea">Amenorrhea</option>
                  <option value="menopause">Menopause</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Pregnancy History</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document pregnancy history (G P A L)"
                {...register('departmentSpecific.gynecology.pregnancyHistory')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Pelvic Examination</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document pelvic examination findings"
                {...register('departmentSpecific.gynecology.pelvicExamination')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Pap Smear Results</label>
              <select className="form-input" {...register('departmentSpecific.gynecology.papSmearResults')}>
                <option value="">Select</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="pending">Pending</option>
                <option value="not_done">Not Done</option>
              </select>
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('general') || normalizedDeptName.includes('medicine')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Stethoscope className="h-4 w-4 mr-2 text-primary-500" />
            General Medicine Examination
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label text-sm">General Appearance</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document general appearance"
                {...register('departmentSpecific.generalMedicine.generalAppearance')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Systemic Review</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Document systemic review findings"
                {...register('departmentSpecific.generalMedicine.systemicReview')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Chronic Disease Status</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document status of any chronic diseases"
                {...register('departmentSpecific.generalMedicine.chronicDiseaseStatus')}
              />
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('surg')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <Syringe className="h-4 w-4 mr-2 text-primary-500" />
            Surgical Examination
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label text-sm">Surgical Site</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document surgical site examination"
                {...register('departmentSpecific.surgical.surgicalSite')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Pre-operative Assessment</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document pre-operative assessment"
                {...register('departmentSpecific.surgical.preOpAssessment')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Surgical Procedure</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document surgical procedure details"
                {...register('departmentSpecific.surgical.surgicalProcedure')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Post-operative Instructions</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document post-operative instructions"
                {...register('departmentSpecific.surgical.postOpInstructions')}
              />
            </div>
          </div>
        </div>
      );
    }
    else if (normalizedDeptName.includes('physio') || normalizedDeptName.includes('therapy')) {
      return (
        <div className="space-y-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
          <h3 className="text-md font-medium text-primary-800 flex items-center">
            <ActivitySquare className="h-4 w-4 mr-2 text-primary-500" />
            Physiotherapy Assessment
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label text-sm">Functional Assessment</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document functional assessment"
                {...register('departmentSpecific.physiotherapy.functionalAssessment')}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm">Pain Scale (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="form-input"
                  {...register('departmentSpecific.physiotherapy.painScale')}
                />
              </div>
              
              <div>
                <label className="form-label text-sm">Rehabilitation Goals</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Improve mobility"
                  {...register('departmentSpecific.physiotherapy.rehabilitationGoals')}
                />
              </div>
            </div>
            
            <div>
              <label className="form-label text-sm">Treatment Plan</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document treatment plan"
                {...register('departmentSpecific.physiotherapy.treatmentPlan')}
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Exercise Prescription</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Document exercise prescription"
                {...register('departmentSpecific.physiotherapy.exercisePrescription')}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Default case - no department-specific fields
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">No department-specific fields available for this department.</p>
      </div>
    );
  };

  const renderMedicalCertificatePreview = () => {
    if (!medicalCertificate || !medicalCertificateDetails) return null;
    
    const today = new Date().toLocaleDateString();
    const doctorName = user ? `${user.first_name} ${user.last_name}` : 'Doctor';
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient';
    const patientGender = patient?.gender || 'Unknown';
    const patientAge = patient?.date_of_birth ? 
      new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'Unknown';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Medical Certificate Preview</h3>
            <button 
              onClick={() => setShowMedicalCertificatePreview(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6" id="medical-certificate-print">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{hospital?.name || 'Hospital'}</h2>
              <p className="text-sm text-gray-600">{hospital?.address || 'Hospital Address'}</p>
              <p className="text-sm text-gray-600">Phone: {hospital?.phone || 'Phone Number'}</p>
              {hospital?.email && <p className="text-sm text-gray-600">Email: {hospital.email}</p>}
            </div>
            
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-t-2 border-gray-300 py-2">MEDICAL CERTIFICATE</h1>
            </div>
            
            <div className="mb-6">
              <p className="text-right text-sm text-gray-600">Date: {today}</p>
            </div>
            
            <div className="mb-6">
              <p className="mb-4">This is to certify that <span className="font-bold">{patientName}</span>, a {patientAge}-year-old {patientGender}, has been examined by me on {today} and has been diagnosed with:</p>
              
              <p className="font-medium text-gray-900 my-4 p-2 border-l-4 border-primary-500 bg-gray-50">
                {watch('diagnosis') || '[Diagnosis will appear here]'}
              </p>
              
              <p className="mb-4">Due to the above condition, the patient is advised to:</p>
              
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="font-medium">Rest and recuperate from {medicalCertificateDetails.startDate} to {medicalCertificateDetails.endDate}</p>
                {medicalCertificateDetails.reason && (
                  <p className="mt-2">Reason: {medicalCertificateDetails.reason}</p>
                )}
                {medicalCertificateDetails.recommendations && (
                  <p className="mt-2">Recommendations: {medicalCertificateDetails.recommendations}</p>
                )}
              </div>
              
              <p className="mb-4">The patient is fit to return to work/school on {new Date(medicalCertificateDetails.endDate + 'T00:00:00').toLocaleDateString()}.</p>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="text-center">
                  <div className="mb-2 border-b border-gray-400 w-48"></div>
                  <p className="font-medium">Dr. {doctorName}</p>
                  <p className="text-sm text-gray-600">{departmentName || 'Department'}</p>
                  <p className="text-sm text-gray-600">License No: [License Number]</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setShowMedicalCertificatePreview(false)}
              className="btn btn-outline"
            >
              Close
            </button>
            <button
              onClick={() => {
                const printContent = document.getElementById('medical-certificate-print');
                const originalContents = document.body.innerHTML;
                
                if (printContent) {
                  document.body.innerHTML = printContent.innerHTML;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload();
                }
              }}
              className="btn btn-primary inline-flex items-center"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Certificate
            </button>
          </div>
        </div>
      </div>
    );
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
    <div className="max-w-4xl mx-auto">
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
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
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
                className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('patientHistory')}
              >
                <h3 className="text-md font-medium text-gray-900">1. Patient History</h3>
                {expandedSections.patientHistory ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {expandedSections.patientHistory && (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">History of Presenting Illness</h4>
                    <textarea
                      rows={3}
                      className="form-input text-sm w-full"
                      placeholder="Enter details about the history of presenting illness..."
                    />
                  </div>
                  
                  {patient.gender === 'Female' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Gynecological/Obstetric History</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter gynecological or obstetric history if applicable..."
                      />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Past Medical and Surgical History</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm w-full"
                      placeholder="Enter past medical and surgical history..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Family and Socioeconomic History */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('familyHistory')}
              >
                <h3 className="text-md font-medium text-gray-900">2. Family and Socioeconomic History</h3>
                {expandedSections.familyHistory ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {expandedSections.familyHistory && (
                <div className="p-4">
                  <textarea
                    rows={3}
                    className="form-input w-full"
                    placeholder="Enter family history and socioeconomic information..."
                  />
                </div>
              )}
            </div>

            {/* 3. General Examination */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('generalExamination')}
              >
                <h3 className="text-md font-medium text-gray-900">3. General Examination</h3>
                {expandedSections.generalExamination ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {expandedSections.generalExamination && (
                <div className="p-4">
                  <textarea
                    rows={3}
                    className="form-input w-full"
                    placeholder="Enter general examination findings..."
                  />
                </div>
              )}
            </div>

            {/* 4. Systemic Examination */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('systemicExamination')}
              >
                <h3 className="text-md font-medium text-gray-900">4. Systemic Examination</h3>
                {expandedSections.systemicExamination ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {expandedSections.systemicExamination && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Cardiovascular System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter cardiovascular findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Respiratory System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter respiratory findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Gastrointestinal System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter gastrointestinal findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Central Nervous System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter neurological findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Musculoskeletal</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter musculoskeletal findings..."
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Other Systems/Examination</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Enter other examination findings..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Department-Specific Fields */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('departmentSpecific')}
              >
                <h3 className="text-md font-medium text-gray-900">
                  5. {departmentName || 'Department'}-Specific Assessment
                </h3>
                {expandedSections.departmentSpecific ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {expandedSections.departmentSpecific && (
                <div className="p-4">
                  {renderDepartmentSpecificFields()}
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
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
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
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
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
            
            {Array.from({ length: prescriptionCount }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Medication #{index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
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
                    <div className="relative">
                      <input
                        type="text"
                        list="medications"
                        {...register(`prescriptions.${index}.medication` as const, {
                          required: 'Medication name is required'
                        })}
                        className="form-input"
                        placeholder="Start typing to search..."
                      />
                      <datalist id="medications">
                        {commonMedications.map((med, i) => (
                          <option key={i} value={med} />
                        ))}
                      </datalist>
                    </div>
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
                      {commonFrequencies.map((freq, i) => (
                        <option key={i} value={freq}>{freq}</option>
                      ))}
                    </select>
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
                      {commonDurations.map((dur, i) => (
                        <option key={i} value={dur}>{dur}</option>
                      ))}
                    </select>
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
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
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

            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="medicalCertificate"
                  {...register('medicalCertificate')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="medicalCertificate" className="ml-2 flex items-center text-sm font-medium text-gray-700">
                  <FileTextIcon className="h-5 w-5 mr-1" />
                  Issue Medical Certificate
                </label>
              </div>
              
              {medicalCertificate && (
                <div className="space-y-4 pl-6 border-l-2 border-primary-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm">Start Date</label>
                      <input
                        type="date"
                        className="form-input"
                        {...register('medicalCertificateDetails.startDate')}
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm">End Date</label>
                      <input
                        type="date"
                        className="form-input"
                        {...register('medicalCertificateDetails.endDate')}
                        defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Reason for Certificate</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Medical condition requiring rest"
                      {...register('medicalCertificateDetails.reason')}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Recommendations</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g., Rest, avoid strenuous activities"
                      {...register('medicalCertificateDetails.recommendations')}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowMedicalCertificatePreview(true)}
                    className="btn btn-outline inline-flex items-center text-sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Preview & Print Certificate
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Medical Certificate Preview Modal */}
      {showMedicalCertificatePreview && renderMedicalCertificatePreview()}
    </div>
  );
};

export default ConsultationForm;