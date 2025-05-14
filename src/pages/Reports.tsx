import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  FileText, 
  Calendar, 
  Download, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  FileSpreadsheet,
  FilePdf,
  Share2,
  Mail,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Report {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: string;
  created_at: string;
  updated_at: string;
  is_system: boolean;
  is_public: boolean;
  created_by: {
    first_name: string;
    last_name: string;
  } | null;
  last_execution?: {
    id: string;
    status: string;
    created_at: string;
  } | null;
}

interface ReportExecution {
  id: string;
  report_id: string;
  status: string;
  created_at: string;
  executed_by: {
    first_name: string;
    last_name: string;
  } | null;
  execution_time: number | null;
  file_url: string | null;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<ReportExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent'>('all');

  useEffect(() => {
    fetchReports();
  }, [hospital]);

  const fetchReports = async () => {
    if (!hospital) return;
    
    try {
      setIsLoading(true);
      
      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          created_by:profiles(first_name, last_name)
        `)
        .eq('hospital_id', hospital.id)
        .order('created_at', { ascending: false });
        
      if (reportsError) throw reportsError;
      
      // Fetch recent executions for each report
      const reportIds = reportsData?.map(r => r.id) || [];
      
      if (reportIds.length > 0) {
        const { data: executionsData, error: executionsError } = await supabase
          .from('report_executions')
          .select(`
            id,
            report_id,
            status,
            created_at,
            executed_by:profiles(first_name, last_name),
            execution_time,
            file_url
          `)
          .in('report_id', reportIds)
          .order('created_at', { ascending: false });
          
        if (executionsError) throw executionsError;
        
        // Group executions by report_id and get the latest one
        const latestExecutions: Record<string, any> = {};
        executionsData?.forEach(execution => {
          if (!latestExecutions[execution.report_id] || 
              new Date(execution.created_at) > new Date(latestExecutions[execution.report_id].created_at)) {
            latestExecutions[execution.report_id] = execution;
          }
        });
        
        // Add last_execution to reports
        const reportsWithExecutions = reportsData?.map(report => ({
          ...report,
          last_execution: latestExecutions[report.id] || null
        }));
        
        setReports(reportsWithExecutions || []);
        setRecentExecutions(executionsData?.slice(0, 5) || []);
      } else {
        setReports(reportsData || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      addNotification({
        message: 'Failed to load reports',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunReport = async (reportId: string) => {
    if (!hospital || !user) return;
    
    try {
      addNotification({
        message: 'Report execution started',
        type: 'info'
      });
      
      // Create a new report execution
      const { data, error } = await supabase
        .from('report_executions')
        .insert({
          report_id: reportId,
          hospital_id: hospital.id,
          executed_by: user.id,
          status: 'processing',
          parameters: {}
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // In a real app, this would trigger a background job
      // For demo purposes, we'll simulate a successful execution after a delay
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('report_executions')
          .update({
            status: 'completed',
            execution_time: Math.floor(Math.random() * 5000) + 1000, // Random time between 1-6 seconds
            file_url: 'https://example.com/reports/sample.pdf'
          })
          .eq('id', data.id);
          
        if (updateError) {
          console.error('Error updating report execution:', updateError);
          return;
        }
        
        addNotification({
          message: 'Report generated successfully',
          type: 'success'
        });
        
        // Refresh reports to show updated status
        fetchReports();
      }, 2000);
    } catch (error) {
      console.error('Error running report:', error);
      addNotification({
        message: 'Failed to run report',
        type: 'error'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <BarChart className="h-5 w-5 text-success-500" />;
      case 'clinical':
        return <FileText className="h-5 w-5 text-primary-500" />;
      case 'operational':
        return <LineChart className="h-5 w-5 text-secondary-500" />;
      case 'administrative':
        return <PieChart className="h-5 w-5 text-warning-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bar_chart':
        return <BarChart className="h-5 w-5" />;
      case 'pie_chart':
        return <PieChart className="h-5 w-5" />;
      case 'line_chart':
        return <LineChart className="h-5 w-5" />;
      case 'table':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'processing':
        return 'bg-primary-100 text-primary-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-primary-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
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

  const formatExecutionTime = (ms: number | null) => {
    if (!ms) return 'N/A';
    
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    const matchesType = filterType === 'all' || report.type === filterType;
    
    if (activeTab === 'favorites') {
      // In a real app, you would check if the report is in user's favorites
      return matchesSearch && matchesCategory && matchesType && report.is_public;
    } else if (activeTab === 'recent') {
      // In a real app, you would check recent reports run by the user
      return matchesSearch && matchesCategory && matchesType && report.last_execution;
    }
    
    return matchesSearch && matchesCategory && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Link to="/reports/new" className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Report
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{reports.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Financial Reports</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {reports.filter(r => r.category === 'financial').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <BarChart className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clinical Reports</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {reports.filter(r => r.category === 'clinical').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-secondary-100">
              <LineChart className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Executions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {recentExecutions.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <Clock className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Reports Section */}
        <div className="md:w-2/3 space-y-6">
          {/* Tabs and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
              {/* Tabs */}
              <div className="flex space-x-2 border-b border-gray-200 pb-2 sm:pb-0 sm:border-b-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    activeTab === 'all' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  All Reports
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    activeTab === 'favorites' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    activeTab === 'recent' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Recently Run
                </button>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-1 space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-9 py-2 text-sm w-full rounded-md"
                    placeholder="Search reports..."
                  />
                </div>
                
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="form-input py-2 text-sm appearance-none pr-8 rounded-md"
                  >
                    <option value="all">All Categories</option>
                    <option value="financial">Financial</option>
                    <option value="clinical">Clinical</option>
                    <option value="operational">Operational</option>
                    <option value="administrative">Administrative</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="form-input py-2 text-sm appearance-none pr-8 rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="bar_chart">Bar Chart</option>
                    <option value="pie_chart">Pie Chart</option>
                    <option value="line_chart">Line Chart</option>
                    <option value="table">Table</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reports found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterCategory !== 'all' || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first report to get started'}
              </p>
              <Link to="/reports/new" className="btn btn-primary inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create Report
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{report.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{report.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {report.is_system && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            System
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                          {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        {report.last_execution && (
                          <div className="flex items-center ml-3">
                            {getStatusIcon(report.last_execution.status)}
                            <span className="ml-1">
                              {formatTimeAgo(report.last_execution.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRunReport(report.id)}
                          disabled={report.last_execution?.status === 'processing'}
                          className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50"
                          title="Run Report"
                        >
                          {report.last_execution?.status === 'processing' ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to={`/reports/${report.id}`}
                          className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50"
                          title="View Report"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="md:w-1/3 space-y-6">
          {/* Recent Executions */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Recent Executions</h2>
            </div>
            
            {recentExecutions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No recent report executions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentExecutions.map((execution) => {
                  const report = reports.find(r => r.id === execution.report_id);
                  return (
                    <div key={execution.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(execution.status)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {report?.name || 'Unknown Report'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                          {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>{formatTimeAgo(execution.created_at)}</span>
                          {execution.execution_time && (
                            <span className="ml-2">• {formatExecutionTime(execution.execution_time)}</span>
                          )}
                        </div>
                        
                        {execution.file_url && (
                          <a 
                            href={execution.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Quick Actions</h2>
            </div>
            
            <div className="p-4 space-y-3">
              <Link to="/reports/new" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Plus className="h-4 w-4 text-primary-500 mr-2" />
                <span className="text-sm text-gray-700">Create New Report</span>
              </Link>
              
              <Link to="/reports/schedules" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Calendar className="h-4 w-4 text-primary-500 mr-2" />
                <span className="text-sm text-gray-700">Manage Schedules</span>
              </Link>
              
              <Link to="/reports/subscriptions" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Bell className="h-4 w-4 text-primary-500 mr-2" />
                <span className="text-sm text-gray-700">Manage Subscriptions</span>
              </Link>
              
              <Link to="/reports/templates" className="flex items-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <FileText className="h-4 w-4 text-primary-500 mr-2" />
                <span className="text-sm text-gray-700">Report Templates</span>
              </Link>
            </div>
          </div>
          
          {/* Export Options */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">Export Options</h2>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <FilePdf className="h-4 w-4 text-error-500 mr-2" />
                <span className="text-sm text-gray-700">PDF</span>
              </button>
              
              <button className="flex items-center justify-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <FileSpreadsheet className="h-4 w-4 text-success-500 mr-2" />
                <span className="text-sm text-gray-700">Excel</span>
              </button>
              
              <button className="flex items-center justify-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Share2 className="h-4 w-4 text-primary-500 mr-2" />
                <span className="text-sm text-gray-700">Share</span>
              </button>
              
              <button className="flex items-center justify-center p-2 rounded-md hover:bg-gray-50 border border-gray-200">
                <Mail className="h-4 w-4 text-secondary-500 mr-2" />
                <span className="text-sm text-gray-700">Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;