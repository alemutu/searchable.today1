import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../lib/store';
import { 
  User, 
  ArrowLeft, 
  ArrowRight, 
  Activity, 
  Stethoscope, 
  Pill, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  FlaskRound as Flask, 
  Microscope, 
  BedDouble 
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string;
  address: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medical_info: {
    allergies: { allergen: string; reaction: string; severity: string }[];
    chronicConditions: string[];
    currentMedications: { name: string; dosage: string; frequency: string }[];
    bloodType: string;
    smoker: boolean;
    alcoholConsumption: string;
  };
  status: string;
  current_flow_step: string;
}

const PatientWorkflow: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { data: patient, loading, error, saveItem } = useHybridStorage<Patient>('patients');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Workflow steps
  const workflowSteps = [
    { id: 'registration', label: 'Registration', icon: <User className="h-5 w-5" /> },
    { id: 'triage', label: 'Triage', icon: <Activity className="h-5 w-5" /> },
    { id: 'waiting_consultation', label: 'Waiting', icon: <Clock className="h-5 w-5" /> },
    { id: 'consultation', label: 'Consultation', icon: <Stethoscope className="h-5 w-5" /> },
    { id: 'lab_tests', label: 'Lab Tests', icon: <Flask className="h-5 w-5" /> },
    { id: 'radiology', label: 'Radiology', icon: <Microscope className="h-5 w-5" /> },
    { id: 'pharmacy', label: 'Pharmacy', icon: <Pill className="h-5 w-5" /> },
    { id: 'billing', label: 'Billing', icon: <DollarSign className="h-5 w-5" /> },
    { id: 'discharge', label: 'Discharge', icon: <CheckCircle className="h-5 w-5" /> },
    { id: 'inpatient', label: 'Inpatient', icon: <BedDouble className="h-5 w-5" /> }
  ];
  
  useEffect(() => {
    if (patientId && Array.isArray(patient)) {
      const foundPatient = patient.find(p => p.id === patientId);
      if (foundPatient) {
        setCurrentPatient(foundPatient);
      }
    } else if (patient && !Array.isArray(patient) && patient.id === patientId) {
      setCurrentPatient(patient);
    }
  }, [patientId, patient]);
  
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
  
  const getCurrentStepIndex = () => {
    if (!currentPatient) return -1;
    return workflowSteps.findIndex(step => step.id === currentPatient.current_flow_step);
  };
  
  const handleMoveToNextStep = async () => {
    if (!currentPatient) return;
    
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < 0 || currentIndex >= workflowSteps.length - 1) return;
    
    const nextStep = workflowSteps[currentIndex + 1];
    
    setIsUpdating(true);
    try {
      const updatedPatient = {
        ...currentPatient,
        current_flow_step: nextStep.id
      };
      
      await saveItem(updatedPatient, currentPatient.id);
      setCurrentPatient(updatedPatient);
      
      addNotification({
        message: `Patient moved to ${nextStep.label} stage`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating patient workflow:', error);
      addNotification({
        message: 'Failed to update patient workflow',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleMoveToPreviousStep = async () => {
    if (!currentPatient) return;
    
    const currentIndex = getCurrentStepIndex();
    if (currentIndex <= 0) return;
    
    const prevStep = workflowSteps[currentIndex - 1];
    
    setIsUpdating(true);
    try {
      const updatedPatient = {
        ...currentPatient,
        current_flow_step: prevStep.id
      };
      
      await saveItem(updatedPatient, currentPatient.id);
      setCurrentPatient(updatedPatient);
      
      addNotification({
        message: `Patient moved back to ${prevStep.label} stage`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating patient workflow:', error);
      addNotification({
        message: 'Failed to update patient workflow',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleMoveToStep = async (stepId: string) => {
    if (!currentPatient) return;
    
    setIsUpdating(true);
    try {
      const updatedPatient = {
        ...currentPatient,
        current_flow_step: stepId
      };
      
      await saveItem(updatedPatient, currentPatient.id);
      setCurrentPatient(updatedPatient);
      
      const stepLabel = workflowSteps.find(step => step.id === stepId)?.label || stepId;
      
      addNotification({
        message: `Patient moved to ${stepLabel} stage`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating patient workflow:', error);
      addNotification({
        message: 'Failed to update patient workflow',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error || !currentPatient) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Patient not found or error loading patient data</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 btn btn-primary"
        >
          Back to Patients
        </button>
      </div>
    );
  }
  
  const currentStepIndex = getCurrentStepIndex();
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <button 
          onClick={() => navigate(`/patients/${patientId}`)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Patient Workflow</h1>
      </div>
      
      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
            {currentPatient.first_name.charAt(0)}{currentPatient.last_name.charAt(0)}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900">
              {currentPatient.first_name} {currentPatient.last_name}
            </h2>
            <p className="text-gray-600">
              {calculateAge(currentPatient.date_of_birth)} years • {currentPatient.gender}
            </p>
          </div>
        </div>
      </div>
      
      {/* Workflow Steps */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Patient Journey</h2>
        
        <div className="relative">
          {/* Progress Bar */}
          <div className="hidden sm:block absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200">
            <div 
              className="h-1 bg-primary-500 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, (currentStepIndex / (workflowSteps.length - 1)) * 100))}%` }}
            ></div>
          </div>
          
          {/* Steps */}
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center">
            {workflowSteps.map((step, index) => {
              const isActive = currentPatient.current_flow_step === step.id;
              const isCompleted = currentStepIndex > index;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-row sm:flex-col items-center mb-4 sm:mb-0 ${index < workflowSteps.length - 1 ? 'sm:w-1/9' : ''}`}
                >
                  <button
                    onClick={() => handleMoveToStep(step.id)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive 
                        ? 'bg-primary-500 text-white' 
                        : isCompleted 
                          ? 'bg-success-500 text-white' 
                          : 'bg-gray-200 text-gray-500'}
                      transition-colors duration-300
                    `}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.icon}
                  </button>
                  <span className={`
                    ml-3 sm:ml-0 sm:mt-2 text-xs font-medium
                    ${isActive ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Current Step Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          {workflowSteps.find(step => step.id === currentPatient.current_flow_step)?.icon}
          <h2 className="text-lg font-medium text-gray-900 ml-2">
            {workflowSteps.find(step => step.id === currentPatient.current_flow_step)?.label || 'Unknown Step'}
          </h2>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          {currentPatient.current_flow_step === 'registration' && (
            <div>
              <p className="text-gray-700">Patient has been registered in the system. The next step is to perform triage to assess the patient's condition and priority.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Verify patient information</li>
                  <li>• Collect any missing details</li>
                  <li>• Prepare for triage assessment</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'triage' && (
            <div>
              <p className="text-gray-700">Patient is currently in triage. Medical staff will assess vital signs, chief complaint, and determine priority level.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Record vital signs</li>
                  <li>• Document chief complaint</li>
                  <li>• Assign priority level</li>
                  <li>• Determine appropriate department</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'waiting_consultation' && (
            <div>
              <p className="text-gray-700">Patient has been triaged and is now waiting to see a doctor for consultation.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Monitor patient's condition</li>
                  <li>• Update estimated wait time</li>
                  <li>• Prepare patient's medical record for doctor</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'consultation' && (
            <div>
              <p className="text-gray-700">Patient is currently being examined by a doctor. The doctor will diagnose the condition and determine the treatment plan.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Record doctor's notes</li>
                  <li>• Document diagnosis</li>
                  <li>• Create treatment plan</li>
                  <li>• Order lab tests or imaging if needed</li>
                  <li>• Prescribe medications if needed</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'lab_tests' && (
            <div>
              <p className="text-gray-700">Patient has been referred for laboratory tests. Samples will be collected and analyzed.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Collect samples</li>
                  <li>• Process and analyze samples</li>
                  <li>• Record test results</li>
                  <li>• Notify doctor when results are ready</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'radiology' && (
            <div>
              <p className="text-gray-700">Patient has been referred for imaging studies. Scans will be performed and analyzed.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Perform imaging studies</li>
                  <li>• Process and analyze images</li>
                  <li>• Record findings</li>
                  <li>• Notify doctor when results are ready</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'pharmacy' && (
            <div>
              <p className="text-gray-700">Patient has been prescribed medications and is now at the pharmacy for dispensing.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Verify prescription</li>
                  <li>• Prepare medications</li>
                  <li>• Provide medication instructions</li>
                  <li>• Dispense medications</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'billing' && (
            <div>
              <p className="text-gray-700">Patient has completed medical care and is now at the billing department for payment processing.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Generate invoice</li>
                  <li>• Process payment</li>
                  <li>• Handle insurance claims if applicable</li>
                  <li>• Provide receipt</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'discharge' && (
            <div>
              <p className="text-gray-700">Patient has completed all necessary steps and is ready to be discharged.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Provide discharge instructions</li>
                  <li>• Schedule follow-up appointments if needed</li>
                  <li>• Ensure all documentation is complete</li>
                  <li>• Update patient status in system</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentPatient.current_flow_step === 'inpatient' && (
            <div>
              <p className="text-gray-700">Patient has been admitted to the hospital for inpatient care.</p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Actions:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Assign bed and ward</li>
                  <li>• Create care plan</li>
                  <li>• Schedule regular monitoring</li>
                  <li>• Coordinate with medical team</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleMoveToPreviousStep}
            disabled={currentStepIndex <= 0 || isUpdating}
            className={`btn ${currentStepIndex <= 0 ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-outline'}`}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Previous Step
          </button>
          
          <button
            type="button"
            onClick={handleMoveToNextStep}
            disabled={currentStepIndex >= workflowSteps.length - 1 || isUpdating}
            className={`btn ${currentStepIndex >= workflowSteps.length - 1 ? 'btn-primary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
          >
            Next Step
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
      
      {/* Documentation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            This simulation allows you to move a patient through the entire hospital workflow from registration to discharge.
            You can move forward and backward through the steps to see the different stages of patient care.
          </p>
          
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
            <h3 className="text-sm font-medium text-primary-800 mb-2">Workflow Steps:</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-primary-700">
              <li><strong>Registration</strong>: Patient information is collected and entered into the system</li>
              <li><strong>Triage</strong>: Initial assessment of patient's condition and priority</li>
              <li><strong>Waiting</strong>: Patient waits to be seen by a doctor</li>
              <li><strong>Consultation</strong>: Doctor examines patient, makes diagnosis, and creates treatment plan</li>
              <li><strong>Lab Tests</strong>: If ordered, patient undergoes laboratory tests</li>
              <li><strong>Radiology</strong>: If ordered, patient undergoes imaging studies</li>
              <li><strong>Pharmacy</strong>: Patient receives prescribed medications</li>
              <li><strong>Billing</strong>: Payment is processed for services rendered</li>
              <li><strong>Discharge</strong>: Patient is released with follow-up instructions</li>
              <li><strong>Inpatient</strong>: Alternative path if patient requires hospitalization</li>
            </ol>
          </div>
          
          <p className="text-gray-700">
            In a real hospital system, these steps would involve different staff members and departments working together.
            This simulation allows you to experience the entire workflow in a simplified manner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientWorkflow;