import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Package, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  Loader2,
  Copy,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HospitalProfile {
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
}

interface AdminSetup {
  password: string;
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
}

interface LicenseDetails {
  type: 'monthly' | 'yearly' | 'lifetime';
  startDate: string;
  autoRenew: boolean;
  sendInvoice: boolean;
  notes: string;
}

const HospitalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [mainDomain, setMainDomain] = useState('searchable.today');
  const [availableModules, setAvailableModules] = useState<{
    outpatient: { key: string; name: string; description: string; isCore: boolean }[];
    inpatient: { key: string; name: string; description: string; isCore: boolean }[];
    shared: { key: string; name: string; description: string; isCore: boolean }[];
    addons: { key: string; name: string; description: string; isCore: boolean }[];
  }>({
    outpatient: [],
    inpatient: [],
    shared: [],
    addons: []
  });
  const [availablePlans, setAvailablePlans] = useState<{
    id: string;
    name: string;
    key: string;
    description: string;
    price: number;
    billing_cycle: string;
    features: any[];
  }[]>([]);

  // Form state
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfile>({
    name: '',
    subdomain: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: ''
  });

  const [adminSetup, setAdminSetup] = useState<AdminSetup>({
    password: '',
    forcePasswordChange: true,
    sendCredentials: true
  });

  const [moduleSelection, setModuleSelection] = useState<ModuleSelection>({
    outpatient: ['patient_registration', 'appointments', 'consultations', 'pharmacy', 'billing'],
    inpatient: [],
    shared: ['laboratory', 'radiology', 'reports'],
    addons: []
  });

  const [pricingPlan, setPricingPlan] = useState<PricingPlan>({
    plan: 'starter'
  });

  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails>({
    type: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
    sendInvoice: true,
    notes: ''
  });

  useEffect(() => {
    fetchSystemModules();
    fetchPricingPlans();
    fetchMainDomain();
  }, []);

  useEffect(() => {
    // Check subdomain availability when subdomain changes
    if (hospitalProfile.subdomain && hospitalProfile.subdomain.length > 2) {
      checkSubdomainAvailability(hospitalProfile.subdomain);
    } else {
      setSubdomainAvailable(null);
    }
  }, [hospitalProfile.subdomain]);

  const fetchSystemModules = async () => {
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .order('name');

      if (error) throw error;

      const modules = {
        outpatient: data?.filter(m => m.category === 'outpatient').map(m => ({
          key: m.key,
          name: m.name,
          description: m.description || '',
          isCore: m.is_core
        })) || [],
        inpatient: data?.filter(m => m.category === 'inpatient').map(m => ({
          key: m.key,
          name: m.name,
          description: m.description || '',
          isCore: m.is_core
        })) || [],
        shared: data?.filter(m => m.category === 'shared').map(m => ({
          key: m.key,
          name: m.name,
          description: m.description || '',
          isCore: m.is_core
        })) || [],
        addons: data?.filter(m => m.category === 'addon').map(m => ({
          key: m.key,
          name: m.name,
          description: m.description || '',
          isCore: m.is_core
        })) || []
      };

      setAvailableModules(modules);
    } catch (error) {
      console.error('Error fetching system modules:', error);
      setError('Failed to load system modules');
    }
  };

  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setAvailablePlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      setError('Failed to load pricing plans');
    }
  };

  const fetchMainDomain = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'system.main_domain')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value) {
        // Remove quotes from the JSON string if needed
        const domain = typeof data.value === 'string' 
          ? data.value.replace(/"/g, '') 
          : data.value;
        
        setMainDomain(domain);
      }
    } catch (error) {
      console.error('Error fetching main domain:', error);
      // Keep default value if there's an error
    }
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain) return;
    
    try {
      setIsCheckingSubdomain(true);
      
      // Check if subdomain is valid format
      const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!subdomainRegex.test(subdomain)) {
        setSubdomainAvailable(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('hospitals')
        .select('id')
        .eq('subdomain', subdomain)
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminSetup({ ...adminSetup, password });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Password copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate all required fields
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }
      
      // Call the hospital onboarding function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hospital-onboarding/hospitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          hospitalProfile,
          adminSetup,
          moduleSelection,
          pricingPlan,
          licenseDetails
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create hospital');
      }
      
      setSuccess('Hospital created successfully!');
      setTimeout(() => {
        navigate('/super-admin');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating hospital:', error);
      setError(error.message || 'An error occurred while creating the hospital');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    // Step 1: Hospital Profile
    if (currentStep === 1) {
      if (!hospitalProfile.name) {
        setError('Hospital name is required');
        return false;
      }
      if (!hospitalProfile.subdomain) {
        setError('Subdomain is required');
        return false;
      }
      if (subdomainAvailable === false) {
        setError('Subdomain is not available');
        return false;
      }
      if (!hospitalProfile.address) {
        setError('Address is required');
        return false;
      }
      if (!hospitalProfile.phone) {
        setError('Phone number is required');
        return false;
      }
      if (!hospitalProfile.email) {
        setError('Email is required');
        return false;
      }
      if (!hospitalProfile.contactPerson) {
        setError('Contact person is required');
        return false;
      }
    }
    
    // Step 2: Admin Setup
    if (currentStep === 2) {
      if (!adminSetup.password) {
        setError('Password is required');
        return false;
      }
      if (adminSetup.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }
    
    // Step 3: Module Selection
    if (currentStep === 3) {
      if (moduleSelection.outpatient.length === 0) {
        setError('At least one outpatient module must be selected');
        return false;
      }
    }
    
    // Step 4: Pricing Plan
    if (currentStep === 4) {
      if (!pricingPlan.plan) {
        setError('Please select a pricing plan');
        return false;
      }
    }
    
    // Step 5: License Details
    if (currentStep === 5) {
      if (!licenseDetails.startDate) {
        setError('Start date is required');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateForm()) {
      setError(null);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleModuleToggle = (category: keyof ModuleSelection, moduleKey: string) => {
    const currentModules = [...moduleSelection[category]];
    
    if (currentModules.includes(moduleKey)) {
      // Remove module
      setModuleSelection({
        ...moduleSelection,
        [category]: currentModules.filter(m => m !== moduleKey)
      });
    } else {
      // Add module
      setModuleSelection({
        ...moduleSelection,
        [category]: [...currentModules, moduleKey]
      });
    }
  };

  const selectTemplate = (template: 'starter' | 'professional' | 'enterprise') => {
    let outpatient = ['patient_registration', 'appointments', 'consultations', 'pharmacy', 'billing'];
    let inpatient: string[] = [];
    let shared = ['laboratory', 'radiology', 'reports'];
    let addons: string[] = [];
    
    if (template === 'professional' || template === 'enterprise') {
      outpatient.push('queue_management');
      inpatient = ['admissions', 'bed_management', 'nurse_station', 'discharge'];
      shared.push('inventory');
    }
    
    if (template === 'enterprise') {
      inpatient.push('ward_rounds');
      shared.push('hr');
      addons = ['telemedicine', 'ai_assistant', 'insurance', 'doctor_portal', 'patient_app'];
    }
    
    setModuleSelection({
      outpatient,
      inpatient,
      shared,
      addons
    });
    
    // Also set the corresponding pricing plan
    setPricingPlan({
      plan: template
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Hospital Profile</h2>
            <p className="text-sm text-gray-500">Enter the basic information about the hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label required">Hospital Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Enter hospital name"
                    value={hospitalProfile.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setHospitalProfile({ 
                        ...hospitalProfile, 
                        name,
                        // Auto-generate subdomain from name if subdomain is empty
                        subdomain: hospitalProfile.subdomain || name.toLowerCase().replace(/\s+/g, '-')
                      });
                    }}
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
                    className={`form-input pl-10 ${
                      subdomainAvailable === true ? 'border-success-300' : 
                      subdomainAvailable === false ? 'border-error-300' : ''
                    }`}
                    placeholder="hospital-name"
                    value={hospitalProfile.subdomain}
                    onChange={(e) => setHospitalProfile({ 
                      ...hospitalProfile, 
                      subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    })}
                  />
                  {isCheckingSubdomain && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                  {!isCheckingSubdomain && subdomainAvailable === true && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle className="h-5 w-5 text-success-500" />
                    </div>
                  )}
                  {!isCheckingSubdomain && subdomainAvailable === false && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <X className="h-5 w-5 text-error-500" />
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center">
                  <p className="text-sm text-gray-500">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
                {hospitalProfile.subdomain && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Full domain:</p>
                    <p className="text-sm font-mono text-primary-600">{hospitalProfile.subdomain}.{mainDomain}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label required">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    className="form-input pl-10"
                    rows={2}
                    placeholder="Enter complete address"
                    value={hospitalProfile.address}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, address: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      className="form-input pl-10"
                      placeholder="+1 (555) 000-0000"
                      value={hospitalProfile.phone}
                      onChange={(e) => setHospitalProfile({ ...hospitalProfile, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label required">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="form-input pl-10"
                      placeholder="hospital@example.com"
                      value={hospitalProfile.email}
                      onChange={(e) => setHospitalProfile({ ...hospitalProfile, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label required">Contact Person</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Full Name"
                    value={hospitalProfile.contactPerson}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, contactPerson: e.target.value })}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  This person will be set up as the hospital admin
                </p>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Admin Account Setup</h2>
            <p className="text-sm text-gray-500">Set up the administrator account for this hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label required">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="form-input pl-10 bg-gray-100"
                    value={hospitalProfile.email}
                    readOnly
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  The hospital email will be used for the admin account
                </p>
              </div>
              
              <div>
                <label className="form-label required">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input pl-10 pr-20"
                    placeholder="Enter password"
                    value={adminSetup.password}
                    onChange={(e) => setAdminSetup({ ...adminSetup, password: e.target.value })}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Generate Strong Password
                  </button>
                  {adminSetup.password && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(adminSetup.password)}
                      className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="forcePasswordChange"
                    checked={adminSetup.forcePasswordChange}
                    onChange={(e) => setAdminSetup({ ...adminSetup, forcePasswordChange: e.target.checked })}
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
                    onChange={(e) => setAdminSetup({ ...adminSetup, sendCredentials: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                    Send login credentials via email
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Module Selection</h2>
            <p className="text-sm text-gray-500">Select the modules to enable for this hospital.</p>
            
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => selectTemplate('starter')}
                className="btn btn-outline"
              >
                Starter Template
              </button>
              <button
                type="button"
                onClick={() => selectTemplate('professional')}
                className="btn btn-outline"
              >
                Professional Template
              </button>
              <button
                type="button"
                onClick={() => selectTemplate('enterprise')}
                className="btn btn-outline"
              >
                Enterprise Template
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Outpatient Modules</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableModules.outpatient.map((module) => (
                    <div key={module.key} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`module-${module.key}`}
                          type="checkbox"
                          checked={moduleSelection.outpatient.includes(module.key)}
                          onChange={() => handleModuleToggle('outpatient', module.key)}
                          disabled={module.isCore}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`module-${module.key}`} className="font-medium text-gray-700">
                          {module.name}
                          {module.isCore && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Core
                            </span>
                          )}
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
                    <div key={module.key} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`module-${module.key}`}
                          type="checkbox"
                          checked={moduleSelection.inpatient.includes(module.key)}
                          onChange={() => handleModuleToggle('inpatient', module.key)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`module-${module.key}`} className="font-medium text-gray-700">
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
                    <div key={module.key} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`module-${module.key}`}
                          type="checkbox"
                          checked={moduleSelection.shared.includes(module.key)}
                          onChange={() => handleModuleToggle('shared', module.key)}
                          disabled={module.isCore}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`module-${module.key}`} className="font-medium text-gray-700">
                          {module.name}
                          {module.isCore && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Core
                            </span>
                          )}
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
                    <div key={module.key} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`module-${module.key}`}
                          type="checkbox"
                          checked={moduleSelection.addons.includes(module.key)}
                          onChange={() => handleModuleToggle('addons', module.key)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`module-${module.key}`} className="font-medium text-gray-700">
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
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Pricing Plan</h2>
            <p className="text-sm text-gray-500">Select a pricing plan for this hospital.</p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {availablePlans.map((plan) => (
                <div
                  key={plan.key}
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    pricingPlan.plan === plan.key 
                      ? 'border-primary-500 bg-primary-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                  onClick={() => setPricingPlan({ plan: plan.key })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    {pricingPlan.plan === plan.key && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                    <span className="text-gray-500">/{plan.billing_cycle}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature.feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">License Details</h2>
            <p className="text-sm text-gray-500">Configure the license for this hospital.</p>
            
            <div className="space-y-6">
              <div>
                <label className="form-label">License Type</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'monthly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({ ...licenseDetails, type: 'monthly' })}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Monthly</h3>
                      {licenseDetails.type === 'monthly' && (
                        <Check className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'yearly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({ ...licenseDetails, type: 'yearly' })}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Yearly</h3>
                      {licenseDetails.type === 'yearly' && (
                        <Check className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Save 20% with annual billing</p>
                    <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                      20% off
                    </span>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'lifetime' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({ ...licenseDetails, type: 'lifetime' })}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Lifetime</h3>
                      {licenseDetails.type === 'lifetime' && (
                        <Check className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">One-time payment, lifetime access</p>
                    <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                      40% off
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
                    className="form-input pl-10"
                    value={licenseDetails.startDate}
                    onChange={(e) => setLicenseDetails({ ...licenseDetails, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
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
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendInvoice"
                    checked={licenseDetails.sendInvoice}
                    onChange={(e) => setLicenseDetails({ ...licenseDetails, sendInvoice: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendInvoice" className="ml-2 block text-sm text-gray-900">
                    Send invoice/receipt
                  </label>
                </div>
              </div>
              
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Any additional notes about this license"
                  value={licenseDetails.notes}
                  onChange={(e) => setLicenseDetails({ ...licenseDetails, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review & Confirm</h2>
            <p className="text-sm text-gray-500">Review the information and confirm to create the hospital.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-900">Hospital Profile</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.subdomain}.{mainDomain}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.phone}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.address}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.contactPerson}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900">Admin Account</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Password</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {showPassword ? adminSetup.password : '••••••••••••'}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-primary-600 hover:text-primary-500"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Settings</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {adminSetup.forcePasswordChange && 'Force password change on first login. '}
                      {adminSetup.sendCredentials && 'Send login credentials via email.'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900">Modules</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Outpatient</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {moduleSelection.outpatient.map(m => 
                        availableModules.outpatient.find(am => am.key === m)?.name
                      ).join(', ')}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Inpatient</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {moduleSelection.inpatient.length > 0 
                        ? moduleSelection.inpatient.map(m => 
                            availableModules.inpatient.find(am => am.key === m)?.name
                          ).join(', ')
                        : 'None'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Shared</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {moduleSelection.shared.map(m => 
                        availableModules.shared.find(am => am.key === m)?.name
                      ).join(', ')}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Add-ons</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {moduleSelection.addons.length > 0 
                        ? moduleSelection.addons.map(m => 
                            availableModules.addons.find(am => am.key === m)?.name
                          ).join(', ')
                        : 'None'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900">Pricing & License</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Plan</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {availablePlans.find(p => p.key === pricingPlan.plan)?.name || pricingPlan.plan}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(availablePlans.find(p => p.key === pricingPlan.plan)?.price || 0)}
                      /{availablePlans.find(p => p.key === pricingPlan.plan)?.billing_cycle}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">License Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {licenseDetails.type.charAt(0).toUpperCase() + licenseDetails.type.slice(1)}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(licenseDetails.startDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Settings</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {licenseDetails.autoRenew && licenseDetails.type !== 'lifetime' && 'Auto-renew enabled. '}
                      {licenseDetails.sendInvoice && 'Send invoice/receipt.'}
                    </dd>
                  </div>
                  {licenseDetails.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Notes</dt>
                      <dd className="mt-1 text-sm text-gray-900">{licenseDetails.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/super-admin')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="w-full flex items-center">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <React.Fragment key={step}>
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === step 
                      ? 'bg-primary-500 text-white' 
                      : currentStep > step 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>
                {step < 6 && (
                  <div 
                    className={`flex-1 h-1 ${
                      currentStep > step ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-xs text-gray-500">Hospital Profile</div>
          <div className="text-xs text-gray-500">Admin Setup</div>
          <div className="text-xs text-gray-500">Modules</div>
          <div className="text-xs text-gray-500">Pricing</div>
          <div className="text-xs text-gray-500">License</div>
          <div className="text-xs text-gray-500">Confirm</div>
        </div>
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-error-800">Error</h3>
            <p className="mt-1 text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-md flex items-start">
          <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-success-800">Success</h3>
            <p className="mt-1 text-sm text-success-700">{success}</p>
          </div>
        </div>
      )}
      
      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {renderStepContent()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1 || isLoading}
          className={`btn btn-outline flex items-center ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Previous
        </button>
        
        {currentStep < 6 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={isLoading}
            className="btn btn-primary flex items-center"
          >
            Next
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn btn-primary flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Hospital...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
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