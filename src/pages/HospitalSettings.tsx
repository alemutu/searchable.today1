import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Building2, Mail, Phone, Globe, MapPin, Upload, Trash2, Save, Hash, AlertCircle } from 'lucide-react';

interface HospitalSettings {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  email?: string;
  logo_url?: string;
  patient_id_format?: string;
  patient_id_prefix?: string;
  patient_id_digits?: number;
  patient_id_auto_increment?: boolean;
  patient_id_last_number?: number;
}

const HospitalSettings: React.FC = () => {
  const { hospital } = useAuthStore();
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [hospital]);

  const fetchSettings = async () => {
    if (!hospital?.id) {
      setError("No hospital selected. Please ensure you're logged in with a valid hospital account.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', hospital.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // If no data is found, use the hospital data from the store
        setSettings({
          id: hospital.id,
          name: hospital.name,
          subdomain: hospital.subdomain,
          address: hospital.address,
          phone: hospital.phone,
          email: hospital.email,
          logo_url: hospital.logo_url,
          patient_id_format: hospital.patient_id_format || 'prefix_number',
          patient_id_prefix: hospital.patient_id_prefix || 'PT',
          patient_id_digits: hospital.patient_id_digits || 6,
          patient_id_auto_increment: hospital.patient_id_auto_increment !== false,
          patient_id_last_number: hospital.patient_id_last_number || 0
        });
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching hospital settings:', error);
      setError(`Failed to load hospital settings: ${error.message}`);
      
      // Fallback to using the hospital data from the store
      if (hospital) {
        setSettings({
          id: hospital.id,
          name: hospital.name,
          subdomain: hospital.subdomain,
          address: hospital.address,
          phone: hospital.phone,
          email: hospital.email,
          logo_url: hospital.logo_url,
          patient_id_format: hospital.patient_id_format || 'prefix_number',
          patient_id_prefix: hospital.patient_id_prefix || 'PT',
          patient_id_digits: hospital.patient_id_digits || 6,
          patient_id_auto_increment: hospital.patient_id_auto_increment !== false,
          patient_id_last_number: hospital.patient_id_last_number || 0
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof HospitalSettings, value: string | number | boolean) => {
    if (!settings) return;

    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings || !hospital?.id) return;

    setIsSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({
          name: settings.name,
          subdomain: settings.subdomain,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          logo_url: settings.logo_url,
          patient_id_format: settings.patient_id_format,
          patient_id_prefix: settings.patient_id_prefix,
          patient_id_digits: settings.patient_id_digits,
          patient_id_auto_increment: settings.patient_id_auto_increment,
          patient_id_last_number: settings.patient_id_last_number
        })
        .eq('id', hospital.id);

      if (error) throw error;
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving hospital settings:', error);
      setError(`Failed to save settings: ${error.message}`);
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-error-800 font-medium">Error</h3>
            <p className="text-error-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Hospital settings not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Hospital Settings</h1>
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

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <label className="form-label required">Hospital Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input pl-10"
              placeholder="Enter hospital name"
            />
          </div>
        </div>

        <div>
          <label className="form-label required">Subdomain</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={settings.subdomain}
              onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase())}
              className="form-input pl-10"
              placeholder="hospital-name"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            This will be used for your hospital's URL: {settings.subdomain}.hms.com
          </p>
        </div>

        <div>
          <label className="form-label required">Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="form-input pl-10"
              rows={3}
              placeholder="Enter complete address"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="form-label required">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="form-input pl-10"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="form-input pl-10"
                placeholder="hospital@example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Hospital Logo</label>
          <div className="mt-1 flex items-center space-x-4">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Hospital Logo"
                className="h-12 w-12 rounded object-contain bg-gray-50"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-gray-50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="button"
                className="btn btn-outline inline-flex items-center"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Logo
              </button>
              {settings.logo_url && (
                <button
                  type="button"
                  onClick={() => handleChange('logo_url', '')}
                  className="btn btn-outline inline-flex items-center text-error-600 hover:text-error-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Recommended size: 256x256px. Maximum file size: 2MB.
          </p>
        </div>

        {/* Patient ID Configuration */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Patient ID Configuration</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Patient ID Prefix</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={settings.patient_id_prefix || ''}
                    onChange={(e) => handleChange('patient_id_prefix', e.target.value)}
                    className="form-input pl-10"
                    placeholder="e.g., PT"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Text that appears at the beginning of each patient ID
                </p>
              </div>
              
              <div>
                <label className="form-label">Number of Digits</label>
                <input
                  type="number"
                  value={settings.patient_id_digits || 6}
                  onChange={(e) => handleChange('patient_id_digits', parseInt(e.target.value))}
                  min={4}
                  max={10}
                  className="form-input"
                  placeholder="e.g., 6"
                />
                <p className="mt-1 text-sm text-gray-500">
                  How many digits to use in the numeric portion
                </p>
              </div>
            </div>
            
            <div>
              <label className="form-label">ID Format</label>
              <select
                value={settings.patient_id_format || 'prefix_number'}
                onChange={(e) => handleChange('patient_id_format', e.target.value)}
                className="form-input"
              >
                <option value="prefix_number">Prefix + Number (e.g., PT000123)</option>
                <option value="prefix_year_number">Prefix + Year + Number (e.g., PT2025-000123)</option>
                <option value="hospital_prefix_number">Hospital Code + Prefix + Number (e.g., GH-PT-000123)</option>
                <option value="custom">Custom Format</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoIncrement"
                checked={settings.patient_id_auto_increment !== false}
                onChange={(e) => handleChange('patient_id_auto_increment', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoIncrement" className="ml-2 block text-sm text-gray-900">
                Auto-increment patient ID numbers
              </label>
            </div>
            
            <div>
              <label className="form-label">Last Used Number</label>
              <input
                type="number"
                value={settings.patient_id_last_number || 0}
                onChange={(e) => handleChange('patient_id_last_number', parseInt(e.target.value))}
                min={0}
                className="form-input"
                placeholder="e.g., 123"
              />
              <p className="mt-1 text-sm text-gray-500">
                The system will start from this number + 1 for new patients
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Preview</h3>
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-gray-400" />
                <span className="text-lg font-mono">
                  {settings.patient_id_format === 'prefix_number' && 
                    `${settings.patient_id_prefix || 'PT'}${String(settings.patient_id_last_number || 0).padStart(settings.patient_id_digits || 6, '0')}`}
                  {settings.patient_id_format === 'prefix_year_number' && 
                    `${settings.patient_id_prefix || 'PT'}${new Date().getFullYear()}-${String(settings.patient_id_last_number || 0).padStart(settings.patient_id_digits || 6, '0')}`}
                  {settings.patient_id_format === 'hospital_prefix_number' && 
                    `${settings.subdomain.substring(0, 2).toUpperCase()}-${settings.patient_id_prefix || 'PT'}-${String(settings.patient_id_last_number || 0).padStart(settings.patient_id_digits || 6, '0')}`}
                  {settings.patient_id_format === 'custom' && 
                    `${settings.patient_id_prefix || 'PT'}${String(settings.patient_id_last_number || 0).padStart(settings.patient_id_digits || 6, '0')}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSettings;