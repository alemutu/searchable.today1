import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Stethoscope, 
  Activity,
  ClipboardList,
  AlertTriangle,
  Save
} from 'lucide-react';

interface ClinicalProtocol {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: {
    order: number;
    title: string;
    description: string;
    required: boolean;
  }[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TriageConfig {
  id: string;
  vital_signs_required: string[];
  acuity_levels: {
    level: number;
    name: string;
    description: string;
    color: string;
    max_wait_time: number;
  }[];
  emergency_criteria: {
    condition: string;
    description: string;
  }[];
}

const ClinicalSettings: React.FC = () => {
  const { hospital } = useAuthStore();
  const [protocols, setProtocols] = useState<ClinicalProtocol[]>([]);
  const [triageConfig, setTriageConfig] = useState<TriageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProtocol, setEditingProtocol] = useState<string | null>(null);
  const [newProtocol, setNewProtocol] = useState<Partial<ClinicalProtocol>>({});
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [activeTab, setActiveTab] = useState<'protocols' | 'triage'>('protocols');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [hospital]);

  const fetchData = async () => {
    if (!hospital?.id) return;

    try {
      // Fetch clinical protocols
      const { data: protocolsData, error: protocolsError } = await supabase
        .from('clinical_protocols')
        .select('*')
        .eq('hospital_id', hospital.id)
        .order('created_at', { ascending: false });

      if (protocolsError) throw protocolsError;
      setProtocols(protocolsData || []);

      // Fetch triage configuration
      const { data: triageData, error: triageError } = await supabase
        .from('clinical_settings')
        .select('*')
        .eq('hospital_id', hospital.id)
        .eq('type', 'triage')
        .maybeSingle(); // Use maybeSingle() instead of single()

      // If no data exists or there's a PGRST116 error, use default config
      if (!triageData || (triageError && triageError.code === 'PGRST116')) {
        setTriageConfig(getDefaultTriageConfig());
      } else if (triageError) {
        throw triageError;
      } else {
        setTriageConfig(triageData);
      }
    } catch (error) {
      console.error('Error fetching clinical settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultTriageConfig = (): TriageConfig => ({
    id: '',
    vital_signs_required: [
      'blood_pressure',
      'heart_rate',
      'temperature',
      'respiratory_rate',
      'oxygen_saturation',
      'pain_level'
    ],
    acuity_levels: [
      {
        level: 1,
        name: 'Critical',
        description: 'Immediate life-threatening condition',
        color: 'red',
        max_wait_time: 0
      },
      {
        level: 2,
        name: 'Emergency',
        description: 'High risk of deterioration',
        color: 'orange',
        max_wait_time: 10
      },
      {
        level: 3,
        name: 'Urgent',
        description: 'Requires urgent care',
        color: 'yellow',
        max_wait_time: 30
      },
      {
        level: 4,
        name: 'Semi-urgent',
        description: 'Stable but requires attention',
        color: 'green',
        max_wait_time: 60
      },
      {
        level: 5,
        name: 'Non-urgent',
        description: 'Minor condition',
        color: 'blue',
        max_wait_time: 120
      }
    ],
    emergency_criteria: [
      {
        condition: 'Cardiac Arrest',
        description: 'No pulse, unconscious'
      },
      {
        condition: 'Respiratory Distress',
        description: 'Severe difficulty breathing'
      },
      {
        condition: 'Severe Trauma',
        description: 'Major injuries from accidents'
      }
    ]
  });

  const handleAddProtocol = async () => {
    if (!hospital?.id) return;

    try {
      setIsSaving(true);

      const { data, error } = await supabase
        .from('clinical_protocols')
        .insert([{
          ...newProtocol,
          hospital_id: hospital.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setProtocols([data, ...protocols]);
      setShowAddProtocol(false);
      setNewProtocol({});
    } catch (error: any) {
      console.error('Error adding protocol:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProtocol = async (protocol: ClinicalProtocol) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('clinical_protocols')
        .update(protocol)
        .eq('id', protocol.id);

      if (error) throw error;

      setProtocols(protocols.map(p => p.id === protocol.id ? protocol : p));
      setEditingProtocol(null);
    } catch (error: any) {
      console.error('Error updating protocol:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProtocol = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this protocol? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('clinical_protocols')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProtocols(protocols.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Error deleting protocol:', error.message);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTriageConfig = async () => {
    if (!hospital?.id || !triageConfig) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('clinical_settings')
        .upsert({
          ...triageConfig,
          hospital_id: hospital.id,
          type: 'triage'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving triage configuration:', error.message);
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clinical Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'protocols'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Clinical Protocols
            </div>
          </button>
          <button
            onClick={() => setActiveTab('triage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'triage'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Triage Configuration
            </div>
          </button>
        </nav>
      </div>

      {/* Clinical Protocols */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Clinical Protocols</h2>
            <button
              onClick={() => setShowAddProtocol(true)}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Protocol
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocol Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {protocols.map((protocol) => (
                    <tr key={protocol.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Stethoscope className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{protocol.name}</div>
                            <div className="text-sm text-gray-500">{protocol.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {protocol.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          protocol.is_active
                            ? 'bg-success-100 text-success-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {protocol.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(protocol.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingProtocol(protocol.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProtocol(protocol.id)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Triage Configuration */}
      {activeTab === 'triage' && triageConfig && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Triage Configuration</h2>
            <button
              onClick={handleSaveTriageConfig}
              disabled={isSaving}
              className="btn btn-primary inline-flex items-center"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
            {/* Required Vital Signs */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Vital Signs</h3>
              <div className="grid grid-cols-2 gap-4">
                {triageConfig.vital_signs_required.map((sign, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      {sign.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Acuity Levels */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Acuity Levels</h3>
              <div className="space-y-4">
                {triageConfig.acuity_levels.map((level, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full bg-${level.color}-500`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Level {level.level}: {level.name}
                      </div>
                      <div className="text-sm text-gray-500">{level.description}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Max Wait: {level.max_wait_time} min
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Criteria */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Criteria</h3>
              <div className="space-y-4">
                {triageConfig.emergency_criteria.map((criteria, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{criteria.condition}</div>
                      <div className="text-sm text-gray-500">{criteria.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalSettings;