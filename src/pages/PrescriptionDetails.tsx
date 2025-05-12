import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { 
  Pill, 
  User, 
  Calendar, 
  Stethoscope, 
  Clock, 
  ArrowLeft,
  FileText
} from 'lucide-react';

interface Prescription {
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
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  pharmacy_status: string;
  pharmacy_id: string | null;
}

const PrescriptionDetails: React.FC = () => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    }
  }, [prescriptionId, hospital]);

  const fetchPrescription = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          prescriptions,
          pharmacy_status,
          pharmacy_id,
          patient:patients(id, first_name, last_name),
          doctor:profiles!doctor_id(id, first_name, last_name)
        `)
        .eq('id', prescriptionId)
        .single();

      if (error) throw error;
      setPrescription(data);
    } catch (error) {
      console.error('Error fetching prescription:', error);
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

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Prescription not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/prescriptions')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Prescription Details</h1>
      </div>

      {/* Patient and Doctor Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
          </div>
          <p className="text-gray-700">
            <span className="font-medium">Name:</span> {prescription.patient.first_name} {prescription.patient.last_name}
          </p>
          <p className="text-gray-700 mt-2">
            <a href={`/patients/${prescription.patient.id}`} className="text-primary-600 hover:text-primary-800">
              View Patient Record
            </a>
          </p>
        </div>

        <div>
          <div className="flex items-center mb-4">
            <Stethoscope className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Prescriber Information</h2>
          </div>
          <p className="text-gray-700">
            <span className="font-medium">Doctor:</span> Dr. {prescription.doctor.first_name} {prescription.doctor.last_name}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Date:</span> {new Date(prescription.consultation_date).toLocaleDateString()}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Status:</span>{' '}
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(prescription.pharmacy_status || 'pending')}`}>
              {(prescription.pharmacy_status || 'Pending').charAt(0).toUpperCase() + (prescription.pharmacy_status || 'pending').slice(1)}
            </span>
          </p>
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Pill className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Medications</h2>
        </div>
        
        <div className="space-y-4">
          {prescription.prescriptions.map((med, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-900">{med.medication}</h3>
                <span className="text-sm text-gray-500">Dosage: {med.dosage}</span>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Frequency:</span> {med.frequency}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {med.duration}
                </div>
              </div>
              {med.instructions && (
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Instructions:</span> {med.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pharmacy Information */}
      {prescription.pharmacy_id && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Pharmacy Information</h2>
          </div>
          
          <p className="text-gray-700">
            <span className="font-medium">Pharmacy Order ID:</span> {prescription.pharmacy_id}
          </p>
          <p className="text-gray-700 mt-2">
            <a href={`/pharmacy/${prescription.pharmacy_id}`} className="text-primary-600 hover:text-primary-800">
              View Pharmacy Order
            </a>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => window.print()}
          className="btn btn-outline flex items-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          Print Prescription
        </button>
        
        {!prescription.pharmacy_id && (
          <button
            onClick={() => {
              // Logic to send to pharmacy would go here
              alert('Prescription sent to pharmacy');
            }}
            className="btn btn-primary flex items-center"
          >
            <Pill className="h-5 w-5 mr-2" />
            Send to Pharmacy
          </button>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetails;