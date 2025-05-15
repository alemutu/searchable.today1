import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Activity, Pill, AlertTriangle, TrendingUp, BedDouble, Microscope, Stethoscope, FlaskRound as Flask, BarChart, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          {change && (
            <div className="mt-1 flex items-center text-sm">
              <span
                className={`font-medium ${
                  change.isPositive ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
              <TrendingUp
                className={`ml-1 h-4 w-4 ${
                  change.isPositive ? 'text-success-500' : 'text-error-500'
                }`}
              />
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface PatientTableRowProps {
  name: string;
  age: number;
  status: string;
  stage: string;
  department: string;
  waitTime: string;
  isEmergency?: boolean;
}

const PatientTableRow: React.FC<PatientTableRowProps> = ({ 
  name, age, status, stage, department, waitTime, isEmergency = false 
}) => {
  return (
    <tr className={isEmergency ? 'bg-error-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {isEmergency && (
            <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{age} years</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${status === 'Active' ? 'bg-success-100 text-success-800' : 
            status === 'Pending' ? 'bg-warning-100 text-warning-800' : 
            'bg-gray-100 text-gray-800'}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {stage}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {department}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {waitTime}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a href="#" className="text-primary-600 hover:text-primary-900">View</a>
      </td>
    </tr>
  );
};

const Dashboard: React.FC = () => {
  const { hospital, isDoctor, isNurse, isAdmin } = useAuthStore();
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    activeConsultations: 0,
    pendingLabResults: 0,
    pharmacyOrders: 0,
    emergencyCases: 0
  });
  
  const [analyticsData, setAnalyticsData] = useState({
    patientsByDepartment: [
      { department: 'Cardiology', count: 42 },
      { department: 'Pediatrics', count: 38 },
      { department: 'Orthopedics', count: 27 },
      { department: 'Neurology', count: 21 },
      { department: 'Gynecology', count: 35 }
    ],
    appointmentsTrend: [
      { date: '2025-05-01', count: 18 },
      { date: '2025-05-02', count: 22 },
      { date: '2025-05-03', count: 15 },
      { date: '2025-05-04', count: 12 },
      { date: '2025-05-05', count: 24 },
      { date: '2025-05-06', count: 28 },
      { date: '2025-05-07', count: 30 }
    ],
    revenueByService: [
      { service: 'Consultations', amount: 12500 },
      { service: 'Laboratory', amount: 8750 },
      { service: 'Radiology', amount: 9200 },
      { service: 'Pharmacy', amount: 7300 },
      { service: 'Procedures', amount: 15400 }
    ]
  });
  
  useEffect(() => {
    // In a real app, this would fetch actual data from the database
    // For now, we'll use mock data
    setStats({
      totalPatients: 128,
      appointmentsToday: 24,
      activeConsultations: 8,
      pendingLabResults: 12,
      pharmacyOrders: 15,
      emergencyCases: 2
    });
  }, []);
  
  // Mock data for active patients
  const recentPatients = [
    { name: 'John Doe', age: 45, status: 'Active', stage: 'Consultation', department: 'Cardiology', waitTime: '10 min' },
    { name: 'Jane Smith', age: 32, status: 'Active', stage: 'Lab Testing', department: 'Internal Medicine', waitTime: '25 min' },
    { name: 'Emily Clark', age: 8, status: 'Pending', stage: 'Waiting for Doctor', department: 'Pediatrics', waitTime: '35 min' },
    { name: 'Robert Wilson', age: 67, status: 'Active', stage: 'Pharmacy', department: 'Neurology', waitTime: '5 min' },
    { name: 'Sarah Johnson', age: 28, status: 'Emergency', stage: 'Triage', department: 'Emergency', waitTime: '0 min', isEmergency: true },
  ];

  // Simple bar chart renderer
  const renderBarChart = (data: any[], keyField: string, valueField: string, color: string) => {
    const maxValue = Math.max(...data.map(item => item[valueField]));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm text-gray-600 truncate">{item[keyField]}</div>
            <div className="flex-1 ml-2">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`bg-${color}-500 h-2.5 rounded-full`} 
                  style={{ width: `${(item[valueField] / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="ml-2 w-12 text-sm text-gray-600 text-right">{item[valueField]}</div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart renderer
  const renderLineChart = (data: any[], dateField: string, valueField: string, color: string) => {
    const maxValue = Math.max(...data.map(item => item[valueField]));
    const minValue = Math.min(...data.map(item => item[valueField]));
    const range = maxValue - minValue;
    const padding = range * 0.1;
    
    const chartHeight = 100;
    const chartWidth = 300;
    
    const getX = (index: number) => (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => chartHeight - ((value - minValue + padding) / (range + padding * 2)) * chartHeight;
    
    const points = data.map((item, index) => ({
      x: getX(index),
      y: getY(item[valueField])
    }));
    
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    return (
      <div className="mt-4">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line 
              key={ratio}
              x1="0" 
              y1={chartHeight * ratio} 
              x2={chartWidth} 
              y2={chartHeight * ratio} 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
          ))}
          
          {/* Line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke={`var(--color-${color}-500)`} 
            strokeWidth="2"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle 
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={`var(--color-${color}-500)`}
            />
          ))}
        </svg>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.map((item, index) => (
            <div key={index}>
              {new Date(item[dateField]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {hospital ? `${hospital.name} Dashboard` : 'Dashboard'}
        </h1>
        <div className="flex space-x-3">
          <Link to="/patients/search" className="btn btn-outline flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Find Patient
          </Link>
          <Link to="/patients/register" className="btn btn-primary flex items-center">
            <Users className="h-5 w-5 mr-2" />
            New Patient
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="h-6 w-6 text-primary-500" />}
          color="primary"
          change={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Appointments Today"
          value={stats.appointmentsToday}
          icon={<Calendar className="h-6 w-6 text-secondary-500" />}
          color="secondary"
          change={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Active Consultations"
          value={stats.activeConsultations}
          icon={<Stethoscope className="h-6 w-6 text-accent-500" />}
          color="accent"
        />
        <StatCard
          title="Pending Lab Results"
          value={stats.pendingLabResults}
          icon={<Microscope className="h-6 w-6 text-warning-500" />}
          color="warning"
          change={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Inpatients"
          value={stats.pharmacyOrders}
          icon={<BedDouble className="h-6 w-6 text-success-500" />}
          color="success"
        />
        <StatCard
          title="Emergency Cases"
          value={stats.emergencyCases}
          icon={<AlertTriangle className="h-6 w-6 text-error-500" />}
          color="error"
        />
      </div>
      
      <div className="card overflow-hidden">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Active Patients</h2>
          <Link to="/patients" className="text-sm text-primary-600 hover:text-primary-800">
            View All Patients
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
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
              {recentPatients.map((patient, index) => (
                <PatientTableRow
                  key={index}
                  name={patient.name}
                  age={patient.age}
                  status={patient.status}
                  stage={patient.stage}
                  department={patient.department}
                  waitTime={patient.waitTime}
                  isEmergency={patient.isEmergency}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">5</span> of <span className="font-medium">25</span> patients
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-outline py-1 px-3">Previous</button>
              <button className="btn btn-outline py-1 px-3">Next</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simple Analytics Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Patients by Department</h2>
          </div>
          <div className="card-body p-6">
            {renderBarChart(analyticsData.patientsByDepartment, 'department', 'count', 'primary')}
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Appointments Trend</h2>
          </div>
          <div className="card-body p-6">
            {renderLineChart(analyticsData.appointmentsTrend, 'date', 'count', 'secondary')}
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Revenue by Service</h2>
          </div>
          <div className="card-body p-6">
            {renderBarChart(analyticsData.revenueByService, 'service', 'amount', 'success')}
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Analytics Overview</h2>
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-primary-500 mr-1" />
              <span className="text-sm text-primary-600">Simple Analytics</span>
            </div>
          </div>
          <div className="card-body p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Patient Visits</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                  <span className="text-sm font-medium text-success-600">+12%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-secondary-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Consultations</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                  <span className="text-sm font-medium text-success-600">+8%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-warning-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Lab Tests</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                  <span className="text-sm font-medium text-success-600">+15%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-success-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                  <span className="text-sm font-medium text-success-600">+10%</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link to="/analytics" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
                  View detailed analytics
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/consultations" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary-100">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Consultations</h3>
              <p className="text-sm text-gray-500">View patient consultations</p>
            </div>
          </div>
        </Link>

        <Link to="/laboratory" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-warning-100">
              <Flask className="h-6 w-6 text-warning-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Laboratory</h3>
              <p className="text-sm text-gray-500">View lab test results</p>
            </div>
          </div>
        </Link>

        <Link to="/pharmacy" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-success-100">
              <Pill className="h-6 w-6 text-success-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pharmacy</h3>
              <p className="text-sm text-gray-500">Manage prescriptions</p>
            </div>
          </div>
        </Link>

        <Link to="/appointments" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-accent-100">
              <Calendar className="h-6 w-6 text-accent-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
              <p className="text-sm text-gray-500">Schedule appointments</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;