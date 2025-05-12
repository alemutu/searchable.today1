import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Plus, Edit, Trash2, Check, X, Building2 } from 'lucide-react';

interface License {
  id: string;
  hospital: {
    id: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
  };
  start_date: string;
  end_date: string | null;
  status: string;
  max_users: number;
  current_users: number;
  features: any;
  billing_info: any;
}

const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [newLicense, setNewLicense] = useState<Partial<License>>({});
  const [showAddLicense, setShowAddLicense] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          hospital:hospitals(id, name),
          plan:pricing_plans(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLicense = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .insert([newLicense])
        .select()
        .single();

      if (error) throw error;

      setLicenses([...licenses, data]);
      setShowAddLicense(false);
      setNewLicense({});
    } catch (error: any) {
      console.error('Error adding license:', error.message);
      alert(error.message);
    }
  };

  const handleUpdateLicense = async (license: License) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update(license)
        .eq('id', license.id);

      if (error) throw error;

      setLicenses(licenses.map(l => l.id === license.id ? license : l));
      setEditingLicense(null);
    } catch (error: any) {
      console.error('Error updating license:', error.message);
      alert(error.message);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this license? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLicenses(licenses.filter(l => l.id !== id));
    } catch (error: any) {
      console.error('Error deleting license:', error.message);
      alert(error.message);
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
        <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
        <button
          onClick={() => setShowAddLicense(true)}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add License
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.map((license) => (
                <tr key={license.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {license.hospital.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{license.plan.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(license.start_date).toLocaleDateString()}
                      {license.end_date && (
                        <> - {new Date(license.end_date).toLocaleDateString()}</>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {license.current_users} / {license.max_users}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(license.status)}`}>
                      {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingLicense === license.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateLicense(license)}
                          className="text-success-600 hover:text-success-900"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingLicense(null)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingLicense(license.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLicense(license.id)}
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

export default Licenses;