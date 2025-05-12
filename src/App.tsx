import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SystemModules from './pages/SystemModules';
import PricingPlans from './pages/PricingPlans';
import Licenses from './pages/Licenses';
import SupportTickets from './pages/SupportTickets';
import HospitalSettings from './pages/HospitalSettings';
import DepartmentSettings from './pages/settings/DepartmentSettings';
import UserSettings from './pages/settings/UserSettings';
import ClinicalSettings from './pages/settings/ClinicalSettings';
import SystemSettings from './pages/settings/SystemSettings';
import BillingSettings from './pages/settings/BillingSettings';
import LicenseSettings from './pages/settings/LicenseSettings';
import SupportSettings from './pages/settings/SupportSettings';
import PatientList from './pages/PatientList';
import PatientRegistrationForm from './components/patients/PatientRegistrationForm';
import TriageForm from './components/triage/TriageForm';
import ConsultationForm from './components/consultations/ConsultationForm';
import PharmacyList from './pages/PharmacyList';
import PharmacyDispense from './components/pharmacy/PharmacyDispense';
import BillingList from './pages/BillingList';
import BillingDetails from './components/billing/BillingDetails';
import Triage from './pages/Triage';
import Inpatients from './pages/Inpatients';
import Laboratory from './pages/Laboratory';
import Radiology from './pages/Radiology';
import Appointments from './pages/Appointments';
import ConsultationNotes from './pages/ConsultationNotes';
import ConsultationDetails from './pages/ConsultationDetails';
import Prescriptions from './pages/Prescriptions';
import PrescriptionDetails from './pages/PrescriptionDetails';
import Immunizations from './pages/Immunizations';
import Allergies from './pages/Allergies';
import VitalSigns from './pages/VitalSigns';
import MedicalHistory from './pages/MedicalHistory';
import Documents from './pages/Documents';
import CarePlans from './pages/CarePlans';
import Referrals from './pages/Referrals';
import GrowthCharts from './pages/GrowthCharts';
import PatientSearch from './pages/PatientSearch';
import PatientDetails from './pages/PatientDetails';
import ReceptionDashboard from './pages/ReceptionDashboard';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Import department pages
import GeneralMedicine from './pages/departments/GeneralMedicine';
import Cardiology from './pages/departments/Cardiology';
import Pediatrics from './pages/departments/Pediatrics';
import Gynecology from './pages/departments/Gynecology';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : null;
};

const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reception" element={<ReceptionDashboard />} />
          <Route path="super-admin" element={<SuperAdminDashboard />} />
          <Route path="system-modules" element={<SystemModules />} />
          <Route path="pricing-plans" element={<PricingPlans />} />
          <Route path="licenses" element={<Licenses />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="support-settings" element={<SupportSettings />} />
          
          {/* Settings Routes */}
          <Route path="settings">
            <Route path="hospital" element={<HospitalSettings />} />
            <Route path="departments" element={<DepartmentSettings />} />
            <Route path="users" element={<UserSettings />} />
            <Route path="clinical" element={<ClinicalSettings />} />
            <Route path="system" element={<SystemSettings />} />
            <Route path="billing" element={<BillingSettings />} />
            <Route path="license" element={<LicenseSettings />} />
          </Route>
          
          {/* Clinical Routes */}
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/search" element={<PatientSearch />} />
          <Route path="patients/register" element={<PatientRegistrationForm />} />
          <Route path="patients/:patientId" element={<PatientDetails />} />
          <Route path="patients/:patientId/triage" element={<TriageForm />} />
          <Route path="patients/:patientId/consultation" element={<ConsultationForm />} />
          <Route path="triage" element={<Triage />} />
          <Route path="inpatients" element={<Inpatients />} />
          <Route path="laboratory" element={<Laboratory />} />
          <Route path="radiology" element={<Radiology />} />
          <Route path="pharmacy" element={<PharmacyList />} />
          <Route path="pharmacy/:orderId/dispense" element={<PharmacyDispense />} />
          <Route path="billing" element={<BillingList />} />
          <Route path="billing/:billId" element={<BillingDetails />} />
          <Route path="appointments" element={<Appointments />} />
          
          {/* Medical Records Routes */}
          <Route path="consultations" element={<ConsultationNotes />} />
          <Route path="consultations/:consultationId" element={<ConsultationDetails />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="prescriptions/:prescriptionId" element={<PrescriptionDetails />} />
          <Route path="immunizations" element={<Immunizations />} />
          <Route path="allergies" element={<Allergies />} />
          <Route path="vital-signs" element={<VitalSigns />} />
          <Route path="patients/:patientId/vital-signs" element={<VitalSigns />} />
          <Route path="medical-history" element={<MedicalHistory />} />
          <Route path="patients/:patientId/medical-history" element={<MedicalHistory />} />
          <Route path="documents" element={<Documents />} />
          <Route path="patients/:patientId/documents" element={<Documents />} />
          <Route path="care-plans" element={<CarePlans />} />
          <Route path="patients/:patientId/care-plans" element={<CarePlans />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="patients/:patientId/referrals" element={<Referrals />} />
          <Route path="patients/:patientId/growth-charts" element={<GrowthCharts />} />
          
          {/* Department Routes */}
          <Route path="departments/general" element={<GeneralMedicine />} />
          <Route path="departments/cardiology" element={<Cardiology />} />
          <Route path="departments/pediatrics" element={<Pediatrics />} />
          <Route path="departments/gynecology" element={<Gynecology />} />
          <Route path="departments/surgical" element={<div className="p-4">Surgical Department</div>} />
          <Route path="departments/orthopedic" element={<div className="p-4">Orthopedic Department</div>} />
          <Route path="departments/dental" element={<div className="p-4">Dental Department</div>} />
          <Route path="departments/eye" element={<div className="p-4">Eye Clinic Department</div>} />
          <Route path="departments/physiotherapy" element={<div className="p-4">Physiotherapy Department</div>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      {/* Offline indicator */}
      <OfflineIndicator />
    </>
  );
};

export default App;