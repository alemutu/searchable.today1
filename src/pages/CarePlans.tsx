import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, ClipboardList, CheckCircle, Calendar, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface CarePlan {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  goals: {
    description: string;
    target_date: string;
    status: string;
  }[];
  created_by: {
    first_name: string;
    last_name: string;
  } | null;
}

const CarePlans: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchCarePlans();
  }, [hospital, patientId]);

  const fetchCarePlans = async () => {
    try {
      let query = supabase
        .from('care_plans')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          created_by:created_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCarePlans(data || []);
    } catch (error) {
      console.error('Error fetching care plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'discontinued':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionPercentage = (goals: any[]) => {
    if (!goals || goals.length === 0) return 0;
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    return Math.round((completedGoals / goals.length) * 100);
  };

  const filteredCarePlans = carePlans.filter(plan => {
    const patientName = `${plan.patient.first_name} ${plan.patient.last_name}`.toLowerCase();
    const planTitle = plan.title.toLowerCase();
    const planDescription = plan.description?.toLowerCase() || '';
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         planTitle.includes(searchTerm.toLowerCase()) ||
                         planDescription.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || plan.status === filterStatus;
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
        <h1 className="text-2xl font-bold text-gray-900">
          {patientId ? 'Patient Care Plans' : 'Care Plans'}
        </h1>
        <Link to={patientId ? `/patients/${patientId}/care-plans/new` : "/care-plans/new"} className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Care Plan
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Care Plans</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{carePlans.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <ClipboardList className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Plans</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {carePlans.filter(p => p.status === 'active').length}
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
              <p className="text-sm font-medium text-gray-500">Ending This Month</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {carePlans.filter(p => {
                  if (!p.end_date) return false;
                  const endDate = new Date(p.end_date);
                  const now = new Date();
                  return endDate.getMonth() === now.getMonth() && 
                         endDate.getFullYear() === now.getFullYear() &&
                         p.status === 'active';
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
              placeholder="Search by patient or care plan title..."
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
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="discontinued">Discontinued</option>
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
                  Care Plan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
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
              {filteredCarePlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No care plans found
                  </td>
                </tr>
              ) : (
                filteredCarePlans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.patient.first_name} {plan.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                      {plan.description && (
                        <div className="text-xs text-gray-500 max-w-xs truncate">{plan.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(plan.start_date).toLocaleDateString()}
                        {plan.end_date && (
                          <> - {new Date(plan.end_date).toLocaleDateString()}</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary-500 h-2.5 rounded-full" 
                            style={{ width: `${getCompletionPercentage(plan.goals)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700">
                          {getCompletionPercentage(plan.goals)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/care-plans/${plan.id}`} className="text-primary-600 hover:text-primary-900">
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

export default CarePlans;