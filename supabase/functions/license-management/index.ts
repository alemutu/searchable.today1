import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import express from 'npm:express@4.18.2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const app = express();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Middleware to parse JSON bodies
app.use(express.json());

// Handle CORS preflight requests
app.options('*', (req, res) => {
  res.set(corsHeaders).status(204).send();
});

// Add CORS middleware
app.use((req, res, next) => {
  res.set(corsHeaders);
  next();
});

// Get all licenses with related data
app.get('/licenses', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('licenses')
      .select(`
        *,
        hospital:hospitals(id, name),
        plan:pricing_plans(id, name, features)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new license
app.post('/licenses', async (req, res) => {
  try {
    const { hospital_id, plan_id } = req.body;

    if (!hospital_id || !plan_id) {
      throw new Error('Hospital ID and Plan ID are required');
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('pricing_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError) throw planError;

    const licenseData = {
      hospital_id,
      plan_id,
      start_date: new Date().toISOString(),
      status: 'active',
      max_users: plan.max_users || 0,
      current_users: 0,
      features: plan.features || {},
      billing_info: {
        billing_cycle: 'monthly',
        auto_renew: true
      }
    };

    const { data, error } = await supabaseClient
      .from('licenses')
      .insert([licenseData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update license status
app.put('/licenses/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'cancelled'].includes(status)) {
      throw new Error('Invalid status');
    }

    const { data, error } = await supabaseClient
      .from('licenses')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating license status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get license usage metrics
app.get('/metrics', async (req, res) => {
  try {
    const { data: licenses, error: licensesError } = await supabaseClient
      .from('licenses')
      .select('*');

    if (licensesError) throw licensesError;

    const metrics = {
      total_active: licenses.filter(l => l.status === 'active').length,
      total_users: licenses.reduce((sum, license) => sum + (license.current_users || 0), 0),
      expiring_soon: licenses.filter(l => {
        if (!l.end_date) return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(l.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

serve(app.callback());