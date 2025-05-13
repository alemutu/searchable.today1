import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { Search, Filter, Microscope, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, FileImage, ChevronDown } from 'lucide-react';
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
}

const Radiology: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [radiologyResults, setRadiologyResults] = useState<RadiologyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress'>('pending');
  const navigate = useNavigate();

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
          is_emergency: false
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
          is_emergency: true
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
          is_emergency: false
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
          is_emergency: false
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
          is_emergency: false
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

  const filteredResults = radiologyResults.filter(result => {
    const patientName = `${result.patient.first_name} ${result.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         result.scan_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    
    if (activeTab === 'pending') {
      return result.status === 'pending' && matchesSearch && matchesFilter;
    } else {
      return result.status === 'in_progress' && matchesSearch && matchesFilter;
    }
  });

  // Count scans in each category
  const pendingCount = radiologyResults.filter(r => r.status === 'pending').length;
  const inProgressCount = radiologyResults.filter(r => r.status === 'in_progress').length;
  const completedCount = radiologyResults.filter(r => r.status === 'completed').length;
  const urgentCount = radiologyResults.filter(r => r.is_emergency).length;

  const handleProcessScan = (scanId: string) => {
    navigate(`/radiology/process/${scanId}`);
  };

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
          <h1 className="text-xl font-bold text-gray-900">Radiology</h1>
          <p className="text-xs text-gray-500">Imaging & Scan Management</p>
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
            activeTab === 'in_progress' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('in_progress')}
        >
          <Microscope className="h-4 w-4 text-primary-500" />
          <span className="font-medium text-sm">In Progress</span>
          <span className="ml-auto bg-primary-100 text-primary-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
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
            className="form-input pl-7 py-1.5 text-sm w-full"
            placeholder="Search scans..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input appearance-none pr-7 py-1.5 text-sm"
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
      </div>

      <div className="flex space-x-3">
        {/* Left Section - Scan Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Microscope className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No scans {activeTab === 'pending' ? 'pending' : 'in progress'}</h3>
                <p className="text-xs text-gray-500">There are currently no scans in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <div key={result.id} className={`p-3 hover:bg-gray-50 ${result.is_emergency ? 'bg-error-50' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {result.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {result.patient.first_name} {result.patient.last_name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{new Date(result.scan_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.is_emergency && (
                              <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-error-100 text-error-800">
                                Emergency
                              </span>
                            )}
                            <button 
                              onClick={() => handleProcessScan(result.id)}
                              className="btn btn-primary inline-flex items-center text-xs py-1 px-2"
                            >
                              Process Scan <Microscope className="h-3 w-3 ml-1" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-xs font-medium">Scan: </span>
                          <span className="text-xs">{getScanTypeLabel(result.scan_type)}</span>
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
              <h2 className="text-base font-medium text-gray-900">Radiology Overview</h2>
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
                  <Microscope className="h-4 w-4 text-primary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">In Progress</span>
                </div>
                <span className="font-medium text-sm">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
                <span className="font-medium text-sm">{completedCount}</span>
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
              <Link to="/radiology/new-scan" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Plus className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">New Scan</span>
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
                <FileImage className="h-4 w-4 text-primary-500 mr-1.5" />
                Scan Reference
              </h2>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-1">Common Scans</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-gray-600">X-Ray</div>
                  <div className="text-right">Chest, Bone, Abdomen</div>
                  <div className="text-gray-600">CT Scan</div>
                  <div className="text-right">Head, Chest, Abdomen</div>
                  <div className="text-gray-600">MRI</div>
                  <div className="text-right">Brain, Spine, Joints</div>
                  <div className="text-gray-600">Ultrasound</div>
                  <div className="text-right">Abdomen, Pelvis, Cardiac</div>
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