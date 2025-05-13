import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { Search, Filter, Microscope, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, FileImage, ChevronDown, ArrowRight, Loader2, MoreHorizontal, Layers, Scan } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface RadiologyResult {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  scan_type: string;
  scan_date: string;
  status: string;
  results: any;
  reviewed_by: {
    first_name: string;
    last_name: string;
  } | null;
  is_emergency: boolean;
  workflow_stage?: 'pending' | 'in_progress' | 'completed';
  scan_info?: {
    scan_id: string;
    scan_time: string;
    equipment_used: string;
  };
  assigned_to?: string;
  last_updated?: string;
}

const Radiology: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [radiologyResults, setRadiologyResults] = useState<RadiologyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress'>('pending');
  const navigate = useNavigate();
  const [assignedToMe, setAssignedToMe] = useState(false);

  useEffect(() => {
    fetchRadiologyResults();
  }, [hospital]);

  const fetchRadiologyResults = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockResults = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          patient: {
            id: '00000000-0000-0000-0000-000000000001',
            first_name: 'John',
            last_name: 'Doe'
          },
          scan_type: 'x_ray',
          scan_date: '2025-05-15',
          status: 'pending',
          results: null,
          reviewed_by: null,
          is_emergency: false,
          workflow_stage: 'pending',
          last_updated: '2025-05-15T09:15:00Z'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          patient: {
            id: '00000000-0000-0000-0000-000000000002',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          scan_type: 'ct_scan',
          scan_date: '2025-05-15',
          status: 'in_progress',
          results: null,
          reviewed_by: null,
          is_emergency: true,
          workflow_stage: 'in_progress',
          scan_info: {
            scan_id: 'RAD-20250515-1234',
            scan_time: '2025-05-15T10:30:00Z',
            equipment_used: 'ct_scanner'
          },
          assigned_to: user?.id,
          last_updated: '2025-05-15T10:35:00Z'
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          patient: {
            id: '00000000-0000-0000-0000-000000000003',
            first_name: 'Robert',
            last_name: 'Johnson'
          },
          scan_type: 'mri',
          scan_date: '2025-05-14',
          status: 'pending',
          results: null,
          reviewed_by: null,
          is_emergency: false,
          workflow_stage: 'pending',
          assigned_to: '00000000-0000-0000-0000-000000000010', // Another technician
          last_updated: '2025-05-14T15:00:00Z'
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          patient: {
            id: '00000000-0000-0000-0000-000000000004',
            first_name: 'Emily',
            last_name: 'Williams'
          },
          scan_type: 'ultrasound',
          scan_date: '2025-05-14',
          status: 'in_progress',
          results: null,
          reviewed_by: null,
          is_emergency: false,
          workflow_stage: 'in_progress',
          scan_info: {
            scan_id: 'RAD-20250514-5678',
            scan_time: '2025-05-14T15:45:00Z',
            equipment_used: 'ultrasound_machine'
          },
          assigned_to: user?.id,
          last_updated: '2025-05-14T16:00:00Z'
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          patient: {
            id: '00000000-0000-0000-0000-000000000005',
            first_name: 'Michael',
            last_name: 'Brown'
          },
          scan_type: 'mammogram',
          scan_date: '2025-05-15',
          status: 'completed',
          results: { findings: 'Normal study' },
          reviewed_by: {
            first_name: 'Doctor',
            last_name: 'Smith'
          },
          is_emergency: false,
          workflow_stage: 'completed',
          scan_info: {
            scan_id: 'RAD-20250515-9012',
            scan_time: '2025-05-15T09:15:00Z',
            equipment_used: 'mammography_unit'
          },
          assigned_to: user?.id,
          last_updated: '2025-05-15T10:15:00Z'
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          patient: {
            id: '00000000-0000-0000-0000-000000000006',
            first_name: 'Sarah',
            last_name: 'Davis'
          },
          scan_type: 'x_ray',
          scan_date: '2025-05-15',
          status: 'pending',
          results: null,
          reviewed_by: null,
          is_emergency: true,
          workflow_stage: 'pending',
          last_updated: '2025-05-15T11:00:00Z'
        }
      ];
      
      setRadiologyResults(mockResults);
      
      // Show notification for emergency cases
      const emergencyCases = mockResults.filter(result => result.is_emergency && (result.status === 'pending' || result.status === 'in_progress'));
      if (emergencyCases.length > 0) {
        emergencyCases.forEach(emergency => {
          addNotification({
            message: `EMERGENCY: ${getScanTypeLabel(emergency.scan_type)} needed for ${emergency.patient.first_name} ${emergency.patient.last_name}`,
            type: 'error',
            duration: 5000
          });
        });
      }
    } catch (error) {
      console.error('Error fetching radiology results:', error);
      addNotification({
        message: 'Failed to load radiology data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'in_progress':
        return 'bg-primary-100 text-primary-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScanTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'x_ray': 'X-Ray',
      'ct_scan': 'CT Scan',
      'mri': 'MRI',
      'ultrasound': 'Ultrasound',
      'mammogram': 'Mammogram',
      'pet_scan': 'PET Scan',
      'dexa_scan': 'DEXA Scan',
      'fluoroscopy': 'Fluoroscopy'
    };
    return types[type] || type;
  };

  const getEquipmentLabel = (equipment?: string) => {
    if (!equipment) return '';
    
    const types: Record<string, string> = {
      'x_ray_machine': 'X-Ray Machine',
      'ct_scanner': 'CT Scanner',
      'mri_scanner': 'MRI Scanner',
      'ultrasound_machine': 'Ultrasound Machine',
      'mammography_unit': 'Mammography Unit',
      'pet_scanner': 'PET Scanner',
      'dexa_scanner': 'DEXA Scanner',
      'fluoroscopy_unit': 'Fluoroscopy Unit'
    };
    return types[equipment] || equipment;
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

  const filteredResults = radiologyResults.filter(result => {
    const patientName = `${result.patient.first_name} ${result.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         result.scan_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    const matchesAssigned = !assignedToMe || result.assigned_to === user?.id;
    
    if (activeTab === 'pending') {
      return result.workflow_stage === 'pending' && matchesSearch && matchesFilter && matchesAssigned;
    } else {
      return result.workflow_stage === 'in_progress' && matchesSearch && matchesFilter && matchesAssigned;
    }
  });

  // Count scans in each category
  const pendingCount = radiologyResults.filter(r => r.workflow_stage === 'pending').length;
  const inProgressCount = radiologyResults.filter(r => r.workflow_stage === 'in_progress').length;
  const completedCount = radiologyResults.filter(r => r.workflow_stage === 'completed').length;
  const urgentCount = radiologyResults.filter(r => r.is_emergency).length;
  const assignedToMeCount = radiologyResults.filter(r => r.assigned_to === user?.id).length;

  const handleStartScan = async (scanId: string) => {
    // Update the scan status to in_progress
    const updatedResults = radiologyResults.map(result => {
      if (result.id === scanId) {
        return {
          ...result,
          status: 'in_progress',
          workflow_stage: 'in_progress',
          assigned_to: user?.id,
          scan_info: {
            scan_id: `RAD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
            scan_time: new Date().toISOString(),
            equipment_used: result.scan_type === 'x_ray' ? 'x_ray_machine' : 
                           result.scan_type === 'ct_scan' ? 'ct_scanner' :
                           result.scan_type === 'mri' ? 'mri_scanner' :
                           result.scan_type === 'ultrasound' ? 'ultrasound_machine' :
                           result.scan_type === 'mammogram' ? 'mammography_unit' :
                           result.scan_type === 'pet_scan' ? 'pet_scanner' :
                           result.scan_type === 'dexa_scan' ? 'dexa_scanner' :
                           'fluoroscopy_unit'
          },
          last_updated: new Date().toISOString()
        };
      }
      return result;
    });
    
    setRadiologyResults(updatedResults);
    
    // Show notification
    addNotification({
      message: `Scan started for ${updatedResults.find(r => r.id === scanId)?.patient.first_name} ${updatedResults.find(r => r.id === scanId)?.patient.last_name}`,
      type: 'success',
      duration: 3000
    });
    
    // Navigate to the scan processing form
    navigate(`/radiology/process/${scanId}`);
  };

  const handleProcessScan = (scanId: string) => {
    navigate(`/radiology/process/${scanId}`);
  };

  const handleAssignToMe = (scanId: string) => {
    // Update the scan to assign it to the current user
    const updatedResults = radiologyResults.map(result => {
      if (result.id === scanId) {
        return {
          ...result,
          assigned_to: user?.id,
          last_updated: new Date().toISOString()
        };
      }
      return result;
    });
    
    setRadiologyResults(updatedResults);
    
    // Show notification
    addNotification({
      message: `Scan assigned to you`,
      type: 'success',
      duration: 3000
    });
  };

  const handleReleaseAssignment = (scanId: string) => {
    // Update the scan to unassign it
    const updatedResults = radiologyResults.map(result => {
      if (result.id === scanId) {
        return {
          ...result,
          assigned_to: null,
          last_updated: new Date().toISOString()
        };
      }
      return result;
    });
    
    setRadiologyResults(updatedResults);
    
    // Show notification
    addNotification({
      message: `Scan released from your queue`,
      type: 'info',
      duration: 3000
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-secondary-600 to-secondary-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Microscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Radiology</h1>
                <p className="text-secondary-100 text-xs">Imaging & Scan Management</p>
              </div>
            </div>
            <Link to="/radiology/new-scan" className="btn bg-white text-secondary-600 hover:bg-white/90 shadow-sm flex items-center py-1.5 px-3 text-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Scan
            </Link>
          </div>
        </div>
        
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-full bg-warning-100">
                <Clock className="h-4 w-4 text-warning-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">In Progress</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{inProgressCount}</p>
              </div>
              <div className="p-2 rounded-full bg-secondary-100">
                <Microscope className="h-4 w-4 text-secondary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{completedCount}</p>
              </div>
              <div className="p-2 rounded-full bg-success-100">
                <CheckCircle className="h-4 w-4 text-success-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Urgent</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{urgentCount}</p>
              </div>
              <div className="p-2 rounded-full bg-error-100">
                <AlertTriangle className="h-4 w-4 text-error-600" />
              </div>
            </div>
          </div>
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
            activeTab === 'in_progress' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('in_progress')}
        >
          <Microscope className="h-4 w-4 text-secondary-500" />
          <span className="font-medium text-sm">In Progress</span>
          <span className="ml-auto bg-secondary-100 text-secondary-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {inProgressCount}
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
            placeholder="Search scans..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input appearance-none pr-7 py-1.5 text-sm rounded-lg"
          >
            <option value="all">All Priority</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="assignedToMe"
            checked={assignedToMe}
            onChange={(e) => setAssignedToMe(e.target.checked)}
            className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
          />
          <label htmlFor="assignedToMe" className="ml-2 text-xs text-gray-700">
            Assigned to me ({assignedToMeCount})
          </label>
        </div>
      </div>

      <div className="flex space-x-3">
        {/* Left Section - Scan Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Microscope className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No scans {activeTab === 'pending' ? 'pending' : 'in progress'}</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {activeTab === 'pending' 
                    ? "There are currently no pending scans. New scans will appear here when ordered by physicians."
                    : "There are currently no scans in progress. Start processing scans from the pending queue."}
                </p>
              </div>
            ) : (
              <div>
                {filteredResults.map((result, index) => (
                  <div key={result.id} className={`p-4 ${index !== filteredResults.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 transition-colors ${result.is_emergency ? 'bg-error-50/50' : ''}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-medium text-sm">
                        {result.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {result.patient.first_name} {result.patient.last_name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{getTimeAgo(result.last_updated || result.scan_date)}</span>
                              
                              {result.scan_info && (
                                <>
                                  <span className="mx-1.5">•</span>
                                  <span className="text-secondary-600 font-medium">{result.scan_info.scan_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.is_emergency && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-error-100 text-error-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                URGENT
                              </span>
                            )}
                            
                            {result.assigned_to && result.assigned_to !== user?.id && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                Assigned
                              </span>
                            )}
                            
                            {activeTab === 'pending' ? (
                              <div className="flex space-x-1">
                                {!result.assigned_to && (
                                  <button 
                                    onClick={() => handleAssignToMe(result.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Assign to me"
                                  >
                                    Assign to me
                                  </button>
                                )}
                                
                                {result.assigned_to === user?.id && (
                                  <>
                                    <button 
                                      onClick={() => handleStartScan(result.id)}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Start Scan <Scan className="h-3 w-3 ml-1.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleReleaseAssignment(result.id)}
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
                                {result.assigned_to === user?.id ? (
                                  <>
                                    <button 
                                      onClick={() => handleProcessScan(result.id)}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Continue Scan <ArrowRight className="h-3 w-3 ml-1.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleReleaseAssignment(result.id)}
                                      className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title="Release assignment"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignToMe(result.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Take over this scan"
                                  >
                                    Take over
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                            <FileImage className="h-3 w-3 mr-1 text-secondary-500" />
                            {getScanTypeLabel(result.scan_type)}
                          </span>
                          
                          {result.scan_info?.equipment_used && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                              {getEquipmentLabel(result.scan_info.equipment_used)}
                            </span>
                          )}
                          
                          {result.workflow_stage === 'in_progress' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-100 text-xs font-medium text-secondary-800">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              In Progress
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Layers className="h-4 w-4 text-secondary-500 mr-1.5" />
                <h2 className="text-sm font-medium text-gray-900">My Work Queue</h2>
              </div>
              <span className="text-xs text-gray-500">{radiologyResults.filter(r => r.assigned_to === user?.id).length} scans</span>
            </div>
            <div className="p-3">
              {radiologyResults.filter(r => r.assigned_to === user?.id).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No scans currently assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {radiologyResults
                    .filter(r => r.assigned_to === user?.id)
                    .sort((a, b) => {
                      // Sort by emergency first, then by workflow stage
                      if (a.is_emergency && !b.is_emergency) return -1;
                      if (!a.is_emergency && b.is_emergency) return 1;
                      
                      // Then sort by workflow stage
                      const stageOrder = {
                        'pending': 0,
                        'in_progress': 1,
                        'completed': 2
                      };
                      
                      return (stageOrder[a.workflow_stage || 'pending'] || 0) - (stageOrder[b.workflow_stage || 'pending'] || 0);
                    })
                    .slice(0, 5)
                    .map(scan => (
                      <div key={scan.id} className={`p-2 rounded-lg border ${scan.is_emergency ? 'border-error-200 bg-error-50' : 'border-gray-200'} flex items-center justify-between`}>
                        <div className="flex items-center">
                          <div className="mr-2">
                            {scan.workflow_stage === 'pending' ? (
                              <Clock className="h-3.5 w-3.5 text-warning-500" />
                            ) : scan.workflow_stage === 'in_progress' ? (
                              <Scan className="h-3.5 w-3.5 text-secondary-500" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {scan.patient.first_name} {scan.patient.last_name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {getScanTypeLabel(scan.scan_type)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => scan.workflow_stage === 'pending' ? handleStartScan(scan.id) : handleProcessScan(scan.id)}
                          className="text-xs text-secondary-600 hover:text-secondary-800 font-medium"
                        >
                          Continue
                        </button>
                      </div>
                    ))}
                  
                  {radiologyResults.filter(r => r.assigned_to === user?.id).length > 5 && (
                    <div className="text-center pt-1">
                      <button className="text-xs text-secondary-600 hover:text-secondary-800">
                        View all ({radiologyResults.filter(r => r.assigned_to === user?.id).length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              <Link to="/radiology/new-scan" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <Plus className="h-4 w-4 text-secondary-500 mr-1.5" />
                <span className="text-xs text-gray-700">New Scan</span>
              </Link>
              <Link to="/patients" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <FileText className="h-4 w-4 text-secondary-500 mr-1.5" />
                <span className="text-xs text-gray-700">View Records</span>
              </Link>
              <Link to="/reception" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <User className="h-4 w-4 text-secondary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Reception</span>
              </Link>
              <Link to="/appointments" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <Calendar className="h-4 w-4 text-secondary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Appointments</span>
              </Link>
            </div>
          </div>

          {/* Reference Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <FileImage className="h-4 w-4 text-secondary-500 mr-1.5" />
                <h2 className="text-sm font-medium text-gray-900">Scan Reference</h2>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-3">
              <h3 className="text-xs font-medium text-gray-700 mb-2">Common Scans</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">X-Ray</span>
                  <span className="text-xs text-gray-600">Chest, Bone, Abdomen</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">CT Scan</span>
                  <span className="text-xs text-gray-600">Head, Chest, Abdomen</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">MRI</span>
                  <span className="text-xs text-gray-600">Brain, Spine, Joints</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">Ultrasound</span>
                  <span className="text-xs text-gray-600">Abdomen, Pelvis, Cardiac</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Workflow Stages Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Workflow Stages</h2>
            </div>
            <div className="p-3">
              <div className="space-y-2">
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-warning-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-warning-700">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Scan Setup</p>
                    <p className="text-xs text-gray-500">Prepare equipment and patient</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-secondary-700">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Processing</p>
                    <p className="text-xs text-gray-500">Analyze images and document findings</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-success-700">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Complete</p>
                    <p className="text-xs text-gray-500">Results sent to requesting physician</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Radiology;