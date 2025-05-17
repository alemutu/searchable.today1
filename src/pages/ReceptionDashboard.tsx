import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  Clock, 
  Heart, 
  CheckCircle, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Bell, 
  LayoutGrid, 
  List, 
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { useHybridStorage } from '../lib/hooks/useHybridStorage';

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  current_flow_step: string | null;
  priority_level: string;
  department?: string;
  wait_time?: string;
  arrival_time?: string;
}

const ReceptionDashboard: React.FC = () => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { hospital } = useAuthStore();
  
  // Use the hybrid storage hook to fetch patients
  const { 
    data: patientsData, 
    loading: patientsLoading, 
    error: patientsError,
    fetchItems: fetchPatients
  } = useHybridStorage<PatientData>('patients');
  
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  useEffect(() => {
    if (Array.isArray(patientsData)) {
      setPatients(patientsData);
      setIsLoading(false);
    }
  }, [patientsData]);
  
  const getFlowStepLabel = (step: string | null) => {
    const labels: Record<string, string> = {
      'registration': 'Registration',
      'triage': 'Triage',
      'waiting_consultation': 'Waiting',
      'consultation': 'Consultation',
      'lab_tests': 'Lab Tests',
      'radiology': 'Radiology',
      'pharmacy': 'Pharmacy',
      'billing': 'Billing',
      'completed': 'Completed',
      'emergency': 'Emergency'
    };
    return labels[step || ''] || step || 'Unknown';
  };
  
  const getFlowStepColor = (step: string | null) => {
    switch (step) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'triage':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting_consultation':
        return 'bg-indigo-100 text-indigo-800';
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
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
  
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || patient.current_flow_step === filterStatus;
    return matchesSearch && matchesFilter;
  });
  
  // Stats
  const registeredToday = patients.filter(p => 
    p.current_flow_step === 'registration' || 
    p.current_flow_step === 'triage'
  ).length;
  
  const avgWaitTime = 15; // minutes - this would be calculated from actual data in a real app
  const activePatients = patients.length;
  const completedToday = patients.filter(p => p.current_flow_step === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-6 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Reception Dashboard</h1>
            <p className="text-primary-100 text-sm">Monitor patient flow and status</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-white hover:bg-primary-600 rounded-full">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <Link to="/patients/register" className="btn bg-white text-primary-600 hover:bg-gray-100 flex items-center px-3 py-2 rounded-md text-sm font-medium">
              <UserPlus className="h-4 w-4 mr-2" />
              New Patient
            </Link>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Link to="/patients/register" className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3 hover:bg-opacity-20 transition cursor-pointer">
            <div className="p-2 bg-white rounded-full">
              <UserPlus className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-white text-sm font-medium">New Patient</h3>
              <p className="text-primary-100 text-xs">Register a new patient</p>
            </div>
          </Link>
          
          <Link to="/appointments" className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3 hover:bg-opacity-20 transition cursor-pointer">
            <div className="p-2 bg-white rounded-full">
              <Calendar className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-white text-sm font-medium">Schedule</h3>
              <p className="text-primary-100 text-xs">Manage appointments</p>
            </div>
          </Link>
          
          <Link to="/patients/search" className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3 hover:bg-opacity-20 transition cursor-pointer">
            <div className="p-2 bg-white rounded-full">
              <FileText className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-white text-sm font-medium">Records</h3>
              <p className="text-primary-100 text-xs">View medical records</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Registered Today</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{registeredToday}</p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-green-500 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  12%
                </span>
                <span className="text-gray-400 ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <UserPlus className="h-5 w-5 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Avg. Wait Time</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{avgWaitTime} min</p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-green-500 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  5%
                </span>
                <span className="text-gray-400 ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-secondary-100">
              <Clock className="h-5 w-5 text-secondary-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Patients</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{activePatients}</p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-green-500 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  8%
                </span>
                <span className="text-gray-400 ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <Heart className="h-5 w-5 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Completed Today</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{completedToday}</p>
              <div className="mt-1 flex items-center text-xs">
                <span className="text-red-500 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  15%
                </span>
                <span className="text-gray-400 ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <CheckCircle className="h-5 w-5 text-success-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Patient Status Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-primary-500 mr-2" />
              <h2 className="text-base font-medium text-gray-900">Patient Status</h2>
              <span className="ml-2 text-xs text-gray-500">{filteredPatients.length} patients total</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-9 w-full text-sm rounded-md border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200"
                placeholder="Search patients..."
              />
            </div>
            
            <div className="relative md:w-1/4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input pl-9 w-full text-sm rounded-md border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200"
              >
                <option value="all">All Patients</option>
                <option value="registration">Registration</option>
                <option value="triage">Triage</option>
                <option value="waiting_consultation">Waiting</option>
                <option value="consultation">Consultation</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
        </div>
        
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wait Time
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <UserPlus className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-base font-medium">No patients found</p>
                        <p className="text-sm">There are no patients in the system at the moment</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className={patient.priority_level === 'critical' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 text-xs font-medium">
                              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {calculateAge(patient.date_of_birth)} yrs • {patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {patient.arrival_time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {patient.department || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getFlowStepColor(patient.current_flow_step)}`}>
                          {getFlowStepLabel(patient.current_flow_step)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getPriorityColor(patient.priority_level)}`}>
                          {patient.priority_level.charAt(0).toUpperCase() + patient.priority_level.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {patient.wait_time || '0 min'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                        <Link to={`/patients/${patient.id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                          View
                        </Link>
                        <Link to={`/patients/${patient.id}/triage`} className="text-primary-600 hover:text-primary-900">
                          Triage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <UserPlus className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-base font-medium">No patients found</p>
                <p className="text-sm">There are no patients in the system at the moment</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className={`bg-white p-6 rounded-lg border hover:shadow-md transition-shadow ${
                    patient.priority_level === 'critical' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 text-xs font-medium">
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {calculateAge(patient.date_of_birth)} yrs • {patient.gender}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getPriorityColor(patient.priority_level)}`}>
                      {patient.priority_level.charAt(0).toUpperCase() + patient.priority_level.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="text-xs text-gray-500">
                      <span className="block font-medium text-gray-700">Department</span>
                      {patient.department || 'Unassigned'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="block font-medium text-gray-700">Wait Time</span>
                      {patient.wait_time || '0 min'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="block font-medium text-gray-700">Status</span>
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getFlowStepColor(patient.current_flow_step)}`}>
                        {getFlowStepLabel(patient.current_flow_step)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="block font-medium text-gray-700">Time</span>
                      {patient.arrival_time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-2 mt-4 -mx-6 -mb-6 border-t border-gray-200 flex justify-between">
                    <Link to={`/patients/${patient.id}`} className="text-xs font-medium text-primary-600 hover:text-primary-900">
                      View Details
                    </Link>
                    <Link to={`/patients/${patient.id}/triage`} className="text-xs font-medium text-primary-600 hover:text-primary-900">
                      Triage
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;