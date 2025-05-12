import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, FileText, Plus, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface MedicalHistoryItem {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  condition: string;
  condition_type: string;
  diagnosis_date: string | null;
  status: string;
  treatment: string | null;
  diagnosed_by: {
    first_name: string;
    last_name: string;
  } | null;
}

const MedicalHistory: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchMedicalHistory();
  }, [hospital, patientId]);

  const fetchMedicalHistory = async () => {
    try {
      let query = supabase
        .from('medical_history')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          diagnosed_by:diagnosed_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMedicalHistory(data || []);
    } catch (error) {
      console.error('Error fetching medical history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'chronic': 'Chronic',
      'acute': 'Acute',
      'surgical': 'Surgical',
      'injury': 'Injury',
      'congenital': 'Congenital',
      'infectious': 'Infectious',
      'mental_health': 'Mental Health',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-error-100 text-error-800';
      case 'resolved':
        return 'bg-success-100 text-success-800';
      case 'in_remission':
        return 'bg-warning-100 text-warning-800';
      case 'recurrent':
        return 'bg-accent-100 text-accent-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = medicalHistory.filter(item => {
    const patientName = `${item.patient.first_name} ${item.patient.last_name}`.toLowerCase();
    const conditionName = item.condition.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         conditionName.includes(searchTerm.toLowerCase());
    const matchesTypeFilter = filterType === 'all' || item.condition_type === filterType;
    const matchesStatusFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesTypeFilter && matchesStatusFilter;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">
          {patientId ? 'Patient Medical History' : 'Medical History Records'}
        </h1>
        <Link to={patientId ? `/patients/${patientId}/medical-history/new` : "/medical-history/new"} className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Medical History
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Conditions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{medicalHistory.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Conditions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {medicalHistory.filter(h => h.status === 'active').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-error-100">
              <Clock className="h-6 w-6 text-error-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chronic Conditions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {medicalHistory.filter(h => h.condition_type === 'chronic').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <FileText className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              placeholder="Search by patient or condition..."
            />
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Types</option>
              <option value="chronic">Chronic</option>
              <option value="acute">Acute</option>
              <option value="surgical">Surgical</option>
              <option value="injury">Injury</option>
              <option value="congenital">Congenital</option>
              <option value="infectious">Infectious</option>
              <option value="mental_health">Mental Health</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="in_remission">In Remission</option>
              <option value="recurrent">Recurrent</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnosis Date
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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No medical history records found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.patient.first_name} {item.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.condition}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getConditionTypeLabel(item.condition_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.diagnosis_date ? new Date(item.diagnosis_date).toLocaleDateString() : 'Unknown'}
                      </div>
                      {item.diagnosed_by && (
                        <div className="text-xs text-gray-500">
                          by Dr. {item.diagnosed_by.first_name} {item.diagnosed_by.last_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/medical-history/${item.id}`} className="text-primary-600 hover:text-primary-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;