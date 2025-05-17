import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  User, 
  Activity, 
  FileText, 
  Pill, 
  AlertTriangle, 
  Stethoscope, 
  Building2, 
  Save, 
  ArrowLeft, 
  Brain, 
  Thermometer, 
  Ruler, 
  Droplets, 
  Scale, 
  Hash, 
  Heart, 
  Clock, 
  Calculator, 
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';

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
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'medical-history' | 'assessment'>('vitals');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Patient storage hook
  const { 
    data: patientData,
    loading: patientLoading,
    error: patientError,
    fetchById: fetchPatient,
    saveItem: savePatient
  } = useHybridStorage<Patient>('patients');
  
  // Departments storage hook
  const { 
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
    fetchItems: fetchDepartments
  } = useHybridStorage<Department>('departments');
  
  // Triage storage hook
  const { 
    saveItem: saveTriage
  } = useHybridStorage<any>('triage');
  
  // Local state for departments and patient
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  
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
    // Fetch departments data
    fetchDepartments();
    
    if (patientId) {
      fetchPatient(patientId);
    } else {
      setIsLoading(false);
    }
  }, [patientId, fetchPatient, fetchDepartments]);
  
  useEffect(() => {
    // Update patient state when data is loaded
    if (patientData) {
      setPatient(patientData);
    }
    
    // Set loading state based on both data fetches
    if (!patientLoading && !departmentsLoading) {
      setIsLoading(false);
    }
  }, [patientData, patientLoading, departmentsLoading]);
  
  useEffect(() => {
    // Set departments from fetched data
    if (departmentsData && Array.isArray(departmentsData)) {
      setDepartments(departmentsData);
      
      // Set default department to General Medicine if available
      const generalMedicineDept = departmentsData.find(dept => dept.name === 'General Medicine');
      if (generalMedicineDept) {
        setValue('departmentId', generalMedicineDept.id);
      } else if (departmentsData.length > 0) {
        // If no General Medicine department, use the first one
        setValue('departmentId', departmentsData[0].id);
      }
    }
    
    // If no departments are available, create mock departments
    if ((!departmentsData || !Array.isArray(departmentsData) || departmentsData.length === 0) && !departmentsLoading) {
      const mockDepartments: Department[] = [
        { id: '1', name: 'Emergency' },
        { id: '2', name: 'General Medicine' },
        { id: '3', name: 'Cardiology' },
        { id: '4', name: 'Pediatrics' },
        { id: '5', name: 'Orthopedics' },
        { id: '6', name: 'Gynecology' },
        { id: '7', name: 'Surgical' },
        { id: '8', name: 'Dental' },
        { id: '9', name: 'Eye Clinic' },
        { id: '10', name: 'Physiotherapy' }
      ];
      
      setDepartments(mockDepartments);
      
      // Set default department to General Medicine
      const generalMedicineDept = mockDepartments.find(dept => dept.name === 'General Medicine');
      if (generalMedicineDept) {
        setValue('departmentId', generalMedicineDept.id);
      }
    }
  }, [departmentsData, departmentsLoading, setValue]);
  
  useEffect(() => {
    // Calculate BMI if height and weight are available
    if (vitalSigns.height && vitalSigns.weight) {
      const heightInMeters = vitalSigns.height / 100;
      const bmi = vitalSigns.weight / (heightInMeters * heightInMeters);
      setValue('vitalSigns.bmi', parseFloat(bmi.toFixed(1)));
    }
  }, [vitalSigns.height, vitalSigns.weight, setValue]);

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

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      
      // Map step to tab
      if (currentStep === 1) setActiveTab('medical-history');
      if (currentStep === 2) setActiveTab('assessment');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      
      // Map step to tab
      if (currentStep === 2) setActiveTab('vitals');
      if (currentStep === 3) setActiveTab('medical-history');
    }
  };

  const onSubmit = async (data: TriageFormData) => {
    if (!user || !patient) return;
    
    try {
      setIsSaving(true);
      
      console.log('Triage form submitted:', data);
      
      // Validate required fields
      if (!data.chiefComplaint) {
        addNotification({
          message: 'Chief complaint is required',
          type: 'error'
        });
        setActiveTab('assessment');
        setIsSaving(false);
        return;
      }
      
      if (!data.departmentId) {
        addNotification({
          message: 'Please select a department',
          type: 'error'
        });
        setActiveTab('assessment');
        setIsSaving(false);
        return;
      }
      
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
      const updatedPatient = {
        ...patient,
        current_flow_step: nextStep,
        medical_history: {
          ...patient.medical_history,
          chronicConditions: data.medicalHistory.chronicConditions,
          allergies: data.medicalHistory.allergies.hasAllergies ? 
            data.medicalHistory.allergies.allergyList.split(',').map(a => a.trim()) : [],
          currentMedications: data.medicalHistory.currentMedications ? 
            data.medicalHistory.currentMedications.split(',').map(m => ({ name: m.trim() })) : [],
          familyHistory: data.medicalHistory.familyHistory,
          otherConditions: data.medicalHistory.otherConditions
        }
      };
      
      // Save the updated patient
      await savePatient(updatedPatient, patient.id);
      
      // Create triage record in local storage
      await saveTriage({
        id: Date.now().toString(), // Generate a unique ID
        patient_id: patient.id,
        vital_signs: data.vitalSigns,
        chief_complaint: data.chiefComplaint,
        acuity_level: data.acuityLevel,
        notes: data.notes,
        triaged_by: user.id,
        department_id: data.departmentId || null,
        is_emergency: data.isEmergency,
        created_at: new Date().toISOString()
      });
      
      // Show success notification
      addNotification({
        message: 'Triage completed successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting triage form:', error.message);
      
      // Show error notification
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
      <div className="flex justify-center p-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (patientError) {
    return (
      <div className="text-center p-3">
        <p className="text-error-500">Error loading patient: {patientError.message}</p>
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
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-white text-primary-600 flex items-center justify-center text-lg font-bold shadow-md">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center text-primary-100 text-sm">
                <User className="h-4 w-4 mr-1" />
                <span>{calculateAge(patient.date_of_birth)} years • {patient.gender}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" />
                <span className="bg-black bg-opacity-20 px-2 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : 1}
                </div>
                <div className={`h-1 w-12 ${
                  currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : 2}
                </div>
                <div className={`h-1 w-12 ${
                  currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep} of 3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Vital Signs</div>
              <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Medical History</div>
              <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Assessment</div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          {/* Step 1: Vital Signs */}
          {currentStep === 1 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Vital Signs</h3>
                <button
                  type="button"
                  onClick={analyzeVitals}
                  disabled={isAnalyzing}
                  className="btn btn-outline flex items-center text-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Vitals
                    </>
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="form-label text-sm">Temperature (°C)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Thermometer className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      {...register('vitalSigns.temperature')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="36.5"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Heart Rate (bpm)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Heart className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('vitalSigns.heartRate')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="75"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Respiratory Rate (breaths/min)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Activity className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('vitalSigns.respiratoryRate')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="16"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Blood Pressure (mmHg)</label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        {...register('vitalSigns.bloodPressureSystolic')}
                        className="form-input py-2 text-sm"
                        placeholder="120"
                      />
                    </div>
                    <span className="text-gray-500">/</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        {...register('vitalSigns.bloodPressureDiastolic')}
                        className="form-input py-2 text-sm"
                        placeholder="80"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Oxygen Saturation (%)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Droplets className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register('vitalSigns.oxygenSaturation')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="98"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Pain Level (0-10)</label>
                  <div className="space-y-2">
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
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="ml-2 text-sm font-medium bg-primary-100 text-primary-800 px-2 py-1 rounded-md min-w-[2rem] text-center">
                            {field.value || 0}
                          </span>
                        </div>
                      )}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>No pain</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Weight (kg)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Scale className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      {...register('vitalSigns.weight')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="70"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Height (cm)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Ruler className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('vitalSigns.height')}
                      className="form-input pl-9 py-2 text-sm"
                      placeholder="170"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">BMI</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calculator className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      {...register('vitalSigns.bmi')}
                      className="form-input pl-9 py-2 text-sm bg-gray-50"
                      placeholder="Calculated"
                      readOnly
                    />
                  </div>
                </div>
              </div>
              
              {aiAnalysis && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start">
                    <Brain className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">AI Analysis</h4>
                      <pre className="text-sm text-blue-600 whitespace-pre-wrap font-sans mt-2">{aiAnalysis}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Medical History */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label text-sm">Chronic Conditions</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <input
                        type="checkbox"
                        id="diabetes"
                        value="Diabetes Mellitus"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="diabetes" className="text-sm text-gray-700">
                        Diabetes Mellitus
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <input
                        type="checkbox"
                        id="hypertension"
                        value="Hypertension"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hypertension" className="text-sm text-gray-700">
                        Hypertension
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <input
                        type="checkbox"
                        id="heartDisease"
                        value="Heart Disease"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="heartDisease" className="text-sm text-gray-700">
                        Heart Disease
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <input
                        type="checkbox"
                        id="asthma"
                        value="Asthma"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="asthma" className="text-sm text-gray-700">
                        Asthma
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <input
                        type="checkbox"
                        id="cancer"
                        value="Cancer"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="cancer" className="text-sm text-gray-700">
                        Cancer
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <input
                        type="checkbox"
                        id="surgeries"
                        value="Previous Surgeries"
                        {...register('medicalHistory.chronicConditions')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="surgeries" className="text-sm text-gray-700">
                        Previous Surgeries
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label text-sm">Other Chronic Illnesses</label>
                    <textarea
                      {...register('medicalHistory.otherConditions')}
                      className="form-input py-2 text-sm"
                      rows={2}
                      placeholder="Enter any other chronic illnesses..."
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-4 w-4 text-warning-500 mr-2" />
                    <label className="form-label text-sm mb-0 font-medium">Allergies</label>
                  </div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="hasAllergies"
                      {...register('medicalHistory.allergies.hasAllergies')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasAllergies" className="ml-2 text-sm text-gray-700">
                      Patient has allergies
                    </label>
                  </div>
                  
                  {hasAllergies && (
                    <textarea
                      {...register('medicalHistory.allergies.allergyList')}
                      className="form-input py-2 text-sm w-full"
                      rows={2}
                      placeholder="List allergies, separated by commas (e.g., Penicillin, Peanuts, Latex)..."
                    />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <Pill className="h-4 w-4 text-gray-400 mr-2" />
                    <label className="form-label text-sm mb-0">Current Medications</label>
                  </div>
                  <textarea
                    {...register('medicalHistory.currentMedications')}
                    className="form-input py-2 text-sm"
                    rows={2}
                    placeholder="Enter current medications, separated by commas (e.g., Lisinopril 10mg, Metformin 500mg)..."
                  />
                </div>
                
                <div>
                  <label className="form-label text-sm">Family History</label>
                  <textarea
                    {...register('medicalHistory.familyHistory')}
                    className="form-input py-2 text-sm"
                    rows={2}
                    placeholder="Enter relevant family medical history..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Assessment */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label text-sm required">Chief Complaint</label>
                  <textarea
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                    className={`form-input py-2 text-sm ${errors.chiefComplaint ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    rows={3}
                    placeholder="Describe the patient's main complaint"
                  />
                  {errors.chiefComplaint && (
                    <p className="form-error text-sm mt-1">{errors.chiefComplaint.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-sm required">Acuity Level</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setValue('acuityLevel', level)}
                        className={`p-3 text-sm font-medium rounded-lg flex flex-col items-center justify-center transition-colors ${
                          acuityLevel === level
                            ? level === 1 ? 'bg-red-100 text-red-800 border border-red-200'
                            : level === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : level === 3 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : level === 4 ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-lg font-bold mb-1">{level}</span>
                        <span className="text-xs">
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
                
                <div>
                  <label className="form-label text-sm required">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      {...register('departmentId', { required: 'Department is required' })}
                      className={`form-input pl-9 py-2 text-sm w-full ${errors.departmentId ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.departmentId && (
                    <p className="form-error text-sm mt-1">{errors.departmentId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label text-sm">Notes</label>
                  <textarea
                    {...register('notes')}
                    className="form-input py-2 text-sm"
                    rows={3}
                    placeholder="Additional notes about the patient's condition"
                  />
                </div>
                
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isEmergency"
                    {...register('isEmergency')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isEmergency" className="ml-2 flex items-center text-sm font-medium text-red-700">
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    Mark as Emergency Case
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
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
                  Complete Triage
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TriageForm;