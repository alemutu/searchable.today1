import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface Bill {
  id: string;
  created_at: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  services: {
    name: string;
    amount: number;
    quantity: number;
  }[];
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  insurance_info: {
    provider: string;
    policy_number: string;
    coverage_percentage: number;
  } | null;
}

const BillingList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    const fetchBills = async () => {
      if (!hospital) return;

      try {
        const { data, error } = await supabase
          .from('billing')
          .select(`
            *,
            patient:patients(id, first_name, last_name)
          `)
          .eq('hospital_id', hospital.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBills(data || []);
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [hospital]);

  const filteredBills = bills.filter(bill => {
    const patientName = `${bill.patient.first_name} ${bill.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || bill.payment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-100 text-success-800';
      case 'partial':
        return 'bg-warning-100 text-warning-800';
      case 'pending':
        return 'bg-error-100 text-error-800';
      case 'insured':
        return 'bg-primary-100 text-primary-800';
      case 'waived':
        return 'bg-accent-100 text-accent-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
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
              placeholder="Search bills..."
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
              <option value="all">All Bills</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="insured">Insured</option>
              <option value="waived">Waived</option>
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
                  Services
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {bill.patient.first_name} {bill.patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Bill #{bill.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {bill.services.map((service, index) => (
                          <div key={index} className="flex items-center mb-1">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                            {service.name} x{service.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(bill.total_amount)}
                      </div>
                      {bill.paid_amount > 0 && bill.paid_amount < bill.total_amount && (
                        <div className="text-sm text-gray-500">
                          Paid: {formatCurrency(bill.paid_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.payment_status)}`}>
                        {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                      </span>
                      {bill.insurance_info && (
                        <div className="mt-1 text-xs text-gray-500">
                          Insured ({bill.insurance_info.coverage_percentage}%)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/billing/${bill.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FileText className="h-5 w-5" />
                        </Link>
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
            Showing <span className="font-medium">{filteredBills.length}</span> of{' '}
            <span className="font-medium">{bills.length}</span> bills
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

export default BillingList;