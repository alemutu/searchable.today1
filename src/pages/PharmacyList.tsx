import React, { useState, useEffect } from 'react';
import { Search, Filter, Pill, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, ChevronDown, Layers, Loader2, CreditCard, Building2, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../lib/store';

interface PharmacyOrder {
  id: string;
  created_at: string;
  patient: {
    id: string;
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
  assigned_to?: string;
  last_updated?: string;
}

const PharmacyList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'processing'>('pending');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const { addNotification } = useNotificationStore();
  
  const { 
    data: orders, 
    loading: isLoading, 
    error, 
    saveItem, 
    fetchItems 
  } = useHybridStorage<PharmacyOrder>('pharmacy');
  
  const [inventoryStatus, setInventoryStatus] = useState<{[key: string]: {inStock: boolean, quantity: number}}>({});

  useEffect(() => {
    fetchItems();
    
    // Initialize inventory status
    setInventoryStatus({
      'Amoxicillin': { inStock: true, quantity: 120 },
      'Paracetamol': { inStock: true, quantity: 200 },
      'Ibuprofen': { inStock: true, quantity: 150 },
      'Metformin': { inStock: true, quantity: 80 },
      'Atorvastatin': { inStock: true, quantity: 60 },
      'Aspirin': { inStock: true, quantity: 100 },
      'Salbutamol': { inStock: false, quantity: 0 },
      'Prednisolone': { inStock: true, quantity: 45 },
      'Omeprazole': { inStock: false, quantity: 0 },
      'Ranitidine': { inStock: true, quantity: 25 }
    });
  }, [fetchItems]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  
  const handleAssignToMe = async (orderId: string) => {
    if (!Array.isArray(orders)) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      // Update the order
      const updatedOrder: PharmacyOrder = {
        ...order,
        assigned_to: 'current_user', // Replace with actual user ID
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedOrder, orderId);
      
      // Show notification
      addNotification({
        message: `Order for ${order.patient.first_name} ${order.patient.last_name} assigned to you`,
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error assigning order:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleReleaseAssignment = async (orderId: string) => {
    if (!Array.isArray(orders)) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      // Update the order
      const updatedOrder: PharmacyOrder = {
        ...order,
        assigned_to: undefined,
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedOrder, orderId);
      
      // Show notification
      addNotification({
        message: `Order for ${order.patient.first_name} ${order.patient.last_name} released from your queue`,
        type: 'info',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error releasing order assignment:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  const handleProcessOrder = async (orderId: string) => {
    if (!Array.isArray(orders)) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      // Update order status
      const updatedOrder: PharmacyOrder = {
        ...order,
        status: 'processing',
        assigned_to: 'current_user', // Replace with actual user ID
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedOrder, orderId);
      
      // Show notification
      addNotification({
        message: `Started processing order for ${order.patient.first_name} ${order.patient.last_name}`,
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error processing order:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const patientName = `${order.patient.first_name} ${order.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.payment_status === filterStatus;
    const matchesAssigned = !assignedToMe || order.assigned_to === 'current_user'; // Replace with actual user ID
    
    if (activeTab === 'pending') {
      return order.status === 'pending' && matchesSearch && matchesFilter && matchesAssigned;
    } else {
      return order.status === 'processing' && matchesSearch && matchesFilter && matchesAssigned;
    }
  }) : [];

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
  const pendingCount = Array.isArray(orders) ? orders.filter(o => o.status === 'pending').length : 0;
  const processingCount = Array.isArray(orders) ? orders.filter(o => o.status === 'processing').length : 0;
  const readyCount = Array.isArray(orders) ? orders.filter(o => o.status === 'ready').length : 0;
  const urgentCount = Array.isArray(orders) ? orders.filter(o => o.is_emergency).length : 0;
  const assignedToMeCount = Array.isArray(orders) ? orders.filter(o => o.assigned_to === 'current_user').length : 0; // Replace with actual user ID

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error loading pharmacy data</h3>
        <p className="text-gray-500 mt-2">{error.message}</p>
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
          className={`flex-1 rounded-lg p-2.5 flex items-center space-x-2 cursor-pointer ${
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
          className={`flex-1 rounded-lg p-2.5 flex items-center space-x-2 cursor-pointer ${
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
            className="form-input pl-7 py-1.5 text-sm w-full rounded-lg"
            placeholder="Search prescriptions..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input appearance-none pr-7 py-1.5 text-sm rounded-lg"
          >
            <option value="all">All Payment</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="insured">Insured</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="assignedToMe"
            checked={assignedToMe}
            onChange={(e) => setAssignedToMe(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="assignedToMe" className="ml-2 text-xs text-gray-700">
            Assigned to me ({assignedToMeCount})
          </label>
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
                            <h3 className="text-base font-medium text-gray-900">{order.patient.first_name} {order.patient.last_name}</h3>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{getTimeAgo(order.last_updated || order.created_at)}</span>
                              <span className="mx-1.5">•</span>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.is_emergency && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-error-100 text-error-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                URGENT
                              </span>
                            )}
                            
                            {order.assigned_to && order.assigned_to !== 'current_user' && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                Assigned
                              </span>
                            )}
                            
                            {activeTab === 'pending' ? (
                              <div className="flex space-x-1">
                                {!order.assigned_to && (
                                  <button 
                                    onClick={() => handleAssignToMe(order.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Assign to me"
                                  >
                                    Assign to me
                                  </button>
                                )}
                                
                                {order.assigned_to === 'current_user' && (
                                  <>
                                    <button 
                                      onClick={() => handleProcessOrder(order.id)}
                                      disabled={order.payment_status === 'pending'}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title={order.payment_status === 'pending' ? 'Payment required before processing' : ''}
                                    >
                                      Process Order <Pill className="h-3 w-3 ml-1" />
                                    </button>
                                    <button 
                                      onClick={() => handleReleaseAssignment(order.id)}
                                      className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title="Release assignment"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                {order.assigned_to === 'current_user' ? (
                                  <>
                                    <Link 
                                      to={`/pharmacy/${order.id}/dispense`}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Dispense <Pill className="h-3 w-3 ml-1" />
                                    </Link>
                                    <button 
                                      onClick={() => handleReleaseAssignment(order.id)}
                                      className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title="Release assignment"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignToMe(order.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Take over this order"
                                  >
                                    Take over
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {order.medications.slice(0, 3).map((med, index) => (
                            <span key={index} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              inventoryStatus[med.medication]?.inStock 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-error-100 text-error-800'
                            }`}>
                              <Pill className="h-2.5 w-2.5 mr-0.5" />
                              {med.medication} ({med.quantity})
                              {!inventoryStatus[med.medication]?.inStock && ' - Out of stock'}
                            </span>
                          ))}
                          {order.medications.length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{order.medications.length - 3} more
                            </span>
                          )}
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
          {/* My Work Queue */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Layers className="h-4 w-4 text-primary-500 mr-1.5" />
                <h2 className="text-sm font-medium text-gray-900">My Work Queue</h2>
              </div>
              <span className="text-xs text-gray-500">{assignedToMeCount} orders</span>
            </div>
            <div className="p-3">
              {assignedToMeCount === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No orders currently assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(orders) && orders
                    .filter(o => o.assigned_to === 'current_user')
                    .sort((a, b) => {
                      // Sort by emergency first, then by status
                      if (a.is_emergency && !b.is_emergency) return -1;
                      if (!a.is_emergency && b.is_emergency) return 1;
                      
                      // Then sort by status
                      const statusOrder = {
                        'pending': 0,
                        'processing': 1,
                        'ready': 2,
                        'dispensed': 3
                      };
                      
                      return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
                    })
                    .slice(0, 5)
                    .map(order => (
                      <div key={order.id} className={`p-2 rounded-lg border ${order.is_emergency ? 'border-error-200 bg-error-50' : 'border-gray-200'} flex items-center justify-between`}>
                        <div className="flex items-center">
                          <div className="mr-2">
                            {order.status === 'pending' ? (
                              <Clock className="h-3.5 w-3.5 text-warning-500" />
                            ) : order.status === 'processing' ? (
                              <Pill className="h-3.5 w-3.5 text-primary-500" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {order.patient.first_name} {order.patient.last_name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {order.medications.length} medication{order.medications.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/pharmacy/${order.id}/dispense`}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {order.status === 'pending' ? 'Process' : 'Continue'}
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Overview Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Pharmacy Overview</h2>
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

          {/* Inventory Status Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Inventory Status</h2>
              <button className="text-primary-600 text-xs font-medium">View All</button>
            </div>
            <div className="space-y-2">
              {Object.entries(inventoryStatus).slice(0, 5).map(([medication, status]) => (
                <div key={medication} className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                  <div className="flex items-center">
                    <Pill className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-sm text-gray-700">{medication}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs font-medium ${status.inStock ? 'text-success-600' : 'text-error-600'}`}>
                      {status.inStock ? `${status.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/pharmacy/inventory" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <Plus className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Inventory</span>
              </Link>
              <Link to="/patients" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">View Records</span>
              </Link>
              <Link to="/reception" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <User className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Reception</span>
              </Link>
              <Link to="/appointments" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <Calendar className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Appointments</span>
              </Link>
            </div>
          </div>

          {/* Reference Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900 flex items-center">
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