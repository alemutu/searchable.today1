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
  Activity, 
  FlaskRound as Flask, 
  Microscope, 
  ArrowUpRight, 
  Printer, 
  DollarSign,
  FileCheck
} from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  medicalCertificate: boolean;
  certificateType: string;
  certificateDays: number;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
    inStock: boolean;
    price: number;
  }[];
  labTests: {
    name: string;
    instructions: string;
    price: number;
    selected: boolean;
  }[];
  radiologyTests: {
    name: string;
    instructions: string;
    price: number;
    selected: boolean;
  }[];
  referral: {
    departmentId: string;
    reason: string;
    notes: string;
    urgency: string;
  };
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

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'diagnostics' | 'medications' | 'summary'>('details');
  const [showLabTests, setShowLabTests] = useState(false);
  const [showRadiologyTests, setShowRadiologyTests] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [totalBilling, setTotalBilling] = useState(0);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicalCertificate: false,
      certificateType: 'sick_leave',
      certificateDays: 1,
      prescriptions: [],
      labTests: [],
      radiologyTests: [],
      referral: {
        departmentId: '',
        reason: '',
        notes: '',
        urgency: 'routine'
      }
    }
  });

  const medicalCertificate = watch('medicalCertificate');
  const certificateType = watch('certificateType');
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
    // Calculate total billing
    let total = 0;
    
    // Add lab tests
    labTests?.forEach(test => {
      if (test.selected) {
        total += test.price;
      }
    });
    
    // Add radiology tests
    radiologyTests?.forEach(test => {
      if (test.selected) {
        total += test.price;
      }
    });
    
    // Add medications
    prescriptions?.forEach(prescription => {
      total += prescription.price * prescription.quantity;
    });
    
    setTotalBilling(total);
  }, [labTests, radiologyTests, prescriptions]);

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
        
        // Set up mock lab tests
        setValue('labTests', [
          { name: 'Complete Blood Count (CBC)', instructions: '', price: 25.00, selected: false },
          { name: 'Basic Metabolic Panel', instructions: '', price: 30.00, selected: false },
          { name: 'Lipid Panel', instructions: '', price: 35.00, selected: false },
          { name: 'Liver Function Tests', instructions: '', price: 40.00, selected: false },
          { name: 'Thyroid Function Tests', instructions: '', price: 45.00, selected: false },
          { name: 'Urinalysis', instructions: '', price: 20.00, selected: false },
          { name: 'HbA1c', instructions: '', price: 35.00, selected: false },
          { name: 'COVID-19 PCR Test', instructions: '', price: 75.00, selected: false }
        ]);
        
        // Set up mock radiology tests
        setValue('radiologyTests', [
          { name: 'Chest X-Ray', instructions: '', price: 80.00, selected: false },
          { name: 'Abdominal X-Ray', instructions: '', price: 85.00, selected: false },
          { name: 'CT Scan - Head', instructions: '', price: 250.00, selected: false },
          { name: 'CT Scan - Chest', instructions: '', price: 275.00, selected: false },
          { name: 'MRI - Brain', instructions: '', price: 400.00, selected: false },
          { name: 'MRI - Spine', instructions: '', price: 425.00, selected: false },
          { name: 'Ultrasound - Abdominal', instructions: '', price: 150.00, selected: false },
          { name: 'Ultrasound - Pelvic', instructions: '', price: 160.00, selected: false }
        ]);
        
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
      
      // Fetch lab tests from database or set defaults
      const { data: labData, error: labError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('hospital_id', hospital?.id);
        
      if (labError) throw labError;
      
      if (labData && labData.length > 0) {
        setValue('labTests', labData.map((test: any) => ({
          name: test.name,
          instructions: '',
          price: test.price || 0,
          selected: false
        })));
      } else {
        // Set default lab tests
        setValue('labTests', [
          { name: 'Complete Blood Count (CBC)', instructions: '', price: 25.00, selected: false },
          { name: 'Basic Metabolic Panel', instructions: '', price: 30.00, selected: false },
          { name: 'Lipid Panel', instructions: '', price: 35.00, selected: false },
          { name: 'Liver Function Tests', instructions: '', price: 40.00, selected: false }
        ]);
      }
      
      // Fetch radiology tests from database or set defaults
      const { data: radioData, error: radioError } = await supabase
        .from('radiology_tests')
        .select('*')
        .eq('hospital_id', hospital?.id);
        
      if (radioError) throw radioError;
      
      if (radioData && radioData.length > 0) {
        setValue('radiologyTests', radioData.map((test: any) => ({
          name: test.name,
          instructions: '',
          price: test.price || 0,
          selected: false
        })));
      } else {
        // Set default radiology tests
        setValue('radiologyTests', [
          { name: 'Chest X-Ray', instructions: '', price: 80.00, selected: false },
          { name: 'Abdominal X-Ray', instructions: '', price: 85.00, selected: false },
          { name: 'CT Scan - Head', instructions: '', price: 250.00, selected: false },
          { name: 'Ultrasound - Abdominal', instructions: '', price: 150.00, selected: false }
        ]);
      }
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
          { id: '5', name: 'Gynecology' },
          { id: '6', name: 'Neurology' },
          { id: '7', name: 'Dermatology' },
          { id: '8', name: 'Ophthalmology' }
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
    const currentPrescriptions = watch('prescriptions') || [];
    setValue('prescriptions', [
      ...currentPrescriptions,
      {
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: 1,
        inStock: true,
        price: 0
      }
    ]);
  };

  const removePrescription = (index: number) => {
    const currentPrescriptions = watch('prescriptions') || [];
    setValue('prescriptions', currentPrescriptions.filter((_, i) => i !== index));
  };

  const toggleLabTest = (index: number) => {
    const currentTests = [...watch('labTests')];
    currentTests[index].selected = !currentTests[index].selected;
    setValue('labTests', currentTests);
  };

  const toggleRadiologyTest = (index: number) => {
    const currentTests = [...watch('radiologyTests')];
    currentTests[index].selected = !currentTests[index].selected;
    setValue('radiologyTests', currentTests);
  };

  const onSubmit = async (data: ConsultationFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Consultation form submitted:', data);
        
        // Calculate selected lab tests
        const selectedLabTests = data.labTests.filter(test => test.selected);
        
        // Calculate selected radiology tests
        const selectedRadiologyTests = data.radiologyTests.filter(test => test.selected);
        
        // Show success notification
        addNotification({
          message: `Consultation for ${patient.first_name} ${patient.last_name} saved successfully`,
          type: 'success'
        });
        
        // If there are lab tests, show notification
        if (selectedLabTests.length > 0) {
          addNotification({
            message: `${selectedLabTests.length} lab tests ordered`,
            type: 'info'
          });
        }
        
        // If there are radiology tests, show notification
        if (selectedRadiologyTests.length > 0) {
          addNotification({
            message: `${selectedRadiologyTests.length} radiology tests ordered`,
            type: 'info'
          });
        }
        
        // If there's a referral, show notification
        if (data.referral.departmentId) {
          const department = departments.find(d => d.id === data.referral.departmentId);
          addNotification({
            message: `Patient referred to ${department?.name}`,
            type: 'info'
          });
        }
        
        // If there are prescriptions, show notification
        if (data.prescriptions.length > 0) {
          addNotification({
            message: `${data.prescriptions.length} medications prescribed`,
            type: 'info'
          });
        }
        
        // Update patient flow step
        await new Promise(resolve => setTimeout(resolve, 1000));
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
          prescriptions: data.prescriptions,
          department_id: user.department_id || null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Process lab tests if any are selected
      const selectedLabTests = data.labTests.filter(test => test.selected);
      if (selectedLabTests.length > 0) {
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(selectedLabTests.map(test => ({
            patient_id: patient.id,
            hospital_id: hospital.id,
            test_type: test.name,
            test_date: new Date().toISOString(),
            status: 'pending',
            notes: test.instructions
          })));
          
        if (labError) throw labError;
      }
      
      // Process radiology tests if any are selected
      const selectedRadiologyTests = data.radiologyTests.filter(test => test.selected);
      if (selectedRadiologyTests.length > 0) {
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(selectedRadiologyTests.map(test => ({
            patient_id: patient.id,
            hospital_id: hospital.id,
            scan_type: test.name.toLowerCase().includes('x-ray') ? 'x_ray' : 
                       test.name.toLowerCase().includes('ct') ? 'ct_scan' :
                       test.name.toLowerCase().includes('mri') ? 'mri' :
                       test.name.toLowerCase().includes('ultrasound') ? 'ultrasound' : 'other',
            scan_date: new Date().toISOString(),
            status: 'pending',
            notes: test.instructions
          })));
          
        if (radiologyError) throw radiologyError;
      }
      
      // Process referral if department is selected
      if (data.referral.departmentId) {
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
      
      // Process billing
      if (totalBilling > 0) {
        // Prepare services array for billing
        const services = [];
        
        // Add lab tests to services
        selectedLabTests.forEach(test => {
          services.push({
            name: `Lab Test: ${test.name}`,
            amount: test.price,
            quantity: 1
          });
        });
        
        // Add radiology tests to services
        selectedRadiologyTests.forEach(test => {
          services.push({
            name: `Radiology: ${test.name}`,
            amount: test.price,
            quantity: 1
          });
        });
        
        // Add medications to services
        data.prescriptions.forEach(prescription => {
          if (prescription.medication) {
            services.push({
              name: `Medication: ${prescription.medication} ${prescription.dosage}`,
              amount: prescription.price,
              quantity: prescription.quantity
            });
          }
        });
        
        // Add consultation fee
        services.push({
          name: 'Consultation Fee',
          amount: 50.00, // Default consultation fee
          quantity: 1
        });
        
        // Create billing record
        const { error: billingError } = await supabase
          .from('billing')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            consultation_id: consultationData.id,
            services: services,
            total_amount: totalBilling + 50.00, // Add consultation fee
            paid_amount: 0,
            payment_status: 'pending'
          });
          
        if (billingError) throw billingError;
      }
      
      // Update patient's current flow step
      let nextStep = 'post_consultation';
      
      if (selectedLabTests.length > 0) {
        nextStep = 'lab_tests';
      } else if (selectedRadiologyTests.length > 0) {
        nextStep = 'radiology';
      } else if (data.prescriptions.length > 0) {
        nextStep = 'pharmacy';
      }
      
      const { error: patientError } = await supabase
        .from('patients')
        .update({ current_flow_step: nextStep })
        .eq('id', patient.id);
        
      if (patientError) throw patientError;
      
      // If there are prescriptions, create pharmacy order
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
              quantity: p.quantity,
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending'
          });
          
        if (pharmacyError) throw pharmacyError;
      }
      
      addNotification({
        message: `Consultation for ${patient.first_name} ${patient.last_name} saved successfully`,
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

  const handlePrintCertificate = () => {
    const certificateWindow = window.open('', '_blank');
    if (!certificateWindow) return;
    
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #00afaf;
            padding-bottom: 10px;
          }
          .hospital-name {
            font-size: 24px;
            font-weight: bold;
            color: #00afaf;
          }
          .hospital-address {
            font-size: 14px;
            color: #666;
          }
          .certificate-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
          }
          .content {
            margin: 20px 0;
            line-height: 1.6;
          }
          .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature {
            border-top: 1px solid #000;
            width: 200px;
            text-align: center;
            padding-top: 5px;
          }
          .date {
            text-align: right;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">${hospital?.name || 'Hospital Management System'}</div>
          <div class="hospital-address">${hospital?.address || '123 Healthcare St, Medical City'}</div>
          <div class="hospital-contact">Tel: ${hospital?.phone || '(555) 123-4567'}</div>
        </div>
        
        <div class="certificate-title">
          ${certificateType === 'sick_leave' ? 'Medical Certificate for Sick Leave' : 
            certificateType === 'fitness' ? 'Certificate of Medical Fitness' :
            certificateType === 'referral' ? 'Medical Referral Letter' : 'Medical Certificate'}
        </div>
        
        <div class="content">
          <p>This is to certify that <strong>${patient?.first_name} ${patient?.last_name}</strong>, 
          ${patient?.gender === 'Male' ? 'male' : 'female'}, ${calculateAge(patient?.date_of_birth || '')} years old,
          has been examined by me on ${new Date().toLocaleDateString()}.</p>
          
          ${certificateType === 'sick_leave' ? 
            `<p>The patient has been diagnosed with ${watch('diagnosis')} and is advised to rest and 
            refrain from work/school for a period of ${watch('certificateDays')} day(s) 
            from ${new Date().toLocaleDateString()} to ${new Date(new Date().setDate(new Date().getDate() + watch('certificateDays'))).toLocaleDateString()}.</p>` : 
            
            certificateType === 'fitness' ? 
            `<p>After thorough examination, I find the patient to be in good health and physically fit. 
            The patient does not suffer from any communicable disease or any physical/mental disability that would 
            interfere with their ability to perform normal duties.</p>` :
            
            certificateType === 'referral' ? 
            `<p>I am referring this patient for specialist consultation regarding ${watch('diagnosis')}. 
            The patient presents with the following symptoms: ${watch('chiefComplaint')}.</p>
            <p>Treatment given so far: ${watch('treatmentPlan')}</p>` :
            
            `<p>The patient has been diagnosed with ${watch('diagnosis')} and has been advised appropriate treatment.</p>`
          }
          
          <p>Additional notes: ${watch('notes') || 'None'}</p>
        </div>
        
        <div class="footer">
          <div class="signature">
            <p>Dr. ${user?.first_name || ''} ${user?.last_name || ''}</p>
            <p>Medical License #: ____________</p>
          </div>
        </div>
        
        <div class="date">
          Date: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;
    
    certificateWindow.document.write(certificateHTML);
    certificateWindow.document.close();
    setTimeout(() => {
      certificateWindow.print();
    }, 500);
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-3">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-center text-xs font-medium ${
                activeTab === 'details'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('details')}
            >
              <FileText className="h-3 w-3 inline mr-1" />
              Consultation Details
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
              <Activity className="h-3 w-3 inline mr-1" />
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
              <Pill className="h-3 w-3 inline mr-1" />
              Medications
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
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Summary
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Left Column - Vitals and Medical History */}
          <div className="w-full md:w-1/3 space-y-3">
            {/* Vital Signs */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                <Activity className="h-4 w-4 text-primary-500 mr-1" />
                Vital Signs
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Blood Pressure:</span>
                  <span className="font-medium">120/80 mmHg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Heart Rate:</span>
                  <span className="font-medium">72 bpm</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-medium">36.8 °C</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Respiratory Rate:</span>
                  <span className="font-medium">16 breaths/min</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Oxygen Saturation:</span>
                  <span className="font-medium">98%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">70 kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Height:</span>
                  <span className="font-medium">175 cm</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">BMI:</span>
                  <span className="font-medium">22.9</span>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 text-primary-500 mr-1" />
                Medical History
              </h3>
              
              {/* Allergies */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 text-error-500 mr-1" />
                  Allergies
                </h4>
                {patient.medical_history?.allergies?.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {patient.medical_history.allergies.map((allergy: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-error-500 mt-1.5 mr-1.5 flex-shrink-0"></span>
                        <span>
                          <span className="font-medium">{allergy.allergen}</span>
                          {allergy.reaction && <span className="text-gray-500"> - {allergy.reaction}</span>}
                          {allergy.severity && <span className={`ml-1 text-xs ${
                            allergy.severity === 'severe' || allergy.severity === 'life_threatening' 
                              ? 'text-error-600 font-medium' 
                              : 'text-warning-600'
                          }`}>({allergy.severity})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No known allergies</p>
                )}
              </div>
              
              {/* Chronic Conditions */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Chronic Conditions</h4>
                {patient.medical_history?.chronicConditions?.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {patient.medical_history.chronicConditions.map((condition: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning-500 mt-1.5 mr-1.5 flex-shrink-0"></span>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No chronic conditions</p>
                )}
              </div>
              
              {/* Current Medications */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Pill className="h-3 w-3 text-primary-500 mr-1" />
                  Current Medications
                </h4>
                {patient.medical_history?.currentMedications?.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {patient.medical_history.currentMedications.map((medication: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-1.5 mr-1.5 flex-shrink-0"></span>
                        <span>
                          <span className="font-medium">{medication.name}</span>
                          {medication.dosage && <span className="text-gray-500"> - {medication.dosage}</span>}
                          {medication.frequency && <span className="text-gray-500"> ({medication.frequency})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No current medications</p>
                )}
              </div>
            </div>

            {/* Refer Patient Button */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <button
                type="button"
                onClick={() => setShowReferralForm(true)}
                className="btn btn-outline w-full flex items-center justify-center"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Refer Patient
              </button>
            </div>
          </div>

          {/* Right Column - Main Form Content */}
          <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {/* Consultation Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="form-label required">Chief Complaint</label>
                  <textarea
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    className={`form-input ${errors.chiefComplaint ? 'border-error-300' : ''}`}
                    rows={2}
                    placeholder="Describe the patient's main complaint"
                  />
                  {errors.chiefComplaint && (
                    <p className="form-error">{errors.chiefComplaint.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Diagnosis</label>
                  <textarea
                    {...register('diagnosis', { required: 'Diagnosis is required' })}
                    className={`form-input ${errors.diagnosis ? 'border-error-300' : ''}`}
                    rows={2}
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
                    className={`form-input ${errors.treatmentPlan ? 'border-error-300' : ''}`}
                    rows={3}
                    placeholder="Describe the treatment plan"
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
                    <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                      Issue Medical Certificate
                    </label>
                  </div>
                  
                  {medicalCertificate && (
                    <div className="bg-gray-50 p-3 rounded-md space-y-3">
                      <div>
                        <label className="form-label">Certificate Type</label>
                        <select
                          {...register('certificateType')}
                          className="form-input"
                        >
                          <option value="sick_leave">Sick Leave Certificate</option>
                          <option value="fitness">Medical Fitness Certificate</option>
                          <option value="referral">Referral Letter</option>
                          <option value="general">General Medical Certificate</option>
                        </select>
                      </div>
                      
                      {certificateType === 'sick_leave' && (
                        <div>
                          <label className="form-label">Number of Days</label>
                          <input
                            type="number"
                            {...register('certificateDays')}
                            min={1}
                            className="form-input"
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handlePrintCertificate}
                          className="btn btn-outline flex items-center"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Preview & Print
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Diagnostic Tests Tab */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-4">
                {/* Lab & Radiology Buttons */}
                <div className="flex space-x-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLabTests(true);
                      setShowRadiologyTests(false);
                    }}
                    className={`flex-1 btn ${showLabTests ? 'btn-primary' : 'btn-outline'} flex items-center justify-center`}
                  >
                    <Flask className="h-4 w-4 mr-2" />
                    Lab Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRadiologyTests(true);
                      setShowLabTests(false);
                    }}
                    className={`flex-1 btn ${showRadiologyTests ? 'btn-primary' : 'btn-outline'} flex items-center justify-center`}
                  >
                    <Microscope className="h-4 w-4 mr-2" />
                    Radiology Tests
                  </button>
                </div>
                
                {/* Lab Tests */}
                {showLabTests && (
                  <div className="space-y-3">
                    <h3 className="text-md font-medium text-gray-900 flex items-center">
                      <Flask className="h-4 w-4 text-primary-500 mr-2" />
                      Laboratory Tests
                    </h3>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {watch('labTests').map((test, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-3 flex items-center justify-between ${
                            test.selected ? 'bg-primary-50 border-primary-200' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`lab-${index}`}
                              checked={test.selected}
                              onChange={() => toggleLabTest(index)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`lab-${index}`} className="ml-2 block text-sm">
                              <span className="font-medium">{test.name}</span>
                              <span className="ml-2 text-primary-600">{test.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {watch('labTests').filter(t => t.selected).length > 0 && (
                      <div className="mt-3">
                        <label className="form-label">Special Instructions</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Any special instructions for the lab tests"
                          onChange={(e) => {
                            const currentTests = [...watch('labTests')];
                            currentTests.forEach((test, i) => {
                              if (test.selected) {
                                currentTests[i].instructions = e.target.value;
                              }
                            });
                            setValue('labTests', currentTests);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Radiology Tests */}
                {showRadiologyTests && (
                  <div className="space-y-3">
                    <h3 className="text-md font-medium text-gray-900 flex items-center">
                      <Microscope className="h-4 w-4 text-primary-500 mr-2" />
                      Radiology Tests
                    </h3>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {watch('radiologyTests').map((test, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-3 flex items-center justify-between ${
                            test.selected ? 'bg-primary-50 border-primary-200' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`radiology-${index}`}
                              checked={test.selected}
                              onChange={() => toggleRadiologyTest(index)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`radiology-${index}`} className="ml-2 block text-sm">
                              <span className="font-medium">{test.name}</span>
                              <span className="ml-2 text-primary-600">{test.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {watch('radiologyTests').filter(t => t.selected).length > 0 && (
                      <div className="mt-3">
                        <label className="form-label">Special Instructions</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Any special instructions for the radiology tests"
                          onChange={(e) => {
                            const currentTests = [...watch('radiologyTests')];
                            currentTests.forEach((test, i) => {
                              if (test.selected) {
                                currentTests[i].instructions = e.target.value;
                              }
                            });
                            setValue('radiologyTests', currentTests);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Medications Tab */}
            {activeTab === 'medications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium text-gray-900 flex items-center">
                    <Pill className="h-4 w-4 text-primary-500 mr-2" />
                    Prescriptions
                  </h3>
                  <button
                    type="button"
                    onClick={addPrescription}
                    className="btn btn-sm btn-outline flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </button>
                </div>
                
                {prescriptions.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Pill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No medications prescribed yet</p>
                    <button
                      type="button"
                      onClick={addPrescription}
                      className="mt-2 btn btn-sm btn-outline flex items-center mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Medication
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((_, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium text-gray-900">Medication #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removePrescription(index)}
                            className="text-error-600 hover:text-error-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="form-label required">Medication</label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.medication` as const, { required: true })}
                              className="form-input"
                              placeholder="Medication name"
                            />
                          </div>
                          
                          <div>
                            <label className="form-label required">Dosage</label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.dosage` as const, { required: true })}
                              className="form-input"
                              placeholder="e.g., 500mg"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="form-label required">Frequency</label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.frequency` as const, { required: true })}
                              className="form-input"
                              placeholder="e.g., Twice daily"
                            />
                          </div>
                          
                          <div>
                            <label className="form-label required">Duration</label>
                            <input
                              type="text"
                              {...register(`prescriptions.${index}.duration` as const, { required: true })}
                              className="form-input"
                              placeholder="e.g., 7 days"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="form-label">Quantity</label>
                            <input
                              type="number"
                              {...register(`prescriptions.${index}.quantity` as const, { 
                                required: true,
                                min: 1,
                                valueAsNumber: true
                              })}
                              className="form-input"
                              placeholder="Quantity"
                              min={1}
                            />
                          </div>
                          
                          <div>
                            <label className="form-label">Price per Unit</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`prescriptions.${index}.price` as const, { 
                                required: true,
                                min: 0,
                                valueAsNumber: true
                              })}
                              className="form-input"
                              placeholder="Price"
                              min={0}
                            />
                          </div>
                          
                          <div>
                            <label className="form-label">Availability</label>
                            <div className="flex items-center h-10 mt-1">
                              <Controller
                                name={`prescriptions.${index}.inStock` as const}
                                control={control}
                                render={({ field }) => (
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`inStock-${index}`}
                                      checked={field.value}
                                      onChange={(e) => field.onChange(e.target.checked)}
                                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`inStock-${index}`} className="ml-2 block text-sm text-gray-900">
                                      In Stock
                                    </label>
                                  </div>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label">Special Instructions</label>
                          <textarea
                            {...register(`prescriptions.${index}.instructions` as const)}
                            className="form-input"
                            rows={2}
                            placeholder="Any special instructions for this medication"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <CheckCircle className="h-4 w-4 text-primary-500 mr-2" />
                  Consultation Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 text-gray-900">{patient.first_name} {patient.last_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Age/Gender:</span>
                        <span className="ml-2 text-gray-900">{calculateAge(patient.date_of_birth)} years, {patient.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <span className="ml-2 text-gray-900">{patient.contact_number}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 text-gray-900">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Consultation Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Chief Complaint:</span>
                        <p className="mt-1 text-gray-900">{watch('chiefComplaint') || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Diagnosis:</span>
                        <p className="mt-1 text-gray-900">{watch('diagnosis') || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Treatment Plan:</span>
                        <p className="mt-1 text-gray-900">{watch('treatmentPlan') || 'Not specified'}</p>
                      </div>
                      {watch('notes') && (
                        <div>
                          <span className="text-gray-500">Additional Notes:</span>
                          <p className="mt-1 text-gray-900">{watch('notes')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Lab Tests Summary */}
                  {watch('labTests').filter(t => t.selected).length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Flask className="h-4 w-4 text-primary-500 mr-1" />
                        Laboratory Tests
                      </h4>
                      <ul className="space-y-1">
                        {watch('labTests').filter(t => t.selected).map((test, index) => (
                          <li key={index} className="flex justify-between text-sm">
                            <span>{test.name}</span>
                            <span className="text-primary-600 font-medium">
                              {test.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Radiology Tests Summary */}
                  {watch('radiologyTests').filter(t => t.selected).length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Microscope className="h-4 w-4 text-primary-500 mr-1" />
                        Radiology Tests
                      </h4>
                      <ul className="space-y-1">
                        {watch('radiologyTests').filter(t => t.selected).map((test, index) => (
                          <li key={index} className="flex justify-between text-sm">
                            <span>{test.name}</span>
                            <span className="text-primary-600 font-medium">
                              {test.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Medications Summary */}
                  {prescriptions.length > 0 && prescriptions.some(p => p.medication) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Pill className="h-4 w-4 text-primary-500 mr-1" />
                        Prescribed Medications
                      </h4>
                      <ul className="space-y-2">
                        {prescriptions.filter(p => p.medication).map((prescription, index) => (
                          <li key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{prescription.medication} {prescription.dosage}</span>
                              <span className="text-primary-600 font-medium">
                                {(prescription.price * prescription.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                              </span>
                            </div>
                            <div className="text-gray-500">
                              {prescription.frequency}, for {prescription.duration}
                              {prescription.quantity > 1 && ` (${prescription.quantity} units)`}
                            </div>
                            {prescription.instructions && (
                              <div className="text-gray-500 mt-1">
                                Instructions: {prescription.instructions}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Referral Summary */}
                  {watch('referral.departmentId') && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <ArrowUpRight className="h-4 w-4 text-primary-500 mr-1" />
                        Referral
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <span className="ml-2 text-gray-900">
                            {departments.find(d => d.id === watch('referral.departmentId'))?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reason:</span>
                          <p className="mt-1 text-gray-900">{watch('referral.reason')}</p>
                        </div>
                        {watch('referral.notes') && (
                          <div>
                            <span className="text-gray-500">Notes:</span>
                            <p className="mt-1 text-gray-900">{watch('referral.notes')}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Urgency:</span>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            watch('referral.urgency') === 'emergency' ? 'bg-error-100 text-error-800' :
                            watch('referral.urgency') === 'urgent' ? 'bg-warning-100 text-warning-800' :
                            'bg-success-100 text-success-800'
                          }`}>
                            {watch('referral.urgency').charAt(0).toUpperCase() + watch('referral.urgency').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Medical Certificate Summary */}
                  {medicalCertificate && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FileCheck className="h-4 w-4 text-primary-500 mr-1" />
                        Medical Certificate
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 text-gray-900">
                            {certificateType === 'sick_leave' ? 'Sick Leave Certificate' :
                             certificateType === 'fitness' ? 'Medical Fitness Certificate' :
                             certificateType === 'referral' ? 'Referral Letter' : 'General Medical Certificate'}
                          </span>
                        </div>
                        {certificateType === 'sick_leave' && (
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 text-gray-900">{watch('certificateDays')} day(s)</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={handlePrintCertificate}
                            className="btn btn-sm btn-outline flex items-center"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Preview & Print
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Billing Summary */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 text-primary-500 mr-1" />
                      Billing Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Consultation Fee:</span>
                        <span className="font-medium">$50.00</span>
                      </div>
                      
                      {watch('labTests').filter(t => t.selected).length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Laboratory Tests:</span>
                          <span className="font-medium">
                            {watch('labTests')
                              .filter(t => t.selected)
                              .reduce((sum, test) => sum + test.price, 0)
                              .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </span>
                        </div>
                      )}
                      
                      {watch('radiologyTests').filter(t => t.selected).length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Radiology Tests:</span>
                          <span className="font-medium">
                            {watch('radiologyTests')
                              .filter(t => t.selected)
                              .reduce((sum, test) => sum + test.price, 0)
                              .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </span>
                        </div>
                      )}
                      
                      {prescriptions.length > 0 && prescriptions.some(p => p.medication) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Medications:</span>
                          <span className="font-medium">
                            {prescriptions
                              .filter(p => p.medication)
                              .reduce((sum, p) => sum + (p.price * p.quantity), 0)
                              .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-medium">
                        <span>Total:</span>
                        <span className="text-primary-600">
                          {(totalBilling + 50).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Referral Form Modal */}
            {showReferralForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <ArrowUpRight className="h-5 w-5 text-primary-500 mr-2" />
                    Refer Patient
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="form-label required">Department</label>
                      <select
                        {...register('referral.departmentId', { required: true })}
                        className="form-input"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label required">Reason for Referral</label>
                      <textarea
                        {...register('referral.reason', { required: true })}
                        className="form-input"
                        rows={3}
                        placeholder="Explain why you are referring this patient"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Additional Notes</label>
                      <textarea
                        {...register('referral.notes')}
                        className="form-input"
                        rows={2}
                        placeholder="Any additional information for the specialist"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Urgency</label>
                      <select
                        {...register('referral.urgency')}
                        className="form-input"
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowReferralForm(false)}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReferralForm(false)}
                        className="btn btn-primary"
                      >
                        Confirm Referral
                      </button>
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