import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useOfflineStatus } from '../../lib/hooks/useOfflineStatus';
import { Users, Calendar, FileText, Activity, Pill, DollarSign, Menu, X, Bell, Settings, LayoutDashboard, BedDouble, FlaskRound as Flask, Microscope, Heart, Baby, UserRound, Syringe, Bone, Bluetooth as Tooth, Eye, ActivitySquare, Stethoscope, ClipboardList, Cog, Building2, Users2, Wrench, CreditCard, LifeBuoy, ChevronDown, ChevronRight, Box, Home, Search, LayoutList, WifiOff, Plus } from 'lucide-react';
import { syncAllData } from '../../lib/storage';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [departmentsOpen, setDepartmentsOpen] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(true);
  const { isOffline } = useOfflineStatus();
  const location = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSync = async () => {
    await syncAllData();
    alert('Data synchronized successfully!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow text-gray-700 focus:outline-none"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-10 w-64 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 bg-white border-r border-gray-200 overflow-y-auto`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-semibold text-gray-900">HMS</span>
            </Link>
            <button 
              onClick={toggleSidebar} 
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {isOffline && (
            <div className="mt-2 py-2 px-3 bg-warning-50 rounded-md flex items-center">
              <WifiOff className="h-4 w-4 text-warning-500 mr-2" />
              <p className="text-xs font-medium text-warning-700">Offline Mode</p>
            </div>
          )}
        </div>

        <nav className="mt-4 px-4 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/dashboard' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <Home className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Dashboard
          </Link>

          <Link
            to="/reception"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/reception' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <LayoutList className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Reception
          </Link>

          <Link
            to="/patients"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/patients' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <Users className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Patients
          </Link>

          <Link
            to="/patients/search"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/patients/search' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <Search className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Patient Search
          </Link>

          <Link
            to="/triage"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/triage' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <ClipboardList className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Triage
          </Link>

          <Link
            to="/appointments"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/appointments' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <Calendar className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Appointments
          </Link>

          <Link
            to="/inpatients"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
              location.pathname === '/inpatients' ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <BedDouble className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
            Inpatients
          </Link>

          {/* Services Section */}
          <div className="pt-4 pb-2">
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="w-full flex items-center justify-between px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-500"
            >
              Services
              {servicesOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {servicesOpen && (
            <div className="space-y-1">
              <Link
                to="/laboratory"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Flask className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Laboratory
              </Link>

              <Link
                to="/radiology"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Microscope className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Radiology
              </Link>

              <Link
                to="/pharmacy"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Pill className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Pharmacy
              </Link>

              <Link
                to="/billing"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <DollarSign className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Billing
              </Link>
            </div>
          )}

          {/* Departments Section */}
          <div className="pt-4 pb-2">
            <button
              onClick={() => setDepartmentsOpen(!departmentsOpen)}
              className="w-full flex items-center justify-between px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-500"
            >
              Departments
              {departmentsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {departmentsOpen && (
            <div className="space-y-1">
              <Link
                to="/departments/general"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Stethoscope className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                General Medicine
              </Link>

              <Link
                to="/departments/cardiology"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Heart className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Cardiology
              </Link>

              <Link
                to="/departments/pediatrics"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Baby className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Pediatrics
              </Link>

              <Link
                to="/departments/gynecology"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <UserRound className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Gynecology & Obstetrics
              </Link>

              <Link
                to="/departments/surgical"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Syringe className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Surgical
              </Link>

              <Link
                to="/departments/orthopedic"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Bone className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Orthopedic
              </Link>

              <Link
                to="/departments/dental"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Tooth className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Dental
              </Link>

              <Link
                to="/departments/eye"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <Eye className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Eye Clinic
              </Link>

              <Link
                to="/departments/physiotherapy"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group"
              >
                <ActivitySquare className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Physiotherapy
              </Link>
            </div>
          )}

          {/* Settings Section */}
          <div className="pt-4 pb-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-500"
            >
              Settings
              {settingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {settingsOpen && (
            <div className="space-y-1">
              <Link
                to="/settings/departments"
                className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
                  location.pathname === '/settings/departments' ? 'bg-primary-50 text-primary-700' : ''
                }`}
              >
                <Building2 className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Departments
              </Link>

              <Link
                to="/settings/users"
                className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
                  location.pathname === '/settings/users' ? 'bg-primary-50 text-primary-700' : ''
                }`}
              >
                <Users2 className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                User Management
              </Link>

              <Link
                to="/settings/clinical"
                className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
                  location.pathname === '/settings/clinical' ? 'bg-primary-50 text-primary-700' : ''
                }`}
              >
                <Stethoscope className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Clinical Settings
              </Link>

              <Link
                to="/settings/billing"
                className={`flex items-center px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md group ${
                  location.pathname === '/settings/billing' ? 'bg-primary-50 text-primary-700' : ''
                }`}
              >
                <CreditCard className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500" />
                Billing Settings
              </Link>
            </div>
          )}
        </nav>

        <div className="mt-auto p-4 space-y-2">
          {!isOffline && (
            <button
              onClick={handleSync}
              className="flex items-center w-full px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-md group"
            >
              <Activity className="mr-3 h-5 w-5 text-primary-500" />
              Sync Data
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              HMS Dashboard
            </h1>
            
            <div className="flex items-center space-x-4">
              {isOffline && (
                <div className="flex items-center text-warning-600">
                  <WifiOff className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Offline Mode</span>
                </div>
              )}
              
              <button className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  U
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  User
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-5 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;