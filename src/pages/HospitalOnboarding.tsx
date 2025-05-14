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
      
      // In a real implementation, this would call a Supabase Edge Function
      // For now, we'll simulate the process
      
      // 1. Create hospital
      const { data: hospital, error: hospitalError } = await supabase
        .from('hospitals')
        .insert([{
          name: hospitalProfile.name,
          subdomain: hospitalProfile.subdomain,
          address: hospitalProfile.address,
          phone: hospitalProfile.phone,
          email: hospitalProfile.email
        }])
        .select()
        .single();
      
      if (hospitalError) throw hospitalError;
      
      // 2. Create admin user (in a real implementation, this would be done in the Edge Function)
      // Here we'll just simulate success
      
      // 3. Show success notification
      addNotification({
        message: `Hospital ${hospitalProfile.name} has been successfully onboarded!`,
        type: 'success'
      });
      
      // 4. Redirect to hospitals list
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
                        moduleSelection.shared.includes(module.id) 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleModuleToggle('shared', module.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={moduleSelection.shared.includes(module.id)}
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
                <h3 className="text-base font-medium text-gray-900 mb-3">Add-on Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModules.addons.map(module => (
                    <div 
                      key={module.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        moduleSelection.addons.includes(module.id) 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleModuleToggle('addons', module.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={moduleSelection.addons.includes(module.id)}
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
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <Box className="h-4 w-4 mr-1.5" />
                  Module Summary
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Outpatient Modules:</span>
                    <span className="ml-2 font-medium text-gray-900">{moduleSelection.outpatient.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Inpatient Modules:</span>
                    <span className="ml-2 font-medium text-gray-900">{moduleSelection.inpatient.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Shared Modules:</span>
                    <span className="ml-2 font-medium text-gray-900">{moduleSelection.shared.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Add-ons:</span>
                    <span className="ml-2 font-medium text-gray-900">{moduleSelection.addons.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Pricing Plan</h2>
            <p className="text-sm text-gray-600">Select a pricing plan for this hospital.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingPlans.map(plan => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-5 cursor-pointer transition-all ${
                    pricingPlan.plan === plan.id
                      ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePlanSelection(plan.id)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    {pricingPlan.plan === plan.id && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            {pricingPlan.plan === 'custom' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Custom Plan Pricing</h3>
                <p className="text-sm text-blue-700">
                  The price for your custom plan is calculated based on the modules you've selected.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Base Price:</span>
                    <span className="ml-2 font-medium text-gray-900">$299/month</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Per Module:</span>
                    <span className="ml-2 font-medium text-gray-900">$50/month</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Per Add-on:</span>
                    <span className="ml-2 font-medium text-gray-900">$100/month</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">License Details</h2>
            <p className="text-sm text-gray-600">Configure the license for this hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">License Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'monthly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails(prev => ({ ...prev, type: 'monthly' }))}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-medium text-gray-900">Monthly</h3>
                      {licenseDetails.type === 'monthly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Billed monthly</p>
                    <div className="mt-2 text-lg font-bold text-gray-900">
                      ${calculatePrice().toLocaleString()}/month
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'yearly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails(prev => ({ ...prev, type: 'yearly' }))}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-medium text-gray-900">Yearly</h3>
                      {licenseDetails.type === 'yearly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Save with annual billing</p>
                    <div className="mt-2 text-lg font-bold text-gray-900">
                      ${calculatePrice().toLocaleString()}/year
                    </div>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800">
                      Save 16%
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'lifetime' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails(prev => ({ ...prev, type: 'lifetime' }))}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-medium text-gray-900">Lifetime</h3>
                      {licenseDetails.type === 'lifetime' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">One-time payment</p>
                    <div className="mt-2 text-lg font-bold text-gray-900">
                      ${calculatePrice().toLocaleString()}
                    </div>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800">
                      Best value
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={licenseDetails.startDate}
                    onChange={(e) => setLicenseDetails(prev => ({ ...prev, startDate: e.target.value }))}
                    className="form-input pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              {licenseDetails.type !== 'lifetime' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={licenseDetails.autoRenew}
                    onChange={(e) => setLicenseDetails(prev => ({ ...prev, autoRenew: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                    Auto-renew license
                  </label>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendInvoice"
                  checked={licenseDetails.sendInvoice}
                  onChange={(e) => setLicenseDetails(prev => ({ ...prev, sendInvoice: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="sendInvoice" className="ml-2 block text-sm text-gray-900">
                  Send invoice/receipt to hospital email
                </label>
              </div>
              
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={licenseDetails.notes}
                  onChange={(e) => setLicenseDetails(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  rows={3}
                  placeholder="Any special notes about this license"
                />
              </div>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review & Confirm</h2>
            <p className="text-sm text-gray-600">Review the information before creating the hospital.</p>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-3">Hospital Profile</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Hospital Name:</span>
                    <span className="ml-2 text-gray-900 font-medium">{hospitalProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900 font-medium">{hospitalProfile.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact Person:</span>
                    <span className="ml-2 text-gray-900 font-medium">{hospitalProfile.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 text-gray-900 font-medium">{hospitalProfile.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Address:</span>
                    <span className="ml-2 text-gray-900 font-medium">{hospitalProfile.address}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Subdomain:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {hospitalProfile.subdomain || 'Auto-generated'}.searchable.today
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-3">Admin Account</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900 font-medium">{hospitalProfile.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Password:</span>
                    <span className="ml-2 text-gray-900 font-medium">{adminSetup.password}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Force Password Change:</span>
                    <span className="ml-2 text-gray-900 font-medium">{adminSetup.forcePasswordChange ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Send Credentials:</span>
                    <span className="ml-2 text-gray-900 font-medium">{adminSetup.sendCredentials ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-3">Selected Plan</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Plan:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {pricingPlans.find(p => p.id === pricingPlan.plan)?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">License Type:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {licenseDetails.type.charAt(0).toUpperCase() + licenseDetails.type.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <span className="ml-2 text-gray-900 font-medium">{licenseDetails.startDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Auto-Renew:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {licenseDetails.type !== 'lifetime' ? (licenseDetails.autoRenew ? 'Yes' : 'No') : 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      ${calculatePrice().toLocaleString()}
                      {licenseDetails.type !== 'lifetime' ? `/${licenseDetails.type}` : ' (one-time)'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-3">Selected Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Outpatient Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.outpatient.map(moduleId => (
                        <li key={moduleId} className="flex items-center">
                          <Check className="h-4 w-4 text-success-500 mr-1.5" />
                          <span>{availableModules.outpatient.find(m => m.id === moduleId)?.name}</span>
                        </li>
                      ))}
                      {moduleSelection.outpatient.length === 0 && (
                        <li className="text-gray-500">No outpatient modules selected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Inpatient Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.inpatient.map(moduleId => (
                        <li key={moduleId} className="flex items-center">
                          <Check className="h-4 w-4 text-success-500 mr-1.5" />
                          <span>{availableModules.inpatient.find(m => m.id === moduleId)?.name}</span>
                        </li>
                      ))}
                      {moduleSelection.inpatient.length === 0 && (
                        <li className="text-gray-500">No inpatient modules selected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.shared.map(moduleId => (
                        <li key={moduleId} className="flex items-center">
                          <Check className="h-4 w-4 text-success-500 mr-1.5" />
                          <span>{availableModules.shared.find(m => m.id === moduleId)?.name}</span>
                        </li>
                      ))}
                      {moduleSelection.shared.length === 0 && (
                        <li className="text-gray-500">No shared modules selected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Add-on Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.addons.map(moduleId => (
                        <li key={moduleId} className="flex items-center">
                          <Check className="h-4 w-4 text-success-500 mr-1.5" />
                          <span>{availableModules.addons.find(m => m.id === moduleId)?.name}</span>
                        </li>
                      ))}
                      {moduleSelection.addons.length === 0 && (
                        <li className="text-gray-500">No add-on modules selected</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Render step indicators
  const renderStepIndicators = () => {
    const steps = [
      { number: 1, title: 'Hospital Profile' },
      { number: 2, title: 'Admin Setup' },
      { number: 3, title: 'Modules' },
      { number: 4, title: 'Pricing Plan' },
      { number: 5, title: 'License' },
      { number: 6, title: 'Review' }
    ];
    
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div 
              className={`flex flex-col items-center ${
                currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep > step.number 
                    ? 'bg-primary-600 text-white' 
                    : currentStep === step.number
                      ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className={`text-xs mt-1 ${
                currentStep >= step.number ? 'font-medium' : ''
              }`}>
                {step.title}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`w-12 h-0.5 mx-1 ${
                  currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/super-admin')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
      </div>
      
      {renderStepIndicators()}
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {error && (
          <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-error-400" />
            {error}
          </div>
        )}
        
        {renderStepContent()}
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`btn btn-outline inline-flex items-center ${
            currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Previous
        </button>
        
        {currentStep < 6 ? (
          <button
            type="button"
            onClick={nextStep}
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
                Creating Hospital...
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5 mr-2" />
                Create Hospital
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default HospitalOnboarding;