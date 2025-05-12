import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Heart, 
  Search, 
  Filter, 
  ArrowRight, 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  ChevronDown,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  current_flow_step: string;
  priority_level: string;
  arrival_time?: string;
}

const Triage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const { hospital } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress'>('in_progress');

  useEffect(() => {
    fetchPatients();
  }, [hospital]);

  const fetchPatients = async () => {
    try {
      // In a real app, we would fetch from Supabase
      // For now, we'll use mock data
      const mockPatients = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1980-05-15',
          current_flow_step: 'registration',
          priority_level: 'normal',
          arrival_time: '09:15 AM'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          first_name: 'Jane',
          last_name: 'Smith',
          date_of_birth: '1992-08-22',
          current_flow_step: 'triage',
          priority_level: 'urgent',
          arrival_time: '09:30 AM'
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          first_name: 'Robert',
          last_name: 'Johnson',
          date_of_birth: '1975-12-10',
          current_flow_step: 'waiting_consultation',
          priority_level: 'normal',
          arrival_time: '08:45 AM'
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          first_name: 'Emily',
          last_name: 'Williams',
          date_of_birth: '1988-03-30',
          current_flow_step: 'consultation',
          priority_level: 'normal',
          arrival_time: '10:00 AM'
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          first_name: 'Michael',
          last_name: 'Brown',
          date_of_birth: '1965-07-18',
          current_flow_step: 'emergency',
          priority_level: 'critical',
          arrival_time: '10:15 AM'
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          first_name: 'Sarah',
          last_name: 'Davis',
          date_of_birth: '1990-04-12',
          current_flow_step: 'registration',
          priority_level: 'urgent',
          arrival_time: '10:30 AM'
        },
        {
          id: '00000000-0000-0000-0000-000000000007',
          first_name: 'David',
          last_name: 'Miller',
          date_of_birth: '1982-09-28',
          current_flow_step: 'registration',
          priority_level: 'normal',
          arrival_time: '10:45 AM'
        }
      ];
      
      setPatients(mockPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Filter patients based on their current flow step and the active tab
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         patient.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || patient.priority_level === filterPriority;
    
    if (activeTab === 'waiting') {
      return patient.current_flow_step === 'registration' && matchesSearch && matchesPriority;
    } else {
      return patient.current_flow_step === 'triage' && matchesSearch && matchesPriority;
    }
  });

  // Count patients in each category
  const waitingCount = patients.filter(p => p.current_flow_step === 'registration').length;
  const inProgressCount = patients.filter(p => p.current_flow_step === 'triage').length;
  const completedCount = patients.filter(p => p.current_flow_step === 'waiting_consultation').length;
  const urgentCount = patients.filter(p => p.priority_level === 'urgent').length;

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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Triage</h1>
          <p className="text-xs text-gray-500">Patient Assessment & Prioritization</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <div 
          className={`flex-1 rounded-lg p-3 flex items-center space-x-2 cursor-pointer ${
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
          className={`flex-1 rounded-lg p-3 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'in_progress' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('in_progress')}
        >
          <Activity className="h-4 w-4 text-primary-500" />
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
            placeholder="Search in progress patients..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
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
        {/* Left Section - Patient Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredPatients.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No patients {activeTab === 'waiting' ? 'waiting' : 'in triage'}</h3>
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
                              <span>{patient.arrival_time || 'Just arrived'}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getPriorityColor(patient.priority_level)}`}>
                              {patient.priority_level}
                            </span>
                            <Link 
                              to={`/patients/${patient.id}/triage`}
                              className="btn btn-primary inline-flex items-center text-xs py-1 px-2"
                            >
                              Continue Triage <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-xs">{calculateAge(patient.date_of_birth)} years • {patient.date_of_birth}</span>
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
              <h2 className="text-base font-medium text-gray-900">Triage Overview</h2>
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
                  <Activity className="h-4 w-4 text-primary-500 mr-1.5" />
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

          {/* Vital Signs Reference Card */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium text-gray-900 flex items-center">
                <Heart className="h-4 w-4 text-error-500 mr-1.5" />
                Vital Signs Reference
              </h2>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-1">Blood Pressure</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-gray-600">Normal</div>
                  <div className="text-right">90-120/60-80 mmHg</div>
                  <div className="text-gray-600">Elevated</div>
                  <div className="text-right">120-129/&lt;80 mmHg</div>
                  <div className="text-gray-600">Hypertension</div>
                  <div className="text-right">&gt;130/&gt;80 mmHg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Triage;