import React, { useState, useEffect } from 'react';
import { useHybridStorage } from '../../lib/hooks/useHybridStorage';
import { useNotificationStore } from '../../lib/store';
import { Search, Filter, Stethoscope, CheckCircle, Clock, ArrowLeft, FileText, User, Calendar, ChevronDown, Activity, AlertTriangle, Heart, Layers, XCircle, Loader2, FlaskRound as Flask, Microscope, DollarSign, Pill, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  current_flow_step: string;
  priority_level: string;
  arrival_time?: string;
  wait_time?: string;
  assigned_to?: string;
  last_updated?: string;
  chief_complaint?: string;
  external_location?: string; // lab, radiology, pharmacy, billing, etc.
  external_status?: string;
  expected_return_time?: string;
}

const Cardiology: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress'>('waiting');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const { addNotification } = useNotificationStore();
  
  const { 
    data: patients, 
    loading: isLoading, 
    error, 
    saveItem, 
    fetchItems 
  } = useHybridStorage<Patient>('patients');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-error-100 text-error-800';
      case 'urgent':
        return 'bg-warning-100 text-warning-800';
      case 'normal':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
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

  const getExternalLocationIcon = (location?: string) => {
    switch (location) {
      case 'laboratory':
        return <Flask className="h-3.5 w-3.5 text-primary-500" />;
      case 'radiology':
        return <Microscope className="h-3.5 w-3.5 text-secondary-500" />;
      case 'pharmacy':
        return <Pill className="h-3.5 w-3.5 text-success-500" />;
      case 'billing':
        return <DollarSign className="h-3.5 w-3.5 text-warning-500" />;
      default:
        if (location?.includes('department') || location?.includes('clinic')) {
          return <Building2 className="h-3.5 w-3.5 text-accent-500" />;
        }
        return null;
    }
  };

  const getExternalLocationLabel = (location?: string, status?: string) => {
    if (!location) return null;
    
    const locations: Record<string, string> = {
      'laboratory': 'Lab',
      'radiology': 'Radiology',
      'pharmacy': 'Pharmacy',
      'billing': 'Billing',
      'cardiology': 'Cardiology',
      'orthopedic': 'Orthopedics',
      'dental': 'Dental',
      'eye': 'Eye Clinic',
      'physiotherapy': 'Physiotherapy'
    };
    
    const statuses: Record<string, string> = {
      'sample_collected': 'Sample Collected',
      'testing': 'Testing',
      'in_progress': 'In Progress',
      'processing': 'Processing',
      'dispensing': 'Dispensing',
      'consultation': 'In Consultation'
    };
    
    const locationLabel = locations[location] || location;
    const statusLabel = status ? (statuses[status] || status) : '';
    
    return `${locationLabel}${statusLabel ? `: ${statusLabel}` : ''}`;
  };

  const getTimeUntilReturn = (dateString?: string) => {
    if (!dateString) return null;
    
    const returnTime = new Date(dateString);
    const now = new Date();
    
    // If the return time is in the past, show "Expected soon"
    if (returnTime <= now) {
      return "Expected soon";
    }
    
    const diffMs = returnTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `Expected in ${diffMins}m`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    return `Expected in ${diffHours}h`;
  };

  // Get patient status label
  const getPatientStatusLabel = (flowStep: string) => {
    switch (flowStep) {
      case 'registration':
        return 'Registration';
      case 'triage':
        return 'In Triage';
      case 'waiting_consultation':
        return 'Waiting for Doctor';
      case 'waiting_cardiology':
        return 'Waiting for Cardiology';
      case 'consultation':
        return 'In Consultation';
      case 'emergency':
        return 'Emergency';
      default:
        if (flowStep.startsWith('waiting_')) {
          const dept = flowStep.replace('waiting_', '').replace(/_/g, ' ');
          return `Waiting for ${dept.charAt(0).toUpperCase() + dept.slice(1)}`;
        }
        return flowStep.replace(/_/g, ' ').charAt(0).toUpperCase() + flowStep.replace(/_/g, ' ').slice(1);
    }
  };

  // Get status color for patient status badge
  const getStatusColor = (flowStep: string) => {
    if (flowStep === 'registration') return 'bg-blue-100 text-blue-800';
    if (flowStep === 'triage') return 'bg-primary-100 text-primary-800';
    if (flowStep === 'emergency') return 'bg-error-100 text-error-800';
    if (flowStep.startsWith('waiting_')) return 'bg-warning-100 text-warning-800';
    if (flowStep === 'consultation') return 'bg-secondary-100 text-secondary-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleAssignToMe = async (patientId: string) => {
    if (!Array.isArray(patients)) return;
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    try {
      // Update the patient
      const updatedPatient: Patient = {
        ...patient,
        assigned_to: 'current_user', // Replace with actual user ID
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedPatient, patientId);
      
      // Show notification
      addNotification({
        message: `${patient.first_name} ${patient.last_name} assigned to you`,
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error assigning patient:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleReleaseAssignment = async (patientId: string) => {
    if (!Array.isArray(patients)) return;
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    try {
      // Update the patient
      const updatedPatient: Patient = {
        ...patient,
        assigned_to: undefined,
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedPatient, patientId);
      
      // Show notification
      addNotification({
        message: `${patient.first_name} ${patient.last_name} released from your queue`,
        type: 'info',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error releasing patient assignment:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleStartConsultation = async (patientId: string) => {
    if (!Array.isArray(patients)) return;
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    try {
      // Update the patient status to in_progress
      const updatedPatient: Patient = {
        ...patient,
        current_flow_step: 'consultation',
        assigned_to: 'current_user', // Replace with actual user ID
        last_updated: new Date().toISOString()
      };
      
      await saveItem(updatedPatient, patientId);
      
      // Show notification
      addNotification({
        message: `Started consultation for ${patient.first_name} ${patient.last_name}`,
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      addNotification({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Filter patients based on their current flow step and the active tab
  const filteredPatients = Array.isArray(patients) ? patients.filter(patient => {
    const matchesSearch = patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         patient.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || patient.priority_level === filterPriority;
    const matchesAssigned = !assignedToMe || patient.assigned_to === 'current_user'; // Replace with actual user ID
    
    if (activeTab === 'waiting') {
      return (patient.current_flow_step === 'waiting_consultation' || 
              patient.current_flow_step === 'waiting_cardiology') && 
             matchesSearch && matchesPriority && matchesAssigned;
    } else {
      return patient.current_flow_step === 'consultation' && matchesSearch && matchesPriority && matchesAssigned;
    }
  }) : [];

  // Count patients in each category
  const waitingCount = Array.isArray(patients) ? patients.filter(p => 
    p.current_flow_step === 'waiting_consultation' || 
    p.current_flow_step === 'waiting_cardiology'
  ).length : 0;
  const inProgressCount = Array.isArray(patients) ? patients.filter(p => p.current_flow_step === 'consultation').length : 0;
  const completedCount = Array.isArray(patients) ? patients.filter(p => p.current_flow_step === 'post_consultation').length : 0;
  const urgentCount = Array.isArray(patients) ? patients.filter(p => p.priority_level === 'urgent' || p.priority_level === 'critical').length : 0;
  const assignedToMeCount = Array.isArray(patients) ? patients.filter(p => p.assigned_to === 'current_user').length : 0; // Replace with actual user ID
  const externalCount = Array.isArray(patients) ? patients.filter(p => p.external_location).length : 0;

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
        <h3 className="text-lg font-medium text-gray-900">Error loading department data</h3>
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
          <h1 className="text-xl font-bold text-gray-900">Cardiology</h1>
          <p className="text-xs text-gray-500">Department Patient Management</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <div 
          className={`flex-1 rounded-lg p-2.5 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'waiting' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('waiting')}
        >
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">Waiting</span>
          <span className="ml-auto bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {waitingCount}
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
          <Heart className="h-4 w-4 text-primary-500" />
          <span className="font-medium text-sm">In Consultation</span>
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
            placeholder="Search patients..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
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
        {/* Left Section - Patient Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredPatients.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No patients {activeTab === 'waiting' ? 'waiting' : 'in consultation'}</h3>
                <p className="text-xs text-gray-500">There are currently no patients in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className={`p-3 hover:bg-gray-50 ${patient.priority_level === 'critical' ? 'bg-error-50' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">{patient.first_name} {patient.last_name}</h3>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{getTimeAgo(patient.last_updated || '')}</span>
                              {patient.wait_time && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>Wait time: {patient.wait_time}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getPriorityColor(patient.priority_level)}`}>
                              {patient.priority_level}
                            </span>
                            
                            {patient.assigned_to && patient.assigned_to !== 'current_user' && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                Assigned
                              </span>
                            )}
                            
                            {activeTab === 'waiting' ? (
                              <div className="flex space-x-1">
                                {!patient.assigned_to && !patient.external_location && (
                                  <button 
                                    onClick={() => handleAssignToMe(patient.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Assign to me"
                                  >
                                    Assign to me
                                  </button>
                                )}
                                
                                {patient.assigned_to === 'current_user' && !patient.external_location && (
                                  <>
                                    <button 
                                      onClick={() => handleStartConsultation(patient.id)}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Start Consultation <Heart className="h-3 w-3 ml-1" />
                                    </button>
                                    <button 
                                      onClick={() => handleReleaseAssignment(patient.id)}
                                      className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title="Release assignment"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                                
                                {patient.external_location && (
                                  <div className="px-2 py-1 inline-flex items-center text-xs rounded-lg bg-gray-100 text-gray-700">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    At {getExternalLocationLabel(patient.external_location, patient.external_status)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                {patient.assigned_to === 'current_user' ? (
                                  <>
                                    <Link 
                                      to={`/patients/${patient.id}/consultation`}
                                      className="btn btn-primary inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    >
                                      Continue <Heart className="h-3 w-3 ml-1" />
                                    </Link>
                                    <button 
                                      onClick={() => handleReleaseAssignment(patient.id)}
                                      className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                      title="Release assignment"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignToMe(patient.id)}
                                    className="btn btn-outline inline-flex items-center text-xs py-1 px-2 rounded-lg"
                                    title="Take over this patient"
                                  >
                                    Take over
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-0.5 flex items-center">
                          <span className="text-xs">{calculateAge(patient.date_of_birth)} years</span>
                          {patient.chief_complaint && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="text-xs text-primary-600 font-medium">{patient.chief_complaint}</span>
                            </>
                          )}
                          
                          {/* External location indicator */}
                          {patient.external_location && (
                            <div className="ml-auto flex items-center">
                              <div className="flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                                {getExternalLocationIcon(patient.external_location)}
                                <span className="ml-1 text-xs text-blue-700">
                                  {getTimeUntilReturn(patient.expected_return_time)}
                                </span>
                              </div>
                            </div>
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
                <h2 className="text-sm font-medium text-gray-900">My Patients</h2>
              </div>
              <span className="text-xs text-gray-500">{assignedToMeCount} patients</span>
            </div>
            <div className="p-3">
              {assignedToMeCount === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No patients currently assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(patients) && patients
                    .filter(p => p.assigned_to === 'current_user')
                    .sort((a, b) => {
                      // Sort by priority first
                      const priorityOrder = { 'critical': 0, 'urgent': 1, 'normal': 2 };
                      const aPriority = priorityOrder[a.priority_level as keyof typeof priorityOrder] || 3;
                      const bPriority = priorityOrder[b.priority_level as keyof typeof priorityOrder] || 3;
                      
                      if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                      }
                      
                      // Then sort by flow step
                      const stepOrder = { 'consultation': 0, 'waiting_consultation': 1 };
                      const aStep = stepOrder[a.current_flow_step as keyof typeof stepOrder] || 2;
                      const bStep = stepOrder[b.current_flow_step as keyof typeof stepOrder] || 2;
                      
                      return aStep - bStep;
                    })
                    .slice(0, 5)
                    .map(patient => (
                      <div key={patient.id} className={`p-2 rounded-lg border ${patient.priority_level === 'critical' ? 'border-error-200 bg-error-50' : patient.priority_level === 'urgent' ? 'border-warning-200 bg-warning-50' : 'border-gray-200'} flex items-center justify-between`}>
                        <div className="flex items-center">
                          <div className="mr-2">
                            {patient.current_flow_step === 'waiting_consultation' || patient.current_flow_step === 'waiting_cardiology' ? (
                              <Clock className="h-3.5 w-3.5 text-warning-500" />
                            ) : (
                              <Heart className="h-3.5 w-3.5 text-error-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <div className="flex items-center">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(patient.current_flow_step)}`}>
                                {getPatientStatusLabel(patient.current_flow_step)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/patients/${patient.id}/consultation`}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {patient.current_flow_step === 'waiting_consultation' || patient.current_flow_step === 'waiting_cardiology' ? 'Start' : 'Continue'}
                        </Link>
                      </div>
                    ))}
                  
                  {patients && Array.isArray(patients) && patients.filter(p => p.assigned_to === 'current_user').length > 5 && (
                    <div className="text-center pt-1">
                      <button className="text-xs text-primary-600 hover:text-primary-800">
                        View all ({patients.filter(p => p.assigned_to === 'current_user').length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* External Patients Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-secondary-500 mr-1.5" />
                <h2 className="text-sm font-medium text-gray-900">Patients at Other Services</h2>
              </div>
              <span className="text-xs text-gray-500">{externalCount} patients</span>
            </div>
            <div className="p-3">
              {externalCount === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No patients currently at other services</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(patients) && patients
                    .filter(p => p.external_location)
                    .map(patient => (
                      <div key={patient.id} className="p-2 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {getExternalLocationIcon(patient.external_location)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <div className="flex items-center">
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {getExternalLocationLabel(patient.external_location, patient.external_status)}
                              </p>
                              {patient.expected_return_time && (
                                <p className="text-xs text-blue-600 ml-1">
                                  • {getTimeUntilReturn(patient.expected_return_time)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          View
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
              <h2 className="text-sm font-medium text-gray-900">Department Overview</h2>
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-700">Waiting</span>
                </div>
                <span className="font-medium text-sm">{waitingCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 text-primary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">In Consultation</span>
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
              <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-secondary-500 mr-1.5" />
                  <span className="text-sm text-gray-700">At Other Services</span>
                </div>
                <span className="font-medium text-sm">{externalCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/patients" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <FileText className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">View Records</span>
              </Link>
              <Link to="/reception" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <User className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Reception</span>
              </Link>
              <Link to="/consultations" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Stethoscope className="h-4 w-4 text-primary-500 mr-1.5" />
                <span className="text-xs text-gray-700">Consultations</span>
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
              <h2 className="text-sm font-medium text-gray-900 flex items-center">
                <Heart className="h-4 w-4 text-error-500 mr-1.5" />
                Cardiology Reference
              </h2>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-1">Common Conditions</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-gray-600">Hypertension</div>
                  <div className="text-right">140/90 mmHg+</div>
                  <div className="text-gray-600">Tachycardia</div>
                  <div className="text-right">100+ bpm</div>
                  <div className="text-gray-600">Bradycardia</div>
                  <div className="text-right">&lt;60 bpm</div>
                  <div className="text-gray-600">Arrhythmia</div>
                  <div className="text-right">Irregular rhythm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cardiology;