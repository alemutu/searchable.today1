import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  Pill, 
  ClipboardList, 
  CheckCircle, 
  ArrowLeft 
} from 'lucide-react';

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
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  department: {
    name: string;
  };
}

const ConsultationDetails: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId, hospital]);

  const fetchConsultation = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(id, first_name, last_name),
          doctor:profiles!doctor_id(id, first_name, last_name),
          department:departments(name)
        `)
        .eq('id', consultationId)
        .single();

      if (error) throw error;
      setConsultation(data);
    } catch (error) {
      console.error('Error fetching consultation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Consultation not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/consultations')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Consultation Details</h1>
      </div>

      {/* Patient and Doctor Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
          </div>
          <p className="text-gray-700">
            <span className="font-medium">Name:</span> {consultation.patient.first_name} {consultation.patient.last_name}
          </p>
          <p className="text-gray-700 mt-2">
            <a href={`/patients/${consultation.patient.id}`} className="text-primary-600 hover:text-primary-800">
              View Patient Record
            </a>
          </p>
        </div>

        <div>
          <div className="flex items-center mb-4">
            <Stethoscope className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Doctor Information</h2>
          </div>
          <p className="text-gray-700">
            <span className="font-medium">Doctor:</span> Dr. {consultation.doctor.first_name} {consultation.doctor.last_name}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Department:</span> {consultation.department.name}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Date:</span> {new Date(consultation.consultation_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Consultation Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <div className="flex items-center mb-4">
            <ClipboardList className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Consultation Notes</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Chief Complaint</h3>
              <p className="mt-1 text-gray-900">{consultation.chief_complaint}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Diagnosis</h3>
              <p className="mt-1 text-gray-900">{consultation.diagnosis}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Treatment Plan</h3>
              <p className="mt-1 text-gray-900">{consultation.treatment_plan}</p>
            </div>
            
            {consultation.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Additional Notes</h3>
                <p className="mt-1 text-gray-900">{consultation.notes}</p>
              </div>
            )}
            
            {consultation.medical_certificate && (
              <div className="flex items-center mt-4">
                <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                <span className="text-success-700">Medical Certificate Issued</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescriptions */}
      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Pill className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Prescriptions</h2>
          </div>
          
          <div className="space-y-4">
            {consultation.prescriptions.map((prescription, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-900">{prescription.medication}</h3>
                  <span className="text-sm text-gray-500">Dosage: {prescription.dosage}</span>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Frequency:</span> {prescription.frequency}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {prescription.duration}
                  </div>
                </div>
                {prescription.instructions && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Instructions:</span> {prescription.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => window.print()}
          className="btn btn-outline flex items-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          Print Report
        </button>
      </div>
    </div>
  );
};

export default ConsultationDetails;