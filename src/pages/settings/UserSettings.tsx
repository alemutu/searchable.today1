import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { Plus, Edit, Trash2, Check, X, UserRound, Mail, Phone, Building2 } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department_id: string | null;
  specialization: string | null;
  contact_number: string | null;
  department?: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

const UserSettings: React.FC = () => {
  const { hospital } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [hospital]);

  const fetchData = async () => {
    if (!hospital?.id) return;

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('hospital_id', hospital.id)
        .order('first_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospital.id)
        .order('name');

      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!hospital?.id) return;

    try {
      setIsSaving(true);

      // Validate required fields
      if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.role) {
        throw new Error('Please fill in all required fields');
      }

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'temppass123', // Temporary password, user will need to reset
        options: {
          data: {
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          ...newUser,
          hospital_id: hospital.id
        }]);

      if (profileError) throw profileError;

      await fetchData(); // Refresh user list
      setShowAddUser(false);
      setNewUser({});
    } catch (error: any) {
      console.error('Error adding user:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          department_id: user.department_id,
          specialization: user.specialization,
          contact_number: user.contact_number
        })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? user : u));
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;

      setUsers(users.filter(u => u.id !== id));
    } catch (error: any) {
      console.error('Error deleting user:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary-100 text-primary-800';
      case 'doctor':
        return 'bg-success-100 text-success-800';
      case 'nurse':
        return 'bg-accent-100 text-accent-800';
      case 'receptionist':
        return 'bg-warning-100 text-warning-800';
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowAddUser(true)}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
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
              {showAddUser && (
                <tr>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="First Name"
                        value={newUser.first_name || ''}
                        onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Last Name"
                        value={newUser.last_name || ''}
                        onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                      />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email"
                        value={newUser.email || ''}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="form-input"
                      value={newUser.role || ''}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="lab_technician">Lab Technician</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="form-input"
                      value={newUser.department_id || ''}
                      onChange={e => setNewUser({ ...newUser, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Contact Number"
                      value={newUser.contact_number || ''}
                      onChange={e => setNewUser({ ...newUser, contact_number: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={handleAddUser}
                      disabled={isSaving}
                      className="text-success-600 hover:text-success-900"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="text-error-600 hover:text-error-900"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="form-input"
                          value={user.first_name}
                          onChange={e => setUsers(users.map(u => 
                            u.id === user.id ? { ...u, first_name: e.target.value } : u
                          ))}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={user.last_name}
                          onChange={e => setUsers(users.map(u => 
                            u.id === user.id ? { ...u, last_name: e.target.value } : u
                          ))}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserRound className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <select
                        className="form-input"
                        value={user.role}
                        onChange={e => setUsers(users.map(u => 
                          u.id === user.id ? { ...u, role: e.target.value } : u
                        ))}
                      >
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="lab_technician">Lab Technician</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <select
                        className="form-input"
                        value={user.department_id || ''}
                        onChange={e => setUsers(users.map(u => 
                          u.id === user.id ? { ...u, department_id: e.target.value } : u
                        ))}
                      >
                        <option value="">No Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center">
                        {user.department && (
                          <>
                            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{user.department.name}</span>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <input
                        type="tel"
                        className="form-input"
                        value={user.contact_number || ''}
                        onChange={e => setUsers(users.map(u => 
                          u.id === user.id ? { ...u, contact_number: e.target.value } : u
                        ))}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{user.contact_number || '-'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingUser === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateUser(user)}
                          disabled={isSaving}
                          className="text-success-600 hover:text-success-900"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

export default UserSettings;