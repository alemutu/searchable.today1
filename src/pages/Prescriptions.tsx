import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, Pill, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Prescription {
  id: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  doctor: {
    first_name: string;
    last_name: string;
  };
  consultation_date: string;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  pharmacy_status: string;
}

const Prescriptions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchPrescriptions();
  }, [hospital]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          prescriptions,
          pharmacy_status,
          patient:patient_id(first_name, last_name),
          doctor:doctor_id(first_name, last_name)
        `)
        .not('prescriptions', 'is', null)
        .eq('hospital_id', hospital?.id)
        .order('consultation_date', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispensed':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patientName = `${prescription.patient.first_name} ${prescription.patient.last_name}`.toLowerCase();
    const doctorName = `${prescription.doctor.first_name} ${prescription.doctor.last_name}`.toLowerCase();
    const medications = prescription.prescriptions.map(p => p.medication.toLowerCase()).join(' ');
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         doctorName.includes(searchTerm.toLowerCase()) ||
                         medications.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || prescription.pharmacy_status === filterStatus;
    return matchesSearch && (matchesFilter || filterStatus === 'all');
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
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Prescriptions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{prescriptions.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <Pill className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Prescriptions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {prescriptions.filter(p => 
                  new Date(p.consultation_date).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <CheckCircle className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Pharmacy</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {prescriptions.filter(p => p.pharmacy_status === 'pending' || !p.pharmacy_status).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <AlertTriangle className="h-6 w-6 text-warning-500" />
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
              placeholder="Search by patient, doctor, or medication..."
            />
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
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
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medications
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No prescriptions found
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.patient.first_name} {prescription.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Dr. {prescription.doctor.first_name} {prescription.doctor.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(prescription.consultation_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {prescription.prescriptions.map((med, index) => (
                          <div key={index} className="flex items-center mb-1">
                            <Pill className="h-4 w-4 mr-1 text-gray-400" />
                            {med.medication} - {med.dosage}
                          </div>
                        )).slice(0, 2)}
                        {prescription.prescriptions.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{prescription.prescriptions.length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(prescription.pharmacy_status || 'pending')}`}>
                        {(prescription.pharmacy_status || 'Pending').charAt(0).toUpperCase() + (prescription.pharmacy_status || 'pending').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/prescriptions/${prescription.id}`} className="text-primary-600 hover:text-primary-900">
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

export default Prescriptions;