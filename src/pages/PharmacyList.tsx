import React, { useState, useEffect } from 'react';
import { Search, Filter, Pill, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface PharmacyOrder {
  id: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  medications: {
    medication: string;
    dosage: string;
    quantity: number;
  }[];
  status: string;
  payment_status: string;
  is_emergency: boolean;
}

const PharmacyList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!hospital?.id) return;

      try {
        const { data, error } = await supabase
          .from('pharmacy')
          .select(`
            *,
            patient:patients(first_name, last_name)
          `)
          .eq('hospital_id', hospital.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching pharmacy orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [hospital]);

  const filteredOrders = orders.filter(order => {
    const patientName = `${order.patient.first_name} ${order.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'processing':
        return 'bg-primary-100 text-primary-800';
      case 'ready':
        return 'bg-success-100 text-success-800';
      case 'dispensed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'insured':
        return 'bg-primary-100 text-primary-800';
      case 'waived':
        return 'bg-accent-100 text-accent-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy Orders</h1>
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
              placeholder="Search orders..."
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
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
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
                  Medications
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No pharmacy orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className={`hover:bg-gray-50 ${order.is_emergency ? 'bg-error-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {order.is_emergency && (
                          <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.patient.first_name} {order.patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order #{order.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.medications.map((med, index) => (
                          <div key={index} className="flex items-center mb-1">
                            <Pill className="h-4 w-4 mr-1 text-gray-400" />
                            {med.medication} - {med.dosage} ({med.quantity})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {order.status === 'pending' && (
                          <button className="text-error-600 hover:text-error-900">
                            <XCircle className="h-5 w-5" />
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <Link
                            to={`/pharmacy/${order.id}/dispense`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredOrders.length}</span> of{' '}
            <span className="font-medium">{orders.length}</span> orders
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-outline py-1 px-3">Previous</button>
            <button className="btn btn-outline py-1 px-3">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyList;