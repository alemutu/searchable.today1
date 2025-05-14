import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { 
  Building2, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  Globe, 
  Key, 
  Lock, 
  CheckCircle, 
  Box, 
  CreditCard, 
  Calendar, 
  ArrowLeft, 
  ArrowRight, 
  Loader2,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Define types for the multi-step form
interface HospitalProfile {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  address: string;
  subdomain: string;
}

interface AdminSetup {
  password: string;
  confirmPassword: string;
  forcePasswordChange: boolean;
  sendCredentials: boolean;
}

interface ModuleSelection {
  outpatient: string[];
  inpatient: string[];
  shared: string[];
  addons: string[];
}

interface PricingPlan {
  plan: string;
  customModules?: string[];
}

interface LicenseDetails {
  type: 'monthly' | 'yearly' | 'lifetime';
  startDate: string;
  autoRenew: boolean;
  sendInvoice: boolean;
  notes: string;
}

// Define available modules
const availableModules = {
  outpatient: [
    { id: 'patient_registration', name: 'Patient Registration', default: true },
    { id: 'consultations', name: 'Consultations', default: true },
    { id: 'pharmacy', name: 'Pharmacy', default: true },
    { id: 'billing', name: 'Billing', default: true },
    { id: 'queue_management', name: 'Queue Management', default: true },
    { id: 'appointments', name: 'Appointments', default: true }
  ],
  inpatient: [
    { id: 'admission', name: 'Admission Management', default: false },
    { id: 'bed_management', name: 'Bed Management', default: false },
    { id: 'nurse_station', name: 'Nurse Station', default: false },
    { id: 'discharge', name: 'Discharge Process', default: false },
    { id: 'ward_rounds', name: 'Ward Rounds', default: false }
  ],
  shared: [
    { id: 'laboratory', name: 'Laboratory', default: true },
    { id: 'radiology', name: 'Radiology', default: true },
    { id: 'reports', name: 'Reports & Analytics', default: true },
    { id: 'hr', name: 'HR Management', default: false },
    { id: 'finance', name: 'Finance', default: false },
    { id: 'inventory', name: 'Inventory', default: false }
  ],
  addons: [
    { id: 'pos', name: 'Point of Sale', default: false },
    { id: 'ai_assistant', name: 'AI Assistant', default: false },
    { id: 'insurance', name: 'Insurance Integration', default: false },
    { id: 'doctor_portal', name: 'Doctor Portal', default: false },
    { id: 'patient_portal', name: 'Patient Portal', default: false },
    { id: 'telemedicine', name: 'Telemedicine', default: false }
  ]
};

// Define pricing plans
const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Basic outpatient management',
    price: 499,
    billing: {
      monthly: 499,
      yearly: 4990,
      lifetime: 14970
    },
    features: [
      'Up to 5 users',
      'Patient registration',
      'Basic consultations',
      'Simple billing',
      'Basic reporting'
    ],
    modules: ['patient_registration', 'consultations', 'billing', 'appointments']
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    description: 'Complete outpatient solution',
    price: 999,
    billing: {
      monthly: 999,
      yearly: 9990,
      lifetime: 29970
    },
    features: [
      'Up to 15 users',
      'All outpatient modules',
      'Laboratory & Radiology',
      'Pharmacy management',
      'Advanced reporting',
      'Email notifications'
    ],
    modules: [
      'patient_registration', 'consultations', 'pharmacy', 'billing', 
      'queue_management', 'appointments', 'laboratory', 'radiology', 'reports'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Full hospital management system',
    price: 1999,
    billing: {
      monthly: 1999,
      yearly: 19990,
      lifetime: 59970
    },
    features: [
      'Unlimited users',
      'All outpatient & inpatient modules',
      'All shared modules',
      'Priority support',
      'Custom branding',
      'API access'
    ],
    modules: [
      'patient_registration', 'consultations', 'pharmacy', 'billing', 
      'queue_management', 'appointments', 'admission', 'bed_management',
      'nurse_station', 'discharge', 'ward_rounds', 'laboratory', 
      'radiology', 'reports', 'hr', 'finance', 'inventory'
    ]
  },
  {
    id: 'custom',
    name: 'Custom Plan',
    description: 'Build your own solution',
    price: 0, // To be calculated based on selected modules
    billing: {
      monthly: 0,
      yearly: 0,
      lifetime: 0
    },
    features: [
      'Select only what you need',
      'Pay for what you use',
      'Flexible user limits',
      'Custom implementation'
    ],
    modules: []
  }
];

const HospitalOnboarding: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  
  // Form data
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfile>({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    address: '',
    subdomain: ''
  });
  
  const [adminSetup, setAdminSetup] = useState<AdminSetup>({
    password: '',
    confirmPassword: '',
    forcePasswordChange: true,
    sendCredentials: true
  });
  
  const [moduleSelection, setModuleSelection] = useState<ModuleSelection>({
    outpatient: availableModules.outpatient.filter(m => m.default).map(m => m.id),
    inpatient: availableModules.inpatient.filter(m => m.default).map(m => m.id),
    shared: availableModules.shared.filter(m => m.default).map(m => m.id),
    addons: []
  });
  
  const [pricingPlan, setPricingPlan] = useState<PricingPlan>({
    plan: 'professional'
  });
  
  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails>({
    type: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
    sendInvoice: true,
    notes: ''
  });
  
  // Generate a random password
  useEffect(() => {
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const randomPassword = generatePassword();
    setAdminSetup(prev => ({
      ...prev,
      password: randomPassword,
      confirmPassword: randomPassword
    }));
  }, []);
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Handle subdomain change and check availability
  const handleSubdomainChange = (value: string) => {
    // Convert to lowercase and replace spaces with hyphens
    const formattedValue = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    setHospitalProfile(prev => ({
      ...prev,
      subdomain: formattedValue
    }));
    
    // Reset availability status when typing
    setSubdomainAvailable(null);
  };
  
  // Check if subdomain is available
  const checkSubdomainAvailability = async () => {
    if (!hospitalProfile.subdomain) return;
    
    setIsCheckingSubdomain(true);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id')
        .eq('subdomain', hospitalProfile.subdomain)
        .maybeSingle();
      
      if (error) throw error;
      
      setSubdomainAvailable(!data);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(false);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };
  
  // Handle module selection
  const handleModuleToggle = (category: keyof ModuleSelection, moduleId: string) => {
    setModuleSelection(prev => {
      const updatedModules = prev[category].includes(moduleId)
        ? prev[category].filter(id => id !== moduleId)
        : [...prev[category], moduleId];
      
      return {
        ...prev,
        [category]: updatedModules
      };
    });
  };
  
  // Handle plan selection
  const handlePlanSelection = (planId: string) => {
    setPricingPlan({
      plan: planId
    });
    
    // If not custom plan, update module selection based on plan
    if (planId !== 'custom') {
      const plan = pricingPlans.find(p => p.id === planId);
      if (plan) {
        const outpatientModules = availableModules.outpatient
          .filter(m => plan.modules.includes(m.id))
          .map(m => m.id);
        
        const inpatientModules = availableModules.inpatient
          .filter(m => plan.modules.includes(m.id))
          .map(m => m.id);
        
        const sharedModules = availableModules.shared
          .filter(m => plan.modules.includes(m.id))
          .map(m => m.id);
        
        setModuleSelection({
          outpatient: outpatientModules,
          inpatient: inpatientModules,
          shared: sharedModules,
          addons: []
        });
      }
    }
  };
  
  // Calculate total price based on selected plan and license type
  const calculatePrice = () => {
    const selectedPlan = pricingPlans.find(p => p.id === pricingPlan.plan);
    if (!selectedPlan) return 0;
    
    if (pricingPlan.plan === 'custom') {
      // Calculate custom price based on selected modules
      const basePrice = 299; // Base price for custom plan
      const moduleCount = 
        moduleSelection.outpatient.length + 
        moduleSelection.inpatient.length + 
        moduleSelection.shared.length;
      
      const modulePrice = moduleCount * 50; // $50 per module
      const addonPrice = moduleSelection.addons.length * 100; // $100 per addon
      
      const monthlyPrice = basePrice + modulePrice + addonPrice;
      
      if (licenseDetails.type === 'monthly') return monthlyPrice;
      if (licenseDetails.type === 'yearly') return monthlyPrice * 10; // 2 months free
      return monthlyPrice * 30; // Lifetime (approx. 3 years worth)
    }
    
    return selectedPlan.billing[licenseDetails.type];
  };
  
  // Submit the form
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate form data
      if (!hospitalProfile.name || !hospitalProfile.email || !hospitalProfile.phone || !hospitalProfile.address) {
        throw new Error('Please fill in all required hospital information');
      }
      
      if (!hospitalProfile.subdomain) {
        // Generate subdomain from hospital name if not provided
        const generatedSubdomain = hospitalProfile.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        setHospitalProfile(prev => ({
          ...prev,
          subdomain: generatedSubdomain
        }));
      }
      
      // Check subdomain availability one last time
      if (!subdomainAvailable) {
        await checkSubdomainAvailability();
        if (!subdomainAvailable) {
          throw new Error('Subdomain is not available. Please choose a different one.');
        }
      }
      
      // Prepare data for submission
      const onboardingData = {
        hospitalProfile,
        adminSetup,
        moduleSelection,
        pricingPlan,
        licenseDetails
      };

      // Call the Edge Function to handle hospital onboarding
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hospitals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(onboardingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to onboard hospital');
      }

      const result = await response.json();
      
      // Show success notification
      addNotification({
        message: `Hospital ${hospitalProfile.name} has been successfully onboarded!`,
        type: 'success'
      });
      
      // Redirect to hospitals list
      navigate('/super-admin');
      
    } catch (error: any) {
      console.error('Error onboarding hospital:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation between steps
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!hospitalProfile.name || !hospitalProfile.email || !hospitalProfile.phone || !hospitalProfile.address) {
        setError('Please fill in all required hospital information');
        return;
      }
      
      if (hospitalProfile.subdomain && !subdomainAvailable) {
        setError('Please choose an available subdomain');
        return;
      }
    }
    
    if (currentStep === 2) {
      if (adminSetup.password !== adminSetup.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    
    setError(null);
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Hospital Profile</h2>
            <p className="text-sm text-gray-600">Enter the basic information about the hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label required">Hospital Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={hospitalProfile.name}
                    onChange={(e) => setHospitalProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input pl-10"
                    placeholder="Enter hospital name"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label required">Hospital Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={hospitalProfile.email}
                    onChange={(e) => setHospitalProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input pl-10"
                    placeholder="admin@hospital.com"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">This email will be used for admin login.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label required">Contact Person</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={hospitalProfile.contactPerson}
                      onChange={(e) => setHospitalProfile(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="form-input pl-10"
                      placeholder="Full name"
                    />
                  </div>
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
                      onChange={(e) => setHospitalProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="form-input pl-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label required">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    value={hospitalProfile.address}
                    onChange={(e) => setHospitalProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="form-input pl-10"
                    rows={3}
                    placeholder="Enter complete address"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Subdomain</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={hospitalProfile.subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      onBlur={checkSubdomainAvailability}
                      className={`form-input pl-10 rounded-r-none ${
                        subdomainAvailable === false ? 'border-error-300 focus:border-error-500 focus:ring-error-500' :
                        subdomainAvailable === true ? 'border-success-300 focus:border-success-500 focus:ring-success-500' : ''
                      }`}
                      placeholder="hospital-name"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      .searchable.today
                    </span>
                  </div>
                  {isCheckingSubdomain && (
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                  {subdomainAvailable === true && !isCheckingSubdomain && hospitalProfile.subdomain && (
                    <div className="mt-1 flex items-center text-sm text-success-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Subdomain is available
                    </div>
                  )}
                  {subdomainAvailable === false && !isCheckingSubdomain && hospitalProfile.subdomain && (
                    <div className="mt-1 flex items-center text-sm text-error-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Subdomain is already taken
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    This will be used for the hospital's URL. Leave blank to auto-generate from hospital name.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Admin Account Setup</h2>
            <p className="text-sm text-gray-600">Configure the initial admin account for this hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={hospitalProfile.email}
                    disabled
                    className="form-input pl-10 bg-gray-50"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">The hospital email will be used for admin login.</p>
              </div>
              
              <div>
                <label className="form-label">Generated Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={adminSetup.password}
                    onChange={(e) => setAdminSetup(prev => ({ ...prev, password: e.target.value, confirmPassword: e.target.value }))}
                    className="form-input pl-10"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">This password will be sent to the hospital admin.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="forcePasswordChange"
                    checked={adminSetup.forcePasswordChange}
                    onChange={(e) => setAdminSetup(prev => ({ ...prev, forcePasswordChange: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="forcePasswordChange" className="ml-2 block text-sm text-gray-900">
                    Force password change on first login
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendCredentials"
                    checked={adminSetup.sendCredentials}
                    onChange={(e) => setAdminSetup(prev => ({ ...prev, sendCredentials: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                    Send login credentials via email
                  </label>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <Key className="h-4 w-4 mr-1.5" />
                  Email Preview
                </h3>
                <div className="bg-white p-3 rounded border border-blue-100 text-sm text-gray-700">
                  <p><strong>Subject:</strong> Your Hospital Management System Access</p>
                  <p className="mt-2"><strong>To:</strong> {hospitalProfile.email}</p>
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p>Dear {hospitalProfile.contactPerson},</p>
                    <p className="mt-2">Your hospital management system has been set up. Here are your login details:</p>
                    <p className="mt-2">
                      <strong>URL:</strong> https://{hospitalProfile.subdomain || 'your-hospital'}.searchable.today<br />
                      <strong>Email:</strong> {hospitalProfile.email}<br />
                      <strong>Password:</strong> {adminSetup.password}
                    </p>
                    <p className="mt-2">Please log in and change your password for security purposes.</p>
                    <p className="mt-2">Best regards,<br />Searchable HMS Team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Module Selection</h2>
            <p className="text-sm text-gray-600">Select the modules to enable for this hospital.</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Outpatient Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModules.outpatient.map(module => (
                    <div 
                      key={module.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        moduleSelection.outpatient.includes(module.id) 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleModuleToggle('outpatient', module.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={moduleSelection.outpatient.includes(module.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-900">
                          {module.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Inpatient Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModules.inpatient.map(module => (
                    <div 
                      key={module.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        moduleSelection.inpatient.includes(module.id) 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleModuleToggle('inpatient', module.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={moduleSelection.inpatient.includes(module.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-900">
                          {module.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Shared Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModules.shared.map(module => (
                    <div 
                      key={module.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        moduleSelection.shared.includes(module.i