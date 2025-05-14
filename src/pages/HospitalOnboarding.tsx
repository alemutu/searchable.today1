import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { 
  Building2, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  Globe, 
  Package, 
  CreditCard, 
  Key, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

// Step interfaces
interface HospitalProfile {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  address: string;
  subdomain: string;
}

interface AdminSetup {
  generatePassword: boolean;
  password: string;
  forcePasswordChange: boolean;
  sendCredentials: boolean;
}

interface ModuleSelection {
  outpatient: string[];
  inpatient: string[];
  shared: string[];
  addons: string[];
  template: string;
}

interface PricingPlan {
  plan: 'starter' | 'pro' | 'enterprise' | 'custom';
  customModules?: string[];
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
  const { isAdmin } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Form state
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfile>({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    address: '',
    subdomain: ''
  });
  
  const [adminSetup, setAdminSetup] = useState<AdminSetup>({
    generatePassword: true,
    password: generateRandomPassword(),
    forcePasswordChange: true,
    sendCredentials: true
  });
  
  const [moduleSelection, setModuleSelection] = useState<ModuleSelection>({
    outpatient: ['patient_registration', 'consultations', 'pharmacy', 'billing', 'queue'],
    inpatient: [],
    shared: ['lab'],
    addons: [],
    template: 'starter'
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
  
  // Redirect if not admin
  if (!isAdmin) {
    navigate('/super-admin');
    return null;
  }
  
  // Helper functions
  function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
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
  
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!hospitalProfile.name || !hospitalProfile.email || !hospitalProfile.phone || !hospitalProfile.address) {
        addNotification({
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(hospitalProfile.email)) {
        addNotification({
          message: 'Please enter a valid email address',
          type: 'error'
        });
        return;
      }
      
      // Validate subdomain format if provided
      if (hospitalProfile.subdomain) {
        const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!subdomainRegex.test(hospitalProfile.subdomain)) {
          addNotification({
            message: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
            type: 'error'
          });
          return;
        }
      }
    }
    
    // Move to next step
    setCurrentStep(currentStep + 1);
  };
  
  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const applyTemplate = (template: string) => {
    switch (template) {
      case 'starter':
        setModuleSelection({
          ...moduleSelection,
          outpatient: ['patient_registration', 'consultations', 'pharmacy', 'billing', 'queue'],
          inpatient: [],
          shared: ['lab'],
          addons: [],
          template: 'starter'
        });
        setPricingPlan({ plan: 'starter' });
        break;
      case 'pro':
        setModuleSelection({
          ...moduleSelection,
          outpatient: ['patient_registration', 'consultations', 'pharmacy', 'billing', 'queue', 'appointments'],
          inpatient: ['admission', 'beds', 'nurse_care', 'discharge'],
          shared: ['lab', 'radiology', 'reports'],
          addons: [],
          template: 'pro'
        });
        setPricingPlan({ plan: 'pro' });
        break;
      case 'enterprise':
        setModuleSelection({
          ...moduleSelection,
          outpatient: ['patient_registration', 'consultations', 'pharmacy', 'billing', 'queue', 'appointments'],
          inpatient: ['admission', 'beds', 'nurse_care', 'discharge'],
          shared: ['lab', 'radiology', 'ambulance', 'reports', 'hr', 'finance'],
          addons: ['pos', 'ai_assistant', 'insurance', 'inventory', 'doctor_portal'],
          template: 'enterprise'
        });
        setPricingPlan({ plan: 'enterprise' });
        break;
      default:
        break;
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // 1. Create hospital record
      const { data: hospitalData, error: hospitalError } = await supabase
        .from('hospitals')
        .insert([{
          name: hospitalProfile.name,
          subdomain: hospitalProfile.subdomain || hospitalProfile.name.toLowerCase().replace(/\s+/g, '-'),
          address: hospitalProfile.address,
          phone: hospitalProfile.phone,
          email: hospitalProfile.email,
          domain_enabled: true
        }])
        .select()
        .single();
      
      if (hospitalError) throw hospitalError;
      
      // 2. Create admin user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: hospitalProfile.email,
        password: adminSetup.password,
        email_confirm: true,
        user_metadata: {
          first_name: hospitalProfile.contactPerson.split(' ')[0] || 'Admin',
          last_name: hospitalProfile.contactPerson.split(' ').slice(1).join(' ') || 'User',
          role: 'admin',
          hospital_id: hospitalData.id
        }
      });
      
      if (userError) throw userError;
      
      // 3. Create profile for admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userData.user.id,
          first_name: hospitalProfile.contactPerson.split(' ')[0] || 'Admin',
          last_name: hospitalProfile.contactPerson.split(' ').slice(1).join(' ') || 'User',
          role: 'admin',
          hospital_id: hospitalData.id,
          email: hospitalProfile.email
        }]);
      
      if (profileError) throw profileError;
      
      // 4. Store selected modules
      const allModules = [
        ...moduleSelection.outpatient.map(m => ({ module: m, category: 'outpatient' })),
        ...moduleSelection.inpatient.map(m => ({ module: m, category: 'inpatient' })),
        ...moduleSelection.shared.map(m => ({ module: m, category: 'shared' })),
        ...moduleSelection.addons.map(m => ({ module: m, category: 'addon' }))
      ];
      
      const { error: modulesError } = await supabase
        .from('hospital_modules')
        .insert(allModules.map(m => ({
          hospital_id: hospitalData.id,
          module_key: m.module,
          category: m.category,
          is_active: true
        })));
      
      if (modulesError) throw modulesError;
      
      // 5. Create license
      const { error: licenseError } = await supabase
        .from('licenses')
        .insert([{
          hospital_id: hospitalData.id,
          plan_id: getPlanId(pricingPlan.plan),
          start_date: licenseDetails.startDate,
          end_date: licenseDetails.type !== 'lifetime' ? calculateEndDate(licenseDetails.startDate, licenseDetails.type) : null,
          status: 'active',
          max_users: getPlanUserLimit(pricingPlan.plan),
          current_users: 1, // Admin user
          features: {},
          billing_info: {
            billing_cycle: licenseDetails.type,
            auto_renew: licenseDetails.autoRenew,
            payment_status: 'paid',
            notes: licenseDetails.notes
          }
        }]);
      
      if (licenseError) throw licenseError;
      
      // 6. Send email if enabled
      if (adminSetup.sendCredentials) {
        // In a real app, this would send an email
        console.log('Sending email to:', hospitalProfile.email);
        console.log('Password:', adminSetup.password);
      }
      
      // Success notification
      addNotification({
        message: `Hospital ${hospitalProfile.name} created successfully!`,
        type: 'success'
      });
      
      // Navigate back to super admin dashboard
      navigate('/super-admin');
      
    } catch (error: any) {
      console.error('Error creating hospital:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper functions for license and plan
  const getPlanId = (plan: string): string => {
    // In a real app, this would fetch the actual plan IDs from the database
    const planIds: Record<string, string> = {
      'starter': '00000000-0000-0000-0000-000000000001',
      'pro': '00000000-0000-0000-0000-000000000002',
      'enterprise': '00000000-0000-0000-0000-000000000003',
      'custom': '00000000-0000-0000-0000-000000000004'
    };
    return planIds[plan] || planIds.starter;
  };
  
  const getPlanUserLimit = (plan: string): number => {
    const limits: Record<string, number> = {
      'starter': 5,
      'pro': 20,
      'enterprise': 100,
      'custom': 10
    };
    return limits[plan] || limits.starter;
  };
  
  const calculateEndDate = (startDate: string, licenseType: 'monthly' | 'yearly'): string => {
    const date = new Date(startDate);
    if (licenseType === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString().split('T')[0];
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Hospital Profile Setup</h2>
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
                    onChange={(e) => setHospitalProfile({...hospitalProfile, name: e.target.value})}
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
                    onChange={(e) => setHospitalProfile({...hospitalProfile, email: e.target.value})}
                    className="form-input pl-10"
                    placeholder="hospital@example.com"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">This email will be used for admin login.</p>
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
                    onChange={(e) => setHospitalProfile({...hospitalProfile, contactPerson: e.target.value})}
                    className="form-input pl-10"
                    placeholder="Full name of primary contact"
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
                    onChange={(e) => setHospitalProfile({...hospitalProfile, phone: e.target.value})}
                    className="form-input pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
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
                    onChange={(e) => setHospitalProfile({...hospitalProfile, address: e.target.value})}
                    className="form-input pl-10"
                    rows={3}
                    placeholder="Full address of the hospital"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Subdomain (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={hospitalProfile.subdomain}
                    onChange={(e) => setHospitalProfile({...hospitalProfile, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="form-input pl-10"
                    placeholder="hospital-name"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {hospitalProfile.subdomain ? 
                    `Hospital will be accessible at ${hospitalProfile.subdomain}.searchable.today` : 
                    'If not provided, a subdomain will be generated from the hospital name.'}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Admin Login Setup</h2>
            <p className="text-sm text-gray-600">Configure the admin account for this hospital.</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Admin Email:</span> {hospitalProfile.email}
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generatePassword"
                  checked={adminSetup.generatePassword}
                  onChange={(e) => setAdminSetup({...adminSetup, generatePassword: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="generatePassword" className="ml-2 block text-sm text-gray-900">
                  Auto-generate secure password
                </label>
              </div>
              
              <div>
                <label className="form-label required">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminSetup.password}
                    onChange={(e) => setAdminSetup({...adminSetup, password: e.target.value})}
                    disabled={adminSetup.generatePassword}
                    className={`form-input pr-20 ${adminSetup.generatePassword ? 'bg-gray-100' : ''}`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      {passwordCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {passwordCopied && (
                  <p className="mt-1 text-xs text-green-600">Password copied to clipboard!</p>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="forcePasswordChange"
                  checked={adminSetup.forcePasswordChange}
                  onChange={(e) => setAdminSetup({...adminSetup, forcePasswordChange: e.target.checked})}
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
                  onChange={(e) => setAdminSetup({...adminSetup, sendCredentials: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="sendCredentials" className="ml-2 block text-sm text-gray-900">
                  Send login credentials via email
                </label>
              </div>
              
              {adminSetup.sendCredentials && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Email Preview</h3>
                  <div className="bg-white p-3 rounded border border-blue-100 text-sm">
                    <p><strong>Subject:</strong> Your Hospital Management System Access</p>
                    <p><strong>To:</strong> {hospitalProfile.email}</p>
                    <hr className="my-2 border-blue-100" />
                    <p>Dear {hospitalProfile.contactPerson},</p>
                    <p className="my-2">Your hospital ({hospitalProfile.name}) has been set up in our system. You can access your dashboard using the following credentials:</p>
                    <p><strong>URL:</strong> https://{hospitalProfile.subdomain || hospitalProfile.name.toLowerCase().replace(/\s+/g, '-')}.searchable.today</p>
                    <p><strong>Email:</strong> {hospitalProfile.email}</p>
                    <p><strong>Password:</strong> [Your temporary password]</p>
                    <p className="my-2">For security reasons, you will be required to change your password upon first login.</p>
                    <p>If you have any questions, please contact our support team.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Modules</h2>
            <p className="text-sm text-gray-600">Choose which modules to enable for this hospital.</p>
            
            <div className="space-y-4">
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => applyTemplate('starter')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    moduleSelection.template === 'starter' 
                      ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Starter Template
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('pro')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    moduleSelection.template === 'pro' 
                      ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Pro Template
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('enterprise')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    moduleSelection.template === 'enterprise' 
                      ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Enterprise Template
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Outpatient Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Outpatient Modules</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'patient_registration', label: 'Patient Registration' },
                      { id: 'consultations', label: 'Consultations' },
                      { id: 'pharmacy', label: 'Pharmacy' },
                      { id: 'billing', label: 'Billing' },
                      { id: 'queue', label: 'Queue Management' },
                      { id: 'appointments', label: 'Appointments' }
                    ].map(module => (
                      <div key={module.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`outpatient-${module.id}`}
                          checked={moduleSelection.outpatient.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                outpatient: [...moduleSelection.outpatient, module.id],
                                template: 'custom'
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                outpatient: moduleSelection.outpatient.filter(m => m !== module.id),
                                template: 'custom'
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`outpatient-${module.id}`} className="ml-2 block text-sm text-gray-900">
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Inpatient Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Inpatient Modules</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'admission', label: 'Admission' },
                      { id: 'beds', label: 'Bed Management' },
                      { id: 'nurse_care', label: 'Nurse Care' },
                      { id: 'discharge', label: 'Discharge' }
                    ].map(module => (
                      <div key={module.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`inpatient-${module.id}`}
                          checked={moduleSelection.inpatient.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                inpatient: [...moduleSelection.inpatient, module.id],
                                template: 'custom'
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                inpatient: moduleSelection.inpatient.filter(m => m !== module.id),
                                template: 'custom'
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`inpatient-${module.id}`} className="ml-2 block text-sm text-gray-900">
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Shared/General Modules */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Shared/General Modules</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'lab', label: 'Laboratory' },
                      { id: 'radiology', label: 'Radiology' },
                      { id: 'ambulance', label: 'Ambulance' },
                      { id: 'reports', label: 'Reports' },
                      { id: 'hr', label: 'HR Management' },
                      { id: 'finance', label: 'Finance' }
                    ].map(module => (
                      <div key={module.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`shared-${module.id}`}
                          checked={moduleSelection.shared.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                shared: [...moduleSelection.shared, module.id],
                                template: 'custom'
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                shared: moduleSelection.shared.filter(m => m !== module.id),
                                template: 'custom'
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`shared-${module.id}`} className="ml-2 block text-sm text-gray-900">
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Optional Add-ons */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Optional Add-ons</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'pos', label: 'Point of Sale (POS)' },
                      { id: 'ai_assistant', label: 'AI Assistant' },
                      { id: 'insurance', label: 'Insurance Management' },
                      { id: 'inventory', label: 'Inventory Management' },
                      { id: 'doctor_portal', label: 'Doctor Portal' }
                    ].map(module => (
                      <div key={module.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`addon-${module.id}`}
                          checked={moduleSelection.addons.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleSelection({
                                ...moduleSelection,
                                addons: [...moduleSelection.addons, module.id],
                                template: 'custom'
                              });
                            } else {
                              setModuleSelection({
                                ...moduleSelection,
                                addons: moduleSelection.addons.filter(m => m !== module.id),
                                template: 'custom'
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`addon-${module.id}`} className="ml-2 block text-sm text-gray-900">
                          {module.label}
                        </label>
                      </div>
                    ))}
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
            <p className="text-sm text-gray-600">Choose a pricing plan based on the hospital's needs.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className={`bg-white p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  pricingPlan.plan === 'starter' 
                    ? 'border-primary-500 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
                onClick={() => setPricingPlan({ plan: 'starter' })}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">Starter Plan</h3>
                  {pricingPlan.plan === 'starter' && (
                    <CheckCircle className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">Outpatient modules only</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 5 users</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Basic patient management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Consultations & billing</span>
                  </li>
                </ul>
              </div>
              
              <div 
                className={`bg-white p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  pricingPlan.plan === 'pro' 
                    ? 'border-primary-500 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
                onClick={() => setPricingPlan({ plan: 'pro' })}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">Pro Plan</h3>
                  {pricingPlan.plan === 'pro' && (
                    <CheckCircle className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">Outpatient + Inpatient</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">$299</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 20 users</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Full patient management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Inpatient ward management</span>
                  </li>
                </ul>
              </div>
              
              <div 
                className={`bg-white p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  pricingPlan.plan === 'enterprise' 
                    ? 'border-primary-500 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
                onClick={() => setPricingPlan({ plan: 'enterprise' })}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
                  {pricingPlan.plan === 'enterprise' && (
                    <CheckCircle className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">All modules + Add-ons</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">$599</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 100 users</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">All modules included</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {moduleSelection.template === 'custom' && (
              <div className="mt-6">
                <div 
                  className={`bg-white p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    pricingPlan.plan === 'custom' 
                      ? 'border-primary-500 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                  onClick={() => setPricingPlan({ plan: 'custom' })}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">Custom Plan</h3>
                    {pricingPlan.plan === 'custom' && (
                      <CheckCircle className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Based on selected modules</p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">Custom</span>
                    <span className="text-gray-500"> pricing</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Selected Modules:</h4>
                      <p className="text-sm text-gray-600">
                        {moduleSelection.outpatient.length} Outpatient, {moduleSelection.inpatient.length} Inpatient, 
                        {moduleSelection.shared.length} Shared, {moduleSelection.addons.length} Add-ons
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">User Limit:</h4>
                      <p className="text-sm text-gray-600">10 users (customizable)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">License Management</h2>
            <p className="text-sm text-gray-600">Configure the license details for this hospital.</p>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">License Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      licenseDetails.type === 'monthly' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({...licenseDetails, type: 'monthly'})}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium text-gray-900">Monthly</h3>
                      {licenseDetails.type === 'monthly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Billed monthly</p>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        {pricingPlan.plan === 'starter' ? '$99' : 
                         pricingPlan.plan === 'pro' ? '$299' : 
                         pricingPlan.plan === 'enterprise' ? '$599' : 'Custom'}
                      </span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      licenseDetails.type === 'yearly' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({...licenseDetails, type: 'yearly'})}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium text-gray-900">Yearly</h3>
                      {licenseDetails.type === 'yearly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Save 20% with annual billing</p>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        {pricingPlan.plan === 'starter' ? '$950' : 
                         pricingPlan.plan === 'pro' ? '$2,870' : 
                         pricingPlan.plan === 'enterprise' ? '$5,750' : 'Custom'}
                      </span>
                      <span className="text-gray-500">/year</span>
                    </div>
                    <span className="mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      20% off
                    </span>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      licenseDetails.type === 'lifetime' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setLicenseDetails({...licenseDetails, type: 'lifetime'})}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium text-gray-900">Lifetime</h3>
                      {licenseDetails.type === 'lifetime' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">One-time payment</p>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        {pricingPlan.plan === 'starter' ? '$2,376' : 
                         pricingPlan.plan === 'pro' ? '$7,176' : 
                         pricingPlan.plan === 'enterprise' ? '$14,376' : 'Custom'}
                      </span>
                    </div>
                    <span className="mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Best value
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={licenseDetails.startDate}
                  onChange={(e) => setLicenseDetails({...licenseDetails, startDate: e.target.value})}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              {licenseDetails.type !== 'lifetime' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={licenseDetails.autoRenew}
                    onChange={(e) => setLicenseDetails({...licenseDetails, autoRenew: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                    Auto-renew subscription
                  </label>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendInvoice"
                  checked={licenseDetails.sendInvoice}
                  onChange={(e) => setLicenseDetails({...licenseDetails, sendInvoice: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="sendInvoice" className="ml-2 block text-sm text-gray-900">
                  Send invoice/receipt via email
                </label>
              </div>
              
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={licenseDetails.notes}
                  onChange={(e) => setLicenseDetails({...licenseDetails, notes: e.target.value})}
                  className="form-input"
                  rows={3}
                  placeholder="Any special notes about this license (e.g., discounts applied)"
                />
              </div>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Final Confirmation</h2>
            <p className="text-sm text-gray-600">Review the information before creating the hospital.</p>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Hospital Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{hospitalProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{hospitalProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="text-sm font-medium text-gray-900">{hospitalProfile.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{hospitalProfile.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{hospitalProfile.address}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Subdomain</p>
                    <p className="text-sm font-medium text-gray-900">
                      {hospitalProfile.subdomain || hospitalProfile.name.toLowerCase().replace(/\s+/g, '-')}.searchable.today
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-medium text-gray-900 mb-2">Admin Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Admin Email</p>
                    <p className="text-sm font-medium text-gray-900">{hospitalProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Password</p>
                    <p className="text-sm font-medium text-gray-900">
                      {showPassword ? adminSetup.password : '••••••••••••'}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-gray-400 hover:text-gray-500"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 inline" /> : <Eye className="h-4 w-4 inline" />}
                      </button>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Force Password Change</p>
                    <p className="text-sm font-medium text-gray-900">{adminSetup.forcePasswordChange ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Send Credentials Email</p>
                    <p className="text-sm font-medium text-gray-900">{adminSetup.sendCredentials ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-medium text-gray-900 mb-2">Modules & Plan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Template</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{moduleSelection.template}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pricing Plan</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{pricingPlan.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outpatient Modules</p>
                    <p className="text-sm font-medium text-gray-900">{moduleSelection.outpatient.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inpatient Modules</p>
                    <p className="text-sm font-medium text-gray-900">{moduleSelection.inpatient.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shared Modules</p>
                    <p className="text-sm font-medium text-gray-900">{moduleSelection.shared.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Add-ons</p>
                    <p className="text-sm font-medium text-gray-900">{moduleSelection.addons.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-medium text-gray-900 mb-2">License Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">License Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{licenseDetails.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">{licenseDetails.startDate}</p>
                  </div>
                  {licenseDetails.type !== 'lifetime' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {calculateEndDate(licenseDetails.startDate, licenseDetails.type as 'monthly' | 'yearly')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Auto-Renew</p>
                        <p className="text-sm font-medium text-gray-900">{licenseDetails.autoRenew ? 'Yes' : 'No'}</p>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-sm font-medium text-gray-900">{licenseDetails.notes || 'None'}</p>
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hospital Onboarding</h1>
          <div className="text-sm text-gray-500">Step {currentStep} of 6</div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-primary-500 h-2.5 rounded-full" 
            style={{ width: `${(currentStep / 6) * 100}%` }}
          ></div>
        </div>
        
        {/* Step content */}
        {renderStep()}
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className={`btn ${
              currentStep === 1 
                ? 'btn-outline opacity-50 cursor-not-allowed' 
                : 'btn-outline'
            } inline-flex items-center`}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Previous
          </button>
          
          {currentStep < 6 ? (
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
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  Create Hospital
                  <CheckCircle className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalOnboarding;