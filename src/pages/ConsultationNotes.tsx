import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface Consultation {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  doctor: {
    id: string;
    first_name: string;
    last_name: string;
  };
  consultation_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes: string | null;
  medical_certificate: boolean;
}

const ConsultationNotes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchConsultations();
  }, [hospital]);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          chief_complaint,
          diagnosis,
          treatment_plan,
          notes,
          medical_certificate,
          patient:patient_id(id, first_name, last_name),
          doctor:doctor_id(id, first_name, last_name)
        `)
        .eq('hospital_id', hospital?.id)
        .order('consultation_date', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    const patientName = `${consultation.patient.first_name} ${consultation.patient.last_name}`.toLowerCase();
    const doctorName = `${consultation.doctor.first_name} ${consultation.doctor.last_name}`.toLowerCase();
    const diagnosis = consultation.diagnosis.toLowerCase();
    return patientName.includes(searchTerm.toLowerCase()) ||
           doctorName.includes(searchTerm.toLowerCase()) ||
           diagnosis.includes(searchTerm.toLowerCase());
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
        <h1 className="text-2xl font-bold text-gray-900">Consultation Notes</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Consultations</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{consultations.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Consultations</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {consultations.filter(c => 
                  new Date(c.consultation_date).toDateString() === new Date().toDateString()
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
              <p className="text-sm font-medium text-gray-500">Medical Certificates</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {consultations.filter(c => c.medical_certificate).length}
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
              placeholder="Search by patient, doctor, or diagnosis..."
            />
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
                  Diagnosis
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.map((consultation) => (
                <tr key={consultation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {consultation.patient.first_name} {consultation.patient.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Dr. {consultation.doctor.first_name} {consultation.doctor.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(consultation.consultation_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {consultation.diagnosis}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/consultations/${consultation.id}`} className="text-primary-600 hover:text-primary-900">
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsultationNotes;