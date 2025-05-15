import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, Globe, MapPin, User, Lock, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Box, CreditCard, Calendar, Save } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { hospitalOnboardingApi } from '../lib/api';
import { isValidEmail, isStrongPassword, generateSecurePassword } from '../lib/security';

interface HospitalData {
  hospitalProfile: {
    name: string;
    subdomain: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  adminSetup: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    sendCredentials: boolean;
  };
  moduleSelection: {
    outpatient: string[];
    inpatient: string[];
    shared: string[];
    addons: string[];
  };
  pricingPlan: {
    plan: string;
  };
  licenseDetails: {
    startDate: string;
    type: 'monthly' | 'yearly' | 'lifetime';
    autoRenew: boolean;
    notes: string;
  };
}

const HospitalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [formData, setFormData] = useState<HospitalData>({
    hospitalProfile: {
      name: '',
      subdomain: '',
      address: '',
      phone: '',
      email: '',
      contactPerson: ''
    },
    adminSetup: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      sendCredentials: true
    },
    moduleSelection: {
      outpatient: ['patient_management', 'appointment_scheduling', 'billing', 'pharmacy', 'laboratory'],
      inpatient: [],
      shared: ['reporting', 'user_management'],
      addons: []
    },
    pricingPlan: {
      plan: 'standard'
    },
    licenseDetails: {
      startDate: new Date().toISOString().split('T')[0],
      type: 'monthly',
      autoRenew: true,
      notes: ''
    }
  });
  
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const generatedPassword = generateSecurePassword();
    setFormData(prevData => ({
      ...prevData,
      adminSetup: {
        ...prevData.adminSetup,
        password: generatedPassword,
        confirmPassword: generatedPassword
      }
    }));
  }, []);

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const checkSubdomainAvailability = async (subdomain: string) => {
    try {
      setIsCheckingSubdomain(true);
      const response = await hospitalOnboardingApi.checkSubdomain(subdomain);
      
      if (response && typeof response.available === 'boolean') {
        setSubdomainAvailable(response.available);
      } else {
        console.error('Invalid response format from subdomain check');
        setSubdomainAvailable(null);
      }
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  // Rest of the component code remains unchanged...
}

export default HospitalOnboarding;