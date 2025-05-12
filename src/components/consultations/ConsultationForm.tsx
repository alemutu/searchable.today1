import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { FileText, Plus, Trash2, User, Activity, AlertTriangle, Clock, FileBarChart2, Search, Calendar, X } from 'lucide-react';

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
  const [showPatientHistoryCollapsed, setShowPatientHistoryCollapsed] = useState(false);
  const [showFamilyHistoryCollapsed, setShowFamilyHistoryCollapsed] = useState(false);
  const [showGeneralExamCollapsed, setShowGeneralExamCollapsed] = useState(false);
  const [showSystemicExamCollapsed, setShowSystemicExamCollapsed] = useState(false);
  const [searchMedication, setSearchMedication] = useState('');
  const [medicationResults, setMedicationResults] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
      }
    }
  });

  const labTests = watch('labTests');
  const radiologyTests = watch('radiologyTests');
  const medicalCertificate = watch('medicalCertificate');
  const medicalCertificateDetails = watch('medicalCertificateDetails');
  const prescriptions = watch('prescriptions');

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
    } finally {
      setIsLoading(false);
    }
  };

  // Common medications database
  const commonMedications = [
    { name: 'Acetaminophen', dosages: ['500mg', '650mg', '1000mg'] },
    { name: 'Ibuprofen', dosages: ['200mg', '400mg', '600mg', '800mg'] },
    { name: 'Amoxicillin', dosages: ['250mg', '500mg', '875mg'] },
    { name: 'Lisinopril', dosages: ['5mg', '10mg', '20mg', '40mg'] },
    { name: 'Atorvastatin', dosages: ['10mg', '20mg', '40mg', '80mg'] },
    { name: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
    { name: 'Levothyroxine', dosages: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '137mcg', '150mcg', '175mcg', '200mcg'] },
    { name: 'Amlodipine', dosages: ['2.5mg', '5mg', '10mg'] },
    { name: 'Metoprolol', dosages: ['25mg', '50mg', '100mg', '200mg'] },
    { name: 'Omeprazole', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Losartan', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Gabapentin', dosages: ['100mg', '300mg', '400mg', '600mg', '800mg'] },
    { name: 'Hydrochlorothiazide', dosages: ['12.5mg', '25mg', '50mg'] },
    { name: 'Sertraline', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Simvastatin', dosages: ['5mg', '10mg', '20mg', '40mg'] },
    { name: 'Montelukast', dosages: ['4mg', '5mg', '10mg'] },
    { name: 'Fluoxetine', dosages: ['10mg', '20mg', '40mg', '60mg'] },
    { name: 'Albuterol', dosages: ['90mcg/actuation', '108mcg/actuation'] },
    { name: 'Prednisone', dosages: ['1mg', '2.5mg', '5mg', '10mg', '20mg', '50mg'] },
    { name: 'Citalopram', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Azithromycin', dosages: ['250mg', '500mg', '600mg'] },
    { name: 'Ciprofloxacin', dosages: ['250mg', '500mg', '750mg'] },
    { name: 'Furosemide', dosages: ['20mg', '40mg', '80mg'] },
    { name: 'Pantoprazole', dosages: ['20mg', '40mg'] },
    { name: 'Tramadol', dosages: ['50mg', '100mg'] },
    { name: 'Escitalopram', dosages: ['5mg', '10mg', '20mg'] },
    { name: 'Warfarin', dosages: ['1mg', '2mg', '2.5mg', '3mg', '4mg', '5mg', '6mg', '7.5mg', '10mg'] },
    { name: 'Clonazepam', dosages: ['0.5mg', '1mg', '2mg'] },
    { name: 'Lorazepam', dosages: ['0.5mg', '1mg', '2mg'] },
    { name: 'Alprazolam', dosages: ['0.25mg', '0.5mg', '1mg', '2mg'] }
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

  // Search medications
  useEffect(() => {
    if (searchMedication.length > 1) {
      const results = commonMedications
        .filter(med => med.name.toLowerCase().includes(searchMedication.toLowerCase()))
        .map(med => med.name);
      setMedicationResults(results);
    } else {
      setMedicationResults([]);
    }
  }, [searchMedication]);

  const selectMedication = (medication: string, index: number) => {
    const selectedMed = commonMedications.find(med => med.name === medication);
    
    // Update the medication field
    setValue(`prescriptions.${index}.medication`, medication);
    
    // Set a default dosage if available
    if (selectedMed && selectedMed.dosages.length > 0) {
      setValue(`prescriptions.${index}.dosage`, selectedMed.dosages[0]);
    }
    
    // Clear the search
    setSearchMedication('');
    setMedicationResults([]);
    
    // Focus on the dosage field
    const dosageField = document.getElementById(`dosage-${index}`);
    if (dosageField) {
      dosageField.focus();
    }
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
          department_id: user.department_id
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
            medications: data.prescriptions.filter(p => p.medication.trim() !== '').map(p => ({
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

      // Show success notification
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
      message: `Added lab test: ${test.name}`,
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
      message: `Added radiology test: ${test.name}`,
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
      message: `Removed lab test: ${testName}`,
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
      message: `Removed radiology test: ${testName}`,
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

  const handleMedicalCertificatePreview = () => {
    if (!medicalCertificate || !medicalCertificateDetails) return;
    
    setShowMedicalCertificatePreview(true);
    
    // Create a new window for the certificate
    const certificateWindow = window.open('', '_blank');
    if (!certificateWindow) {
      alert('Please allow popups to view the medical certificate');
      return;
    }
    
    // Generate the certificate HTML
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #00afaf;
            padding-bottom: 10px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #00afaf;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            text-transform: uppercase;
          }
          .section {
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
          }
          .signature {
            margin-top: 60px;
            border-top: 1px solid #000;
            width: 200px;
            text-align: center;
            padding-top: 5px;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none;
            }
          }
          .print-button {
            background-color: #00afaf;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .patient-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .patient-info div {
            flex: 1;
          }
          .label {
            font-weight: bold;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
          <button class="print-button" onclick="window.print()">Print Certificate</button>
        </div>
        
        <div class="header">
          <div class="logo">
            <span>HMS Hospital Management System</span>
          </div>
          <div>${hospital?.name || 'General Hospital'}</div>
          <div>${hospital?.address || '123 Hospital Street, Medical City'}</div>
          <div>Tel: ${hospital?.phone || '(123) 456-7890'}</div>
        </div>
        
        <div class="title">Medical Certificate</div>
        
        <div class="section">
          <p>This is to certify that I have examined:</p>
          
          <div class="patient-info">
            <div>
              <span class="label">Name:</span>
              <span>${patient.first_name} ${patient.last_name}</span>
            </div>
            <div>
              <span class="label">Gender:</span>
              <span>${patient.gender}</span>
            </div>
            <div>
              <span class="label">Date of Birth:</span>
              <span>${new Date(patient.date_of_birth).toLocaleDateString()}</span>
            </div>
          </div>
          
          <p>
            <span class="label">Diagnosis:</span>
            <span>${watch('diagnosis') || '[Diagnosis will appear here]'}</span>
          </p>
          
          <p>
            This patient is advised to rest and refrain from work/school from 
            <strong>${new Date(medicalCertificateDetails.startDate).toLocaleDateString()}</strong> to 
            <strong>${new Date(medicalCertificateDetails.endDate).toLocaleDateString()}</strong>.
          </p>
          
          <p>
            <span class="label">Reason:</span>
            <span>${medicalCertificateDetails.reason || 'Medical treatment and recovery'}</span>
          </p>
          
          <p>
            <span class="label">Recommendations:</span>
            <span>${medicalCertificateDetails.recommendations || 'Rest and follow prescribed treatment'}</span>
          </p>
        </div>
        
        <div class="footer">
          <div>
            <div class="signature">
              Dr. ${user?.first_name || ''} ${user?.last_name || ''}
            </div>
            <div>License No: [License Number]</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div style="text-align: right;">
            <img src="${hospital?.logo_url || ''}" alt="Hospital Logo" style="max-width: 100px; max-height: 100px;">
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Write the HTML to the new window
    certificateWindow.document.write(certificateHtml);
    certificateWindow.document.close();
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Patient History</h3>
                <button 
                  type="button" 
                  className="text-xs text-primary-600"
                  onClick={() => setShowPatientHistoryCollapsed(!showPatientHistoryCollapsed)}
                >
                  {showPatientHistoryCollapsed ? 'Show' : 'Hide'}
                </button>
              </div>
              
              {!showPatientHistoryCollapsed && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">History of Presenting Illness</h4>
                  <textarea
                    rows={3}
                    className="form-input text-sm"
                    placeholder="Enter details about the history of presenting illness..."
                  />
                  
                  {patient.gender === 'Female' && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Gynecological/Obstetric History</h4>
                      <textarea
                        rows={2}
                        className="form-input text-sm"
                        placeholder="Enter gynecological or obstetric history if applicable..."
                      />
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Past Medical and Surgical History</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter past medical and surgical history..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Family and Socioeconomic History</h3>
                <button 
                  type="button" 
                  className="text-xs text-primary-600"
                  onClick={() => setShowFamilyHistoryCollapsed(!showFamilyHistoryCollapsed)}
                >
                  {showFamilyHistoryCollapsed ? 'Show' : 'Hide'}
                </button>
              </div>
              
              {!showFamilyHistoryCollapsed && (
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Enter family history and socioeconomic information..."
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">General Examination</h3>
                <button 
                  type="button" 
                  className="text-xs text-primary-600"
                  onClick={() => setShowGeneralExamCollapsed(!showGeneralExamCollapsed)}
                >
                  {showGeneralExamCollapsed ? 'Show' : 'Hide'}
                </button>
              </div>
              
              {!showGeneralExamCollapsed && (
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Enter general examination findings..."
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900">Systemic Examination</h3>
                <button 
                  type="button" 
                  className="text-xs text-primary-600"
                  onClick={() => setShowSystemicExamCollapsed(!showSystemicExamCollapsed)}
                >
                  {showSystemicExamCollapsed ? 'Show' : 'Hide'}
                </button>
              </div>
              
              {!showSystemicExamCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Cardiovascular System</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter cardiovascular findings..."
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Respiratory System</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter respiratory findings..."
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Gastrointestinal System</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter gastrointestinal findings..."
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Central Nervous System</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter neurological findings..."
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Musculoskeletal</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter musculoskeletal findings..."
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Other Systems/Examination</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter other examination findings..."
                    />
                  </div>
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
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom
              </button>
            </div>
            
            {/* Medication Search */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchMedication}
                  onChange={(e) => setSearchMedication(e.target.value)}
                  className="form-input pl-10 w-full"
                  placeholder="Search medications..."
                />
                {searchMedication && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => {
                      setSearchMedication('');
                      setMedicationResults([]);
                    }}
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {medicationResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  <ul className="py-1">
                    {medicationResults.map((medication, idx) => (
                      <li 
                        key={idx}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          // Find the first empty medication field or use the last one
                          const emptyIndex = prescriptions.findIndex(p => !p.medication);
                          const index = emptyIndex >= 0 ? emptyIndex : prescriptions.length - 1;
                          selectMedication(medication, index);
                        }}
                      >
                        {medication}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* No Medications Message */}
            {prescriptions.every(p => !p.medication) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 text-gray-300 mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-16 w-16">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No medications prescribed yet</h3>
                <p className="text-gray-500 max-w-md mb-2">
                  Search above or click Add Custom to prescribe medications
                </p>
                <button 
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Skip prescribing medications
                </button>
              </div>
            )}
            
            {/* Medication List */}
            {Array.from({ length: prescriptionCount }).map((_, index) => (
              <div key={index} className={`border rounded-lg p-4 space-y-4 ${prescriptions[index]?.medication ? 'border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
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
                        if (prescriptions[index]?.medication) {
                          addNotification({
                            message: `Removed ${prescriptions[index].medication}`,
                            type: 'info',
                            duration: 2000
                          });
                        }
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
                    <input
                      type="text"
                      {...register(`prescriptions.${index}.medication` as const, {
                        required: index === 0 ? 'Medication name is required' : false
                      })}
                      className="form-input"
                      placeholder="Enter medication name"
                      onChange={(e) => {
                        setValue(`prescriptions.${index}.medication`, e.target.value);
                        // If user is typing in this field, update the search term
                        setSearchMedication(e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Dosage</label>
                    <input
                      type="text"
                      id={`dosage-${index}`}
                      {...register(`prescriptions.${index}.dosage` as const, {
                        required: prescriptions[index]?.medication ? 'Dosage is required' : false
                      })}
                      className="form-input"
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div>
                    <label className="form-label">Frequency</label>
                    <select
                      {...register(`prescriptions.${index}.frequency` as const, {
                        required: prescriptions[index]?.medication ? 'Frequency is required' : false
                      })}
                      className="form-input"
                      defaultValue=""
                    >
                      <option value="" disabled>Select frequency</option>
                      {commonFrequencies.map((freq, i) => (
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
                      defaultValue=""
                    >
                      <option value="" disabled>Select duration</option>
                      {commonDurations.map((duration, i) => (
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
                      placeholder="Any special instructions for this medication"
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

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center mb-2">
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
              
              {medicalCertificate && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        {...register('medicalCertificateDetails.startDate')}
                        className="form-input"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        {...register('medicalCertificateDetails.endDate')}
                        className="form-input"
                        defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Reason</label>
                    <input
                      type="text"
                      {...register('medicalCertificateDetails.reason')}
                      className="form-input"
                      placeholder="Reason for medical leave"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Recommendations</label>
                    <textarea
                      {...register('medicalCertificateDetails.recommendations')}
                      className="form-input"
                      rows={2}
                      placeholder="Recommendations for the patient"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleMedicalCertificatePreview}
                      className="btn btn-outline inline-flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Preview & Print
                    </button>
                  </div>
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
    </div>
  );
};

export default ConsultationForm;