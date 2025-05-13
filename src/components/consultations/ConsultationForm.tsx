import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User as UserIcon, 
  Calendar, 
  Clock, 
  Stethoscope, 
  FileText, 
  Pill, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckSquare, 
  FileCheck, 
  ArrowUpRight, 
  FlaskRound as Flask, 
  Microscope, 
  Building2 
} from 'lucide-react';

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

interface ConsultationFormData {
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  medicalCertificate: boolean;
  certificateType: string;
  certificateDays: number;
  certificateNotes: string;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  labTests: {
    test: string;
    instructions: string;
    price: number;
  }[];
  radiologyTests: {
    test: string;
    instructions: string;
    price: number;
  }[];
  referral: {
    departmentId: string;
    reason: string;
    notes: string;
  };
}

// Common lab tests with prices
const commonLabTests = [
  { name: 'Complete Blood Count (CBC)', price: 25.00 },
  { name: 'Basic Metabolic Panel', price: 30.00 },
  { name: 'Comprehensive Metabolic Panel', price: 45.00 },
  { name: 'Lipid Panel', price: 35.00 },
  { name: 'Liver Function Tests', price: 40.00 },
  { name: 'Thyroid Function Tests', price: 55.00 },
  { name: 'Hemoglobin A1C', price: 35.00 },
  { name: 'Urinalysis', price: 20.00 },
  { name: 'Stool Analysis', price: 30.00 },
  { name: 'Blood Glucose', price: 15.00 },
  { name: 'Electrolytes Panel', price: 25.00 },
  { name: 'Kidney Function Tests', price: 40.00 }
];

// Common radiology tests with prices
const commonRadiologyTests = [
  { name: 'Chest X-Ray', price: 75.00 },
  { name: 'Abdominal X-Ray', price: 85.00 },
  { name: 'Skull X-Ray', price: 90.00 },
  { name: 'CT Scan - Head', price: 350.00 },
  { name: 'CT Scan - Chest', price: 400.00 },
  { name: 'CT Scan - Abdomen', price: 450.00 },
  { name: 'MRI - Brain', price: 800.00 },
  { name: 'MRI - Spine', price: 850.00 },
  { name: 'MRI - Knee', price: 750.00 },
  { name: 'Ultrasound - Abdomen', price: 200.00 },
  { name: 'Ultrasound - Pelvis', price: 220.00 },
  { name: 'Ultrasound - Thyroid', price: 180.00 },
  { name: 'Mammogram', price: 250.00 },
  { name: 'Bone Densitometry (DEXA)', price: 180.00 }
];

// Common medications
const commonMedications = [
  'Amoxicillin',
  'Azithromycin',
  'Ciprofloxacin',
  'Metronidazole',
  'Paracetamol',
  'Ibuprofen',
  'Naproxen',
  'Omeprazole',
  'Ranitidine',
  'Loratadine',
  'Cetirizine',
  'Salbutamol',
  'Fluticasone',
  'Amlodipine',
  'Lisinopril',
  'Metformin',
  'Glimepiride',
  'Atorvastatin',
  'Simvastatin',
  'Levothyroxine'
];

// Common dosages
const commonDosages = [
  '250mg',
  '500mg',
  '1g',
  '5mg',
  '10mg',
  '20mg',
  '25mg',
  '50mg',
  '100mg',
  '5ml',
  '10ml',
  '15ml',
  '20ml',
  '1 tablet',
  '2 tablets',
  '1 capsule',
  '2 capsules',
  '1 puff',
  '2 puffs'
];

// Common frequencies
const commonFrequencies = [
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
  'At bedtime',
  'Weekly',
  'Twice weekly',
  'Monthly'
];

// Common durations
const commonDurations = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  'Indefinitely',
  'As directed'
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
  const [showLabTests, setShowLabTests] = useState(false);
  const [showRadiologyTests, setShowRadiologyTests] = useState(false);
  const [filteredLabTests, setFilteredLabTests] = useState(commonLabTests);
  const [filteredRadiologyTests, setFilteredRadiologyTests] = useState(commonRadiologyTests);
  const [labSearchTerm, setLabSearchTerm] = useState('');
  const [radiologySearchTerm, setRadiologySearchTerm] = useState('');
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('');
  const [filteredMedications, setFilteredMedications] = useState(commonMedications);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      certificateType: 'sick_leave',
      certificateDays: 1,
      certificateNotes: '',
      prescriptions: [{ 
        medication: '', 
        dosage: '', 
        frequency: '', 
        duration: '', 
        instructions: '' 
      }],
      labTests: [],
      radiologyTests: [],
      referral: {
        departmentId: '',
        reason: '',
        notes: ''
      }
    }
  });

  const medicalCertificate = watch('medicalCertificate');
  const prescriptions = watch('prescriptions');
  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');
  
  useEffect(() => {
    if (hospital) {
      fetchDepartments();
    }
    
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [hospital, patientId]);
  
  useEffect(() => {
    // Filter lab tests based on search term
    if (labSearchTerm) {
      setFilteredLabTests(
        commonLabTests.filter(test => 
          test.name.toLowerCase().includes(labSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredLabTests(commonLabTests);
    }
  }, [labSearchTerm]);
  
  useEffect(() => {
    // Filter radiology tests based on search term
    if (radiologySearchTerm) {
      setFilteredRadiologyTests(
        commonRadiologyTests.filter(test => 
          test.name.toLowerCase().includes(radiologySearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredRadiologyTests(commonRadiologyTests);
    }
  }, [radiologySearchTerm]);
  
  useEffect(() => {
    // Filter medications based on search term
    if (medicationSearchTerm) {
      setFilteredMedications(
        commonMedications.filter(med => 
          med.toLowerCase().includes(medicationSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredMedications(commonMedications);
    }
  }, [medicationSearchTerm]);

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
          { id: '2', name: 'Pediatrics' },
          { id: '3', name: 'Cardiology' },
          { id: '4', name: 'Orthopedics' },
          { id: '5', name: 'Gynecology' },
          { id: '6', name: 'Dermatology' },
          { id: '7', name: 'Neurology' },
          { id: '8', name: 'Ophthalmology' },
          { id: '9', name: 'ENT' },
          { id: '10', name: 'Psychiatry' }
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

  const addPrescription = () => {
    setValue('prescriptions', [
      ...prescriptions, 
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removePrescription = (index: number) => {
    setValue('prescriptions', prescriptions.filter((_, i) => i !== index));
  };

  const addLabTest = (test: string, price: number) => {
    const newTest = {
      test,
      instructions: '',
      price
    };
    setValue('labTests', [...labTests, newTest]);
    setShowLabTests(false);
  };

  const removeLabTest = (index: number) => {
    setValue('labTests', labTests.filter((_, i) => i !== index));
  };

  const addRadiologyTest = (test: string, price: number) => {
    const newTest = {
      test,
      instructions: '',
      price
    };
    setValue('radiologyTests', [...radiologyTests, newTest]);
    setShowRadiologyTests(false);
  };

  const removeRadiologyTest = (index: number) => {
    setValue('radiologyTests', radiologyTests.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotalCost = () => {
    const labTestsTotal = labTests.reduce((sum, test) => sum + test.price, 0);
    const radiologyTestsTotal = radiologyTests.reduce((sum, test) => sum + test.price, 0);
    return labTestsTotal + radiologyTestsTotal;
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
        
        // Update patient flow step
        if (data.labTests.length > 0) {
          console.log('Patient referred to laboratory');
        }
        
        if (data.radiologyTests.length > 0) {
          console.log('Patient referred to radiology');
        }
        
        if (data.prescriptions.some(p => p.medication)) {
          console.log('Prescriptions sent to pharmacy');
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
          department_id: user.department_id || null,
          consultation_date: new Date().toISOString(),
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatment_plan: data.treatmentPlan,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          prescriptions: data.prescriptions.filter(p => p.medication)
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create lab tests if any
      if (data.labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(
            data.labTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              test_type: test.test,
              test_date: new Date().toISOString(),
              status: 'pending',
              notes: test.instructions
            }))
          );

        if (labError) throw labError;
      }
      
      // Create radiology tests if any
      if (data.radiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(
            data.radiologyTests.map(test => ({
              patient_id: patient.id,
              hospital_id: hospital.id,
              scan_type: test.test,
              scan_date: new Date().toISOString(),
              status: 'pending',
              notes: test.instructions
            }))
          );

        if (radiologyError) throw radiologyError;
      }
      
      // Create pharmacy order if prescriptions exist
      if (data.prescriptions.some(p => p.medication)) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultationData.id,
            medications: data.prescriptions
              .filter(p => p.medication)
              .map(p => ({
                medication: p.medication,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration,
                instructions: p.instructions,
                quantity: 1,
                dispensed: false
              })),
            status: 'pending',
            payment_status: 'pending'
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // Create billing record
      const services = [
        ...data.labTests.map(test => ({
          name: `Lab Test: ${test.test}`,
          amount: test.price,
          quantity: 1
        })),
        ...data.radiologyTests.map(test => ({
          name: `Radiology: ${test.test}`,
          amount: test.price,
          quantity: 1
        }))
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
      
      // Create referral if specified
      if (data.referral.departmentId && data.referral.reason) {
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
      
      // Determine the next flow step based on tests and prescriptions
      let nextStep = 'post_consultation';
      
      if (data.labTests.length > 0) {
        nextStep = 'lab_tests';
      } else if (data.radiologyTests.length > 0) {
        nextStep = 'radiology';
      } else if (data.prescriptions.some(p => p.medication)) {
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
      
      // Show success notification
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

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-3 mb-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold">
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

        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          {/* Left Column - Main Form */}
          <div className="md:w-2/3 space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
            {/* Chief Complaint */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Chief Complaint</h3>
              <textarea
                {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                className={`form-input w-full ${errors.chiefComplaint ? 'border-error-300' : ''}`}
                rows={2}
                placeholder="Enter the patient's main complaint"
              />
              {errors.chiefComplaint && (
                <p className="text-error-500 text-xs mt-1">{errors.chiefComplaint.message}</p>
              )}
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Diagnosis</h3>
              <textarea
                {...register('diagnosis', { required: 'Diagnosis is required' })}
                className={`form-input w-full ${errors.diagnosis ? 'border-error-300' : ''}`}
                rows={2}
                placeholder="Enter diagnosis"
              />
              {errors.diagnosis && (
                <p className="text-error-500 text-xs mt-1">{errors.diagnosis.message}</p>
              )}
            </div>

            {/* Diagnostic Tests */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Diagnostic Tests</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLabTests(true)}
                    className="btn btn-sm btn-outline flex items-center"
                  >
                    <Flask className="h-4 w-4 mr-1" />
                    Lab Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRadiologyTests(true)}
                    className="btn btn-sm btn-outline flex items-center"
                  >
                    <Microscope className="h-4 w-4 mr-1" />
                    Radiology
                  </button>
                </div>
              </div>

              {/* Lab Tests */}
              {labTests.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Lab Tests</h4>
                  <div className="space-y-2">
                    {labTests.map((test, index) => (
                      <div key={index} className="flex items-start justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Flask className="h-4 w-4 text-primary-500 mr-1" />
                            <span className="text-sm font-medium">{test.test}</span>
                          </div>
                          <input
                            type="text"
                            value={test.instructions}
                            onChange={(e) => {
                              const updatedTests = [...labTests];
                              updatedTests[index].instructions = e.target.value;
                              setValue('labTests', updatedTests);
                            }}
                            className="form-input mt-1 py-1 text-xs w-full"
                            placeholder="Special instructions (optional)"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Price: {formatCurrency(test.price)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLabTest(index)}
                          className="text-error-500 hover:text-error-700 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Radiology Tests */}
              {radiologyTests.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Radiology Tests</h4>
                  <div className="space-y-2">
                    {radiologyTests.map((test, index) => (
                      <div key={index} className="flex items-start justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Microscope className="h-4 w-4 text-primary-500 mr-1" />
                            <span className="text-sm font-medium">{test.test}</span>
                          </div>
                          <input
                            type="text"
                            value={test.instructions}
                            onChange={(e) => {
                              const updatedTests = [...radiologyTests];
                              updatedTests[index].instructions = e.target.value;
                              setValue('radiologyTests', updatedTests);
                            }}
                            className="form-input mt-1 py-1 text-xs w-full"
                            placeholder="Special instructions (optional)"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Price: {formatCurrency(test.price)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRadiologyTest(index)}
                          className="text-error-500 hover:text-error-700 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Tests Selection Modal */}
              {showLabTests && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Select Lab Tests</h3>
                        <button
                          type="button"
                          onClick={() => setShowLabTests(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={labSearchTerm}
                          onChange={(e) => setLabSearchTerm(e.target.value)}
                          className="form-input w-full"
                          placeholder="Search lab tests..."
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredLabTests.map((test, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => addLabTest(test.name, test.price)}
                          >
                            <div className="flex items-center">
                              <Flask className="h-4 w-4 text-primary-500 mr-2" />
                              <span className="text-sm">{test.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{formatCurrency(test.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowLabTests(false)}
                        className="btn btn-outline w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Radiology Tests Selection Modal */}
              {showRadiologyTests && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Select Radiology Tests</h3>
                        <button
                          type="button"
                          onClick={() => setShowRadiologyTests(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={radiologySearchTerm}
                          onChange={(e) => setRadiologySearchTerm(e.target.value)}
                          className="form-input w-full"
                          placeholder="Search radiology tests..."
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredRadiologyTests.map((test, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => addRadiologyTest(test.name, test.price)}
                          >
                            <div className="flex items-center">
                              <Microscope className="h-4 w-4 text-primary-500 mr-2" />
                              <span className="text-sm">{test.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{formatCurrency(test.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowRadiologyTests(false)}
                        className="btn btn-outline w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prescriptions */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Prescriptions</h3>
                <button
                  type="button"
                  onClick={addPrescription}
                  className="btn btn-sm btn-outline flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </button>
              </div>
              
              <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Medication
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                {...register(`prescriptions.${index}.medication` as const, { required: true })}
                                className="form-input w-full py-1"
                                placeholder="Enter medication"
                                list={`medications-${index}`}
                                onChange={(e) => {
                                  setValue(`prescriptions.${index}.medication`, e.target.value);
                                  setMedicationSearchTerm(e.target.value);
                                }}
                              />
                              <datalist id={`medications-${index}`}>
                                {filteredMedications.map((med, i) => (
                                  <option key={i} value={med} />
                                ))}
                              </datalist>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Dosage
                            </label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.dosage` as const, { required: true })}
                              className="form-input w-full py-1"
                              placeholder="e.g., 500mg"
                              list="dosages"
                            />
                            <datalist id="dosages">
                              {commonDosages.map((dosage, i) => (
                                <option key={i} value={dosage} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Frequency
                            </label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.frequency` as const, { required: true })}
                              className="form-input w-full py-1"
                              placeholder="e.g., Twice daily"
                              list="frequencies"
                            />
                            <datalist id="frequencies">
                              {commonFrequencies.map((frequency, i) => (
                                <option key={i} value={frequency} />
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.duration` as const, { required: true })}
                              className="form-input w-full py-1"
                              placeholder="e.g., 7 days"
                              list="durations"
                            />
                            <datalist id="durations">
                              {commonDurations.map((duration, i) => (
                                <option key={i} value={duration} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <textarea
                            {...register(`prescriptions.${index}.instructions` as const)}
                            className="form-input w-full py-1"
                            rows={2}
                            placeholder="Special instructions (e.g., take with food)"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="text-error-500 hover:text-error-700 ml-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment Plan */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Treatment Plan</h3>
              <textarea
                {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                className={`form-input w-full ${errors.treatmentPlan ? 'border-error-300' : ''}`}
                rows={3}
                placeholder="Enter treatment plan"
              />
              {errors.treatmentPlan && (
                <p className="text-error-500 text-xs mt-1">{errors.treatmentPlan.message}</p>
              )}
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Additional Notes</h3>
              <textarea
                {...register('notes')}
                className="form-input w-full"
                rows={3}
                placeholder="Enter any additional notes (optional)"
              />
            </div>

            {/* Medical Certificate */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="medicalCertificate"
                  {...register('medicalCertificate')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="medicalCertificate" className="ml-2 text-md font-medium text-gray-900">
                  Issue Medical Certificate
                </label>
              </div>
              
              {medicalCertificate && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Type
                    </label>
                    <select
                      {...register('certificateType')}
                      className="form-input w-full"
                    >
                      <option value="sick_leave">Sick Leave Certificate</option>
                      <option value="medical_fitness">Medical Fitness Certificate</option>
                      <option value="referral">Referral Letter</option>
                      <option value="discharge">Discharge Certificate</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Days (for leave certificates)
                    </label>
                    <input
                      type="number"
                      {...register('certificateDays')}
                      className="form-input w-full"
                      min={1}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Notes
                    </label>
                    <textarea
                      {...register('certificateNotes')}
                      className="form-input w-full"
                      rows={3}
                      placeholder="Enter any specific notes for the certificate"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn btn-outline flex items-center"
                    >
                      <FileCheck className="h-4 w-4 mr-1" />
                      Preview Certificate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="md:w-1/3 space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto">
            {/* Patient Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Patient Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">DOB:</span>
                  <span className="ml-1 font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                  <span className="ml-2">({calculateAge(patient.date_of_birth)} years)</span>
                </div>
                <div className="flex items-center text-sm">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-1 font-medium">{patient.gender}</span>
                </div>
                <div className="flex items-start text-sm">
                  <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <span className="text-gray-600">Medical History:</span>
                    <div className="mt-1 space-y-1">
                      {patient.medical_history?.allergies?.length > 0 && (
                        <div className="text-error-600">
                          <span className="font-medium">Allergies:</span>
                          <ul className="list-disc list-inside ml-2">
                            {patient.medical_history.allergies.map((allergy: any, index: number) => (
                              <li key={index} className="text-xs">
                                {allergy.allergen} - {allergy.reaction} ({allergy.severity})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {patient.medical_history?.chronicConditions?.length > 0 && (
                        <div>
                          <span className="font-medium">Chronic Conditions:</span>
                          <ul className="list-disc list-inside ml-2">
                            {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                              <li key={index} className="text-xs">{condition}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {patient.medical_history?.currentMedications?.length > 0 && (
                        <div>
                          <span className="font-medium">Current Medications:</span>
                          <ul className="list-disc list-inside ml-2">
                            {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                              <li key={index} className="text-xs">
                                {medication.name} {medication.dosage && `- ${medication.dosage}`} 
                                {medication.frequency && ` (${medication.frequency})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Card */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Referral</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refer to Department
                  </label>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <select
                      {...register('referral.departmentId')}
                      className="form-input w-full"
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Referral
                  </label>
                  <textarea
                    {...register('referral.reason')}
                    className="form-input w-full"
                    rows={2}
                    placeholder="Reason for referral"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    {...register('referral.notes')}
                    className="form-input w-full"
                    rows={2}
                    placeholder="Additional notes for the specialist"
                  />
                </div>
                
                <button
                  type="button"
                  className="btn btn-outline w-full flex items-center justify-center"
                  disabled={!watch('referral.departmentId') || !watch('referral.reason')}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Refer Patient
                </button>
              </div>
            </div>

            {/* Billing Summary */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Billing Summary</h3>
              
              {(labTests.length > 0 || radiologyTests.length > 0) ? (
                <div className="space-y-3">
                  {labTests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Lab Tests</h4>
                      <div className="mt-1 space-y-1">
                        {labTests.map((test, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{test.test}</span>
                            <span>{formatCurrency(test.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {radiologyTests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Radiology Tests</h4>
                      <div className="mt-1 space-y-1">
                        {radiologyTests.map((test, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{test.test}</span>
                            <span>{formatCurrency(test.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotalCost())}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No billable items added yet.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="btn btn-outline flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Cancel
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
                      Save Consultation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;