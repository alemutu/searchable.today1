import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, Syringe, CheckCircle, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Immunization {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  vaccine_name: string;
  vaccine_type: string;
  dose_number: number;
  administration_date: string;
  next_dose_due: string | null;
  is_completed: boolean;
  administered_by: {
    first_name: string;
    last_name: string;
  } | null;
}

const Immunizations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchImmunizations();
  }, [hospital]);

  const fetchImmunizations = async () => {
    try {
      const { data, error } = await supabase
        .from('immunizations')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          administered_by:administered_by(first_name, last_name)
        `)
        .order('administration_date', { ascending: false });

      if (error) throw error;
      setImmunizations(data || []);
    } catch (error) {
      console.error('Error fetching immunizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVaccineTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'live_attenuated': 'Live Attenuated',
      'inactivated': 'Inactivated',
      'subunit': 'Subunit',
      'toxoid': 'Toxoid',
      'viral_vector': 'Viral Vector',
      'mrna': 'mRNA',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const filteredImmunizations = immunizations.filter(immunization => {
    const patientName = `${immunization.patient.first_name} ${immunization.patient.last_name}`.toLowerCase();
    const vaccineName = immunization.vaccine_name.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         vaccineName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'completed' && immunization.is_completed) ||
                         (filterStatus === 'pending' && !immunization.is_completed);
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
        <h1 className="text-2xl font-bold text-gray-900">Immunization Records</h1>
        <Link to="/immunizations/new" className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Immunization
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Immunizations</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{immunizations.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <Syringe className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {immunizations.filter(i => i.is_completed).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <CheckCircle className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Due This Month</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {immunizations.filter(i => {
                  if (!i.next_dose_due) return false;
                  const dueDate = new Date(i.next_dose_due);
                  const now = new Date();
                  return dueDate.getMonth() === now.getMonth() && 
                         dueDate.getFullYear() === now.getFullYear() &&
                         !i.is_completed;
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <Calendar className="h-6 w-6 text-warning-500" />
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
              placeholder="Search by patient or vaccine..."
            />
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
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
                  Vaccine
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dose
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administration Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Dose Due
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
              {filteredImmunizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No immunization records found
                  </td>
                </tr>
              ) : (
                filteredImmunizations.map((immunization) => (
                  <tr key={immunization.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {immunization.patient.first_name} {immunization.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{immunization.vaccine_name}</div>
                      <div className="text-xs text-gray-500">{getVaccineTypeLabel(immunization.vaccine_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Dose {immunization.dose_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(immunization.administration_date).toLocaleDateString()}
                      </div>
                      {immunization.administered_by && (
                        <div className="text-xs text-gray-500">
                          by {immunization.administered_by.first_name} {immunization.administered_by.last_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {immunization.next_dose_due ? (
                        <div className="text-sm text-gray-900">
                          {new Date(immunization.next_dose_due).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        immunization.is_completed ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
                      }`}>
                        {immunization.is_completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/immunizations/${immunization.id}`} className="text-primary-600 hover:text-primary-900">
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

export default Immunizations;