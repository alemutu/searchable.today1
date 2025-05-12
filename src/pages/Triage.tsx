import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Activity, AlertTriangle, Clock, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  current_flow_step: string;
  priority_level: string;
}

const Triage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

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
          priority_level: 'normal'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          first_name: 'Jane',
          last_name: 'Smith',
          date_of_birth: '1992-08-22',
          current_flow_step: 'triage',
          priority_level: 'urgent'
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          first_name: 'Robert',
          last_name: 'Johnson',
          date_of_birth: '1975-12-10',
          current_flow_step: 'registration',
          priority_level: 'normal'
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          first_name: 'Emily',
          last_name: 'Williams',
          date_of_birth: '1988-03-30',
          current_flow_step: 'triage',
          priority_level: 'normal'
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          first_name: 'Michael',
          last_name: 'Brown',
          date_of_birth: '1965-07-18',
          current_flow_step: 'registration',
          priority_level: 'critical'
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          first_name: 'Sarah',
          last_name: 'Davis',
          date_of_birth: '1990-04-12',
          current_flow_step: 'registration',
          priority_level: 'urgent'
        },
        {
          id: '00000000-0000-0000-0000-000000000007',
          first_name: 'David',
          last_name: 'Miller',
          date_of_birth: '1982-09-28',
          current_flow_step: 'registration',
          priority_level: 'normal'
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

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Filter patients that should be in triage queue (registration or triage status)
  const triageQueue = patients.filter(patient => 
    patient.current_flow_step === 'registration' || patient.current_flow_step === 'triage'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Triage Queue</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Waiting Patients</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {patients.filter(p => p.current_flow_step === 'registration').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <Clock className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Triage</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {patients.filter(p => p.current_flow_step === 'triage').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <Activity className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical Cases</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {patients.filter(p => p.priority_level === 'critical').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-error-100">
              <Heart className="h-6 w-6 text-error-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {triageQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No patients in triage queue
                  </td>
                </tr>
              ) : (
                triageQueue.map((patient) => {
                  // Calculate a mock wait time based on priority
                  let waitTime = '10 min';
                  if (patient.priority_level === 'urgent') waitTime = '5 min';
                  if (patient.priority_level === 'critical') waitTime = '0 min';
                  
                  return (
                    <tr key={patient.id} className={patient.priority_level === 'critical' ? 'bg-error-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {patient.priority_level === 'critical' && (
                            <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateAge(patient.date_of_birth)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(patient.priority_level)}`}>
                          {patient.priority_level.charAt(0).toUpperCase() + patient.priority_level.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.current_flow_step === 'registration' ? 'bg-warning-100 text-warning-800' : 'bg-success-100 text-success-800'
                        }`}>
                          {patient.current_flow_step === 'registration' ? 'Waiting' : 'In Triage'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {waitTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/patients/${patient.id}/triage`} className="text-primary-600 hover:text-primary-900">
                          Start Triage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Triage;