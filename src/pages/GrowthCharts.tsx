import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Ruler, Weight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VitalSign {
  id: string;
  recorded_at: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
}

const GrowthCharts: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'height' | 'weight' | 'bmi'>('height');

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
      fetchVitalSigns();
    }
  }, [hospital, patientId]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, gender')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const fetchVitalSigns = async () => {
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('id, recorded_at, height, weight, bmi')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
    } finally {
      setIsLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Simple chart rendering using HTML/CSS
  const renderChart = () => {
    if (vitalSigns.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available for chart</p>
        </div>
      );
    }

    const chartData = vitalSigns.map(record => {
      return {
        date: new Date(record.recorded_at),
        height: record.height,
        weight: record.weight,
        bmi: record.bmi
      };
    });

    // Get min and max values for scaling
    let minValue = 0;
    let maxValue = 0;
    
    if (activeTab === 'height') {
      minValue = Math.min(...chartData.filter(d => d.height !== null).map(d => d.height || 0)) * 0.9;
      maxValue = Math.max(...chartData.filter(d => d.height !== null).map(d => d.height || 0)) * 1.1;
    } else if (activeTab === 'weight') {
      minValue = Math.min(...chartData.filter(d => d.weight !== null).map(d => d.weight || 0)) * 0.9;
      maxValue = Math.max(...chartData.filter(d => d.weight !== null).map(d => d.weight || 0)) * 1.1;
    } else {
      minValue = Math.min(...chartData.filter(d => d.bmi !== null).map(d => d.bmi || 0)) * 0.9;
      maxValue = Math.max(...chartData.filter(d => d.bmi !== null).map(d => d.bmi || 0)) * 1.1;
    }

    // Ensure we have reasonable min/max values
    if (minValue === maxValue) {
      minValue = minValue * 0.8;
      maxValue = maxValue * 1.2;
    }

    const getDataPoints = () => {
      if (activeTab === 'height') {
        return chartData.filter(d => d.height !== null).map(d => ({
          date: d.date,
          value: d.height
        }));
      } else if (activeTab === 'weight') {
        return chartData.filter(d => d.weight !== null).map(d => ({
          date: d.date,
          value: d.weight
        }));
      } else {
        return chartData.filter(d => d.bmi !== null).map(d => ({
          date: d.date,
          value: d.bmi
        }));
      }
    };

    const dataPoints = getDataPoints();
    
    if (dataPoints.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No {activeTab} data available</p>
        </div>
      );
    }

    const getYPosition = (value: number | null) => {
      if (value === null) return 0;
      return 200 - ((value - minValue) / (maxValue - minValue) * 180);
    };

    const getXPosition = (index: number, total: number) => {
      return (index / (total - 1)) * 800;
    };

    const pathData = dataPoints.map((point, index) => {
      const x = getXPosition(index, dataPoints.length);
      const y = getYPosition(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'height' ? 'Height (cm)' : 
             activeTab === 'weight' ? 'Weight (kg)' : 
             'BMI'} Over Time
          </h3>
        </div>
        
        <div className="relative h-64 w-full overflow-x-auto">
          <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <g key={i}>
                <line 
                  x1="0" 
                  y1={200 - ratio * 180} 
                  x2="800" 
                  y2={200 - ratio * 180} 
                  stroke="#e5e7eb" 
                  strokeWidth="1"
                />
                <text 
                  x="5" 
                  y={200 - ratio * 180 - 5} 
                  fontSize="10" 
                  fill="#6b7280"
                >
                  {Math.round(minValue + ratio * (maxValue - minValue))}
                </text>
              </g>
            ))}
            
            {/* Data line */}
            <path 
              d={pathData} 
              fill="none" 
              stroke={
                activeTab === 'height' ? '#0891b2' : 
                activeTab === 'weight' ? '#16a34a' : 
                '#f97316'
              } 
              strokeWidth="2"
            />
            
            {/* Data points */}
            {dataPoints.map((point, index) => (
              <circle 
                key={index}
                cx={getXPosition(index, dataPoints.length)}
                cy={getYPosition(point.value)}
                r="4"
                fill={
                  activeTab === 'height' ? '#0891b2' : 
                  activeTab === 'weight' ? '#16a34a' : 
                  '#f97316'
                }
              />
            ))}
          </svg>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {dataPoints.map((point, index) => (
              <div key={index} style={{ position: 'absolute', left: `${(index / (dataPoints.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}>
                {formatDate(point.date.toISOString())}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center">
        <button 
          onClick={() => navigate(`/patients/${patientId}`)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Growth Charts</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-gray-600">
              {calculateAge(patient.date_of_birth)} years old • {patient.gender}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            <span className="text-primary-700 font-medium">Growth Tracking</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('height')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'height'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Ruler className="h-5 w-5 mr-2" />
                Height
              </div>
            </button>
            <button
              onClick={() => setActiveTab('weight')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'weight'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Weight className="h-5 w-5 mr-2" />
                Weight
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bmi')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'bmi'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                BMI
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {renderChart()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Measurement History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Height (cm)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (kg)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BMI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vitalSigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No measurement records found
                  </td>
                </tr>
              ) : (
                vitalSigns.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.recorded_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.height !== null ? record.height : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.weight !== null ? record.weight : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.bmi !== null ? record.bmi.toFixed(1) : '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GrowthCharts;