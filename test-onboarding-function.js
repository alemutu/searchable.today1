import fetch from 'node-fetch';

async function testOnboardingFunction() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.error('Missing Supabase URL environment variable');
      return;
    }

    const functionUrl = `${supabaseUrl}/functions/v1/hospital-onboarding/hospitals`;
    
    console.log(`Testing onboarding function at: ${functionUrl}`);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        hospitalProfile: {
          name: 'Community Hospital',
          subdomain: 'community',
          address: '456 Health Street, Wellness City, WC 67890',
          phone: '+1 (555) 987-6543',
          email: 'info@communityhospital.com',
          contactPerson: 'Jane Smith'
        },
        adminSetup: {
          email: 'admin@communityhospital.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'SecurePassword123!',
          sendCredentials: false
        },
        moduleSelection: {
          outpatient: ['patient_management', 'appointment_scheduling'],
          inpatient: [],
          shared: ['pharmacy', 'laboratory'],
          addons: []
        },
        pricingPlan: {
          plan: 'standard'
        },
        licenseDetails: {
          startDate: new Date().toISOString().split('T')[0],
          type: 'monthly',
          autoRenew: true
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Hospital onboarding function executed successfully:');
      console.log(data);
    } else {
      console.error('Error executing hospital onboarding function:');
      console.error(data);
    }
  } catch (error) {
    console.error('Error testing onboarding function:', error.message);
  }
}

// Execute the function
testOnboardingFunction();