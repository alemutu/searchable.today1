import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { hospitalOnboardingApi } from '../lib/api';
import { 
  Building2, 
  User, 
  Package, 
  CreditCard, 
  Key, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X, 
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  Lock,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

// Step 1: Hospital Profile
interface HospitalProfileForm {
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
}

// Step 2: Admin Setup
interface AdminSetupForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  sendCredentials: boolean;
}

// Step 3: Module Selection
interface ModuleSelectionForm {
  outpatient: string[];
  inpatient: string[];
  shared: string[];
  addons: string[];
}

// Step 4: Pricing Plan
interface PricingPlanForm {
  plan: string;
}

// Step 5: License Details
interface LicenseDetailsForm {
  startDate: string;
  type: 'monthly' | 'yearly' | 'lifetime';
  autoRenew: boolean;
  notes: string;
}

// Available modules
const availableModules = {
  outpatient: [
    { id: 'patient_management', name: 'Patient Management', description: 'Registration, medical records, appointments' },
    { id: 'appointment_scheduling', name: 'Appointment Scheduling', description: 'Calendar, reminders, online booking' },
    { id: 'outpatient_billing', name: 'Outpatient Billing', description: 'Invoicing, payments, insurance claims' }
  ],
  inpatient: [
    { id: 'ward_management', name: 'Ward Management', description: 'Bed allocation, patient tracking, discharge planning' },
    { id: 'nursing_station', name: 'Nursing Station', description: 'Care plans, medication administration, vital signs' },
    { id: 'inpatient_billing', name: 'Inpatient Billing', description: 'Room charges, service billing, package rates' }
  ],
  shared: [
    { id: 'pharmacy', name: 'Pharmacy', description: 'Inventory, dispensing, prescriptions' },
    { id: 'laboratory', name: 'Laboratory', description: 'Test orders, results, reporting' },
    { id: 'radiology', name: 'Radiology', description: 'Imaging orders, results, PACS integration' },
    { id: 'billing', name: 'Billing', description: 'Invoicing, payments, insurance claims' }
  ],
  addons: [
    { id: 'telemedicine', name: 'Telemedicine', description: 'Video consultations, remote monitoring' },
    { id: 'analytics', name: 'Advanced Analytics', description: 'Business intelligence, reporting, dashboards' },
    { id: 'patient_portal', name: 'Patient Portal', description: 'Online access, appointment booking, test results' }
  ]
};

// Available pricing plans
const pricingPlans = [
  { 
    id: 'basic', 
    name: 'Basic', 
    price: 99, 
    description: 'Essential features for small clinics',
    features: [
      'Up to 5 users',
      'Patient management',
      'Appointment scheduling',
      'Basic reporting',
      '5GB storage',
      'Email support'
    ]
  },
  { 
    id: 'standard', 
    name: 'Standard', 
    price: 199, 
    description: 'Comprehensive solution for growing practices',
    features: [
      'Up to 15 users',
      'All Basic features',
      'Laboratory integration',
      'Pharmacy management',
      'Billing & invoicing',
      '20GB storage',
      'Priority email & phone support'
    ]
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    price: 399, 
    description: 'Advanced features for hospitals',
    features: [
      'Unlimited users',
      'All Standard features',
      'Inpatient management',
      'Advanced analytics',
      'Custom integrations',
      '100GB storage',
      '24/7 premium support'
    ]
  }
];

const HospitalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Form state
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfileForm>({
    name: '',
    subdomain: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: ''
  });
  
  const [adminSetup, setAdminSetup] = useState<AdminSetupForm>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    sendCredentials: true
  });
  
  const [moduleSelection, setModuleSelection] = useState<ModuleSelectionForm>({
    outpatient: ['patient_management', 'appointment_scheduling'],
    inpatient: [],
    shared: ['pharmacy', 'laboratory', 'billing'],
    addons: []
  });
  
  const [pricingPlan, setPricingPlan] = useState<PricingPlanForm>({
    plan: 'standard'
  });
  
  const [licenseDetails, setLicenseDetails] = useState<LicenseDetailsForm>({
    startDate: new Date().toISOString().split('T')[0],
    type: 'monthly',
    autoRenew: true,
    notes: ''
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Check if subdomain is available
  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }
    
    setIsCheckingSubdomain(true);
    setNetworkError(null);
    try {
      console.log('Checking subdomain availability for:', subdomain);
      const { available } = await hospitalOnboardingApi.checkSubdomain(subdomain);
      console.log('Subdomain availability result:', available);
      setSubdomainAvailable(available);
    } catch (error: any) {
      console.error('Error checking subdomain:', error);
      setNetworkError(error.message);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };
  
  // Handle subdomain change with debounce
  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setHospitalProfile({ ...hospitalProfile, subdomain: sanitized });
    
    // Debounce subdomain check
    if (sanitized.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSubdomain(sanitized);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSubdomainAvailable(null);
    }
  };
  
  // Generate subdomain from hospital name
  const generateSubdomain = () => {
    if (hospitalProfile.name) {
      const subdomain = hospitalProfile.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      
      setHospitalProfile({ ...hospitalProfile, subdomain });
      checkSubdomain(subdomain);
    }
  };
  
  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1: // Hospital Profile
        if (!hospitalProfile.name) newErrors.name = 'Hospital name is required';
        if (!hospitalProfile.subdomain) newErrors.subdomain = 'Subdomain is required';
        else if (hospitalProfile.subdomain.length < 3) newErrors.subdomain = 'Subdomain must be at least 3 characters';
        else if (subdomainAvailable === false) newErrors.subdomain = 'This subdomain is already taken';
        if (!hospitalProfile.address) newErrors.address = 'Address is required';
        if (!hospitalProfile.phone) newErrors.phone = 'Phone number is required';
        if (!hospitalProfile.email) newErrors.email = 'Email is required';
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(hospitalProfile.email)) {
          newErrors.email = 'Invalid email address';
        }
        if (!hospitalProfile.contactPerson) newErrors.contactPerson = 'Contact person is required';
        break;
        
      case 2: // Admin Setup
        if (!adminSetup.email) newErrors.adminEmail = 'Email is required';
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(adminSetup.email)) {
          newErrors.adminEmail = 'Invalid email address';
        }
        if (!adminSetup.firstName) newErrors.adminFirstName = 'First name is required';
        if (!adminSetup.lastName) newErrors.adminLastName = 'Last name is required';
        if (!adminSetup.password) newErrors.adminPassword = 'Password is required';
        else if (adminSetup.password.length < 8) {
          newErrors.adminPassword = 'Password must be at least 8 characters';
        }
        if (adminSetup.password !== adminSetup.confirmPassword) {
          newErrors.adminConfirmPassword = 'Passwords do not match';
        }
        break;
        
      case 3: // Module Selection
        if (moduleSelection.outpatient.length === 0 && 
            moduleSelection.inpatient.length === 0 && 
            moduleSelection.shared.length === 0) {
          newErrors.modules = 'Please select at least one module';
        }
        break;
        
      case 4: // Pricing Plan
        if (!pricingPlan.plan) newErrors.plan = 'Please select a pricing plan';
        break;
        
      case 5: // License Details
        if (!licenseDetails.startDate) newErrors.startDate = 'Start date is required';
        if (!licenseDetails.type) newErrors.type = 'License type is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setIsLoading(true);
    setNetworkError(null);
    try {
      console.log('Submitting hospital onboarding form with data:', {
        hospitalProfile,
        adminSetup,
        moduleSelection,
        pricingPlan,
        licenseDetails
      });
      
      const result = await hospitalOnboardingApi.createHospital({
        hospitalProfile,
        adminSetup,
        moduleSelection,
        pricingPlan,
        licenseDetails
      });
      
      console.log('Hospital creation result:', result);
      
      addNotification({
        message: 'Hospital created successfully',
        type: 'success'
      });
      
      // Redirect to super admin dashboard
      navigate('/super-admin');
    } catch (error: any) {
      console.error('Error creating hospital:', error);
      setNetworkError(error.message);
      addNotification({
        message: `Failed to create hospital: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
      </div>
      
      {/* Network Error Alert */}
      {networkError && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium">Connection Error</p>
            <p className="text-sm">{networkError}</p>
            <p className="text-sm mt-1">
              This could be due to network connectivity issues or the Supabase Edge Function not being available.
              In development mode, simulated responses will be used.
            </p>
          </div>
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === step
                  ? 'bg-primary-500 text-white'
                  : currentStep > step
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <span className="mt-2 text-xs text-gray-500">
                {step === 1 && 'Hospital Profile'}
                {step === 2 && 'Admin Setup'}
                {step === 3 && 'Modules'}
                {step === 4 && 'Pricing'}
                {step === 5 && 'License'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Step 1: Hospital Profile */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-6 w-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Hospital Profile</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label required">Hospital Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={hospitalProfile.name}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, name: e.target.value })}
                    onBlur={() => {
                      if (!hospitalProfile.subdomain && hospitalProfile.name) {
                        generateSubdomain();
                      }
                    }}
                    className={`form-input pl-10 ${errors.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter hospital name"
                  />
                </div>
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              
              <div>
                <label className="form-label required">Subdomain</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={hospitalProfile.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className={`form-input pl-10 ${errors.subdomain ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter subdomain"
                  />
                  {isCheckingSubdomain && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                  {!isCheckingSubdomain && subdomainAvailable !== null && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {subdomainAvailable ? (
                        <Check className="h-5 w-5 text-success-500" />
                      ) : (
                        <X className="h-5 w-5 text-error-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {hospitalProfile.subdomain ? `${hospitalProfile.subdomain}.searchable.today` : 'yourhospital.searchable.today'}
                </p>
                {errors.subdomain && <p className="form-error">{errors.subdomain}</p>}
              </div>
              
              <div className="sm:col-span-2">
                <label className="form-label required">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    value={hospitalProfile.address}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, address: e.target.value })}
                    className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    rows={3}
                    placeholder="Enter complete address"
                  />
                </div>
                {errors.address && <p className="form-error">{errors.address}</p>}
              </div>
              
              <div>
                <label className="form-label required">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={hospitalProfile.phone}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, phone: e.target.value })}
                    className={`form-input pl-10 ${errors.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
              
              <div>
                <label className="form-label required">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={hospitalProfile.email}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, email: e.target.value })}
                    className={`form-input pl-10 ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="hospital@example.com"
                  />
                </div>
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              
              <div>
                <label className="form-label required">Contact Person</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={hospitalProfile.contactPerson}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, contactPerson: e.target.value })}
                    className={`form-input pl-10 ${errors.contactPerson ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Full name of primary contact"
                  />
                </div>
                {errors.contactPerson && <p className="form-error">{errors.contactPerson}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Admin Setup */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <UserPlus className="h-6 w-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Admin Setup</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label required">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={adminSetup.email}
                    onChange={(e) => setAdminSetup({ ...adminSetup, email: e.target.value })}
                    className={`form-input pl-10 ${errors.adminEmail ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="admin@example.com"
                  />
                </div>
                {errors.adminEmail && <p className="form-error">{errors.adminEmail}</p>}
              </div>
              
              <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="form-label required">First Name</label>
                  <input
                    type="text"
                    value={adminSetup.firstName}
                    onChange={(e) => setAdminSetup({ ...adminSetup, firstName: e.target.value })}
                    className={`form-input ${errors.adminFirstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="First name"
                  />
                  {errors.adminFirstName && <p className="form-error">{errors.adminFirstName}</p>}
                </div>
                
                <div>
                  <label className="form-label required">Last Name</label>
                  <input
                    type="text"
                    value={adminSetup.lastName}
                    onChange={(e) => setAdminSetup({ ...adminSetup, lastName: e.target.value })}
                    className={`form-input ${errors.adminLastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Last name"
                  />
                  {errors.adminLastName && <p className="form-error">{errors.adminLastName}</p>}
                </div>
              </div>
              
              <div>
                <label className="form-label required">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={adminSetup.password}
                    onChange={(e) => setAdminSetup({ ...adminSetup, password: e.target.value })}
                    className={`form-input pl-10 ${errors.adminPassword ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter password"
                  />
                </div>
                {errors.adminPassword && <p className="form-error">{errors.adminPassword}</p>}
              </div>
              
              <div>
                <label className="form-label required">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={adminSetup.confirmPassword}
                    onChange={(e) => setAdminSetup({ ...adminSetup, confirmPassword: e.target.value })}
                    className={`form-input pl-10 ${errors.adminConfirmPassword ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Confirm password"
                  />
                </div>
                {errors.adminConfirmPassword && <p className="form-error">{errors.adminConfirmPassword}</p>}
              </div>
              
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendCredentials"
                    checked={adminSetup.sendCredentials}
                    onChange={(e) => setAdminSetup({ ...adminSetup, sendCredentials: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                    Send login credentials to admin via email
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Module Selection */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Module Selection</h2>
            </div>
            
            {errors.modules && <p className="form-error mb-4">{errors.modules}</p>}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Outpatient Modules</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableModules.outpatient.map((module) => (
                    <div key={module.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`outpatient-${module.id}`}
                          type="checkbox"
                          checked={moduleSelection.outpatient.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                outpatient: [...moduleSelection.outpatient, module.id]
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                outpatient: moduleSelection.outpatient.filter(id => id !== module.id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`outpatient-${module.id}`} className="font-medium text-gray-700">
                          {module.name}
                        </label>
                        <p className="text-gray-500">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Inpatient Modules</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableModules.inpatient.map((module) => (
                    <div key={module.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`inpatient-${module.id}`}
                          type="checkbox"
                          checked={moduleSelection.inpatient.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                inpatient: [...moduleSelection.inpatient, module.id]
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                inpatient: moduleSelection.inpatient.filter(id => id !== module.id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`inpatient-${module.id}`} className="font-medium text-gray-700">
                          {module.name}
                        </label>
                        <p className="text-gray-500">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shared Modules</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableModules.shared.map((module) => (
                    <div key={module.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`shared-${module.id}`}
                          type="checkbox"
                          checked={moduleSelection.shared.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                shared: [...moduleSelection.shared, module.id]
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                shared: moduleSelection.shared.filter(id => id !== module.id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`shared-${module.id}`} className="font-medium text-gray-700">
                          {module.name}
                        </label>
                        <p className="text-gray-500">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Add-on Modules</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableModules.addons.map((module) => (
                    <div key={module.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`addon-${module.id}`}
                          type="checkbox"
                          checked={moduleSelection.addons.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                addons: [...moduleSelection.addons, module.id]
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                addons: moduleSelection.addons.filter(id => id !== module.id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`addon-${module.id}`} className="font-medium text-gray-700">
                          {module.name}
                        </label>
                        <p className="text-gray-500">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Pricing Plan */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Pricing Plan</h2>
            </div>
            
            {errors.plan && <p className="form-error mb-4">{errors.plan}</p>}
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                    pricingPlan.plan === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPricingPlan({ plan: plan.id })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    {pricingPlan.plan === plan.id && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-success-500 mr-2" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 5: License Details */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Key className="h-6 w-6 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">License Details</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label required">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={licenseDetails.startDate}
                    onChange={(e) => setLicenseDetails({ ...licenseDetails, startDate: e.target.value })}
                    className={`form-input pl-10 ${errors.startDate ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                </div>
                {errors.startDate && <p className="form-error">{errors.startDate}</p>}
              </div>
              
              <div>
                <label className="form-label required">License Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={licenseDetails.type}
                    onChange={(e) => setLicenseDetails({ ...licenseDetails, type: e.target.value as 'monthly' | 'yearly' | 'lifetime' })}
                    className={`form-input pl-10 ${errors.type ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                {errors.type && <p className="form-error">{errors.type}</p>}
              </div>
              
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={licenseDetails.autoRenew}
                    onChange={(e) => setLicenseDetails({ ...licenseDetails, autoRenew: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={licenseDetails.type === 'lifetime'}
                  />
                  <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                    Auto-renew license
                  </label>
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label className="form-label">Notes</label>
                <textarea
                  value={licenseDetails.notes}
                  onChange={(e) => setLicenseDetails({ ...licenseDetails, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Additional notes or special requirements"
                />
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
            onClick={handlePrevStep}
            className="btn btn-outline inline-flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Previous
          </button>
        ) : (
          <div></div>
        )}
        
        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="btn btn-primary inline-flex items-center"
          >
            Next
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn btn-primary inline-flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Complete Setup
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default HospitalOnboarding;