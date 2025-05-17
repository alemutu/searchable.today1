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
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Patient storage hook
  const { 
    data: patientsData,
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
    saveItem: saveTriage,
    error: triageError
  } = useHybridStorage<any>('triage');
  
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
    // Clear any previous form errors
    setFormError(null);
    
    // Fetch departments data
    fetchDepartments().catch(error => {
      console.error("Error fetching departments:", error);
      addNotification({
        message: `Failed to load departments: ${error.message}`,
        type: 'error'
      });
    });
    
    if (patientId) {
      fetchPatient(patientId).catch(error => {
        console.error("Error fetching patient:", error);
        addNotification({
          message: `Failed to load patient data: ${error.message}`,
          type: 'error'
        });
      });
    } else {
      setIsLoading(false);
      setFormError("No patient ID provided");
    }
  }, [patientId, fetchPatient, fetchDepartments, addNotification]);
  
  useEffect(() => {
    // Update patient state when data is loaded
    if (patientsData) {
      setPatientData(patientsData);
    }
    
    // Set loading state based on both data fetches
    if (!patientLoading && !departmentsLoading) {
      setIsLoading(false);
    }
  }, [patientsData, patientLoading, departmentsLoading]);
  
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

  // Display error notification if there's a triage error
  useEffect(() => {
    if (triageError) {
      addNotification({
        message: `Error with triage data: ${triageError.message}`,
        type: 'error'
      });
    }
  }, [triageError, addNotification]);

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
      addNotification({
        message: 'Failed to analyze vital signs',
        type: 'error'
      });
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
    // Validate current step before proceeding
    let isValid = true;
    
    if (currentStep === 1) {
      // For vital signs, we don't require all fields, but if any are filled, validate them
      const { temperature, heartRate, respiratoryRate, bloodPressureSystolic, bloodPressureDiastolic, oxygenSaturation } = vitalSigns;
      
      if (temperature && (temperature < 35 || temperature > 42)) {
        addNotification({
          message: 'Temperature should be between 35°C and 42°C',
          type: 'warning'
        });
        isValid = false;
      }
      
      if (heartRate && (heartRate < 40 || heartRate > 220)) {
        addNotification({
          message: 'Heart rate should be between 40 and 220 bpm',
          type: 'warning'
        });
        isValid = false;
      }
      
      if (respiratoryRate && (respiratoryRate < 8 || respiratoryRate > 40)) {
        addNotification({
          message: 'Respiratory rate should be between 8 and 40 breaths/min',
          type: 'warning'
        });
        isValid = false;
      }
      
      if (bloodPressureSystolic && (bloodPressureSystolic < 70 || bloodPressureSystolic > 250)) {
        addNotification({
          message: 'Systolic blood pressure should be between 70 and 250 mmHg',
          type: 'warning'
        });
        isValid = false;
      }
      
      if (bloodPressureDiastolic && (bloodPressureDiastolic < 40 || bloodPressureDiastolic > 150)) {
        addNotification({
          message: 'Diastolic blood pressure should be between 40 and 150 mmHg',
          type: 'warning'
        });
        isValid = false;
      }
      
      if (oxygenSaturation && (oxygenSaturation < 70 || oxygenSaturation > 100)) {
        addNotification({
          message: 'Oxygen saturation should be between 70% and 100%',
          type: 'warning'
        });
        isValid = false;
      }
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      
      // Map step to tab
      if (currentStep === 1) setActiveTab('medical-history');
      if (currentStep === 2) setActiveTab('assessment');
      
      // Scroll to top
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      
      // Map step to tab
      if (currentStep === 2) setActiveTab('vitals');
      if (currentStep === 3) setActiveTab('medical-history');
      
      // Scroll to top
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data: TriageFormData) => {
    if (!user) {
      setFormError("User authentication error. Please log in again.");
      addNotification({
        message: 'Authentication error. Please log in again.',
        type: 'error'
      });
      return;
    }
    
    if (!patientData) {
      setFormError("Patient data not found. Please try again.");
      addNotification({
        message: 'Patient data not found',
        type: 'error'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      setFormError(null);
      
      console.log('Triage form submitted:', data);
      
      // Validate required fields
      if (!data.chiefComplaint) {
        setFormError("Chief complaint is required");
        addNotification({
          message: 'Chief complaint is required',
          type: 'error'
        });
        setActiveTab('assessment');
        setIsSaving(false);
        return;
      }
      
      if (!data.departmentId) {
        setFormError("Please select a department");
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
      
      // Create a unique ID for the triage record
      const triageId = `triage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create triage record first
      const triageRecord = {
        id: triageId,
        patient_id: patientData.id,
        vital_signs: data.vitalSigns,
        chief_complaint: data.chiefComplaint,
        acuity_level: data.acuityLevel,
        notes: data.notes,
        triaged_by: user.id,
        department_id: data.departmentId || null,
        is_emergency: data.isEmergency,
        created_at: new Date().toISOString()
      };
      
      // Save the triage record
      await saveTriage(triageRecord, triageId);
      
      // Update patient's current flow step and medical history
      const updatedPatient = {
        ...patientData,
        current_flow_step: nextStep,
        medical_history: {
          ...patientData.medical_history,
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
      await savePatient(updatedPatient, patientData.id);
      
      // Show success notification
      addNotification({
        message: 'Triage completed successfully',
        type: 'success'
      });
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting triage form:', error.message);
      
      // Set form error
      setFormError(`Error: ${error.message}`);
      
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
        <button 
          onClick={() => navigate('/patients')}
          className="mt-4 btn btn-outline"
        >
          Return to Patients
        </button>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="text-center p-3">
        <p className="text-gray-500">Patient not found</p>
        <button 
          onClick={() => navigate('/patients')}
          className="mt-4 btn btn-outline"
        >
          Return to Patients
        </button>
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
              {patientData.first_name.charAt(0)}{patientData.last_name.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">
                {patientData.first_name} {patientData.last_name}
              </h2>
              <div className="flex items-center text-primary-100 text-sm">
                <User className="h-4 w-4 mr-1" />
                <span>{calculateAge(patientData.date_of_birth)} years • {patientData.gender}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" />
                <span className="bg-black bg-opacity-20 px-2 py-0.5 rounded">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Error Message */}
        {formError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}

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
                      {...register('vitalSigns.temperature', {
                        min: { value: 35, message: 'Temperature should be at least 35°C' },
                        max: { value: 42, message: 'Temperature should be at most 42°C' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.vitalSigns?.temperature ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="36.5"
                    />
                  </div>
                  {errors.vitalSigns?.temperature && (
                    <p className="form-error text-xs">{errors.vitalSigns.temperature.message}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Heart Rate (bpm)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Heart className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('vitalSigns.heartRate', {
                        min: { value: 40, message: 'Heart rate should be at least 40 bpm' },
                        max: { value: 220, message: 'Heart rate should be at most 220 bpm' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.vitalSigns?.heartRate ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="75"
                    />
                  </div>
                  {errors.vitalSigns?.heartRate && (
                    <p className="form-error text-xs">{errors.vitalSigns.heartRate.message}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Respiratory Rate (breaths/min)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Activity className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('vitalSigns.respiratoryRate', {
                        min: { value: 8, message: 'Respiratory rate should be at least 8 breaths/min' },
                        max: { value: 40, message: 'Respiratory rate should be at most 40 breaths/min' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.vitalSigns?.respiratoryRate ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="16"
                    />
                  </div>
                  {errors.vitalSigns?.respiratoryRate && (
                    <p className="form-error text-xs">{errors.vitalSigns.respiratoryRate.message}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Blood Pressure (mmHg)</label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        {...register('vitalSigns.bloodPressureSystolic', {
                          min: { value: 70, message: 'Systolic BP should be at least 70 mmHg' },
                          max: { value: 250, message: 'Systolic BP should be at most 250 mmHg' }
                        })}
                        className={`form-input py-2 text-sm ${errors.vitalSigns?.bloodPressureSystolic ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="120"
                      />
                      {errors.vitalSigns?.bloodPressureSystolic && (
                        <p className="form-error text-xs">{errors.vitalSigns.bloodPressureSystolic.message}</p>
                      )}
                    </div>
                    <span className="text-gray-500">/</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        {...register('vitalSigns.bloodPressureDiastolic', {
                          min: { value: 40, message: 'Diastolic BP should be at least 40 mmHg' },
                          max: { value: 150, message: 'Diastolic BP should be at most 150 mmHg' }
                        })}
                        className={`form-input py-2 text-sm ${errors.vitalSigns?.bloodPressureDiastolic ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                        placeholder="80"
                      />
                      {errors.vitalSigns?.bloodPressureDiastolic && (
                        <p className="form-error text-xs">{errors.vitalSigns.bloodPressureDiastolic.message}</p>
                      )}
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
                      {...register('vitalSigns.oxygenSaturation', {
                        min: { value: 70, message: 'O2 saturation should be at least 70%' },
                        max: { value: 100, message: 'O2 saturation cannot exceed 100%' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.vitalSigns?.oxygenSaturation ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="98"
                    />
                  </div>
                  {errors.vitalSigns?.oxygenSaturation && (
                    <p className="form-error text-xs">{errors.vitalSigns.oxygenSaturation.message}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Pain Level (0-10)</label>
                  <div className="space-y-2">
                    <Controller
                      name="vitalSigns.painLevel"
                      control={control}
                      rules={{
                        min: { value: 0, message: 'Pain level cannot be negative' },
                        max: { value: 10, message: 'Pain level cannot exceed 10' }
                      }}
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
                  {errors.vitalSigns?.painLevel && (
                    <p className="form-error text-xs">{errors.vitalSigns.painLevel.message}</p>
                  )}
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
                      {...register('vitalSigns.weight', {
                        min: { value: 0.5, message: 'Weight should be at least 0.5 kg' },
                        max: { value: 500, message: 'Weight should be at most 500 kg' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.vitalSigns?.weight ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="70"
                    />
                  </div>
                  {errors.vitalSigns?.weight && (
                    <p className="form-error text-xs">{errors.vitalSigns.weight.message}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="form-label text-sm">Height (cm)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Ruler className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      {...register('vitalSigns.height', {
                        min: { value: 30, message: 'Height should be at least 30 cm' },
                        max: { value: 250, message: 'Height should be at most 250 cm' }
                      })}
                      className={`form-input pl-9 py-2 text-sm ${errors.vitalSigns?.height ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                      placeholder="170"
                    />
                  </div>
                  {errors.vitalSigns?.height && (
                    <p className="form-error text-xs">{errors.vitalSigns.height.message}</p>
                  )}
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
                      {...register('medicalHistory.allergies.allergyList', {
                        validate: value => {
                          if (hasAllergies && !value.trim()) {
                            return 'Please list the allergies or uncheck the box';
                          }
                          return true;
                        }
                      })}
                      className={`form-input py-2 text-sm w-full ${
                        errors.medicalHistory?.allergies?.allergyList ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''
                      }`}
                      rows={2}
                      placeholder="List allergies, separated by commas (e.g., Penicillin, Peanuts, Latex)..."
                    />
                  )}
                  {errors.medicalHistory?.allergies?.allergyList && (
                    <p className="form-error text-xs mt-1">{errors.medicalHistory.allergies.allergyList.message}</p>
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
                    {...register('chiefComplaint', { 
                      required: 'Chief complaint is required',
                      minLength: { value: 3, message: 'Please provide a more detailed complaint' }
                    })}
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