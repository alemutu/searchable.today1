import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { Search, Filter, FlaskRound as Flask, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, FileImage, ChevronDown, Beaker, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface LabResult {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  reviewed_by: {
    first_name: string;
    last_name: string;
  } | null;
  is_emergency: boolean;
  workflow_stage?: 'pending' | 'sample_collected' | 'testing' | 'review' | 'completed';
  sample_info?: {
    sample_id: string;
    sample_type: string;
    collection_time: string;
  };
}

const Laboratory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLabResults();
  }, [hospital]);

  const fetchLabResults = async () => {
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
          test_type: 'complete_blood_count',
          test_date: '2025-05-15',
          status: 'pending',
          results: null,
          reviewed_by: null,
          is_emergency: false,
          workflow_stage: 'pending'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          patient: {
            id: '00000000-0000-0000-0000-000000000002',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          test_type: 'liver_function',
          test_date: '2025-05-15',
          status: 'in_progress',
          results: null,
          reviewed_by: null,
          is_emergency: true,
          workflow_stage: 'sample_collected',
          sample_info: {
            sample_id: 'LAB-20250515-1234',
            sample_type: 'blood',
            collection_time: '2025-05-15T10:30:00Z'
          }
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          patient: {
            id: '00000000-0000-0000-0000-000000000003',
            first_name: 'Robert',
            last_name: 'Johnson'
          },
          test_type: 'kidney_function',
          test_date: '2025-05-14',
          status: 'in_progress',
          results: null,
          reviewed_by: null,
          is_emergency: false,
          workflow_stage: 'testing',
          sample_info: {
            sample_id: 'LAB-20250514-5678',
            sample_type: 'blood',
            collection_time: '2025-05-14T14:45:00Z'
          }
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          patient: {
            id: '00000000-0000-0000-0000-000000000004',
            first_name: 'Emily',
            last_name: 'Williams'
          },
          test_type: 'lipid_profile',
          test_date: '2025-05-14',
          status: 'in_progress',
          results: null,
          reviewed_by: null,
          is_emergency: false,
          workflow_stage: 'review',
          sample_info: {
            sample_id: 'LAB-20250514-9012',
            sample_type: 'blood',
            collection_time: '2025-05-14T16:15:00Z'
          }
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          patient: {
            id: '00000000-0000-0000-0000-000000000005',
            first_name: 'Michael',
            last_name: 'Brown'
          },
          test_type: 'blood_glucose',
          test_date: '2025-05-15',
          status: 'completed',
          results: { findings: 'Normal study' },
          reviewed_by: {
            first_name: 'Doctor',
            last_name: 'Smith'
          },
          is_emergency: false,
          workflow_stage: 'completed',
          sample_info: {
            sample_id: 'LAB-20250515-3456',
            sample_type: 'blood',
            collection_time: '2025-05-15T09:00:00Z'
          }
        }
      ];
      
      setLabResults(mockResults);
      
      // Show notification for emergency cases
      const emergencyCases = mockResults.filter(result => result.is_emergency && (result.status === 'pending' || result.status === 'in_progress'));
      if (emergencyCases.length > 0) {
        emergencyCases.forEach(emergency => {
          addNotification({
            message: `EMERGENCY: ${getTestTypeLabel(emergency.test_type)} needed for ${emergency.patient.first_name} ${emergency.patient.last_name}`,
            type: 'warning',
            duration: 5000
          });
        });
      }
    } catch (error) {
      console.error('Error fetching laboratory results:', error);
      addNotification({
        message: 'Failed to load laboratory data',
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

  const getWorkflowStageLabel = (stage?: string) => {
    switch (stage) {
      case 'pending':
        return 'Awaiting Sample';
      case 'sample_collected':
        return 'Sample Collected';
      case 'testing':
        return 'Testing In Progress';
      case 'review':
        return 'Awaiting Review';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getTestTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'complete_blood_count': 'Complete Blood Count (CBC)',
      'liver_function': 'Liver Function Test (LFT)',
      'kidney_function': 'Kidney Function Test',
      'lipid_profile': 'Lipid Profile',
      'blood_glucose': 'Blood Glucose',
      'urinalysis': 'Urinalysis',
      'thyroid_function': 'Thyroid Function Test',
      'electrolytes': 'Electrolytes Panel',
      'hba1c': 'HbA1c',
      'coagulation_profile': 'Coagulation Profile'
    };
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredResults = labResults.filter(result => {
    const patientName = `${result.patient.first_name} ${result.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         result.test_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    
    if (activeTab === 'pending') {
      return result.status === 'pending' && matchesSearch && matchesFilter;
    } else {
      return result.status === 'in_progress' && matchesSearch && matchesFilter;
    }
  });

  // Count tests in each category
  const pendingCount = labResults.filter(r => r.status === 'pending').length;
  const inProgressCount = labResults.filter(r => r.status === 'in_progress').length;
  const completedCount = labResults.filter(r => r.status === 'completed').length;
  const urgentCount = labResults.filter(r => r.is_emergency).length;

  const handleStartTest = (testId: string) => {
    // Update the test status to in_progress
    const updatedResults = labResults.map(result => {
      if (result.id === testId) {
        return {
          ...result,
          status: 'in_progress',
          workflow_stage: 'sample_collected'
        };
      }
      return result;
    });
    
    setLabResults(updatedResults);
    
    // Navigate to the test processing form
    navigate(`/laboratory/process/${testId}`);
  };

  const handleProcessTest = (testId: string) => {
    navigate(`/laboratory/process/${testId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Flask className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Laboratory</h1>
                <p className="text-primary-100 text-sm">Test Management & Results</p>
              </div>
            </div>
            <Link to="/laboratory/new-test" className="btn bg-white text-primary-600 hover:bg-white/90 shadow-sm flex items-center">
              <Plus className="h-4 w-4 mr-1.5" />
              New Test
            </Link>
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-full bg-warning-100">
                <Clock className="h-5 w-5 text-warning-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">In Progress</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{inProgressCount}</p>
              </div>
              <div className="p-2 rounded-full bg-primary-100">
                <Flask className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{completedCount}</p>
              </div>
              <div className="p-2 rounded-full bg-success-100">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Urgent</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{urgentCount}</p>
              </div>
              <div className="p-2 rounded-full bg-error-100">
                <AlertTriangle className="h-5 w-5 text-error-600" />
              </div>
            </div>
          </div>
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
          <Flask className="h-4 w-4 text-primary-500" />
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
            className="form-input pl-7 py-1.5 text-sm w-full rounded-lg"
            placeholder="Search tests..."
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
      </div>

      <div className="flex space-x-3">
        {/* Left Section - Test Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Flask className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No tests {activeTab === 'pending' ? 'pending' : 'in progress'}</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">There are currently no tests in this category. New tests will appear here when ordered by physicians.</p>
              </div>
            ) : (
              <div>
                {filteredResults.map((result, index) => (
                  <div key={result.id} className={`p-4 ${index !== filteredResults.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 transition-colors ${result.is_emergency ? 'bg-error-50/50' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {result.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {result.patient.first_name} {result.patient.last_name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{new Date(result.test_date).toLocaleDateString()}</span>
                              {result.workflow_stage && result.workflow_stage !== 'pending' && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{getWorkflowStageLabel(result.workflow_stage)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.is_emergency && (
                              <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-error-100 text-error-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                EMERGENCY
                              </span>
                            )}
                            {activeTab === 'pending' ? (
                              <button 
                                onClick={() => handleStartTest(result.id)}
                                className="btn btn-primary inline-flex items-center text-xs py-1.5 px-3 rounded-lg"
                              >
                                Start Test <Beaker className="h-3 w-3 ml-1.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleProcessTest(result.id)}
                                className="btn btn-primary inline-flex items-center text-xs py-1.5 px-3 rounded-lg"
                              >
                                {result.workflow_stage === 'sample_collected' ? 'Enter Results' : 
                                 result.workflow_stage === 'testing' ? 'Continue Testing' : 
                                 result.workflow_stage === 'review' ? 'Review Results' : 'Process Test'}
                                <ArrowRight className="h-3 w-3 ml-1.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center">
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                            {getTestTypeLabel(result.test_type)}
                          </span>
                          {result.sample_info && (
                            <span className="ml-2 text-xs text-gray-500">
                              Sample ID: {result.sample_info.sample_id}
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
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <Link to="/laboratory/new-test" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors">
                <Plus className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">New Test</span>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Flask className="h-4 w-4 text-primary-500 mr-1.5" />
                <h2 className="text-base font-medium text-gray-900">Test Reference</h2>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-700 mb-2">Common Tests</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">CBC</span>
                  <span className="text-xs text-gray-600">Complete Blood Count</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">LFT</span>
                  <span className="text-xs text-gray-600">Liver Function Test</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">RFT</span>
                  <span className="text-xs text-gray-600">Renal Function Test</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">HbA1c</span>
                  <span className="text-xs text-gray-600">Glycated Hemoglobin</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Workflow Stages Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Workflow Stages</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-6 h-6 rounded-full bg-warning-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-warning-700">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Sample Collection</p>
                    <p className="text-xs text-gray-500">Collect and label patient sample</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-primary-700">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Testing</p>
                    <p className="text-xs text-gray-500">Analyze sample and record results</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-secondary-700">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Review</p>
                    <p className="text-xs text-gray-500">Senior technician verifies results</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-success-700">4</span>
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

export default Laboratory;