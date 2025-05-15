import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Building2, Users, Activity, Settings, Plus, Trash2, Edit, Check, X, Box, CreditCard, Key, TicketCheck, Mail, Phone, Globe, MapPin, AlertCircle } from 'lucide-react';
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

      if (hospitalsError) {
        console.error('Error fetching hospitals:', hospitalsError);
        return false;
      }

      setHospitals(hospitalsData || []);

      // Create stats object from hospitals count and mock data for now
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
        return false;
      }

      setSettings(settingsData || []);

      const mainDomainSetting = settingsData?.find(s => s.key === 'system.main_domain');
      if (mainDomainSetting?.value) {
        const domain = typeof mainDomainSetting.value === 'string'
          ? mainDomainSetting.value.replace(/"/g, '')
          : mainDomainSetting.value;
        setMainDomain(domain);
      }

      return true;
    } catch (error) {
      console.error('Error fetching super admin data:', error);
      return false;
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <Link to="/super-admin/hospital-onboarding" className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Hospital
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Hospitals</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats?.total_hospitals}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <Building2 className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats?.total_users}</p>
            </div>
            <div className="p-3 rounded-full bg-secondary-100">
              <Users className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats?.total_patients}</p>
            </div>
            <div className="p-3 rounded-full bg-accent-100">
              <Activity className="h-6 w-6 text-accent-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/super-admin/system-modules" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary-100">
              <Box className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">System Modules</h3>
              <p className="text-sm text-gray-500">Manage system modules and features</p>
            </div>
          </div>
        </Link>

        <Link to="/super-admin/pricing-plans" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-secondary-100">
              <CreditCard className="h-6 w-6 text-secondary-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pricing Plans</h3>
              <p className="text-sm text-gray-500">Configure pricing and subscriptions</p>
            </div>
          </div>
        </Link>

        <Link to="/super-admin/licenses" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-accent-100">
              <Key className="h-6 w-6 text-accent-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Licenses</h3>
              <p className="text-sm text-gray-500">Manage hospital licenses</p>
            </div>
          </div>
        </Link>

        <Link to="/super-admin/support-tickets" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-warning-100">
              <TicketCheck className="h-6 w-6 text-warning-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Support Tickets</h3>
              <p className="text-sm text-gray-500">Handle support requests</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Hospitals List */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Hospitals</h2>
          <Link to="/super-admin/hospital-onboarding" className="btn btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
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
                  Address
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
              {hospitals.map((hospital) => (
                <tr key={hospital.id}>
                  <td className="px-6 py-4">
                    {editingHospital === hospital.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={hospital.name}
                        onChange={(e) => setHospitals(hospitals.map(h => 
                          h.id === hospital.id ? { ...h, name: e.target.value } : h
                        ))}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingHospital === hospital.id ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          className="form-input"
                          value={hospital.subdomain}
                          onChange={(e) => setHospitals(hospitals.map(h => 
                            h.id === hospital.id ? { ...h, subdomain: e.target.value.toLowerCase() } : h
                          ))}
                        />
                        <div className="text-xs text-gray-500">
                          {hospital.subdomain}.{mainDomain}
                        </div>
                        <div className="flex items-center mt-1">
                          <input
                            type="checkbox"
                            id={`domain-enabled-${hospital.id}`}
                            checked={hospital.domain_enabled !== false}
                            onChange={(e) => setHospitals(hospitals.map(h => 
                              h.id === hospital.id ? { ...h, domain_enabled: e.target.checked } : h
                            ))}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`domain-enabled-${hospital.id}`} className="ml-2 block text-xs text-gray-700">
                            Enable domain access
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{hospital.subdomain}</span>
                        <span className="text-gray-500">.{mainDomain}</span>
                        {hospital.domain_enabled === false && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Disabled
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingHospital === hospital.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={hospital.address}
                        onChange={(e) => setHospitals(hospitals.map(h => 
                          h.id === hospital.id ? { ...h, address: e.target.value } : h
                        ))}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{hospital.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingHospital === hospital.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Phone"
                          value={hospital.phone}
                          onChange={(e) => setHospitals(hospitals.map(h => 
                            h.id === hospital.id ? { ...h, phone: e.target.value } : h
                          ))}
                        />
                        <input
                          type="email"
                          className="form-input"
                          placeholder="Email (optional)"
                          value={hospital.email || ''}
                          onChange={(e) => setHospitals(hospitals.map(h => 
                            h.id === hospital.id ? { ...h, email: e.target.value } : h
                          ))}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <div>{hospital.phone}</div>
                        {hospital.email && <div>{hospital.email}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingHospital === hospital.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateHospital(hospital)}
                          className="text-success-600 hover:text-success-900"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingHospital(null)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingHospital(hospital.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHospital(hospital.id)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;