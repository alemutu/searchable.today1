import React, { useState, useEffect } from 'react';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../lib/store';
import { Search, Filter, FlaskRound as Flask, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, FileImage, ChevronDown, Beaker, ArrowRight, Loader2, MoreHorizontal, Layers } from 'lucide-react';
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
    container_type?: string;
  };
  assigned_to?: string;
  last_updated?: string;
}

const Laboratory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'review'>('pending');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const { addNotification } = useNotificationStore();
  
  const { 
    data: labResults, 
    loading: isLoading, 
    error, 
    saveItem, 
    fetchItems 
  } = useHybridStorage<LabResult>('lab_results');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const getWorkflowStageIcon = (stage?: string) => {
    switch (stage) {
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-warning-500" />;
      case 'sample_collected':
        return <Flask className="h-3.5 w-3.5 text-primary-500" />;
      case 'testing':
        return <Beaker className="h-3.5 w-3.5 text-primary-500" />;
      case 'review':
        return <FileText className="h-3.5 w-3.5 text-secondary-500" />;
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-success-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-400" />;
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

  const getSampleTypeLabel = (type?: string) => {
    if (!type) return '';
    
    const types: Record<string, string> = {
      'blood': 'Blood',
      'urine': 'Urine',
      'stool': 'Stool',
      'csf': 'Cerebrospinal Fluid',
      'sputum': 'Sputum',
      'swab': 'Swab',
      'tissue': 'Tissue',
      'fluid': 'Body Fluid'
    };
    return types[type] || type;
  };

  const getContainerTypeLabel = (type?: string) => {
    if (!type) return '';
    
    const types: Record<string, string> = {
      'red_top_tube': 'Red Top Tube',
      'green_top_tube': 'Green Top Tube (Heparin)',
      'purple_top_tube': 'Purple Top Tube (EDTA)',
      'blue_top_tube': 'Blue Top Tube (Citrate)',
      'gray_top_tube': 'Gray Top Tube (Fluoride)',
      'yellow_top_tube': 'Yellow Top Tube (ACD)',
      'urine_container': 'Urine Container',
      'stool_container': 'Stool Container',
      'swab_tube': 'Swab Tube',
      'slide': 'Microscope Slide'
    };
    return types[type] || type;
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

  const filteredResults = Array.isArray(labResults) ? labResults.filter(result => {
    const patientName = `${result.patient.first_name} ${result.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         result.test_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    const matchesAssigned = !assignedToMe || result.assigned_to === 'current_user'; // Replace with actual user ID
    
    if (activeTab === 'pending') {
      return result.workflow_stage === 'pending' && matchesSearch && matchesFilter && matchesAssigned;
    } else if (activeTab === 'in_progress') {
      return (result.workflow_stage === 'sample_collected' || result.workflow_stage === 'testing') && 
             matchesSearch && matchesFilter && matchesAssigned;
    } else {
      return result.workflow_stage === 'review' && matchesSearch && matchesFilter && matchesAssigned;
    }
  }) : [];

  // Count tests in each category
  const pendingCount = Array.isArray(labResults) ? labResults.filter(r => r.workflow_stage === 'pending').length : 0;
  const inProgressCount = Array.isArray(labResults) ? labResults.filter(r => r.workflow_stage === 'sample_collected' || r.workflow_stage === 'testing').length : 0;
  const reviewCount = Array.isArray(labResults) ? labResults.filter(r => r.workflow_stage === 'review').length : 0;
  const completedCount = Array.isArray(labResults) ? labResults.filter(r => r.workflow_stage === 'completed').length : 0;
  const urgentCount = Array.isArray(labResults) ? labResults.filter(r => r.is_emergency).length : 0;
  const assignedToMeCount = Array.isArray(labResults) ? labResults.filter(r => r.assigned_to === 'current_user').length : 0; // Replace with actual user ID

  const handleStartTest = async (testId: string) => {
    if (!Array.isArray(labResults)) return;
    
    const test = labResults.find(r => r.id === testId);
    if (!test) return;
    
    try {
      // Create a sample ID
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(1000 + Math.random() * 9000);
      const sampleId = `LAB-${year}${month}${day}-${random}`;
      
      // Update the test
      const updatedTest: LabResult = {
        ...test,
        status: 'in_progress',
        workflow_stage: 'sample_collected',
        assigned_to: 'current_user', // Replace with actual user ID
        sample_info: {
          sample_id: sampleId,
          sample_type: test.test_type === 'urinalysis' ? 'urine' : 'blood',
          collection_time: new Date().toISOString(),
          container_type: test.test_type === 'urinalysis' ? 'urine_container' : 
                         test.test_type === 'complete_blood_count' ? 'purple_top_tube' :
                         test.test_type === 'blood_glucose' ? 'gray_top_tube' : 'red_top_tube'
        },
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedTest, testId);
      
      // Show notification
      addNotification({
        message: `Sample collection started for ${test.patient.first_name} ${test.patient.last_name}`,
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error starting test:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleProcessTest = (testId: string) => {
    navigate(`/laboratory/process/${testId}`);
  };

  const handleAssignToMe = async (testId: string) => {
    if (!Array.isArray(labResults)) return;
    
    const test = labResults.find(r => r.id === testId);
    if (!test) return;
    
    try {
      // Update the test
      const updatedTest: LabResult = {
        ...test,
        assigned_to: 'current_user', // Replace with actual user ID
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedTest, testId);
      
      // Show notification
      addNotification({
        message: `Test assigned to you`,
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error assigning test:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleReleaseAssignment = async (testId: string) => {
    if (!Array.isArray(labResults)) return;
    
    const test = labResults.find(r => r.id === testId);
    if (!test) return;
    
    try {
      // Update the test
      const updatedTest: LabResult = {
        ...test,
        assigned_to: undefined,
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedTest, testId);
      
      // Show notification
      addNotification({
        message: `Test released from your queue`,
        type: 'info',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error releasing test assignment:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

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
        <h3 className="text-lg font-medium text-gray-900">Error loading laboratory data</h3>
        <p className="text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Flask className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Laboratory</h1>
                <p className="text-primary-100 text-xs">Test Management & Results</p>
              </div>
            </div>
            <Link to="/laboratory/new-test" className="btn bg-white text-primary-600 hover:bg-white/90 shadow-sm flex items-center py-1.5 px-3 text-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Test
            </Link>
          </div>
        </div>
        
        <div className="p-3 grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50">
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
              <div className="p-2 rounded-full bg-primary-100">
                <Flask className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">For Review</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{reviewCount}</p>
              </div>
              <div className="p-2 rounded-full bg-secondary-100">
                <FileText className="h-4 w-4 text-secondary-600" />
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
          <Flask className="h-4 w-4 text-primary-500" />
          <span className="font-medium text-sm">In Progress</span>
          <span className="ml-auto bg-primary-100 text-primary-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {inProgressCount}
          </span>
        </div>
        
        <div 
          className={`flex-1 rounded-lg p-2.5 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'review' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('review')}
        >
          <FileText className="h-4 w-4 text-secondary-500" />
          <span className="font-medium text-sm">For Review</span>
          <span className="ml-auto bg-secondary-100 text-secondary-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {reviewCount}
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
        {/* Left Section - Test Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Flask className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No tests {
                  activeTab === 'pending' ? 'pending' : 
                  activeTab === 'in_progress' ? 'in progress' : 
                  'for review'
                }</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {activeTab === 'pending' 
                    ? "There are currently no pending tests. New tests will appear here when ordered by physicians."
                    : activeTab === 'in_progress'
                    ? "There are currently no tests in progress. Start processing tests from the pending queue."
                    : "There are currently no tests awaiting review. Tests will appear here after processing is complete."
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <div key={result.id} className={`p-4 hover:bg-gray-50 transition-colors ${result.is_emergency ? 'bg-error-50/50' : ''}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {result.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {result.patient.first_name} {result.patient.last_name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <div className="flex items-center">
                                {getWorkflowStageIcon(result.workflow_stage)}
                                <span className="ml-1">{getWorkflowStageLabel(result.workflow_stage)}</span>
                              </div>
                              <span className="mx-1.5">•</span>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{getTimeAgo(result.last_updated || result.test_date)}</span>
                              
                              {result.sample_info && (
                                <>
                                  <span className="mx-1.5">•</span>
                                  <span className="text-primary-600 font-medium">{result.sample_info.sample_id}</span>
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
                            
                            {result.assigned_to && result.assigned_to !== 'current_user' && (
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
                                
                                {result.assigned_to === 'current_user' && (
                                  <>
                                    <button 
                                      onClick={() => handleStartTest(result.id)}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Collect Sample <Beaker className="h-3 w-3 ml-1.5" />
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
                            ) : activeTab === 'in_progress' ? (
                              <div className="flex space-x-1">
                                {result.assigned_to === 'current_user' ? (
                                  <>
                                    <button 
                                      onClick={() => handleProcessTest(result.id)}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      {result.workflow_stage === 'sample_collected' ? 'Start Testing' : 'Continue Testing'}
                                      <ArrowRight className="h-3 w-3 ml-1.5" />
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
                                    title="Take over this test"
                                  >
                                    Take over
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                {result.assigned_to === 'current_user' ? (
                                  <>
                                    <button 
                                      onClick={() => handleProcessTest(result.id)}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Review Results
                                      <CheckCircle className="h-3 w-3 ml-1.5" />
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
                                    title="Take over this review"
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                            <Beaker className="h-3 w-3 mr-1 text-primary-500" />
                            {getTestTypeLabel(result.test_type)}
                          </span>
                          
                          {result.sample_info?.sample_type && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                              {getSampleTypeLabel(result.sample_info.sample_type)}
                            </span>
                          )}
                          
                          {result.sample_info?.container_type && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                              {getContainerTypeLabel(result.sample_info.container_type)}
                            </span>
                          )}
                          
                          {result.workflow_stage === 'testing' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-xs font-medium text-primary-800">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Processing
                            </span>
                          )}
                          
                          {result.workflow_stage === 'review' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-100 text-xs font-medium text-secondary-800">
                              <FileText className="h-3 w-3 mr-1" />
                              Results Ready
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
                <Layers className="h-4 w-4 text-primary-500 mr-1.5" />
                <h2 className="text-sm font-medium text-gray-900">My Work Queue</h2>
              </div>
              <span className="text-xs text-gray-500">{assignedToMeCount} tests</span>
            </div>
            <div className="p-3">
              {assignedToMeCount === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No tests currently assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(labResults) && labResults
                    .filter(r => r.assigned_to === 'current_user')
                    .sort((a, b) => {
                      // Sort by emergency first, then by workflow stage
                      if (a.is_emergency && !b.is_emergency) return -1;
                      if (!a.is_emergency && b.is_emergency) return 1;
                      
                      // Then sort by workflow stage
                      const stageOrder = {
                        'pending': 0,
                        'sample_collected': 1,
                        'testing': 2,
                        'review': 3,
                        'completed': 4
                      };
                      
                      return (stageOrder[a.workflow_stage || 'pending'] || 0) - (stageOrder[b.workflow_stage || 'pending'] || 0);
                    })
                    .slice(0, 5)
                    .map(test => (
                      <div key={test.id} className={`p-2 rounded-lg border ${test.is_emergency ? 'border-error-200 bg-error-50' : 'border-gray-200'} flex items-center justify-between`}>
                        <div className="flex items-center">
                          <div className="mr-2">
                            {getWorkflowStageIcon(test.workflow_stage)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {test.patient.first_name} {test.patient.last_name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {getTestTypeLabel(test.test_type)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleProcessTest(test.id)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Continue
                        </button>
                      </div>
                    ))}
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
                <h2 className="text-sm font-medium text-gray-900">Test Reference</h2>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-3">
              <h3 className="text-xs font-medium text-gray-700 mb-2">Common Tests</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">CBC</span>
                  <span className="text-xs text-gray-600">Complete Blood Count</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">LFT</span>
                  <span className="text-xs text-gray-600">Liver Function Test</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">RFT</span>
                  <span className="text-xs text-gray-600">Renal Function Test</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-md hover:bg-gray-50">
                  <span className="text-xs text-gray-600">HbA1c</span>
                  <span className="text-xs text-gray-600">Glycated Hemoglobin</span>
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
                    <p className="text-xs font-medium text-gray-700">Sample Collection</p>
                    <p className="text-xs text-gray-500">Collect and label patient sample</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-primary-700">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Testing</p>
                    <p className="text-xs text-gray-500">Analyze sample and record results</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-secondary-700">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Review</p>
                    <p className="text-xs text-gray-500">Senior technician verifies results</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-md bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center mr-2">
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