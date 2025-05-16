import { supabase } from './supabase';
import { sanitizeInput, safeEncodeURIComponent, apiRateLimiter } from './security';

/**
 * Base URL for Supabase Edge Functions
 * This will be used to construct the full URL for each function
 */
const getEdgeFunctionBaseUrl = () => {
  // Use local proxy in development to avoid CORS issues
  if (import.meta.env.DEV) {
    return '/api/functions';
  }
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
};

/**
 * Get headers for Supabase Edge Function requests
 * This includes the Authorization header with the session token if available
 */
const getHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'hospital-onboarding-client'
  };
  
  // Add Authorization header if session exists
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`;
  } else {
    // For development/testing, use the anon key when no session is available
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }
  
  return headers;
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
    // Rate limit check
    const clientIp = 'client-ip'; // In a real app, this would be the client's IP
    if (!apiRateLimiter.attempt(clientIp)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Sanitize input data
    const sanitizedData = {
      hospitalProfile: {
        name: sanitizeInput(data.hospitalProfile.name),
        subdomain: sanitizeInput(data.hospitalProfile.subdomain),
        address: sanitizeInput(data.hospitalProfile.address),
        phone: sanitizeInput(data.hospitalProfile.phone),
        email: sanitizeInput(data.hospitalProfile.email),
        contactPerson: sanitizeInput(data.hospitalProfile.contactPerson),
      },
      adminSetup: {
        email: data.adminSetup.email ? sanitizeInput(data.adminSetup.email) : undefined,
        firstName: data.adminSetup.firstName ? sanitizeInput(data.adminSetup.firstName) : undefined,
        lastName: data.adminSetup.lastName ? sanitizeInput(data.adminSetup.lastName) : undefined,
        password: data.adminSetup.password, // Password should not be sanitized but should be validated
        sendCredentials: data.adminSetup.sendCredentials,
      },
      moduleSelection: {
        outpatient: data.moduleSelection.outpatient.map(m => sanitizeInput(m)),
        inpatient: data.moduleSelection.inpatient.map(m => sanitizeInput(m)),
        shared: data.moduleSelection.shared.map(m => sanitizeInput(m)),
        addons: data.moduleSelection.addons.map(m => sanitizeInput(m)),
      },
      pricingPlan: {
        plan: sanitizeInput(data.pricingPlan.plan),
      },
      licenseDetails: {
        startDate: sanitizeInput(data.licenseDetails.startDate),
        type: data.licenseDetails.type,
        autoRenew: data.licenseDetails.autoRenew,
        notes: data.licenseDetails.notes ? sanitizeInput(data.licenseDetails.notes) : undefined,
      },
    };

    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating hospital creation', sanitizedData);
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        hospital: {
          id: 'simulated-id',
          name: sanitizedData.hospitalProfile.name,
          subdomain: sanitizedData.hospitalProfile.subdomain,
          created_at: new Date().toISOString()
        },
        message: 'Hospital created successfully (simulated in dev mode)'
      };
    }

    try {
      const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/hospitals`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(sanitizedData),
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to create hospital: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  },

  /**
   * Get all hospitals
   */
  getHospitals: async () => {
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating fetching hospitals');
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        {
          id: 'simulated-id-1',
          name: 'Simulated Hospital 1',
          subdomain: 'simulated-1',
          created_at: new Date().toISOString()
        },
        {
          id: 'simulated-id-2',
          name: 'Simulated Hospital 2',
          subdomain: 'simulated-2',
          created_at: new Date().toISOString()
        }
      ];
    }

    try {
      const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/hospitals`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to fetch hospitals: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  },

  /**
   * Get hospital by ID
   */
  getHospital: async (id: string) => {
    // Validate and sanitize ID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid hospital ID format');
    }
    
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating fetching hospital', id);
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: id,
        name: 'Simulated Hospital Detail',
        subdomain: 'simulated-detail',
        created_at: new Date().toISOString(),
        address: '123 Hospital St, Medical City',
        phone: '+1 (555) 123-4567',
        email: 'contact@simulated-hospital.com'
      };
    }
    
    try {
      const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/hospitals/${id}`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to fetch hospital: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching hospital:', error);
      throw error;
    }
  },

  /**
   * Check if a subdomain is available
   */
  checkSubdomain: async (subdomain: string) => {
    // Validate subdomain format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
      throw new Error('Invalid subdomain format');
    }
    
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating subdomain check', subdomain);
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate some subdomains as taken
      const takenSubdomains = ['general', 'admin', 'test', 'demo'];
      return { available: !takenSubdomains.includes(subdomain) };
    }
    
    try {
      const url = `${getEdgeFunctionBaseUrl()}/hospital-onboarding/check-subdomain/${safeEncodeURIComponent(subdomain)}`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to check subdomain: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error checking subdomain:', error);
      throw error;
    }
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
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating fetching licenses');
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        {
          id: 'simulated-license-1',
          hospital: { id: 'hospital-1', name: 'Simulated Hospital 1' },
          plan: { id: 'plan-1', name: 'Standard Plan' },
          start_date: '2025-01-01',
          end_date: '2026-01-01',
          status: 'active',
          max_users: 10,
          current_users: 5
        },
        {
          id: 'simulated-license-2',
          hospital: { id: 'hospital-2', name: 'Simulated Hospital 2' },
          plan: { id: 'plan-2', name: 'Premium Plan' },
          start_date: '2025-02-01',
          end_date: '2026-02-01',
          status: 'active',
          max_users: 20,
          current_users: 8
        }
      ];
    }

    try {
      const url = `${getEdgeFunctionBaseUrl()}/license-management/licenses`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to fetch licenses: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }
  },

  /**
   * Create a new license
   */
  createLicense: async (data: {
    hospital_id: string;
    plan_id: string;
  }) => {
    // Validate UUIDs
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.hospital_id) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.plan_id)) {
      throw new Error('Invalid ID format');
    }
    
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating license creation', data);
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        id: 'simulated-new-license',
        hospital_id: data.hospital_id,
        plan_id: data.plan_id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        status: 'active',
        max_users: 10,
        current_users: 0
      };
    }
    
    try {
      const url = `${getEdgeFunctionBaseUrl()}/license-management/licenses`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to create license: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error creating license:', error);
      throw error;
    }
  },

  /**
   * Update license status
   */
  updateLicenseStatus: async (id: string, status: 'active' | 'suspended' | 'cancelled') => {
    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid license ID format');
    }
    
    // Validate status
    if (!['active', 'suspended', 'cancelled'].includes(status)) {
      throw new Error('Invalid status value');
    }
    
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating license status update', { id, status });
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: id,
        status: status,
        updated_at: new Date().toISOString()
      };
    }
    
    try {
      const url = `${getEdgeFunctionBaseUrl()}/license-management/licenses/${id}/status`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to update license status: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error updating license status:', error);
      throw error;
    }
  },

  /**
   * Get license usage metrics
   */
  getLicenseMetrics: async () => {
    // For development environment, simulate a successful response
    if (import.meta.env.DEV) {
      console.log('DEV MODE: Simulating license metrics');
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        total_active: 5,
        total_users: 42,
        expiring_soon: 2
      };
    }

    try {
      const url = `${getEdgeFunctionBaseUrl()}/license-management/metrics`;
      const headers = await getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection.');
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to fetch license metrics: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching license metrics:', error);
      throw error;
    }
  }
};

// Utility functions for secure API calls

/**
 * Make a secure GET request
 */
export const secureGet = async (url: string, params?: Record<string, string>): Promise<any> => {
  // Rate limit check
  const clientIp = 'client-ip'; // In a real app, this would be the client's IP
  if (!apiRateLimiter.attempt(clientIp)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Add query parameters if provided
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, sanitizeInput(value));
    });
    url = `${url}?${queryParams.toString()}`;
  }
  
  const headers = await getHeaders();
  
  // Add CSRF token if available
  const csrfToken = sessionStorage.getItem('csrfToken');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include'
    }).catch(error => {
      console.error('Network error:', error);
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

/**
 * Make a secure POST request
 */
export const securePost = async (url: string, data: any): Promise<any> => {
  // Rate limit check
  const clientIp = 'client-ip'; // In a real app, this would be the client's IP
  if (!apiRateLimiter.attempt(clientIp)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  const headers = await getHeaders();
  
  // Add CSRF token if available
  const csrfToken = sessionStorage.getItem('csrfToken');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data)
    }).catch(error => {
      console.error('Network error:', error);
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};