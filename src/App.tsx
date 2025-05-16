import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import SystemModules from './pages/SystemModules';
import PricingPlans from './pages/PricingPlans';
import Licenses from './pages/Licenses';
import SupportTickets from './pages/SupportTickets';
import DepartmentSettings from './pages/settings/DepartmentSettings';
import UserSettings from './pages/settings/UserSettings';
import ClinicalSettings from './pages/settings/ClinicalSettings';
import SystemSettings from './pages/settings/SystemSettings';
import BillingSettings from './pages/settings/BillingSettings';
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
import LabTestProcessForm from './components/laboratory/LabTestProcessForm';
import Radiology from './pages/Radiology';
import RadiologyProcessForm from './components/radiology/RadiologyProcessForm';
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
import NotificationToast from './components/common/NotificationToast';
import Reports from './pages/Reports';

// Import department pages
import GeneralMedicine from './pages/departments/GeneralMedicine';
import Cardiology from './pages/departments/Cardiology';
import Pediatrics from './pages/departments/Pediatrics';
import Gynecology from './pages/departments/Gynecology';
import Surgical from './pages/departments/Surgical';
import Orthopedic from './pages/departments/Orthopedic';
import Dental from './pages/departments/Dental';
import EyeClinic from './pages/departments/EyeClinic';
import Physiotherapy from './pages/departments/Physiotherapy';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="system-modules" element={<SystemModules />} />
          <Route path="pricing-plans" element={<PricingPlans />} />
          <Route path="licenses" element={<Licenses />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="support-settings" element={<SupportSettings />} />
          <Route path="settings/system" element={<SystemSettings />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reception" element={<ReceptionDashboard />} />
          <Route path="reports" element={<Reports />} />
          
          {/* Settings Routes */}
          <Route path="settings">
            <Route path="departments" element={<DepartmentSettings />} />
            <Route path="users" element={<UserSettings />} />
            <Route path="clinical" element={<ClinicalSettings />} />
            <Route path="billing" element={<BillingSettings />} />
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
          <Route path="laboratory/process/:testId" element={<LabTestProcessForm />} />
          <Route path="radiology" element={<Radiology />} />
          <Route path="radiology/process/:scanId" element={<RadiologyProcessForm />} />
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
          <Route path="departments/surgical" element={<Surgical />} />
          <Route path="departments/orthopedic" element={<Orthopedic />} />
          <Route path="departments/dental" element={<Dental />} />
          <Route path="departments/eye" element={<EyeClinic />} />
          <Route path="departments/physiotherapy" element={<Physiotherapy />} />
        </Route>
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Offline indicator */}
      <OfflineIndicator />
      
      {/* Notification toast */}
      <NotificationToast />
    </>
  );
};

export default App;