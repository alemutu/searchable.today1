import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
  Clock,
  FlaskRound as Flask,
  Microscope,
  ArrowUpRight,
  FileBarChart2,
  Building2
} from 'lucide-react';

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
    urgent: boolean;
  }[];
  radiologyTests: {
    testName: string;
    price: number;
    urgent: boolean;
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
  department: string;
}

interface RadiologyTest {
  id: string;
  name: string;
  price: number;
  department: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string[];
  price: number;
  inStock: boolean;
  quantity: number;
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
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showLabTests, setShowLabTests] = useState(false);
  const [showRadiologyTests, setShowRadiologyTests] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      prescriptions: [],
      labTests: [],
      radiologyTests: [],
      referral: null
    }
  });

  const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = useFieldArray({
    control,
    name: 'prescriptions'
  });

  const { fields: labTestFields, append: appendLabTest, remove: removeLabTest } = useFieldArray({
    control,
    name: 'labTests'
  });

  const { fields: radiologyTestFields, append: appendRadiologyTest, remove: removeRadiologyTest } = useFieldArray({
    control,
    name: 'radiologyTests'
  });

  const medicalCertificate = watch('medicalCertificate');
  const referral = watch('referral');
  
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
        { id: '1', name: 'Complete Blood Count (CBC)', price: 25.00, department: 'General Medicine' },
        { id: '2', name: 'Basic Metabolic Panel', price: 30.00, department: 'General Medicine' },
        { id: '3', name: 'Comprehensive Metabolic Panel', price: 45.00, department: 'General Medicine' },
        { id: '4', name: 'Lipid Panel', price: 35.00, department: 'Cardiology' },
        { id: '5', name: 'Liver Function Tests', price: 40.00, department: 'General Medicine' },
        { id: '6', name: 'Thyroid Function Tests', price: 50.00, department: 'Endocrinology' },
        { id: '7', name: 'Hemoglobin A1C', price: 30.00, department: 'Endocrinology' },
        { id: '8', name: 'Urinalysis', price: 20.00, department: 'General Medicine' },
        { id: '9', name: 'Stool Analysis', price: 25.00, department: 'Gastroenterology' },
        { id: '10', name: 'Cardiac Enzymes', price: 60.00, department: 'Cardiology' }
      ];
      
      setLabTests(mockLabTests);
    } catch (error) {
      console.error('Error loading lab tests:', error);
    }
  };

  const fetchRadiologyTests = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockRadiologyTests: RadiologyTest[] = [
        { id: '1', name: 'Chest X-Ray', price: 75.00, department: 'General Medicine' },
        { id: '2', name: 'Abdominal X-Ray', price: 80.00, department: 'General Medicine' },
        { id: '3', name: 'CT Scan - Head', price: 250.00, department: 'Neurology' },
        { id: '4', name: 'CT Scan - Chest', price: 275.00, department: 'Pulmonology' },
        { id: '5', name: 'CT Scan - Abdomen', price: 300.00, department: 'Gastroenterology' },
        { id: '6', name: 'MRI - Brain', price: 400.00, department: 'Neurology' },
        { id: '7', name: 'MRI - Spine', price: 425.00, department: 'Orthopedics' },
        { id: '8', name: 'Ultrasound - Abdomen', price: 150.00, department: 'Gastroenterology' },
        { id: '9', name: 'Ultrasound - Pelvis', price: 150.00, department: 'Gynecology' },
        { id: '10', name: 'Mammogram', price: 175.00, department: 'Gynecology' }
      ];
      
      setRadiologyTests(mockRadiologyTests);
    } catch (error) {
      console.error('Error loading radiology tests:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockMedications: Medication[] = [
        { id: '1', name: 'Amoxicillin', dosage: ['250mg', '500mg'], price: 15.00, inStock: true, quantity: 100 },
        { id: '2', name: 'Lisinopril', dosage: ['10mg', '20mg'], price: 20.00, inStock: true, quantity: 75 },
        { id: '3', name: 'Atorvastatin', dosage: ['10mg', '20mg', '40mg'], price: 25.00, inStock: true, quantity: 50 },
        { id: '4', name: 'Metformin', dosage: ['500mg', '850mg', '1000mg'], price: 18.00, inStock: true, quantity: 80 },
        { id: '5', name: 'Omeprazole', dosage: ['20mg', '40mg'], price: 22.00, inStock: false, quantity: 0 },
        { id: '6', name: 'Amlodipine', dosage: ['5mg', '10mg'], price: 15.00, inStock: true, quantity: 60 },
        { id: '7', name: 'Albuterol Inhaler', dosage: ['90mcg'], price: 35.00, inStock: true, quantity: 25 },
        { id: '8', name: 'Prednisone', dosage: ['5mg', '10mg', '20mg'], price: 12.00, inStock: true, quantity: 40 },
        { id: '9', name: 'Levothyroxine', dosage: ['25mcg', '50mcg', '75mcg', '100mcg'], price: 18.00, inStock: true, quantity: 55 },
        { id: '10', name: 'Ibuprofen', dosage: ['200mg', '400mg', '600mg'], price: 8.00, inStock: true, quantity: 120 }
      ];
      
      setMedications(mockMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
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

  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success notification
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
        // Navigate to patient list
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
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatment_plan: data.treatmentPlan,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          prescriptions: data.prescriptions,
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // If lab tests were ordered
      if (data.labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(
            data.labTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: test.testName,
              status: 'pending',
              is_emergency: test.urgent
            }))
          );
          
        if (labError) throw labError;
      }
      
      // If radiology tests were ordered
      if (data.radiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(
            data.radiologyTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: test.testName,
              status: 'pending',
              is_emergency: test.urgent
            }))
          );
          
        if (radiologyError) throw radiologyError;
      }
      
      // If prescriptions were added
      if (data.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
            medications: data.prescriptions.map(prescription => ({
              medication: prescription.medication,
              dosage: prescription.dosage,
              frequency: prescription.frequency,
              duration: prescription.duration,
              instructions: prescription.instructions,
              quantity: 1,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending'
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      // If referral was added
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
        ...data.labTests.map(test => ({
          name: `Lab Test: ${test.testName}`,
          amount: test.price,
          quantity: 1
        })),
        ...data.radiologyTests.map(test => ({
          name: `Radiology: ${test.testName}`,
          amount: test.price,
          quantity: 1
        })),
        ...data.prescriptions.map(prescription => {
          const med = medications.find(m => m.name === prescription.medication);
          return {
            name: `Medication: ${prescription.medication} ${prescription.dosage}`,
            amount: med?.price || 0,
            quantity: 1
          };
        }),
        {
          name: 'Consultation Fee',
          amount: 50.00, // Default consultation fee
          quantity: 1
        }
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
      
      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
      // Show success notification
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      // Navigate to patient list
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation form:', error.message);
      
      // Show error notification
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPrescription = () => {
    appendPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const handleAddLabTest = (test: LabTest) => {
    // Check if test is already added
    const existingTest = labTestFields.find(field => 
      (field as any).testName === test.name
    );
    
    if (!existingTest) {
      appendLabTest({
        testName: test.name,
        price: test.price,
        urgent: false
      });
      
      // Show notification
      addNotification({
        message: `Added lab test: ${test.name}`,
        type: 'success',
        duration: 2000
      });
    } else {
      // Show notification that test is already added
      addNotification({
        message: `${test.name} is already added`,
        type: 'info',
        duration: 2000
      });
    }
  };

  const handleAddRadiologyTest = (test: RadiologyTest) => {
    // Check if test is already added
    const existingTest = radiologyTestFields.find(field => 
      (field as any).testName === test.name
    );
    
    if (!existingTest) {
      appendRadiologyTest({
        testName: test.name,
        price: test.price,
        urgent: false
      });
      
      // Show notification
      addNotification({
        message: `Added radiology test: ${test.name}`,
        type: 'success',
        duration: 2000
      });
    } else {
      // Show notification that test is already added
      addNotification({
        message: `${test.name} is already added`,
        type: 'info',
        duration: 2000
      });
    }
  };

  const handleReferPatient = () => {
    if (referral) {
      // If referral already exists, clear it
      setValue('referral', null);
    } else {
      // Otherwise, create a new empty referral
      setValue('referral', {
        departmentId: '',
        reason: '',
        notes: ''
      });
    }
  };

  const filteredLabTests = selectedDepartment === 'all' 
    ? labTests 
    : labTests.filter(test => test.department === selectedDepartment);

  const filteredRadiologyTests = selectedDepartment === 'all' 
    ? radiologyTests 
    : radiologyTests.filter(test => test.department === selectedDepartment);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Left Column - Patient Info & Diagnostic Tests */}
          <div className="md:col-span-1 space-y-3">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Patient Information</h3>
              
              {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center text-error-600 mb-1">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Allergies</span>
                  </div>
                  <ul className="text-xs text-gray-600 ml-5 list-disc">
                    {patient.medical_history.allergies.map((allergy: any, index: number) => (
                      <li key={index}>
                        {allergy.allergen} - {allergy.reaction} ({allergy.severity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_history?.chronicConditions && patient.medical_history.chronicConditions.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center text-warning-600 mb-1">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Chronic Conditions</span>
                  </div>
                  <ul className="text-xs text-gray-600 ml-5 list-disc">
                    {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patient.medical_history?.currentMedications && patient.medical_history.currentMedications.length > 0 && (
                <div>
                  <div className="flex items-center text-primary-600 mb-1">
                    <Pill className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Current Medications</span>
                  </div>
                  <ul className="text-xs text-gray-600 ml-5 list-disc">
                    {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                      <li key={index}>
                        {medication.name} {medication.dosage && `- ${medication.dosage}`} {medication.frequency && `(${medication.frequency})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Diagnostic Tests */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Diagnostic Tests</h3>
              
              <div className="flex space-x-2 mb-3">
                <button
                  type="button"
                  onClick={() => setShowLabTests(!showLabTests)}
                  className="flex-1 btn btn-outline flex items-center justify-center text-sm py-1.5"
                >
                  <Flask className="h-4 w-4 mr-1.5" />
                  Lab Tests
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRadiologyTests(!showRadiologyTests)}
                  className="flex-1 btn btn-outline flex items-center justify-center text-sm py-1.5"
                >
                  <Microscope className="h-4 w-4 mr-1.5" />
                  Radiology
                </button>
              </div>
              
              {/* Lab Tests Selection */}
              {showLabTests && (
                <div className="mb-3 border rounded-md p-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Select Lab Tests</h4>
                    <select 
                      className="form-input text-xs py-1 px-2"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="all">All Departments</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                    </select>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto">
                    {filteredLabTests.map(test => (
                      <div 
                        key={test.id} 
                        className="flex justify-between items-center p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleAddLabTest(test)}
                      >
                        <div className="flex items-center">
                          <Flask className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                          <span className="text-xs">{test.name}</span>
                        </div>
                        <span className="text-xs font-medium">${test.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Radiology Tests Selection */}
              {showRadiologyTests && (
                <div className="mb-3 border rounded-md p-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Select Radiology Tests</h4>
                    <select 
                      className="form-input text-xs py-1 px-2"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="all">All Departments</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pulmonology">Pulmonology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Gynecology">Gynecology</option>
                    </select>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto">
                    {filteredRadiologyTests.map(test => (
                      <div 
                        key={test.id} 
                        className="flex justify-between items-center p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleAddRadiologyTest(test)}
                      >
                        <div className="flex items-center">
                          <Microscope className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                          <span className="text-xs">{test.name}</span>
                        </div>
                        <span className="text-xs font-medium">${test.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selected Lab Tests */}
              {labTestFields.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Selected Lab Tests</h4>
                  {labTestFields.map((field, index) => (
                    <div key={field.id} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
                      <div className="flex items-center">
                        <Flask className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                        <div>
                          <span className="text-xs font-medium">{(field as any).testName}</span>
                          <div className="flex items-center mt-0.5">
                            <input
                              type="checkbox"
                              id={`lab-urgent-${index}`}
                              {...register(`labTests.${index}.urgent`)}
                              className="h-3 w-3 text-error-600 focus:ring-error-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`lab-urgent-${index}`} className="ml-1 text-xs text-error-600">
                              Urgent
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-medium mr-2">${(field as any).price.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removeLabTest(index)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Selected Radiology Tests */}
              {radiologyTestFields.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Selected Radiology Tests</h4>
                  {radiologyTestFields.map((field, index) => (
                    <div key={field.id} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
                      <div className="flex items-center">
                        <Microscope className="h-3.5 w-3.5 text-primary-500 mr-1.5" />
                        <div>
                          <span className="text-xs font-medium">{(field as any).testName}</span>
                          <div className="flex items-center mt-0.5">
                            <input
                              type="checkbox"
                              id={`radiology-urgent-${index}`}
                              {...register(`radiologyTests.${index}.urgent`)}
                              className="h-3 w-3 text-error-600 focus:ring-error-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`radiology-urgent-${index}`} className="ml-1 text-xs text-error-600">
                              Urgent
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-medium mr-2">${(field as any).price.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removeRadiologyTest(index)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referral Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Referral</h3>
                <button
                  type="button"
                  onClick={handleReferPatient}
                  className={`btn ${referral ? 'btn-error' : 'btn-outline'} btn-sm flex items-center text-xs py-1 px-2`}
                >
                  {referral ? (
                    <>Cancel Referral</>
                  ) : (
                    <><ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Refer Patient</>
                  )}
                </button>
              </div>
              
              {referral && (
                <div className="space-y-2">
                  <div>
                    <label className="form-label text-xs">Department</label>
                    <select
                      {...register('referral.departmentId', { required: 'Department is required' })}
                      className="form-input py-1.5 text-sm"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {errors.referral?.departmentId && (
                      <p className="form-error text-xs">{errors.referral.departmentId.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Reason for Referral</label>
                    <input
                      type="text"
                      {...register('referral.reason', { required: 'Reason is required' })}
                      className="form-input py-1.5 text-sm"
                      placeholder="Reason for referral"
                    />
                    {errors.referral?.reason && (
                      <p className="form-error text-xs">{errors.referral.reason.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Notes (Optional)</label>
                    <textarea
                      {...register('referral.notes')}
                      className="form-input py-1.5 text-sm"
                      rows={2}
                      placeholder="Additional notes for the specialist"
                    />
                  </div>
                </div>
              )}
              
              {!referral && (
                <p className="text-xs text-gray-500">
                  Refer this patient to another department or specialist if needed.
                </p>
              )}
            </div>
          </div>

          {/* Middle Column - Main Consultation Form */}
          <div className="md:col-span-1 space-y-3">
            {/* Chief Complaint */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <label className="form-label required">Chief Complaint</label>
              <textarea
                {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                className="form-input"
                rows={3}
                placeholder="Enter the patient's main complaint"
              />
              {errors.chiefComplaint && (
                <p className="form-error">{errors.chiefComplaint.message}</p>
              )}
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <label className="form-label required">Diagnosis</label>
              <textarea
                {...register('diagnosis', { required: 'Diagnosis is required' })}
                className="form-input"
                rows={3}
                placeholder="Enter your diagnosis"
              />
              {errors.diagnosis && (
                <p className="form-error">{errors.diagnosis.message}</p>
              )}
            </div>

            {/* Treatment Plan */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <label className="form-label required">Treatment Plan</label>
              <textarea
                {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                className="form-input"
                rows={3}
                placeholder="Enter the treatment plan"
              />
              {errors.treatmentPlan && (
                <p className="form-error">{errors.treatmentPlan.message}</p>
              )}
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <label className="form-label">Additional Notes</label>
              <textarea
                {...register('notes')}
                className="form-input"
                rows={3}
                placeholder="Enter any additional notes (optional)"
              />
            </div>

            {/* Medical Certificate */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Medical Certificate</label>
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
              </div>
              
              {medicalCertificate && (
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Certificate Preview</h4>
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-800 text-xs"
                    >
                      Print Certificate
                    </button>
                  </div>
                  
                  <div className="border bg-white p-3 rounded-md">
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm mr-2">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-gray-900">{hospital?.name || 'Hospital'}</h5>
                          <p className="text-xs text-gray-500">{hospital?.address || 'Address'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h5 className="text-sm font-bold text-gray-900">MEDICAL CERTIFICATE</h5>
                        <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-xs">This is to certify that</p>
                      <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-xs">has been examined and diagnosed with</p>
                      <p className="text-sm font-medium">{watch('diagnosis') || '[Diagnosis will appear here]'}</p>
                    </div>
                    
                    <div className="text-xs">
                      <p>Treatment plan includes: {watch('treatmentPlan') || '[Treatment plan will appear here]'}</p>
                      <p className="mt-1">Patient is advised to:</p>
                      <ul className="list-disc ml-4 mt-1">
                        <li>Follow the prescribed medication</li>
                        <li>Rest for [X] days</li>
                        <li>Return for follow-up on [Date]</li>
                      </ul>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-sm font-medium">Dr. {user?.first_name} {user?.last_name}</p>
                          <p className="text-xs text-gray-500">License #: [License Number]</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Prescriptions & Billing */}
          <div className="md:col-span-1 space-y-3">
            {/* Prescriptions */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium text-gray-900">Prescriptions</h3>
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="btn btn-outline btn-sm flex items-center text-xs py-1 px-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Medication
                </button>
              </div>
              
              {prescriptionFields.length === 0 ? (
                <div className="text-center py-4">
                  <Pill className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No medications added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Medication" to prescribe</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptionFields.map((field, index) => (
                    <div key={field.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <label className="form-label text-xs required">Medication</label>
                        <button
                          type="button"
                          onClick={() => removePrescription(index)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <select
                        {...register(`prescriptions.${index}.medication`, { required: 'Medication is required' })}
                        className="form-input py-1.5 text-sm mb-2"
                      >
                        <option value="">Select medication</option>
                        {medications.map(med => (
                          <option 
                            key={med.id} 
                            value={med.name}
                            disabled={!med.inStock}
                          >
                            {med.name} {!med.inStock && '(Out of Stock)'}
                          </option>
                        ))}
                      </select>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="form-label text-xs required">Dosage</label>
                          <select
                            {...register(`prescriptions.${index}.dosage`, { required: 'Dosage is required' })}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="">Select dosage</option>
                            {medications
                              .find(med => med.name === watch(`prescriptions.${index}.medication`))
                              ?.dosage.map((dose, i) => (
                                <option key={i} value={dose}>{dose}</option>
                              )) || []}
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label text-xs required">Frequency</label>
                          <select
                            {...register(`prescriptions.${index}.frequency`, { required: 'Frequency is required' })}
                            className="form-input py-1.5 text-sm"
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
                      </div>
                      
                      <div className="mb-2">
                        <label className="form-label text-xs required">Duration</label>
                        <select
                          {...register(`prescriptions.${index}.duration`, { required: 'Duration is required' })}
                          className="form-input py-1.5 text-sm"
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
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Instructions</label>
                        <textarea
                          {...register(`prescriptions.${index}.instructions`)}
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder="Special instructions (e.g., take with food)"
                        />
                      </div>
                      
                      {/* Medication Status */}
                      {watch(`prescriptions.${index}.medication`) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {(() => {
                                const selectedMed = medications.find(med => med.name === watch(`prescriptions.${index}.medication`));
                                return selectedMed?.inStock ? (
                                  <span className="flex items-center text-xs text-success-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    In Stock ({selectedMed.quantity} available)
                                  </span>
                                ) : (
                                  <span className="flex items-center text-xs text-error-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Out of Stock
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="text-xs font-medium">
                              {(() => {
                                const selectedMed = medications.find(med => med.name === watch(`prescriptions.${index}.medication`));
                                return selectedMed ? `$${selectedMed.price.toFixed(2)}` : '';
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Billing Summary */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-3">Billing Summary</h3>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-sm">Consultation Fee</span>
                  <span className="text-sm font-medium">$50.00</span>
                </div>
                
                {labTestFields.length > 0 && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-sm">Lab Tests ({labTestFields.length})</span>
                      <span className="text-sm font-medium">
                        ${labTestFields.reduce((sum, field) => sum + (field as any).price, 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="pl-4 space-y-1">
                      {labTestFields.map((field, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-gray-500">
                          <span>{(field as any).testName}</span>
                          <span>${(field as any).price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {radiologyTestFields.length > 0 && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-sm">Radiology Tests ({radiologyTestFields.length})</span>
                      <span className="text-sm font-medium">
                        ${radiologyTestFields.reduce((sum, field) => sum + (field as any).price, 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="pl-4 space-y-1">
                      {radiologyTestFields.map((field, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-gray-500">
                          <span>{(field as any).testName}</span>
                          <span>${(field as any).price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {prescriptionFields.length > 0 && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-sm">Medications ({prescriptionFields.length})</span>
                      <span className="text-sm font-medium">
                        ${prescriptionFields.reduce((sum, field, index) => {
                          const medName = watch(`prescriptions.${index}.medication`);
                          const med = medications.find(m => m.name === medName);
                          return sum + (med?.price || 0);
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="pl-4 space-y-1">
                      {prescriptionFields.map((field, index) => {
                        const medName = watch(`prescriptions.${index}.medication`);
                        const med = medications.find(m => m.name === medName);
                        return medName ? (
                          <div key={index} className="flex justify-between items-center text-xs text-gray-500">
                            <span>{medName} {watch(`prescriptions.${index}.dosage`)}</span>
                            <span>${med?.price.toFixed(2) || '0.00'}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold text-primary-600">
                  ${(
                    50 + // Consultation fee
                    labTestFields.reduce((sum, field) => sum + (field as any).price, 0) +
                    radiologyTestFields.reduce((sum, field) => sum + (field as any).price, 0) +
                    prescriptionFields.reduce((sum, field, index) => {
                      const medName = watch(`prescriptions.${index}.medication`);
                      const med = medications.find(m => m.name === medName);
                      return sum + (med?.price || 0);
                    }, 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Patients
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
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