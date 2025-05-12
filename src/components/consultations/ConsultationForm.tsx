import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { FileText, Plus, Trash2 } from 'lucide-react';

interface ConsultationFormData {
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  medicalCertificate: boolean;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
}

const ConsultationForm: React.FC = () => {
  const { hospital, user } = useAuthStore();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [prescriptionCount, setPrescriptionCount] = useState(1);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConsultationFormData>({
    defaultValues: {
      prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      medicalCertificate: false
    }
  });

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (!hospital || !user || !patientId) throw new Error('Missing required data');

      // Create consultation record
      const { error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          hospital_id: hospital.id,
          consultation_date: new Date().toISOString(),
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatment_plan: data.treatmentPlan,
          prescriptions: data.prescriptions,
          notes: data.notes,
          medical_certificate: data.medicalCertificate,
          department_id: user.department_id
        });

      if (consultationError) throw consultationError;

      // Update patient's current flow step
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          current_flow_step: 'post_consultation'
        })
        .eq('id', patientId);

      if (patientError) throw patientError;

      navigate('/patients');
    } catch (error: any) {
      console.error('Error submitting consultation:', error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Chief Complaint and Diagnosis */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Consultation Details</h2>
          
          <div>
            <label htmlFor="chiefComplaint" className="form-label">Chief Complaint</label>
            <textarea
              id="chiefComplaint"
              rows={3}
              {...register('chiefComplaint', { required: 'Chief complaint is required' })}
              className="form-input"
              placeholder="Patient's main complaint"
            />
            {errors.chiefComplaint && (
              <p className="form-error">{errors.chiefComplaint.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="diagnosis" className="form-label">Diagnosis</label>
            <textarea
              id="diagnosis"
              rows={3}
              {...register('diagnosis', { required: 'Diagnosis is required' })}
              className="form-input"
              placeholder="Clinical diagnosis"
            />
            {errors.diagnosis && (
              <p className="form-error">{errors.diagnosis.message}</p>
            )}
          </div>
        </div>

        {/* Treatment Plan */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Treatment Plan</h2>
          
          <div>
            <label htmlFor="treatmentPlan" className="form-label">Treatment Plan</label>
            <textarea
              id="treatmentPlan"
              rows={4}
              {...register('treatmentPlan', { required: 'Treatment plan is required' })}
              className="form-input"
              placeholder="Detailed treatment plan"
            />
            {errors.treatmentPlan && (
              <p className="form-error">{errors.treatmentPlan.message}</p>
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Prescriptions</h2>
            <button
              type="button"
              onClick={() => setPrescriptionCount(prev => prev + 1)}
              className="btn btn-outline inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </button>
          </div>
          
          {Array.from({ length: prescriptionCount }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Medication #{index + 1}</h3>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrescriptionCount(prev => prev - 1)}
                    className="text-error-600 hover:text-error-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Medication Name</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.medication` as const, {
                      required: 'Medication name is required'
                    })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Dosage</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.dosage` as const, {
                      required: 'Dosage is required'
                    })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Frequency</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.frequency` as const, {
                      required: 'Frequency is required'
                    })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    {...register(`prescriptions.${index}.duration` as const, {
                      required: 'Duration is required'
                    })}
                    className="form-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Special Instructions</label>
                  <textarea
                    {...register(`prescriptions.${index}.instructions` as const)}
                    className="form-input"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Notes */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
          
          <div>
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              className="form-input"
              placeholder="Any additional notes or observations"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="medicalCertificate"
              {...register('medicalCertificate')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="medicalCertificate" className="ml-2 flex items-center text-sm font-medium text-gray-700">
              <FileText className="h-5 w-5 mr-1" />
              Issue Medical Certificate
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Consultation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;