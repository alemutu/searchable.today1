import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientDetails from './pages/PatientDetails';
import PatientRegistration from './pages/PatientRegistration';
import PatientWorkflow from './pages/PatientWorkflow';
import PatientConsultation from './pages/PatientConsultation';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import NotificationToast from './components/common/NotificationToast';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/:patientId" element={<PatientDetails />} />
          <Route path="patient-registration" element={<PatientRegistration />} />
          <Route path="patient-workflow/:patientId" element={<PatientWorkflow />} />
          <Route path="patient-consultation/:patientId" element={<PatientConsultation />} />
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