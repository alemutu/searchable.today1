import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Check, X, Settings } from 'lucide-react';

interface SystemModule {
  id: string;
  name: string;
  key: string;
  description: string;
  is_active: boolean;
  config: any;
  version: string;
}

interface ModulePermission {
  id: string;
  module_id: string;
  role: string;
  permissions: any;
}

const SystemModules: React.FC = () => {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [newModule, setNewModule] = useState<Partial<SystemModule>>({});
  const [showAddModule, setShowAddModule] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .order('name');

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('module_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModule = async () => {
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .insert([newModule])
        .select()
        .single();

      if (error) throw error;

      setModules([...modules, data]);
      setShowAddModule(false);
      setNewModule({});
    } catch (error) {
      console.error('Error adding module:', error);
    }
  };

  const handleUpdateModule = async (module: SystemModule) => {
    try {
      const { error } = await supabase
        .from('system_modules')
        .update(module)
        .eq('id', module.id);

      if (error) throw error;

      setModules(modules.map(m => m.id === module.id ? module : m));
      setEditingModule(null);
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('system_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting module:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">System Modules</h1>
        <button
          onClick={() => setShowAddModule(true)}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Module
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
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
              {showAddModule && (
                <tr>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Module Name"
                      value={newModule.name || ''}
                      onChange={e => setNewModule({ ...newModule, name: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Module Key"
                      value={newModule.key || ''}
                      onChange={e => setNewModule({ ...newModule, key: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Version"
                      value={newModule.version || ''}
                      onChange={e => setNewModule({ ...newModule, version: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="form-input"
                      value={newModule.is_active ? 'true' : 'false'}
                      onChange={e => setNewModule({ ...newModule, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={handleAddModule}
                      className="text-success-600 hover:text-success-900"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowAddModule(false)}
                      className="text-error-600 hover:text-error-900"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )}
              {modules.map((module) => (
                <tr key={module.id}>
                  <td className="px-6 py-4">
                    {editingModule === module.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={module.name}
                        onChange={e => setModules(modules.map(m => 
                          m.id === module.id ? { ...m, name: e.target.value } : m
                        ))}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{module.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingModule === module.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={module.key}
                        onChange={e => setModules(modules.map(m => 
                          m.id === module.id ? { ...m, key: e.target.value } : m
                        ))}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{module.key}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingModule === module.id ? (
                      <input
                        type="text"
                        className="form-input"
                        value={module.version}
                        onChange={e => setModules(modules.map(m => 
                          m.id === module.id ? { ...m, version: e.target.value } : m
                        ))}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{module.version}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingModule === module.id ? (
                      <select
                        className="form-input"
                        value={module.is_active.toString()}
                        onChange={e => setModules(modules.map(m => 
                          m.id === module.id ? { ...m, is_active: e.target.value === 'true' } : m
                        ))}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        module.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {module.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingModule === module.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateModule(module)}
                          className="text-success-600 hover:text-success-900"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingModule(null)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingModule(module.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.id)}
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

export default SystemModules;