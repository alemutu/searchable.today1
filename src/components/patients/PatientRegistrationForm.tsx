import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../lib/store";
import { useHybridStorage } from "../../lib/hooks/useHybridStorage";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  Save,
  ArrowLeft,
  Plus,
  Minus,
  CreditCard,
  Building2,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    bloodType: string;
    smoker: boolean;
    alcoholConsumption: string;
  };
  paymentMethod: string;
  mpesaNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercentage?: number;
  isEmergency: boolean;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [patientId, setPatientId] = useState<string>("");
  const [formattedPatientId, setFormattedPatientId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<PatientFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: 0,
      gender: "",
      contactNumber: "",
      email: "",
      address: "",
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
      },
      medicalInfo: {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        bloodType: "",
        smoker: false,
        alcoholConsumption: "none",
      },
      paymentMethod: "cash",
      isEmergency: false,
    },
    mode: "onChange",
  });

  const { saveItem } = useHybridStorage<any>("patients");

  const paymentMethod = watch("paymentMethod");
  const watchIsEmergency = watch("isEmergency");

  useEffect(() => {
    // Generate a unique patient ID
    const newPatientId = uuidv4();
    setPatientId(newPatientId);

    // Format the patient ID for display (e.g., PT-12345)
    const shortId = newPatientId.substring(0, 6).toUpperCase();
    setFormattedPatientId(`PT${shortId}`);
  }, []);

  useEffect(() => {
    setIsEmergency(watchIsEmergency);
  }, [watchIsEmergency]);

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1: // Patient Type
        setCurrentStep(2);
        break;
      case 2: // Personal Info
        fieldsToValidate = ["firstName", "lastName", "age", "gender", "contactNumber", "address"];
        break;
      case 3: // Contact
        fieldsToValidate = [];
        if (showEmergencyContact) {
          fieldsToValidate = ["emergencyContact.name", "emergencyContact.relationship", "emergencyContact.phone"];
        }
        break;
      case 4: // Priority/Payment
        fieldsToValidate = ["paymentMethod"];
        if (paymentMethod === "insurance") {
          fieldsToValidate.push("insuranceProvider", "insurancePolicyNumber", "insuranceCoveragePercentage");
        } else if (paymentMethod === "mpesa") {
          fieldsToValidate.push("mpesaNumber");
        }
        break;
    }

    if (fieldsToValidate.length > 0) {
      const result = await trigger(fieldsToValidate as any);
      if (!result) return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      // Create patient object
      const patient = {
        id: patientId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
        gender: data.gender,
        contact_number: data.contactNumber,
        email: data.email || null,
        address: data.address,
        emergency_contact: data.emergencyContact,
        medical_info: {
          allergies: data.medicalInfo.allergies,
          chronicConditions: data.medicalInfo.chronicConditions,
          currentMedications: data.medicalInfo.currentMedications,
          bloodType: data.medicalInfo.bloodType,
          smoker: data.medicalInfo.smoker,
          alcoholConsumption: data.medicalInfo.alcoholConsumption,
        },
        status: "active",
        current_flow_step: data.isEmergency ? "emergency" : "registration",
        payment_info: {
          method: data.paymentMethod,
          ...(data.paymentMethod === "insurance" && {
            provider: data.insuranceProvider,
            policy_number: data.insurancePolicyNumber,
            coverage_percentage: data.insuranceCoveragePercentage,
          }),
          ...(data.paymentMethod === "mpesa" && {
            mpesa_number: data.mpesaNumber,
          }),
        },
        created_at: new Date().toISOString(),
      };

      // Save patient data
      await saveItem(patient, patientId);

      // Show success notification
      addNotification({
        message: `Patient ${data.firstName} ${data.lastName} registered successfully`,
        type: "success",
      });

      // Redirect to the reception dashboard
      navigate("/reception");
    } catch (error) {
      console.error("Error registering patient:", error);
      addNotification({
        message: "Failed to register patient",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 1 ? <Check className="h-5 w-5" /> : 1}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 1 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 2 ? <Check className="h-5 w-5" /> : 2}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 2 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 3 ? <Check className="h-5 w-5" /> : 3}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 3 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 4 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 4 ? <Check className="h-5 w-5" /> : 4}
            </div>
            <div className={`h-1 w-10 ${
              currentStep > 4 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 5 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              5
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Step {currentStep} of 5
          </div>
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500 max-w-md">
          <div className={currentStep === 1 ? 'text-primary-600 font-medium' : ''}>Patient Type</div>
          <div className={currentStep === 2 ? 'text-primary-600 font-medium' : ''}>Personal Info</div>
          <div className={currentStep === 3 ? 'text-primary-600 font-medium' : ''}>Contact</div>
          <div className={currentStep === 4 ? 'text-primary-600 font-medium' : ''}>Priority</div>
          <div className={currentStep === 5 ? 'text-primary-600 font-medium' : ''}>Review</div>
        </div>
      </div>
    );
  };

  const renderPatientTypeStep = () => {
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Type</h2>
        <p className="text-sm text-gray-600 mb-6">Select the appropriate patient type</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              !isEmergency ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setValue("isEmergency", false)}
          >
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-primary-500 mr-2" />
              <h3 className="text-base font-medium text-gray-900">New Patient</h3>
            </div>
            <p className="text-sm text-gray-500">Register a new patient</p>
          </div>
          
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              isEmergency ? 'border-error-500 bg-error-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setValue("isEmergency", true)}
          >
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
              <h3 className="text-base font-medium text-gray-900">Emergency</h3>
            </div>
            <p className="text-sm text-gray-500">Fast-track emergency case</p>
          </div>
        </div>
        
        {isEmergency && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
            <p className="text-sm text-error-700 flex items-start">
              <AlertTriangle className="h-4 w-4 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
              Emergency cases will be prioritized and some information can be collected later.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderPersonalInfoStep = () => {
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <p className="text-sm text-gray-600 mb-6">Enter the patient's personal details</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label required">First Name</label>
            <input
              type="text"
              {...register("firstName", { required: "First name is required" })}
              className={`form-input ${
                errors.firstName ? "border-error-300" : ""
              }`}
            />
            {errors.firstName && (
              <p className="form-error">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="form-label required">Last Name</label>
            <input
              type="text"
              {...register("lastName", { required: "Last name is required" })}
              className={`form-input ${
                errors.lastName ? "border-error-300" : ""
              }`}
            />
            {errors.lastName && (
              <p className="form-error">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Date of Birth</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                {...register("dateOfBirth")}
                className="form-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="form-label required">Age</label>
            <input
              type="number"
              {...register("age", { 
                required: "Age is required",
                min: { value: 0, message: "Age must be positive" },
                max: { value: 120, message: "Age must be less than 120" }
              })}
              className={`form-input ${errors.age ? "border-error-300" : ""}`}
            />
            {errors.age && <p className="form-error">{errors.age.message}</p>}
          </div>

          <div>
            <label className="form-label required">Gender</label>
            <select
              {...register("gender", { required: "Gender is required" })}
              className={`form-input ${
                errors.gender ? "border-error-300" : ""
              }`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="form-error">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Patient ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formattedPatientId}
                readOnly
                className="form-input pl-10 bg-gray-50"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier</p>
          </div>

          <div className="md:col-span-2">
            <label className="form-label required">Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                {...register("address", { required: "Address is required" })}
                className={`form-input pl-10 ${
                  errors.address ? "border-error-300" : ""
                }`}
                rows={2}
                placeholder="Enter complete address"
              />
            </div>
            {errors.address && (
              <p className="form-error">{errors.address.message}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContactStep = () => {
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
        <p className="text-sm text-gray-600 mb-6">Enter contact details and emergency contact information</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="form-label required">Contact Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                {...register("contactNumber", {
                  required: "Contact number is required",
                })}
                className={`form-input pl-10 ${
                  errors.contactNumber ? "border-error-300" : ""
                }`}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            {errors.contactNumber && (
              <p className="form-error">{errors.contactNumber.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                {...register("email")}
                className="form-input pl-10"
                placeholder="patient@example.com"
              />
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-gray-900">
              Emergency Contact
            </h3>
            <button
              type="button"
              onClick={() => setShowEmergencyContact(!showEmergencyContact)}
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
            >
              {showEmergencyContact ? (
                <>
                  <Minus className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Show
                </>
              )}
            </button>
          </div>
          
          {showEmergencyContact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Name</label>
                <input
                  type="text"
                  {...register("emergencyContact.name")}
                  className="form-input"
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <label className="form-label">Relationship</label>
                <select
                  {...register("emergencyContact.relationship")}
                  className="form-input"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register("emergencyContact.phone")}
                    className="form-input pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Click "Show" to add emergency contact information (optional)
            </p>
          )}
        </div>
        
        {/* Medical Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Medical Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Blood Type</label>
              <select
                {...register("medicalInfo.bloodType")}
                className="form-input"
              >
                <option value="">Select blood type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="form-label">Allergies</label>
              <input
                type="text"
                {...register("medicalInfo.allergies")}
                className="form-input"
                placeholder="Separate with commas (e.g., Penicillin, Peanuts)"
              />
            </div>

            <div>
              <label className="form-label">Chronic Conditions</label>
              <input
                type="text"
                {...register("medicalInfo.chronicConditions")}
                className="form-input"
                placeholder="Separate with commas (e.g., Diabetes, Hypertension)"
              />
            </div>

            <div>
              <label className="form-label">Current Medications</label>
              <input
                type="text"
                {...register("medicalInfo.currentMedications")}
                className="form-input"
                placeholder="Separate with commas (e.g., Insulin, Lisinopril)"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPriorityStep = () => {
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
        <p className="text-sm text-gray-600 mb-6">Select payment method and provide necessary details</p>
        
        <div className="space-y-6">
          <div>
            <label className="form-label required">Payment Method</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue("paymentMethod", "cash")}
              >
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Cash</span>
                </div>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue("paymentMethod", "insurance")}
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Insurance</span>
                </div>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'mpesa' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue("paymentMethod", "mpesa")}
              >
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">M-Pesa</span>
                </div>
              </div>
            </div>
            {errors.paymentMethod && (
              <p className="form-error mt-2">{errors.paymentMethod.message}</p>
            )}
          </div>

          {paymentMethod === "insurance" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">Insurance Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label required">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    {...register("insuranceProvider", {
                      required:
                        paymentMethod === "insurance"
                          ? "Insurance provider is required"
                          : false,
                    })}
                    className={`form-input ${
                      errors.insuranceProvider ? "border-error-300" : ""
                    }`}
                  />
                  {errors.insuranceProvider && (
                    <p className="form-error">
                      {errors.insuranceProvider.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label required">Policy Number</label>
                  <input
                    type="text"
                    {...register("insurancePolicyNumber", {
                      required:
                        paymentMethod === "insurance"
                          ? "Policy number is required"
                          : false,
                    })}
                    className={`form-input ${
                      errors.insurancePolicyNumber ? "border-error-300" : ""
                    }`}
                  />
                  {errors.insurancePolicyNumber && (
                    <p className="form-error">
                      {errors.insurancePolicyNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label required">
                    Coverage Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register("insuranceCoveragePercentage", {
                      required:
                        paymentMethod === "insurance"
                          ? "Coverage percentage is required"
                          : false,
                      min: {
                        value: 0,
                        message: "Minimum coverage is 0%",
                      },
                      max: {
                        value: 100,
                        message: "Maximum coverage is 100%",
                      },
                    })}
                    className={`form-input ${
                      errors.insuranceCoveragePercentage
                        ? "border-error-300"
                        : ""
                    }`}
                  />
                  {errors.insuranceCoveragePercentage && (
                    <p className="form-error">
                      {errors.insuranceCoveragePercentage.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "mpesa" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">M-Pesa Details</h3>
              <div>
                <label className="form-label required">M-Pesa Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register("mpesaNumber", {
                      required:
                        paymentMethod === "mpesa"
                          ? "M-Pesa number is required"
                          : false,
                      pattern: {
                        value: /^(?:\+?254|0)[17]\d{8}$/,
                        message: "Please enter a valid M-Pesa number",
                      },
                    })}
                    className={`form-input pl-10 ${
                      errors.mpesaNumber ? "border-error-300" : ""
                    }`}
                    placeholder="e.g., 254712345678"
                  />
                </div>
                {errors.mpesaNumber && (
                  <p className="form-error">{errors.mpesaNumber.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    const formData = watch();
    
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Review Information</h2>
        <p className="text-sm text-gray-600 mb-6">Please review the patient information before submitting</p>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-medium text-gray-900 mb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Patient ID:</div>
              <div className="font-medium">{formattedPatientId}</div>
              
              <div className="text-gray-500">Name:</div>
              <div className="font-medium">{formData.firstName} {formData.lastName}</div>
              
              <div className="text-gray-500">Age:</div>
              <div className="font-medium">{formData.age} years</div>
              
              <div className="text-gray-500">Gender:</div>
              <div className="font-medium">{formData.gender}</div>
              
              <div className="text-gray-500">Contact:</div>
              <div className="font-medium">{formData.contactNumber}</div>
              
              {formData.email && (
                <>
                  <div className="text-gray-500">Email:</div>
                  <div className="font-medium">{formData.email}</div>
                </>
              )}
              
              <div className="text-gray-500">Address:</div>
              <div className="font-medium">{formData.address}</div>
            </div>
          </div>
          
          {showEmergencyContact && formData.emergencyContact.name && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-medium text-gray-900 mb-2">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Name:</div>
                <div className="font-medium">{formData.emergencyContact.name}</div>
                
                <div className="text-gray-500">Relationship:</div>
                <div className="font-medium">{formData.emergencyContact.relationship}</div>
                
                <div className="text-gray-500">Phone:</div>
                <div className="font-medium">{formData.emergencyContact.phone}</div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-medium text-gray-900 mb-2">Payment Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Method:</div>
              <div className="font-medium">{formData.paymentMethod}</div>
              
              {formData.paymentMethod === "insurance" && (
                <>
                  <div className="text-gray-500">Provider:</div>
                  <div className="font-medium">{formData.insuranceProvider}</div>
                  
                  <div className="text-gray-500">Policy Number:</div>
                  <div className="font-medium">{formData.insurancePolicyNumber}</div>
                  
                  <div className="text-gray-500">Coverage:</div>
                  <div className="font-medium">{formData.insuranceCoveragePercentage}%</div>
                </>
              )}
              
              {formData.paymentMethod === "mpesa" && (
                <>
                  <div className="text-gray-500">M-Pesa Number:</div>
                  <div className="font-medium">{formData.mpesaNumber}</div>
                </>
              )}
            </div>
          </div>
          
          {formData.isEmergency && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-base font-medium text-error-800">Emergency Case</h3>
                <p className="text-sm text-error-700">This patient will be marked as an emergency case and prioritized accordingly.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPatientTypeStep();
      case 2:
        return renderPersonalInfoStep();
      case 3:
        return renderContactStep();
      case 4:
        return renderPriorityStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="mr-3 p-1.5 rounded-full text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Patient Registration</h1>
              <p className="text-primary-100 text-sm">Register new or manage existing patients</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}

          {currentStep < 5 ? (
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
              disabled={isSubmitting}
              className="btn btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Patient
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;