import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Allergy {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  allergen: string;
  allergen_type: string;
  reaction: string;
  severity: string;
  status: string;
  onset_date: string | null;
}

const Allergies: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchAllergies();
  }, [hospital]);

  const fetchAllergies = async () => {
    try {
      const { data, error } = await supabase
        .from('allergies')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllergies(data || []);
    } catch (error) {
      console.error('Error fetching allergies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllergenTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'medication': 'Medication',
      'food': 'Food',
      'environmental': 'Environmental',
      'insect': 'Insect',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-success-100 text-success-800';
      case 'moderate':
        return 'bg-warning-100 text-warning-800';
      case 'severe':
        return 'bg-error-100 text-error-800';
      case 'life_threatening':
        return 'bg-error-100 text-error-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-error-100 text-error-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'resolved':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAllergies = allergies.filter(allergy => {
    const patientName = `${allergy.patient.first_name} ${allergy.patient.last_name}`.toLowerCase();
    const allergenName = allergy.allergen.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         allergenName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || allergy.allergen_type === filterType;
    return matchesSearch && matchesFilter;
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
        <h1 className="text-2xl font-bold text-gray-900">Allergy Records</h1>
        <Link to="/allergies/new" className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Allergy
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Allergies</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{allergies.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <AlertTriangle className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Medication Allergies</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {allergies.filter(a => a.allergen_type === 'medication').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <AlertTriangle className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Food Allergies</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {allergies.filter(a => a.allergen_type === 'food').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-accent-100">
              <AlertTriangle className="h-6 w-6 text-accent-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Severe Reactions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {allergies.filter(a => a.severity === 'severe' || a.severity === 'life_threatening').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-error-100">
              <AlertTriangle className="h-6 w-6 text-error-500" />
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
              placeholder="Search by patient or allergen..."
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
              <option value="medication">Medication</option>
              <option value="food">Food</option>
              <option value="environmental">Environmental</option>
              <option value="insect">Insect</option>
              <option value="other">Other</option>
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
                  Allergen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reaction
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
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
              {filteredAllergies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No allergy records found
                  </td>
                </tr>
              ) : (
                filteredAllergies.map((allergy) => (
                  <tr key={allergy.id} className={allergy.severity === 'life_threatening' ? 'bg-error-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {allergy.patient.first_name} {allergy.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{allergy.allergen}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getAllergenTypeLabel(allergy.allergen_type)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{allergy.reaction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(allergy.severity)}`}>
                        {allergy.severity.charAt(0).toUpperCase() + allergy.severity.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(allergy.status)}`}>
                        {allergy.status.charAt(0).toUpperCase() + allergy.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/allergies/${allergy.id}`} className="text-primary-600 hover:text-primary-900">
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

export default Allergies;