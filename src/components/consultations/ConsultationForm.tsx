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
  ChevronDown, 
  ChevronUp,
  AlertTriangle
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

interface Department {
  id: string;
  name: string;
}

interface LabTest {
  id: string;
  name: string;
  description: string;
  price: number;
  department: string;
}

interface RadiologyTest {
  id: string;
  name: string;
  description: string;
  price: number;
  department: string;
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
  const [showLabTests, setShowLabTests] = useState(false);
  const [showRadiologyTests, setShowRadiologyTests] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [collapsePatientInfo, setCollapsePatientInfo] = useState(false);
  const [collapseMedicalHistory, setCollapseMedicalHistory] = useState(true);
  const [collapseReferralStats, setCollapseReferralStats] = useState(false);
  
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
      referral: null
    }
  });

  const medicalCertificate = watch('medicalCertificate');
  const certificateType = watch('certificateType');
  const prescriptions = watch('prescriptions');
  const labTestsSelected = watch('labTests');
  const radiologyTestsSelected = watch('radiologyTests');
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
  
  useEffect(() => {
    if (medicationSearch.trim() === '') {
      setFilteredMedications(medications);
    } else {
      const filtered = medications.filter(med => 
        med.name.toLowerCase().includes(medicationSearch.toLowerCase())
      );
      setFilteredMedications(filtered);
    }
  }, [medicationSearch, medications]);

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
        { id: '1', name: 'Complete Blood Count (CBC)', description: 'Measures different components of blood', price: 25.00, department: 'Laboratory' },
        { id: '2', name: 'Basic Metabolic Panel', description: 'Measures glucose, calcium, and electrolytes', price: 30.00, department: 'Laboratory' },
        { id: '3', name: 'Lipid Panel', description: 'Measures cholesterol and triglycerides', price: 35.00, department: 'Laboratory' },
        { id: '4', name: 'Liver Function Tests', description: 'Measures enzymes and proteins in the liver', price: 40.00, department: 'Laboratory' },
        { id: '5', name: 'Thyroid Function Tests', description: 'Measures thyroid hormones', price: 45.00, department: 'Laboratory' },
        { id: '6', name: 'Hemoglobin A1C', description: 'Measures average blood glucose levels', price: 35.00, department: 'Laboratory' },
        { id: '7', name: 'Urinalysis', description: 'Analyzes urine composition', price: 20.00, department: 'Laboratory' },
        { id: '8', name: 'Stool Analysis', description: 'Examines stool for abnormalities', price: 30.00, department: 'Laboratory' }
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
        { id: '1', name: 'Chest X-Ray', description: 'Imaging of the chest', price: 75.00, department: 'Radiology' },
        { id: '2', name: 'Abdominal X-Ray', description: 'Imaging of the abdomen', price: 80.00, department: 'Radiology' },
        { id: '3', name: 'CT Scan - Head', description: 'Detailed imaging of the head', price: 250.00, department: 'Radiology' },
        { id: '4', name: 'CT Scan - Chest', description: 'Detailed imaging of the chest', price: 275.00, department: 'Radiology' },
        { id: '5', name: 'CT Scan - Abdomen', description: 'Detailed imaging of the abdomen', price: 300.00, department: 'Radiology' },
        { id: '6', name: 'MRI - Brain', description: 'Detailed imaging of the brain', price: 400.00, department: 'Radiology' },
        { id: '7', name: 'MRI - Spine', description: 'Detailed imaging of the spine', price: 425.00, department: 'Radiology' },
        { id: '8', name: 'Ultrasound - Abdomen', description: 'Imaging of the abdomen using sound waves', price: 150.00, department: 'Radiology' }
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
        { id: '1', name: 'Amoxicillin', dosage_forms: ['250mg Capsule', '500mg Capsule', '125mg/5ml Suspension'], in_stock: true, stock_level: 120, price: 10.50 },
        { id: '2', name: 'Lisinopril', dosage_forms: ['5mg Tablet', '10mg Tablet', '20mg Tablet'], in_stock: true, stock_level: 85, price: 15.75 },
        { id: '3', name: 'Atorvastatin', dosage_forms: ['10mg Tablet', '20mg Tablet', '40mg Tablet'], in_stock: true, stock_level: 65, price: 22.30 },
        { id: '4', name: 'Metformin', dosage_forms: ['500mg Tablet', '850mg Tablet', '1000mg Tablet'], in_stock: true, stock_level: 95, price: 12.80 },
        { id: '5', name: 'Omeprazole', dosage_forms: ['20mg Capsule', '40mg Capsule'], in_stock: true, stock_level: 110, price: 18.25 },
        { id: '6', name: 'Paracetamol', dosage_forms: ['500mg Tablet', '125mg/5ml Syrup'], in_stock: true, stock_level: 200, price: 5.50 },
        { id: '7', name: 'Ibuprofen', dosage_forms: ['200mg Tablet', '400mg Tablet', '100mg/5ml Suspension'], in_stock: true, stock_level: 180, price: 7.25 },
        { id: '8', name: 'Azithromycin', dosage_forms: ['250mg Tablet', '500mg Tablet', '200mg/5ml Suspension'], in_stock: false, stock_level: 0, price: 25.00 }
      ];
      setMedications(mockMedications);
      setFilteredMedications(mockMedications);
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
    const currentPrescriptions = watch('prescriptions');
    setValue('prescriptions', [
      ...currentPrescriptions, 
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removePrescription = (index: number) => {
    const currentPrescriptions = watch('prescriptions');
    setValue('prescriptions', currentPrescriptions.filter((_, i) => i !== index));
  };

  const addLabTest = (test: LabTest) => {
    const currentTests = watch('labTests');
    // Check if test is already added
    if (currentTests.some(t => t.testName === test.name)) {
      return;
    }
    
    setValue('labTests', [
      ...currentTests,
      { testName: test.name, instructions: '', price: test.price }
    ]);
    
    // Close the lab tests panel
    setShowLabTests(false);
  };

  const removeLabTest = (index: number) => {
    const currentTests = watch('labTests');
    setValue('labTests', currentTests.filter((_, i) => i !== index));
  };

  const addRadiologyTest = (test: RadiologyTest) => {
    const currentTests = watch('radiologyTests');
    // Check if test is already added
    if (currentTests.some(t => t.testName === test.name)) {
      return;
    }
    
    setValue('radiologyTests', [
      ...currentTests,
      { testName: test.name, instructions: '', price: test.price }
    ]);
    
    // Close the radiology tests panel
    setShowRadiologyTests(false);
  };

  const removeRadiologyTest = (index: number) => {
    const currentTests = watch('radiologyTests');
    setValue('radiologyTests', currentTests.filter((_, i) => i !== index));
  };

  const handleReferralChange = (departmentId: string) => {
    if (!departmentId) {
      setValue('referral', null);
      return;
    }
    
    setValue('referral', {
      departmentId,
      reason: '',
      notes: ''
    });
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
        
        // Navigate back to patients list
        navigate('/patients');
        return;
      }
      
      // Calculate total billing amount
      const totalAmount = calculateTotalAmount(data);
      
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
          prescriptions: data.prescriptions,
          department_id: data.referral?.departmentId || null
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
              test_type: test.testName,
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
              scan_type: test.testName.toLowerCase().replace(/\s+/g, '_'),
              status: 'pending',
              notes: test.instructions
            }))
          );
          
        if (radiologyError) throw radiologyError;
      }
      
      // Create pharmacy order if prescriptions exist
      if (data.prescriptions.length > 0 && data.prescriptions[0].medication) {
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
              quantity: calculateMedicationQuantity(p.duration, p.frequency),
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending'
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      // Create billing record
      const { error: billingError } = await supabase
        .from('billing')
        .insert({
          patient_id: patient.id,
          hospital_id: hospital.id,
          consultation_id: consultationData.id,
          services: [
            {
              name: 'Consultation',
              amount: 50.00,
              quantity: 1
            },
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
                  quantity: calculateMedicationQuantity(p.duration, p.frequency)
                };
              })
          ],
          total_amount: totalAmount,
          paid_amount: 0,
          payment_status: 'pending'
        });
        
      if (billingError) throw billingError;
      
      // Create referral if specified
      if (data.referral && data.referral.departmentId) {
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            referring_doctor_id: user.id,
            specialist_id: null, // Will be assigned later
            referral_date: new Date().toISOString(),
            reason: data.referral.reason || data.diagnosis,
            urgency: 'routine',
            status: 'pending',
            notes: data.referral.notes
          });
          
        if (referralError) throw referralError;
      }
      
      // Update patient's current flow step
      let nextStep = 'post_consultation';
      
      if (data.labTests.length > 0) {
        nextStep = 'lab_tests';
      } else if (data.radiologyTests.length > 0) {
        nextStep = 'radiology';
      } else if (data.prescriptions.length > 0 && data.prescriptions[0].medication) {
        nextStep = 'pharmacy';
      }
      
      const { error: patientError } = await supabase
        .from('patients')
        .update({ current_flow_step: nextStep })
        .eq('id', patient.id);
        
      if (patientError) throw patientError;
      
      // Show success notification
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      // Navigate back to patients list
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

  const calculateMedicationQuantity = (duration: string, frequency: string) => {
    // Extract the number of days from the duration
    const durationMatch = duration.match(/(\d+)/);
    const days = durationMatch ? parseInt(durationMatch[1]) : 0;
    
    // Extract the frequency per day
    const frequencyMatch = frequency.match(/(\d+)/);
    const timesPerDay = frequencyMatch ? parseInt(frequencyMatch[1]) : 1;
    
    // Calculate total quantity
    return days * timesPerDay;
  };

  const calculateTotalAmount = (data: ConsultationFormData) => {
    // Base consultation fee
    let total = 50.00;
    
    // Add lab tests
    total += data.labTests.reduce((sum, test) => sum + test.price, 0);
    
    // Add radiology tests
    total += data.radiologyTests.reduce((sum, test) => sum + test.price, 0);
    
    // Add medications
    data.prescriptions.forEach(p => {
      if (p.medication) {
        const med = medications.find(m => m.name === p.medication);
        if (med) {
          const quantity = calculateMedicationQuantity(p.duration, p.frequency);
          total += med.price * quantity;
        }
      }
    });
    
    return total;
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

        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          {/* Left Column */}
          <div className="w-full md:w-1/3 space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div 
                className="p-3 border-b border-gray-100 flex justify-between items-center cursor-pointer"
                onClick={() => setCollapsePatientInfo(!collapsePatientInfo)}
              >
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-primary-500" />
                  Patient Information
                </h3>
                {collapsePatientInfo ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {!collapsePatientInfo && (
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Date of Birth</p>
                      <p className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact</p>
                      <p className="font-medium">{patient.contact_number}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium">{patient.address}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Emergency Contact</p>
                      <p className="font-medium">{patient.emergency_contact.name} ({patient.emergency_contact.relationship})</p>
                      <p className="text-sm">{patient.emergency_contact.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Medical History */}
            <div className="bg-white rounded-lg shadow-sm">
              <div 
                className="p-3 border-b border-gray-100 flex justify-between items-center cursor-pointer"
                onClick={() => setCollapseMedicalHistory(!collapseMedicalHistory)}
              >
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary-500" />
                  Medical History
                </h3>
                {collapseMedicalHistory ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {!collapseMedicalHistory && (
                <div className="p-3 space-y-3">
                  {patient.medical_history?.allergies?.length > 0 && (
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
                  
                  {patient.medical_history?.chronicConditions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Chronic Conditions</h4>
                      <ul className="mt-1 text-sm">
                        {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                          <li key={index} className="text-gray-700">{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {patient.medical_history?.currentMedications?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Current Medications</h4>
                      <ul className="mt-1 text-sm">
                        {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                          <li key={index} className="text-gray-700">
                            {medication.name} {medication.dosage} - {medication.frequency}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {(!patient.medical_history?.allergies?.length && 
                    !patient.medical_history?.chronicConditions?.length && 
                    !patient.medical_history?.currentMedications?.length) && (
                    <p className="text-sm text-gray-500">No medical history recorded</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Diagnostic Tests */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <Microscope className="h-4 w-4 mr-2 text-primary-500" />
                  Diagnostic Tests
                </h3>
              </div>
              
              <div className="p-3">
                <div className="flex space-x-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setShowLabTests(!showLabTests)}
                    className="btn btn-outline btn-sm flex-1 flex items-center justify-center"
                  >
                    <Flask className="h-4 w-4 mr-1" />
                    Lab Tests
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowRadiologyTests(!showRadiologyTests)}
                    className="btn btn-outline btn-sm flex-1 flex items-center justify-center"
                  >
                    <Microscope className="h-4 w-4 mr-1" />
                    Radiology
                  </button>
                </div>
                
                {showLabTests && (
                  <div className="mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Select Lab Tests</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {labTests.map(test => (
                        <div 
                          key={test.id} 
                          className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => addLabTest(test)}
                        >
                          <div>
                            <p className="text-sm font-medium">{test.name}</p>
                            <p className="text-xs text-gray-500">{test.description}</p>
                          </div>
                          <div className="text-sm font-medium">${test.price.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {showRadiologyTests && (
                  <div className="mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Select Radiology Tests</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {radiologyTests.map(test => (
                        <div 
                          key={test.id} 
                          className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => addRadiologyTest(test)}
                        >
                          <div>
                            <p className="text-sm font-medium">{test.name}</p>
                            <p className="text-xs text-gray-500">{test.description}</p>
                          </div>
                          <div className="text-sm font-medium">${test.price.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Lab Tests */}
                {labTestsSelected.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Lab Tests</h4>
                    <div className="space-y-2">
                      {labTestsSelected.map((test, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{test.testName}</p>
                            <input
                              type="text"
                              className="form-input mt-1 py-1 text-xs w-full"
                              placeholder="Instructions (optional)"
                              {...register(`labTests.${index}.instructions`)}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">${test.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => removeLabTest(index)}
                              className="text-error-500 hover:text-error-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Radiology Tests */}
                {radiologyTestsSelected.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Radiology Tests</h4>
                    <div className="space-y-2">
                      {radiologyTestsSelected.map((test, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{test.testName}</p>
                            <input
                              type="text"
                              className="form-input mt-1 py-1 text-xs w-full"
                              placeholder="Instructions (optional)"
                              {...register(`radiologyTests.${index}.instructions`)}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">${test.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => removeRadiologyTest(index)}
                              className="text-error-500 hover:text-error-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Referral */}
            <div className="bg-white rounded-lg shadow-sm">
              <div 
                className="p-3 border-b border-gray-100 flex justify-between items-center cursor-pointer"
                onClick={() => setCollapseReferralStats(!collapseReferralStats)}
              >
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-2 text-primary-500" />
                  Referral
                </h3>
                {collapseReferralStats ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {!collapseReferralStats && (
                <div className="p-3">
                  <div className="mb-3">
                    <label className="form-label text-sm">Refer to Department</label>
                    <select
                      className="form-input py-1.5 text-sm"
                      onChange={(e) => handleReferralChange(e.target.value)}
                      value={referral?.departmentId || ''}
                    >
                      <option value="">No Referral</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {referral && (
                    <>
                      <div className="mb-3">
                        <label className="form-label text-sm">Reason for Referral</label>
                        <input
                          type="text"
                          className="form-input py-1.5 text-sm"
                          placeholder="Reason for referral"
                          {...register('referral.reason')}
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label text-sm">Notes</label>
                        <textarea
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder="Additional notes for the specialist"
                          {...register('referral.notes')}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Main Form */}
          <div className="w-full md:w-2/3 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              {/* Chief Complaint */}
              <div>
                <label className="form-label required">Chief Complaint</label>
                <textarea
                  {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                  className={`form-input ${errors.chiefComplaint ? 'border-error-300' : ''}`}
                  rows={2}
                  placeholder="Patient's main complaint"
                />
                {errors.chiefComplaint && (
                  <p className="form-error">{errors.chiefComplaint.message}</p>
                )}
              </div>
              
              {/* Diagnosis */}
              <div>
                <label className="form-label required">Diagnosis</label>
                <textarea
                  {...register('diagnosis', { required: 'Diagnosis is required' })}
                  className={`form-input ${errors.diagnosis ? 'border-error-300' : ''}`}
                  rows={2}
                  placeholder="Clinical diagnosis"
                />
                {errors.diagnosis && (
                  <p className="form-error">{errors.diagnosis.message}</p>
                )}
              </div>
              
              {/* Treatment Plan */}
              <div>
                <label className="form-label required">Treatment Plan</label>
                <textarea
                  {...register('treatmentPlan', { required: 'Treatment plan is required' })}
                  className={`form-input ${errors.treatmentPlan ? 'border-error-300' : ''}`}
                  rows={2}
                  placeholder="Treatment plan and recommendations"
                />
                {errors.treatmentPlan && (
                  <p className="form-error">{errors.treatmentPlan.message}</p>
                )}
              </div>
              
              {/* Prescriptions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label mb-0">Prescriptions</label>
                  <button
                    type="button"
                    onClick={addPrescription}
                    className="btn btn-sm btn-outline flex items-center py-1"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Medication
                  </button>
                </div>
                
                <div className="space-y-3">
                  {prescriptions.map((prescription, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-grow mr-2">
                          <label className="form-label text-xs">Medication</label>
                          <div className="relative">
                            <input
                              type="text"
                              className="form-input py-1.5 text-sm"
                              placeholder="Search medication..."
                              value={medicationSearch}
                              onChange={(e) => setMedicationSearch(e.target.value)}
                              onFocus={() => setMedicationSearch('')}
                            />
                            {medicationSearch !== '' && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {filteredMedications.map(med => (
                                  <div
                                    key={med.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                    onClick={() => {
                                      const currentPrescriptions = [...prescriptions];
                                      currentPrescriptions[index].medication = med.name;
                                      setValue('prescriptions', currentPrescriptions);
                                      setMedicationSearch('');
                                    }}
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{med.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {med.dosage_forms.join(', ')}
                                      </p>
                                    </div>
                                    <div className="flex items-center">
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        med.in_stock 
                                          ? 'bg-success-100 text-success-800' 
                                          : 'bg-error-100 text-error-800'
                                      }`}>
                                        {med.in_stock ? 'In Stock' : 'Out of Stock'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {filteredMedications.length === 0 && (
                                  <div className="p-2 text-sm text-gray-500">
                                    No medications found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            className="form-input py-1.5 text-sm mt-1"
                            placeholder="Enter medication name"
                            {...register(`prescriptions.${index}.medication`)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePrescription(index)}
                          className="text-error-500 hover:text-error-700 mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="form-label text-xs">Dosage</label>
                          <input
                            type="text"
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., 500mg"
                            {...register(`prescriptions.${index}.dosage`)}
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Frequency</label>
                          <input
                            type="text"
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., 3 times daily"
                            {...register(`prescriptions.${index}.frequency`)}
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Duration</label>
                          <input
                            type="text"
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., 7 days"
                            {...register(`prescriptions.${index}.duration`)}
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Instructions</label>
                          <input
                            type="text"
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., Take with food"
                            {...register(`prescriptions.${index}.instructions`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Additional Notes */}
              <div>
                <label className="form-label">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-input"
                  rows={2}
                  placeholder="Any additional notes or observations"
                />
              </div>
              
              {/* Medical Certificate */}
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="medicalCertificate"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('medicalCertificate')}
                  />
                  <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                    Issue Medical Certificate
                  </label>
                </div>
                
                {medicalCertificate && (
                  <div className="p-3 border border-gray-200 rounded-md space-y-3">
                    <div>
                      <label className="form-label text-sm">Certificate Type</label>
                      <select
                        className="form-input py-1.5 text-sm"
                        {...register('certificateType')}
                      >
                        <option value="sick_leave">Sick Leave Certificate</option>
                        <option value="fitness">Medical Fitness Certificate</option>
                        <option value="travel">Travel Fitness Certificate</option>
                        <option value="school">School Absence Certificate</option>
                      </select>
                    </div>
                    
                    {certificateType === 'sick_leave' && (
                      <div>
                        <label className="form-label text-sm">Number of Days</label>
                        <input
                          type="number"
                          className="form-input py-1.5 text-sm"
                          min={1}
                          {...register('certificateDays', { valueAsNumber: true })}
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="form-label text-sm">Certificate Notes</label>
                      <textarea
                        className="form-input py-1.5 text-sm"
                        rows={2}
                        placeholder="Additional notes for the certificate"
                        {...register('certificateNotes')}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline flex items-center"
                      >
                        <FileCheck className="h-4 w-4 mr-1" />
                        Preview Certificate
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="btn btn-outline flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
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
                      <Save className="h-4 w-4 mr-2" />
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