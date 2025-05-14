import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  User, 
  Key, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Box, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  Pill,
  BedDouble,
  Flask,
  Microscope,
  FileText,
  CreditCard,
  LayoutDashboard,
  Stethoscope,
  Activity,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';

interface HospitalProfile {
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  logo_url?: string;
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
  customModules?: string[];
}

interface LicenseDetails {
  type: 'monthly' | 'yearly' | 'lifetime';
  startDate: string;
  autoRenew: boolean;
  sendInvoice: boolean;
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

interface PricingPlanOption {
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [plans, setPlans] = useState<PricingPlanOption[]>([]);
  const [mainDomain, setMainDomain] = useState('searchable.today');
  
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
    password: generateRandomPassword(),
    forcePasswordChange: true,
    sendCredentials: true
  });
  
  const [moduleSelection, setModuleSelection] = useState<ModuleSelection>({
    outpatient: [],
    inpatient: [],
    shared: [],
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
  
  // Validation state
  const [errors, setErrors] = useState<{
    hospitalProfile?: Record<string, string>;
    adminSetup?: Record<string, string>;
    moduleSelection?: string;
    pricingPlan?: string;
    licenseDetails?: Record<string, string>;
  }>({});

  useEffect(() => {
    // Redirect non-admin users
    if (!isAdmin) {
      navigate('/dashboard');
    }
    
    fetchModules();
    fetchPlans();
    fetchMainDomain();
  }, [isAdmin, navigate]);
  
  useEffect(() => {
    // Update subdomain when hospital name changes
    if (hospitalProfile.name && !hospitalProfile.subdomain) {
      const generatedSubdomain = hospitalProfile.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      setHospitalProfile(prev => ({
        ...prev,
        subdomain: generatedSubdomain
      }));
    }
  }, [hospitalProfile.name]);
  
  useEffect(() => {
    // Check subdomain availability with debounce
    const timer = setTimeout(() => {
      if (hospitalProfile.subdomain) {
        checkSubdomainAvailability(hospitalProfile.subdomain);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [hospitalProfile.subdomain]);
  
  const fetchMainDomain = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'system.main_domain')
        .single();

      if (error) throw error;
      
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
  
  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setModules(data || []);
      
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
      addNotification({
        message: 'Failed to load system modules',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
        
      if (error) throw error;
      
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      addNotification({
        message: 'Failed to load pricing plans',
        type: 'error'
      });
    }
  };
  
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain) {
      setSubdomainAvailable(null);
      return;
    }
    
    setIsCheckingSubdomain(true);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();
        
      if (error) throw error;
      
      setSubdomainAvailable(!data);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };
  
  function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
  
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(adminSetup.password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };
  
  const regeneratePassword = () => {
    setAdminSetup(prev => ({
      ...prev,
      password: generateRandomPassword()
    }));
  };
  
  const validateStep = (step: number): boolean => {
    const newErrors: any = {};
    
    if (step === 1) {
      // Validate hospital profile
      const profileErrors: Record<string, string> = {};
      
      if (!hospitalProfile.name) {
        profileErrors.name = 'Hospital name is required';
      }
      
      if (!hospitalProfile.subdomain) {
        profileErrors.subdomain = 'Subdomain is required';
      } else if (subdomainAvailable === false) {
        profileErrors.subdomain = 'This subdomain is already taken';
      }
      
      if (!hospitalProfile.address) {
        profileErrors.address = 'Address is required';
      }
      
      if (!hospitalProfile.phone) {
        profileErrors.phone = 'Phone number is required';
      }
      
      if (!hospitalProfile.email) {
        profileErrors.email = 'Email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(hospitalProfile.email)) {
        profileErrors.email = 'Invalid email address';
      }
      
      if (!hospitalProfile.contactPerson) {
        profileErrors.contactPerson = 'Contact person is required';
      }
      
      if (Object.keys(profileErrors).length > 0) {
        newErrors.hospitalProfile = profileErrors;
      }
    } else if (step === 2) {
      // Validate admin setup
      const adminErrors: Record<string, string> = {};
      
      if (!adminSetup.password) {
        adminErrors.password = 'Password is required';
      } else if (adminSetup.password.length < 8) {
        adminErrors.password = 'Password must be at least 8 characters';
      }
      
      if (Object.keys(adminErrors).length > 0) {
        newErrors.adminSetup = adminErrors;
      }
    } else if (step === 3) {
      // Validate module selection
      if (
        moduleSelection.outpatient.length === 0 &&
        moduleSelection.inpatient.length === 0 &&
        moduleSelection.shared.length === 0
      ) {
        newErrors.moduleSelection = 'At least one module must be selected';
      }
    } else if (step === 4) {
      // Validate pricing plan
      if (!pricingPlan.plan) {
        newErrors.pricingPlan = 'Please select a pricing plan';
      }
    } else if (step === 5) {
      // Validate license details
      const licenseErrors: Record<string, string> = {};
      
      if (!licenseDetails.startDate) {
        licenseErrors.startDate = 'Start date is required';
      }
      
      if (Object.keys(licenseErrors).length > 0) {
        newErrors.licenseDetails = licenseErrors;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the Supabase Edge Function to create the hospital
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hospital');
      }
      
      const data = await response.json();
      
      addNotification({
        message: 'Hospital created successfully',
        type: 'success'
      });
      
      // Navigate to the hospital list
      navigate('/super-admin');
      
    } catch (error: any) {
      console.error('Error creating hospital:', error);
      addNotification({
        message: `Failed to create hospital: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleModuleToggle = (category: keyof ModuleSelection, key: string) => {
    setModuleSelection(prev => {
      const currentModules = [...prev[category]];
      
      if (currentModules.includes(key)) {
        return {
          ...prev,
          [category]: currentModules.filter(m => m !== key)
        };
      } else {
        return {
          ...prev,
          [category]: [...currentModules, key]
        };
      }
    });
  };
  
  const handleTemplateSelection = (template: 'starter' | 'full' | 'custom') => {
    if (template === 'starter') {
      // Basic outpatient setup
      setModuleSelection({
        outpatient: modules
          .filter(m => m.category === 'outpatient' && m.is_core)
          .map(m => m.key),
        inpatient: [],
        shared: modules
          .filter(m => m.category === 'shared' && m.is_core)
          .map(m => m.key),
        addons: []
      });
      setPricingPlan({ plan: 'starter' });
    } else if (template === 'full') {
      // Complete setup with all modules
      setModuleSelection({
        outpatient: modules
          .filter(m => m.category === 'outpatient')
          .map(m => m.key),
        inpatient: modules
          .filter(m => m.category === 'inpatient')
          .map(m => m.key),
        shared: modules
          .filter(m => m.category === 'shared')
          .map(m => m.key),
        addons: modules
          .filter(m => m.category === 'addon')
          .map(m => m.key)
      });
      setPricingPlan({ plan: 'enterprise' });
    } else {
      // Custom - reset to core modules only
      setModuleSelection({
        outpatient: modules
          .filter(m => m.category === 'outpatient' && m.is_core)
          .map(m => m.key),
        inpatient: [],
        shared: modules
          .filter(m => m.category === 'shared' && m.is_core)
          .map(m => m.key),
        addons: []
      });
      setPricingPlan({ plan: 'custom' });
    }
  };
  
  const getModuleIcon = (category: string, moduleKey: string) => {
    // Return appropriate icon based on module key or category
    if (category === 'outpatient') {
      if (moduleKey.includes('patient')) return <Users className="h-5 w-5" />;
      if (moduleKey.includes('appointment')) return <Calendar className="h-5 w-5" />;
      if (moduleKey.includes('consultation')) return <Stethoscope className="h-5 w-5" />;
      if (moduleKey.includes('pharmacy')) return <Pill className="h-5 w-5" />;
      if (moduleKey.includes('billing')) return <DollarSign className="h-5 w-5" />;
      return <LayoutDashboard className="h-5 w-5" />;
    } else if (category === 'inpatient') {
      if (moduleKey.includes('bed')) return <BedDouble className="h-5 w-5" />;
      return <BedDouble className="h-5 w-5" />;
    } else if (category === 'shared') {
      if (moduleKey.includes('lab')) return <Flask className="h-5 w-5" />;
      if (moduleKey.includes('radio')) return <Microscope className="h-5 w-5" />;
      if (moduleKey.includes('report')) return <FileText className="h-5 w-5" />;
      return <Activity className="h-5 w-5" />;
    } else {
      // Add-ons
      return <Box className="h-5 w-5" />;
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Hospital Profile</h2>
            <p className="text-gray-600">Enter the basic information about the hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label required">Hospital Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className={`form-input pl-10 ${errors.hospitalProfile?.name ? 'border-error-300' : ''}`}
                    placeholder="Enter hospital name"
                    value={hospitalProfile.name}
                    onChange={e => setHospitalProfile({...hospitalProfile, name: e.target.value})}
                  />
                </div>
                {errors.hospitalProfile?.name && (
                  <p className="mt-1 text-sm text-error-600">{errors.hospitalProfile.name}</p>
                )}
              </div>
              
              <div>
                <label className="form-label required">Subdomain</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className={`form-input pl-10 ${errors.hospitalProfile?.subdomain ? 'border-error-300' : ''}`}
                    placeholder="hospital-name"
                    value={hospitalProfile.subdomain}
                    onChange={e => setHospitalProfile({...hospitalProfile, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  />
                  {isCheckingSubdomain && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                  {!isCheckingSubdomain && subdomainAvailable !== null && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {subdomainAvailable ? (
                        <CheckCircle className="h-5 w-5 text-success-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-error-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.hospitalProfile?.subdomain ? (
                  <p className="mt-1 text-sm text-error-600">{errors.hospitalProfile.subdomain}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    {hospitalProfile.subdomain ? `${hospitalProfile.subdomain}.${mainDomain}` : 'Your hospital URL will appear here'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="form-label required">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    className={`form-input pl-10 ${errors.hospitalProfile?.address ? 'border-error-300' : ''}`}
                    placeholder="Enter complete address"
                    rows={3}
                    value={hospitalProfile.address}
                    onChange={e => setHospitalProfile({...hospitalProfile, address: e.target.value})}
                  />
                </div>
                {errors.hospitalProfile?.address && (
                  <p className="mt-1 text-sm text-error-600">{errors.hospitalProfile.address}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label required">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      className={`form-input pl-10 ${errors.hospitalProfile?.phone ? 'border-error-300' : ''}`}
                      placeholder="+1 (555) 000-0000"
                      value={hospitalProfile.phone}
                      onChange={e => setHospitalProfile({...hospitalProfile, phone: e.target.value})}
                    />
                  </div>
                  {errors.hospitalProfile?.phone && (
                    <p className="mt-1 text-sm text-error-600">{errors.hospitalProfile.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label required">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className={`form-input pl-10 ${errors.hospitalProfile?.email ? 'border-error-300' : ''}`}
                      placeholder="hospital@example.com"
                      value={hospitalProfile.email}
                      onChange={e => setHospitalProfile({...hospitalProfile, email: e.target.value})}
                    />
                  </div>
                  {errors.hospitalProfile?.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.hospitalProfile.email}</p>
                  )}
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
                    className={`form-input pl-10 ${errors.hospitalProfile?.contactPerson ? 'border-error-300' : ''}`}
                    placeholder="Full name of primary contact"
                    value={hospitalProfile.contactPerson}
                    onChange={e => setHospitalProfile({...hospitalProfile, contactPerson: e.target.value})}
                  />
                </div>
                {errors.hospitalProfile?.contactPerson && (
                  <p className="mt-1 text-sm text-error-600">{errors.hospitalProfile.contactPerson}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  This person will be set up as the initial admin user.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Admin Login Setup</h2>
            <p className="text-gray-600">Configure the login credentials for the hospital admin.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="form-input pl-10 bg-gray-50"
                    value={hospitalProfile.email}
                    readOnly
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  The hospital email will be used as the admin login.
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
                    className={`form-input pl-10 pr-20 ${errors.adminSetup?.password ? 'border-error-300' : ''}`}
                    value={adminSetup.password}
                    onChange={e => setAdminSetup({...adminSetup, password: e.target.value})}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy password"
                    >
                      {passwordCopied ? <Check className="h-5 w-5 text-success-500" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {errors.adminSetup?.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.adminSetup.password}</p>
                )}
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Auto-generated secure password
                  </p>
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="forcePasswordChange"
                    checked={adminSetup.forcePasswordChange}
                    onChange={e => setAdminSetup({...adminSetup, forcePasswordChange: e.target.checked})}
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
                    onChange={e => setAdminSetup({...adminSetup, sendCredentials: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                    Send login credentials via email
                  </label>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Email Content Preview</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Subject: Your Hospital Management System Account</p>
                      <p className="mt-1">Hello {hospitalProfile.contactPerson},</p>
                      <p className="mt-1">Your hospital ({hospitalProfile.name}) has been set up on our platform. You can access your dashboard at:</p>
                      <p className="mt-1 font-medium">{hospitalProfile.subdomain}.{mainDomain}</p>
                      <p className="mt-1">Login credentials:</p>
                      <p className="mt-1">Email: {hospitalProfile.email}</p>
                      <p className="mt-1">Password: {showPassword ? adminSetup.password : '••••••••••••'}</p>
                      {adminSetup.forcePasswordChange && (
                        <p className="mt-1">You will be required to change your password on first login.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Modules</h2>
            <p className="text-gray-600">Choose which modules to enable for this hospital.</p>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateSelection('starter')}
                  className="btn btn-outline py-1 px-3 text-sm"
                >
                  Starter Template
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelection('full')}
                  className="btn btn-outline py-1 px-3 text-sm"
                >
                  Full Setup
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelection('custom')}
                  className="btn btn-outline py-1 px-3 text-sm"
                >
                  Custom Selection
                </button>
              </div>
              
              {errors.moduleSelection && (
                <div className="p-3 bg-error-50 text-error-700 rounded-md">
                  {errors.moduleSelection}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Outpatient Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Outpatient Modules</h3>
                  <div className="space-y-2">
                    {modules
                      .filter(module => module.category === 'outpatient')
                      .map(module => (
                        <div key={module.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`outpatient-${module.key}`}
                            checked={moduleSelection.outpatient.includes(module.key)}
                            onChange={() => handleModuleToggle('outpatient', module.key)}
                            disabled={module.is_core} // Core modules cannot be disabled
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`outpatient-${module.key}`} className="ml-2 flex items-center">
                            <span className="text-gray-700 text-sm">{module.name}</span>
                            {module.is_core && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-800">
                                Core
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Inpatient Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Inpatient Modules</h3>
                  <div className="space-y-2">
                    {modules
                      .filter(module => module.category === 'inpatient')
                      .map(module => (
                        <div key={module.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`inpatient-${module.key}`}
                            checked={moduleSelection.inpatient.includes(module.key)}
                            onChange={() => handleModuleToggle('inpatient', module.key)}
                            disabled={module.is_core && moduleSelection.inpatient.length > 0} // Core modules cannot be disabled if any inpatient module is selected
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`inpatient-${module.key}`} className="ml-2 flex items-center">
                            <span className="text-gray-700 text-sm">{module.name}</span>
                            {module.is_core && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-800">
                                Core
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Shared Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Shared Modules</h3>
                  <div className="space-y-2">
                    {modules
                      .filter(module => module.category === 'shared')
                      .map(module => (
                        <div key={module.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`shared-${module.key}`}
                            checked={moduleSelection.shared.includes(module.key)}
                            onChange={() => handleModuleToggle('shared', module.key)}
                            disabled={module.is_core} // Core modules cannot be disabled
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`shared-${module.key}`} className="ml-2 flex items-center">
                            <span className="text-gray-700 text-sm">{module.name}</span>
                            {module.is_core && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-800">
                                Core
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Add-on Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Add-on Modules</h3>
                  <div className="space-y-2">
                    {modules
                      .filter(module => module.category === 'addon')
                      .map(module => (
                        <div key={module.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`addon-${module.key}`}
                            checked={moduleSelection.addons.includes(module.key)}
                            onChange={() => handleModuleToggle('addons', module.key)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`addon-${module.key}`} className="ml-2 flex items-center">
                            <span className="text-gray-700 text-sm">{module.name}</span>
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-accent-100 text-accent-800">
                              Premium
                            </span>
                          </label>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Pricing Plan</h2>
            <p className="text-gray-600">Choose a pricing plan for this hospital.</p>
            
            {errors.pricingPlan && (
              <div className="p-3 bg-error-50 text-error-700 rounded-md">
                {errors.pricingPlan}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  className={`bg-white p-6 rounded-lg border-2 transition-all cursor-pointer ${
                    pricingPlan.plan === plan.key 
                      ? 'border-primary-500 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPricingPlan({ plan: plan.key })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    {pricingPlan.plan === plan.key && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                  
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/{plan.billing_cycle}</span>
                  </div>
                  
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature.feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Users</span>
                      <span className="font-medium text-gray-900">{plan.max_users}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Storage</span>
                      <span className="font-medium text-gray-900">{plan.max_storage_gb}GB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">License Management</h2>
            <p className="text-gray-600">Configure the license details for this hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">License Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      licenseDetails.type === 'monthly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({...licenseDetails, type: 'monthly'})}
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
                      licenseDetails.type === 'yearly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({...licenseDetails, type: 'yearly'})}
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
                      licenseDetails.type === 'lifetime' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({...licenseDetails, type: 'lifetime'})}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Lifetime</h3>
                      {licenseDetails.type === 'lifetime' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
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
                    className={`form-input pl-10 ${errors.licenseDetails?.startDate ? 'border-error-300' : ''}`}
                    value={licenseDetails.startDate}
                    onChange={e => setLicenseDetails({...licenseDetails, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.licenseDetails?.startDate && (
                  <p className="mt-1 text-sm text-error-600">{errors.licenseDetails.startDate}</p>
                )}
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={licenseDetails.autoRenew}
                    onChange={e => setLicenseDetails({...licenseDetails, autoRenew: e.target.checked})}
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
                    onChange={e => setLicenseDetails({...licenseDetails, sendInvoice: e.target.checked})}
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
                  placeholder="Any additional notes about this license"
                  rows={3}
                  value={licenseDetails.notes}
                  onChange={e => setLicenseDetails({...licenseDetails, notes: e.target.value})}
                />
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review & Confirm</h2>
            <p className="text-gray-600">Review the information before creating the hospital.</p>
            
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Hospital Profile</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Hospital Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.subdomain}.{mainDomain}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.address}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.phone}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.contactPerson}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Admin Setup</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Admin Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{hospitalProfile.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Password</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      {showPassword ? adminSetup.password : '••••••••••••'}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Force Password Change</dt>
                    <dd className="mt-1 text-sm text-gray-900">{adminSetup.forcePasswordChange ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Send Credentials</dt>
                    <dd className="mt-1 text-sm text-gray-900">{adminSetup.sendCredentials ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Outpatient Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.outpatient.length > 0 ? (
                        moduleSelection.outpatient.map(key => {
                          const module = modules.find(m => m.key === key);
                          return module ? (
                            <li key={key} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                              {module.name}
                            </li>
                          ) : null;
                        })
                      ) : (
                        <li className="text-sm text-gray-500">No outpatient modules selected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Inpatient Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.inpatient.length > 0 ? (
                        moduleSelection.inpatient.map(key => {
                          const module = modules.find(m => m.key === key);
                          return module ? (
                            <li key={key} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                              {module.name}
                            </li>
                          ) : null;
                        })
                      ) : (
                        <li className="text-sm text-gray-500">No inpatient modules selected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.shared.length > 0 ? (
                        moduleSelection.shared.map(key => {
                          const module = modules.find(m => m.key === key);
                          return module ? (
                            <li key={key} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                              {module.name}
                            </li>
                          ) : null;
                        })
                      ) : (
                        <li className="text-sm text-gray-500">No shared modules selected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Add-on Modules</h4>
                    <ul className="space-y-1">
                      {moduleSelection.addons.length > 0 ? (
                        moduleSelection.addons.map(key => {
                          const module = modules.find(m => m.key === key);
                          return module ? (
                            <li key={key} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                              {module.name}
                            </li>
                          ) : null;
                        })
                      ) : (
                        <li className="text-sm text-gray-500">No add-on modules selected</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Pricing & License</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Plan</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {plans.find(p => p.key === pricingPlan.plan)?.name || pricingPlan.plan}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">License Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{licenseDetails.type}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{licenseDetails.startDate}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Auto-Renew</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {licenseDetails.type === 'lifetime' ? 'N/A' : (licenseDetails.autoRenew ? 'Yes' : 'No')}
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
  
  // If not admin, don't render the page
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Link to="/super-admin" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="w-full flex items-center">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <React.Fragment key={step}>
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center">
                    {step === 1 && 'Profile'}
                    {step === 2 && 'Admin'}
                    {step === 3 && 'Modules'}
                    {step === 4 && 'Plan'}
                    {step === 5 && 'License'}
                    {step === 6 && 'Review'}
                  </span>
                </div>
                {step < 6 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`btn ${
            currentStep === 1 ? 'btn-disabled opacity-50 cursor-not-allowed' : 'btn-outline'
          }`}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        
        {currentStep < 6 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
          >
            Next
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Hospital...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
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