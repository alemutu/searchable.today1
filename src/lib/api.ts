import { supabase } from './supabase';

/**
 * Base URL for Supabase Edge Functions
 * This will be used to construct the full URL for each function
 */
const getEdgeFunctionBaseUrl = () => {
  return `${import.meta.env.VITE_SUPABASE_URL || 'https://cyxlbkzxaoonahfcrfua.supabase.co'}/functions/v1`;
};

/**
 * Get headers for Supabase Edge Function requests
 * This includes the Authorization header with the anonymous key
 */
const getHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eGxia3p4YW9vbmFoZmNyZnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTc4NDMsImV4cCI6MjA2Mjg3Mzg0M30.t0TahBAb4ORolqqK_KBFfRg7SXKHlJ8c4H3S-TPw4_w'}`,
    ...(data.session?.access_token 
      ? { 'Authorization': `Bearer ${data.session.access_token}` }
      : {})
  };
};

/**
 * Hospital Onboarding API
 * Functions for managing hospital onboarding process
 */
export const hospitalOnboardingApi = {
  /**
   * Create a new hospital with all related resources
   */
  createHospital: async (data: {
    hospitalProfile: {
      name: string;
      subdomain: string;
      address: string;
      phone: string;
      email: string;
      contactPerson: string;
    };
    adminSetup: {
      email?: string;
      firstName?: string;
      lastName?: string;
      password: string;
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
      notes?: string;
    };
  }) => {
    const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/hospitals`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create hospital');
    }

    return response.json();
  },

  /**
   * Get all hospitals
   */
  getHospitals: async () => {
    const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/hospitals`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch hospitals');
    }

    return response.json();
  },

  /**
   * Get hospital by ID
   */
  getHospital: async (id: string) => {
    const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/hospitals/${id}`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch hospital');
    }

    return response.json();
  },

  /**
   * Check if a subdomain is available
   */
  checkSubdomain: async (subdomain: string) => {
    const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/check-subdomain/${subdomain}`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check subdomain');
    }

    return response.json();
  }
};

/**
 * License Management API
 * Functions for managing hospital licenses
 */
export const licenseApi = {
  /**
   * Get all licenses
   */
  getLicenses: async () => {
    const url = `${getEdgeFunctionBaseUrl()}/license-management/licenses`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch licenses');
    }

    return response.json();
  },

  /**
   * Create a new license
   */
  createLicense: async (data: {
    hospital_id: string;
    plan_id: string;
  }) => {
    const url = `${getEdgeFunctionBaseUrl()}/license-management/licenses`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create license');
    }

    return response.json();
  },

  /**
   * Update license status
   */
  updateLicenseStatus: async (id: string, status: 'active' | 'suspended' | 'cancelled') => {
    const url = `${getEdgeFunctionBaseUrl()}/license-management/licenses/${id}/status`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update license status');
    }

    return response.json();
  },

  /**
   * Get license usage metrics
   */
  getLicenseMetrics: async () => {
    const url = `${getEdgeFunctionBaseUrl()}/license-management/metrics`;
    const headers = await getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch license metrics');
    }

    return response.json();
  }
};