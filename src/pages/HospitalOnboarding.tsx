import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Globe, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Package, 
  Key, 
  Calendar, 
  RefreshCw, 
  Send, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';

// Types for the multi-step form
interface HospitalProfile {
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
}

interface AdminSetup {
  email: string;
  password: string;
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
  price: number;
}

interface LicenseDetails {
  type: 'monthly' | 'yearly' | 'lifetime';
  startDate: string;
  autoRenew: boolean;
  trialPeriod: number;
  gracePeriod: number;
  notes: string;
}

interface SystemModule {
  id: string;
  name: string;
  key: string;
  category: string;
  is_core: boolean;
  is_active: boolean;
  version: string;
  description: string;
}

interface PricingPlanType {
  id: string;
  name: string;
  key: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: any[];
  max_users: number;
  max_storage_gb: number;
}

const HospitalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const { addNotification } = useNotificationStore();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  // Form data
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfile>({
    name: '',
    subdomain: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: ''
  });
  
  const [adminSetup, setAdminSetup] = useState<AdminSetup>({
    email: '',
    password: generateRandomPassword(),
    sendCredentials: true
  });
  
  const [moduleSelection, setModuleSelection] = useState<ModuleSelection>({
    outpatient: [],
    inpatient: [],
    shared: [],
    addons: []
  });
  
  const [pricingPlan, setPricingPlan] = useState<PricingPlan>({
    plan: '',
    price: 0
  });
  
  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails>({
    type: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
    trialPeriod: 0,
    gracePeriod: 7,
    notes: ''
  });
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isSubdomainAvailable, setIsSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data from backend
  const [availableModules, setAvailableModules] = useState<SystemModule[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PricingPlanType[]>([]);
  
  // Load modules and plans on component mount
  useEffect(() => {
    fetchModules();
    fetchPlans();
    
    // Set admin email to match hospital email
    if (hospitalProfile.email && !adminSetup.email) {
      setAdminSetup(prev => ({ ...prev, email: hospitalProfile.email }));
    }
  }, [hospitalProfile.email]);
  
  // Update subdomain when hospital name changes
  useEffect(() => {
    if (hospitalProfile.name && !hospitalProfile.subdomain) {
      const generatedSubdomain = hospitalProfile.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      setHospitalProfile(prev => ({ ...prev, subdomain: generatedSubdomain }));
    }
  }, [hospitalProfile.name]);
  
  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      if (!hospitalProfile.subdomain || hospitalProfile.subdomain.length < 3) {
        setIsSubdomainAvailable(null);
        return;
      }
      
      setIsCheckingSubdomain(true);
      try {
        const { data, error } = await supabase.functions.invoke('hospital-onboarding', {
          method: 'GET',
          path: `/check-subdomain/${hospitalProfile.subdomain}`
        });
        
        if (error) throw error;
        setIsSubdomainAvailable(data.available);
      } catch (error) {
        console.error('Error checking subdomain:', error);
        setIsSubdomainAvailable(null);
      } finally {
        setIsCheckingSubdomain(false);
      }
    };
    
    const debounceTimer = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(debounceTimer);
  }, [hospitalProfile.subdomain]);
  
  // Fetch available modules
  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setAvailableModules(data || []);
      
      // Pre-select core modules
      const outpatientCore = data
        .filter(m => m.category === 'outpatient' && m.is_core)
        .map(m => m.key);
      
      const inpatientCore = data
        .filter(m => m.category === 'inpatient' && m.is_core)
        .map(m => m.key);
      
      const sharedCore = data
        .filter(m => m.category === 'shared' && m.is_core)
        .map(m => m.key);
      
      setModuleSelection({
        outpatient: outpatientCore,
        inpatient: [],
        shared: sharedCore,
        addons: []
      });
      
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };
  
  // Fetch available pricing plans
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      setAvailablePlans(data || []);
      
      // Set default plan to the first one
      if (data && data.length > 0) {
        setPricingPlan({
          plan: data[0].key,
          price: data[0].price
        });
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    }
  };
  
  // Generate random password
  function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
  
  // Generate new password
  const handleGeneratePassword = () => {
    setAdminSetup(prev => ({ ...prev, password: generateRandomPassword() }));
  };
  
  // Handle module selection
  const handleModuleToggle = (category: keyof ModuleSelection, moduleKey: string) => {
    setModuleSelection(prev => {
      const currentModules = [...prev[category]];
      
      if (currentModules.includes(moduleKey)) {
        return {
          ...prev,
          [category]: currentModules.filter(m => m !== moduleKey)
        };
      } else {
        return {
          ...prev,
          [category]: [...currentModules, moduleKey]
        };
      }
    });
  };
  
  // Apply template selection
  const applyTemplate = (template: 'starter' | 'full' | 'custom') => {
    if (template === 'starter') {
      // Basic outpatient setup
      const outpatientModules = availableModules
        .filter(m => m.category === 'outpatient' && m.is_core)
        .map(m => m.key);
      
      const sharedModules = availableModules
        .filter(m => m.category === 'shared' && m.is_core)
        .map(m => m.key);
      
      setModuleSelection({
        outpatient: outpatientModules,
        inpatient: [],
        shared: sharedModules,
        addons: []
      });
      
      // Set starter plan
      const starterPlan = availablePlans.find(p => p.key === 'starter');
      if (starterPlan) {
        setPricingPlan({
          plan: starterPlan.key,
          price: starterPlan.price
        });
      }
    } else if (template === 'full') {
      // Complete setup with all modules
      const outpatientModules = availableModules
        .filter(m => m.category === 'outpatient')
        .map(m => m.key);
      
      const inpatientModules = availableModules
        .filter(m => m.category === 'inpatient')
        .map(m => m.key);
      
      const sharedModules = availableModules
        .filter(m => m.category === 'shared')
        .map(m => m.key);
      
      const addonModules = availableModules
        .filter(m => m.category === 'addon')
        .map(m => m.key);
      
      setModuleSelection({
        outpatient: outpatientModules,
        inpatient: inpatientModules,
        shared: sharedModules,
        addons: addonModules
      });
      
      // Set enterprise plan
      const enterprisePlan = availablePlans.find(p => p.key === 'enterprise');
      if (enterprisePlan) {
        setPricingPlan({
          plan: enterprisePlan.key,
          price: enterprisePlan.price
        });
      }
    }
    // Custom template just keeps current selections
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!hospitalProfile.name || !hospitalProfile.subdomain || !hospitalProfile.address || 
          !hospitalProfile.phone || !hospitalProfile.email || !hospitalProfile.contactPerson) {
        throw new Error('Please fill in all required hospital information');
      }
      
      if (!adminSetup.email || !adminSetup.password) {
        throw new Error('Admin email and password are required');
      }
      
      if (!pricingPlan.plan) {
        throw new Error('Please select a pricing plan');
      }
      
      if (!licenseDetails.startDate) {
        throw new Error('License start date is required');
      }
      
      // Check if subdomain is available
      if (!isSubdomainAvailable) {
        throw new Error('The selected subdomain is not available');
      }
      
      // Submit to Supabase function
      const { data, error } = await supabase.functions.invoke('hospital-onboarding', {
        method: 'POST',
        path: '/hospitals',
        body: {
          hospitalProfile,
          adminSetup,
          moduleSelection,
          pricingPlan,
          licenseDetails
        }
      });
      
      if (error) throw error;
      
      // Show success notification
      addNotification({
        message: `Hospital ${hospitalProfile.name} created successfully`,
        type: 'success'
      });
      
      // Redirect to hospitals list
      navigate('/super-admin');
      
    } catch (error: any) {
      console.error('Error creating hospital:', error);
      setError(error.message || 'An error occurred while creating the hospital');
      
      // Show error notification
      addNotification({
        message: error.message || 'Failed to create hospital',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigation between steps
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/super-admin')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
        </div>
        
        {/* Progress Steps */}
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`flex flex-col items-center ${
                  index + 1 <= currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <div 
                  className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 ${
                    index + 1 < currentStep 
                      ? 'bg-primary-100 text-primary-600' 
                      : index + 1 === currentStep
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {index === 0 && 'Hospital Profile'}
                  {index === 1 && 'Admin Setup'}
                  {index === 2 && 'Modules'}
                  {index === 3 && 'Pricing Plan'}
                  {index === 4 && 'License'}
                  {index === 5 && 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-error-700">{error}</p>
        </div>
      )}
      
      {/* Step 1: Hospital Profile */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900">Hospital Profile</h2>
          <p className="text-gray-500">Enter the basic information about the hospital.</p>
          
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
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, name: e.target.value })}
                  className="form-input pl-10"
                  placeholder="Enter hospital name"
                  required
                />
              </div>
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
                  onChange={(e) => setHospitalProfile({ 
                    ...hospitalProfile, 
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                  })}
                  className={`form-input pl-10 ${
                    isSubdomainAvailable === false ? 'border-error-300' : 
                    isSubdomainAvailable === true ? 'border-success-300' : ''
                  }`}
                  placeholder="hospital-name"
                  required
                />
                {isCheckingSubdomain && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
                {isSubdomainAvailable === true && !isCheckingSubdomain && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  </div>
                )}
                {isSubdomainAvailable === false && !isCheckingSubdomain && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-error-500" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {isSubdomainAvailable === true && 'Subdomain is available'}
                {isSubdomainAvailable === false && 'Subdomain is already taken'}
                {isSubdomainAvailable === null && 'The hospital will be accessible at subdomain.searchable.today'}
              </p>
            </div>
            
            <div>
              <label className="form-label required">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={hospitalProfile.address}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, address: e.target.value })}
                  className="form-input pl-10"
                  rows={3}
                  placeholder="Enter complete address"
                  required
                />
              </div>
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
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, contactPerson: e.target.value })}
                    className="form-input pl-10"
                    placeholder="Full name"
                    required
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
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, phone: e.target.value })}
                    className="form-input pl-10"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label className="form-label required">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={hospitalProfile.email}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, email: e.target.value })}
                    className="form-input pl-10"
                    placeholder="hospital@example.com"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  This email will be used for the admin account login
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              onClick={nextStep}
              disabled={!hospitalProfile.name || !hospitalProfile.subdomain || !hospitalProfile.address || 
                       !hospitalProfile.phone || !hospitalProfile.email || !hospitalProfile.contactPerson ||
                       isSubdomainAvailable === false}
              className="btn btn-primary inline-flex items-center"
            >
              Next Step
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Admin Setup */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900">Admin Account Setup</h2>
          <p className="text-gray-500">Configure the hospital administrator account.</p>
          
          <div className="space-y-4">
            <div>
              <label className="form-label required">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={adminSetup.email}
                  onChange={(e) => setAdminSetup({ ...adminSetup, email: e.target.value })}
                  className="form-input pl-10"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This email will be used for the admin to log in
              </p>
            </div>
            
            <div>
              <label className="form-label required">Temporary Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminSetup.password}
                  onChange={(e) => setAdminSetup({ ...adminSetup, password: e.target.value })}
                  className="form-input pl-10 pr-20"
                  placeholder="Password"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 mr-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="p-1 mr-3 text-primary-600 hover:text-primary-800"
                    title="Generate new password"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                The admin will be required to change this password on first login
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendCredentials"
                checked={adminSetup.sendCredentials}
                onChange={(e) => setAdminSetup({ ...adminSetup, sendCredentials: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                Send login credentials to admin email
              </label>
            </div>
            
            {adminSetup.sendCredentials && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Send className="h-4 w-4 text-gray-500 mr-2" />
                  Email Preview
                </h3>
                <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                  <p><strong>Subject:</strong> Your Hospital Management System Access</p>
                  <div className="mt-2">
                    <p>Dear {hospitalProfile.contactPerson},</p>
                    <p className="mt-2">Your hospital ({hospitalProfile.name}) has been set up in our system. You can access it using the following credentials:</p>
                    <p className="mt-2">
                      <strong>URL:</strong> https://{hospitalProfile.subdomain}.searchable.today<br />
                      <strong>Email:</strong> {adminSetup.email}<br />
                      <strong>Password:</strong> {showPassword ? adminSetup.password : '••••••••••••'}
                    </p>
                    <p className="mt-2">You will be required to change your password on first login.</p>
                    <p className="mt-2">Best regards,<br />HMS Support Team</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              className="btn btn-outline inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={!adminSetup.email || !adminSetup.password}
              className="btn btn-primary inline-flex items-center"
            >
              Next Step
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Module Selection */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900">Module Selection</h2>
          <p className="text-gray-500">Select the modules to enable for this hospital.</p>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => applyTemplate('starter')}
              className="btn btn-outline inline-flex items-center"
            >
              <Package className="mr-2 h-5 w-5" />
              Starter Template
            </button>
            <button
              onClick={() => applyTemplate('full')}
              className="btn btn-outline inline-flex items-center"
            >
              <Package className="mr-2 h-5 w-5" />
              Full Setup
            </button>
            <button
              onClick={() => applyTemplate('custom')}
              className="btn btn-outline inline-flex items-center"
            >
              <Package className="mr-2 h-5 w-5" />
              Custom Selection
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Outpatient Modules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Outpatient Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableModules
                  .filter(module => module.category === 'outpatient')
                  .map(module => (
                    <div 
                      key={module.key}
                      className={`p-4 rounded-lg border ${
                        moduleSelection.outpatient.includes(module.key)
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } cursor-pointer transition-colors`}
                      onClick={() => handleModuleToggle('outpatient', module.key)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          moduleSelection.outpatient.includes(module.key)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {moduleSelection.outpatient.includes(module.key) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{module.description}</p>
                      {module.is_core && (
                        <span className="mt-2 inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          Core
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Inpatient Modules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Inpatient Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableModules
                  .filter(module => module.category === 'inpatient')
                  .map(module => (
                    <div 
                      key={module.key}
                      className={`p-4 rounded-lg border ${
                        moduleSelection.inpatient.includes(module.key)
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } cursor-pointer transition-colors`}
                      onClick={() => handleModuleToggle('inpatient', module.key)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          moduleSelection.inpatient.includes(module.key)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {moduleSelection.inpatient.includes(module.key) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{module.description}</p>
                      {module.is_core && (
                        <span className="mt-2 inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          Core
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Shared Modules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Shared Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableModules
                  .filter(module => module.category === 'shared')
                  .map(module => (
                    <div 
                      key={module.key}
                      className={`p-4 rounded-lg border ${
                        moduleSelection.shared.includes(module.key)
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } cursor-pointer transition-colors`}
                      onClick={() => handleModuleToggle('shared', module.key)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          moduleSelection.shared.includes(module.key)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {moduleSelection.shared.includes(module.key) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{module.description}</p>
                      {module.is_core && (
                        <span className="mt-2 inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          Core
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Add-on Modules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Add-on Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableModules
                  .filter(module => module.category === 'addon')
                  .map(module => (
                    <div 
                      key={module.key}
                      className={`p-4 rounded-lg border ${
                        moduleSelection.addons.includes(module.key)
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } cursor-pointer transition-colors`}
                      onClick={() => handleModuleToggle('addons', module.key)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          moduleSelection.addons.includes(module.key)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {moduleSelection.addons.includes(module.key) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{module.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              className="btn btn-outline inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
            <button
              onClick={nextStep}
              className="btn btn-primary inline-flex items-center"
            >
              Next Step
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Step 4: Pricing Plan */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900">Pricing Plan</h2>
          <p className="text-gray-500">Select a pricing plan for this hospital.</p>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map(plan => (
              <div
                key={plan.key}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  pricingPlan.plan === plan.key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPricingPlan({ plan: plan.key, price: plan.price })}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  {pricingPlan.plan === plan.key && (
                    <CheckCircle className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/{plan.billing_cycle}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature.feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Users</span>
                    <span className="font-medium">{plan.max_users}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500">Storage</span>
                    <span className="font-medium">{plan.max_storage_gb} GB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              className="btn btn-outline inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={!pricingPlan.plan}
              className="btn btn-primary inline-flex items-center"
            >
              Next Step
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Step 5: License Details */}
      {currentStep === 5 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900">License Details</h2>
          <p className="text-gray-500">Configure the license settings for this hospital.</p>
          
          <div className="space-y-4">
            <div>
              <label className="form-label required">License Type</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    licenseDetails.type === 'monthly'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setLicenseDetails({ ...licenseDetails, type: 'monthly' })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">Monthly</h3>
                    {licenseDetails.type === 'monthly' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                </div>
                
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    licenseDetails.type === 'yearly'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setLicenseDetails({ ...licenseDetails, type: 'yearly' })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">Yearly</h3>
                    {licenseDetails.type === 'yearly' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Save 20% with annual billing</p>
                  <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    20% off
                  </span>
                </div>
                
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    licenseDetails.type === 'lifetime'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setLicenseDetails({ ...licenseDetails, type: 'lifetime' })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">Lifetime</h3>
                    {licenseDetails.type === 'lifetime' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">One-time payment</p>
                  <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Best value
                  </span>
                </div>
              </div>
            </div>
            
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
                  className="form-input pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            
            {licenseDetails.type !== 'lifetime' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={licenseDetails.autoRenew}
                  onChange={(e) => setLicenseDetails({ ...licenseDetails, autoRenew: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                  Auto-renew license
                </label>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Trial Period (Days)</label>
                <input
                  type="number"
                  value={licenseDetails.trialPeriod}
                  onChange={(e) => setLicenseDetails({ ...licenseDetails, trialPeriod: parseInt(e.target.value) })}
                  className="form-input"
                  min="0"
                  max="90"
                />
                <p className="mt-1 text-sm text-gray-500">
                  0 means no trial period
                </p>
              </div>
              
              <div>
                <label className="form-label">Grace Period (Days)</label>
                <input
                  type="number"
                  value={licenseDetails.gracePeriod}
                  onChange={(e) => setLicenseDetails({ ...licenseDetails, gracePeriod: parseInt(e.target.value) })}
                  className="form-input"
                  min="0"
                  max="30"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Days after expiry before access is restricted
                </p>
              </div>
            </div>
            
            <div>
              <label className="form-label">Notes</label>
              <textarea
                value={licenseDetails.notes}
                onChange={(e) => setLicenseDetails({ ...licenseDetails, notes: e.target.value })}
                className="form-input"
                rows={3}
                placeholder="Any additional notes about this license"
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              className="btn btn-outline inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={!licenseDetails.startDate}
              className="btn btn-primary inline-flex items-center"
            >
              Next Step
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Step 6: Review & Create */}
      {currentStep === 6 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900">Review & Create</h2>
          <p className="text-gray-500">Review the hospital details before creating.</p>
          
          <div className="space-y-6">
            {/* Hospital Profile Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Building2 className="h-5 w-5 text-gray-500 mr-2" />
                Hospital Profile
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hospital Name</p>
                  <p className="text-sm text-gray-900">{hospitalProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subdomain</p>
                  <p className="text-sm text-gray-900">{hospitalProfile.subdomain}.searchable.today</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{hospitalProfile.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Person</p>
                  <p className="text-sm text-gray-900">{hospitalProfile.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-sm text-gray-900">{hospitalProfile.phone} | {hospitalProfile.email}</p>
                </div>
              </div>
            </div>
            
            {/* Admin Setup Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                Admin Account
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Admin Email</p>
                  <p className="text-sm text-gray-900">{adminSetup.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Temporary Password</p>
                  <p className="text-sm text-gray-900">{showPassword ? adminSetup.password : '••••••••••••'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Email Notification</p>
                  <p className="text-sm text-gray-900">
                    {adminSetup.sendCredentials ? 'Will send login credentials via email' : 'No email notification'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modules Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Package className="h-5 w-5 text-gray-500 mr-2" />
                Selected Modules
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Outpatient Modules</p>
                  <div className="space-y-1">
                    {moduleSelection.outpatient.length === 0 ? (
                      <p className="text-sm text-gray-500">No outpatient modules selected</p>
                    ) : (
                      moduleSelection.outpatient.map(key => {
                        const module = availableModules.find(m => m.key === key);
                        return (
                          <div key={key} className="flex items-center">
                            <Check className="h-4 w-4 text-primary-500 mr-1.5" />
                            <span className="text-sm text-gray-700">{module?.name || key}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Inpatient Modules</p>
                  <div className="space-y-1">
                    {moduleSelection.inpatient.length === 0 ? (
                      <p className="text-sm text-gray-500">No inpatient modules selected</p>
                    ) : (
                      moduleSelection.inpatient.map(key => {
                        const module = availableModules.find(m => m.key === key);
                        return (
                          <div key={key} className="flex items-center">
                            <Check className="h-4 w-4 text-primary-500 mr-1.5" />
                            <span className="text-sm text-gray-700">{module?.name || key}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Shared Modules</p>
                  <div className="space-y-1">
                    {moduleSelection.shared.length === 0 ? (
                      <p className="text-sm text-gray-500">No shared modules selected</p>
                    ) : (
                      moduleSelection.shared.map(key => {
                        const module = availableModules.find(m => m.key === key);
                        return (
                          <div key={key} className="flex items-center">
                            <Check className="h-4 w-4 text-primary-500 mr-1.5" />
                            <span className="text-sm text-gray-700">{module?.name || key}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Add-on Modules</p>
                  <div className="space-y-1">
                    {moduleSelection.addons.length === 0 ? (
                      <p className="text-sm text-gray-500">No add-on modules selected</p>
                    ) : (
                      moduleSelection.addons.map(key => {
                        const module = availableModules.find(m => m.key === key);
                        return (
                          <div key={key} className="flex items-center">
                            <Check className="h-4 w-4 text-primary-500 mr-1.5" />
                            <span className="text-sm text-gray-700">{module?.name || key}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing & License Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Key className="h-5 w-5 text-gray-500 mr-2" />
                Pricing & License
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pricing Plan</p>
                  <p className="text-sm text-gray-900">
                    {availablePlans.find(p => p.key === pricingPlan.plan)?.name || pricingPlan.plan}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-sm text-gray-900">
                    ${pricingPlan.price}/{availablePlans.find(p => p.key === pricingPlan.plan)?.billing_cycle || 'month'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">License Type</p>
                  <p className="text-sm text-gray-900">
                    {licenseDetails.type.charAt(0).toUpperCase() + licenseDetails.type.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-sm text-gray-900">{licenseDetails.startDate}</p>
                </div>
                {licenseDetails.type !== 'lifetime' && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Auto-Renew</p>
                    <p className="text-sm text-gray-900">{licenseDetails.autoRenew ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {licenseDetails.trialPeriod > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Trial Period</p>
                    <p className="text-sm text-gray-900">{licenseDetails.trialPeriod} days</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Grace Period</p>
                  <p className="text-sm text-gray-900">{licenseDetails.gracePeriod} days</p>
                </div>
                {licenseDetails.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900">{licenseDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              className="btn btn-outline inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary inline-flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Hospital...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Create Hospital
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalOnboarding;