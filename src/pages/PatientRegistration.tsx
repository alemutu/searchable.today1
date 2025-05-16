import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../lib/store';
import { User, Phone, Mail, MapPin, Calendar, UserPlus, ArrowLeft, AlertTriangle } from 'lucide-react';

interface PatientFormData {
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

const PatientRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { saveItem } = useHybridStorage<PatientFormData>('patients');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    email: '',
    address: '',
    emergency_contact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medical_info: {
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      bloodType: '',
      smoker: false,
      alcoholConsumption: 'none'
    },
    status: 'active',
    current_flow_step: 'registration'
  });
  
  const [allergyInputs, setAllergyInputs] = useState({
    allergen: '',
    reaction: '',
    severity: 'mild'
  });
  
  const [medicationInputs, setMedicationInputs] = useState({
    name: '',
    dosage: '',
    frequency: ''
  });
  
  const [chronicCondition, setChronicCondition] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof PatientFormData],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof PatientFormData],
          [child]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: checked
      });
    }
  };
  
  const handleAddAllergy = () => {
    if (!allergyInputs.allergen || !allergyInputs.reaction) return;
    
    setFormData({
      ...formData,
      medical_info: {
        ...formData.medical_info,
        allergies: [
          ...formData.medical_info.allergies,
          { ...allergyInputs }
        ]
      }
    });
    
    setAllergyInputs({
      allergen: '',
      reaction: '',
      severity: 'mild'
    });
  };
  
  const handleRemoveAllergy = (index: number) => {
    setFormData({
      ...formData,
      medical_info: {
        ...formData.medical_info,
        allergies: formData.medical_info.allergies.filter((_, i) => i !== index)
      }
    });
  };
  
  const handleAddMedication = () => {
    if (!medicationInputs.name || !medicationInputs.dosage || !medicationInputs.frequency) return;
    
    setFormData({
      ...formData,
      medical_info: {
        ...formData.medical_info,
        currentMedications: [
          ...formData.medical_info.currentMedications,
          { ...medicationInputs }
        ]
      }
    });
    
    setMedicationInputs({
      name: '',
      dosage: '',
      frequency: ''
    });
  };
  
  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      medical_info: {
        ...formData.medical_info,
        currentMedications: formData.medical_info.currentMedications.filter((_, i) => i !== index)
      }
    });
  };
  
  const handleAddChronicCondition = () => {
    if (!chronicCondition) return;
    
    setFormData({
      ...formData,
      medical_info: {
        ...formData.medical_info,
        chronicConditions: [
          ...formData.medical_info.chronicConditions,
          chronicCondition
        ]
      }
    });
    
    setChronicCondition('');
  };
  
  const handleRemoveChronicCondition = (index: number) => {
    setFormData({
      ...formData,
      medical_info: {
        ...formData.medical_info,
        chronicConditions: formData.medical_info.chronicConditions.filter((_, i) => i !== index)
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth || 
        !formData.gender || !formData.contact_number || !formData.address ||
        !formData.emergency_contact.name || !formData.emergency_contact.phone) {
      addNotification({
        message: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save patient data to local storage
      const savedPatient = await saveItem(formData);
      
      addNotification({
        message: `Patient ${formData.first_name} ${formData.last_name} registered successfully`,
        type: 'success'
      });
      
      // Navigate to patient details page
      navigate(`/patients/${savedPatient.id}`);
    } catch (error) {
      console.error('Error registering patient:', error);
      addNotification({
        message: 'Failed to register patient',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Patient Registration</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="form-label required">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="form-label required">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="date_of_birth" className="form-label required">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="gender" className="form-label required">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contact_number" className="form-label required">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input pl-10"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="address" className="form-label required">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="emergency_contact.name" className="form-label required">Contact Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="emergency_contact.name"
                  name="emergency_contact.name"
                  value={formData.emergency_contact.name}
                  onChange={handleChange}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="emergency_contact.relationship" className="form-label">Relationship</label>
              <input
                type="text"
                id="emergency_contact.relationship"
                name="emergency_contact.relationship"
                value={formData.emergency_contact.relationship}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div>
              <label htmlFor="emergency_contact.phone" className="form-label required">Contact Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="emergency_contact.phone"
                  name="emergency_contact.phone"
                  value={formData.emergency_contact.phone}
                  onChange={handleChange}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Medical Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h2>
          
          {/* Allergies */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">Allergies</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-2">
              <div>
                <label htmlFor="allergy-name" className="form-label">Allergen</label>
                <input
                  type="text"
                  id="allergy-name"
                  value={allergyInputs.allergen}
                  onChange={(e) => setAllergyInputs({...allergyInputs, allergen: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label htmlFor="allergy-reaction" className="form-label">Reaction</label>
                <input
                  type="text"
                  id="allergy-reaction"
                  value={allergyInputs.reaction}
                  onChange={(e) => setAllergyInputs({...allergyInputs, reaction: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label htmlFor="allergy-severity" className="form-label">Severity</label>
                <select
                  id="allergy-severity"
                  value={allergyInputs.severity}
                  onChange={(e) => setAllergyInputs({...allergyInputs, severity: e.target.value})}
                  className="form-input"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life_threatening">Life-threatening</option>
                </select>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddAllergy}
              className="btn btn-outline text-sm py-1 px-3"
              disabled={!allergyInputs.allergen || !allergyInputs.reaction}
            >
              Add Allergy
            </button>
            
            {formData.medical_info.allergies.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.medical_info.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div>
                      <span className="font-medium">{allergy.allergen}</span>
                      <span className="mx-2">-</span>
                      <span>{allergy.reaction}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200">
                        {allergy.severity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(index)}
                      className="text-error-600 hover:text-error-800"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Chronic Conditions */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">Chronic Conditions</h3>
            
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={chronicCondition}
                onChange={(e) => setChronicCondition(e.target.value)}
                className="form-input flex-1"
                placeholder="Enter chronic condition"
              />
              <button
                type="button"
                onClick={handleAddChronicCondition}
                className="btn btn-outline text-sm py-1 px-3"
                disabled={!chronicCondition}
              >
                Add
              </button>
            </div>
            
            {formData.medical_info.chronicConditions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.medical_info.chronicConditions.map((condition, index) => (
                  <div key={index} className="flex items-center bg-gray-50 px-3 py-1 rounded">
                    <span>{condition}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChronicCondition(index)}
                      className="ml-2 text-error-600 hover:text-error-800"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Current Medications */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">Current Medications</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-2">
              <div>
                <label htmlFor="medication-name" className="form-label">Medication</label>
                <input
                  type="text"
                  id="medication-name"
                  value={medicationInputs.name}
                  onChange={(e) => setMedicationInputs({...medicationInputs, name: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label htmlFor="medication-dosage" className="form-label">Dosage</label>
                <input
                  type="text"
                  id="medication-dosage"
                  value={medicationInputs.dosage}
                  onChange={(e) => setMedicationInputs({...medicationInputs, dosage: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label htmlFor="medication-frequency" className="form-label">Frequency</label>
                <input
                  type="text"
                  id="medication-frequency"
                  value={medicationInputs.frequency}
                  onChange={(e) => setMedicationInputs({...medicationInputs, frequency: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddMedication}
              className="btn btn-outline text-sm py-1 px-3"
              disabled={!medicationInputs.name || !medicationInputs.dosage || !medicationInputs.frequency}
            >
              Add Medication
            </button>
            
            {formData.medical_info.currentMedications.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.medical_info.currentMedications.map((medication, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div>
                      <span className="font-medium">{medication.name}</span>
                      <span className="mx-2">-</span>
                      <span>{medication.dosage}</span>
                      <span className="mx-2">-</span>
                      <span>{medication.frequency}</span>
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
            )}
          </div>
          
          {/* Other Medical Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="medical_info.bloodType" className="form-label">Blood Type</label>
              <select
                id="medical_info.bloodType"
                name="medical_info.bloodType"
                value={formData.medical_info.bloodType}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="medical_info.alcoholConsumption" className="form-label">Alcohol Consumption</label>
              <select
                id="medical_info.alcoholConsumption"
                name="medical_info.alcoholConsumption"
                value={formData.medical_info.alcoholConsumption}
                onChange={handleChange}
                className="form-input"
              >
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="medical_info.smoker"
                name="medical_info.smoker"
                checked={formData.medical_info.smoker}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="medical_info.smoker" className="ml-2 block text-sm text-gray-900">
                Smoker
              </label>
            </div>
          </div>
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
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Register Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;