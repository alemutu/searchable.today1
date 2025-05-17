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
  Search,
  UserPlus,
  Clock,
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
  paymentMethod: string;
  mpesaNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercentage?: number;
  isEmergency: boolean;
  priorityLevel: string;
}

interface ExistingPatient {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [patientType, setPatientType] = useState<"new" | "existing" | "emergency">("new");
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
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
      paymentMethod: "cash",
      isEmergency: false,
      priorityLevel: "normal",
    },
    mode: "onChange",
  });

  const { saveItem, fetchItems } = useHybridStorage<any>("patients");

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
    if (watchIsEmergency) {
      setValue("priorityLevel", "critical");
      setPatientType("emergency");
    }
  }, [watchIsEmergency, setValue]);

  const searchPatients = async () => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    setIsSearching(true);
    setHasSearched(true);
    try {
      const allPatients = await fetchItems();
      if (Array.isArray(allPatients)) {
        const results = allPatients.filter((patient) => {
          const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          return fullName.includes(searchTerm.toLowerCase()) || 
                 patient.contact_number?.includes(searchTerm);
        });
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      addNotification({
        message: "Failed to search patients",
        type: "error",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectExistingPatient = (patient: ExistingPatient) => {
    reset({
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      age: calculateAge(patient.date_of_birth),
      gender: patient.gender,
      contactNumber: patient.contact_number,
      email: patient.email || "",
      address: patient.address,
      emergencyContact: patient.emergency_contact,
      paymentMethod: "cash",
      isEmergency: false,
      priorityLevel: "normal",
    });
    
    setPatientId(patient.id);
    setFormattedPatientId(`PT${patient.id.substring(0, 6).toUpperCase()}`);
    setSearchResults([]);
    setSearchTerm("");
    setCurrentStep(2);
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
        fieldsToValidate = ["paymentMethod", "priorityLevel"];
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
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
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
        status: "active",
        current_flow_step: data.isEmergency ? "emergency" : "registration",
        priority_level: data.priorityLevel,
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            className={`border rounded-lg p-6 cursor-pointer transition-colors ${
              patientType === 'new' ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => {
              setPatientType("new");
              setValue("isEmergency", false);
            }}
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-primary-100 rounded-full">
                <UserPlus className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">New Patient</h3>
            <p className="text-sm text-gray-500">Register a new patient in the system</p>
          </div>
          
          <div 
            className={`border rounded-lg p-6 cursor-pointer transition-colors ${
              patientType === 'existing' ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => {
              setPatientType("existing");
              setValue("isEmergency", false);
            }}
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-primary-100 rounded-full">
                <Search className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Existing Patient</h3>
            <p className="text-sm text-gray-500">Find and update existing patient records</p>
          </div>
          
          <div 
            className={`border rounded-lg p-6 cursor-pointer transition-colors ${
              patientType === 'emergency' ? 'border-error-500 bg-error-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => {
              setPatientType("emergency");
              setValue("isEmergency", true);
              setValue("priorityLevel", "critical");
            }}
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-error-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-error-600" />
              </div>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Emergency</h3>
            <p className="text-sm text-gray-500">Fast-track registration for emergency cases</p>
          </div>
        </div>
        
        {patientType === "existing" && (
          <div className="mt-6 space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 w-full"
                  placeholder="Search by name or phone number"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      searchPatients();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={searchPatients}
                disabled={isSearching || searchTerm.length < 2}
                className="btn btn-primary"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  "Search"
                )}
              </button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gender
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="relative px-4 py-3">
                          <span className="sr-only">Select</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => selectExistingPatient(patient)}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{patient.gender}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{patient.contact_number}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              className="text-primary-600 hover:text-primary-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectExistingPatient(patient);
                              }}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : hasSearched && !isSearching ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">No patients found</p>
                <p className="text-gray-500 text-sm mt-1">No patients found matching "{searchTerm}"</p>
                <button
                  type="button"
                  onClick={() => {
                    setPatientType("new");
                    setValue("isEmergency", false);
                  }}
                  className="mt-4 btn btn-outline text-sm"
                >
                  Register as new patient
                </button>
              </div>
            ) : null}
          </div>
        )}
        
        {patientType === "emergency" && (
          <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-error-800">Emergency Registration</p>
                <p className="text-sm text-error-700 mt-1">
                  This patient will be marked as an emergency case with critical priority. 
                  Some information can be collected later if needed.
                </p>
              </div>
            </div>
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
                {...register("dateOfBirth", {
                  onChange: (e) => {
                    if (e.target.value) {
                      setValue("age", calculateAge(e.target.value));
                    }
                  }
                })}
                className="form-input pl-10"
                max={new Date().toISOString().split('T')[0]}
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
                {...register("email", {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={`form-input pl-10 ${
                  errors.email ? "border-error-300" : ""
                }`}
                placeholder="patient@example.com"
              />
            </div>
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-gray-900 flex items-center">
              <Phone className="h-4 w-4 text-primary-500 mr-2" />
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
      </div>
    );
  };

  const renderPriorityStep = () => {
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Priority & Payment Information</h2>
        <p className="text-sm text-gray-600 mb-6">Set patient priority and payment details</p>
        
        <div className="space-y-6">
          {/* Priority Level */}
          <div>
            <label className="form-label required">Priority Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  !isEmergency && watch("priorityLevel") === 'normal' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                } ${isEmergency ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isEmergency && setValue("priorityLevel", "normal")}
              >
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-success-100 rounded-full mr-2">
                    <Clock className="h-4 w-4 text-success-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Normal</span>
                </div>
                <p className="text-xs text-gray-500">Standard priority for routine cases</p>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  !isEmergency && watch("priorityLevel") === 'urgent' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                } ${isEmergency ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isEmergency && setValue("priorityLevel", "urgent")}
              >
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-warning-100 rounded-full mr-2">
                    <Clock className="h-4 w-4 text-warning-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Urgent</span>
                </div>
                <p className="text-xs text-gray-500">Higher priority for urgent cases</p>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  watch("priorityLevel") === 'critical' ? 'border-error-500 bg-error-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                } ${isEmergency ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isEmergency && setValue("priorityLevel", "critical")}
              >
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-error-100 rounded-full mr-2">
                    <AlertTriangle className="h-4 w-4 text-error-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Critical</span>
                </div>
                <p className="text-xs text-gray-500">Highest priority for critical cases</p>
              </div>
            </div>
            {errors.priorityLevel && (
              <p className="form-error mt-2">{errors.priorityLevel.message}</p>
            )}
            {isEmergency && (
              <p className="mt-2 text-xs text-error-600 flex items-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Emergency cases are automatically set to critical priority
              </p>
            )}
          </div>
          
          {/* Payment Method */}
          <div>
            <label className="form-label required">Payment Method</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue("paymentMethod", "cash")}
              >
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-primary-100 rounded-full mr-2">
                    <CreditCard className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Cash</span>
                </div>
                <p className="text-xs text-gray-500">Pay with cash at the facility</p>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'insurance' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue("paymentMethod", "insurance")}
              >
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-primary-100 rounded-full mr-2">
                    <Building2 className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Insurance</span>
                </div>
                <p className="text-xs text-gray-500">Pay using health insurance</p>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'mpesa' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue("paymentMethod", "mpesa")}
              >
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-primary-100 rounded-full mr-2">
                    <Smartphone className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">M-Pesa</span>
                </div>
                <p className="text-xs text-gray-500">Pay using mobile money</p>
              </div>
            </div>
            {errors.paymentMethod && (
              <p className="form-error mt-2">{errors.paymentMethod.message}</p>
            )}
          </div>

          {paymentMethod === "insurance" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Building2 className="h-4 w-4 text-primary-500 mr-2" />
                Insurance Details
              </h3>
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
                    placeholder="e.g., Blue Cross, Aetna"
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
                    placeholder="e.g., ABC123456789"
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
                  <div className="relative">
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
                      className={`form-input pr-8 ${
                        errors.insuranceCoveragePercentage
                          ? "border-error-300"
                          : ""
                      }`}
                      placeholder="e.g., 80"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
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
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Smartphone className="h-4 w-4 text-primary-500 mr-2" />
                M-Pesa Details
              </h3>
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
                <p className="mt-1 text-xs text-gray-500">
                  Enter the M-Pesa number in the format 254XXXXXXXXX or 07XXXXXXXX
                </p>
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
            <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 text-primary-500 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Patient ID:</div>
              <div className="font-medium">{formattedPatientId}</div>
              
              <div className="text-gray-500">Name:</div>
              <div className="font-medium">{formData.firstName} {formData.lastName}</div>
              
              <div className="text-gray-500">Age:</div>
              <div className="font-medium">{formData.age} years</div>
              
              <div className="text-gray-500">Gender:</div>
              <div className="font-medium">{formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}</div>
              
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
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                <Phone className="h-4 w-4 text-primary-500 mr-2" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-gray-500">Name:</div>
                <div className="font-medium">{formData.emergencyContact.name}</div>
                
                <div className="text-gray-500">Relationship:</div>
                <div className="font-medium">
                  {formData.emergencyContact.relationship.charAt(0).toUpperCase() + 
                   formData.emergencyContact.relationship.slice(1)}
                </div>
                
                <div className="text-gray-500">Phone:</div>
                <div className="font-medium">{formData.emergencyContact.phone}</div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 text-primary-500 mr-2" />
              Priority & Payment
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Priority Level:</div>
              <div className="font-medium flex items-center">
                {formData.priorityLevel === 'critical' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 mr-1">
                    Critical
                  </span>
                )}
                {formData.priorityLevel === 'urgent' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 mr-1">
                    Urgent
                  </span>
                )}
                {formData.priorityLevel === 'normal' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 mr-1">
                    Normal
                  </span>
                )}
              </div>
              
              <div className="text-gray-500">Payment Method:</div>
              <div className="font-medium">{formData.paymentMethod.charAt(0).toUpperCase() + formData.paymentMethod.slice(1)}</div>
              
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
              disabled={currentStep === 1 && patientType === "existing" && searchResults.length === 0}
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