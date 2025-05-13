import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User as UserIcon, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Pill, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  ClipboardList, 
  FileCheck, 
  ArrowUpRight,
  Flask,
  Microscope,
  DollarSign,
  Printer,
  Activity,
  Heart,
  Thermometer,
  Settings as Lungs,
  Droplets,
  Scale,
  Ruler,
  Calculator,
  Clock,
  Brain,
  Building2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ConsultationFormData {
  chiefComplaint: string;
  history: string;
  examination: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  followUpDate: string;
  followUpNotes: string;
  medicalCertificate: boolean;
  certificateType: string;
  certificateDays: number;
  certificateNotes: string;
  medications: {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
    price: number;
  }[];
  labTests: {
    id: string;
    name: string;
    instructions: string;
    price: number;
  }[];
  radiologyTests: {
    id: string;
    name: string;
    instructions: string;
    price: number;
  }[];
  referral: {
    departmentId: string;
    reason: string;
    notes: string;
    urgency: 'routine' | 'urgent' | 'emergency';
  } | null;
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

interface Department {
  id: string;
  name: string;
}

interface VitalSigns {
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  painLevel: number | null;
}

// Mock data for medications with inventory status
const availableMedications = [
  { id: '1', name: 'Amoxicillin', dosages: ['250mg', '500mg'], inStock: true, price: 15.50 },
  { id: '2', name: 'Paracetamol', dosages: ['500mg'], inStock: true, price: 5.25 },
  { id: '3', name: 'Ibuprofen', dosages: ['200mg', '400mg'], inStock: true, price: 7.80 },
  { id: '4', name: 'Omeprazole', dosages: ['20mg'], inStock: true, price: 12.40 },
  { id: '5', name: 'Metformin', dosages: ['500mg', '850mg'], inStock: true, price: 9.60 },
  { id: '6', name: 'Atorvastatin', dosages: ['10mg', '20mg'], inStock: false, price: 18.75 },
  { id: '7', name: 'Lisinopril', dosages: ['5mg', '10mg'], inStock: true, price: 11.30 },
  { id: '8', name: 'Salbutamol', dosages: ['100mcg'], inStock: true, price: 14.20 },
  { id: '9', name: 'Prednisolone', dosages: ['5mg'], inStock: false, price: 16.90 },
  { id: '10', name: 'Azithromycin', dosages: ['250mg', '500mg'], inStock: true, price: 22.50 },
];

// Mock data for lab tests with prices
const availableLabTests = [
  { id: '1', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 25.00 },
  { id: '2', name: 'Basic Metabolic Panel', category: 'Chemistry', price: 35.50 },
  { id: '3', name: 'Comprehensive Metabolic Panel', category: 'Chemistry', price: 45.75 },
  { id: '4', name: 'Lipid Panel', category: 'Chemistry', price: 30.25 },
  { id: '5', name: 'Liver Function Tests', category: 'Chemistry', price: 40.00 },
  { id: '6', name: 'Thyroid Function Tests', category: 'Endocrinology', price: 55.50 },
  { id: '7', name: 'Hemoglobin A1C', category: 'Endocrinology', price: 35.00 },
  { id: '8', name: 'Urinalysis', category: 'Urine Studies', price: 20.00 },
  { id: '9', name: 'Urine Culture', category: 'Microbiology', price: 45.00 },
  { id: '10', name: 'Blood Culture', category: 'Microbiology', price: 65.00 },
  { id: '11', name: 'COVID-19 PCR Test', category: 'Virology', price: 85.00 },
  { id: '12', name: 'Rapid Strep Test', category: 'Microbiology', price: 30.00 },
  { id: '13', name: 'Pregnancy Test (Blood)', category: 'Endocrinology', price: 40.00 },
  { id: '14', name: 'Ferritin', category: 'Hematology', price: 35.00 },
  { id: '15', name: 'Vitamin D', category: 'Chemistry', price: 60.00 },
];

// Mock data for radiology tests with prices
const availableRadiologyTests = [
  { id: '1', name: 'Chest X-Ray', category: 'X-Ray', price: 75.00 },
  { id: '2', name: 'Abdominal X-Ray', category: 'X-Ray', price: 85.00 },
  { id: '3', name: 'CT Scan - Head', category: 'CT Scan', price: 350.00 },
  { id: '4', name: 'CT Scan - Chest', category: 'CT Scan', price: 450.00 },
  { id: '5', name: 'CT Scan - Abdomen', category: 'CT Scan', price: 500.00 },
  { id: '6', name: 'MRI - Brain', category: 'MRI', price: 750.00 },
  { id: '7', name: 'MRI - Spine', category: 'MRI', price: 800.00 },
  { id: '8', name: 'MRI - Knee', category: 'MRI', price: 650.00 },
  { id: '9', name: 'Ultrasound - Abdomen', category: 'Ultrasound', price: 200.00 },
  { id: '10', name: 'Ultrasound - Pelvis', category: 'Ultrasound', price: 225.00 },
  { id: '11', name: 'Ultrasound - Thyroid', category: 'Ultrasound', price: 175.00 },
  { id: '12', name: 'Mammogram', category: 'X-Ray', price: 250.00 },
  { id: '13', name: 'Bone Density Scan', category: 'X-Ray', price: 175.00 },
  { id: '14', name: 'Echocardiogram', category: 'Ultrasound', price: 350.00 },
  { id: '15', name: 'PET Scan', category: 'Nuclear Medicine', price: 1200.00 },
];

// Certificate templates
const certificateTemplates = [
  { id: 'sick_leave', name: 'Sick Leave Certificate', days: 3 },
  { id: 'fitness', name: 'Medical Fitness Certificate', days: 0 },
  { id: 'travel', name: 'Fit to Travel Certificate', days: 0 },
  { id: 'return_to_work', name: 'Return to Work Certificate', days: 0 },
  { id: 'school_absence', name: 'School Absence Certificate', days: 3 },
];

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'examination' | 'diagnosis' | 'diagnostics' | 'medication' | 'certificate' | 'summary'>('history');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [showRadiologyTestsModal, setShowRadiologyTestsModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [filteredLabTests, setFilteredLabTests] = useState(availableLabTests);
  const [filteredRadiologyTests, setFilteredRadiologyTests] = useState(availableRadiologyTests);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [radiologyTestSearchTerm, setRadiologyTestSearchTerm] = useState('');
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      history: '',
      examination: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      followUpDate: '',
      followUpNotes: '',
      medicalCertificate: false,
      certificateType: 'sick_leave',
      certificateDays: 3,
      certificateNotes: '',
      medications: [],
      labTests: [],
      radiologyTests: [],
      referral: null
    }
  });

  const medicalCertificate = watch('medicalCertificate');
  const certificateType = watch('certificateType');
  const medications = watch('medications');
  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');
  const referral = watch('referral');
  
  useEffect(() => {
    if (hospital) {
      fetchDepartments();
    }
    
    if (patientId) {
      fetchPatient();
      fetchLatestVitalSigns();
    } else {
      setIsLoading(false);
    }
  }, [hospital, patientId]);
  
  useEffect(() => {
    // Update certificate days when template changes
    const template = certificateTemplates.find(t => t.id === certificateType);
    if (template) {
      setValue('certificateDays', template.days);
    }
  }, [certificateType, setValue]);
  
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
  
  const fetchLatestVitalSigns = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockVitalSigns: VitalSigns = {
          temperature: 37.2,
          heartRate: 72,
          respiratoryRate: 16,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 98,
          weight: 70,
          height: 175,
          bmi: 22.9,
          painLevel: 0
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
      
      setVitalSigns({
        temperature: data.temperature,
        heartRate: data.heart_rate,
        respiratoryRate: data.respiratory_rate,
        bloodPressureSystolic: data.blood_pressure_systolic,
        bloodPressureDiastolic: data.blood_pressure_diastolic,
        oxygenSaturation: data.oxygen_saturation,
        weight: data.weight,
        height: data.height,
        bmi: data.bmi,
        painLevel: data.pain_level
      });
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
    const newMedication = {
      id: uuidv4(),
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: 1,
      price: 0
    };
    
    setValue('medications', [...medications, newMedication]);
  };
  
  const handleRemoveMedication = (id: string) => {
    setValue('medications', medications.filter(med => med.id !== id));
  };
  
  const handleAddLabTest = (test: any) => {
    const existingTest = labTests.find(t => t.name === test.name);
    if (existingTest) {
      addNotification({
        message: `${test.name} is already added`,
        type: 'warning'
      });
      return;
    }
    
    const newTest = {
      id: uuidv4(),
      name: test.name,
      instructions: '',
      price: test.price
    };
    
    setValue('labTests', [...labTests, newTest]);
    addNotification({
      message: `${test.name} added to lab tests`,
      type: 'success',
      duration: 2000
    });
  };
  
  const handleRemoveLabTest = (id: string) => {
    setValue('labTests', labTests.filter(test => test.id !== id));
  };
  
  const handleAddRadiologyTest = (test: any) => {
    const existingTest = radiologyTests.find(t => t.name === test.name);
    if (existingTest) {
      addNotification({
        message: `${test.name} is already added`,
        type: 'warning'
      });
      return;
    }
    
    const newTest = {
      id: uuidv4(),
      name: test.name,
      instructions: '',
      price: test.price
    };
    
    setValue('radiologyTests', [...radiologyTests, newTest]);
    addNotification({
      message: `${test.name} added to radiology tests`,
      type: 'success',
      duration: 2000
    });
  };
  
  const handleRemoveRadiologyTest = (id: string) => {
    setValue('radiologyTests', radiologyTests.filter(test => test.id !== id));
  };
  
  const handleSearchLabTests = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setLabTestSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredLabTests(availableLabTests);
    } else {
      setFilteredLabTests(
        availableLabTests.filter(test => 
          test.name.toLowerCase().includes(term.toLowerCase()) ||
          test.category.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
  };
  
  const handleSearchRadiologyTests = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setRadiologyTestSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredRadiologyTests(availableRadiologyTests);
    } else {
      setFilteredRadiologyTests(
        availableRadiologyTests.filter(test => 
          test.name.toLowerCase().includes(term.toLowerCase()) ||
          test.category.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
  };
  
  const handleSaveReferral = (data: any) => {
    setValue('referral', data);
    setShowReferralModal(false);
    addNotification({
      message: `Referral to ${departments.find(d => d.id === data.departmentId)?.name} created`,
      type: 'success'
    });
  };
  
  const handleCancelReferral = () => {
    setShowReferralModal(false);
  };
  
  const handleRemoveReferral = () => {
    setValue('referral', null);
  };
  
  const calculateTotalBill = () => {
    const medicationTotal = medications.reduce((sum, med) => sum + (med.price * med.quantity), 0);
    const labTestsTotal = labTests.reduce((sum, test) => sum + test.price, 0);
    const radiologyTestsTotal = radiologyTests.reduce((sum, test) => sum + test.price, 0);
    
    return {
      medicationTotal,
      labTestsTotal,
      radiologyTestsTotal,
      total: medicationTotal + labTestsTotal + radiologyTestsTotal
    };
  };

  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update patient flow step
        if (data.referral) {
          addNotification({
            message: `Patient referred to ${departments.find(d => d.id === data.referral?.departmentId)?.name}`,
            type: 'success'
          });
        } else {
          addNotification({
            message: 'Consultation completed successfully',
            type: 'success'
          });
        }
        
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
          prescriptions: data.medications.map(med => ({
            medication: med.medication,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
          })),
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab test orders if any
      if (data.labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(
            data.labTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: test.name,
              status: 'pending',
              notes: test.instructions
            }))
          );
          
        if (labError) throw labError;
      }
      
      // Create radiology test orders if any
      if (data.radiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(
            data.radiologyTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: test.name.toLowerCase().replace(/\s+/g, '_'),
              status: 'pending',
              notes: test.instructions
            }))
          );
          
        if (radiologyError) throw radiologyError;
      }
      
      // Create pharmacy order if medications are prescribed
      if (data.medications.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
            medications: data.medications.map(med => ({
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
      
      // Create referral if needed
      if (data.referral) {
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            referring_doctor_id: user.id,
            specialist_id: null, // Will be assigned later
            referral_date: new Date().toISOString(),
            reason: data.referral.reason,
            urgency: data.referral.urgency,
            status: 'pending',
            notes: data.referral.notes
          });
          
        if (referralError) throw referralError;
      }
      
      // Create billing record
      const billItems = [
        ...data.medications.map(med => ({
          name: `${med.medication} ${med.dosage}`,
          amount: med.price,
          quantity: med.quantity
        })),
        ...data.labTests.map(test => ({
          name: test.name,
          amount: test.price,
          quantity: 1
        })),
        ...data.radiologyTests.map(test => ({
          name: test.name,
          amount: test.price,
          quantity: 1
        }))
      ];
      
      if (billItems.length > 0) {
        const totalAmount = billItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
        
        const { error: billingError } = await supabase
          .from('billing')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            consultation_id: consultationData.id,
            services: billItems,
            total_amount: totalAmount,
            paid_amount: 0,
            payment_status: 'pending'
          });
          
        if (billingError) throw billingError;
      }
      
      // Determine the next flow step based on tests, medications, and referrals
      let nextStep = 'post_consultation';
      
      if (data.labTests.length > 0) {
        nextStep = 'lab_tests';
      } else if (data.radiologyTests.length > 0) {
        nextStep = 'radiology';
      } else if (data.medications.length > 0) {
        nextStep = 'pharmacy';
      } else if (billItems.length > 0) {
        nextStep = 'billing';
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: nextStep
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
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
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
                <UserIcon className="h-3 w-3 mr-1" />
                <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3 mr-1" />
                <span className="bg-black bg-opacity-20 px-1.5 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Left Column - Vital Signs and Medical History */}
          <div className="w-full md:w-1/3 space-y-3">
            {/* Vital Signs Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <Activity className="h-4 w-4 text-primary-500 mr-1" />
                  Vital Signs
                </h3>
                <span className="text-xs text-gray-500">Latest</span>
              </div>
              
              {vitalSigns ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {vitalSigns.temperature && (
                    <div className="flex items-center">
                      <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">Temp:</span>
                      <span className={`font-medium ${vitalSigns.temperature > 38 ? 'text-error-600' : 'text-gray-900'}`}>
                        {vitalSigns.temperature}°C
                      </span>
                    </div>
                  )}
                  
                  {vitalSigns.heartRate && (
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">HR:</span>
                      <span className={`font-medium ${vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60 ? 'text-error-600' : 'text-gray-900'}`}>
                        {vitalSigns.heartRate} bpm
                      </span>
                    </div>
                  )}
                  
                  {vitalSigns.respiratoryRate && (
                    <div className="flex items-center">
                      <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">RR:</span>
                      <span className={`font-medium ${vitalSigns.respiratoryRate > 20 ? 'text-error-600' : 'text-gray-900'}`}>
                        {vitalSigns.respiratoryRate} /min
                      </span>
                    </div>
                  )}
                  
                  {(vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureDiastolic) && (
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">BP:</span>
                      <span className={`font-medium ${vitalSigns.bloodPressureSystolic > 140 || vitalSigns.bloodPressureDiastolic > 90 ? 'text-error-600' : 'text-gray-900'}`}>
                        {vitalSigns.bloodPressureSystolic}/{vitalSigns.bloodPressureDiastolic}
                      </span>
                    </div>
                  )}
                  
                  {vitalSigns.oxygenSaturation && (
                    <div className="flex items-center">
                      <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">O₂:</span>
                      <span className={`font-medium ${vitalSigns.oxygenSaturation < 95 ? 'text-error-600' : 'text-gray-900'}`}>
                        {vitalSigns.oxygenSaturation}%
                      </span>
                    </div>
                  )}
                  
                  {vitalSigns.weight && (
                    <div className="flex items-center">
                      <Scale className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">Weight:</span>
                      <span className="font-medium text-gray-900">{vitalSigns.weight} kg</span>
                    </div>
                  )}
                  
                  {vitalSigns.height && (
                    <div className="flex items-center">
                      <Ruler className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">Height:</span>
                      <span className="font-medium text-gray-900">{vitalSigns.height} cm</span>
                    </div>
                  )}
                  
                  {vitalSigns.bmi && (
                    <div className="flex items-center">
                      <Calculator className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">BMI:</span>
                      <span className={`font-medium ${vitalSigns.bmi > 30 || vitalSigns.bmi < 18.5 ? 'text-warning-600' : 'text-gray-900'}`}>
                        {vitalSigns.bmi.toFixed(1)}
                      </span>
                    </div>
                  )}
                  
                  {vitalSigns.painLevel !== null && (
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-500 mr-1">Pain:</span>
                      <span className={`font-medium ${vitalSigns.painLevel > 5 ? 'text-error-600' : 'text-gray-900'}`}>
                        {vitalSigns.painLevel}/10
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No vital signs recorded</p>
              )}
            </div>
            
            {/* Medical History Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Medical History</h3>
              
              {patient.medical_history ? (
                <div className="space-y-3">
                  {patient.medical_history.allergies && patient.medical_history.allergies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-error-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Allergies
                      </h4>
                      <ul className="mt-1 text-sm">
                        {patient.medical_history.allergies.map((allergy: any, index: number) => (
                          <li key={index} className="text-gray-700">
                            {allergy.allergen} - {allergy.reaction} ({allergy.severity})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {patient.medical_history.chronicConditions && patient.medical_history.chronicConditions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Chronic Conditions</h4>
                      <ul className="mt-1 text-sm">
                        {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                          <li key={index} className="text-gray-700">{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {patient.medical_history.currentMedications && patient.medical_history.currentMedications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Current Medications</h4>
                      <ul className="mt-1 text-sm">
                        {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                          <li key={index} className="text-gray-700">
                            {medication.name} {medication.dosage && `- ${medication.dosage}`} {medication.frequency && `(${medication.frequency})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No medical history recorded</p>
              )}
            </div>
            
            {/* Referral Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Referral</h3>
                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="btn btn-sm btn-outline flex items-center text-xs"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Refer Patient
                </button>
              </div>
              
              {referral ? (
                <div className="p-2 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {departments.find(d => d.id === referral.departmentId)?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {referral.reason}</p>
                      {referral.notes && <p className="text-xs text-gray-500 mt-1">Notes: {referral.notes}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      referral.urgency === 'emergency' ? 'bg-error-100 text-error-800' :
                      referral.urgency === 'urgent' ? 'bg-warning-100 text-warning-800' :
                      'bg-success-100 text-success-800'
                    }`}>
                      {referral.urgency.charAt(0).toUpperCase() + referral.urgency.slice(1)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReferral}
                    className="mt-2 text-xs text-error-600 hover:text-error-800"
                  >
                    Remove Referral
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No referral created</p>
              )}
            </div>
            
            {/* Diagnostic Tests Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Diagnostic Tests</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLabTestsModal(true)}
                    className="btn btn-sm btn-outline flex items-center text-xs"
                  >
                    <Flask className="h-3 w-3 mr-1" />
                    Lab Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRadiologyTestsModal(true)}
                    className="btn btn-sm btn-outline flex items-center text-xs"
                  >
                    <Microscope className="h-3 w-3 mr-1" />
                    Radiology
                  </button>
                </div>
              </div>
              
              {labTests.length > 0 || radiologyTests.length > 0 ? (
                <div className="space-y-2">
                  {labTests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 flex items-center">
                        <Flask className="h-3 w-3 mr-1 text-primary-500" />
                        Lab Tests
                      </h4>
                      <ul className="mt-1">
                        {labTests.map((test) => (
                          <li key={test.id} className="text-sm flex justify-between items-center py-1 border-b border-gray-100">
                            <span>{test.name}</span>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">${test.price.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLabTest(test.id)}
                                className="text-error-500 hover:text-error-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {radiologyTests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 flex items-center">
                        <Microscope className="h-3 w-3 mr-1 text-primary-500" />
                        Radiology Tests
                      </h4>
                      <ul className="mt-1">
                        {radiologyTests.map((test) => (
                          <li key={test.id} className="text-sm flex justify-between items-center py-1 border-b border-gray-100">
                            <span>{test.name}</span>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">${test.price.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRadiologyTest(test.id)}
                                className="text-error-500 hover:text-error-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No diagnostic tests ordered</p>
              )}
            </div>
          </div>
          
          {/* Right Column - Main Form */}
          <div className="w-full md:w-2/3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-3">
              <div className="flex overflow-x-auto">
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'history'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  <FileText className="h-3 w-3 inline mr-1" />
                  History
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'examination'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('examination')}
                >
                  <Stethoscope className="h-3 w-3 inline mr-1" />
                  Examination
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'diagnosis'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('diagnosis')}
                >
                  <Brain className="h-3 w-3 inline mr-1" />
                  Diagnosis
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
                  <Flask className="h-3 w-3 inline mr-1" />
                  Diagnostics
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'medication'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('medication')}
                >
                  <Pill className="h-3 w-3 inline mr-1" />
                  Medication
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'certificate'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('certificate')}
                >
                  <FileCheck className="h-3 w-3 inline mr-1" />
                  Certificate
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'summary'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('summary')}
                >
                  <ClipboardList className="h-3 w-3 inline mr-1" />
                  Summary
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-3 min-h-[400px] overflow-y-auto">
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label required">Chief Complaint</label>
                    <textarea
                      {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                      className="form-input"
                      rows={2}
                      placeholder="Enter the patient's main complaint"
                    />
                    {errors.chiefComplaint && (
                      <p className="form-error">{errors.chiefComplaint.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">History of Present Illness</label>
                    <textarea
                      {...register('history')}
                      className="form-input"
                      rows={5}
                      placeholder="Enter detailed history of the present illness"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Follow-up Information</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label text-sm">Follow-up Date</label>
                        <input
                          type="date"
                          {...register('followUpDate')}
                          className="form-input"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Follow-up Notes</label>
                        <input
                          type="text"
                          {...register('followUpNotes')}
                          className="form-input"
                          placeholder="E.g., 'Return if symptoms worsen'"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'examination' && (
                <div>
                  <label className="form-label">Physical Examination</label>
                  <textarea
                    {...register('examination')}
                    className="form-input"
                    rows={10}
                    placeholder="Enter physical examination findings"
                  />
                </div>
              )}
              
              {activeTab === 'diagnosis' && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label required">Diagnosis</label>
                    <textarea
                      {...register('diagnosis', { required: 'Diagnosis is required' })}
                      className="form-input"
                      rows={4}
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
                      className="form-input"
                      rows={4}
                      placeholder="Enter treatment plan"
                    />
                    {errors.treatmentPlan && (
                      <p className="form-error">{errors.treatmentPlan.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      {...register('notes')}
                      className="form-input"
                      rows={3}
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              )}
              
              {activeTab === 'diagnostics' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-medium text-gray-900">Diagnostic Tests</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowLabTestsModal(true)}
                        className="btn btn-sm btn-outline flex items-center"
                      >
                        <Flask className="h-4 w-4 mr-1" />
                        Add Lab Tests
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRadiologyTestsModal(true)}
                        className="btn btn-sm btn-outline flex items-center"
                      >
                        <Microscope className="h-4 w-4 mr-1" />
                        Add Radiology
                      </button>
                    </div>
                  </div>
                  
                  {/* Lab Tests Section */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                      <Flask className="h-4 w-4 text-primary-500 mr-1" />
                      Laboratory Tests
                    </h4>
                    
                    {labTests.length > 0 ? (
                      <div className="space-y-2">
                        {labTests.map((test, index) => (
                          <div key={test.id} className="border-b pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{test.name}</p>
                                <div className="mt-1">
                                  <label className="block text-xs text-gray-500">Instructions</label>
                                  <input
                                    type="text"
                                    className="form-input py-1 text-sm mt-1"
                                    placeholder="Special instructions"
                                    value={test.instructions}
                                    onChange={(e) => {
                                      const updatedTests = [...labTests];
                                      updatedTests[index].instructions = e.target.value;
                                      setValue('labTests', updatedTests);
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 mr-2">${test.price.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLabTest(test.id)}
                                  className="text-error-500 hover:text-error-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No lab tests ordered</p>
                    )}
                  </div>
                  
                  {/* Radiology Tests Section */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                      <Microscope className="h-4 w-4 text-primary-500 mr-1" />
                      Radiology Tests
                    </h4>
                    
                    {radiologyTests.length > 0 ? (
                      <div className="space-y-2">
                        {radiologyTests.map((test, index) => (
                          <div key={test.id} className="border-b pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{test.name}</p>
                                <div className="mt-1">
                                  <label className="block text-xs text-gray-500">Instructions</label>
                                  <input
                                    type="text"
                                    className="form-input py-1 text-sm mt-1"
                                    placeholder="Special instructions"
                                    value={test.instructions}
                                    onChange={(e) => {
                                      const updatedTests = [...radiologyTests];
                                      updatedTests[index].instructions = e.target.value;
                                      setValue('radiologyTests', updatedTests);
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 mr-2">${test.price.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRadiologyTest(test.id)}
                                  className="text-error-500 hover:text-error-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No radiology tests ordered</p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'medication' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-medium text-gray-900">Medications</h3>
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="btn btn-sm btn-outline flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Medication
                    </button>
                  </div>
                  
                  {medications.length > 0 ? (
                    <div className="space-y-4">
                      {medications.map((medication, index) => (
                        <div key={medication.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-900">Medication #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(medication.id)}
                              className="text-error-500 hover:text-error-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <label className="form-label text-sm">Medication</label>
                              <select
                                className="form-input"
                                value={medication.medication}
                                onChange={(e) => {
                                  const updatedMedications = [...medications];
                                  const selectedMed = availableMedications.find(m => m.name === e.target.value);
                                  updatedMedications[index].medication = e.target.value;
                                  updatedMedications[index].price = selectedMed?.price || 0;
                                  setValue('medications', updatedMedications);
                                }}
                              >
                                <option value="">Select medication</option>
                                {availableMedications.map((med) => (
                                  <option 
                                    key={med.id} 
                                    value={med.name}
                                    disabled={!med.inStock}
                                  >
                                    {med.name} {!med.inStock && '(Out of Stock)'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="form-label text-sm">Dosage</label>
                              <select
                                className="form-input"
                                value={medication.dosage}
                                onChange={(e) => {
                                  const updatedMedications = [...medications];
                                  updatedMedications[index].dosage = e.target.value;
                                  setValue('medications', updatedMedications);
                                }}
                              >
                                <option value="">Select dosage</option>
                                {availableMedications.find(m => m.name === medication.medication)?.dosages.map((dosage) => (
                                  <option key={dosage} value={dosage}>{dosage}</option>
                                )) || []}
                              </select>
                            </div>
                            
                            <div>
                              <label className="form-label text-sm">Frequency</label>
                              <select
                                className="form-input"
                                value={medication.frequency}
                                onChange={(e) => {
                                  const updatedMedications = [...medications];
                                  updatedMedications[index].frequency = e.target.value;
                                  setValue('medications', updatedMedications);
                                }}
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
                                <option value="Before meals">Before meals</option>
                                <option value="After meals">After meals</option>
                                <option value="At bedtime">At bedtime</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="form-label text-sm">Duration</label>
                              <select
                                className="form-input"
                                value={medication.duration}
                                onChange={(e) => {
                                  const updatedMedications = [...medications];
                                  updatedMedications[index].duration = e.target.value;
                                  setValue('medications', updatedMedications);
                                }}
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
                                <option value="As directed">As directed</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="form-label text-sm">Quantity</label>
                              <input
                                type="number"
                                className="form-input"
                                min="1"
                                value={medication.quantity}
                                onChange={(e) => {
                                  const updatedMedications = [...medications];
                                  updatedMedications[index].quantity = parseInt(e.target.value);
                                  setValue('medications', updatedMedications);
                                }}
                              />
                            </div>
                            
                            <div>
                              <label className="form-label text-sm">Price per Unit</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="number"
                                  className="form-input pl-8"
                                  step="0.01"
                                  min="0"
                                  value={medication.price}
                                  onChange={(e) => {
                                    const updatedMedications = [...medications];
                                    updatedMedications[index].price = parseFloat(e.target.value);
                                    setValue('medications', updatedMedications);
                                  }}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <label className="form-label text-sm">Special Instructions</label>
                            <textarea
                              className="form-input"
                              rows={2}
                              value={medication.instructions}
                              onChange={(e) => {
                                const updatedMedications = [...medications];
                                updatedMedications[index].instructions = e.target.value;
                                setValue('medications', updatedMedications);
                              }}
                              placeholder="E.g., 'Take with food', 'Avoid alcohol', etc."
                            />
                          </div>
                          
                          {/* Inventory Status */}
                          {medication.medication && (
                            <div className="mt-2 flex items-center">
                              <div className={`w-2 h-2 rounded-full ${
                                availableMedications.find(m => m.name === medication.medication)?.inStock
                                  ? 'bg-success-500'
                                  : 'bg-error-500'
                              } mr-1`}></div>
                              <span className="text-xs text-gray-500">
                                {availableMedications.find(m => m.name === medication.medication)?.inStock
                                  ? 'In Stock'
                                  : 'Out of Stock'
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No medications prescribed</p>
                  )}
                </div>
              )}
              
              {activeTab === 'certificate' && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="medicalCertificate"
                      {...register('medicalCertificate')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                      Issue Medical Certificate
                    </label>
                  </div>
                  
                  {medicalCertificate && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <label className="form-label text-sm">Certificate Type</label>
                        <select
                          {...register('certificateType')}
                          className="form-input"
                        >
                          {certificateTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {certificateType === 'sick_leave' || certificateType === 'school_absence' ? (
                        <div>
                          <label className="form-label text-sm">Number of Days</label>
                          <input
                            type="number"
                            {...register('certificateDays')}
                            className="form-input"
                            min="1"
                          />
                        </div>
                      ) : null}
                      
                      <div>
                        <label className="form-label text-sm">Additional Notes</label>
                        <textarea
                          {...register('certificateNotes')}
                          className="form-input"
                          rows={3}
                          placeholder="Enter any additional information for the certificate"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCertificatePreview(true)}
                          className="btn btn-sm btn-outline flex items-center"
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Preview Certificate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Consultation Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Chief Complaint</h4>
                        <p className="text-sm text-gray-600">{watch('chiefComplaint') || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Diagnosis</h4>
                        <p className="text-sm text-gray-600">{watch('diagnosis') || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Treatment Plan</h4>
                        <p className="text-sm text-gray-600">{watch('treatmentPlan') || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Follow-up</h4>
                        <p className="text-sm text-gray-600">
                          {watch('followUpDate') 
                            ? `${new Date(watch('followUpDate')).toLocaleDateString()} - ${watch('followUpNotes') || 'No notes'}`
                            : 'No follow-up scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Diagnostic Tests</h3>
                    
                    {labTests.length > 0 || radiologyTests.length > 0 ? (
                      <div className="space-y-2">
                        {labTests.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <Flask className="h-3 w-3 mr-1 text-primary-500" />
                              Lab Tests ({labTests.length})
                            </h4>
                            <ul className="mt-1 text-sm text-gray-600">
                              {labTests.map((test) => (
                                <li key={test.id}>{test.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {radiologyTests.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <Microscope className="h-3 w-3 mr-1 text-primary-500" />
                              Radiology Tests ({radiologyTests.length})
                            </h4>
                            <ul className="mt-1 text-sm text-gray-600">
                              {radiologyTests.map((test) => (
                                <li key={test.id}>{test.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No diagnostic tests ordered</p>
                    )}
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Medications</h3>
                    
                    {medications.length > 0 ? (
                      <ul className="space-y-2">
                        {medications.map((med) => (
                          <li key={med.id} className="text-sm text-gray-600">
                            <span className="font-medium">{med.medication} {med.dosage}</span> - {med.frequency}, {med.duration}
                            {med.instructions && <span className="block text-xs text-gray-500">Instructions: {med.instructions}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No medications prescribed</p>
                    )}
                  </div>
                  
                  {referral && (
                    <div className="border-b pb-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Referral</h3>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {departments.find(d => d.id === referral.departmentId)?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {referral.reason}
                      </p>
                      {referral.notes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {referral.notes}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Urgency:</span> {referral.urgency}
                      </p>
                    </div>
                  )}
                  
                  {medicalCertificate && (
                    <div className="border-b pb-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Medical Certificate</h3>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {certificateTemplates.find(t => t.id === certificateType)?.name}
                      </p>
                      {(certificateType === 'sick_leave' || certificateType === 'school_absence') && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Duration:</span> {watch('certificateDays')} days
                        </p>
                      )}
                      {watch('certificateNotes') && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {watch('certificateNotes')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-success-500" />
                      Billing Summary
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {medications.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Medications</h4>
                            <ul className="mt-1">
                              {medications.map((med) => (
                                <li key={med.id} className="flex justify-between text-sm">
                                  <span>{med.medication} {med.dosage} x{med.quantity}</span>
                                  <span>${(med.price * med.quantity).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex justify-between text-sm font-medium mt-1">
                              <span>Subtotal</span>
                              <span>${calculateTotalBill().medicationTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        
                        {labTests.length > 0 && (
                          <div className="pt-2 border-t border-gray-200 mt-2">
                            <h4 className="text-sm font-medium text-gray-700">Laboratory Tests</h4>
                            <ul className="mt-1">
                              {labTests.map((test) => (
                                <li key={test.id} className="flex justify-between text-sm">
                                  <span>{test.name}</span>
                                  <span>${test.price.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex justify-between text-sm font-medium mt-1">
                              <span>Subtotal</span>
                              <span>${calculateTotalBill().labTestsTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        
                        {radiologyTests.length > 0 && (
                          <div className="pt-2 border-t border-gray-200 mt-2">
                            <h4 className="text-sm font-medium text-gray-700">Radiology Tests</h4>
                            <ul className="mt-1">
                              {radiologyTests.map((test) => (
                                <li key={test.id} className="flex justify-between text-sm">
                                  <span>{test.name}</span>
                                  <span>${test.price.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex justify-between text-sm font-medium mt-1">
                              <span>Subtotal</span>
                              <span>${calculateTotalBill().radiologyTestsTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t border-gray-200 mt-2">
                          <div className="flex justify-between text-base font-bold">
                            <span>Total</span>
                            <span>${calculateTotalBill().total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary flex items-center"
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
      </form>

      {/* Lab Tests Modal */}
      {showLabTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Select Lab Tests</h3>
              <button
                type="button"
                onClick={() => setShowLabTestsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                className="form-input w-full"
                placeholder="Search lab tests..."
                value={labTestSearchTerm}
                onChange={handleSearchLabTests}
              />
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              {filteredLabTests.length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(filteredLabTests.reduce((acc: any, test) => {
                    if (!acc[test.category]) acc[test.category] = [];
                    acc[test.category].push(test);
                    return acc;
                  }, {})).map(([category, tests]: [string, any]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {tests.map((test: any) => (
                          <div 
                            key={test.id} 
                            className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                            onClick={() => handleAddLabTest(test)}
                          >
                            <div className="flex items-center">
                              <Flask className="h-4 w-4 text-primary-500 mr-2" />
                              <span className="text-sm">{test.name}</span>
                            </div>
                            <span className="text-sm font-medium">${test.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No lab tests found</p>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLabTestsModal(false)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Radiology Tests Modal */}
      {showRadiologyTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Select Radiology Tests</h3>
              <button
                type="button"
                onClick={() => setShowRadiologyTestsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                className="form-input w-full"
                placeholder="Search radiology tests..."
                value={radiologyTestSearchTerm}
                onChange={handleSearchRadiologyTests}
              />
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              {filteredRadiologyTests.length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(filteredRadiologyTests.reduce((acc: any, test) => {
                    if (!acc[test.category]) acc[test.category] = [];
                    acc[test.category].push(test);
                    return acc;
                  }, {})).map(([category, tests]: [string, any]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {tests.map((test: any) => (
                          <div 
                            key={test.id} 
                            className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                            onClick={() => handleAddRadiologyTest(test)}
                          >
                            <div className="flex items-center">
                              <Microscope className="h-4 w-4 text-primary-500 mr-2" />
                              <span className="text-sm">{test.name}</span>
                            </div>
                            <span className="text-sm font-medium">${test.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No radiology tests found</p>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRadiologyTestsModal(false)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Refer Patient</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  value={referral?.departmentId || ''}
                  onChange={(e) => setValue('referral', { 
                    ...referral || { reason: '', notes: '', urgency: 'routine' }, 
                    departmentId: e.target.value 
                  })}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">Reason for Referral</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="E.g., 'Specialized evaluation needed'"
                  value={referral?.reason || ''}
                  onChange={(e) => setValue('referral', { 
                    ...referral || { departmentId: '', notes: '', urgency: 'routine' }, 
                    reason: e.target.value 
                  })}
                />
              </div>
              
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Additional information for the specialist"
                  value={referral?.notes || ''}
                  onChange={(e) => setValue('referral', { 
                    ...referral || { departmentId: '', reason: '', urgency: 'routine' }, 
                    notes: e.target.value 
                  })}
                />
              </div>
              
              <div>
                <label className="form-label">Urgency</label>
                <select
                  className="form-input"
                  value={referral?.urgency || 'routine'}
                  onChange={(e) => setValue('referral', { 
                    ...referral || { departmentId: '', reason: '', notes: '' }, 
                    urgency: e.target.value as 'routine' | 'urgent' | 'emergency'
                  })}
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelReferral}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveReferral(referral)}
                className="btn btn-primary"
                disabled={!referral?.departmentId || !referral?.reason}
              >
                Create Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {showCertificatePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Certificate Preview</h3>
              <button
                type="button"
                onClick={() => setShowCertificatePreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="border rounded-lg p-8 bg-white">
                {/* Hospital Header */}
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-2 rounded-full">
                      <Building2 className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h2 className="text-xl font-bold text-gray-900">{hospital?.name || 'Hospital Name'}</h2>
                      <p className="text-sm text-gray-500">{hospital?.address || 'Hospital Address'}</p>
                      <p className="text-sm text-gray-500">{hospital?.phone || 'Phone Number'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-primary-600">
                      {certificateTemplates.find(t => t.id === certificateType)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                {/* Certificate Content */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">PATIENT INFORMATION</h4>
                    <p className="text-base font-medium">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-700">
                      Date of Birth: {new Date(patient.date_of_birth).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700">
                      Gender: {patient.gender}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">CERTIFICATE DETAILS</h4>
                    
                    {certificateType === 'sick_leave' && (
                      <div className="mt-2">
                        <p className="text-base">
                          This is to certify that <span className="font-medium">{patient.first_name} {patient.last_name}</span> has been examined by me on <span className="font-medium">{new Date().toLocaleDateString()}</span> and is advised to take leave from work/school for a period of <span className="font-medium">{watch('certificateDays')} day(s)</span> from <span className="font-medium">{new Date().toLocaleDateString()}</span> to <span className="font-medium">{new Date(new Date().setDate(new Date().getDate() + watch('certificateDays'))).toLocaleDateString()}</span>.
                        </p>
                        
                        {watch('certificateNotes') && (
                          <p className="mt-4 text-base">
                            Additional Notes: {watch('certificateNotes')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {certificateType === 'fitness' && (
                      <div className="mt-2">
                        <p className="text-base">
                          This is to certify that <span className="font-medium">{patient.first_name} {patient.last_name}</span> has been examined by me on <span className="font-medium">{new Date().toLocaleDateString()}</span> and is found to be in good health and fit for {watch('certificateNotes') || 'normal activities'}.
                        </p>
                      </div>
                    )}
                    
                    {certificateType === 'travel' && (
                      <div className="mt-2">
                        <p className="text-base">
                          This is to certify that <span className="font-medium">{patient.first_name} {patient.last_name}</span> has been examined by me on <span className="font-medium">{new Date().toLocaleDateString()}</span> and is found to be fit for travel. {watch('certificateNotes') && `Additional Notes: ${watch('certificateNotes')}`}
                        </p>
                      </div>
                    )}
                    
                    {certificateType === 'return_to_work' && (
                      <div className="mt-2">
                        <p className="text-base">
                          This is to certify that <span className="font-medium">{patient.first_name} {patient.last_name}</span> has been examined by me on <span className="font-medium">{new Date().toLocaleDateString()}</span> and is fit to return to work/school. {watch('certificateNotes') && `Additional Notes: ${watch('certificateNotes')}`}
                        </p>
                      </div>
                    )}
                    
                    {certificateType === 'school_absence' && (
                      <div className="mt-2">
                        <p className="text-base">
                          This is to certify that <span className="font-medium">{patient.first_name} {patient.last_name}</span> has been examined by me on <span className="font-medium">{new Date().toLocaleDateString()}</span> and is advised to be absent from school for a period of <span className="font-medium">{watch('certificateDays')} day(s)</span> from <span className="font-medium">{new Date().toLocaleDateString()}</span> to <span className="font-medium">{new Date(new Date().setDate(new Date().getDate() + watch('certificateDays'))).toLocaleDateString()}</span>.
                        </p>
                        
                        {watch('certificateNotes') && (
                          <p className="mt-4 text-base">
                            Additional Notes: {watch('certificateNotes')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-10">
                    <div className="border-t border-gray-300 w-48 mx-auto mb-2"></div>
                    <p className="text-center font-medium">Doctor's Signature</p>
                    <p className="text-center text-sm text-gray-700">
                      Dr. {user?.first_name} {user?.last_name}
                    </p>
                    {user?.specialization && (
                      <p className="text-center text-sm text-gray-700">
                        {user.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCertificatePreview(false)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary flex items-center"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;