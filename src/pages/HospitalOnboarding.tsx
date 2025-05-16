import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, Globe, MapPin, User, Lock, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Box, CreditCard, Calendar, Save, Shield, Info, Check, X } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { hospitalOnboardingApi } from '../lib/api';
import { isValidEmail, isStrongPassword, generateSecurePassword } from '../lib/security';

interface HospitalData {
  hospitalProfile: {
    name: string;
    subdomain: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  adminSetup: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    sendCredentials: boolean;
  };
  moduleSelection: {
    outpatient: string[];
    inpatient: string[];
    shared: string[];
    addons: string[];
  };
  pricingPlan: {
    plan: string;
  };
  licenseDetails: {
    startDate: string;
    type: 'monthly' | 'yearly' | 'lifetime';
    autoRenew: boolean;
    notes: string;
  };
}

const HospitalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [formData, setFormData] = useState<HospitalData>({
    hospitalProfile: {
      name: '',
      subdomain: '',
      address: '',
      phone: '',
      email: '',
      contactPerson: ''
    },
    adminSetup: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      sendCredentials: true
    },
    moduleSelection: {
      outpatient: ['patient_management', 'appointment_scheduling', 'billing', 'pharmacy', 'laboratory'],
      inpatient: [],
      shared: ['reporting', 'user_management'],
      addons: []
    },
    pricingPlan: {
      plan: 'standard'
    },
    licenseDetails: {
      startDate: new Date().toISOString().split('T')[0],
      type: 'monthly',
      autoRenew: true,
      notes: ''
    }
  });
  
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  // Generate a secure password when the component loads
  useEffect(() => {
    const generatedPassword = generateSecurePassword();
    setFormData(prevData => ({
      ...prevData,
      adminSetup: {
        ...prevData.adminSetup,
        password: generatedPassword,
        confirmPassword: generatedPassword
      }
    }));
  }, []);

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (step === 1) {
      // Hospital Profile validation
      const { name, subdomain, address, phone, email, contactPerson } = formData.hospitalProfile;
      
      if (!name) newErrors.name = 'Hospital name is required';
      if (!subdomain) newErrors.subdomain = 'Subdomain is required';
      if (!address) newErrors.address = 'Address is required';
      if (!phone) newErrors.phone = 'Phone number is required';
      if (email && !isValidEmail(email)) newErrors.email = 'Invalid email format';
      if (!contactPerson) newErrors.contactPerson = 'Contact person is required';
      
      // Subdomain format validation
      const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (subdomain && !subdomainRegex.test(subdomain)) {
        newErrors.subdomain = 'Subdomain must contain only lowercase letters, numbers, and hyphens';
      }
      
      // Check if subdomain is available
      if (subdomain && subdomainAvailable === false) {
        newErrors.subdomain = 'This subdomain is already taken';
      }
      
    } else if (step === 2) {
      // Admin Setup validation
      const { email, firstName, lastName, password, confirmPassword } = formData.adminSetup;
      
      if (!email) newErrors.adminEmail = 'Email is required';
      else if (!isValidEmail(email)) newErrors.adminEmail = 'Invalid email format';
      
      if (!firstName) newErrors.firstName = 'First name is required';
      if (!lastName) newErrors.lastName = 'Last name is required';
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
    } else if (step === 3) {
      // Module Selection validation
      const { outpatient, inpatient, shared } = formData.moduleSelection;
      
      if (outpatient.length === 0 && inpatient.length === 0) {
        newErrors.modules = 'Please select at least one module';
      }
      
      if (shared.length === 0) {
        newErrors.shared = 'Please select at least one shared module';
      }
    } else if (step === 4) {
      // Pricing Plan validation
      if (!formData.pricingPlan.plan) {
        newErrors.plan = 'Please select a pricing plan';
      }
    } else if (step === 5) {
      // License Details validation
      const { startDate, type } = formData.licenseDetails;
      
      if (!startDate) newErrors.startDate = 'Start date is required';
      if (!type) newErrors.type = 'License type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleInputChange = (section: keyof HospitalData, field: string, value: any) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
    
    // Special handling for subdomain
    if (section === 'hospitalProfile' && field === 'subdomain') {
      // Convert to lowercase and replace spaces with hyphens
      const formattedValue = value.toLowerCase().replace(/\s+/g, '-');
      
      // Update the form data with the formatted value
      setFormData({
        ...formData,
        hospitalProfile: {
          ...formData.hospitalProfile,
          subdomain: formattedValue
        }
      });
      
      // Check subdomain availability
      if (formattedValue.length > 2) {
        checkSubdomainAvailability(formattedValue);
      } else {
        setSubdomainAvailable(null);
      }
    }
    
    // Auto-fill admin email if hospital email is provided
    if (section === 'hospitalProfile' && field === 'email' && value && !formData.adminSetup.email) {
      setFormData({
        ...formData,
        adminSetup: {
          ...formData.adminSetup,
          email: value
        }
      });
    }
    
    // Auto-fill admin name if contact person is provided
    if (section === 'hospitalProfile' && field === 'contactPerson' && value) {
      const nameParts = value.split(' ');
      if (nameParts.length > 0 && !formData.adminSetup.firstName) {
        setFormData({
          ...formData,
          adminSetup: {
            ...formData.adminSetup,
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ')
          }
        });
      }
    }
  };

  const handleModuleToggle = (category: 'outpatient' | 'inpatient' | 'shared' | 'addons', module: string) => {
    const currentModules = formData.moduleSelection[category];
    const updatedModules = currentModules.includes(module)
      ? currentModules.filter(m => m !== module)
      : [...currentModules, module];
    
    setFormData({
      ...formData,
      moduleSelection: {
        ...formData.moduleSelection,
        [category]: updatedModules
      }
    });
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    try {
      setIsCheckingSubdomain(true);
      
      // In development mode, simulate the API call
      if (import.meta.env.DEV) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate some taken subdomains
        const takenSubdomains = ['general', 'admin', 'test', 'demo'];
        setSubdomainAvailable(!takenSubdomains.includes(subdomain));
        setIsCheckingSubdomain(false);
        return;
      }
      
      const response = await hospitalOnboardingApi.checkSubdomain(subdomain);
      setSubdomainAvailable(response.available);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    try {
      setIsLoading(true);
      
      // In development mode, simulate the API call
      if (import.meta.env.DEV) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        addNotification({
          message: 'Hospital created successfully (simulated in dev mode)',
          type: 'success'
        });
        
        navigate('/super-admin');
        return;
      }
      
      const response = await hospitalOnboardingApi.createHospital(formData);
      
      addNotification({
        message: 'Hospital created successfully',
        type: 'success'
      });
      
      navigate('/super-admin');
    } catch (error: any) {
      console.error('Error creating hospital:', error);
      addNotification({
        message: `Failed to create hospital: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step < currentStep
                      ? 'bg-primary-500 text-white'
                      : step === currentStep
                      ? 'bg-primary-100 text-primary-600 border-2 border-primary-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  step <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step === 1
                    ? 'Hospital'
                    : step === 2
                    ? 'Admin'
                    : step === 3
                    ? 'Modules'
                    : step === 4
                    ? 'Plan'
                    : 'License'}
                </span>
              </div>
              
              {step < 5 && (
                <div
                  className={`w-full h-1 ${
                    step < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderHospitalProfileForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Getting Started</h3>
              <p className="mt-1 text-sm text-primary-700">
                Start by entering the basic information about the hospital. This will be used to create the hospital's profile and domain.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="form-label required">Hospital Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.hospitalProfile.name}
                onChange={(e) => handleInputChange('hospitalProfile', 'name', e.target.value)}
                className={`form-input pl-10 ${errors.name ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="General Hospital"
              />
            </div>
            {errors.name && <p className="form-error mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="form-label required">Subdomain</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.hospitalProfile.subdomain}
                onChange={(e) => handleInputChange('hospitalProfile', 'subdomain', e.target.value)}
                className={`form-input pl-10 ${errors.subdomain ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="general-hospital"
              />
              {isCheckingSubdomain && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              )}
              {!isCheckingSubdomain && subdomainAvailable !== null && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {subdomainAvailable ? (
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-error-500" />
                  )}
                </div>
              )}
            </div>
            {errors.subdomain ? (
              <p className="form-error mt-1">{errors.subdomain}</p>
            ) : (
              <div className="mt-1.5 flex items-center text-sm text-gray-500">
                <Globe className="h-4 w-4 mr-1 text-gray-400" />
                <span>
                  {formData.hospitalProfile.subdomain || 'your-subdomain'}.searchable.today
                </span>
              </div>
            )}
            {!errors.subdomain && subdomainAvailable === true && formData.hospitalProfile.subdomain && (
              <p className="mt-1 text-sm text-success-500 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Subdomain is available
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="form-label required">Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                value={formData.hospitalProfile.address}
                onChange={(e) => handleInputChange('hospitalProfile', 'address', e.target.value)}
                className={`form-input pl-10 ${errors.address ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                rows={3}
                placeholder="123 Medical Center Dr, City, State, ZIP"
              />
            </div>
            {errors.address && <p className="form-error mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="form-label required">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={formData.hospitalProfile.phone}
                onChange={(e) => handleInputChange('hospitalProfile', 'phone', e.target.value)}
                className={`form-input pl-10 ${errors.phone ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            {errors.phone && <p className="form-error mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.hospitalProfile.email}
                onChange={(e) => handleInputChange('hospitalProfile', 'email', e.target.value)}
                className={`form-input pl-10 ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="hospital@example.com"
              />
            </div>
            {errors.email && <p className="form-error mt-1">{errors.email}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="form-label required">Contact Person</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.hospitalProfile.contactPerson}
                onChange={(e) => handleInputChange('hospitalProfile', 'contactPerson', e.target.value)}
                className={`form-input pl-10 ${errors.contactPerson ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="John Doe"
              />
            </div>
            {errors.contactPerson && <p className="form-error mt-1">{errors.contactPerson}</p>}
            <p className="mt-1 text-sm text-gray-500">
              This person will be the primary contact and initial administrator for the hospital.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminSetupForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Admin Account Setup</h3>
              <p className="mt-1 text-sm text-primary-700">
                Create the initial administrator account for the hospital. This user will have full access to manage the hospital's settings and users.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="form-label required">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.adminSetup.email}
                onChange={(e) => handleInputChange('adminSetup', 'email', e.target.value)}
                className={`form-input pl-10 ${errors.adminEmail ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                placeholder="admin@example.com"
              />
            </div>
            {errors.adminEmail && <p className="form-error mt-1">{errors.adminEmail}</p>}
            <p className="mt-1 text-sm text-gray-500">
              This email will be used for login and important notifications.
            </p>
          </div>

          <div>
            <label className="form-label required">First Name</label>
            <input
              type="text"
              value={formData.adminSetup.firstName}
              onChange={(e) => handleInputChange('adminSetup', 'firstName', e.target.value)}
              className={`form-input ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              placeholder="John"
            />
            {errors.firstName && <p className="form-error mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="form-label required">Last Name</label>
            <input
              type="text"
              value={formData.adminSetup.lastName}
              onChange={(e) => handleInputChange('adminSetup', 'lastName', e.target.value)}
              className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              placeholder="Doe"
            />
            {errors.lastName && <p className="form-error mt-1">{errors.lastName}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Initial Password (Auto-generated)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.adminSetup.password}
                readOnly
                className="form-input pl-10 bg-gray-50 font-mono"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This secure password has been automatically generated. The admin will be required to change it upon first login.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendCredentials"
                checked={formData.adminSetup.sendCredentials}
                onChange={(e) => handleInputChange('adminSetup', 'sendCredentials', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                Send login credentials to admin email
              </label>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    The admin will be required to change their password upon first login.
                    Please ensure the initial password is communicated safely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModuleSelectionForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="flex items-start">
            <Box className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Module Selection</h3>
              <p className="mt-1 text-sm text-primary-700">
                Select the modules that will be available to the hospital. You can add more modules later.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Outpatient Modules</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 'patient_management', name: 'Patient Management', description: 'Registration, medical records', icon: <User className="h-5 w-5 text-primary-500" /> },
                { id: 'appointment_scheduling', name: 'Appointment Scheduling', description: 'Calendar, reminders', icon: <Calendar className="h-5 w-5 text-primary-500" /> },
                { id: 'billing', name: 'Billing', description: 'Invoicing, payments', icon: <DollarSign className="h-5 w-5 text-primary-500" /> },
                { id: 'pharmacy', name: 'Pharmacy', description: 'Prescriptions, inventory', icon: <Pill className="h-5 w-5 text-primary-500" /> },
                { id: 'laboratory', name: 'Laboratory', description: 'Test orders, results', icon: <Flask className="h-5 w-5 text-primary-500" /> },
                { id: 'radiology', name: 'Radiology', description: 'Imaging orders, results', icon: <Microscope className="h-5 w-5 text-primary-500" /> }
              ].map((module) => (
                <div 
                  key={module.id} 
                  className={`relative flex items-start p-4 rounded-lg border ${
                    formData.moduleSelection.outpatient.includes(module.id) 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-colors`}
                  onClick={() => handleModuleToggle('outpatient', module.id)}
                >
                  <div className="flex items-center h-5">
                    <input
                      id={`outpatient-${module.id}`}
                      type="checkbox"
                      checked={formData.moduleSelection.outpatient.includes(module.id)}
                      onChange={() => handleModuleToggle('outpatient', module.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {module.icon}
                      </div>
                      <label htmlFor={`outpatient-${module.id}`} className="font-medium text-gray-900">
                        {module.name}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors.modules && <p className="form-error mt-2">{errors.modules}</p>}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inpatient Modules</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 'ward_management', name: 'Ward Management', description: 'Bed tracking, patient care', icon: <BedDouble className="h-5 w-5 text-primary-500" /> },
                { id: 'nursing_station', name: 'Nursing Station', description: 'Care plans, medication', icon: <Stethoscope className="h-5 w-5 text-primary-500" /> },
                { id: 'surgery', name: 'Surgery', description: 'OR scheduling, procedures', icon: <Syringe className="h-5 w-5 text-primary-500" /> }
              ].map((module) => (
                <div 
                  key={module.id} 
                  className={`relative flex items-start p-4 rounded-lg border ${
                    formData.moduleSelection.inpatient.includes(module.id) 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-colors`}
                  onClick={() => handleModuleToggle('inpatient', module.id)}
                >
                  <div className="flex items-center h-5">
                    <input
                      id={`inpatient-${module.id}`}
                      type="checkbox"
                      checked={formData.moduleSelection.inpatient.includes(module.id)}
                      onChange={() => handleModuleToggle('inpatient', module.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {module.icon}
                      </div>
                      <label htmlFor={`inpatient-${module.id}`} className="font-medium text-gray-900">
                        {module.name}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shared Modules</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 'reporting', name: 'Reporting', description: 'Analytics, dashboards', icon: <BarChart className="h-5 w-5 text-primary-500" /> },
                { id: 'user_management', name: 'User Management', description: 'Roles, permissions', icon: <Users className="h-5 w-5 text-primary-500" /> },
                { id: 'settings', name: 'Settings', description: 'System configuration', icon: <Settings className="h-5 w-5 text-primary-500" /> }
              ].map((module) => (
                <div 
                  key={module.id} 
                  className={`relative flex items-start p-4 rounded-lg border ${
                    formData.moduleSelection.shared.includes(module.id) 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-colors`}
                  onClick={() => handleModuleToggle('shared', module.id)}
                >
                  <div className="flex items-center h-5">
                    <input
                      id={`shared-${module.id}`}
                      type="checkbox"
                      checked={formData.moduleSelection.shared.includes(module.id)}
                      onChange={() => handleModuleToggle('shared', module.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {module.icon}
                      </div>
                      <label htmlFor={`shared-${module.id}`} className="font-medium text-gray-900">
                        {module.name}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors.shared && <p className="form-error mt-2">{errors.shared}</p>}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add-on Modules</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 'telemedicine', name: 'Telemedicine', description: 'Virtual consultations', icon: <Video className="h-5 w-5 text-primary-500" /> },
                { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Business intelligence', icon: <LineChart className="h-5 w-5 text-primary-500" /> },
                { id: 'patient_portal', name: 'Patient Portal', description: 'Patient access', icon: <UserRound className="h-5 w-5 text-primary-500" /> }
              ].map((module) => (
                <div 
                  key={module.id} 
                  className={`relative flex items-start p-4 rounded-lg border ${
                    formData.moduleSelection.addons.includes(module.id) 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-colors`}
                  onClick={() => handleModuleToggle('addons', module.id)}
                >
                  <div className="flex items-center h-5">
                    <input
                      id={`addon-${module.id}`}
                      type="checkbox"
                      checked={formData.moduleSelection.addons.includes(module.id)}
                      onChange={() => handleModuleToggle('addons', module.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {module.icon}
                      </div>
                      <label htmlFor={`addon-${module.id}`} className="font-medium text-gray-900">
                        {module.name}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPricingPlanForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="flex items-start">
            <CreditCard className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Pricing Plan</h3>
              <p className="mt-1 text-sm text-primary-700">
                Select the pricing plan that best fits the hospital's needs. You can upgrade or downgrade later.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              id: 'basic',
              name: 'Basic',
              price: 99,
              description: 'Essential features for small clinics',
              features: ['Up to 5 users', '10GB storage', 'Basic support', 'Core modules only']
            },
            {
              id: 'standard',
              name: 'Standard',
              price: 299,
              description: 'Comprehensive solution for mid-sized facilities',
              features: ['Up to 20 users', '50GB storage', 'Priority support', 'All core modules', 'Basic reporting']
            },
            {
              id: 'premium',
              name: 'Premium',
              price: 599,
              description: 'Advanced features for large hospitals',
              features: ['Unlimited users', '200GB storage', '24/7 support', 'All modules', 'Advanced analytics']
            }
          ].map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                formData.pricingPlan.plan === plan.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('pricingPlan', 'plan', plan.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                {formData.pricingPlan.plan === plan.id && (
                  <CheckCircle className="h-5 w-5 text-primary-500" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.id === 'standard' && (
                <div className="mt-4 bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full inline-block">
                  Recommended
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.plan && <p className="form-error mt-2">{errors.plan}</p>}
      </div>
    );
  };

  const renderLicenseDetailsForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="flex items-start">
            <Key className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">License Details</h3>
              <p className="mt-1 text-sm text-primary-700">
                Configure the license details for the hospital. This determines how long the hospital will have access to the system.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label required">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={formData.licenseDetails.startDate}
                onChange={(e) => handleInputChange('licenseDetails', 'startDate', e.target.value)}
                className={`form-input pl-10 ${errors.startDate ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              />
            </div>
            {errors.startDate && <p className="form-error mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className="form-label required">License Type</label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.licenseDetails.type === 'monthly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('licenseDetails', 'type', 'monthly')}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-medium text-gray-900">Monthly</h3>
                  {formData.licenseDetails.type === 'monthly' && (
                    <CheckCircle className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.licenseDetails.type === 'yearly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('licenseDetails', 'type', 'yearly')}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-medium text-gray-900">Yearly</h3>
                  {formData.licenseDetails.type === 'yearly' && (
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
                  formData.licenseDetails.type === 'lifetime'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('licenseDetails', 'type', 'lifetime')}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-medium text-gray-900">Lifetime</h3>
                  {formData.licenseDetails.type === 'lifetime' && (
                    <CheckCircle className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">One-time payment, lifetime access</p>
                <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                  40% off
                </span>
              </div>
            </div>
            {errors.type && <p className="form-error mt-1">{errors.type}</p>}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.licenseDetails.autoRenew}
                onChange={(e) => handleInputChange('licenseDetails', 'autoRenew', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={formData.licenseDetails.type === 'lifetime'}
              />
              <label
                htmlFor="autoRenew"
                className={`ml-2 block text-sm ${
                  formData.licenseDetails.type === 'lifetime' ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                Auto-renew license
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {formData.licenseDetails.type === 'lifetime' 
                ? 'Auto-renewal is not applicable for lifetime licenses.' 
                : 'The license will be automatically renewed before expiration.'}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Notes</label>
            <textarea
              value={formData.licenseDetails.notes}
              onChange={(e) => handleInputChange('licenseDetails', 'notes', e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Any additional notes about this license"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderReviewForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Review & Confirm</h3>
              <p className="mt-1 text-sm text-primary-700">
                Please review all information before creating the hospital. Once created, some settings may require administrator assistance to change.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Building2 className="h-5 w-5 text-primary-500 mr-2" />
              Hospital Profile
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.hospitalProfile.name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.hospitalProfile.subdomain}.searchable.today</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.hospitalProfile.address}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.hospitalProfile.phone}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.hospitalProfile.email || 'Not provided'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.hospitalProfile.contactPerson}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-5 w-5 text-primary-500 mr-2" />
              Admin Account
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.adminSetup.firstName} {formData.adminSetup.lastName}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.adminSetup.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Initial Password</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{formData.adminSetup.password}</dd>
                <dd className="mt-1 text-xs text-warning-600 flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Make sure to securely share this password with the admin. They will be required to change it on first login.
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Send Credentials</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.adminSetup.sendCredentials ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Box className="h-5 w-5 text-primary-500 mr-2" />
              Modules
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Outpatient</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.moduleSelection.outpatient.length > 0
                    ? formData.moduleSelection.outpatient
                        .map((m) => m.replace('_', ' '))
                        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(', ')
                    : 'None'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Inpatient</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.moduleSelection.inpatient.length > 0
                    ? formData.moduleSelection.inpatient
                        .map((m) => m.replace('_', ' '))
                        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(', ')
                    : 'None'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Shared</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.moduleSelection.shared.length > 0
                    ? formData.moduleSelection.shared
                        .map((m) => m.replace('_', ' '))
                        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(', ')
                    : 'None'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Add-ons</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.moduleSelection.addons.length > 0
                    ? formData.moduleSelection.addons
                        .map((m) => m.replace('_', ' '))
                        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(', ')
                    : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-5 w-5 text-primary-500 mr-2" />
              Pricing & License
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.pricingPlan.plan.charAt(0).toUpperCase() + formData.pricingPlan.plan.slice(1)}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.licenseDetails.startDate}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">License Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.licenseDetails.type.charAt(0).toUpperCase() + formData.licenseDetails.type.slice(1)}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Auto-Renew</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.licenseDetails.type === 'lifetime'
                    ? 'N/A'
                    : formData.licenseDetails.autoRenew
                    ? 'Yes'
                    : 'No'}
                </dd>
              </div>
              {formData.licenseDetails.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.licenseDetails.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new hospital and set up its initial configuration.
        </p>
      </div>

      {renderStepIndicator()}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {currentStep === 1 && renderHospitalProfileForm()}
        {currentStep === 2 && renderAdminSetupForm()}
        {currentStep === 3 && renderModuleSelectionForm()}
        {currentStep === 4 && renderPricingPlanForm()}
        {currentStep === 5 && renderLicenseDetailsForm()}
        {currentStep === 6 && renderReviewForm()}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`btn ${
            currentStep === 1 ? 'btn-disabled opacity-50 cursor-not-allowed' : 'btn-outline'
          } inline-flex items-center`}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        {currentStep < 6 ? (
          <button
            type="button"
            onClick={handleNext}
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
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
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