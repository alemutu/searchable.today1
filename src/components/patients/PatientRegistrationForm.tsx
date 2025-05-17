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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
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
  });

  const { saveItem } = useHybridStorage<any>("patients");

  const paymentMethod = watch("paymentMethod");
  const watchIsEmergency = watch("isEmergency");

  useEffect(() => {
    // Generate a unique patient ID
    const newPatientId = uuidv4();
    setPatientId(newPatientId);

    // Format the patient ID for display (e.g., PT-12345)
    const shortId = newPatientId.substring(0, 8).toUpperCase();
    setFormattedPatientId(`PT-${shortId}`);
  }, []);

  useEffect(() => {
    setIsEmergency(watchIsEmergency);
  }, [watchIsEmergency]);

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
        medical_info: data.medicalInfo,
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

      // Redirect to the registration dashboard instead of triage
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

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <User className="h-5 w-5 text-primary-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">
              Patient Registration
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">Patient ID:</div>
            <div className="font-mono text-sm font-medium bg-gray-100 px-2 py-1 rounded">
              {formattedPatientId}
            </div>
          </div>
        </div>

        {/* Emergency Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isEmergency"
              {...register("isEmergency")}
              className="h-4 w-4 text-error-600 focus:ring-error-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isEmergency"
              className="ml-2 flex items-center text-sm font-medium text-error-700"
            >
              <AlertTriangle className="h-4 w-4 mr-1 text-error-500" />
              This is an emergency case
            </label>
          </div>
          {isEmergency && (
            <div className="mt-2 p-2 bg-error-50 border border-error-200 rounded-md text-sm text-error-700">
              <p>
                Emergency cases will be prioritized and some information can be
                collected later.
              </p>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Personal Information
          </h2>
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

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-900">
              Emergency Contact
            </h2>
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
          
          {showEmergencyContact && (
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
          )}
          
          {!showEmergencyContact && (
            <p className="text-sm text-gray-500 italic">
              Click "Show" to add emergency contact information (optional)
            </p>
          )}
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Medical Information
          </h2>
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

            <div>
              <label className="form-label">Alcohol Consumption</label>
              <select
                {...register("medicalInfo.alcoholConsumption")}
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
                id="smoker"
                {...register("medicalInfo.smoker")}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="smoker"
                className="ml-2 block text-sm text-gray-900"
              >
                Smoker
              </label>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Payment Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="form-label required">Payment Method</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cash"
                    value="cash"
                    {...register("paymentMethod", {
                      required: "Payment method is required",
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label
                    htmlFor="cash"
                    className="ml-2 flex items-center text-sm text-gray-900"
                  >
                    <CreditCard className="h-4 w-4 mr-1 text-gray-500" />
                    Cash
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="insurance"
                    value="insurance"
                    {...register("paymentMethod")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label
                    htmlFor="insurance"
                    className="ml-2 flex items-center text-sm text-gray-900"
                  >
                    <Building2 className="h-4 w-4 mr-1 text-gray-500" />
                    Insurance
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="mpesa"
                    value="mpesa"
                    {...register("paymentMethod")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label
                    htmlFor="mpesa"
                    className="ml-2 flex items-center text-sm text-gray-900"
                  >
                    <Smartphone className="h-4 w-4 mr-1 text-gray-500" />
                    M-Pesa
                  </label>
                </div>
              </div>
              {errors.paymentMethod && (
                <p className="form-error">{errors.paymentMethod.message}</p>
              )}
            </div>

            {paymentMethod === "insurance" && (
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
            )}

            {paymentMethod === "mpesa" && (
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
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </button>

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
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;