import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  Key, 
  Users, 
  HardDrive, 
  Calendar, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Save,
  Plus,
  BarChart,
  BedDouble,
  Activity,
  Video,
  Zap,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface License {
  id: string;
  plan: {
    id: string;
    name: string;
    features: any;
  };
  start_date: string;
  end_date: string | null;
  status: string;
  max_users: number;
  current_users: number;
  features: any;
  billing_info: any;
  purchased_add_ons?: {
    id: string;
    name: string;
    price: number;
    billing_cycle: string;
    purchase_date: string;
    expiry_date: string | null;
  }[];
}

interface PricingPlan {
  id: string;
  name: string;
  key: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: any;
  max_users: number;
  max_storage_gb: number;
}

interface AddOnModule {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  price_lifetime: number;
  features: string[];
}

const LicenseSettings: React.FC = () => {
  const { hospital } = useAuthStore();
  const [license, setLicense] = useState<License | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleAddOns, setModuleAddOns] = useState<AddOnModule[]>([
    {
      id: 'inpatient',
      name: 'Inpatient Management',
      description: 'Complete inpatient ward management, bed tracking, and patient care',
      price_monthly: 99.99,
      price_yearly: 959.90, // 20% discount
      price_lifetime: 2999.70, // 5 years at 50% discount
      features: [
        'Ward and bed management',
        'Inpatient medication tracking',
        'Nurse station dashboard',
        'Patient monitoring integration',
        'Discharge planning tools'
      ]
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Comprehensive reporting and analytics dashboard',
      price_monthly: 49.99,
      price_yearly: 479.90, // 20% discount
      price_lifetime: 1499.70, // 5 years at 50% discount
      features: [
        'Custom report builder',
        'Interactive dashboards',
        'Data export capabilities',
        'Trend analysis',
        'Financial performance metrics'
      ]
    },
    {
      id: 'telemedicine',
      name: 'Telemedicine',
      description: 'Virtual consultation and remote patient monitoring',
      price_monthly: 79.99,
      price_yearly: 767.90, // 20% discount
      price_lifetime: 2399.70, // 5 years at 50% discount
      features: [
        'Video consultation',
        'Secure messaging',
        'Virtual waiting room',
        'Screen sharing',
        'Digital prescription'
      ]
    }
  ]);

  useEffect(() => {
    fetchLicense();
    fetchAvailablePlans();
  }, [hospital]);

  const fetchLicense = async () => {
    if (!hospital?.id) return;

    try {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          plan:pricing_plans(
            id,
            name,
            features
          )
        `)
        .eq('hospital_id', hospital.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setLicense(data);
    } catch (error) {
      console.error('Error fetching license:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
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
    }
  };

  const handleUpgradeLicense = async () => {
    if (!license || !selectedPlan) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.rpc('upgrade_license', {
        license_id: license.id,
        new_plan_id: selectedPlan,
        billing_cycle: selectedBillingCycle
      });

      if (error) throw error;
      
      // Refresh license data
      await fetchLicense();
      setShowUpgradeModal(false);
    } catch (error: any) {
      console.error('Error upgrading license:', error.message);
      alert(`Failed to upgrade license: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchaseModule = async () => {
    if (!license || !selectedModule) return;

    setIsSaving(true);
    try {
      const selectedAddOn = moduleAddOns.find(m => m.id === selectedModule);
      if (!selectedAddOn) throw new Error('Selected module not found');

      // Get price based on billing cycle
      let price = selectedAddOn.price_monthly;
      if (selectedBillingCycle === 'yearly') {
        price = selectedAddOn.price_yearly;
      } else if (selectedBillingCycle === 'lifetime') {
        price = selectedAddOn.price_lifetime;
      }

      // Calculate expiry date
      let expiryDate = null;
      if (selectedBillingCycle === 'monthly') {
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (selectedBillingCycle === 'yearly') {
        expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }
      // Lifetime has no expiry date (null)

      // Add the purchased module to the license
      const purchasedAddOns = license.purchased_add_ons || [];
      const newAddOn = {
        id: selectedModule,
        name: selectedAddOn.name,
        price: price,
        billing_cycle: selectedBillingCycle,
        purchase_date: new Date().toISOString(),
        expiry_date: expiryDate ? expiryDate.toISOString() : null
      };

      const { error } = await supabase
        .from('licenses')
        .update({
          purchased_add_ons: [...purchasedAddOns, newAddOn]
        })
        .eq('id', license.id);

      if (error) throw error;
      
      // Refresh license data
      await fetchLicense();
      setShowAddModuleModal(false);
    } catch (error: any) {
      console.error('Error purchasing module:', error.message);
      alert(`Failed to purchase module: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'expired':
        return 'bg-error-100 text-error-800';
      case 'suspended':
        return 'bg-warning-100 text-warning-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!license?.end_date) return null;
    
    const end = new Date(license.end_date);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getModulePrice = (module: AddOnModule) => {
    switch (selectedBillingCycle) {
      case 'yearly':
        return formatCurrency(module.price_yearly);
      case 'lifetime':
        return formatCurrency(module.price_lifetime);
      case 'monthly':
      default:
        return formatCurrency(module.price_monthly);
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'yearly':
        return 'per year';
      case 'lifetime':
        return 'one-time payment';
      case 'monthly':
      default:
        return 'per month';
    }
  };

  const isModulePurchased = (moduleId: string) => {
    if (!license?.purchased_add_ons) return false;
    return license.purchased_add_ons.some(addon => addon.id === moduleId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">License Settings</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <Key className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Active License</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact support to activate your license.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">License Settings</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModuleModal(true)}
            className="btn btn-outline inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Modules
          </button>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Key className="h-5 w-5 mr-2" />
            Upgrade License
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
        {/* License Status */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">License Status</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(license.status)}`}>
                    {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                  </span>
                </div>
                {license.status === 'active' ? (
                  <CheckCircle className="h-5 w-5 text-success-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-error-500" />
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Plan</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{license.plan.name}</p>
                </div>
                <Key className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* License Details */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">License Details</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">Validity Period</span>
              </div>
              <p className="text-sm text-gray-500">
                From: {formatDate(license.start_date)}
                {license.end_date && (
                  <>
                    <br />
                    To: {formatDate(license.end_date)}
                  </>
                )}
              </p>
              {daysRemaining !== null && daysRemaining <= 30 && (
                <div className="mt-2 flex items-center text-warning-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {daysRemaining} days remaining
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">User Limits</span>
              </div>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{license.current_users} users</span>
                    <span>{license.max_users} max</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 rounded-full h-2"
                      style={{ width: `${(license.current_users / license.max_users) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Modules */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Available Modules</h2>
          
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">Outpatient Modules (Included)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Patient Management</span>
                </div>
                <p className="text-xs text-gray-500">
                  Registration, medical records, appointments
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Appointment Scheduling</span>
                </div>
                <p className="text-xs text-gray-500">
                  Calendar, reminders, online booking
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Pill className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Pharmacy Management</span>
                </div>
                <p className="text-xs text-gray-500">
                  Prescriptions, inventory, dispensing
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Flask className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Laboratory Management</span>
                </div>
                <p className="text-xs text-gray-500">
                  Test orders, results, reporting
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Microscope className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Radiology Management</span>
                </div>
                <p className="text-xs text-gray-500">
                  Imaging orders, results, PACS integration
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Billing Management</span>
                </div>
                <p className="text-xs text-gray-500">
                  Invoicing, payments, insurance claims
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <BarChart className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Simple Analytics</span>
                </div>
                <p className="text-xs text-gray-500">
                  Basic reports, dashboards, KPIs
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                    Included
                  </span>
                </div>
              </div>
            </div>
            
            <h3 className="text-md font-medium text-gray-700 mt-6">Premium Modules (Add-on)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moduleAddOns.map(module => {
                const isPurchased = isModulePurchased(module.id);
                return (
                  <div key={module.id} className={`p-4 rounded-lg border ${isPurchased ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center mb-2">
                      {module.id === 'inpatient' && <BedDouble className={`h-5 w-5 mr-2 ${isPurchased ? 'text-primary-500' : 'text-gray-400'}`} />}
                      {module.id === 'analytics' && <BarChart className={`h-5 w-5 mr-2 ${isPurchased ? 'text-primary-500' : 'text-gray-400'}`} />}
                      {module.id === 'telemedicine' && <Video className={`h-5 w-5 mr-2 ${isPurchased ? 'text-primary-500' : 'text-gray-400'}`} />}
                      <span className="text-sm font-medium text-gray-900">{module.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {module.description}
                    </p>
                    <div className="mt-2">
                      {isPurchased ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                          Purchased
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedModule(module.id);
                            setShowAddModuleModal(true);
                          }}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          Add Module
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Purchased Add-ons */}
        {license.purchased_add_ons && license.purchased_add_ons.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Purchased Add-ons</h2>
            <div className="space-y-4">
              {license.purchased_add_ons.map((addOn, index) => (
                <div key={index} className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        {addOn.id === 'inpatient' && <BedDouble className="h-5 w-5 text-primary-500 mr-2" />}
                        {addOn.id === 'analytics' && <BarChart className="h-5 w-5 text-primary-500 mr-2" />}
                        {addOn.id === 'telemedicine' && <Video className="h-5 w-5 text-primary-500 mr-2" />}
                        <h3 className="text-md font-medium text-gray-900">{addOn.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Purchased on {formatDate(addOn.purchase_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(addOn.price)} {addOn.billing_cycle !== 'lifetime' ? `/ ${addOn.billing_cycle}` : ''}
                      </p>
                      {addOn.expiry_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {formatDate(addOn.expiry_date)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Information */}
        {license.billing_info && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">{license.billing_info.payment_method || 'Credit Card'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Billing Cycle</dt>
                  <dd className="mt-1 text-sm text-gray-900">{license.billing_info.billing_cycle || 'Monthly'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Next Invoice</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {license.billing_info.next_invoice_date ? 
                      formatDate(license.billing_info.next_invoice_date) : 
                      'N/A'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Auto-Renewal</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      license.billing_info.auto_renew ? 
                        'bg-success-100 text-success-800' : 
                        'bg-gray-100 text-gray-800'
                    }`}>
                      {license.billing_info.auto_renew ? 'Enabled' : 'Disabled'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade License Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upgrade License</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="form-label">Select Plan</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
                  {availablePlans.map(plan => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPlan === plan.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                        {selectedPlan === plan.id && (
                          <CheckCircle className="h-5 w-5 text-primary-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-500">/{plan.billing_cycle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="form-label">Billing Cycle</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBillingCycle === 'monthly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBillingCycle('monthly')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Monthly</h3>
                      {selectedBillingCycle === 'monthly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBillingCycle === 'yearly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBillingCycle('yearly')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Yearly</h3>
                      {selectedBillingCycle === 'yearly' && (
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
                      selectedBillingCycle === 'lifetime' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBillingCycle('lifetime')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Lifetime</h3>
                      {selectedBillingCycle === 'lifetime' && (
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
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {selectedPlan && availablePlans.find(p => p.id === selectedPlan)?.price ? (
                      <>
                        {selectedBillingCycle === 'monthly' && (
                          formatCurrency(availablePlans.find(p => p.id === selectedPlan)!.price)
                        )}
                        {selectedBillingCycle === 'yearly' && (
                          formatCurrency(availablePlans.find(p => p.id === selectedPlan)!.price * 12 * 0.8)
                        )}
                        {selectedBillingCycle === 'lifetime' && (
                          formatCurrency(availablePlans.find(p => p.id === selectedPlan)!.price * 12 * 5 * 0.6)
                        )}
                        {' '}
                        <span className="text-sm font-normal text-gray-500">
                          {selectedBillingCycle !== 'lifetime' ? `/${selectedBillingCycle}` : ''}
                        </span>
                      </>
                    ) : (
                      'Select a plan'
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeLicense}
                disabled={!selectedPlan || isSaving}
                className="btn btn-primary inline-flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    Upgrade License
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModuleModal && selectedModule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Module</h2>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Module details */}
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                <div className="flex items-center mb-2">
                  {selectedModule === 'inpatient' && <BedDouble className="h-6 w-6 text-primary-500 mr-2" />}
                  {selectedModule === 'analytics' && <BarChart className="h-6 w-6 text-primary-500 mr-2" />}
                  {selectedModule === 'telemedicine' && <Video className="h-6 w-6 text-primary-500 mr-2" />}
                  <h3 className="text-lg font-medium text-gray-900">
                    {moduleAddOns.find(m => m.id === selectedModule)?.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {moduleAddOns.find(m => m.id === selectedModule)?.description}
                </p>
                
                <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                <ul className="space-y-1">
                  {moduleAddOns.find(m => m.id === selectedModule)?.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-primary-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <label className="form-label">Billing Cycle</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBillingCycle === 'monthly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBillingCycle('monthly')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Monthly</h3>
                      {selectedBillingCycle === 'monthly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                    <div className="mt-4">
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(moduleAddOns.find(m => m.id === selectedModule)?.price_monthly || 0)}
                      </span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBillingCycle === 'yearly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBillingCycle('yearly')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Yearly</h3>
                      {selectedBillingCycle === 'yearly' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Save 20% with annual billing</p>
                    <div className="mt-4">
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(moduleAddOns.find(m => m.id === selectedModule)?.price_yearly || 0)}
                      </span>
                      <span className="text-gray-500">/year</span>
                    </div>
                    <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                      20% off
                    </span>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBillingCycle === 'lifetime' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBillingCycle('lifetime')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">Lifetime</h3>
                      {selectedBillingCycle === 'lifetime' && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">One-time payment, lifetime access</p>
                    <div className="mt-4">
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(moduleAddOns.find(m => m.id === selectedModule)?.price_lifetime || 0)}
                      </span>
                    </div>
                    <span className="mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                      40% off
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {getModulePrice(moduleAddOns.find(m => m.id === selectedModule)!)}
                    {' '}
                    <span className="text-sm font-normal text-gray-500">
                      {getBillingCycleLabel(selectedBillingCycle)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseModule}
                disabled={isSaving}
                className="btn btn-primary inline-flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Purchase Module
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseSettings;