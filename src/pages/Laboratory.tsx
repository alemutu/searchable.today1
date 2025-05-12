import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, FlaskRound as Flask, CheckCircle, XCircle, AlertTriangle, Plus, ArrowLeft, Clock, FileText, User, Calendar, Stethoscope, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

const Laboratory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress'>('pending');

  useEffect(() => {
    fetchLabResults();
  }, [hospital]);

  const fetchLabResults = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          reviewed_by:reviewed_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLabResults(data || []);
    } catch (error) {
      console.error('Error fetching lab results:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Laboratory</h1>
          <p className="text-sm text-gray-500">Test Management & Results</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <div 
          className={`flex-1 rounded-lg p-4 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'pending' 
              ? 'bg-white shadow-sm border border-gray-200' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Pending</span>
          <span className="ml-auto bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {pendingCount}
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
          <Flask className="h-5 w-5 text-primary-500" />
          <span className="font-medium">In Progress</span>
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
            placeholder="Search tests..."
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
        {/* Left Section - Test Queue */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Flask className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No tests {activeTab === 'pending' ? 'pending' : 'in progress'}</h3>
                <p className="text-gray-500">There are currently no tests in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <div key={result.id} className={`p-4 hover:bg-gray-50 ${result.is_emergency ? 'bg-error-50' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                        {result.patient.first_name.charAt(0)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {result.patient.first_name} {result.patient.last_name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{new Date(result.test_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.is_emergency && (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-error-100 text-error-800">
                                Emergency
                              </span>
                            )}
                            <Link 
                              to={`/laboratory/${result.id}`}
                              className="btn btn-primary inline-flex items-center text-sm"
                            >
                              Process Test <Flask className="h-4 w-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm font-medium">Test: </span>
                          <span className="text-sm">{result.test_type}</span>
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
              <h2 className="text-lg font-medium text-gray-900">Laboratory Overview</h2>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">Pending</span>
                </div>
                <span className="font-medium">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <Flask className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-gray-700">In Progress</span>
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
              <Link to="/laboratory/new-test" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <Plus className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">New Test</span>
              </Link>
              <Link to="/patients" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <FileText className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">View Records</span>
              </Link>
              <Link to="/reception" className="flex items-center p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                <User className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-gray-700">Reception</span>
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
                <Flask className="h-5 w-5 text-primary-500 mr-2" />
                Test Reference
              </h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Common Tests</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">CBC</div>
                  <div className="text-right">Complete Blood Count</div>
                  <div className="text-gray-600">LFT</div>
                  <div className="text-right">Liver Function Test</div>
                  <div className="text-gray-600">RFT</div>
                  <div className="text-right">Renal Function Test</div>
                  <div className="text-gray-600">HbA1c</div>
                  <div className="text-right">Glycated Hemoglobin</div>
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