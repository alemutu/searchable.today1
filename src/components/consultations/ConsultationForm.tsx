import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { FileText, Plus, Trash2, User, Activity, AlertTriangle, Search, ChevronDown, X } from 'lucide-react';

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
  patientHistory: {
    presentingIllness: string;
    gynecologicalHistory: string;
    pastMedicalSurgical: string;
  };
  familySocioeconomic: string;
  generalExamination: string;
  systemicExamination: {
    cardiovascular: string;
    respiratory: string;
    gastrointestinal: string;
    centralNervous: string;
    musculoskeletal: string;
    other: string;
  };
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [prescriptionCount, setPrescriptionCount] = useState(1);
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnostics' | 'medications' | 'notes'>('assessment');
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [showMedicalCertificatePreview, setShowMedicalCertificatePreview] = useState(false);
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('');
  const [medicationSuggestions, setMedicationSuggestions] = useState<string[]>([]);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [selectedMedicationIndex, setSelectedMedicationIndex] = useState<number | null>(null);
  
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
      patientHistory: {
        presentingIllness: '',
        gynecologicalHistory: '',
        pastMedicalSurgical: ''
      },
      systemicExamination: {
        cardiovascular: '',
        respiratory: '',
        gastrointestinal: '',
        centralNervous: '',
        musculoskeletal: '',
        other: ''
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
    { name: 'Acetaminophen (Tylenol)', dosages: ['325mg', '500mg', '650mg'] },
    { name: 'Ibuprofen (Advil, Motrin)', dosages: ['200mg', '400mg', '600mg', '800mg'] },
    { name: 'Aspirin', dosages: ['81mg', '325mg', '500mg'] },
    { name: 'Amoxicillin', dosages: ['250mg', '500mg', '875mg'] },
    { name: 'Azithromycin (Zithromax)', dosages: ['250mg', '500mg'] },
    { name: 'Lisinopril', dosages: ['5mg', '10mg', '20mg', '40mg'] },
    { name: 'Atorvastatin (Lipitor)', dosages: ['10mg', '20mg', '40mg', '80mg'] },
    { name: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
    { name: 'Amlodipine', dosages: ['2.5mg', '5mg', '10mg'] },
    { name: 'Omeprazole (Prilosec)', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Levothyroxine (Synthroid)', dosages: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '150mcg'] },
    { name: 'Simvastatin (Zocor)', dosages: ['5mg', '10mg', '20mg', '40mg'] },
    { name: 'Metoprolol', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Losartan', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Albuterol (Ventolin)', dosages: ['90mcg/inh', '108mcg/inh'] },
    { name: 'Gabapentin (Neurontin)', dosages: ['100mg', '300mg', '400mg', '600mg', '800mg'] },
    { name: 'Hydrochlorothiazide', dosages: ['12.5mg', '25mg', '50mg'] },
    { name: 'Sertraline (Zoloft)', dosages: ['25mg', '50mg', '100mg'] },
    { name: 'Fluoxetine (Prozac)', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Prednisone', dosages: ['5mg', '10mg', '20mg', '40mg', '50mg'] }
  ];

  // Common frequency options
  const frequencyOptions = [
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

  // Common duration options
  const durationOptions = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '1 month',
    '2 months',
    '3 months',
    '6 months',
    'Indefinite',
    'As directed'
  ];

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    } else {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    // Filter medications based on search term
    if (medicationSearchTerm.length > 1) {
      const filteredMedications = commonMedications
        .filter(med => 
          med.name.toLowerCase().includes(medicationSearchTerm.toLowerCase())
        )
        .map(med => med.name);
      
      setMedicationSuggestions(filteredMedications);
      setShowMedicationDropdown(filteredMedications.length > 0);
    } else {
      setMedicationSuggestions([]);
      setShowMedicationDropdown(false);
    }
  }, [medicationSearchTerm]);

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
          department_id: user.department_id
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

  const handleMedicationSearch = (index: number, value: string) => {
    setSelectedMedicationIndex(index);
    setMedicationSearchTerm(value);
    
    // Update the form value
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index].medication = value;
    setValue('prescriptions', updatedPrescriptions);
  };

  const selectMedication = (medication: string) => {
    if (selectedMedicationIndex === null) return;
    
    // Update the form value
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[selectedMedicationIndex].medication = medication;
    setValue('prescriptions', updatedPrescriptions);
    
    // Find suggested dosages
    const medicationInfo = commonMedications.find(med => med.name === medication);
    if (medicationInfo && medicationInfo.dosages.length > 0) {
      updatedPrescriptions[selectedMedicationIndex].dosage = medicationInfo.dosages[0];
      setValue('prescriptions', updatedPrescriptions);
    }
    
    // Clear search
    setMedicationSearchTerm('');
    setShowMedicationDropdown(false);
    
    addNotification({
      message: `Added ${medication} to prescription`,
      type: 'success',
      duration: 2000
    });
  };

  const handleAddCustomMedication = () => {
    if (selectedMedicationIndex === null) return;
    
    // If there's a search term, use it as the custom medication
    if (medicationSearchTerm) {
      const updatedPrescriptions = [...prescriptions];
      updatedPrescriptions[selectedMedicationIndex].medication = medicationSearchTerm;
      setValue('prescriptions', updatedPrescriptions);
      
      addNotification({
        message: `Added custom medication: ${medicationSearchTerm}`,
        type: 'success',
        duration: 2000
      });
    }
    
    // Clear search
    setMedicationSearchTerm('');
    setShowMedicationDropdown(false);
  };

  const renderMedicalCertificatePreview = () => {
    if (!medicalCertificate || !medicalCertificateDetails) return null;
    
    const startDate = new Date(medicalCertificateDetails.startDate);
    const endDate = new Date(medicalCertificateDetails.endDate);
    
    // Calculate days difference
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-0 overflow-hidden">
          <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Medical Certificate Preview</h2>
            <button 
              onClick={() => setShowMedicalCertificatePreview(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-8 border-b border-gray-200" id="medical-certificate-content">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-primary-600 mb-1">{hospital?.name || 'Hospital Management System'}</h1>
              <p className="text-sm text-gray-500">{hospital?.address || '123 Hospital Street, Medical City'}</p>
              <p className="text-sm text-gray-500">{hospital?.phone || 'Phone: (123) 456-7890'} • {hospital?.email || 'Email: info@hospital.com'}</p>
              <div className="mt-4 border-t border-b border-gray-200 py-2">
                <h2 className="text-xl font-bold">MEDICAL CERTIFICATE</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm">
                <span className="font-semibold">Date Issued:</span> {new Date().toLocaleDateString()}
              </p>
              
              <p className="text-sm">
                This is to certify that <span className="font-bold">{patient.first_name} {patient.last_name}</span>, 
                {patient.gender === 'Male' ? ' a ' : ' a '} 
                {calculateAge(patient.date_of_birth)} year old {patient.gender.toLowerCase()}, 
                has been examined and treated at our facility.
              </p>
              
              <p className="text-sm">
                <span className="font-semibold">Diagnosis:</span> {watch('diagnosis')}
              </p>
              
              <p className="text-sm">
                <span className="font-semibold">Period of Illness/Recovery:</span> {diffDays} day(s)<br />
                <span className="font-semibold">From:</span> {startDate.toLocaleDateString()} <span className="font-semibold">To:</span> {endDate.toLocaleDateString()}
              </p>
              
              {medicalCertificateDetails.reason && (
                <p className="text-sm">
                  <span className="font-semibold">Reason:</span> {medicalCertificateDetails.reason}
                </p>
              )}
              
              {medicalCertificateDetails.recommendations && (
                <p className="text-sm">
                  <span className="font-semibold">Recommendations:</span> {medicalCertificateDetails.recommendations}
                </p>
              )}
              
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-semibold mb-8">Patient Signature</p>
                    <p className="text-sm">{patient.first_name} {patient.last_name}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-semibold mb-8">Physician Signature</p>
                    <p className="text-sm">Dr. {user?.first_name} {user?.last_name}</p>
                    {user?.specialization && <p className="text-xs text-gray-500">{user.specialization}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={() => setShowMedicalCertificatePreview(false)}
              className="btn btn-outline"
            >
              Close
            </button>
            <button
              onClick={() => {
                const content = document.getElementById('medical-certificate-content');
                if (content) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Medical Certificate - ${patient.first_name} ${patient.last_name}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .header h1 { color: #00afaf; margin-bottom: 5px; }
                            .header p { color: #666; margin: 2px 0; }
                            .title { text-align: center; font-weight: bold; font-size: 18px; margin: 15px 0; padding: 5px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }
                            .content { margin: 20px 0; }
                            .content p { margin: 10px 0; }
                            .footer { margin-top: 40px; display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 20px; }
                            .signature { width: 45%; }
                            .signature p { margin-bottom: 30px; }
                            .right { text-align: right; }
                            .bold { font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>${hospital?.name || 'Hospital Management System'}</h1>
                            <p>${hospital?.address || '123 Hospital Street, Medical City'}</p>
                            <p>${hospital?.phone || 'Phone: (123) 456-7890'} • ${hospital?.email || 'Email: info@hospital.com'}</p>
                            <div class="title">MEDICAL CERTIFICATE</div>
                          </div>
                          <div class="content">
                            <p><span class="bold">Date Issued:</span> ${new Date().toLocaleDateString()}</p>
                            <p>This is to certify that <span class="bold">${patient.first_name} ${patient.last_name}</span>, 
                            ${patient.gender === 'Male' ? ' a ' : ' a '} 
                            ${calculateAge(patient.date_of_birth)} year old ${patient.gender.toLowerCase()}, 
                            has been examined and treated at our facility.</p>
                            <p><span class="bold">Diagnosis:</span> ${watch('diagnosis')}</p>
                            <p>
                              <span class="bold">Period of Illness/Recovery:</span> ${diffDays} day(s)<br />
                              <span class="bold">From:</span> ${startDate.toLocaleDateString()} <span class="bold">To:</span> ${endDate.toLocaleDateString()}
                            </p>
                            ${medicalCertificateDetails.reason ? `<p><span class="bold">Reason:</span> ${medicalCertificateDetails.reason}</p>` : ''}
                            ${medicalCertificateDetails.recommendations ? `<p><span class="bold">Recommendations:</span> ${medicalCertificateDetails.recommendations}</p>` : ''}
                          </div>
                          <div class="footer">
                            <div class="signature">
                              <p class="bold">Patient Signature</p>
                              <p>${patient.first_name} ${patient.last_name}</p>
                            </div>
                            <div class="signature right">
                              <p class="bold">Physician Signature</p>
                              <p>Dr. ${user?.first_name} ${user?.last_name}</p>
                              ${user?.specialization ? `<p style="font-size: 12px; color: #666;">${user.specialization}</p>` : ''}
                            </div>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                  }
                }
              }}
              className="btn btn-primary"
            >
              Print Certificate
            </button>
          </div>
        </div>
      </div>
    );
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
                <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
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

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Patient History</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-1">History of Presenting Illness</h4>
                <textarea
                  rows={3}
                  className="form-input text-sm"
                  placeholder="Enter details about the history of presenting illness..."
                  {...register('patientHistory.presentingIllness')}
                />
                
                {patient.gender === 'Female' && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Gynecological/Obstetric History</h4>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      placeholder="Enter gynecological or obstetric history if applicable..."
                      {...register('patientHistory.gynecologicalHistory')}
                    />
                  </div>
                )}
                
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Past Medical and Surgical History</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter past medical and surgical history..."
                    {...register('patientHistory.pastMedicalSurgical')}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Family and Socioeconomic History</h3>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Enter family history and socioeconomic information..."
                {...register('familySocioeconomic')}
              />
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">General Examination</h3>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Enter general examination findings..."
                {...register('generalExamination')}
              />
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Systemic Examination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Cardiovascular System</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter cardiovascular findings..."
                    {...register('systemicExamination.cardiovascular')}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Respiratory System</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter respiratory findings..."
                    {...register('systemicExamination.respiratory')}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Gastrointestinal System</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter gastrointestinal findings..."
                    {...register('systemicExamination.gastrointestinal')}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Central Nervous System</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter neurological findings..."
                    {...register('systemicExamination.centralNervous')}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Musculoskeletal</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter musculoskeletal findings..."
                    {...register('systemicExamination.musculoskeletal')}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Other Systems/Examination</h4>
                  <textarea
                    rows={2}
                    className="form-input text-sm"
                    placeholder="Enter other examination findings..."
                    {...register('systemicExamination.other')}
                  />
                </div>
              </div>
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
            
            {Array.from({ length: prescriptionCount }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Medication #{index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrescriptionCount(prev => prev - 1);
                        // Remove this prescription from the form
                        const updatedPrescriptions = [...prescriptions];
                        updatedPrescriptions.splice(index, 1);
                        setValue('prescriptions', updatedPrescriptions);
                        
                        addNotification({
                          message: 'Removed medication',
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
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register(`prescriptions.${index}.medication` as const, {
                          required: 'Medication name is required'
                        })}
                        className="form-input pl-9"
                        placeholder="Search medication..."
                        onChange={(e) => handleMedicationSearch(index, e.target.value)}
                        autoComplete="off"
                      />
                      {showMedicationDropdown && selectedMedicationIndex === index && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {medicationSuggestions.length > 0 ? (
                            <>
                              {medicationSuggestions.map((medication, i) => (
                                <div
                                  key={i}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => selectMedication(medication)}
                                >
                                  {medication}
                                </div>
                              ))}
                              <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                                <button
                                  type="button"
                                  className="text-primary-600 hover:text-primary-800 font-medium"
                                  onClick={handleAddCustomMedication}
                                >
                                  + Add "{medicationSearchTerm}" as custom medication
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No medications found. 
                              <button
                                type="button"
                                className="ml-1 text-primary-600 hover:text-primary-800 font-medium"
                                onClick={handleAddCustomMedication}
                              >
                                Add as custom
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                    <div className="relative">
                      <select
                        {...register(`prescriptions.${index}.frequency` as const, {
                          required: 'Frequency is required'
                        })}
                        className="form-input appearance-none"
                      >
                        <option value="">Select frequency</option>
                        {frequencyOptions.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Duration</label>
                    <div className="relative">
                      <select
                        {...register(`prescriptions.${index}.duration` as const, {
                          required: 'Duration is required'
                        })}
                        className="form-input appearance-none"
                      >
                        <option value="">Select duration</option>
                        {durationOptions.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
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

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center mb-4">
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
                <div className="bg-gray-50 p-4 rounded-lg space-y-4 mt-2">
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
                    <label className="form-label">Reason for Certificate</label>
                    <input
                      type="text"
                      {...register('medicalCertificateDetails.reason')}
                      className="form-input"
                      placeholder="e.g., Medical leave, School absence"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Recommendations</label>
                    <textarea
                      {...register('medicalCertificateDetails.recommendations')}
                      className="form-input"
                      rows={2}
                      placeholder="e.g., Rest, limited physical activity"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMedicalCertificatePreview(true)}
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

      {/* Medical Certificate Preview */}
      {showMedicalCertificatePreview && renderMedicalCertificatePreview()}
    </div>
  );
};

export default ConsultationForm;