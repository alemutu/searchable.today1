import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Building2, Users, Activity, Settings, Plus, Trash2, Edit, Check, X, Box, CreditCard, Key, TicketCheck, Mail, Phone, Globe, MapPin, AlertCircle, BarChart4, LineChart, PieChart, BarChart, FileBarChart2, LifeBuoy, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface Hospital {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email?: string;
  logo_url?: string;
  domain_enabled?: boolean;
}

interface SuperAdminStats {
  total_hospitals: number;
  total_users: number;
  total_patients: number;
  total_departments: number;
  total_doctors: number;
  total_nurses: number;
}

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingHospital, setEditingHospital] = useState<string | null>(null);
  const [newHospital, setNewHospital] = useState<Partial<Hospital>>({});
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isAdmin } = useAuthStore();
  const [subdomainPreview, setSubdomainPreview] = useState('');
  const [mainDomain, setMainDomain] = useState('searchable.today');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (newHospital.subdomain) {
      setSubdomainPreview(`${newHospital.subdomain}.${mainDomain}`);
    } else {
      setSubdomainPreview('');
    }
  }, [newHospital.subdomain, mainDomain]);

  const fetchData = async () => {
    try {
      // Fetch hospitals directly
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');

      if (hospitalsError) throw hospitalsError;
      setHospitals(hospitalsData || []);

      // Create stats object from hospitals count and mock data for now
      // In production, you would implement proper counting queries
      setStats({
        total_hospitals: hospitalsData?.length || 0,
        total_users: 25,
        total_patients: 150,
        total_departments: 12,
        total_doctors: 8,
        total_nurses: 15
      });

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (settingsError) {
        console.error('Error fetching system settings:', settingsError);
      } else {
        setSettings(settingsData || []);

        const mainDomainSetting = settingsData?.find(s => s.key === 'system.main_domain');
        if (mainDomainSetting?.value) {
          const domain = typeof mainDomainSetting.value === 'string'
            ? mainDomainSetting.value.replace(/"/g, '')
            : mainDomainSetting.value;
          setMainDomain(domain);
        }
      }
    } catch (error) {
      console.error('Error fetching super admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateHospitalData = (hospital: Partial<Hospital>): string | null => {
    const requiredFields = ['name', 'subdomain', 'address', 'phone'];
    const missingFields = requiredFields.filter(field => !hospital[field as keyof Partial<Hospital>]);
    if (missingFields.length > 0) {
      return `Please fill in all required fields: ${missingFields.join(', ')}`;
    }

    const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (hospital.subdomain && !subdomainRegex.test(hospital.subdomain)) {
      return 'Subdomain must contain only lowercase letters, numbers, and hyphens';
    }

    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (hospital.phone && !phoneRegex.test(hospital.phone)) {
      return 'Please enter a valid phone number';
    }

    if (hospital.email) {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(hospital.email)) {
        return 'Please enter a valid email address';
      }
    }

    return null;
  };

  const handleAddHospital = async () => {
    try {
      setValidationError(null);

      const error = validateHospitalData(newHospital);
      if (error) {
        setValidationError(error);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('hospitals')
        .insert([{
          ...newHospital,
          domain_enabled: true
        }])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setValidationError('A hospital with this subdomain already exists');
          return;
        }
        throw insertError;
      }

      setHospitals([...hospitals, data]);
      setShowAddHospital(false);
      setNewHospital({});
      await fetchData();
    } catch (error: any) {
      console.error('Error adding hospital:', error.message);
      setValidationError(error.message);
    }
  };

  const handleUpdateHospital = async (hospital: Hospital) => {
    try {
      setValidationError(null);

      const error = validateHospitalData(hospital);
      if (error) {
        setValidationError(error);
        return;
      }

      const { error: updateError } = await supabase
        .from('hospitals')
        .update({
          name: hospital.name,
          subdomain: hospital.subdomain,
          address: hospital.address,
          phone: hospital.phone,
          email: hospital.email,
          logo_url: hospital.logo_url,
          domain_enabled: hospital.domain_enabled
        })
        .eq('id', hospital.id);

      if (updateError) throw updateError;

      setHospitals(hospitals.map(h => h.id === hospital.id ? hospital : h));
      setEditingHospital(null);
    } catch (error: any) {
      console.error('Error updating hospital:', error.message);
      setValidationError(error.message);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hospitals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHospitals(hospitals.filter(h => h.id !== id));
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting hospital:', error.message);
      alert(error.message);
    }
  };

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-6 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-primary-100 text-sm">System management and hospital administration</p>
          </div>
          <Link to="/super-admin/hospital-onboarding" className="btn bg-white text-primary-600 hover:bg-gray-100 flex items-center px-3 py-2 rounded-md text-sm font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Onboard Hospital
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Total Hospitals</p>
              <p className="text-white text-2xl font-bold">{stats?.total_hospitals}</p>
            </div>
            <div className="p-3 rounded-full bg-white">
              <Building2 className="h-6 w-6 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Total Users</p>
              <p className="text-white text-2xl font-bold">{stats?.total_users}</p>
            </div>
            <div className="p-3 rounded-full bg-white">
              <Users className="h-6 w-6 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Total Patients</p>
              <p className="text-white text-2xl font-bold">{stats?.total_patients}</p>
            </div>
            <div className="p-3 rounded-full bg-white">
              <Activity className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Access */}
        <div className="space-y-6">
          {/* Setup Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 text-primary-500 mr-2" />
              Setup
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/super-admin/system-modules" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
                <Box className="h-5 w-5 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">System Modules</p>
                  <p className="text-xs text-gray-500">Manage system modules and features</p>
                </div>
              </Link>
              
              <Link to="/super-admin/pricing-plans" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
                <CreditCard className="h-5 w-5 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Pricing Plans</p>
                  <p className="text-xs text-gray-500">Configure pricing and subscriptions</p>
                </div>
              </Link>
              
              <Link to="/super-admin/settings/system" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
                <Settings className="h-5 w-5 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">System Settings</p>
                  <p className="text-xs text-gray-500">Configure global system settings</p>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Support Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <LifeBuoy className="h-5 w-5 text-primary-500 mr-2" />
              Support & Issues
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/super-admin/support-tickets" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
                <TicketCheck className="h-5 w-5 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Support Tickets</p>
                  <p className="text-xs text-gray-500">Handle support requests</p>
                </div>
              </Link>
              
              <Link to="/super-admin/support-settings" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
                <Wrench className="h-5 w-5 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Support Settings</p>
                  <p className="text-xs text-gray-500">Configure support system</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Middle Column - Hospitals */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 text-primary-500 mr-2" />
                Hospitals
              </h2>
              <Link to="/super-admin/hospital-onboarding" className="btn btn-primary inline-flex items-center text-sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Hospital
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hospitals.slice(0, 5).map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                            <div className="text-xs text-gray-500">{hospital.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{hospital.subdomain}</span>
                          <span className="text-gray-500">.{mainDomain}</span>
                        </div>
                        {hospital.domain_enabled === false && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 text-gray-400 mr-1" />
                            {hospital.phone}
                          </div>
                          {hospital.email && (
                            <div className="flex items-center mt-1">
                              <Mail className="h-3.5 w-3.5 text-gray-400 mr-1" />
                              {hospital.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingHospital(hospital.id)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded-full hover:bg-primary-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHospital(hospital.id)}
                            className="text-error-600 hover:text-error-900 p-1 rounded-full hover:bg-error-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {hospitals.length > 5 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
                <Link to="/super-admin/hospitals" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                  View all {hospitals.length} hospitals
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Reports & Analytics Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BarChart4 className="h-5 w-5 text-primary-500 mr-2" />
          Reports & Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/super-admin/reports/overview" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
            <BarChart4 className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Overview</p>
              <p className="text-xs text-gray-500">System-wide metrics and KPIs</p>
            </div>
          </Link>
          
          <Link to="/super-admin/reports/hospitals" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
            <Building2 className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Hospital Reports</p>
              <p className="text-xs text-gray-500">Activity and usage by hospital</p>
            </div>
          </Link>
          
          <Link to="/super-admin/reports/licenses" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
            <Key className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">License Reports</p>
              <p className="text-xs text-gray-500">License status and renewals</p>
            </div>
          </Link>
          
          <Link to="/super-admin/reports/modules" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
            <Box className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Module Usage</p>
              <p className="text-xs text-gray-500">Feature adoption and usage</p>
            </div>
          </Link>
          
          <Link to="/super-admin/reports/revenue" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
            <DollarSign className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Revenue Reports</p>
              <p className="text-xs text-gray-500">Financial metrics and trends</p>
            </div>
          </Link>
          
          <Link to="/super-admin/reports/support" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-colors">
            <LifeBuoy className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Support Reports</p>
              <p className="text-xs text-gray-500">Ticket metrics and resolution times</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;