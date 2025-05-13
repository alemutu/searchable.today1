import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { User, Activity, FileText, Pill, Save, ArrowLeft, Plus, Trash2, Calendar, Clock, CheckCircle, AlertTriangle, Heart, Thermometer, Settings as Lungs, Droplets, Stethoscope, FileBarChart2, Syringe, AlarmClock, Microscope, FileImage, Clipboard, ClipboardList, Layers } from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  history: string;
  examination: string;
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
  orders: {
    type: string;
    details: string;
    urgency: string;
  }[];
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
  medical_info: any;
  hospital_id: string;
  status: string;
  current_flow_step: string | null;
}

interface VitalSigns {
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  pain_level: number | null;
  recorded_at: string;
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ConsultationFormData>({
    chiefComplaint: '',
    history: '',
    examination: '',
    diagnosis: '',
    treatmentPlan: '',
    notes: '',
    medicalCertificate: false,
    prescriptions: [],
    orders: []
  });
  const [activeTab, setActiveTab] = useState<'consultation' | 'orders' | 'prescriptions'>('consultation');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (patientId && hospital?.id) {
      fetchPatient();
      fetchVitalSigns();
    }
  }, [patientId, hospital?.id]);

  const fetchPatient = async () => {
    try {
      if (!patientId || !hospital?.id) {
        throw new Error('Missing patient ID or hospital ID');
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('hospital_id', hospital.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        addNotification({
          message: 'Patient not found',
          type: 'error'
        });
        navigate('/patients');
        return;
      }

      setPatient(data);
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      addNotification({
        message: `Error fetching patient: ${error.message}`,
        type: 'error'
      });
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVitalSigns = async () => {
    try {
      if (!patientId || !hospital?.id) return;

      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .eq('hospital_id', hospital.id)
        .order('recorded_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error: any) {
      console.error('Error fetching vital signs:', error);
      addNotification({
        message: `Error fetching vital signs: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleChange = (field: keyof ConsultationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    const updatedPrescriptions = [...formData.prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value
    };
    handleChange('prescriptions', updatedPrescriptions);
  };

  const handleOrderChange = (index: number, field: string, value: string) => {
    const updatedOrders = [...formData.orders];
    updatedOrders[index] = {
      ...updatedOrders[index],
      [field]: value
    };
    handleChange('orders', updatedOrders);
  };

  const addPrescription = () => {
    handleChange('prescriptions', [
      ...formData.prescriptions,
      {
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const removePrescription = (index: number) => {
    const updatedPrescriptions = formData.prescriptions.filter((_, i) => i !== index);
    handleChange('prescriptions', updatedPrescriptions);
  };

  const addOrder = () => {
    handleChange('orders', [
      ...formData.orders,
      {
        type: 'lab',
        details: '',
        urgency: 'routine'
      }
    ]);
  };

  const removeOrder = (index: number) => {
    const updatedOrders = formData.orders.filter((_, i) => i !== index);
    handleChange('orders', updatedOrders);
  };

  const handleSubmit = async () => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!formData.chiefComplaint || !formData.diagnosis || !formData.treatmentPlan) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        return;
      }
      
      // Create consultation record
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patient.id,
          doctor_id: user.id,
          hospital_id: hospital.id,
          department_id: user.department_id || null,
          consultation_date: new Date().toISOString(),
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          notes: formData.notes,
          medical_certificate: formData.medicalCertificate,
          prescriptions: formData.prescriptions.length > 0 ? formData.prescriptions : null
        })
        .select()
        .single();

      if (consultationError) throw consultationError;
      
      // Create pharmacy order if prescriptions exist
      if (formData.prescriptions.length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacy')
          .insert({
            patient_id: patient.id,
            hospital_id: hospital.id,
            prescription_id: consultation.id,
            medications: formData.prescriptions.map(p => ({
              medication: p.medication,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
              quantity: calculateQuantity(p.duration, p.frequency),
              dispensed: false
            })),
            status: 'pending',
            payment_status: 'pending',
            is_emergency: formData.orders.some(o => o.urgency === 'emergency')
          });

        if (pharmacyError) throw pharmacyError;
      }
      
      // Create lab orders if they exist
      const labOrders = formData.orders.filter(o => o.type === 'lab');
      if (labOrders.length > 0) {
        const labInserts = labOrders.map(order => ({
          patient_id: patient.id,
          hospital_id: hospital.id,
          test_type: order.details.toLowerCase().replace(/\s+/g, '_'),
          test_date: new Date().toISOString(),
          status: 'pending',
          is_emergency: order.urgency === 'emergency'
        }));
        
        const { error: labError } = await supabase
          .from('lab_results')
          .insert(labInserts);

        if (labError) throw labError;
      }
      
      // Create radiology orders if they exist
      const radiologyOrders = formData.orders.filter(o => o.type === 'radiology');
      if (radiologyOrders.length > 0) {
        const radiologyInserts = radiologyOrders.map(order => ({
          patient_id: patient.id,
          hospital_id: hospital.id,
          scan_type: order.details.toLowerCase().replace(/\s+/g, '_'),
          scan_date: new Date().toISOString(),
          status: 'pending',
          is_emergency: order.urgency === 'emergency'
        }));
        
        const { error: radiologyError } = await supabase
          .from('radiology_results')
          .insert(radiologyInserts);

        if (radiologyError) throw radiologyError;
      }
      
      // Update patient's current flow step
      let nextStep = 'post_consultation';
      
      // If there are lab tests, set next step to lab_tests
      if (labOrders.length > 0) {
        nextStep = 'lab_tests';
      }
      // If there are radiology scans, set next step to radiology
      else if (radiologyOrders.length > 0) {
        nextStep = 'radiology';
      }
      // If there are prescriptions, set next step to pharmacy
      else if (formData.prescriptions.length > 0) {
        nextStep = 'pharmacy';
      }
      
      const { error: patientError } = await supabase
        .from('patients')
        .update({ current_flow_step: nextStep })
        .eq('id', patient.id)
        .eq('hospital_id', hospital.id);

      if (patientError) throw patientError;
      
      // Show success notification
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      // Navigate back to patients list
      navigate('/patients');
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateQuantity = (duration: string, frequency: string) => {
    // Extract the number of days from the duration
    const durationMatch = duration.match(/(\d+)/);
    const days = durationMatch ? parseInt(durationMatch[1]) : 0;
    
    // Extract the number of times per day from the frequency
    const frequencyMatch = frequency.match(/(\d+)/);
    const timesPerDay = frequencyMatch ? parseInt(frequencyMatch[1]) : 0;
    
    // Calculate the total quantity
    return days * timesPerDay;
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
    <div className="max-w-7xl mx-auto">
      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex items-center text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Complete Consultation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Column - Vitals and Medical History */}
        <div className="md:w-1/3 space-y-4">
          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-md font-medium text-gray-900 flex items-center">
                <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
                Vital Signs
              </h2>
              <span className="text-xs text-gray-500">
                {vitalSigns.length > 0 
                  ? new Date(vitalSigns[0].recorded_at).toLocaleDateString() 
                  : 'No data'}
              </span>
            </div>
            
            {vitalSigns.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-xs text-gray-700">Temperature</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns[0].temperature ? `${vitalSigns[0].temperature}°C` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-xs text-gray-700">Heart Rate</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns[0].heart_rate ? `${vitalSigns[0].heart_rate} bpm` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Lungs className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-xs text-gray-700">Respiratory Rate</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns[0].respiratory_rate ? `${vitalSigns[0].respiratory_rate} bpm` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-xs text-gray-700">Blood Pressure</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns[0].blood_pressure_systolic && vitalSigns[0].blood_pressure_diastolic 
                      ? `${vitalSigns[0].blood_pressure_systolic}/${vitalSigns[0].blood_pressure_diastolic} mmHg` 
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-xs text-gray-700">Oxygen Saturation</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns[0].oxygen_saturation ? `${vitalSigns[0].oxygen_saturation}%` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-xs text-gray-700">Pain Level</span>
                  </div>
                  <span className="text-xs font-medium">
                    {vitalSigns[0].pain_level !== null ? `${vitalSigns[0].pain_level}/10` : 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-gray-500">No vital signs recorded</p>
                <button className="mt-2 text-xs text-primary-600 hover:text-primary-800">
                  Record Vitals
                </button>
              </div>
            )}
          </div>
          
          {/* Medical History */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-md font-medium text-gray-900 flex items-center">
                <FileBarChart2 className="h-4 w-4 text-primary-500 mr-1.5" />
                Medical History
              </h2>
            </div>
            
            {patient.medical_info ? (
              <div className="space-y-3">
                {/* Allergies */}
                {patient.medical_info.allergies && patient.medical_info.allergies.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-error-700 flex items-center mb-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Allergies
                    </h3>
                    <ul className="space-y-1">
                      {patient.medical_info.allergies.map((allergy: string, index: number) => (
                        <li key={index} className="text-xs text-gray-700 pl-4 relative">
                          <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-error-500"></span>
                          {allergy}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Chronic Conditions */}
                {patient.medical_info.chronicConditions && patient.medical_info.chronicConditions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1.5">
                      Chronic Conditions
                    </h3>
                    <ul className="space-y-1">
                      {patient.medical_info.chronicConditions.map((condition: string, index: number) => (
                        <li key={index} className="text-xs text-gray-700 pl-4 relative">
                          <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Current Medications */}
                {patient.medical_info.currentMedications && patient.medical_info.currentMedications.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1.5">
                      Current Medications
                    </h3>
                    <ul className="space-y-1">
                      {patient.medical_info.currentMedications.map((medication: any, index: number) => (
                        <li key={index} className="text-xs text-gray-700 pl-4 relative">
                          <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-success-500"></span>
                          {typeof medication === 'string' ? medication : medication.name}
                          {medication.dosage && ` - ${medication.dosage}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Family History */}
                {patient.medical_info.familyHistory && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1.5">
                      Family History
                    </h3>
                    <p className="text-xs text-gray-700">
                      {patient.medical_info.familyHistory}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-gray-500">No medical history recorded</p>
                <button className="mt-2 text-xs text-primary-600 hover:text-primary-800">
                  Add Medical History
                </button>
              </div>
            )}
          </div>
          
          {/* Recent Visits */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-md font-medium text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 text-primary-500 mr-1.5" />
                Recent Visits
              </h2>
            </div>
            
            <div className="space-y-2">
              <div className="p-2 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-900">General Check-up</p>
                    <p className="text-xs text-gray-500">Dr. Smith • 2 weeks ago</p>
                  </div>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-success-100 text-success-800">Completed</span>
                </div>
              </div>
              
              <div className="p-2 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Flu Symptoms</p>
                    <p className="text-xs text-gray-500">Dr. Johnson • 2 months ago</p>
                  </div>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-success-100 text-success-800">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Consultation Form */}
        <div className="md:w-2/3">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                  activeTab === 'consultation'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('consultation')}
              >
                <Stethoscope className="h-4 w-4 inline mr-1.5" />
                Consultation
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                <ClipboardList className="h-4 w-4 inline mr-1.5" />
                Orders
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                  activeTab === 'prescriptions'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('prescriptions')}
              >
                <Pill className="h-4 w-4 inline mr-1.5" />
                Prescriptions
              </button>
            </div>
          </div>

          {/* Consultation Tab */}
          {activeTab === 'consultation' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="space-y-4">
                <div>
                  <label className="form-label required text-sm">Chief Complaint</label>
                  <textarea
                    value={formData.chiefComplaint}
                    onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={2}
                    placeholder="Enter the patient's main complaint"
                  />
                </div>
                
                <div>
                  <label className="form-label text-sm">History of Present Illness</label>
                  <textarea
                    value={formData.history}
                    onChange={(e) => handleChange('history', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={3}
                    placeholder="Enter the history of the present illness"
                  />
                </div>
                
                <div>
                  <label className="form-label text-sm">Physical Examination</label>
                  <textarea
                    value={formData.examination}
                    onChange={(e) => handleChange('examination', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={3}
                    placeholder="Enter physical examination findings"
                  />
                </div>
                
                <div>
                  <label className="form-label required text-sm">Diagnosis</label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => handleChange('diagnosis', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={2}
                    placeholder="Enter diagnosis"
                  />
                </div>
                
                <div>
                  <label className="form-label required text-sm">Treatment Plan</label>
                  <textarea
                    value={formData.treatmentPlan}
                    onChange={(e) => handleChange('treatmentPlan', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={3}
                    placeholder="Enter treatment plan"
                  />
                </div>
                
                <div>
                  <label className="form-label text-sm">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="form-input py-2 text-sm"
                    rows={2}
                    placeholder="Enter any additional notes"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="medicalCertificate"
                    checked={formData.medical_certificate}
                    onChange={(e) => handleChange('medicalCertificate', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="medicalCertificate" className="ml-2 block text-sm text-gray-900">
                    Issue Medical Certificate
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-medium text-gray-900">Test & Procedure Orders</h2>
                <button
                  onClick={addOrder}
                  className="btn btn-sm btn-outline flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Order
                </button>
              </div>
              
              {formData.orders.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <ClipboardList className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No orders added yet</p>
                  <button
                    onClick={addOrder}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                  >
                    Add your first order
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.orders.map((order, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          {order.type === 'lab' && <Microscope className="h-5 w-5 text-primary-500 mr-2" />}
                          {order.type === 'radiology' && <FileImage className="h-5 w-5 text-secondary-500 mr-2" />}
                          {order.type === 'procedure' && <Clipboard className="h-5 w-5 text-accent-500 mr-2" />}
                          <h3 className="text-sm font-medium text-gray-900">Order #{index + 1}</h3>
                        </div>
                        <button
                          onClick={() => removeOrder(index)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="form-label text-xs">Order Type</label>
                          <select
                            value={order.type}
                            onChange={(e) => handleOrderChange(index, 'type', e.target.value)}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="lab">Laboratory Test</option>
                            <option value="radiology">Radiology/Imaging</option>
                            <option value="procedure">Procedure</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Urgency</label>
                          <select
                            value={order.urgency}
                            onChange={(e) => handleOrderChange(index, 'urgency', e.target.value)}
                            className="form-input py-1.5 text-sm"
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Details</label>
                        <textarea
                          value={order.details}
                          onChange={(e) => handleOrderChange(index, 'details', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder={
                            order.type === 'lab' 
                              ? 'e.g., Complete Blood Count, Liver Function Test' 
                              : order.type === 'radiology'
                                ? 'e.g., Chest X-Ray, CT Scan, MRI'
                                : 'e.g., Wound Dressing, Suture Removal'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-medium text-gray-900">Prescriptions</h2>
                <button
                  onClick={addPrescription}
                  className="btn btn-sm btn-outline flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Prescription
                </button>
              </div>
              
              {formData.prescriptions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Pill className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No prescriptions added yet</p>
                  <button
                    onClick={addPrescription}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                  >
                    Add your first prescription
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.prescriptions.map((prescription, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Prescription #{index + 1}</h3>
                        <button
                          onClick={() => removePrescription(index)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="form-label text-xs">Medication</label>
                          <input
                            type="text"
                            value={prescription.medication}
                            onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., Amoxicillin"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Dosage</label>
                          <input
                            type="text"
                            value={prescription.dosage}
                            onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="form-label text-xs">Frequency</label>
                          <input
                            type="text"
                            value={prescription.frequency}
                            onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., 3 times daily"
                          />
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Duration</label>
                          <input
                            type="text"
                            value={prescription.duration}
                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                            className="form-input py-1.5 text-sm"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label text-xs">Instructions</label>
                        <textarea
                          value={prescription.instructions}
                          onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                          className="form-input py-1.5 text-sm"
                          rows={2}
                          placeholder="e.g., Take with food, avoid alcohol"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Consultation</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to complete this consultation? This will:
            </p>
            <ul className="list-disc pl-5 mb-4 text-sm text-gray-600 space-y-1">
              <li>Save the consultation notes</li>
              {formData.prescriptions.length > 0 && (
                <li>Create pharmacy orders for {formData.prescriptions.length} medication(s)</li>
              )}
              {formData.orders.filter(o => o.type === 'lab').length > 0 && (
                <li>Create {formData.orders.filter(o => o.type === 'lab').length} laboratory test order(s)</li>
              )}
              {formData.orders.filter(o => o.type === 'radiology').length > 0 && (
                <li>Create {formData.orders.filter(o => o.type === 'radiology').length} radiology scan order(s)</li>
              )}
              {formData.medicalCertificate && (
                <li>Issue a medical certificate</li>
              )}
            </ul>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  handleSubmit();
                }}
                className="btn btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;