import React, { useState, useEffect } from 'react';
import { Search, Filter, Pill, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, ChevronDown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'processing'>('pending');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!hospital?.id) return;

      try {
        // In a real app, we would fetch from Supabase
        // For now, we'll use mock data
        const mockOrders = [
          {
            id: '00000000-0000-0000-0000-000000000001',
            created_at: '2025-05-15T09:15:00Z',
            patient: {
              first_name: 'John',
              last_name: 'Doe'
            },
            medications: [
              {
                medication: 'Amoxicillin',
                dosage: '500mg',
                quantity: 30
              },
              {
                medication: 'Paracetamol',
                dosage: '500mg',
                quantity: 20
              }
            ],
            status: 'pending',
            payment_status: 'pending',
            is_emergency: false
          },
          {
            id: '00000000-0000-0000-0000-000000000002',
            created_at: '2025-05-15T10:30:00Z',
            patient: {
              first_name: 'Jane',
              last_name: 'Smith'
            },
            medications: [
              {
                medication: 'Ibuprofen',
                dosage: '400mg',
                quantity: 15
              }
            ],
            status: 'processing',
            payment_status: 'paid',
            is_emergency: true
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            created_at: '2025-05-15T11:45:00Z',
            patient: {
              first_name: 'Robert',
              last_name: 'Johnson'
            },
            medications: [
              {
                medication: 'Metformin',
                dosage: '850mg',
                quantity: 60
              },
              {
                medication: 'Atorvastatin',
                dosage: '20mg',
                quantity: 30
              },
              {
                medication: 'Aspirin',
                dosage: '75mg',
                quantity: 28
              }
            ],
            status: 'pending',
            payment_status: 'insured',
            is_emergency: false
          },
          {
            id: '00000000-0000-0000-0000-000000000004',
            created_at: '2025-05-15T12:15:00Z',
            patient: {
              first_name: 'Emily',
              last_name: 'Williams'
            },
            medications: [
              {
                medication: 'Salbutamol',
                dosage: '100mcg',
                quantity: 1
              }
            ],
            status: 'processing',
            payment_status: 'pending',
            is_emergency: false
          },
          {
            id: '00000000-0000-0000-0000-000000000005',
            created_at: '2025-05-15T13:00:00Z',
            patient: {
              first_name: 'Michael',
              last_name: 'Brown'
            },
            medications: [
              {
                medication: 'Prednisolone',
                dosage: '5mg',
                quantity: 28
              }
            ],
            status: 'ready',
            payment_status: 'paid',
            is_emergency: false
          }
        ];
        
        setOrders(mockOrders);
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
    const matchesFilter = filterStatus === 'all' || order.payment_status === filterStatus;
    
    if (activeTab === 'pending') {
      return order.status === 'pending' && matchesSearch && matchesFilter;
    } else {
      return order.status === 'processing' && matchesSearch && matchesFilter;
    }
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

  // Count orders in each category
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const urgentCount = orders.filter(o => o.is_emergency).length;

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pharmacy</h1>
          <p className="text-xs text-gray-500">Medication Management & Dispensing</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <div 
          className={`flex-1 rounded-lg p-3 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'pending' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">Pending</span>
          <span className="ml-auto bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {pendingCount}
          </span>
        </div>
        
        <div 
          className={`flex-1 rounded-lg p-3 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'processing' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('processing')}
        >
          <Pill className="h-4 w-4 text-primary-500" />
          <span className="font-medium text-sm">Processing</span>
          <span className="ml-auto bg-primary-100 text-primary-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {processingCount}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-7 py-1.5 text-sm w-full"
            placeholder="Search prescriptions..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input appearance-none pr-7 py-1.5 text-sm"
          >
            <option value="all">All Payment</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="insured">Insured</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        {/* Left Section - Prescription Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Pill className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No prescriptions {activeTab === 'pending' ? 'pending' : 'processing'}</h3>
                <p className="text-xs text-gray-500">There are currently no prescriptions in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <div key={order.id} className={`p-3 hover:bg-gray-50 ${order.is_emergency ? 'bg-error-50' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {order.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {order.patient.first_name} {order.patient.last_name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <span className="mx-1">•</span>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.is_emergency && (
                              <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-error-100 text-error-800">
                                Emergency
                              </span>
                            )}
                            <Link 
                              to={`/pharmacy/${order.id}/dispense`}
                              className="btn btn-primary inline-flex items-center text-xs py-1 px-2"
                            >
                              Process Order <Pill className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                        <div className="mt-0.5">
                          <div className="flex flex-wrap gap-1">
                            {order.medications.slice(0, 2).map((med, index) => (
                              <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <Pill className="h-2.5 w-2.5 mr-0.5" />
                                {med.medication} ({med.quantity})
                              </span>
                            ))}
                            {order.medications.length > 2 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{order.medications.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Overview and Quick Actions */}
        <div className="w-1/3 space-y-3">
          {/* Overview Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium text-gray-900">Pharmacy Overview</h2>
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="font-medium text-sm">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Processing</span>
                </div>
                <span className="font-medium text-sm">{processingCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Ready</span>
                </div>
                <span className="font-medium text-sm">{readyCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-warning-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Urgent</span>
                </div>
                <span className="font-medium text-sm">{urgentCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/pharmacy/inventory" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Plus className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Inventory</span>
              </Link>
              <Link to="/patients" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">View Records</span>
              </Link>
              <Link to="/reception" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <User className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Reception</span>
              </Link>
              <Link to="/appointments" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Calendar className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Appointments</span>
              </Link>
            </div>
          </div>

          {/* Reference Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium text-gray-900 flex items-center">
                <Pill className="h-4 w-4 text-primary-500 mr-1.5" />
                Medication Reference
              </h2>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-1">Common Medications</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-gray-600">Paracetamol</div>
                  <div className="text-right">500mg, 1g</div>
                  <div className="text-gray-600">Amoxicillin</div>
                  <div className="text-right">250mg, 500mg</div>
                  <div className="text-gray-600">Ibuprofen</div>
                  <div className="text-right">200mg, 400mg</div>
                  <div className="text-gray-600">Omeprazole</div>
                  <div className="text-right">20mg, 40mg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyList;