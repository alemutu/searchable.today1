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
  CheckSquare, 
  AlertTriangle, 
  FileCheck, 
  ArrowUpRight,
  Flask,
  Microscope,
  Building2
} from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  medicalCertificate: boolean;
  certificateDetails?: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
  labTests: {
    testName: string;
    instructions: string;
    price: number;
  }[];
  radiologyTests: {
    testName: string;
    instructions: string;
    price: number;
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

interface ServicePrice {
  id: string;
  name: string;
  category: string;
  price: number;
  department_id: string | null;
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [labTests, setLabTests] = useState<ServicePrice[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<ServicePrice[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [showRadiologyTestsModal, setShowRadiologyTestsModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      medicalCertificate: false,
      labTests: [],
      radiologyTests: [],
      referral: null
    }
  });

  const medicalCertificate = watch('medicalCertificate');
  const prescriptions = watch('prescriptions');
  const selectedLabTests = watch('labTests');
  const selectedRadiologyTests = watch('radiologyTests');
  const referral = watch('referral');

  useEffect(() => {
    if (hospital) {
      fetchDepartments();
      fetchServicePrices();
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

  const fetchServicePrices = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockLabTests: ServicePrice[] = [
          { id: '1', name: 'Complete Blood Count (CBC)', category: 'lab', price: 25.00, department_id: null },
          { id: '2', name: 'Comprehensive Metabolic Panel', category: 'lab', price: 35.00, department_id: null },
          { id: '3', name: 'Lipid Panel', category: 'lab', price: 30.00, department_id: null },
          { id: '4', name: 'Thyroid Function Tests', category: 'lab', price: 45.00, department_id: null },
          { id: '5', name: 'Hemoglobin A1C', category: 'lab', price: 40.00, department_id: null },
          { id: '6', name: 'Urinalysis', category: 'lab', price: 15.00, department_id: null }
        ];
        
        const mockRadiologyTests: ServicePrice[] = [
          { id: '7', name: 'Chest X-Ray', category: 'radiology', price: 75.00, department_id: null },
          { id: '8', name: 'Abdominal Ultrasound', category: 'radiology', price: 120.00, department_id: null },
          { id: '9', name: 'CT Scan - Head', category: 'radiology', price: 350.00, department_id: null },
          { id: '10', name: 'MRI - Knee', category: 'radiology', price: 500.00, department_id: null },
          { id: '11', name: 'Echocardiogram', category: 'radiology', price: 200.00, department_id: null },
          { id: '12', name: 'Mammogram', category: 'radiology', price: 150.00, department_id: null }
        ];
        
        setLabTests(mockLabTests);
        setRadiologyTests(mockRadiologyTests);
        return;
      }

      // Fetch lab tests
      const { data: labData, error: labError } = await supabase
        .from('service_prices')
        .select('*')
        .eq('hospital_id', hospital?.id)
        .eq('category', 'lab')
        .order('name');

      if (labError) throw labError;
      setLabTests(labData || []);

      // Fetch radiology tests
      const { data: radiologyData, error: radiologyError } = await supabase
        .from('service_prices')
        .select('*')
        .eq('hospital_id', hospital?.id)
        .eq('category', 'radiology')
        .order('name');

      if (radiologyError) throw radiologyError;
      setRadiologyTests(radiologyData || []);
    } catch (error) {
      console.error('Error loading service prices:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockMedications = [
          { id: '1', name: 'Amoxicillin', dosage_forms: ['250mg Capsule', '500mg Capsule', '125mg/5ml Suspension'], in_stock: true, stock_level: 120, price: 10.50 },
          { id: '2', name: 'Lisinopril', dosage_forms: ['10mg Tablet', '20mg Tablet'], in_stock: true, stock_level: 85, price: 15.75 },
          { id: '3', name: 'Atorvastatin', dosage_forms: ['10mg Tablet', '20mg Tablet', '40mg Tablet'], in_stock: true, stock_level: 65, price: 22.30 },
          { id: '4', name: 'Metformin', dosage_forms: ['500mg Tablet', '850mg Tablet', '1000mg Tablet'], in_stock: true, stock_level: 110, price: 12.45 },
          { id: '5', name: 'Omeprazole', dosage_forms: ['20mg Capsule', '40mg Capsule'], in_stock: true, stock_level: 95, price: 18.20 },
          { id: '6', name: 'Paracetamol', dosage_forms: ['500mg Tablet', '250mg/5ml Suspension'], in_stock: true, stock_level: 200, price: 5.50 },
          { id: '7', name: 'Ibuprofen', dosage_forms: ['200mg Tablet', '400mg Tablet', '100mg/5ml Suspension'], in_stock: true, stock_level: 180, price: 7.25 },
          { id: '8', name: 'Azithromycin', dosage_forms: ['250mg Tablet', '500mg Tablet', '200mg/5ml Suspension'], in_stock: false, stock_level: 0, price: 25.00 }
        ];
        setMedications(mockMedications);
        return;
      }

      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('hospital_id', hospital?.id)
        .order('name');

      if (error) throw error;
      setMedications(data || []);
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

  const addPrescription = () => {
    setValue('prescriptions', [...prescriptions, { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removePrescription = (index: number) => {
    setValue('prescriptions', prescriptions.filter((_, i) => i !== index));
  };

  const addLabTest = (test: ServicePrice) => {
    const existingTest = selectedLabTests.find(t => t.testName === test.name);
    if (!existingTest) {
      setValue('labTests', [...selectedLabTests, { 
        testName: test.name, 
        instructions: '', 
        price: test.price 
      }]);
    }
  };

  const removeLabTest = (index: number) => {
    setValue('labTests', selectedLabTests.filter((_, i) => i !== index));
  };

  const addRadiologyTest = (test: ServicePrice) => {
    const existingTest = selectedRadiologyTests.find(t => t.testName === test.name);
    if (!existingTest) {
      setValue('radiologyTests', [...selectedRadiologyTests, { 
        testName: test.name, 
        instructions: '', 
        price: test.price 
      }]);
    }
  };

  const removeRadiologyTest = (index: number) => {
    setValue('radiologyTests', selectedRadiologyTests.filter((_, i) => i !== index));
  };

  const handleReferralSubmit = (departmentId: string, reason: string, notes: string) => {
    setValue('referral', { departmentId, reason, notes });
    setShowReferralModal(false);
  };

  const removeReferral = () => {
    setValue('referral', null);
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
        if (data.labTests.length > 0 || data.radiologyTests.length > 0) {
          // If tests were ordered, move to lab_tests step
          console.log('Moving patient to lab_tests step');
        } else if (data.prescriptions.some(p => p.medication)) {
          // If medications were prescribed, move to pharmacy step
          console.log('Moving patient to pharmacy step');
        } else {
          // Otherwise, move to post_consultation step
          console.log('Moving patient to post_consultation step');
        }
        
        addNotification({
          message: 'Consultation saved successfully',
          type: 'success'
        });
        
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
          prescriptions: data.prescriptions.filter(p => p.medication),
          medical_certificate: data.medicalCertificate,
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Handle lab tests if any
      if (data.labTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(data.labTests.map(test => ({
            patient_id: patient.id,
            hospital_id: hospital.id,
            test_type: test.testName,
            test_date: new Date().toISOString(),
            status: 'pending',
            notes: test.instructions
          })));

        if (labError) throw labError;
      }
      
      // Handle radiology tests if any
      if (data.radiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(data.radiologyTests.map(test => ({
            patient_id: patient.id,
            hospital_id: hospital.id,
            scan_type: test.testName,
            scan_date: new Date().toISOString(),
            status: 'pending',
            notes: test.instructions
          })));

        if (radiologyError) throw radiologyError;
      }
      
      // Handle referral if any
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
            notes: data.referral.notes,
            urgency: 'routine',
            status: 'pending',
            department_id: data.referral.departmentId
          });

        if (referralError) throw referralError;
      }
      
      // Handle pharmacy order if prescriptions exist
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
                quantity: 1, // Default quantity
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
          name: `Lab Test: ${test.testName}`,
          amount: test.price,
          quantity: 1
        })),
        ...data.radiologyTests.map(test => ({
          name: `Radiology: ${test.testName}`,
          amount: test.price,
          quantity: 1
        })),
        ...data.prescriptions
          .filter(p => p.medication)
          .map(p => {
            const med = medications.find(m => m.name === p.medication);
            return {
              name: `Medication: ${p.medication} ${p.dosage}`,
              amount: med?.price || 0,
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
      
      // Determine the next flow step based on ordered tests and prescriptions
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

  // Calculate total billing amount
  const calculateTotalAmount = () => {
    const labTestsTotal = selectedLabTests.reduce((sum, test) => sum + test.price, 0);
    const radiologyTestsTotal = selectedRadiologyTests.reduce((sum, test) => sum + test.price, 0);
    
    // Calculate medications total (if we have pricing info)
    const medicationsTotal = prescriptions
      .filter(p => p.medication)
      .reduce((sum, p) => {
        const med = medications.find(m => m.name === p.medication);
        return sum + (med?.price || 0);
      }, 0);
    
    return labTestsTotal + radiologyTestsTotal + medicationsTotal;
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
                <Calendar className="h-3 w-3 mr-1" />
                <span className="bg-black bg-opacity-20 px-1.5 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Left Column - Consultation Details */}
          <div className="w-full md:w-2/3 space-y-3">
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

            {/* Diagnostic Tests */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Diagnostic Tests</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLabTestsModal(true)}
                    className="btn btn-outline btn-sm flex items-center"
                  >
                    <Flask className="h-4 w-4 mr-1" />
                    Lab Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRadiologyTestsModal(true)}
                    className="btn btn-outline btn-sm flex items-center"
                  >
                    <Microscope className="h-4 w-4 mr-1" />
                    Radiology
                  </button>
                </div>
              </div>

              {/* Selected Lab Tests */}
              {selectedLabTests.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Lab Tests</h4>
                  <div className="space-y-2">
                    {selectedLabTests.map((test, index) => (
                      <div key={index} className="flex items-start justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Flask className="h-4 w-4 text-primary-500 mr-1" />
                            <span className="text-sm font-medium">{test.testName}</span>
                            <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">
                              ${test.price.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="text"
                            className="form-input mt-1 py-1 text-xs w-full"
                            placeholder="Special instructions (optional)"
                            value={test.instructions}
                            onChange={(e) => {
                              const updatedTests = [...selectedLabTests];
                              updatedTests[index].instructions = e.target.value;
                              setValue('labTests', updatedTests);
                            }}
                          />
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

              {/* Selected Radiology Tests */}
              {selectedRadiologyTests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Radiology Tests</h4>
                  <div className="space-y-2">
                    {selectedRadiologyTests.map((test, index) => (
                      <div key={index} className="flex items-start justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Microscope className="h-4 w-4 text-primary-500 mr-1" />
                            <span className="text-sm font-medium">{test.testName}</span>
                            <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">
                              ${test.price.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="text"
                            className="form-input mt-1 py-1 text-xs w-full"
                            placeholder="Special instructions (optional)"
                            value={test.instructions}
                            onChange={(e) => {
                              const updatedTests = [...selectedRadiologyTests];
                              updatedTests[index].instructions = e.target.value;
                              setValue('radiologyTests', updatedTests);
                            }}
                          />
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

              {selectedLabTests.length === 0 && selectedRadiologyTests.length === 0 && (
                <p className="text-gray-500 text-sm italic">No diagnostic tests ordered yet.</p>
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

            {/* Treatment Plan */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Treatment Plan</h3>
              <textarea
                {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                className={`form-input w-full ${errors.treatmentPlan ? 'border-error-300' : ''}`}
                rows={2}
                placeholder="Enter treatment plan"
              />
              {errors.treatmentPlan && (
                <p className="text-error-500 text-xs mt-1">{errors.treatmentPlan.message}</p>
              )}
            </div>

            {/* Prescriptions */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Prescriptions</h3>
                <button
                  type="button"
                  onClick={addPrescription}
                  className="btn btn-outline btn-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </button>
              </div>
              
              {prescriptions.map((prescription, index) => (
                <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">Medication</label>
                      <select
                        {...register(`prescriptions.${index}.medication` as const, { required: 'Medication is required' })}
                        className="form-input py-1 text-sm"
                      >
                        <option value="">Select medication</option>
                        {medications.map(med => (
                          <option 
                            key={med.id} 
                            value={med.name}
                            disabled={!med.in_stock}
                          >
                            {med.name} {!med.in_stock && '(Out of Stock)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Dosage</label>
                      <select
                        {...register(`prescriptions.${index}.dosage` as const, { required: 'Dosage is required' })}
                        className="form-input py-1 text-sm"
                      >
                        <option value="">Select dosage</option>
                        {medications.find(m => m.name === prescription.medication)?.dosage_forms.map((dosage, i) => (
                          <option key={i} value={dosage}>{dosage}</option>
                        )) || (
                          <>
                            <option value="250mg">250mg</option>
                            <option value="500mg">500mg</option>
                            <option value="1g">1g</option>
                          </>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">Frequency</label>
                      <select
                        {...register(`prescriptions.${index}.frequency` as const, { required: 'Frequency is required' })}
                        className="form-input py-1 text-sm"
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
                      <label className="form-label text-xs">Duration</label>
                      <select
                        {...register(`prescriptions.${index}.duration` as const, { required: 'Duration is required' })}
                        className="form-input py-1 text-sm"
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
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label text-xs">Special Instructions</label>
                    <textarea
                      {...register(`prescriptions.${index}.instructions` as const)}
                      className="form-input py-1 text-sm"
                      rows={2}
                      placeholder="Special instructions (e.g., take with food)"
                    />
                  </div>
                  
                  {index > 0 && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="text-error-500 hover:text-error-700 text-xs flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Additional Notes</h3>
              <textarea
                {...register('notes')}
                className="form-input w-full"
                rows={3}
                placeholder="Enter any additional notes"
              />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full md:w-1/3 space-y-3">
            {/* Medical Certificate */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900">Medical Certificate</h3>
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
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="form-label text-xs">Certificate Type</label>
                    <select
                      {...register('certificateDetails.type')}
                      className="form-input py-1 text-sm"
                    >
                      <option value="sick_leave">Sick Leave Certificate</option>
                      <option value="medical_fitness">Medical Fitness Certificate</option>
                      <option value="referral">Referral Letter</option>
                      <option value="discharge">Discharge Certificate</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">Start Date</label>
                      <input
                        type="date"
                        {...register('certificateDetails.startDate')}
                        className="form-input py-1 text-sm"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">End Date</label>
                      <input
                        type="date"
                        {...register('certificateDetails.endDate')}
                        className="form-input py-1 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-xs">Reason</label>
                    <textarea
                      {...register('certificateDetails.reason')}
                      className="form-input py-1 text-sm"
                      rows={2}
                      placeholder="Reason for certificate"
                    />
                  </div>
                  
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full flex items-center justify-center"
                  >
                    <FileCheck className="h-4 w-4 mr-1" />
                    Preview Certificate
                  </button>
                </div>
              )}
            </div>

            {/* Referral Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Referral</h3>
                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="btn btn-outline btn-sm flex items-center"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Refer Patient
                </button>
              </div>
              
              {referral ? (
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-primary-500 mr-1" />
                      <span className="text-sm font-medium">
                        {departments.find(d => d.id === referral.departmentId)?.name || 'Department'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeReferral}
                      className="text-error-500 hover:text-error-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs mt-1"><span className="font-medium">Reason:</span> {referral.reason}</p>
                  {referral.notes && (
                    <p className="text-xs mt-1"><span className="font-medium">Notes:</span> {referral.notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No referral added yet.</p>
              )}
            </div>

            {/* Patient Allergies */}
            {patient.medical_history?.allergies && patient.medical_history.allergies.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-error-500 mr-1" />
                  <h3 className="text-md font-medium text-gray-900">Allergies</h3>
                </div>
                <div className="space-y-2">
                  {patient.medical_history.allergies.map((allergy: any, index: number) => (
                    <div key={index} className="bg-error-50 p-2 rounded text-sm">
                      <span className="font-medium">{allergy.allergen}</span>
                      <p className="text-xs text-error-700">
                        Reaction: {allergy.reaction} • Severity: {allergy.severity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {patient.medical_history?.currentMedications && patient.medical_history.currentMedications.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center mb-2">
                  <Pill className="h-4 w-4 text-primary-500 mr-1" />
                  <h3 className="text-md font-medium text-gray-900">Current Medications</h3>
                </div>
                <div className="space-y-2">
                  {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium">{medication.name}</span>
                      {medication.dosage && medication.frequency && (
                        <p className="text-xs text-gray-600">
                          {medication.dosage} • {medication.frequency}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Summary */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2">Billing Summary</h3>
              
              {(selectedLabTests.length > 0 || selectedRadiologyTests.length > 0 || prescriptions.some(p => p.medication)) ? (
                <div className="space-y-2">
                  {selectedLabTests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700">Lab Tests</h4>
                      <div className="space-y-1">
                        {selectedLabTests.map((test, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{test.testName}</span>
                            <span>${test.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedRadiologyTests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700">Radiology Tests</h4>
                      <div className="space-y-1">
                        {selectedRadiologyTests.map((test, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{test.testName}</span>
                            <span>${test.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {prescriptions.some(p => p.medication) && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700">Medications</h4>
                      <div className="space-y-1">
                        {prescriptions.filter(p => p.medication).map((prescription, index) => {
                          const med = medications.find(m => m.name === prescription.medication);
                          return (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{prescription.medication} {prescription.dosage}</span>
                              <span>${med?.price.toFixed(2) || '0.00'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${calculateTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No billable items added yet.</p>
              )}
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
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
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

      {/* Lab Tests Modal */}
      {showLabTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Select Lab Tests</h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {labTests.map(test => (
                  <div 
                    key={test.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedLabTests.some(t => t.testName === test.name)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => addLabTest(test)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Flask className="h-4 w-4 text-primary-500 mr-2" />
                        <span className="text-sm font-medium">{test.name}</span>
                      </div>
                      <span className="text-sm font-medium">${test.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
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
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Select Radiology Tests</h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {radiologyTests.map(test => (
                  <div 
                    key={test.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRadiologyTests.some(t => t.testName === test.name)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => addRadiologyTest(test)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Microscope className="h-4 w-4 text-primary-500 mr-2" />
                        <span className="text-sm font-medium">{test.name}</span>
                      </div>
                      <span className="text-sm font-medium">${test.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
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
              <h2 className="text-lg font-medium text-gray-900">Refer Patient</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="form-label">Department</label>
                  <select
                    className="form-input"
                    id="referralDepartment"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Reason for Referral</label>
                  <input
                    type="text"
                    className="form-input"
                    id="referralReason"
                    placeholder="Enter reason for referral"
                  />
                </div>
                
                <div>
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className="form-input"
                    id="referralNotes"
                    rows={3}
                    placeholder="Enter any additional notes"
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const departmentId = (document.getElementById('referralDepartment') as HTMLSelectElement).value;
                  const reason = (document.getElementById('referralReason') as HTMLInputElement).value;
                  const notes = (document.getElementById('referralNotes') as HTMLTextAreaElement).value;
                  
                  if (!departmentId || !reason) {
                    alert('Please select a department and enter a reason for referral');
                    return;
                  }
                  
                  handleReferralSubmit(departmentId, reason, notes);
                }}
                className="btn btn-primary"
              >
                Submit Referral
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  </div>
  );
};

export default ConsultationForm;