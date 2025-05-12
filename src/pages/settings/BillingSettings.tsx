import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  DollarSign, 
  CreditCard, 
  Percent, 
  Building2, 
  Receipt, 
  Save,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface BillingSettings {
  id: string;
  payment_methods: {
    type: string;
    enabled: boolean;
    config: any;
  }[];
  tax_rates: {
    name: string;
    rate: number;
    type: string;
  }[];
  invoice_settings: {
    prefix: string;
    footer_text: string;
    terms_conditions: string;
    due_days: number;
  };
  default_currency: string;
  auto_payment_reminders: boolean;
  reminder_days: number[];
}

const getDefaultSettings = (): BillingSettings => ({
  id: '',
  payment_methods: [
    { type: 'cash', enabled: true, config: {} },
    { type: 'credit_card', enabled: true, config: {} },
    { type: 'debit_card', enabled: true, config: {} },
    { type: 'insurance', enabled: true, config: {} },
    { type: 'mobile_payment', enabled: true, config: {} }
  ],
  tax_rates: [
    { name: 'Standard VAT', rate: 20, type: 'vat' },
    { name: 'Reduced Rate', rate: 5, type: 'vat' }
  ],
  invoice_settings: {
    prefix: 'INV',
    footer_text: 'Thank you for your business',
    terms_conditions: 'Standard terms and conditions apply',
    due_days: 30
  },
  default_currency: 'USD',
  auto_payment_reminders: true,
  reminder_days: [7, 3, 1]
});

const BillingSettings: React.FC = () => {
  const { hospital } = useAuthStore();
  const [settings, setSettings] = useState<BillingSettings>(getDefaultSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<number | null>(null);
  const [newTaxRate, setNewTaxRate] = useState<{ name: string; rate: number; type: string; } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [hospital]);

  const fetchSettings = async () => {
    setError(null);

    if (!hospital?.id) {
      setError('No hospital selected. Please ensure you are logged in with a valid hospital account.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('hospital_id', hospital.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, we'll create default settings
          const defaultSettings = getDefaultSettings();
          const { data: newSettings, error: createError } = await supabase
            .from('billing_settings')
            .insert([
              {
                ...defaultSettings,
                hospital_id: hospital.id
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          setSettings(newSettings || defaultSettings);
        } else {
          throw error;
        }
      } else {
        setSettings(data || getDefaultSettings());
      }
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      setError('Failed to load billing settings. Please try again later.');
      // Keep using default settings if there's an error
      setSettings(getDefaultSettings());
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handlePaymentMethodToggle = (type: string) => {
    const updatedMethods = settings.payment_methods.map(method =>
      method.type === type ? { ...method, enabled: !method.enabled } : method
    );

    handleChange('payment_methods', updatedMethods);
  };

  const handleAddTaxRate = () => {
    if (!newTaxRate) return;

    const updatedRates = [...settings.tax_rates, newTaxRate];
    handleChange('tax_rates', updatedRates);
    setNewTaxRate(null);
  };

  const handleUpdateTaxRate = (index: number) => {
    const updatedRates = [...settings.tax_rates];
    updatedRates[index] = {
      ...updatedRates[index],
      name: settings.tax_rates[index].name,
      rate: settings.tax_rates[index].rate,
      type: settings.tax_rates[index].type
    };

    handleChange('tax_rates', updatedRates);
    setEditingTaxRate(null);
  };

  const handleDeleteTaxRate = (index: number) => {
    const updatedRates = settings.tax_rates.filter((_, i) => i !== index);
    handleChange('tax_rates', updatedRates);
  };

  const handleSave = async () => {
    if (!hospital?.id) {
      setError('Cannot save settings: No hospital selected');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('billing_settings')
        .upsert({
          ...settings,
          hospital_id: hospital.id
        });

      if (error) throw error;
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving billing settings:', error);
      setError('Failed to save settings. Please try again.');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Billing Settings</h1>
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
        {/* Payment Methods */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
          <div className="space-y-4">
            {settings.payment_methods.map((method) => (
              <div key={method.type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {method.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handlePaymentMethodToggle(method.type)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      method.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        method.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Rates */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Tax Rates</h2>
            <button
              onClick={() => setNewTaxRate({ name: '', rate: 0, type: 'vat' })}
              className="btn btn-outline inline-flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rate
            </button>
          </div>
          
          <div className="space-y-4">
            {newTaxRate && (
              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="Tax Name"
                  value={newTaxRate.name}
                  onChange={e => setNewTaxRate({ ...newTaxRate, name: e.target.value })}
                />
                <input
                  type="number"
                  className="form-input w-24"
                  placeholder="Rate %"
                  value={newTaxRate.rate}
                  onChange={e => setNewTaxRate({ ...newTaxRate, rate: parseFloat(e.target.value) })}
                />
                <select
                  className="form-input w-32"
                  value={newTaxRate.type}
                  onChange={e => setNewTaxRate({ ...newTaxRate, type: e.target.value })}
                >
                  <option value="vat">VAT</option>
                  <option value="sales">Sales Tax</option>
                  <option value="service">Service Tax</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddTaxRate}
                    className="text-success-600 hover:text-success-900"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setNewTaxRate(null)}
                    className="text-error-600 hover:text-error-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            {settings.tax_rates.map((rate, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                {editingTaxRate === index ? (
                  <>
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="text"
                        className="form-input flex-1"
                        value={rate.name}
                        onChange={e => {
                          const updatedRates = [...settings.tax_rates];
                          updatedRates[index] = { ...rate, name: e.target.value };
                          handleChange('tax_rates', updatedRates);
                        }}
                      />
                      <input
                        type="number"
                        className="form-input w-24"
                        value={rate.rate}
                        onChange={e => {
                          const updatedRates = [...settings.tax_rates];
                          updatedRates[index] = { ...rate, rate: parseFloat(e.target.value) };
                          handleChange('tax_rates', updatedRates);
                        }}
                      />
                      <select
                        className="form-input w-32"
                        value={rate.type}
                        onChange={e => {
                          const updatedRates = [...settings.tax_rates];
                          updatedRates[index] = { ...rate, type: e.target.value };
                          handleChange('tax_rates', updatedRates);
                        }}
                      >
                        <option value="vat">VAT</option>
                        <option value="sales">Sales Tax</option>
                        <option value="service">Service Tax</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateTaxRate(index)}
                        className="text-success-600 hover:text-success-900"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingTaxRate(null)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Percent className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rate.name}</div>
                        <div className="text-sm text-gray-500">
                          {rate.rate}% - {rate.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingTaxRate(index)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTaxRate(index)}
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

        {/* Invoice Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Invoice Number Prefix</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Receipt className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10"
                  value={settings.invoice_settings.prefix}
                  onChange={e => handleChange('invoice_settings', {
                    ...settings.invoice_settings,
                    prefix: e.target.value
                  })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Payment Terms (Days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.invoice_settings.due_days}
                onChange={e => handleChange('invoice_settings', {
                  ...settings.invoice_settings,
                  due_days: parseInt(e.target.value)
                })}
              />
            </div>

            <div>
              <label className="form-label">Invoice Footer Text</label>
              <textarea
                className="form-input"
                rows={2}
                value={settings.invoice_settings.footer_text}
                onChange={e => handleChange('invoice_settings', {
                  ...settings.invoice_settings,
                  footer_text: e.target.value
                })}
              />
            </div>

            <div>
              <label className="form-label">Terms & Conditions</label>
              <textarea
                className="form-input"
                rows={4}
                value={settings.invoice_settings.terms_conditions}
                onChange={e => handleChange('invoice_settings', {
                  ...settings.invoice_settings,
                  terms_conditions: e.target.value
                })}
              />
            </div>
          </div>
        </div>

        {/* Payment Reminders */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Reminders</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoReminders"
                checked={settings.auto_payment_reminders}
                onChange={e => handleChange('auto_payment_reminders', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoReminders" className="ml-2 block text-sm text-gray-900">
                Enable Automatic Payment Reminders
              </label>
            </div>

            {settings.auto_payment_reminders && (
              <div>
                <label className="form-label">Reminder Days (before due date)</label>
                <div className="flex items-center space-x-2">
                  {settings.reminder_days.map((days, index) => (
                    <input
                      key={index}
                      type="number"
                      className="form-input w-20"
                      value={days}
                      onChange={e => {
                        const newDays = [...settings.reminder_days];
                        newDays[index] = parseInt(e.target.value);
                        handleChange('reminder_days', newDays);
                      }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the number of days before the due date to send reminders
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Currency Settings */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Currency Settings</h2>
          <div>
            <label className="form-label">Default Currency</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="form-input pl-10"
                value={settings.default_currency}
                onChange={e => handleChange('default_currency', e.target.value)}
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;