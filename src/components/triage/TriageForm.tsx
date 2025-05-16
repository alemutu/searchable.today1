import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { User, Activity, FileText, Pill, AlertTriangle, Syringe, Calculator, Clock, AlertCircle, Stethoscope, Building2, Save, ArrowLeft, Brain, Thermometer, Ruler, Droplets, Scale, Hash } from 'lucide-react';

interface TriageFormData {
  vitalSigns: {
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    oxygenSaturation: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    painLevel: number | null;
  };
  chiefComplaint: string;
  acuityLevel: number;
  notes: string;
  departmentId: string;
  isEmergency: boolean;
  medicalHistory: {
    chronicConditions: string[];
    allergies: {
      hasAllergies: boolean;
      allergyList: string;
    };
    currentMedications: string;
    familyHistory: string;
    otherConditions: string;
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
  status: string;
  current_flow_step: string | null;
}

interface Department {
  id: string;
  name: string;
}

const TriageForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'medical-history' | 'assessment'>('vitals');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<TriageFormData>({
    defaultValues: {
      vitalSigns: {
        temperature: null,
        heartRate: null,
        respiratoryRate: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        oxygenSaturation: null,
        weight: null,
        height: null,
        bmi: null,
        painLevel: null
      },
      chiefComplaint: '',
      acuityLevel: 3,
      notes: '',
      departmentId: '',
      isEmergency: false,
      medicalHistory: {
        chronicConditions: [],
        allergies: {
          hasAllergies: false,
          allergyList: ''
        },
        currentMedications: '',
        familyHistory: '',
        otherConditions: ''
      }
    }
  });

  const vitalSigns = watch('vitalSigns');
  const acuityLevel = watch('acuityLevel');
  const chronicConditions = watch('medicalHistory.chronicConditions');
  const hasAllergies = watch('medicalHistory.allergies.hasAllergies');
  
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
    // Calculate BMI if height and weight are available
    if (vitalSigns.height && vitalSigns.weight) {
      const heightInMeters = vitalSigns.height / 100;
      const bmi = vitalSigns.weight / (heightInMeters * heightInMeters);
      setValue('vitalSigns.bmi', parseFloat(bmi.toFixed(1)));
    }
  }, [vitalSigns.height, vitalSigns.weight, setValue]);

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
          status: 'active',
          current_flow_step: 'registration'
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

  const analyzeVitals = async () => {
    setIsAnalyzing(true);
    
    try {
      // In a real app, this would call an AI service
      // For now, we'll simulate an AI response based on the vital signs
      
      // Wait for a short delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const analysis = generateMockAnalysis(vitalSigns);
      setAiAnalysis(analysis);
      
      // Suggest acuity level based on analysis
      if (analysis.includes('Critical') || analysis.includes('severe')) {
        setValue('acuityLevel', 1);
      } else if (analysis.includes('Concerning') || analysis.includes('moderate')) {
        setValue('acuityLevel', 2);
      } else if (analysis.includes('Abnormal') || analysis.includes('mild')) {
        setValue('acuityLevel', 3);
      } else {
        setValue('acuityLevel', 4);
      }
    } catch (error) {
      console.error('Error analyzing vitals:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateMockAnalysis = (vitals: TriageFormData['vitalSigns']) => {
    const issues = [];
    
    if (vitals.temperature && vitals.temperature > 38) {
      issues.push(`Elevated temperature (${vitals.temperature}°C) indicates fever.`);
    }
    
    if (vitals.heartRate && vitals.heartRate > 100) {
      issues.push(`Elevated heart rate (${vitals.heartRate} bpm) indicates tachycardia.`);
    }
    
    if (vitals.respiratoryRate && vitals.respiratoryRate > 20) {
      issues.push(`Elevated respiratory rate (${vitals.respiratoryRate} breaths/min) may indicate respiratory distress.`);
    }
    
    if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
      if (vitals.bloodPressureSystolic > 140 || vitals.bloodPressureDiastolic > 90) {
        issues.push(`Elevated blood pressure (${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg) indicates hypertension.`);
      }
    }
    
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) {
      issues.push(`Low oxygen saturation (${vitals.oxygenSaturation}%) may indicate hypoxemia.`);
    }
    
    if (vitals.bmi && vitals.bmi > 30) {
      issues.push(`Elevated BMI (${vitals.bmi}) indicates obesity.`);
    }
    
    if (vitals.painLevel && vitals.painLevel >= 7) {
      issues.push(`Severe pain level (${vitals.painLevel}/10) requires immediate attention.`);
    }
    
    if (issues.length === 0) {
      return "All vital signs appear to be within normal ranges. Patient is stable.";
    }
    
    // Determine severity
    let severity = "Abnormal";
    if (issues.length >= 3 || (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) || (vitals.painLevel && vitals.painLevel >= 9)) {
      severity = "Critical";
    } else if (issues.length >= 2 || (vitals.temperature && vitals.temperature > 39)) {
      severity = "Concerning";
    }
    
    return `${severity} vital signs detected:\n- ${issues.join('\n- ')}\n\nRecommendation: ${
      severity === "Critical" 
        ? "Immediate medical attention required." 
        : severity === "Concerning"
          ? "Prompt medical evaluation recommended."
          : "Medical evaluation advised."
    }`;
  };

  const onSubmit = async (data: TriageFormData) => {
    if (!hospital || !user || !patient) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Triage form submitted:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/patients');
        return;
      }
      
      // Create triage record
      const { error: triageError } = await supabase
        .from('triage')
        .insert({
          patient_id: patient.id,
          vital_signs: data.vitalSigns,
          chief_complaint: data.chiefComplaint,
          acuity_level: data.acuityLevel,
          notes: data.notes,
          triaged_by: user.id,
          department_id: data.departmentId || null,
          is_emergency: data.isEmergency
        });

      if (triageError) throw triageError;
      
      // Determine the next flow step based on department and emergency status
      let nextStep = 'waiting_consultation';
      
      if (data.isEmergency) {
        nextStep = 'emergency';
      } else if (data.departmentId) {
        // If a specific department is selected, update the flow step to include the department
        const selectedDepartment = departments.find(dept => dept.id === data.departmentId);
        if (selectedDepartment) {
          const deptName = selectedDepartment.name.toLowerCase().replace(/\s+/g, '_');
          nextStep = `waiting_${deptName}`;
        }
      }
      
      // Update patient's current flow step and medical history
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: nextStep,
          medical_history: {
            chronicConditions: data.medicalHistory.chronicConditions,
            allergies: data.medicalHistory.allergies.hasAllergies ? 
              data.medicalHistory.allergies.allergyList.split(',').map(a => a.trim()) : [],
            currentMedications: data.medicalHistory.currentMedications ? 
              data.medicalHistory.currentMedications.split(',').map(m => ({ name: m.trim() })) : [],
            familyHistory: data.medicalHistory.familyHistory,
            otherConditions: data.medicalHistory.otherConditions
          }
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting triage form:', error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center p-3">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-2.5 mb-2.5">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-white text-primary-600 flex items-center justify-center text-base font-bold shadow-sm">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div className="ml-2.5">
              <h2 className="text-base font-bold text-white">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center text-primary-100 text-xs">
                <User className="h-3 w-3 mr-1" />
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-2.5">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`flex-1 py-1.5 px-2.5 text-center text-xs font-medium ${
                activeTab === 'vitals'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('vitals')}
            >
              <Activity className="h-3 w-3 inline mr-1" />
              Vital Signs
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 px-2.5 text-center text-xs font-medium ${
                activeTab === 'medical-history'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('medical-history')}
            >
              <FileText className="h-3 w-3 inline mr-1" />
              Medical History
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 px-2.5 text-center text-xs font-medium ${
                activeTab === 'assessment'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('assessment')}
            >
              <Stethoscope className="h-3 w-3 inline mr-1" />
              Assessment
            </button>
          </div>
        </div>

        {/* Vital Signs Tab */}
        {activeTab === 'vitals' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2.5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-900">Vital Signs</h3>
              <button
                type="button"
                onClick={analyzeVitals}
                disabled={isAnalyzing}
                className="btn btn-sm btn-outline flex items-center text-xs"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary-500 mr-1"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3 mr-1" />
                    Analyze Vitals
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label text-xs">Temperature (°C)</label>
                <div className="flex items-center">
                  <Thermometer className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    step="0.1"
                    {...register('vitalSigns.temperature')}
                    className="form-input py-1 text-sm"
                    placeholder="36.5"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Heart Rate (bpm)</label>
                <div className="flex items-center">
                  <Heart className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    {...register('vitalSigns.heartRate')}
                    className="form-input py-1 text-sm"
                    placeholder="75"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Respiratory Rate (breaths/min)</label>
                <div className="flex items-center">
                  <Activity className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    {...register('vitalSigns.respiratoryRate')}
                    className="form-input py-1 text-sm"
                    placeholder="16"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Blood Pressure (mmHg)</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    {...register('vitalSigns.bloodPressureSystolic')}
                    className="form-input py-1 text-sm w-1/2"
                    placeholder="120"
                  />
                  <span className="text-gray-500">/</span>
                  <input
                    type="number"
                    {...register('vitalSigns.bloodPressureDiastolic')}
                    className="form-input py-1 text-sm w-1/2"
                    placeholder="80"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Oxygen Saturation (%)</label>
                <div className="flex items-center">
                  <Droplets className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register('vitalSigns.oxygenSaturation')}
                    className="form-input py-1 text-sm"
                    placeholder="98"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Pain Level (0-10)</label>
                <Controller
                  name="vitalSigns.painLevel"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="ml-2 text-sm font-medium">{field.value || 0}</span>
                    </div>
                  )}
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Weight (kg)</label>
                <div className="flex items-center">
                  <Scale className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    step="0.1"
                    {...register('vitalSigns.weight')}
                    className="form-input py-1 text-sm"
                    placeholder="70"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">Height (cm)</label>
                <div className="flex items-center">
                  <Ruler className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    {...register('vitalSigns.height')}
                    className="form-input py-1 text-sm"
                    placeholder="170"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label text-xs">BMI</label>
                <div className="flex items-center">
                  <Calculator className="h-3 w-3 text-gray-400 mr-1" />
                  <input
                    type="number"
                    step="0.1"
                    {...register('vitalSigns.bmi')}
                    className="form-input py-1 text-sm bg-gray-50"
                    placeholder="Calculated"
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            {aiAnalysis && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-start">
                  <Brain className="h-4 w-4 text-blue-500 mt-0.5 mr-1.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-blue-700">AI Analysis</h4>
                    <pre className="text-xs text-blue-600 whitespace-pre-wrap font-sans mt-1">{aiAnalysis}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medical History Tab */}
        {activeTab === 'medical-history' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2.5">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Medical History</h3>
            
            <div className="space-y-2">
              <div>
                <label className="form-label text-xs">Chronic Conditions</label>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="diabetes"
                      value="Diabetes Mellitus"
                      {...register('medicalHistory.chronicConditions')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="diabetes" className="ml-1 text-xs text-gray-700">
                      Diabetes Mellitus
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hypertension"
                      value="Hypertension"
                      {...register('medicalHistory.chronicConditions')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hypertension" className="ml-1 text-xs text-gray-700">
                      Hypertension
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="heartDisease"
                      value="Heart Disease"
                      {...register('medicalHistory.chronicConditions')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="heartDisease" className="ml-1 text-xs text-gray-700">
                      Heart Disease
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="asthma"
                      value="Asthma"
                      {...register('medicalHistory.chronicConditions')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="asthma" className="ml-1 text-xs text-gray-700">
                      Asthma
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cancer"
                      value="Cancer"
                      {...register('medicalHistory.chronicConditions')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cancer" className="ml-1 text-xs text-gray-700">
                      Cancer
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="surgeries"
                      value="Previous Surgeries"
                      {...register('medicalHistory.chronicConditions')}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="surgeries" className="ml-1 text-xs text-gray-700">
                      Previous Surgeries
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="form-label text-xs">Other Chronic Illnesses</label>
                  <textarea
                    {...register('medicalHistory.otherConditions')}
                    className="form-input py-1 text-sm"
                    rows={2}
                    placeholder="Enter any other chronic illnesses..."
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <AlertCircle className="h-3 w-3 text-warning-500 mr-1" />
                  <label className="form-label text-xs mb-0">Allergies</label>
                </div>
                <div className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id="hasAllergies"
                    {...register('medicalHistory.allergies.hasAllergies')}
                    className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasAllergies" className="ml-1 text-xs text-gray-700">
                    Patient has allergies
                  </label>
                </div>
                
                {hasAllergies && (
                  <textarea
                    {...register('medicalHistory.allergies.allergyList')}
                    className="form-input py-1 text-sm"
                    rows={2}
                    placeholder="List allergies, separated by commas..."
                  />
                )}
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <Pill className="h-3 w-3 text-gray-400 mr-1" />
                  <label className="form-label text-xs mb-0">Current Medications</label>
                </div>
                <textarea
                  {...register('medicalHistory.currentMedications')}
                  className="form-input py-1 text-sm"
                  rows={2}
                  placeholder="Enter current medications..."
                />
              </div>
              
              <div>
                <label className="form-label text-xs">Family History</label>
                <textarea
                  {...register('medicalHistory.familyHistory')}
                  className="form-input py-1 text-sm"
                  rows={2}
                  placeholder="Enter family history..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2.5">
            <div>
              <label className="form-label text-xs required">Chief Complaint</label>
              <textarea
                {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                className="form-input py-1 text-sm"
                rows={2}
                placeholder="Describe the patient's main complaint"
              />
              {errors.chiefComplaint && (
                <p className="form-error text-xs">{errors.chiefComplaint.message}</p>
              )}
            </div>
            
            <div className="mt-2">
              <label className="form-label text-xs required">Acuity Level</label>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setValue('acuityLevel', level)}
                    className={`py-1 px-2 text-xs font-medium rounded-md flex flex-col items-center justify-center ${
                      acuityLevel === level
                        ? level === 1 ? 'bg-red-100 text-red-800 border border-red-200'
                        : level === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : level === 3 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : level === 4 ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <span>{level}</span>
                    <span className="text-[10px]">
                      {level === 1 ? 'Critical' 
                      : level === 2 ? 'Emergency'
                      : level === 3 ? 'Urgent'
                      : level === 4 ? 'Standard'
                      : 'Non-urgent'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-2">
              <label className="form-label text-xs">Department</label>
              <div className="flex items-center">
                <Building2 className="h-3 w-3 text-gray-400 mr-1" />
                <select
                  {...register('departmentId')}
                  className="form-input py-1 text-sm"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-2">
              <label className="form-label text-xs">Notes</label>
              <textarea
                {...register('notes')}
                className="form-input py-1 text-sm"
                rows={2}
                placeholder="Additional notes about the patient's condition"
              />
            </div>
            
            <div className="mt-2 flex items-center">
              <input
                type="checkbox"
                id="isEmergency"
                {...register('isEmergency')}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isEmergency" className="ml-2 flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                Mark as Emergency Case
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
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
                Complete Triage
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TriageForm;