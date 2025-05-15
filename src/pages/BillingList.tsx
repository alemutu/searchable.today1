import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, FileText, AlertTriangle, Plus, ArrowLeft, Clock, FileImage, ChevronDown, Layers, XCircle, CheckCircle, CreditCard, Building2, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';

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
  assigned_to?: string;
  last_updated?: string;
}

const BillingList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital, user } = useAuthStore();
  const { addNotification, hasNotifiedAbout, markAsNotified } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'processing'>('pending');
  const [assignedToMe, setAssignedToMe] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [hospital]);

  const fetchBills = async () => {
    if (!hospital?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name)
        `)
        .eq('hospital_id', hospital.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBills(data || []);
      
      // Show notification for urgent bills
      const urgentBills = data?.filter(bill => 
        bill.payment_status === 'pending' && 
        bill.services.some((service: any) => service.name.includes('Emergency'))
      ) || [];
      
      urgentBills.forEach(bill => {
        // Create a unique key for this emergency
        const emergencyKey = `bill-${bill.id}-${bill.patient.id}`;
        
        // Only show notification if we haven't already notified about this emergency
        if (!hasNotifiedAbout(emergencyKey)) {
          addNotification({
            message: `Urgent: Process payment for ${bill.patient.first_name} ${bill.patient.last_name}`,
            type: 'warning',
            duration: 5000
          });
          
          // Mark this emergency as notified
          markAsNotified(emergencyKey);
        }
      });
    } catch (error) {
      console.error('Error fetching bills:', error);
      addNotification({
        message: 'Failed to load billing information',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
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
  
  const handleAssignToMe = async (billId: string) => {
    if (!user?.id) return;
    
    try {
      // Update the bill in the database
      const { error } = await supabase
        .from('billing')
        .update({
          assigned_to: user.id,
          last_updated: new Date().toISOString()
        })
        .eq('id', billId);

      if (error) throw error;
      
      // Refresh the data
      await fetchBills();
      
      // Show notification
      const bill = bills.find(b => b.id === billId);
      if (bill) {
        addNotification({
          message: `Bill for ${bill.patient.first_name} ${bill.patient.last_name} assigned to you`,
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error assigning bill:', error);
      addNotification({
        message: 'Failed to assign bill',
        type: 'error'
      });
    }
  };

  const handleReleaseAssignment = async (billId: string) => {
    try {
      // Update the bill in the database
      const { error } = await supabase
        .from('billing')
        .update({
          assigned_to: null,
          last_updated: new Date().toISOString()
        })
        .eq('id', billId);

      if (error) throw error;
      
      // Refresh the data
      await fetchBills();
      
      // Show notification
      const bill = bills.find(b => b.id === billId);
      if (bill) {
        addNotification({
          message: `Bill for ${bill.patient.first_name} ${bill.patient.last_name} released from your queue`,
          type: 'info',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error releasing bill assignment:', error);
      addNotification({
        message: 'Failed to release bill',
        type: 'error'
      });
    }
  };
  
  const handleProcessBill = async (billId: string) => {
    if (!user?.id) return;
    
    try {
      // Update the bill status to processing
      const { error } = await supabase
        .from('billing')
        .update({
          payment_status: 'processing',
          assigned_to: user.id,
          last_updated: new Date().toISOString()
        })
        .eq('id', billId);

      if (error) throw error;
      
      // Refresh the data
      await fetchBills();
      
      // Show notification
      const bill = bills.find(b => b.id === billId);
      if (bill) {
        addNotification({
          message: `Started processing bill for ${bill.patient.first_name} ${bill.patient.last_name}`,
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error processing bill:', error);
      addNotification({
        message: 'Failed to process bill',
        type: 'error'
      });
    }
  };

  const filteredBills = bills.filter(bill => {
    const patientName = `${bill.patient.first_name} ${bill.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || bill.payment_status === filterStatus;
    const matchesAssigned = !assignedToMe || bill.assigned_to === user?.id;
    
    if (activeTab === 'pending') {
      return (bill.payment_status === 'pending' || bill.payment_status === 'partial') && 
             matchesSearch && matchesFilter && matchesAssigned;
    } else {
      return bill.payment_status === 'processing' && matchesSearch && matchesFilter && matchesAssigned;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-100 text-success-800';
      case 'partial':
        return 'bg-warning-100 text-warning-800';
      case 'pending':
        return 'bg-error-100 text-error-800';
      case 'processing':
        return 'bg-primary-100 text-primary-800';
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
  
  // Count bills in each category
  const pendingCount = bills.filter(b => b.payment_status === 'pending' || b.payment_status === 'partial').length;
  const processingCount = bills.filter(b => b.payment_status === 'processing').length;
  const paidCount = bills.filter(b => b.payment_status === 'paid').length;
  const insuredCount = bills.filter(b => b.payment_status === 'insured').length;
  const assignedToMeCount = bills.filter(b => b.assigned_to === user?.id).length;

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
          <h1 className="text-xl font-bold text-gray-900">Billing</h1>
          <p className="text-xs text-gray-500">Payment Processing & Management</p>
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
          <DollarSign className="h-4 w-4 text-primary-500" />
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
            placeholder="Search bills..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input appearance-none pr-7 py-1.5 text-sm rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
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
        {/* Left Section - Bills List */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredBills.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No bills {activeTab === 'pending' ? 'pending' : 'processing'}</h3>
                <p className="text-xs text-gray-500">There are currently no bills in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <div key={bill.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {bill.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {bill.patient.first_name} {bill.patient.last_name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{getTimeAgo(bill.last_updated || bill.created_at)}</span>
                              <span className="mx-1.5">•</span>
                              <span>Bill #{bill.id.slice(0, 8)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(bill.payment_status)}`}>
                              {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                            </span>
                            
                            {bill.assigned_to && bill.assigned_to !== user?.id && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                Assigned
                              </span>
                            )}
                            
                            {activeTab === 'pending' ? (
                              <div className="flex space-x-1">
                                {!bill.assigned_to && (
                                  <button 
                                    onClick={() => handleAssignToMe(bill.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Assign to me"
                                  >
                                    Assign to me
                                  </button>
                                )}
                                
                                {bill.assigned_to === user?.id && (
                                  <>
                                    <Link 
                                      to={`/billing/${bill.id}`}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Process Payment <DollarSign className="h-3 w-3 ml-1" />
                                    </Link>
                                    <button 
                                      onClick={() => handleReleaseAssignment(bill.id)}
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
                                {bill.assigned_to === user?.id ? (
                                  <>
                                    <Link 
                                      to={`/billing/${bill.id}`}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Continue <DollarSign className="h-3 w-3 ml-1" />
                                    </Link>
                                    <button 
                                      onClick={() => handleReleaseAssignment(bill.id)}
                                      className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title="Release assignment"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignToMe(bill.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Take over this bill"
                                  >
                                    Take over
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="flex flex-wrap gap-2">
                            {bill.services.slice(0, 2).map((service, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                                <DollarSign className="h-3 w-3 mr-1 text-gray-500" />
                                {service.name} ({formatCurrency(service.amount)})
                              </span>
                            ))}
                            {bill.services.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                                +{bill.services.length - 2} more
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(bill.total_amount)}
                            </div>
                            {bill.paid_amount > 0 && bill.paid_amount < bill.total_amount && (
                              <div className="text-xs text-gray-500">
                                Paid: {formatCurrency(bill.paid_amount)}
                              </div>
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
          {/* My Work Queue */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Layers className="h-4 w-4 text-primary-500 mr-1.5" />
                <h2 className="text-sm font-medium text-gray-900">My Work Queue</h2>
              </div>
              <span className="text-xs text-gray-500">{bills.filter(b => b.assigned_to === user?.id).length} bills</span>
            </div>
            <div className="p-3">
              {bills.filter(b => b.assigned_to === user?.id).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No bills currently assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bills
                    .filter(b => b.assigned_to === user?.id)
                    .sort((a, b) => {
                      // Sort by status first
                      const statusOrder = { 
                        'pending': 0, 
                        'partial': 1, 
                        'processing': 2, 
                        'insured': 3, 
                        'paid': 4 
                      };
                      const aStatus = statusOrder[a.payment_status as keyof typeof statusOrder] || 5;
                      const bStatus = statusOrder[b.payment_status as keyof typeof statusOrder] || 5;
                      
                      return aStatus - bStatus;
                    })
                    .slice(0, 5)
                    .map(bill => (
                      <div key={bill.id} className="p-2 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {bill.payment_status === 'pending' ? (
                              <Clock className="h-3.5 w-3.5 text-warning-500" />
                            ) : bill.payment_status === 'partial' ? (
                              <DollarSign className="h-3.5 w-3.5 text-warning-500" />
                            ) : bill.payment_status === 'processing' ? (
                              <DollarSign className="h-3.5 w-3.5 text-primary-500" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {bill.patient.first_name} {bill.patient.last_name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {formatCurrency(bill.total_amount)}
                              {bill.paid_amount > 0 && bill.paid_amount < bill.total_amount && 
                                ` (${formatCurrency(bill.paid_amount)} paid)`}
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/billing/${bill.id}`}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Process
                        </Link>
                      </div>
                    ))}
                  
                  {bills.filter(b => b.assigned_to === user?.id).length > 5 && (
                    <div className="text-center pt-1">
                      <button className="text-xs text-primary-600 hover:text-primary-800">
                        View all ({bills.filter(b => b.assigned_to === user?.id).length})
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
              <h2 className="text-sm font-medium text-gray-900">Billing Overview</h2>
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
                  <DollarSign className="h-4 w-4 text-primary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Processing</span>
                </div>
                <span className="font-medium text-sm">{processingCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Paid</span>
                </div>
                <span className="font-medium text-sm">{paidCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-secondary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Insured</span>
                </div>
                <span className="font-medium text-sm">{insuredCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Today's Revenue</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Collected</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(bills.filter(b => 
                    new Date(b.created_at).toDateString() === new Date().toDateString() && 
                    b.paid_amount > 0
                  ).reduce((sum, bill) => sum + bill.paid_amount, 0))}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(bills.filter(b => 
                    new Date(b.created_at).toDateString() === new Date().toDateString() && 
                    (b.payment_status === 'pending' || b.payment_status === 'partial')
                  ).reduce((sum, bill) => sum + (bill.total_amount - bill.paid_amount), 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Payment Methods</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-success-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Cash</span>
                </div>
                <span className="text-xs text-gray-500">Available</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-primary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Credit Card</span>
                </div>
                <span className="text-xs text-gray-500">Available</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 text-secondary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Insurance</span>
                </div>
                <span className="text-xs text-gray-500">Available</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 text-accent-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Mobile Payment</span>
                </div>
                <span className="text-xs text-gray-500">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingList;