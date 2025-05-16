import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../lib/store';
import { 
  User, 
  ArrowLeft, 
  Stethoscope, 
  Save, 
  Pill, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Microscope, 
  FlaskRound as Flask 
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_info: any;
  current_flow_step: string;
}

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes: string;
  medical_certificate: boolean;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  lab_tests: string[];
  radiology_tests: string[];
  follow_up: string | null;
}

const PatientConsultation: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { data: patients, loading: loadingPatient } = useHybridStorage<Patient>('patients');
  const { saveItem } = useHybridStorage<Consultation>('consultations');
  const { saveItem: savePatient } = useHybridStorage<Patient>('patients');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Consultation, 'id' | 'doctor_id'>>({
    patient_id: patientId || '',
    consultation_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
    medical_certificate: false,
    prescriptions: [],
    lab_tests: [],
    radiology_tests: [],
    follow_up: null
  });
  
  const [medicationInputs, setMedicationInputs] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  const [labTest, setLabTest] = useState('');
  const [radiologyTest, setRadiologyTest] = useState('');
  
  useEffect(() => {
    if (patientId && Array.isArray(patients)) {
      const foundPatient = patients.find(p => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        addNotification({
          message: 'Patient not found',
          type: 'error'
        });
      }
    }
  }, [patientId, patients, addNotification]);
  
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleAddMedication = () => {
    if (!medicationInputs.medication || !medicationInputs.dosage || !medicationInputs.frequency || !medicationInputs.duration) return;
    
    setFormData({
      ...formData,
      prescriptions: [
        ...formData.prescriptions,
        { ...medicationInputs }
      ]
    });
    
    setMedicationInputs({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };
  
  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      prescriptions: formData.prescriptions.filter((_, i) => i !== index)
    });
  };
  
  const handleAddLabTest = () => {
    if (!labTest) return;
    
    setFormData({
      ...formData,
      lab_tests: [...formData.lab_tests, labTest]
    });
    
    setLabTest('');
  };
  
  const handleRemoveLabTest = (index: number) => {
    setFormData({
      ...formData,
      lab_tests: formData.lab_tests.filter((_, i) => i !== index)
    });
  };
  
  const handleAddRadiologyTest = () => {
    if (!radiologyTest) return;
    
    setFormData({
      ...formData,
      radiology_tests: [...formData.radiology_tests, radiologyTest]
    });
    
    setRadiologyTest('');
  };
  
  const handleRemoveRadiologyTest = (index: number) => {
    setFormData({
      ...formData,
      radiology_tests: formData.radiology_tests.filter((_, i) => i !== index)
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient) return;
    
    // Validate required fields
    if (!formData.chief_complaint || !formData.diagnosis || !formData.treatment_plan) {
      addNotification({
        message: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save consultation
      const consultationData: Consultation = {
        ...formData,
        id: crypto.randomUUID(),
        doctor_id: 'current-user-id' // In a real app, this would be the logged-in doctor's ID
      };
      
      await saveItem(consultationData);
      
      // Determine next flow step based on ordered tests and prescriptions
      let nextFlowStep = 'post_consultation';
      
      if (formData.lab_tests.length > 0) {
        nextFlowStep = 'lab_tests';
      } else if (formData.radiology_tests.length > 0) {
        nextFlowStep = 'radiology';
      } else if (formData.prescriptions.length > 0) {
        nextFlowStep = 'pharmacy';
      }
      
      // Update patient flow step
      const updatedPatient = {
        ...patient,
        current_flow_step: nextFlowStep
      };
      
      await savePatient(updatedPatient, patient.id);
      
      addNotification({
        message: 'Consultation saved successfully',
        type: 'success'
      });
      
      // Navigate back to patient details
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      console.error('Error saving consultation:', error);
      addNotification({
        message: 'Failed to save consultation',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loadingPatient) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg shadow-sm p-3 mb-3">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate(`/patients/${patientId}`)}
              className="mr-3 text-white hover:bg-primary-600 rounded-full p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
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

        {/* Consultation Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-3 space-y-6">
          <div className="flex items-center mb-2">
            <Stethoscope className="h-5 w-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Consultation Details</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="consultation_date" className="form-label required">Consultation Date</label>
              <input
                type="date"
                id="consultation_date"
                name="consultation_date"
                value={formData.consultation_date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="chief_complaint" className="form-label required">Chief Complaint</label>
              <textarea
                id="chief_complaint"
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleChange}
                rows={2}
                className="form-input"
                placeholder="Patient's main complaint or reason for visit"
                required
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="diagnosis" className="form-label required">Diagnosis</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows={2}
                className="form-input"
                placeholder="Clinical diagnosis"
                required
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="treatment_plan" className="form-label required">Treatment Plan</label>
              <textarea
                id="treatment_plan"
                name="treatment_plan"
                value={formData.treatment_plan}
                onChange={handleChange}
                rows={3}
                className="form-input"
                placeholder="Detailed treatment plan"
                required
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="form-label">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="form-input"
                placeholder="Any additional notes or observations"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="follow_up" className="form-label">Follow-up</label>
              <input
                type="text"
                id="follow_up"
                name="follow_up"
                value={formData.follow_up || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 2 weeks, 1 month, etc."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="medical_certificate"
                name="medical_certificate"
                checked={formData.medical_certificate}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="medical_certificate" className="ml-2 block text-sm text-gray-900">
                Issue Medical Certificate
              </label>
            </div>
          </div>
        </div>
        
        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-3">
          <div className="flex items-center mb-4">
            <Pill className="h-5 w-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Prescriptions</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
            <div className="lg:col-span-1">
              <label htmlFor="medication" className="form-label">Medication</label>
              <input
                type="text"
                id="medication"
                value={medicationInputs.medication}
                onChange={(e) => setMedicationInputs({...medicationInputs, medication: e.target.value})}
                className="form-input"
                placeholder="Medication name"
              />
            </div>
            
            <div className="lg:col-span-1">
              <label htmlFor="dosage" className="form-label">Dosage</label>
              <input
                type="text"
                id="dosage"
                value={medicationInputs.dosage}
                onChange={(e) => setMedicationInputs({...medicationInputs, dosage: e.target.value})}
                className="form-input"
                placeholder="e.g., 500mg"
              />
            </div>
            
            <div className="lg:col-span-1">
              <label htmlFor="frequency" className="form-label">Frequency</label>
              <input
                type="text"
                id="frequency"
                value={medicationInputs.frequency}
                onChange={(e) => setMedicationInputs({...medicationInputs, frequency: e.target.value})}
                className="form-input"
                placeholder="e.g., Twice daily"
              />
            </div>
            
            <div className="lg:col-span-1">
              <label htmlFor="duration" className="form-label">Duration</label>
              <input
                type="text"
                id="duration"
                value={medicationInputs.duration}
                onChange={(e) => setMedicationInputs({...medicationInputs, duration: e.target.value})}
                className="form-input"
                placeholder="e.g., 7 days"
              />
            </div>
            
            <div className="lg:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleAddMedication}
                disabled={!medicationInputs.medication || !medicationInputs.dosage || !medicationInputs.frequency || !medicationInputs.duration}
                className="btn btn-primary w-full"
              >
                Add
              </button>
            </div>
            
            <div className="lg:col-span-5">
              <label htmlFor="instructions" className="form-label">Instructions</label>
              <input
                type="text"
                id="instructions"
                value={medicationInputs.instructions}
                onChange={(e) => setMedicationInputs({...medicationInputs, instructions: e.target.value})}
                className="form-input"
                placeholder="Special instructions (e.g., take with food)"
              />
            </div>
          </div>
          
          {formData.prescriptions.length > 0 ? (
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium text-gray-700">Prescribed Medications</h4>
              {formData.prescriptions.map((prescription, index) => (
                <div key={index} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <div className="flex items-center">
                      <Pill className="h-4 w-4 text-primary-500 mr-2" />
                      <span className="font-medium">{prescription.medication}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{prescription.dosage}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{prescription.frequency}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{prescription.duration}</span>
                    </div>
                    {prescription.instructions && (
                      <p className="text-sm text-gray-600 mt-1 ml-6">
                        Instructions: {prescription.instructions}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    className="text-error-600 hover:text-error-800"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mt-2">No medications prescribed yet</p>
          )}
        </div>
        
        {/* Lab Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-3">
          <div className="flex items-center mb-4">
            <Flask className="h-5 w-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Laboratory Tests</h3>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <div className="flex-grow">
              <select
                value={labTest}
                onChange={(e) => setLabTest(e.target.value)}
                className="form-input"
              >
                <option value="">Select a lab test</option>
                <option value="complete_blood_count">Complete Blood Count (CBC)</option>
                <option value="liver_function">Liver Function Test (LFT)</option>
                <option value="kidney_function">Kidney Function Test</option>
                <option value="lipid_profile">Lipid Profile</option>
                <option value="blood_glucose">Blood Glucose</option>
                <option value="urinalysis">Urinalysis</option>
                <option value="thyroid_function">Thyroid Function Test</option>
                <option value="electrolytes">Electrolytes Panel</option>
                <option value="hba1c">HbA1c</option>
                <option value="coagulation_profile">Coagulation Profile</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddLabTest}
              disabled={!labTest}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
          
          {formData.lab_tests.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Ordered Tests</h4>
              <div className="flex flex-wrap gap-2">
                {formData.lab_tests.map((test, index) => (
                  <div key={index} className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Flask className="h-4 w-4 text-primary-500 mr-2" />
                    <span className="text-sm">
                      {test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabTest(index)}
                      className="ml-2 text-error-600 hover:text-error-800"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No lab tests ordered yet</p>
          )}
        </div>
        
        {/* Radiology Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-3">
          <div className="flex items-center mb-4">
            <Microscope className="h-5 w-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Radiology Tests</h3>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <div className="flex-grow">
              <select
                value={radiologyTest}
                onChange={(e) => setRadiologyTest(e.target.value)}
                className="form-input"
              >
                <option value="">Select a radiology test</option>
                <option value="x_ray">X-Ray</option>
                <option value="ct_scan">CT Scan</option>
                <option value="mri">MRI</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="mammogram">Mammogram</option>
                <option value="pet_scan">PET Scan</option>
                <option value="dexa_scan">DEXA Scan</option>
                <option value="fluoroscopy">Fluoroscopy</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddRadiologyTest}
              disabled={!radiologyTest}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
          
          {formData.radiology_tests.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Ordered Tests</h4>
              <div className="flex flex-wrap gap-2">
                {formData.radiology_tests.map((test, index) => (
                  <div key={index} className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Microscope className="h-4 w-4 text-primary-500 mr-2" />
                    <span className="text-sm">
                      {test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRadiologyTest(index)}
                      className="ml-2 text-error-600 hover:text-error-800"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No radiology tests ordered yet</p>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Consultation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientConsultation;