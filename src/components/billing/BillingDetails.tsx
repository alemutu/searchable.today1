import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { DollarSign, CreditCard, Building2, Receipt, AlertTriangle } from 'lucide-react';

interface Bill {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  services: {
    name: string;
    amount: number;
    quantity: number;
  }[];
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  insurance_info: {
    provider: string;
    policy_number: string;
    coverage_percentage: number;
  } | null;
  payment_date: string | null;
}

const BillingDetails: React.FC = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuthStore();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      if (!hospital || !billId) return;

      try {
        const { data, error } = await supabase
          .from('billing')
          .select(`
            *,
            patient:patients(id, first_name, last_name)
          `)
          .eq('id', billId)
          .single();

        if (error) throw error;
        setBill(data);
        setPaymentAmount(data.total_amount - data.paid_amount);
      } catch (error) {
        console.error('Error fetching bill:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBill();
  }, [hospital, billId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePayment = async () => {
    if (!bill) return;

    setIsProcessing(true);
    try {
      const newPaidAmount = bill.paid_amount + paymentAmount;
      const newStatus = newPaidAmount >= bill.total_amount ? 'paid' : 'partial';

      const { error } = await supabase
        .from('billing')
        .update({
          paid_amount: newPaidAmount,
          payment_status: newStatus,
          payment_date: new Date().toISOString()
        })
        .eq('id', bill.id);

      if (error) throw error;
      navigate('/billing');
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Bill not found</p>
      </div>
    );
  }

  const remainingAmount = bill.total_amount - bill.paid_amount;
  const isFullyPaid = remainingAmount <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Billing Details</h1>
        <div className="flex items-center space-x-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600">Bill #{bill.id.slice(0, 8)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
            <p className="mt-1 text-gray-600">
              {bill.patient.first_name} {bill.patient.last_name}
            </p>
          </div>

          {bill.insurance_info && (
            <div>
              <h2 className="text-lg font-medium text-gray-900">Insurance Information</h2>
              <div className="mt-1 space-y-1">
                <div className="flex items-center text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  {bill.insurance_info.provider}
                </div>
                <p className="text-sm text-gray-500">
                  Policy: {bill.insurance_info.policy_number}
                </p>
                <p className="text-sm text-gray-500">
                  Coverage: {bill.insurance_info.coverage_percentage}%
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Services</h2>
          <div className="space-y-4">
            {bill.services.map((service, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {service.quantity}</p>
                  </div>
                </div>
                <p className="text-gray-900">{formatCurrency(service.amount * service.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center text-lg font-medium">
            <span>Total Amount:</span>
            <span>{formatCurrency(bill.total_amount)}</span>
          </div>
          {bill.paid_amount > 0 && (
            <div className="flex justify-between items-center text-base text-gray-600 mt-2">
              <span>Amount Paid:</span>
              <span>{formatCurrency(bill.paid_amount)}</span>
            </div>
          )}
          {remainingAmount > 0 && (
            <div className="flex justify-between items-center text-base text-error-600 mt-2">
              <span>Remaining Amount:</span>
              <span>{formatCurrency(remainingAmount)}</span>
            </div>
          )}
        </div>

        {!isFullyPaid && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="paymentAmount" className="form-label">Payment Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={remainingAmount}
                    min={0}
                    step={0.01}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || paymentAmount <= 0 || paymentAmount > remainingAmount}
                className="btn btn-primary w-full flex justify-center items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Process Payment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate('/billing')}
          className="btn btn-outline"
        >
          Back to Billing
        </button>
      </div>
    </div>
  );
};

export default BillingDetails;