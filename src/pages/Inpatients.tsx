import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { BedDouble, Heart, Activity, AlertTriangle, Search, Filter } from 'lucide-react';

interface Inpatient {
  id: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  admission_date: string;
  ward_id: string;
  bed_number: string;
  status: string;
  vital_signs_history: any[];
  medication_schedule: any[];
  attending_doctor: {
    first_name: string;
    last_name: string;
  };
}

const Inpatients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchInpatients();
  }, [hospital]);

  const fetchInpatients = async () => {
    try {
      const { data, error } = await supabase
        .from('inpatients')
        .select(`
          *,
          patient:patients(first_name, last_name),
          attending_doctor:profiles(first_name, last_name)
        `)
        .order('admission_date', { ascending: false });

      if (error) throw error;
      setInpatients(data || []);
    } catch (error) {
      console.error('Error fetching inpatients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted':
        return 'bg-success-100 text-success-800';
      case 'critical':
        return 'bg-error-100 text-error-800';
      case 'stable':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInpatients = inpatients.filter(inpatient => {
    const patientName = `${inpatient.patient.first_name} ${inpatient.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inpatient.status === filterStatus;
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
        <h1 className="text-2xl font-bold text-gray-900">Inpatient Management</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Inpatients</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{inpatients.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <BedDouble className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical Cases</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {inpatients.filter(p => p.status === 'critical').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-error-100">
              <Heart className="h-6 w-6 text-error-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stable Patients</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {inpatients.filter(p => p.status === 'stable').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <Activity className="h-6 w-6 text-success-500" />
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
              placeholder="Search patients..."
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
              <option value="admitted">Admitted</option>
              <option value="critical">Critical</option>
              <option value="stable">Stable</option>
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
                  Ward/Bed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attending Doctor
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
              {filteredInpatients.map((inpatient) => (
                <tr key={inpatient.id} className={inpatient.status === 'critical' ? 'bg-error-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {inpatient.status === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {inpatient.patient.first_name} {inpatient.patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Admitted: {new Date(inpatient.admission_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Ward {inpatient.ward_id}</div>
                    <div className="text-sm text-gray-500">Bed {inpatient.bed_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Dr. {inpatient.attending_doctor.first_name} {inpatient.attending_doctor.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(inpatient.status)}`}>
                      {inpatient.status.charAt(0).toUpperCase() + inpatient.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/inpatients/${inpatient.id}`} className="text-primary-600 hover:text-primary-900">
                      View Details
                    </a>
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

export default Inpatients;