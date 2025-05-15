import React, { useState, useEffect } from 'react';
import { Search, Filter, Pill, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, ChevronDown, Layers, Loader2, CreditCard, Building2, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';

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

interface InventoryItem {
  id: string;
  medication: string;
  quantity: number;
  in_stock: boolean;
}

const PharmacyList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital, user } = useAuthStore();
  const { addNotification, hasNotifiedAbout, markAsNotified } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'processing'>('pending');
  const [inventoryStatus, setInventoryStatus] = useState<{[key: string]: {inStock: boolean, quantity: number}}>({});
  const [assignedToMe, setAssignedToMe] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [hospital]);

  const fetchOrders = async () => {
    if (!hospital?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch pharmacy orders
      const { data, error } = await supabase
        .from('pharmacy')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name)
        `)
        .eq('hospital_id', hospital.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
      
      // Show notification for emergency cases
      const emergencyCases = data?.filter(order => order.is_emergency && (order.status === 'pending' || order.status === 'processing')) || [];
      
      emergencyCases.forEach(emergency => {
        // Create a unique key for this emergency
        const emergencyKey = `pharm-${emergency.id}-${emergency.patient.id}`;
        
        // Only show notification if we haven't already notified about this emergency
        if (!hasNotifiedAbout(emergencyKey)) {
          addNotification({
            message: `EMERGENCY: Prescription for ${emergency.patient.first_name} ${emergency.patient.last_name} needs immediate attention`,
            type: 'error',
            duration: 5000
          });
          
          // Mark this emergency as notified
          markAsNotified(emergencyKey);
        }
      });
      
      // Fetch inventory status
      await fetchInventoryStatus(data || []);
      
    } catch (error) {
      console.error('Error fetching pharmacy orders:', error);
      addNotification({
        message: 'Failed to load pharmacy orders',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchInventoryStatus = async (orders: PharmacyOrder[]) => {
    if (!hospital?.id) return;
    
    try {
      // Extract all unique medications from orders
      const allMedications = new Set<string>();
      orders.forEach(order => {
        order.medications.forEach(med => {
          allMedications.add(med.medication);
        });
      });
      
      // Fetch inventory status for these medications
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('hospital_id', hospital.id)
        .in('medication', Array.from(allMedications));
      
      if (error) throw error;
      
      // Create inventory status map
      const inventoryMap: {[key: string]: {inStock: boolean, quantity: number}} = {};
      
      // Initialize with all medications as out of stock
      allMedications.forEach(med => {
        inventoryMap[med] = { inStock: false, quantity: 0 };
      });
      
      // Update with actual inventory data
      data?.forEach((item: InventoryItem) => {
        inventoryMap[item.medication] = { 
          inStock: item.in_stock, 
          quantity: item.quantity 
        };
      });
      
      setInventoryStatus(inventoryMap);
      
      // Check for out of stock medications
      orders.forEach(order => {
        order.medications.forEach(med => {
          if (!inventoryMap[med.medication]?.inStock) {
            addNotification({
              message: `Warning: ${med.medication} is out of stock`,
              type: 'warning',
              duration: 4000
            });
          } else if (inventoryMap[med.medication]?.quantity < med.quantity) {
            addNotification({
              message: `Low stock: Only ${inventoryMap[med.medication]?.quantity} of ${med.medication} available`,
              type: 'warning',
              duration: 4000
            });
          }
        });
      });
      
    } catch (error) {
      console.error('Error fetching inventory status:', error);
    }
  };
  
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
    if (!user?.id) return;
    
    try {
      // Update the order in the database
      const { error } = await supabase
        .from('pharmacy')
        .update({
          assigned_to: user.id,
          last_updated: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh the data
      await fetchOrders();
      
      // Show notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        addNotification({
          message: `Order for ${order.patient.first_name} ${order.patient.last_name} assigned to you`,
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      addNotification({
        message: 'Failed to assign order',
        type: 'error'
      });
    }
  };

  const handleReleaseAssignment = async (orderId: string) => {
    try {
      // Update the order in the database
      const { error } = await supabase
        .from('pharmacy')
        .update({
          assigned_to: null,
          last_updated: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh the data
      await fetchOrders();
      
      // Show notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        addNotification({
          message: `Order for ${order.patient.first_name} ${order.patient.last_name} released from your queue`,
          type: 'info',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error releasing order assignment:', error);
      addNotification({
        message: 'Failed to release order',
        type: 'error'
      });
    }
  };
  
  const handleProcessOrder = async (orderId: string) => {
    if (!user?.id) return;
    
    try {
      // Update the order in the database
      const { error } = await supabase
        .from('pharmacy')
        .update({
          status: 'processing',
          assigned_to: user.id,
          last_updated: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh the data
      await fetchOrders();
      
      // Show notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        addNotification({
          message: `Started processing order for ${order.patient.first_name} ${order.patient.last_name}`,
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error processing order:', error);
      addNotification({
        message: 'Failed to process order',
        type: 'error'
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const patientName = `${order.patient.first_name} ${order.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.payment_status === filterStatus;
    const matchesAssigned = !assignedToMe || order.assigned_to === user?.id;
    
    if (activeTab === 'pending') {
      return order.status === 'pending' && matchesSearch && matchesFilter && matchesAssigned;
    } else {
      return order.status === 'processing' && matchesSearch && matchesFilter && matchesAssigned;
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
  const assignedToMeCount = orders.filter(o => o.assigned_to === user?.id).length;

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
                            <h3 className="text-base font-medium text-gray-900">
                              {order.patient.first_name} {order.patient.last_name}
                            </h3>
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
                            
                            {order.assigned_to && order.assigned_to !== user?.id && (
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
                                
                                {order.assigned_to === user?.id && (
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
                                {order.assigned_to === user?.id ? (
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
              <span className="text-xs text-gray-500">{orders.filter(o => o.assigned_to === user?.id).length} orders</span>
            </div>
            <div className="p-3">
              {orders.filter(o => o.assigned_to === user?.id).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No orders currently assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders
                    .filter(o => o.assigned_to === user?.id)
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
                  
                  {orders.filter(o => o.assigned_to === user?.id).length > 5 && (
                    <div className="text-center pt-1">
                      <button className="text-xs text-primary-600 hover:text-primary-800">
                        View all ({orders.filter(o => o.assigned_to === user?.id).length})
                      </button>
                    </div>
                  )}
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
              {Object.entries(inventoryStatus).length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">No inventory data available</p>
                </div>
              ) : (
                Object.entries(inventoryStatus).slice(0, 5).map(([medication, status]) => (
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
                ))
              )}
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