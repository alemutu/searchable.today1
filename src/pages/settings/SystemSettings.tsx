import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  Settings, 
  Globe, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Mail,
  Lock,
  Save,
  Check
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
}

const SystemSettings: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(settings.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update each modified setting
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: setting.value })
          .eq('key', setting.key);

        if (error) throw error;
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">You don't have permission to view this page.</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
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
        {/* General Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">System Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Settings className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10"
                  value={settings.find(s => s.key === 'system.name')?.value || ''}
                  onChange={e => handleChange('system.name', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Default Language</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="form-input pl-10"
                  value={settings.find(s => s.key === 'system.language')?.value || 'en'}
                  onChange={e => handleChange('system.language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Date Format</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="form-input pl-10"
                  value={settings.find(s => s.key === 'system.date_format')?.value || 'YYYY-MM-DD'}
                  onChange={e => handleChange('system.date_format', e.target.value)}
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Time Format</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="form-input pl-10"
                  value={settings.find(s => s.key === 'system.time_format')?.value || 'HH:mm:ss'}
                  onChange={e => handleChange('system.time_format', e.target.value)}
                >
                  <option value="HH:mm:ss">24-hour (HH:mm:ss)</option>
                  <option value="hh:mm:ss A">12-hour (hh:mm:ss AM/PM)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Currency</h2>
          <div>
            <label className="form-label">Default Currency</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="form-input pl-10"
                value={settings.find(s => s.key === 'system.currency')?.value || 'USD'}
                onChange={e => handleChange('system.currency', e.target.value)}
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Email Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">SMTP Host</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10"
                  value={settings.find(s => s.key === 'email.smtp_host')?.value || ''}
                  onChange={e => handleChange('email.smtp_host', e.target.value)}
                  placeholder="smtp.example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.find(s => s.key === 'email.smtp_port')?.value || '587'}
                  onChange={e => handleChange('email.smtp_port', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="form-label">From Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings.find(s => s.key === 'email.from_address')?.value || ''}
                  onChange={e => handleChange('email.from_address', e.target.value)}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Session Timeout (seconds)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  className="form-input pl-10"
                  value={settings.find(s => s.key === 'security.session_timeout')?.value || 3600}
                  onChange={e => handleChange('security.session_timeout', parseInt(e.target.value))}
                  min="300"
                  max="86400"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Minimum: 5 minutes (300s), Maximum: 24 hours (86400s)</p>
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Maintenance</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={settings.find(s => s.key === 'system.maintenance_mode')?.value || false}
                onChange={e => handleChange('system.maintenance_mode', e.target.checked)}
              />
              <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                Enable Maintenance Mode
              </label>
            </div>
            <div className="flex items-center text-warning-600">
              <AlertTriangle className="h-5 w-5 mr-1" />
              <span className="text-sm">This will make the system inaccessible to regular users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;