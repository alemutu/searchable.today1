import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface PharmacyOrder {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  medications: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
    dispensed: boolean;
  }[];
  status: string;
  payment_status: string;
  is_emergency: boolean;
}

const PharmacyDispense: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const [order, setOrder] = useState<PharmacyOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dispensedMeds, setDispensedMeds] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchOrder = async () => {
      if (!hospital || !orderId) return;

      try {
        const { data, error } = await supabase
          .from('pharmacy')
          .select(`
            *,
            patient:patients(id, first_name, last_name)
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrder(data);
        
        // Initialize dispensed state
        const initialDispensed = {};
        data.medications.forEach((_, index) => {
          initialDispensed[index] = false;
        });
        setDispensedMeds(initialDispensed);
      } catch (error) {
        console.error('Error fetching pharmacy order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [hospital, orderId]);

  const handleDispense = async () => {
    if (!order || !user) return;

    try {
      // Update pharmacy order
      const { error } = await supabase
        .from('pharmacy')
        .update({
          status: 'dispensed',
          dispensed_by: user.id,
          dispensed_at: new Date().toISOString(),
          medications: order.medications.map((med, index) => ({
            ...med,
            dispensed: dispensedMeds[index]
          }))
        })
        .eq('id', order.id);

      if (error) throw error;

      navigate('/pharmacy');
    } catch (error) {
      console.error('Error dispensing medications:', error);
    }
  };

  const toggleDispensed = (index: number) => {
    setDispensedMeds(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const allDispensed = order?.medications.every((_, index) => dispensedMeds[index]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dispense Medications</h1>
        {order.is_emergency && (
          <div className="flex items-center text-error-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">Emergency Case</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
            <p className="mt-1 text-gray-600">
              {order.patient.first_name} {order.patient.last_name}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">Payment Status</h2>
            <span className={`mt-1 px-2 inline-flex text-sm font-semibold rounded-full ${
              order.payment_status === 'paid' ? 'bg-success-100 text-success-800' :
              order.payment_status === 'pending' ? 'bg-warning-100 text-warning-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Medications</h2>
          
          <div className="space-y-4">
            {order.medications.map((medication, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  dispensedMeds[index] ? 'bg-success-50 border-success-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{medication.medication}</h3>
                    <p className="text-sm text-gray-600">
                      Dosage: {medication.dosage}
                    </p>
                    <p className="text-sm text-gray-600">
                      Frequency: {medication.frequency}
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: {medication.duration}
                    </p>
                    {medication.instructions && (
                      <p className="text-sm text-gray-600">
                        Instructions: {medication.instructions}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleDispensed(index)}
                    className={`p-2 rounded-full ${
                      dispensedMeds[index]
                        ? 'bg-success-100 text-success-600'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {Object.values(dispensedMeds).filter(Boolean).length} of {order.medications.length} medications dispensed
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/pharmacy')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDispense}
                disabled={!allDispensed || order.payment_status === 'pending'}
                className="btn btn-primary"
                title={order.payment_status === 'pending' ? 'Cannot dispense until payment is completed' : ''}
              >
                Complete Dispensing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDispense;