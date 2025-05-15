import { supabase } from './supabase';

/**
 * Call the hospital-onboarding edge function
 * @param endpoint The endpoint to call
 * @param method The HTTP method to use
 * @param data The data to send in the request body
 * @returns The response from the edge function
 */
export async function callHospitalOnboarding(
  endpoint: string = 'hospitals',
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hospital-onboarding/${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a session
    if (authData.session?.access_token) {
      headers['Authorization'] = `Bearer ${authData.session.access_token}`;
    } else {
      // For public endpoints, use the anon key
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(apiUrl, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling hospital-onboarding function:', error);
    throw error;
  }
}

/**
 * Call the license-management edge function
 * @param endpoint The endpoint to call
 * @param method The HTTP method to use
 * @param data The data to send in the request body
 * @returns The response from the edge function
 */
export async function callLicenseManagement(
  endpoint: string = 'licenses',
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/license-management/${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a session
    if (authData.session?.access_token) {
      headers['Authorization'] = `Bearer ${authData.session.access_token}`;
    } else {
      // For public endpoints, use the anon key
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(apiUrl, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling license-management function:', error);
    throw error;
  }
}

/**
 * Check if a subdomain is available
 * @param subdomain The subdomain to check
 * @returns Whether the subdomain is available
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  try {
    const result = await callHospitalOnboarding(`check-subdomain/${subdomain}`);
    return result.available;
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    throw error;
  }
}

/**
 * Create a new hospital
 * @param hospitalData The hospital data to create
 * @returns The created hospital
 */
export async function createHospital(hospitalData: any) {
  return callHospitalOnboarding('hospitals', 'POST', hospitalData);
}

/**
 * Get all hospitals
 * @returns All hospitals
 */
export async function getAllHospitals() {
  return callHospitalOnboarding('hospitals');
}

/**
 * Get a hospital by ID
 * @param id The hospital ID
 * @returns The hospital
 */
export async function getHospitalById(id: string) {
  return callHospitalOnboarding(`hospitals/${id}`);
}

/**
 * Get all licenses
 * @returns All licenses
 */
export async function getAllLicenses() {
  return callLicenseManagement('licenses');
}

/**
 * Create a new license
 * @param licenseData The license data to create
 * @returns The created license
 */
export async function createLicense(licenseData: any) {
  return callLicenseManagement('licenses', 'POST', licenseData);
}

/**
 * Update a license status
 * @param id The license ID
 * @param status The new status
 * @returns The updated license
 */
export async function updateLicenseStatus(id: string, status: 'active' | 'suspended' | 'cancelled') {
  return callLicenseManagement(`licenses/${id}/status`, 'PUT', { status });
}

/**
 * Get license metrics
 * @returns License metrics
 */
export async function getLicenseMetrics() {
  return callLicenseManagement('metrics');
}