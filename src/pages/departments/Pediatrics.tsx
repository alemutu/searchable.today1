import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { 
  Search, 
  Filter, 
  Stethoscope, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  ChevronDown,
  Activity,
  AlertTriangle,
  Baby
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
  wait_time?: string;
}

const Pediatrics: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const { hospital } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress'>('waiting');

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
          first_name: 'Tommy',
          last_name: 'Jones',
          date_of_birth: '2020-05-15',
          current_flow_step: 'waiting_consultation',
          priority_level: 'normal',
          arrival_time: '09:15 AM',
          wait_time: '15 min'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          first_name: 'Lily',
          last_name: 'Smith',
          date_of_birth: '2018-08-22',
          current_flow_step: 'consultation',
          priority_level: 'urgent',
          arrival_time: '09:30 AM',
          wait_time: '0 min'
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          first_name: 'Bobby',
          last_name: 'Johnson',
          date_of_birth: '2019-12-10',
          current_flow_step: 'waiting_consultation',
          priority_level: 'normal',
          arrival_time: '08:45 AM',
          wait_time: '45 min'
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          first_name: 'Emma',
          last_name: 'Williams',
          date_of_birth: '2021-03-30',
          current_flow_step: 'waiting_consultation',
          priority_level: 'normal',
          arrival_time: '10:00 AM',
          wait_time: '5 min'
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          first_name: 'Michael',
          last_name: 'Brown',
          date_of_birth: '2022-07-18',
          current_flow_step: 'consultation',
          priority_level: 'critical',
          arrival_time: '10:15 AM',
          wait_time: '0 min'
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
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  // Filter patients based on their current flow step and the active tab
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         patient.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || patient.priority_level === filterPriority;
    
    if (activeTab === 'waiting') {
      return patient.current_flow_step === 'waiting_consultation' && matchesSearch && matchesPriority;
    } else {
      return patient.current_flow_step === 'consultation' && matchesSearch && matchesPriority;
    }
  });

  // Count patients in each category
  const waitingCount = patients.filter(p => p.current_flow_step === 'waiting_consultation').length;
  const inProgressCount = patients.filter(p => p.current_flow_step === 'consultation').length;
  const completedCount = patients.filter(p => p.current_flow_step === 'post_consultation').length;
  const urgentCount = patients.filter(p => p.priority_level === 'urgent' || p.priority_level === 'critical').length;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pediatrics</h1>
          <p className="text-sm text-gray-500">Department Patient Management</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <div 
          className={`flex-1 rounded-lg p-4 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'waiting' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('waiting')}
        >
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Waiting</span>
          <span className="ml-auto bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {waitingCount}
          </span>
        </div>
        
        <div 
          className={`flex-1 rounded-lg p-4 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'in_progress' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('in_progress')}
        >
          <Baby className="h-5 w-5 text-primary-500" />
          <span className="font-medium">In Consultation</span>
          <span className="ml-auto bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {inProgressCount}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 w-full"
            placeholder="Search patients..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="form-input appearance-none pr-8"
          >
            <option value="all">All Priority</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        {/* Left Section - Patient Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No patients {activeTab === 'waiting' ? 'waiting' : 'in consultation'}</h3>
                <p className="text-gray-500">There are currently no patients in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className={`p-4 hover:bg-gray-50 ${patient.priority_level === 'critical' ? 'bg-error-50' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                        {patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{patient.first_name} {patient.last_name}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Wait time: {patient.wait_time}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getPriorityColor(patient.priority_level)}`}>
                              {patient.priority_level}
                            </span>
                            <Link 
                              to={`/patients/${patient.id}/consultation`}
                              className="btn btn-primary inline-flex items-center text-sm"
                            >
                              {activeTab === 'waiting' ? 'Start Consultation' : 'Continue'} <Baby className="h-4 w-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm">{calculateAge(patient.date_of_birth)} • {patient.date_of_birth}</span>
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
        <div className="w-1/3 space-y-4">
          {/* Overview Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Department Overview</h2>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">Waiting</span>
                </div>
                <span className="font-medium">{waitingCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Baby className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-gray-700">In Consultation</span>
                </div>
                <span className="font-medium">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-700">Completed</span>
                </div>
                <span className="font-medium">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-warning-500 mr-2" />
                  <span className="text-gray-700">Urgent</span>
                </div>
                <span className="font-medium">{urgentCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/patients" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <FileText className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">View Records</span>
              </Link>
              <Link to="/reception" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <User className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">Reception</span>
              </Link>
              <Link to="/consultations" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <Stethoscope className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">Consultations</span>
              </Link>
              <Link to="/appointments" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <Calendar className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">Appointments</span>
              </Link>
            </div>
          </div>

          {/* Reference Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Baby className="h-5 w-5 text-primary-500 mr-2" />
                Pediatric Reference
              </h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Growth Milestones</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">2-4 months</div>
                  <div className="text-right">Smiles, holds head up</div>
                  <div className="text-gray-600">6-9 months</div>
                  <div className="text-right">Sits, crawls</div>
                  <div className="text-gray-600">12-18 months</div>
                  <div className="text-right">Walks, first words</div>
                  <div className="text-gray-600">2-3 years</div>
                  <div className="text-right">Runs, sentences</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pediatrics;