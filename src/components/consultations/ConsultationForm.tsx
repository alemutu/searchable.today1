import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { Stethoscope, FileText, Pill, Save, ArrowLeft, Plus, Trash2, CheckSquare, Calendar, Clock, Activity, Thermometer, Heart, Droplets, Settings as Lungs, AlertTriangle, FileCheck, ArrowUpRight, FlaskRound as Flask, Microscope, Building2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
  };
  prescriptions: {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  vitalSigns: {
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    oxygenSaturation: number | null;
  };
  labTests: {
    id: string;
    name: string;
    price: number;
    isSelected: boolean;
  }[];
  radiologyTests: {
    id: string;
    name: string;
    price: number;
    isSelected: boolean;
  }[];
  referral: {
    departmentId: string;
    reason: string;
    notes: string;
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

interface LabTest {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface RadiologyTest {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Medication {
  id: string;
  name: string;
  dosage_forms: string[];
  in_stock: boolean;
  stock_level: number;
  price: number;
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
  const [activeTab, setActiveTab] = useState<'vitals' | 'diagnosis' | 'treatment'>('diagnosis');
  const [availableLabTests, setAvailableLabTests] = useState<LabTest[]>([]);
  const [availableRadiologyTests, setAvailableRadiologyTests] = useState<RadiologyTest[]>([]);
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [showRadiologyTestsModal, setShowRadiologyTestsModal] = useState(false);
  const [labTestFilter, setLabTestFilter] = useState('all');
  const [radiologyTestFilter, setRadiologyTestFilter] = useState('all');
  const [medicationFilter, setMedicationFilter] = useState('');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      medicalCertificateDetails: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: ''
      },
      prescriptions: [],
      vitalSigns: {
        temperature: null,
        heartRate: null,
        respiratoryRate: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        oxygenSaturation: null
      },
      labTests: [],
      radiologyTests: [],
      referral: null
    }
  });

  const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = useFieldArray({
    control,
    name: 'prescriptions'
  });

  const medicalCertificate = watch('medicalCertificate');
  const selectedLabTests = watch('labTests');
  const selectedRadiologyTests = watch('radiologyTests');
  
  useEffect(() => {
    if (hospital) {
      fetchDepartments();
      fetchLabTests();
      fetchRadiologyTests();
      fetchMedications();
    }
    
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [hospital, patientId]);
  
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

  const fetchLabTests = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockLabTests: LabTest[] = [
        { id: '1', name: 'Complete Blood Count (CBC)', price: 25.00, category: 'hematology' },
        { id: '2', name: 'Basic Metabolic Panel', price: 30.00, category: 'chemistry' },
        { id: '3', name: 'Comprehensive Metabolic Panel', price: 45.00, category: 'chemistry' },
        { id: '4', name: 'Lipid Panel', price: 35.00, category: 'chemistry' },
        { id: '5', name: 'Liver Function Tests', price: 40.00, category: 'chemistry' },
        { id: '6', name: 'Thyroid Function Tests', price: 50.00, category: 'endocrinology' },
        { id: '7', name: 'Hemoglobin A1C', price: 30.00, category: 'endocrinology' },
        { id: '8', name: 'Urinalysis', price: 20.00, category: 'urinalysis' },
        { id: '9', name: 'Urine Culture', price: 35.00, category: 'microbiology' },
        { id: '10', name: 'Blood Culture', price: 45.00, category: 'microbiology' },
        { id: '11', name: 'Stool Analysis', price: 30.00, category: 'microbiology' },
        { id: '12', name: 'Prothrombin Time (PT)', price: 25.00, category: 'coagulation' },
        { id: '13', name: 'Partial Thromboplastin Time (PTT)', price: 25.00, category: 'coagulation' },
        { id: '14', name: 'C-Reactive Protein (CRP)', price: 30.00, category: 'immunology' },
        { id: '15', name: 'Erythrocyte Sedimentation Rate (ESR)', price: 20.00, category: 'immunology' }
      ];
      
      setAvailableLabTests(mockLabTests);
      
      // Initialize the form with lab tests
      setValue('labTests', mockLabTests.map(test => ({
        id: test.id,
        name: test.name,
        price: test.price,
        isSelected: false
      })));
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const fetchRadiologyTests = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockRadiologyTests: RadiologyTest[] = [
        { id: '1', name: 'Chest X-Ray', price: 75.00, category: 'x_ray' },
        { id: '2', name: 'Abdominal X-Ray', price: 80.00, category: 'x_ray' },
        { id: '3', name: 'Skull X-Ray', price: 85.00, category: 'x_ray' },
        { id: '4', name: 'CT Scan - Head', price: 250.00, category: 'ct_scan' },
        { id: '5', name: 'CT Scan - Chest', price: 275.00, category: 'ct_scan' },
        { id: '6', name: 'CT Scan - Abdomen', price: 300.00, category: 'ct_scan' },
        { id: '7', name: 'MRI - Brain', price: 400.00, category: 'mri' },
        { id: '8', name: 'MRI - Spine', price: 425.00, category: 'mri' },
        { id: '9', name: 'MRI - Knee', price: 375.00, category: 'mri' },
        { id: '10', name: 'Ultrasound - Abdomen', price: 150.00, category: 'ultrasound' },
        { id: '11', name: 'Ultrasound - Pelvis', price: 150.00, category: 'ultrasound' },
        { id: '12', name: 'Ultrasound - Thyroid', price: 125.00, category: 'ultrasound' },
        { id: '13', name: 'Mammogram', price: 175.00, category: 'mammogram' },
        { id: '14', name: 'Bone Densitometry (DEXA)', price: 150.00, category: 'dexa_scan' },
        { id: '15', name: 'PET Scan', price: 800.00, category: 'pet_scan' }
      ];
      
      setAvailableRadiologyTests(mockRadiologyTests);
      
      // Initialize the form with radiology tests
      setValue('radiologyTests', mockRadiologyTests.map(test => ({
        id: test.id,
        name: test.name,
        price: test.price,
        isSelected: false
      })));
    } catch (error) {
      console.error('Error fetching radiology tests:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockMedications: Medication[] = [
        { id: '1', name: 'Amoxicillin', dosage_forms: ['250mg Capsule', '500mg Capsule', '125mg/5ml Suspension'], in_stock: true, stock_level: 120, price: 10.50 },
        { id: '2', name: 'Lisinopril', dosage_forms: ['5mg Tablet', '10mg Tablet', '20mg Tablet'], in_stock: true, stock_level: 85, price: 15.75 },
        { id: '3', name: 'Atorvastatin', dosage_forms: ['10mg Tablet', '20mg Tablet', '40mg Tablet'], in_stock: true, stock_level: 92, price: 22.30 },
        { id: '4', name: 'Metformin', dosage_forms: ['500mg Tablet', '850mg Tablet', '1000mg Tablet'], in_stock: true, stock_level: 110, price: 12.45 },
        { id: '5', name: 'Omeprazole', dosage_forms: ['20mg Capsule', '40mg Capsule'], in_stock: true, stock_level: 75, price: 18.20 },
        { id: '6', name: 'Ibuprofen', dosage_forms: ['200mg Tablet', '400mg Tablet', '600mg Tablet', '100mg/5ml Suspension'], in_stock: true, stock_level: 150, price: 8.95 },
        { id: '7', name: 'Paracetamol', dosage_forms: ['500mg Tablet', '120mg/5ml Suspension'], in_stock: true, stock_level: 200, price: 5.50 },
        { id: '8', name: 'Azithromycin', dosage_forms: ['250mg Tablet', '500mg Tablet', '200mg/5ml Suspension'], in_stock: true, stock_level: 65, price: 25.80 },
        { id: '9', name: 'Salbutamol', dosage_forms: ['100mcg Inhaler', '2mg Tablet', '2mg/5ml Syrup'], in_stock: true, stock_level: 40, price: 15.25 },
        { id: '10', name: 'Prednisolone', dosage_forms: ['5mg Tablet', '15mg/5ml Solution'], in_stock: true, stock_level: 55, price: 14.75 },
        { id: '11', name: 'Amlodipine', dosage_forms: ['5mg Tablet', '10mg Tablet'], in_stock: true, stock_level: 80, price: 16.40 },
        { id: '12', name: 'Metoprolol', dosage_forms: ['25mg Tablet', '50mg Tablet', '100mg Tablet'], in_stock: true, stock_level: 70, price: 19.30 },
        { id: '13', name: 'Ciprofloxacin', dosage_forms: ['250mg Tablet', '500mg Tablet', '750mg Tablet'], in_stock: false, stock_level: 0, price: 28.15 },
        { id: '14', name: 'Fluoxetine', dosage_forms: ['10mg Capsule', '20mg Capsule', '40mg Capsule'], in_stock: true, stock_level: 45, price: 32.60 },
        { id: '15', name: 'Loratadine', dosage_forms: ['10mg Tablet', '5mg/5ml Syrup'], in_stock: true, stock_level: 60, price: 11.85 }
      ];
      
      setAvailableMedications(mockMedications);
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

  const handleAddPrescription = () => {
    appendPrescription({
      id: uuidv4(),
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const handleLabTestToggle = (testId: string) => {
    setValue(
      'labTests',
      selectedLabTests.map(test => 
        test.id === testId ? { ...test, isSelected: !test.isSelected } : test
      )
    );
  };

  const handleRadiologyTestToggle = (testId: string) => {
    setValue(
      'radiologyTests',
      selectedRadiologyTests.map(test => 
        test.id === testId ? { ...test, isSelected: !test.isSelected } : test
      )
    );
  };

  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', data);
        
        // Filter only selected lab tests
        const selectedLabs = data.labTests.filter(test => test.isSelected);
        console.log('Selected lab tests:', selectedLabs);
        
        // Filter only selected radiology tests
        const selectedRadiology = data.radiologyTests.filter(test => test.isSelected);
        console.log('Selected radiology tests:', selectedRadiology);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success notification
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
        // Update patient flow step
        if (selectedLabs.length > 0) {
          console.log('Patient referred to laboratory');
          // In a real app, we would update the patient's flow step to 'lab_tests'
        } else if (selectedRadiology.length > 0) {
          console.log('Patient referred to radiology');
          // In a real app, we would update the patient's flow step to 'radiology'
        } else if (data.prescriptions.length > 0) {
          console.log('Patient referred to pharmacy');
          // In a real app, we would update the patient's flow step to 'pharmacy'
        } else {
          console.log('Patient consultation completed');
          // In a real app, we would update the patient's flow step to 'completed'
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
          prescriptions: data.prescriptions.length > 0 ? data.prescriptions : null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // If lab tests are selected, create lab orders
      const selectedLabs = data.labTests.filter(test => test.isSelected);
      if (selectedLabs.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(selectedLabs.map(test => ({
            patient_id: patient.id,
            hospital_id: hospital.id,
            test_type: test.name,
            status: 'pending'
          })));

        if (labError) throw labError;
      }
      
      // If radiology tests are selected, create radiology orders
      const selectedRadiology = data.radiologyTests.filter(test => test.isSelected);
      if (selectedRadiology.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(selectedRadiology.map(test => ({
            patient_id: patient.id,
            hospital_id: hospital.id,
            scan_type: test.name.toLowerCase().replace(/\s+/g, '_'),
            status: 'pending'
          })));

        if (radiologyError) throw radiologyError;
      }
      
      // If prescriptions are added, create pharmacy order
      if (data.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
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
            payment_status: 'pending'
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // If referral is added, create referral record
      if (data.referral && data.referral.departmentId) {
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            referring_doctor_id: user.id,
            referral_date: new Date().toISOString(),
            reason: data.referral.reason,
            notes: data.referral.notes,
            urgency: 'routine',
            status: 'pending'
          });

        if (referralError) throw referralError;
      }
      
      // Create billing record
      const services = [
        ...selectedLabs.map(test => ({
          name: `Lab Test: ${test.name}`,
          amount: test.price,
          quantity: 1
        })),
        ...selectedRadiology.map(test => ({
          name: `Radiology: ${test.name}`,
          amount: test.price,
          quantity: 1
        })),
        ...data.prescriptions.map(p => {
          const medication = availableMedications.find(m => m.name === p.medication);
          return {
            name: `Medication: ${p.medication} ${p.dosage}`,
            amount: medication?.price || 0,
            quantity: 1
          };
        })
      ];
      
      if (services.length > 0) {
        const totalAmount = services.reduce((sum, service) => sum + (service.amount * service.quantity), 0);
        
        const { error: billingError } = await supabase
          .from('billing')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            consultation_id: consultationData.id,
            services,
            total_amount: totalAmount,
            paid_amount: 0,
            payment_status: 'pending'
          });

        if (billingError) throw billingError;
      }
      
      // Determine the next flow step based on what was ordered
      let nextStep = 'post_consultation';
      
      if (selectedLabs.length > 0) {
        nextStep = 'lab_tests';
      } else if (selectedRadiology.length > 0) {
        nextStep = 'radiology';
      } else if (data.prescriptions.length > 0) {
        nextStep = 'pharmacy';
      }
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({ current_flow_step: nextStep })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
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

  const filteredLabTests = selectedLabTests.filter(test => {
    if (labTestFilter === 'all') return true;
    const foundTest = availableLabTests.find(t => t.id === test.id);
    return foundTest?.category === labTestFilter;
  });

  const filteredRadiologyTests = selectedRadiologyTests.filter(test => {
    if (radiologyTestFilter === 'all') return true;
    const foundTest = availableRadiologyTests.find(t => t.id === test.id);
    return foundTest?.category === radiologyTestFilter;
  });

  const filteredMedications = availableMedications.filter(med => {
    if (!medicationFilter) return true;
    return med.name.toLowerCase().includes(medicationFilter.toLowerCase());
  });

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

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Left Sidebar */}
          <div className="w-full md:w-1/3 space-y-3">
            {/* Vital Signs Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                  Vital Signs
                </h3>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Temperature (°C)</label>
                    <div className="flex items-center">
                      <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                      <Controller
                        name="vitalSigns.temperature"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            step="0.1"
                            className="form-input py-1 text-sm w-full"
                            placeholder="36.5"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Heart Rate (bpm)</label>
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 text-gray-400 mr-1" />
                      <Controller
                        name="vitalSigns.heartRate"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input py-1 text-sm w-full"
                            placeholder="75"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Respiratory Rate</label>
                    <div className="flex items-center">
                      <Lungs className="h-3 w-3 text-gray-400 mr-1" />
                      <Controller
                        name="vitalSigns.respiratoryRate"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input py-1 text-sm w-full"
                            placeholder="16"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Blood Pressure</label>
                    <div className="flex items-center space-x-1">
                      <Controller
                        name="vitalSigns.bloodPressureSystolic"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input py-1 text-sm w-1/2"
                            placeholder="120"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                      <span className="text-gray-500">/</span>
                      <Controller
                        name="vitalSigns.bloodPressureDiastolic"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input py-1 text-sm w-1/2"
                            placeholder="80"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">O₂ Saturation (%)</label>
                    <div className="flex items-center">
                      <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                      <Controller
                        name="vitalSigns.oxygenSaturation"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="form-input py-1 text-sm w-full"
                            placeholder="98"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Certificate Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <FileCheck className="h-4 w-4 text-primary-500 mr-1.5" />
                  Medical Certificate
                </h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="medicalCertificate"
                    {...register('medicalCertificate')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                    Issue Certificate
                  </label>
                </div>
              </div>
              
              {medicalCertificate && (
                <div className="space-y-2 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Start Date</label>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        <input
                          type="date"
                          className="form-input py-1 text-sm w-full"
                          {...register('medicalCertificateDetails.startDate')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">End Date</label>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        <input
                          type="date"
                          className="form-input py-1 text-sm w-full"
                          {...register('medicalCertificateDetails.endDate')}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Reason</label>
                    <textarea
                      className="form-input py-1 text-sm w-full"
                      rows={2}
                      placeholder="Reason for medical certificate"
                      {...register('medicalCertificateDetails.reason')}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline flex items-center text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Preview
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Referral Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <ArrowUpRight className="h-4 w-4 text-primary-500 mr-1.5" />
                  Referral
                </h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Department</label>
                  <div className="flex items-center">
                    <Building2 className="h-3 w-3 text-gray-400 mr-1" />
                    <Controller
                      name="referral.departmentId"
                      control={control}
                      render={({ field }) => (
                        <select
                          className="form-input py-1 text-sm w-full"
                          {...field}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value;
                            if (value) {
                              setValue('referral', {
                                departmentId: value,
                                reason: watch('referral')?.reason || '',
                                notes: watch('referral')?.notes || ''
                              });
                            } else {
                              setValue('referral', null);
                            }
                          }}
                        >
                          <option value="">Select department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>
                
                {watch('referral')?.departmentId && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Reason</label>
                      <input
                        type="text"
                        className="form-input py-1 text-sm w-full"
                        placeholder="Reason for referral"
                        value={watch('referral')?.reason || ''}
                        onChange={e => setValue('referral', {
                          ...watch('referral')!,
                          reason: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Notes</label>
                      <textarea
                        className="form-input py-1 text-sm w-full"
                        rows={2}
                        placeholder="Additional notes"
                        value={watch('referral')?.notes || ''}
                        onChange={e => setValue('referral', {
                          ...watch('referral')!,
                          notes: e.target.value
                        })}
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center text-xs w-full"
                    onClick={() => {
                      if (watch('referral')?.departmentId) {
                        setValue('referral', null);
                      } else {
                        setValue('referral', {
                          departmentId: '',
                          reason: '',
                          notes: ''
                        });
                      }
                    }}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {watch('referral')?.departmentId ? 'Cancel Referral' : 'Refer Patient'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-2/3 space-y-3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-3">
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'diagnosis'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('diagnosis')}
                >
                  <Stethoscope className="h-3 w-3 inline mr-1" />
                  Diagnosis
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'treatment'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('treatment')}
                >
                  <Pill className="h-3 w-3 inline mr-1" />
                  Treatment
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                    activeTab === 'vitals'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('vitals')}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Vitals
                </button>
              </div>
            </div>

            {/* Diagnosis Content */}
            {activeTab === 'diagnosis' && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <label className="form-label text-xs required">Chief Complaint</label>
                  <textarea
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    className={`form-input py-1 text-sm ${errors.chiefComplaint ? 'border-error-300' : ''}`}
                    rows={2}
                    placeholder="Enter the patient's main complaint"
                  />
                  {errors.chiefComplaint && (
                    <p className="form-error text-xs">{errors.chiefComplaint.message}</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-3">
                  <label className="form-label text-xs required">Diagnosis</label>
                  <textarea
                    {...register('diagnosis', { required: 'Diagnosis is required' })}
                    className={`form-input py-1 text-sm ${errors.diagnosis ? 'border-error-300' : ''}`}
                    rows={3}
                    placeholder="Enter your diagnosis"
                  />
                  {errors.diagnosis && (
                    <p className="form-error text-xs">{errors.diagnosis.message}</p>
                  )}
                </div>

                {/* Diagnostic Tests Section */}
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-medium text-gray-900 flex items-center">
                      <Flask className="h-4 w-4 text-primary-500 mr-1.5" />
                      Diagnostic Tests
                    </h3>
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
                  
                  <div className="space-y-3">
                    {/* Selected Lab Tests */}
                    {selectedLabTests.some(test => test.isSelected) && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Selected Lab Tests</h4>
                        <div className="space-y-1">
                          {selectedLabTests
                            .filter(test => test.isSelected)
                            .map(test => (
                              <div key={test.id} className="flex items-center justify-between bg-primary-50 p-1.5 rounded">
                                <div className="flex items-center">
                                  <Flask className="h-3 w-3 text-primary-500 mr-1.5" />
                                  <span className="text-xs">{test.name}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium mr-2">${test.price.toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleLabTestToggle(test.id)}
                                    className="text-error-500 hover:text-error-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Radiology Tests */}
                    {selectedRadiologyTests.some(test => test.isSelected) && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Selected Radiology Tests</h4>
                        <div className="space-y-1">
                          {selectedRadiologyTests
                            .filter(test => test.isSelected)
                            .map(test => (
                              <div key={test.id} className="flex items-center justify-between bg-secondary-50 p-1.5 rounded">
                                <div className="flex items-center">
                                  <Microscope className="h-3 w-3 text-secondary-500 mr-1.5" />
                                  <span className="text-xs">{test.name}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium mr-2">${test.price.toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRadiologyTestToggle(test.id)}
                                    className="text-error-500 hover:text-error-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {!selectedLabTests.some(test => test.isSelected) && 
                     !selectedRadiologyTests.some(test => test.isSelected) && (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-500">No diagnostic tests selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Treatment Content */}
            {activeTab === 'treatment' && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <label className="form-label text-xs required">Treatment Plan</label>
                  <textarea
                    {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                    className={`form-input py-1 text-sm ${errors.treatmentPlan ? 'border-error-300' : ''}`}
                    rows={3}
                    placeholder="Enter the treatment plan"
                  />
                  {errors.treatmentPlan && (
                    <p className="form-error text-xs">{errors.treatmentPlan.message}</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-medium text-gray-900 flex items-center">
                      <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
                      Medications
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddPrescription}
                      className="btn btn-sm btn-outline flex items-center text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Medication
                    </button>
                  </div>
                  
                  {prescriptionFields.length === 0 ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">No medications added</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptionFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-2">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xs font-medium text-gray-700">Medication #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removePrescription(index)}
                              className="text-error-500 hover:text-error-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-xs text-gray-500">Medication</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  className="form-input py-1 text-sm w-full"
                                  placeholder="Select medication"
                                  list={`medications-${index}`}
                                  {...register(`prescriptions.${index}.medication`)}
                                />
                                <datalist id={`medications-${index}`}>
                                  {filteredMedications.map(med => (
                                    <option key={med.id} value={med.name} />
                                  ))}
                                </datalist>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Dosage</label>
                              <input
                                type="text"
                                className="form-input py-1 text-sm w-full"
                                placeholder="e.g., 500mg"
                                {...register(`prescriptions.${index}.dosage`)}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-xs text-gray-500">Frequency</label>
                              <input
                                type="text"
                                className="form-input py-1 text-sm w-full"
                                placeholder="e.g., Twice daily"
                                {...register(`prescriptions.${index}.frequency`)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Duration</label>
                              <input
                                type="text"
                                className="form-input py-1 text-sm w-full"
                                placeholder="e.g., 7 days"
                                {...register(`prescriptions.${index}.duration`)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-gray-500">Instructions</label>
                            <input
                              type="text"
                              className="form-input py-1 text-sm w-full"
                              placeholder="e.g., Take with food"
                              {...register(`prescriptions.${index}.instructions`)}
                            />
                          </div>
                          
                          {/* Medication availability indicator */}
                          {watch(`prescriptions.${index}.medication`) && (
                            <div className="mt-2">
                              {(() => {
                                const medName = watch(`prescriptions.${index}.medication`);
                                const medication = availableMedications.find(m => m.name === medName);
                                
                                if (!medication) {
                                  return (
                                    <div className="flex items-center text-warning-600 text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Medication not found in inventory
                                    </div>
                                  );
                                }
                                
                                if (!medication.in_stock) {
                                  return (
                                    <div className="flex items-center text-error-600 text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Out of stock
                                    </div>
                                  );
                                }
                                
                                if (medication.stock_level < 10) {
                                  return (
                                    <div className="flex items-center text-warning-600 text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Low stock: {medication.stock_level} units
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="flex items-center text-success-600 text-xs">
                                    <CheckSquare className="h-3 w-3 mr-1" />
                                    In stock: {medication.stock_level} units
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-3">
                  <label className="form-label text-xs">Additional Notes</label>
                  <textarea
                    {...register('notes')}
                    className="form-input py-1 text-sm"
                    rows={3}
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>
            )}

            {/* Vitals Content */}
            {activeTab === 'vitals' && (
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                  Vital Signs
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs">Temperature (°C)</label>
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 text-gray-400 mr-2" />
                      <Controller
                        name="vitalSigns.temperature"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            placeholder="36.5"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Heart Rate (bpm)</label>
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 text-gray-400 mr-2" />
                      <Controller
                        name="vitalSigns.heartRate"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="75"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Respiratory Rate (breaths/min)</label>
                    <div className="flex items-center">
                      <Lungs className="h-4 w-4 text-gray-400 mr-2" />
                      <Controller
                        name="vitalSigns.respiratoryRate"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="16"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Blood Pressure (mmHg)</label>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="vitalSigns.bloodPressureSystolic"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Systolic (120)"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                      <span className="text-gray-500">/</span>
                      <Controller
                        name="vitalSigns.bloodPressureDiastolic"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Diastolic (80)"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Oxygen Saturation (%)</label>
                    <div className="flex items-center">
                      <Droplets className="h-4 w-4 text-gray-400 mr-2" />
                      <Controller
                        name="vitalSigns.oxygenSaturation"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="form-input"
                            placeholder="98"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-sm btn-outline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <button
            type="submit"
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
                Save Consultation
              </>
            )}
          </button>
        </div>
      </form>

      {/* Lab Tests Modal */}
      {showLabTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Flask className="h-5 w-5 text-primary-500 mr-2" />
                Select Lab Tests
              </h3>
              <button
                type="button"
                onClick={() => setShowLabTestsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setLabTestFilter('all')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    labTestFilter === 'all' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setLabTestFilter('hematology')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    labTestFilter === 'hematology' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Hematology
                </button>
                <button
                  type="button"
                  onClick={() => setLabTestFilter('chemistry')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    labTestFilter === 'chemistry' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Chemistry
                </button>
                <button
                  type="button"
                  onClick={() => setLabTestFilter('microbiology')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    labTestFilter === 'microbiology' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Microbiology
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredLabTests.map(test => (
                  <div 
                    key={test.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      test.isSelected ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`lab-test-${test.id}`}
                        checked={test.isSelected}
                        onChange={() => handleLabTestToggle(test.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`lab-test-${test.id}`} className="ml-2 block text-sm text-gray-900">
                        {test.name}
                      </label>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${test.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {selectedLabTests.filter(t => t.isSelected).length} tests selected
              </div>
              <button
                type="button"
                onClick={() => setShowLabTestsModal(false)}
                className="btn btn-primary"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Radiology Tests Modal */}
      {showRadiologyTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Microscope className="h-5 w-5 text-primary-500 mr-2" />
                Select Radiology Tests
              </h3>
              <button
                type="button"
                onClick={() => setShowRadiologyTestsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setRadiologyTestFilter('all')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    radiologyTestFilter === 'all' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRadiologyTestFilter('x_ray')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    radiologyTestFilter === 'x_ray' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  X-Ray
                </button>
                <button
                  type="button"
                  onClick={() => setRadiologyTestFilter('ct_scan')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    radiologyTestFilter === 'ct_scan' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  CT Scan
                </button>
                <button
                  type="button"
                  onClick={() => setRadiologyTestFilter('mri')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    radiologyTestFilter === 'mri' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  MRI
                </button>
                <button
                  type="button"
                  onClick={() => setRadiologyTestFilter('ultrasound')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    radiologyTestFilter === 'ultrasound' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Ultrasound
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredRadiologyTests.map(test => (
                  <div 
                    key={test.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      test.isSelected ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`radiology-test-${test.id}`}
                        checked={test.isSelected}
                        onChange={() => handleRadiologyTestToggle(test.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`radiology-test-${test.id}`} className="ml-2 block text-sm text-gray-900">
                        {test.name}
                      </label>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${test.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {selectedRadiologyTests.filter(t => t.isSelected).length} tests selected
              </div>
              <button
                type="button"
                onClick={() => setShowRadiologyTestsModal(false)}
                className="btn btn-primary"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;