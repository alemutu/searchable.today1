import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, Activity, Heart, Thermometer, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface VitalSign {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  recorded_at: string;
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  pain_level: number | null;
  recorded_by: {
    first_name: string;
    last_name: string;
  } | null;
}

const VitalSigns: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchVitalSigns();
  }, [hospital, patientId]);

  const fetchVitalSigns = async () => {
    try {
      let query = supabase
        .from('vital_signs')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          recorded_by:recorded_by(first_name, last_name)
        `)
        .order('recorded_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateFilter = (date: string) => {
    const recordDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    if (recordDate.toDateString() === today.toDateString()) {
      return 'today';
    } else if (recordDate.toDateString() === yesterday.toDateString()) {
      return 'yesterday';
    } else if (recordDate >= lastWeek) {
      return 'week';
    } else if (recordDate >= lastMonth) {
      return 'month';
    } else {
      return 'older';
    }
  };

  const filteredVitalSigns = vitalSigns.filter(vitalSign => {
    const patientName = `${vitalSign.patient.first_name} ${vitalSign.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesFilter = filterDate === 'all' || getDateFilter(vitalSign.recorded_at) === filterDate;
    return matchesSearch && matchesFilter;
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
        <h1 className="text-2xl font-bold text-gray-900">
          {patientId ? 'Patient Vital Signs' : 'Vital Signs Records'}
        </h1>
        <Link to={patientId ? `/patients/${patientId}/vital-signs/new` : "/vital-signs/new"} className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Record Vital Signs
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{vitalSigns.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <Activity className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Records</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {vitalSigns.filter(v => getDateFilter(v.recorded_at) === 'today').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <Thermometer className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Abnormal Readings</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {vitalSigns.filter(v => 
                  (v.temperature && (v.temperature < 36 || v.temperature > 38)) ||
                  (v.heart_rate && (v.heart_rate < 60 || v.heart_rate > 100)) ||
                  (v.blood_pressure_systolic && v.blood_pressure_systolic > 140) ||
                  (v.blood_pressure_diastolic && v.blood_pressure_diastolic > 90) ||
                  (v.oxygen_saturation && v.oxygen_saturation < 95)
                ).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-error-100">
              <Heart className="h-6 w-6 text-error-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              placeholder="Search by patient name..."
            />
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="older">Older</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heart Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Pressure
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  O₂ Sat
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVitalSigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No vital signs records found
                  </td>
                </tr>
              ) : (
                filteredVitalSigns.map((vitalSign) => (
                  <tr key={vitalSign.id} className={
                    (vitalSign.temperature && (vitalSign.temperature < 36 || vitalSign.temperature > 38)) ||
                    (vitalSign.heart_rate && (vitalSign.heart_rate < 60 || vitalSign.heart_rate > 100)) ||
                    (vitalSign.blood_pressure_systolic && vitalSign.blood_pressure_systolic > 140) ||
                    (vitalSign.blood_pressure_diastolic && vitalSign.blood_pressure_diastolic > 90) ||
                    (vitalSign.oxygen_saturation && vitalSign.oxygen_saturation < 95)
                      ? 'bg-error-50'
                      : ''
                  }>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vitalSign.patient.first_name} {vitalSign.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(vitalSign.recorded_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(vitalSign.recorded_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        vitalSign.temperature && (vitalSign.temperature < 36 || vitalSign.temperature > 38)
                          ? 'text-error-600 font-medium'
                          : 'text-gray-900'
                      }`}>
                        {vitalSign.temperature ? `${vitalSign.temperature}°C` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        vitalSign.heart_rate && (vitalSign.heart_rate < 60 || vitalSign.heart_rate > 100)
                          ? 'text-error-600 font-medium'
                          : 'text-gray-900'
                      }`}>
                        {vitalSign.heart_rate ? `${vitalSign.heart_rate} bpm` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        (vitalSign.blood_pressure_systolic && vitalSign.blood_pressure_systolic > 140) ||
                        (vitalSign.blood_pressure_diastolic && vitalSign.blood_pressure_diastolic > 90)
                          ? 'text-error-600 font-medium'
                          : 'text-gray-900'
                      }`}>
                        {vitalSign.blood_pressure_systolic && vitalSign.blood_pressure_diastolic
                          ? `${vitalSign.blood_pressure_systolic}/${vitalSign.blood_pressure_diastolic} mmHg`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        vitalSign.oxygen_saturation && vitalSign.oxygen_saturation < 95
                          ? 'text-error-600 font-medium'
                          : 'text-gray-900'
                      }`}>
                        {vitalSign.oxygen_saturation ? `${vitalSign.oxygen_saturation}%` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/vital-signs/${vitalSign.id}`} className="text-primary-600 hover:text-primary-900">
                        View Details
                      </Link>
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

export default VitalSigns;