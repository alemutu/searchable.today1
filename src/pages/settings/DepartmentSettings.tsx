import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { Plus, Edit, Trash2, Check, X, Building2, Users, Save } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string | null;
  hospital_id: string;
  created_at: string;
}

const DepartmentSettings: React.FC = () => {
  const { hospital } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({});
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [hospital]);

  const fetchDepartments = async () => {
    if (!hospital?.id) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('hospital_id', hospital.id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!hospital?.id) return;

    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!newDepartment.name) {
        throw new Error('Department name is required');
      }

      const { data, error } = await supabase
        .from('departments')
        .insert([{
          ...newDepartment,
          hospital_id: hospital.id
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A department with this name already exists');
        }
        throw error;
      }

      setDepartments([...departments, data]);
      setShowAddDepartment(false);
      setNewDepartment({});
    } catch (error: any) {
      console.error('Error adding department:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDepartment = async (department: Department) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('departments')
        .update({
          name: department.name,
          description: department.description
        })
        .eq('id', department.id);

      if (error) throw error;

      setDepartments(departments.map(d => d.id === department.id ? department : d));
      setEditingDepartment(null);
    } catch (error: any) {
      console.error('Error updating department:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDepartments(departments.filter(d => d.id !== id));
    } catch (error: any) {
      console.error('Error deleting department:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Department Settings</h1>
        <button
          onClick={() => setShowAddDepartment(true)}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {showAddDepartment && (
                <tr>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Department Name"
                      value={newDepartment.name || ''}
                      onChange={e => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Description (optional)"
                      value={newDepartment.description || ''}
                      onChange={e => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={handleAddDepartment}
                      disabled={isSaving}
                      className="text-success-600 hover:text-success-900"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowAddDepartment(false)}
                      className="text-error-600 hover:text-error-900"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )}
              {departments.map((department) => (
                <tr key={department.id}>
                  <td className="px-6 py-4">
                    {editingDepartment === department.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={department.name}
                        onChange={e => setDepartments(departments.map(d => 
                          d.id === department.id ? { ...d, name: e.target.value } : d
                        ))}
                      />
                    ) : (
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{department.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingDepartment === department.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={department.description || ''}
                        onChange={e => setDepartments(departments.map(d => 
                          d.id === department.id ? { ...d, description: e.target.value } : d
                        ))}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{department.description || '-'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingDepartment === department.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateDepartment(department)}
                          disabled={isSaving}
                          className="text-success-600 hover:text-success-900"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingDepartment(null)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingDepartment(department.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          disabled={isSaving}
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

export default DepartmentSettings;