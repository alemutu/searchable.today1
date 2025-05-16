import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveData, fetchData, deleteData } from '../storage';
import { useNotificationStore } from '../store';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medical_info?: {
    allergies?: {
      allergen: string;
      reaction: string;
      severity: string;
    }[];
    chronicConditions?: string[];
    currentMedications?: {
      name: string;
      dosage: string;
      frequency: string;
    }[];
    bloodType?: string;
    smoker?: boolean;
    alcoholConsumption?: string;
  };
  status: string;
  current_flow_step: string | null;
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotificationStore();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData<Patient[]>('patients');
      setPatients(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatient = useCallback(async (id: string) => {
    try {
      const patient = await fetchData<Patient>('patients', id);
      return patient;
    } catch (err) {
      console.error(`Error fetching patient ${id}:`, err);
      throw err;
    }
  }, []);

  const createPatient = useCallback(async (patientData: Omit<Patient, 'id'>) => {
    try {
      const newPatient: Patient = {
        ...patientData,
        id: uuidv4(),
        status: patientData.status || 'active',
        current_flow_step: patientData.current_flow_step || 'registration'
      };
      
      const savedPatient = await saveData<Patient>('patients', newPatient);
      
      addNotification({
        message: `Patient ${savedPatient.first_name} ${savedPatient.last_name} registered successfully`,
        type: 'success'
      });
      
      return savedPatient;
    } catch (err) {
      console.error('Error creating patient:', err);
      addNotification({
        message: `Failed to register patient: ${(err as Error).message}`,
        type: 'error'
      });
      throw err;
    }
  }, [addNotification]);

  const updatePatient = useCallback(async (id: string, patientData: Partial<Patient>) => {
    try {
      // First get the current patient data
      const currentPatient = await getPatient(id);
      if (!currentPatient) {
        throw new Error('Patient not found');
      }
      
      // Merge the current data with the updates
      const updatedPatient = {
        ...currentPatient,
        ...patientData
      };
      
      const savedPatient = await saveData<Patient>('patients', updatedPatient, id);
      
      addNotification({
        message: `Patient ${savedPatient.first_name} ${savedPatient.last_name} updated successfully`,
        type: 'success'
      });
      
      return savedPatient;
    } catch (err) {
      console.error(`Error updating patient ${id}:`, err);
      addNotification({
        message: `Failed to update patient: ${(err as Error).message}`,
        type: 'error'
      });
      throw err;
    }
  }, [getPatient, addNotification]);

  const deletePatient = useCallback(async (id: string) => {
    try {
      await deleteData('patients', id);
      
      addNotification({
        message: 'Patient deleted successfully',
        type: 'success'
      });
      
      return true;
    } catch (err) {
      console.error(`Error deleting patient ${id}:`, err);
      addNotification({
        message: `Failed to delete patient: ${(err as Error).message}`,
        type: 'error'
      });
      throw err;
    }
  }, [addNotification]);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
  };
}