import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { FileText, Plus, Trash2, User, AlertTriangle, Activity, Clock, Calculator, Ruler, Scale, Droplets, Heart, Thermometer, Settings as Lungs, Brain, FileBarChart2, Pill, AlertCircle, Save, ArrowLeft, Eye, Stethoscope, Baby, UserRound, Bone, Bluetooth as Tooth, Syringe } from 'lucide-react';

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
  departmentSpecificData?: any;
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
  const [showMedicalCertificateModal, setShowMedicalCertificateModal] = useState(false);
  const [searchMedication, setSearchMedication] = useState('');
  const [medicationResults, setMedicationResults] = useState<string[]>([]);
  const [showMedicationResults, setShowMedicationResults] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    patientHistory: false,
    familyHistory: false,
    generalExamination: false,
    systemicExamination: false,
    departmentSpecific: false
  });
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue, watch, getValues } = useForm<ConsultationFormData>({
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
      }
    }
  });

  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');
  const medicalCertificate = watch('medicalCertificate');
  const medicalCertificateDetails = watch('medicalCertificateDetails');
  const prescriptions = watch('prescriptions');

  // Common medications database
  const commonMedications = [
    { name: 'Amoxicillin', dosages: ['250mg', '500mg'] },
    { name: 'Paracetamol', dosages: ['500mg', '1g'] },
    { name: 'Ibuprofen', dosages: ['200mg', '400mg', '600mg'] },
    { name: 'Omeprazole', dosages: ['20mg', '40mg'] },
    { name: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
    { name: 'Atorvastatin', dosages: ['10mg', '20mg', '40mg', '80mg'] },
    { name: 'Lisinopril', dosages: ['5mg', '10mg', '20mg'] },
    { name: 'Amlodipine', dosages: ['5mg', '10mg'] },
    { name: 'Metoprolol', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Losartan', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Sertraline', dosages: ['50mg', '100mg'] },
    { name: 'Fluoxetine', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Albuterol', dosages: ['2mg', '4mg'] },
    { name: 'Prednisone', dosages: ['5mg', '10mg', '20mg'] },
    { name: 'Levothyroxine', dosages: ['25mcg', '50mcg', '75mcg', '100mcg'] },
    { name: 'Warfarin', dosages: ['1mg', '2mg', '5mg'] },
    { name: 'Clopidogrel', dosages: ['75mg'] },
    { name: 'Aspirin', dosages: ['81mg', '325mg'] },
    { name: 'Furosemide', dosages: ['20mg', '40mg', '80mg'] },
    { name: 'Hydrochlorothiazide', dosages: ['12.5mg', '25mg'] }
  ];

  // Common frequencies
  const frequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ];

  // Common durations
  const durations = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '1 month',
    '2 months',
    '3 months',
    '6 months',
    'Indefinite'
  ];

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
        message: 'Failed to load patient data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchMedication = (searchTerm: string) => {
    setSearchMedication(searchTerm);
    if (searchTerm.length > 1) {
      const results = commonMedications
        .filter(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(med => med.name);
      setMedicationResults(results);
      setShowMedicationResults(true);
    } else {
      setMedicationResults([]);
      setShowMedicationResults(false);
    }
  };

  const handleSelectMedication = (medication: string, index: number) => {
    const selectedMed = commonMedications.find(med => med.name === medication);
    
    // Update the form with the selected medication
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      medication: medication,
      dosage: selectedMed?.dosages[0] || ''
    };
    
    setValue('prescriptions', updatedPrescriptions);
    setSearchMedication('');
    setShowMedicationResults(false);
    
    // Show notification
    addNotification({
      message: `Added ${medication} to prescription`,
      type: 'success',
      duration: 2000
    });
  };

  const handleAddCustomMedication = (index: number) => {
    if (!searchMedication.trim()) return;
    
    // Update the form with the custom medication
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      medication: searchMedication
    };
    
    setValue('prescriptions', updatedPrescriptions);
    setSearchMedication('');
    setShowMedicationResults(false);
    
    // Show notification
    addNotification({
      message: `Added custom medication: ${searchMedication}`,
      type: 'info',
      duration: 2000
    });
  };

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
          prescriptions: data.prescriptions.filter(p => p.medication.trim() !== ''),
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          department_id: user.department_id,
          departmentSpecificData: data.departmentSpecificData
        });

      if (consultationError) throw consultationError;

      // Determine the next flow step based on ordered tests and prescriptions
      let nextFlowStep = 'post_consultation';
      
      if (data.labTests.length > 0) {
        nextFlowStep = 'lab_tests';
      } else if (data.radiologyTests.length > 0) {
        nextFlowStep = 'radiology';
      } else if (data.prescriptions.some(p => p.medication.trim() !== '')) {
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
      if (data.prescriptions.some(p => p.medication.trim() !== '')) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            medications: data.prescriptions
              .filter(p => p.medication.trim() !== '')
              .map(p => ({
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
    
    // Show notification
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
    
    // Show notification
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
    
    // Show notification
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
    
    // Show notification
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

  // Get department-specific fields based on user's department
  const getDepartmentSpecificFields = () => {
    // Get user's department from profile
    const departmentId = user?.department_id;
    const departmentName = user?.department?.name || '';
    
    // If no department, return empty
    if (!departmentId && !departmentName) return null;
    
    // Determine which department-specific fields to show
    if (departmentName.toLowerCase().includes('cardio') || departmentId === '3') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Cardiology Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Heart Rate</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 72 bpm"
                {...register('departmentSpecificData.heartRate')}
              />
            </div>
            <div>
              <label className="form-label">Blood Pressure</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 120/80 mmHg"
                {...register('departmentSpecificData.bloodPressure')}
              />
            </div>
            <div>
              <label className="form-label">ECG Findings</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe ECG findings"
                {...register('departmentSpecificData.ecgFindings')}
              />
            </div>
            <div>
              <label className="form-label">Heart Sounds</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe heart sounds"
                {...register('departmentSpecificData.heartSounds')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Chest Pain Assessment</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe chest pain characteristics"
                {...register('departmentSpecificData.chestPainAssessment')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Cardiovascular Risk Factors</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="List cardiovascular risk factors"
                {...register('departmentSpecificData.riskFactors')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('eye') || departmentId === '8') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Ophthalmology Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Visual Acuity (Right Eye)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 20/20"
                {...register('departmentSpecificData.visualAcuityRight')}
              />
            </div>
            <div>
              <label className="form-label">Visual Acuity (Left Eye)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 20/20"
                {...register('departmentSpecificData.visualAcuityLeft')}
              />
            </div>
            <div>
              <label className="form-label">Intraocular Pressure (Right Eye)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 15 mmHg"
                {...register('departmentSpecificData.iop_right')}
              />
            </div>
            <div>
              <label className="form-label">Intraocular Pressure (Left Eye)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 15 mmHg"
                {...register('departmentSpecificData.iop_left')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Fundoscopy Findings</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe fundoscopy findings"
                {...register('departmentSpecificData.fundoscopyFindings')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Slit Lamp Examination</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe slit lamp examination findings"
                {...register('departmentSpecificData.slitLampExamination')}
              />
            </div>
            <div>
              <label className="form-label">Color Vision</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Normal, Deficient"
                {...register('departmentSpecificData.colorVision')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('dental') || departmentId === '7') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Dental Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Dental Chart</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Describe dental chart findings"
                {...register('departmentSpecificData.dentalChart')}
              />
            </div>
            <div>
              <label className="form-label">Oral Hygiene</label>
              <select
                className="form-input"
                {...register('departmentSpecificData.oralHygiene')}
              >
                <option value="">Select</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="form-label">Teeth Condition</label>
              <select
                className="form-input"
                {...register('departmentSpecificData.teethCondition')}
              >
                <option value="">Select</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="form-label">Gum Health</label>
              <select
                className="form-input"
                {...register('departmentSpecificData.gumHealth')}
              >
                <option value="">Select</option>
                <option value="Healthy">Healthy</option>
                <option value="Gingivitis">Gingivitis</option>
                <option value="Periodontitis">Periodontitis</option>
              </select>
            </div>
            <div>
              <label className="form-label">Dental Procedures</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Filling, Extraction"
                {...register('departmentSpecificData.dentalProcedures')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('ortho') || departmentId === '6') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Orthopedic Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Joint Examination</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe joint examination findings"
                {...register('departmentSpecificData.jointExamination')}
              />
            </div>
            <div>
              <label className="form-label">Range of Motion</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Full, Limited"
                {...register('departmentSpecificData.rangeOfMotion')}
              />
            </div>
            <div>
              <label className="form-label">Muscle Strength</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 5/5, 4/5"
                {...register('departmentSpecificData.muscleStrength')}
              />
            </div>
            <div>
              <label className="form-label">Gait Assessment</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Normal, Antalgic"
                {...register('departmentSpecificData.gaitAssessment')}
              />
            </div>
            <div>
              <label className="form-label">Deformities</label>
              <input
                type="text"
                className="form-input"
                placeholder="Describe any deformities"
                {...register('departmentSpecificData.deformities')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('pediatric') || departmentId === '4') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Pediatric Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Growth Percentile</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 50th percentile"
                {...register('departmentSpecificData.growthPercentile')}
              />
            </div>
            <div>
              <label className="form-label">Developmental Milestones</label>
              <select
                className="form-input"
                {...register('departmentSpecificData.developmentalMilestones')}
              >
                <option value="">Select</option>
                <option value="Age-appropriate">Age-appropriate</option>
                <option value="Delayed">Delayed</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="form-label">Immunization Status</label>
              <select
                className="form-input"
                {...register('departmentSpecificData.immunizationStatus')}
              >
                <option value="">Select</option>
                <option value="Up to date">Up to date</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Not started">Not started</option>
              </select>
            </div>
            <div>
              <label className="form-label">Feeding History</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Breastfed, Formula"
                {...register('departmentSpecificData.feedingHistory')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('gyn') || departmentId === '4') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Gynecology Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Last Menstrual Period</label>
              <input
                type="date"
                className="form-input"
                {...register('departmentSpecificData.lastMenstrualPeriod')}
              />
            </div>
            <div>
              <label className="form-label">Menstrual History</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Regular, Irregular"
                {...register('departmentSpecificData.menstrualHistory')}
              />
            </div>
            <div>
              <label className="form-label">Pregnancy History</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., G2P1"
                {...register('departmentSpecificData.pregnancyHistory')}
              />
            </div>
            <div>
              <label className="form-label">Pelvic Examination</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe pelvic examination findings"
                {...register('departmentSpecificData.pelvicExamination')}
              />
            </div>
            <div>
              <label className="form-label">Pap Smear Results</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Normal, Abnormal"
                {...register('departmentSpecificData.papSmearResults')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('general') || departmentId === '2') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">General Medicine Assessment</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label">General Appearance</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe general appearance"
                {...register('departmentSpecificData.generalAppearance')}
              />
            </div>
            <div>
              <label className="form-label">Systemic Review</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Describe systemic review findings"
                {...register('departmentSpecificData.systemicReview')}
              />
            </div>
            <div>
              <label className="form-label">Chronic Disease Status</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe status of any chronic diseases"
                {...register('departmentSpecificData.chronicDiseaseStatus')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('surgical') || departmentId === '5') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Surgical Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Surgical Site Assessment</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe surgical site"
                {...register('departmentSpecificData.surgicalSiteAssessment')}
              />
            </div>
            <div>
              <label className="form-label">Pre-operative Assessment</label>
              <select
                className="form-input"
                {...register('departmentSpecificData.preOperativeAssessment')}
              >
                <option value="">Select</option>
                <option value="Fit for surgery">Fit for surgery</option>
                <option value="Requires optimization">Requires optimization</option>
                <option value="High risk">High risk</option>
              </select>
            </div>
            <div>
              <label className="form-label">Surgical Procedure</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Appendectomy"
                {...register('departmentSpecificData.surgicalProcedure')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Post-operative Instructions</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe post-operative instructions"
                {...register('departmentSpecificData.postOperativeInstructions')}
              />
            </div>
          </div>
        </div>
      );
    } else if (departmentName.toLowerCase().includes('physio') || departmentId === '9') {
      return (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Physiotherapy Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Functional Assessment</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe functional assessment"
                {...register('departmentSpecificData.functionalAssessment')}
              />
            </div>
            <div>
              <label className="form-label">Pain Scale (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                className="form-input"
                placeholder="e.g., 5"
                {...register('departmentSpecificData.painScale')}
              />
            </div>
            <div>
              <label className="form-label">Treatment Plan</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Heat therapy, exercises"
                {...register('departmentSpecificData.treatmentPlan')}
              />
            </div>
            <div>
              <label className="form-label">Exercise Prescription</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe exercise prescription"
                {...register('departmentSpecificData.exercisePrescription')}
              />
            </div>
            <div>
              <label className="form-label">Rehabilitation Goals</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Describe rehabilitation goals"
                {...register('departmentSpecificData.rehabilitationGoals')}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Default to general assessment if no specific department is matched
    return null;
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

            {/* Patient History Section - Collapsible */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('patientHistory')}
              >
                <h3 className="text-md font-medium text-gray-900">Patient History</h3>
                <button type="button" className="text-gray-500">
                  {collapsedSections.patientHistory ? 
                    <Plus className="h-5 w-5" /> : 
                    <Minus className="h-5 w-5" />
                  }
                </button>
              </div>
              
              {!collapsedSections.patientHistory && (
                <div className="p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">History of Presenting Illness</h4>
                  <textarea
                    rows={3}
                    className="form-input text-sm"
                    placeholder="Enter details about the history of presenting illness..."
                    {...register('departmentSpecificData.historyOfPresentingIllness')}
                  />
                  
                  {patient.gender === 'Female' && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Gynecological/Obstetric History</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter gynecological or obstetric history if applicable..."
                        {...register('departmentSpecificData.gynecologicalHistory')}
                      />
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Past Medical and Surgical History</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter past medical and surgical history..."
                      {...register('departmentSpecificData.pastMedicalHistory')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Family and Socioeconomic History - Collapsible */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('familyHistory')}
              >
                <h3 className="text-md font-medium text-gray-900">Family and Socioeconomic History</h3>
                <button type="button" className="text-gray-500">
                  {collapsedSections.familyHistory ? 
                    <Plus className="h-5 w-5" /> : 
                    <Minus className="h-5 w-5" />
                  }
                </button>
              </div>
              
              {!collapsedSections.familyHistory && (
                <div className="p-4">
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Enter family history and socioeconomic information..."
                    {...register('departmentSpecificData.familyAndSocioeconomicHistory')}
                  />
                </div>
              )}
            </div>

            {/* General Examination - Collapsible */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('generalExamination')}
              >
                <h3 className="text-md font-medium text-gray-900">General Examination</h3>
                <button type="button" className="text-gray-500">
                  {collapsedSections.generalExamination ? 
                    <Plus className="h-5 w-5" /> : 
                    <Minus className="h-5 w-5" />
                  }
                </button>
              </div>
              
              {!collapsedSections.generalExamination && (
                <div className="p-4">
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Enter general examination findings..."
                    {...register('departmentSpecificData.generalExamination')}
                  />
                </div>
              )}
            </div>

            {/* Systemic Examination - Collapsible */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('systemicExamination')}
              >
                <h3 className="text-md font-medium text-gray-900">Systemic Examination</h3>
                <button type="button" className="text-gray-500">
                  {collapsedSections.systemicExamination ? 
                    <Plus className="h-5 w-5" /> : 
                    <Minus className="h-5 w-5" />
                  }
                </button>
              </div>
              
              {!collapsedSections.systemicExamination && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Cardiovascular System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter cardiovascular findings..."
                        {...register('departmentSpecificData.cardiovascularSystem')}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Respiratory System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter respiratory findings..."
                        {...register('departmentSpecificData.respiratorySystem')}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Gastrointestinal System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter gastrointestinal findings..."
                        {...register('departmentSpecificData.gastrointestinalSystem')}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Central Nervous System</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter neurological findings..."
                        {...register('departmentSpecificData.centralNervousSystem')}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Musculoskeletal</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter musculoskeletal findings..."
                        {...register('departmentSpecificData.musculoskeletal')}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Other Systems/Examination</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter other examination findings..."
                        {...register('departmentSpecificData.otherSystems')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Department-Specific Fields - Collapsible */}
            {getDepartmentSpecificFields() && (
              <div className="border rounded-lg overflow-hidden bg-blue-50 border-blue-200">
                <div 
                  className="bg-blue-100 p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('departmentSpecific')}
                >
                  <h3 className="text-md font-medium text-blue-900">Department-Specific Assessment</h3>
                  <button type="button" className="text-blue-500">
                    {collapsedSections.departmentSpecific ? 
                      <Plus className="h-5 w-5" /> : 
                      <Minus className="h-5 w-5" />
                    }
                  </button>
                </div>
                
                {!collapsedSections.departmentSpecific && (
                  <div className="p-4">
                    {getDepartmentSpecificFields()}
                  </div>
                )}
              </div>
            )}

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
            
            {prescriptions.length === 0 || (prescriptions.length === 1 && !prescriptions[0].medication) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Pill className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No medications prescribed yet</h3>
                <p className="text-gray-500 max-w-md mb-2">
                  Search for medications or add custom ones
                </p>
              </div>
            ) : null}
            
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
                        
                        // Show notification
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
                  <div className="sm:col-span-2">
                    <label className="form-label">Medication Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Pill className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={prescriptions[index]?.medication || searchMedication}
                        onChange={(e) => {
                          if (!prescriptions[index]?.medication) {
                            handleSearchMedication(e.target.value);
                          } else {
                            const updatedPrescriptions = [...prescriptions];
                            updatedPrescriptions[index] = {
                              ...updatedPrescriptions[index],
                              medication: e.target.value
                            };
                            setValue('prescriptions', updatedPrescriptions);
                          }
                        }}
                        className="form-input pl-10 pr-24"
                        placeholder="Search medication..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <button
                          type="button"
                          onClick={() => handleAddCustomMedication(index)}
                          className="h-full px-3 py-0 border-l border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700 text-sm rounded-r-md"
                        >
                          Add Custom
                        </button>
                      </div>
                    </div>
                    
                    {/* Medication search results */}
                    {showMedicationResults && medicationResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                        {medicationResults.map((med, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                            onClick={() => handleSelectMedication(med, index)}
                          >
                            <Pill className="h-4 w-4 text-primary-500 mr-2" />
                            {med}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Dosage</label>
                    <input
                      type="text"
                      {...register(`prescriptions.${index}.dosage` as const, {
                        required: prescriptions[index]?.medication ? 'Dosage is required' : false
                      })}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Frequency</label>
                    <select
                      {...register(`prescriptions.${index}.frequency` as const, {
                        required: prescriptions[index]?.medication ? 'Frequency is required' : false
                      })}
                      className="form-input"
                    >
                      <option value="">Select frequency</option>
                      {frequencies.map((freq, i) => (
                        <option key={i} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Duration</label>
                    <select
                      {...register(`prescriptions.${index}.duration` as const, {
                        required: prescriptions[index]?.medication ? 'Duration is required' : false
                      })}
                      className="form-input"
                    >
                      <option value="">Select duration</option>
                      {durations.map((duration, i) => (
                        <option key={i} value={duration}>{duration}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="form-label">Special Instructions</label>
                    <textarea
                      {...register(`prescriptions.${index}.instructions` as const)}
                      className="form-input"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
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
              
              {medicalCertificate && (
                <button
                  type="button"
                  onClick={() => setShowMedicalCertificateModal(true)}
                  className="ml-4 text-primary-600 text-sm hover:text-primary-700"
                >
                  Configure Certificate
                </button>
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
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-5 w-5 mr-2" />
                Complete Consultation
              </div>
            )}
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

      {/* Medical Certificate Modal */}
      {showMedicalCertificateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Medical Certificate</h3>
              <button 
                onClick={() => setShowMedicalCertificateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    {...register('medicalCertificateDetails.startDate')}
                  />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    {...register('medicalCertificateDetails.endDate')}
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Reason for medical certificate"
                  {...register('medicalCertificateDetails.reason')}
                />
              </div>
              
              <div>
                <label className="form-label">Recommendations</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Recommendations for patient"
                  {...register('medicalCertificateDetails.recommendations')}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                <div className="p-4 border border-gray-300 bg-white rounded">
                  <div className="text-center mb-4">
                    <h5 className="text-lg font-bold">{hospital?.name || 'Hospital'}</h5>
                    <p className="text-sm">{hospital?.address || 'Hospital Address'}</p>
                    <p className="text-sm">Phone: {hospital?.phone || 'Hospital Phone'}</p>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h5 className="text-lg font-bold">MEDICAL CERTIFICATE</h5>
                  </div>
                  
                  <p className="mb-4">
                    This is to certify that <strong>{patient.first_name} {patient.last_name}</strong>, 
                    {patient.gender === 'Male' ? ' a ' : ' a '} 
                    {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} year old 
                    {patient.gender === 'Male' ? ' male' : ' female'}, 
                    was examined by me on <strong>{new Date().toLocaleDateString()}</strong>.
                  </p>
                  
                  <p className="mb-4">
                    {medicalCertificateDetails?.reason || 'The patient requires medical leave as specified.'}
                  </p>
                  
                  <p className="mb-4">
                    The patient is advised to rest from <strong>{medicalCertificateDetails?.startDate || 'start date'}</strong> to <strong>{medicalCertificateDetails?.endDate || 'end date'}</strong>.
                  </p>
                  
                  {medicalCertificateDetails?.recommendations && (
                    <p className="mb-4">
                      <strong>Recommendations:</strong> {medicalCertificateDetails.recommendations}
                    </p>
                  )}
                  
                  <div className="mt-8 flex justify-end">
                    <div className="text-center">
                      <div className="border-t border-gray-300 w-48 mb-1"></div>
                      <p className="text-sm">Dr. {user?.first_name} {user?.last_name}</p>
                      <p className="text-xs">{user?.specialization || 'Physician'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowMedicalCertificateModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  addNotification({
                    message: 'Medical certificate printed',
                    type: 'success'
                  });
                }}
                className="btn btn-primary"
              >
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Minus component for collapsible sections
const Minus: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

export default ConsultationForm;