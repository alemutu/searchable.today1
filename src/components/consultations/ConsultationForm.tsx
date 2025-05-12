import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { FileText, Plus, Trash2, Stethoscope, Activity, Search, Pill, FlaskRound as Flask, FileImage, AlertCircle, ArrowRight } from 'lucide-react';
import { useNotification } from '../common/NotificationProvider';

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
  diagnosticTests: {
    type: 'lab' | 'radiology';
    name: string;
    price: number;
    urgent: boolean;
    notes?: string;
  }[];
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [patient, setPatient] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnostics' | 'medications' | 'notes' | 'summary'>('assessment');
  const [prescriptionCount, setPrescriptionCount] = useState(1);
  const [showMedicationSearch, setShowMedicationSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [commonMedications, setCommonMedications] = useState([
    { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days', instructions: 'Take with food' },
    { name: 'Paracetamol', dosage: '500mg', frequency: 'QID', duration: '5 days', instructions: 'Take as needed for pain' },
    { name: 'Ibuprofen', dosage: '400mg', frequency: 'TID', duration: '5 days', instructions: 'Take with food' },
    { name: 'Omeprazole', dosage: '20mg', frequency: 'OD', duration: '14 days', instructions: 'Take before breakfast' },
    { name: 'Metformin', dosage: '500mg', frequency: 'BID', duration: '30 days', instructions: 'Take with meals' },
    { name: 'Atorvastatin', dosage: '10mg', frequency: 'OD', duration: '30 days', instructions: 'Take at bedtime' },
    { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days', instructions: 'Take in the morning' },
    { name: 'Salbutamol', dosage: '100mcg', frequency: 'QID', duration: 'PRN', instructions: '2 puffs as needed' }
  ]);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [labTests, setLabTests] = useState([
    { name: 'Complete Blood Count (CBC)', price: 1200, category: 'Hematology' },
    { name: 'Liver Function Test', price: 1500, category: 'Clinical Chemistry' },
    { name: 'Lipid Profile', price: 1200, category: 'Clinical Chemistry' },
    { name: 'Blood Glucose', price: 500, category: 'Clinical Chemistry' },
    { name: 'Urinalysis', price: 800, category: 'Microbiology' },
    { name: 'HbA1c', price: 1800, category: 'Clinical Chemistry' },
    { name: 'Thyroid Function Test', price: 2500, category: 'Clinical Chemistry' },
    { name: 'Kidney Function Test', price: 1500, category: 'Clinical Chemistry' }
  ]);
  const [radiologyTests, setRadiologyTests] = useState([
    { name: 'Chest X-Ray', price: 2500, category: 'X-Ray' },
    { name: 'Abdominal X-Ray', price: 2500, category: 'X-Ray' },
    { name: 'CT Scan - Head', price: 8500, category: 'CT Scan' },
    { name: 'CT Scan - Chest', price: 9500, category: 'CT Scan' },
    { name: 'MRI - Brain', price: 12000, category: 'MRI' },
    { name: 'MRI - Spine', price: 15000, category: 'MRI' },
    { name: 'Ultrasound - Abdomen', price: 3500, category: 'Ultrasound' },
    { name: 'Ultrasound - Pelvis', price: 3500, category: 'Ultrasound' }
  ]);
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      diagnosticTests: []
    }
  });

  const prescriptions = watch('prescriptions');
  const diagnosticTests = watch('diagnosticTests');

  useEffect(() => {
    if (hospital) {
      fetchDepartments();
    }
    
    if (patientId) {
      fetchPatient();
    }
  }, [hospital, patientId]);

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
    }
  };

  const fetchDepartments = async () => {
    try {
      if (import.meta.env.DEV) {
        // Use mock data in development
        const mockDepartments = [
          { id: '1', name: 'Emergency' },
          { id: '2', name: 'General Medicine' },
          { id: '3', name: 'Cardiology' },
          { id: '4', name: 'Pediatrics' },
          { id: '5', name: 'Orthopedics' }
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

  const handleAddPrescription = () => {
    const currentPrescriptions = watch('prescriptions');
    setValue('prescriptions', [
      ...currentPrescriptions,
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    setPrescriptionCount(prev => prev + 1);
  };

  const handleRemovePrescription = (index: number) => {
    const currentPrescriptions = watch('prescriptions');
    setValue('prescriptions', currentPrescriptions.filter((_, i) => i !== index));
    setPrescriptionCount(prev => prev - 1);
  };

  const handleSelectMedication = (medication: any) => {
    const currentPrescriptions = watch('prescriptions');
    const emptyIndex = currentPrescriptions.findIndex(p => !p.medication);
    
    if (emptyIndex >= 0) {
      // Update the first empty prescription
      const updatedPrescriptions = [...currentPrescriptions];
      updatedPrescriptions[emptyIndex] = medication;
      setValue('prescriptions', updatedPrescriptions);
    } else {
      // Add a new prescription
      setValue('prescriptions', [...currentPrescriptions, medication]);
      setPrescriptionCount(prev => prev + 1);
    }
    
    setShowMedicationSearch(false);
    setSearchTerm('');
    showNotification('success', `Added ${medication.name} to prescription`, 2000);
  };

  const handleAddLabTest = (test: any) => {
    const currentTests = watch('diagnosticTests');
    setValue('diagnosticTests', [
      ...currentTests,
      { 
        type: 'lab', 
        name: test.name, 
        price: test.price,
        urgent: false,
        notes: ''
      }
    ]);
    setShowLabTestModal(false);
    showNotification('success', `Added ${test.name} to diagnostic tests`, 2000);
  };

  const handleAddRadiologyTest = (test: any) => {
    const currentTests = watch('diagnosticTests');
    setValue('diagnosticTests', [
      ...currentTests,
      { 
        type: 'radiology', 
        name: test.name, 
        price: test.price,
        urgent: false,
        notes: ''
      }
    ]);
    setShowRadiologyModal(false);
    showNotification('success', `Added ${test.name} to diagnostic tests`, 2000);
  };

  const handleRemoveTest = (index: number) => {
    const currentTests = watch('diagnosticTests');
    const removedTest = currentTests[index];
    setValue('diagnosticTests', currentTests.filter((_, i) => i !== index));
    showNotification('info', `Removed ${removedTest.name} from diagnostic tests`, 2000);
  };

  const toggleTestUrgency = (index: number) => {
    const currentTests = watch('diagnosticTests');
    const updatedTests = [...currentTests];
    updatedTests[index].urgent = !updatedTests[index].urgent;
    setValue('diagnosticTests', updatedTests);
    
    const test = updatedTests[index];
    if (test.urgent) {
      showNotification('warning', `Marked ${test.name} as URGENT`, 2000);
    } else {
      showNotification('info', `Removed urgency flag from ${test.name}`, 2000);
    }
  };

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (!hospital || !user || !patientId) throw new Error('Missing required data');

      // Create consultation record
      const { error: consultationError, data: consultationData } = await supabase
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
          department_id: user.department_id
        })
        .select();

      if (consultationError) throw consultationError;
      
      showNotification('success', 'Consultation saved successfully', 2000);

      // If there are prescriptions, create a pharmacy order
      if (data.prescriptions && data.prescriptions.length > 0 && data.prescriptions[0].medication) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            prescription_id: consultationData[0].id,
            medications: data.prescriptions.map(p => ({
              ...p,
              quantity: 1, // Default quantity
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: false
          });

        if (pharmacyError) throw pharmacyError;
        showNotification('info', 'Prescription sent to pharmacy', 2000);
      }

      // If there are diagnostic tests, create lab and radiology orders
      if (data.diagnosticTests && data.diagnosticTests.length > 0) {
        // Process lab tests
        const labTests = data.diagnosticTests.filter(test => test.type === 'lab');
        if (labTests.length > 0) {
          const { error: labError } = await supabase
            .from('lab_results')
            .insert({
              patient_id: patientId,
              hospital_id: hospital.id,
              test_type: labTests.map(t => t.name).join(', '),
              test_date: new Date().toISOString(),
              status: 'pending',
              results: {
                tests: labTests,
                urgent: labTests.some(t => t.urgent)
              }
            });

          if (labError) throw labError;
          showNotification('info', 'Lab tests ordered successfully', 2000);
        }

        // Process radiology tests
        const radiologyTests = data.diagnosticTests.filter(test => test.type === 'radiology');
        if (radiologyTests.length > 0) {
          const { error: radiologyError } = await supabase
            .from('radiology_results')
            .insert({
              patient_id: patientId,
              hospital_id: hospital.id,
              scan_type: radiologyTests[0].name.toLowerCase().replace(/\s+/g, '_'),
              scan_date: new Date().toISOString(),
              status: 'pending',
              results: {
                tests: radiologyTests,
                urgent: radiologyTests.some(t => t.urgent)
              },
              is_emergency: radiologyTests.some(t => t.urgent)
            });

          if (radiologyError) throw radiologyError;
          showNotification('info', 'Radiology tests ordered successfully', 2000);
        }

        // Create billing record for diagnostic tests
        const { error: billingError } = await supabase
          .from('billing')
          .insert({
            patient_id: patientId,
            hospital_id: hospital.id,
            consultation_id: consultationData[0].id,
            services: data.diagnosticTests.map(test => ({
              name: test.name,
              amount: test.price,
              quantity: 1
            })),
            total_amount: data.diagnosticTests.reduce((sum, test) => sum + test.price, 0),
            paid_amount: 0,
            payment_status: 'pending'
          });

        if (billingError) throw billingError;
        showNotification('info', 'Billing record created for diagnostic tests', 2000);
      }

      // Determine the next flow step based on what was ordered
      let nextFlowStep = 'post_consultation';
      
      if (data.diagnosticTests.length > 0) {
        if (data.diagnosticTests.some(t => t.type === 'lab')) {
          nextFlowStep = 'lab_tests';
        } else if (data.diagnosticTests.some(t => t.type === 'radiology')) {
          nextFlowStep = 'radiology';
        }
      } else if (data.prescriptions.length > 0 && data.prescriptions[0].medication) {
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

      showNotification('success', 'Consultation completed successfully', 3000);
      setTimeout(() => {
        navigate('/patients');
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting consultation:', error.message);
      showNotification('warning', `Error: ${error.message}`, 5000);
    }
  };

  const filteredMedications = searchTerm
    ? commonMedications.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : commonMedications;

  const filteredLabTests = searchTerm
    ? labTests.filter(test => 
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : labTests;

  const filteredRadiologyTests = searchTerm
    ? radiologyTests.filter(test => 
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : radiologyTests;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'assessment'
                  ? 'text-primary-600 border-b-2 border-primary-500 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('assessment')}
            >
              <Stethoscope className="h-5 w-5 inline mr-2" />
              Assessment
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'diagnostics'
                  ? 'text-primary-600 border-b-2 border-primary-500 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('diagnostics')}
            >
              <Flask className="h-5 w-5 inline mr-2" />
              Diagnostic Tests
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'medications'
                  ? 'text-primary-600 border-b-2 border-primary-500 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('medications')}
            >
              <Pill className="h-5 w-5 inline mr-2" />
              Medications
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'notes'
                  ? 'text-primary-600 border-b-2 border-primary-500 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText className="h-5 w-5 inline mr-2" />
              Notes
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'summary'
                  ? 'text-primary-600 border-b-2 border-primary-500 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              <Activity className="h-5 w-5 inline mr-2" />
              Summary
            </button>
          </div>
        </div>

        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Clinical Assessment</h2>
            
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

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary inline-flex items-center"
                onClick={() => setActiveTab('diagnostics')}
              >
                Next: Diagnostic Tests
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Diagnostic Tests Tab */}
        {activeTab === 'diagnostics' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Diagnostic Tests</h2>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLabTestModal(true)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Flask className="h-5 w-5 mr-2" />
                  Order Lab Tests
                </button>
                <button
                  type="button"
                  onClick={() => setShowRadiologyModal(true)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <FileImage className="h-5 w-5 mr-2" />
                  Order Radiology
                </button>
              </div>
            </div>

            {diagnosticTests.length === 0 ? (
              <div className="text-center py-12">
                <Flask className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No diagnostic tests ordered yet</h3>
                <p className="text-gray-500 mb-6">Order lab tests or radiology using the buttons above</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Ordered Tests</h3>
                <div className="divide-y divide-gray-200">
                  {diagnosticTests.map((test, index) => (
                    <div key={index} className="py-4 flex items-start justify-between">
                      <div className="flex items-start">
                        {test.type === 'lab' ? (
                          <Flask className="h-5 w-5 text-primary-500 mt-0.5 mr-3" />
                        ) : (
                          <FileImage className="h-5 w-5 text-primary-500 mt-0.5 mr-3" />
                        )}
                        <div>
                          <div className="flex items-center">
                            <h4 className="text-base font-medium text-gray-900">{test.name}</h4>
                            {test.urgent && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 text-error-800">
                                URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{formatCurrency(test.price)}</p>
                          {test.notes && <p className="text-sm text-gray-600 mt-1">{test.notes}</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleTestUrgency(index)}
                          className={`p-1 rounded-full ${
                            test.urgent ? 'bg-error-100 text-error-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={test.urgent ? "Remove urgency" : "Mark as urgent"}
                        >
                          <AlertCircle className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(index)}
                          className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                          title="Remove test"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-base font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(diagnosticTests.reduce((sum, test) => sum + test.price, 0))}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                className="btn btn-outline inline-flex items-center"
                onClick={() => setActiveTab('assessment')}
              >
                Back to Assessment
              </button>
              <button
                type="button"
                className="btn btn-primary inline-flex items-center"
                onClick={() => setActiveTab('medications')}
              >
                Next: Medications
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10 pr-4 py-2 w-full"
                  placeholder="Search medications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowMedicationSearch(true)}
                />
              </div>
              <button
                type="button"
                onClick={handleAddPrescription}
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Custom
              </button>
            </div>

            {prescriptions.length === 0 || !prescriptions[0].medication ? (
              <div className="text-center py-12">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No medications prescribed yet</h3>
                <p className="text-gray-500 mb-4">Search above or click Add Custom to prescribe medications</p>
                <button 
                  type="button" 
                  className="text-primary-600 hover:text-primary-800 font-medium"
                  onClick={() => setActiveTab('notes')}
                >
                  Skip prescribing medications
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Medication #{index + 1}</h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrescription(index)}
                          className="text-error-600 hover:text-error-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label">Medication Name</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.medication` as const, {
                            required: 'Medication name is required'
                          })}
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label className="form-label">Dosage</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.dosage` as const, {
                            required: 'Dosage is required'
                          })}
                          className="form-input"
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
                          <option value="OD">Once daily (OD)</option>
                          <option value="BID">Twice daily (BID)</option>
                          <option value="TID">Three times daily (TID)</option>
                          <option value="QID">Four times daily (QID)</option>
                          <option value="QHS">At bedtime (QHS)</option>
                          <option value="Q4H">Every 4 hours (Q4H)</option>
                          <option value="Q6H">Every 6 hours (Q6H)</option>
                          <option value="Q8H">Every 8 hours (Q8H)</option>
                          <option value="PRN">As needed (PRN)</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Duration</label>
                        <input
                          type="text"
                          {...register(`prescriptions.${index}.duration` as const, {
                            required: 'Duration is required'
                          })}
                          className="form-input"
                          placeholder="e.g., 7 days, 2 weeks"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="form-label">Special Instructions</label>
                        <textarea
                          {...register(`prescriptions.${index}.instructions` as const)}
                          className="form-input"
                          rows={2}
                          placeholder="e.g., Take with food, Avoid alcohol"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={handleAddPrescription}
                    className="btn btn-outline inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Medication
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary inline-flex items-center"
                    onClick={() => {
                      showNotification('info', 'Prescription ready to be sent to pharmacy', 2000);
                      setActiveTab('notes');
                    }}
                  >
                    <Pill className="h-4 w-4 mr-2" />
                    Continue to Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
            
            <div>
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                id="notes"
                rows={6}
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
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                className="btn btn-outline inline-flex items-center"
                onClick={() => setActiveTab('medications')}
              >
                Back to Medications
              </button>
              <button
                type="button"
                className="btn btn-primary inline-flex items-center"
                onClick={() => setActiveTab('summary')}
              >
                Review Summary
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Consultation Summary</h2>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chief Complaint</p>
                    <p className="text-base text-gray-900">{watch('chiefComplaint') || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                    <p className="text-base text-gray-900">{watch('diagnosis') || 'Not provided'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Treatment Plan</p>
                  <p className="text-base text-gray-900">{watch('treatmentPlan') || 'Not provided'}</p>
                </div>
              </div>

              {diagnosticTests.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnostic Tests</h3>
                  <div className="space-y-2">
                    {diagnosticTests.filter(test => test.type === 'lab').length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Laboratory Tests</p>
                        <ul className="list-disc list-inside text-base text-gray-900">
                          {diagnosticTests.filter(test => test.type === 'lab').map((test, index) => (
                            <li key={index} className="flex items-center">
                              {test.name}
                              {test.urgent && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 text-error-800">
                                  URGENT
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {diagnosticTests.filter(test => test.type === 'radiology').length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Radiology Tests</p>
                        <ul className="list-disc list-inside text-base text-gray-900">
                          {diagnosticTests.filter(test => test.type === 'radiology').map((test, index) => (
                            <li key={index} className="flex items-center">
                              {test.name}
                              {test.urgent && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 text-error-800">
                                  URGENT
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {prescriptions.length > 0 && prescriptions[0].medication && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Medications</h3>
                  <div className="space-y-3">
                    {prescriptions.map((prescription, index) => (
                      prescription.medication ? (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-gray-900">{prescription.medication}</h4>
                            <span className="text-sm text-gray-500">Dosage: {prescription.dosage}</span>
                          </div>
                          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-700">
                            <div>
                              <span className="font-medium">Frequency:</span> {prescription.frequency}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {prescription.duration}
                            </div>
                          </div>
                          {prescription.instructions && (
                            <div className="mt-1 text-sm text-gray-700">
                              <span className="font-medium">Instructions:</span> {prescription.instructions}
                            </div>
                          )}
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Information</h3>
                <p className="text-base text-gray-900">{watch('notes') || 'No additional notes'}</p>
                {watch('medicalCertificate') && (
                  <div className="mt-2 flex items-center text-primary-600">
                    <FileText className="h-5 w-5 mr-2" />
                    <span>Medical Certificate will be issued</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                className="btn btn-outline inline-flex items-center"
                onClick={() => setActiveTab('notes')}
              >
                Back to Notes
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Consultation'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Medication Search Modal */}
      {showMedicationSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Select Medication</h3>
              <button
                type="button"
                onClick={() => {
                  setShowMedicationSearch(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10 pr-4 py-2 w-full"
                  placeholder="Search medications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {filteredMedications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No medications found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMedications.map((medication, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectMedication(medication)}
                      >
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-900">{medication.name}</h4>
                          <span className="text-sm text-gray-500">{medication.dosage}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-gray-700">
                          <div>
                            <span className="font-medium">Frequency:</span> {medication.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {medication.duration}
                          </div>
                        </div>
                        {medication.instructions && (
                          <div className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">Instructions:</span> {medication.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="btn btn-primary w-full"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Custom Medication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Test Modal */}
      {showLabTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Order Laboratory Tests</h3>
              <button
                type="button"
                onClick={() => {
                  setShowLabTestModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-warning-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-warning-700">
                      Payment required before processing. Patient will be directed to billing after test ordering.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10 pr-4 py-2 w-full"
                  placeholder="Search for laboratory tests by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tests</h4>
                {filteredLabTests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tests found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLabTests.map((test, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddLabTest(test)}
                      >
                        <div className="flex items-center">
                          <Flask className="h-5 w-5 text-primary-500 mr-3" />
                          <div>
                            <h4 className="font-medium text-gray-900">{test.name}</h4>
                            <p className="text-sm text-gray-500">{test.category}</p>
                          </div>
                        </div>
                        <div className="text-base font-medium text-gray-900">
                          {formatCurrency(test.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Radiology Modal */}
      {showRadiologyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Order Radiology Tests</h3>
              <button
                type="button"
                onClick={() => {
                  setShowRadiologyModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-warning-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-warning-700">
                      Payment required before processing. Patient will be directed to billing after test ordering.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10 pr-4 py-2 w-full"
                  placeholder="Search for radiology tests by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tests</h4>
                {filteredRadiologyTests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tests found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRadiologyTests.map((test, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddRadiologyTest(test)}
                      >
                        <div className="flex items-center">
                          <FileImage className="h-5 w-5 text-primary-500 mr-3" />
                          <div>
                            <h4 className="font-medium text-gray-900">{test.name}</h4>
                            <p className="text-sm text-gray-500">{test.category}</p>
                          </div>
                        </div>
                        <div className="text-base font-medium text-gray-900">
                          {formatCurrency(test.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;