import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Mail
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface SupportSettings {
  id: string;
  categories: {
    id: string;
    name: string;
    description: string;
    priority: string;
    auto_assign_to?: string;
  }[];
  sla_settings: {
    priority: string;
    response_time: number;
    resolution_time: number;
  }[];
  notification_settings: {
    email_notifications: boolean;
    in_app_notifications: boolean;
    notify_on: string[];
  };
  auto_responses: {
    id: string;
    category: string;
    subject: string;
    message: string;
    enabled: boolean;
  }[];
}

const SupportSettings: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<any | null>(null);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState<any | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('support_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      setSettings(data || getDefaultSettings());
    } catch (error) {
      console.error('Error fetching support settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultSettings = (): SupportSettings => ({
    id: '',
    categories: [
      {
        id: '1',
        name: 'Technical Issue',
        description: 'Problems with system functionality',
        priority: 'high',
      },
      {
        id: '2',
        name: 'Account Access',
        description: 'Login and permission issues',
        priority: 'high',
      },
      {
        id: '3',
        name: 'Feature Request',
        description: 'Suggestions for new features',
        priority: 'medium',
      },
      {
        id: '4',
        name: 'General Inquiry',
        description: 'General questions and information',
        priority: 'low',
      }
    ],
    sla_settings: [
      {
        priority: 'critical',
        response_time: 1,
        resolution_time: 4
      },
      {
        priority: 'high',
        response_time: 4,
        resolution_time: 24
      },
      {
        priority: 'medium',
        response_time: 8,
        resolution_time: 48
      },
      {
        priority: 'low',
        response_time: 24,
        resolution_time: 72
      }
    ],
    notification_settings: {
      email_notifications: true,
      in_app_notifications: true,
      notify_on: ['new_ticket', 'ticket_update', 'ticket_resolved']
    },
    auto_responses: [
      {
        id: '1',
        category: 'Technical Issue',
        subject: 'Technical Support Ticket Received',
        message: 'Thank you for reporting this technical issue. Our team will investigate and respond shortly.',
        enabled: true
      },
      {
        id: '2',
        category: 'Account Access',
        subject: 'Account Support Request Received',
        message: 'We have received your account access request. A support representative will assist you soon.',
        enabled: true
      }
    ]
  });

  const handleChange = (field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: value
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('support_settings')
        .upsert({
          ...settings
        });

      if (error) throw error;
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving support settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-error-100 text-error-800';
      case 'high':
        return 'bg-warning-100 text-warning-800';
      case 'medium':
        return 'bg-primary-100 text-primary-800';
      case 'low':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Support settings not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Global Support Settings</h1>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="btn btn-primary inline-flex items-center"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
        {/* Support Categories */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Support Categories</h2>
            <button
              onClick={() => setNewCategory({
                name: '',
                description: '',
                priority: 'medium'
              })}
              className="btn btn-outline inline-flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </button>
          </div>

          <div className="space-y-4">
            {newCategory && (
              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                  <select
                    className="form-input"
                    value={newCategory.priority}
                    onChange={e => setNewCategory({ ...newCategory, priority: e.target.value })}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <div className="col-span-2">
                    <input
                      type="text"
                      className="form-input w-full"
                      placeholder="Description"
                      value={newCategory.description}
                      onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleChange('categories', [...settings.categories, { ...newCategory, id: Date.now().toString() }]);
                      setNewCategory(null);
                    }}
                    className="text-success-600 hover:text-success-900"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setNewCategory(null)}
                    className="text-error-600 hover:text-error-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {settings.categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                {editingCategory === category.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          className="form-input mt-1"
                          value={category.name}
                          onChange={e => {
                            const updatedCategories = settings.categories.map(c =>
                              c.id === category.id ? { ...c, name: e.target.value } : c
                            );
                            handleChange('categories', updatedCategories);
                          }}
                        >
                          {settings.categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                          className="form-input mt-1"
                          value={category.priority}
                          onChange={e => {
                            const updatedCategories = settings.categories.map(c =>
                              c.id === category.id ? { ...c, priority: e.target.value } : c
                            );
                            handleChange('categories', updatedCategories);
                          }}
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        className="form-input mt-1"
                        value={category.description}
                        onChange={e => {
                          const updatedCategories = settings.categories.map(c =>
                            c.id === category.id ? { ...c, description: e.target.value } : c
                          );
                          handleChange('categories', updatedCategories);
                        }}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="text-success-600 hover:text-success-900"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                      <span className={`ml-4 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(category.priority)}`}>
                        {category.priority.charAt(0).toUpperCase() + category.priority.slice(1)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingCategory(category.id)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          const updatedCategories = settings.categories.filter(c => c.id !== category.id);
                          handleChange('categories', updatedCategories);
                        }}
                        className="text-error-600 hover:text-error-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SLA Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">SLA Settings</h2>
          <div className="space-y-4">
            {settings.sla_settings.map((sla, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(sla.priority)}`}>
                    {sla.priority.charAt(0).toUpperCase() + sla.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Response Time (hours)</label>
                  <input
                    type="number"
                    className="form-input mt-1"
                    value={sla.response_time}
                    onChange={e => {
                      const updatedSLA = [...settings.sla_settings];
                      updatedSLA[index] = { ...sla, response_time: parseInt(e.target.value) };
                      handleChange('sla_settings', updatedSLA);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Time (hours)</label>
                  <input
                    type="number"
                    className="form-input mt-1"
                    value={sla.resolution_time}
                    onChange={e => {
                      const updatedSLA = [...settings.sla_settings];
                      updatedSLA[index] = { ...sla, resolution_time: parseInt(e.target.value) };
                      handleChange('sla_settings', updatedSLA);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.notification_settings.email_notifications}
                  onChange={e => handleChange('notification_settings', {
                    ...settings.notification_settings,
                    email_notifications: e.target.checked
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="inAppNotifications"
                  checked={settings.notification_settings.in_app_notifications}
                  onChange={e => handleChange('notification_settings', {
                    ...settings.notification_settings,
                    in_app_notifications: e.target.checked
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="inAppNotifications" className="ml-2 block text-sm text-gray-900">
                  In-App Notifications
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notify On:</label>
              <div className="space-y-2">
                {['new_ticket', 'ticket_update', 'ticket_resolved', 'ticket_assigned', 'sla_breach'].map((event) => (
                  <div key={event} className="flex items-center">
                    <input
                      type="checkbox"
                      id={event}
                      checked={settings.notification_settings.notify_on.includes(event)}
                      onChange={e => {
                        const notify_on = e.target.checked
                          ? [...settings.notification_settings.notify_on, event]
                          : settings.notification_settings.notify_on.filter(e => e !== event);
                        handleChange('notification_settings', {
                          ...settings.notification_settings,
                          notify_on
                        });
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={event} className="ml-2 block text-sm text-gray-900">
                      {event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto Responses */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Automated Responses</h2>
            <button
              onClick={() => setNewResponse({
                category: settings.categories[0]?.name || '',
                subject: '',
                message: '',
                enabled: true
              })}
              className="btn btn-outline inline-flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Response
            </button>
          </div>

          <div className="space-y-4">
            {newResponse && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      className="form-input mt-1"
                      value={newResponse.category}
                      onChange={e => setNewResponse({ ...newResponse, category: e.target.value })}
                    >
                      {settings.categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      className="form-input mt-1"
                      value={newResponse.subject}
                      onChange={e => setNewResponse({ ...newResponse, subject: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    className="form-input mt-1"
                    rows={3}
                    value={newResponse.message}
                    onChange={e => setNewResponse({ ...newResponse, message: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      handleChange('auto_responses', [...settings.auto_responses, { ...newResponse, id: Date.now().toString() }]);
                      setNewResponse(null);
                    }}
                    className="text-success-600 hover:text-success-900"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setNewResponse(null)}
                    className="text-error-600 hover:text-error-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {settings.auto_responses.map((response) => (
              <div key={response.id} className="bg-white p-4 rounded-lg border">
                {editingResponse === response.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          className="form-input mt-1"
                          value={response.category}
                          onChange={e => {
                            const updatedResponses = settings.auto_responses.map(r =>
                              r.id === response.id ? { ...r, category: e.target.value } : r
                            );
                            handleChange('auto_responses', updatedResponses);
                          }}
                        >
                          {settings.categories.map(category => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                          type="text"
                          className="form-input mt-1"
                          value={response.subject}
                          onChange={e => {
                            const updatedResponses = settings.auto_responses.map(r =>
                              r.id === response.id ? { ...r, subject: e.target.value } : r
                            );
                            handleChange('auto_responses', updatedResponses);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message</label>
                      <textarea
                        className="form-input mt-1"
                        rows={3}
                        value={response.message}
                        onChange={e => {
                          const updatedResponses = settings.auto_responses.map(r =>
                            r.id === response.id ? { ...r, message: e.target.value } : r
                          );
                          handleChange('auto_responses', updatedResponses);
                        }}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingResponse(null)}
                        className="text-success-600 hover:text-success-900"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingResponse(null)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{response.subject}</span>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {response.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{response.message}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={response.enabled}
                          onChange={e => {
                            const updatedResponses = settings.auto_responses.map(r =>
                              r.id === response.id ? { ...r, enabled: e.target.checked } : r
                            );
                            handleChange('auto_responses', updatedResponses);
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-500">Enabled</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingResponse(response.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            const updatedResponses = settings.auto_responses.filter(r => r.id !== response.id);
                            handleChange('auto_responses', updatedResponses);
                          }}
                          className="text-error-600 hover:text-error-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportSettings;