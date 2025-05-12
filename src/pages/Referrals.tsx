import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, ArrowUpRight, Calendar, AlertTriangle, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface Referral {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  referring_doctor: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  specialist: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  referral_date: string;
  reason: string;
  urgency: string;
  status: string;
  appointment_date: string | null;
}

const Referrals: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchReferrals();
  }, [hospital, patientId]);

  const fetchReferrals = async () => {
    try {
      let query = supabase
        .from('referrals')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          referring_doctor:referring_doctor_id(id, first_name, last_name),
          specialist:specialist_id(id, first_name, last_name)
        `)
        .order('referral_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'scheduled':
        return 'bg-primary-100 text-primary-800';
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine':
        return 'bg-success-100 text-success-800';
      case 'urgent':
        return 'bg-warning-100 text-warning-800';
      case 'emergency':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReferrals = referrals.filter(referral => {
    const patientName = `${referral.patient.first_name} ${referral.patient.last_name}`.toLowerCase();
    const reason = referral.reason.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         reason.includes(searchTerm.toLowerCase());
    const matchesStatusFilter = filterStatus === 'all' || referral.status === filterStatus;
    const matchesUrgencyFilter = filterUrgency === 'all' || referral.urgency === filterUrgency;
    return matchesSearch && matchesStatusFilter && matchesUrgencyFilter;
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
          {patientId ? 'Patient Referrals' : 'Referrals'}
        </h1>
        <Link to={patientId ? `/patients/${patientId}/referrals/new` : "/referrals/new"} className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Referral
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Referrals</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{referrals.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <ArrowUpRight className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Appointments</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {referrals.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <Calendar className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent Referrals</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {referrals.filter(r => r.urgency === 'urgent' || r.urgency === 'emergency').length}
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
              placeholder="Search by patient or reason..."
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
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Urgency</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
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
                  Referring Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialist
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
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
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No referrals found
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => (
                  <tr key={referral.id} className={referral.urgency === 'emergency' ? 'bg-error-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {referral.patient.first_name} {referral.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {referral.referring_doctor ? (
                          `Dr. ${referral.referring_doctor.first_name} ${referral.referring_doctor.last_name}`
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {referral.specialist ? (
                          `Dr. ${referral.specialist.first_name} ${referral.specialist.last_name}`
                        ) : (
                          'Not assigned'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(referral.referral_date).toLocaleDateString()}
                      </div>
                      {referral.appointment_date && (
                        <div className="text-xs text-gray-500">
                          Appt: {new Date(referral.appointment_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUrgencyColor(referral.urgency)}`}>
                        {referral.urgency.charAt(0).toUpperCase() + referral.urgency.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(referral.status)}`}>
                        {referral.status.charAt(0).toUpperCase() + referral.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/referrals/${referral.id}`} className="text-primary-600 hover:text-primary-900">
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

export default Referrals;