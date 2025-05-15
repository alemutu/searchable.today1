import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)

    // Handle subdomain availability check
    if (req.method === 'GET' && path[1] === 'check-subdomain' && path[2]) {
      const subdomain = path[2]

      // Query the hospitals table to check if subdomain exists
      const { data: existingHospitals, error: queryError } = await supabaseClient
        .from('hospitals')
        .select('id')
        .eq('subdomain', subdomain)

      if (queryError) {
        throw new Error(`Database error: ${queryError.message}`)
      }

      // Check if any hospitals were found with this subdomain
      const isAvailable = !existingHospitals || existingHospitals.length === 0

      return new Response(
        JSON.stringify({
          available: isAvailable,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
    }

    // Handle hospital creation
    if (req.method === 'POST' && path[1] === 'hospitals') {
      const body = await req.json()

      // Validate required fields
      if (!body.hospitalProfile?.name || !body.hospitalProfile?.subdomain) {
        throw new Error('Missing required fields')
      }

      // Check subdomain availability before creating
      const { data: existingHospital, error: checkError } = await supabaseClient
        .from('hospitals')
        .select('id')
        .eq('subdomain', body.hospitalProfile.subdomain)

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`)
      }

      if (existingHospital && existingHospital.length > 0) {
        throw new Error('Subdomain is already taken')
      }

      // Create the hospital
      const { data: hospital, error: hospitalError } = await supabaseClient
        .from('hospitals')
        .insert({
          name: body.hospitalProfile.name,
          subdomain: body.hospitalProfile.subdomain,
          address: body.hospitalProfile.address,
          phone: body.hospitalProfile.phone,
          email: body.hospitalProfile.email,
        })
        .select()
        .single()

      if (hospitalError) {
        throw new Error(`Failed to create hospital: ${hospitalError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: hospital,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
    }

    // Handle hospitals list
    if (req.method === 'GET' && path[1] === 'hospitals') {
      const { data: hospitals, error: listError } = await supabaseClient
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false })

      if (listError) {
        throw new Error(`Failed to fetch hospitals: ${listError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: hospitals,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
    }

    // Handle single hospital fetch
    if (req.method === 'GET' && path[1] === 'hospitals' && path[2]) {
      const hospitalId = path[2]

      const { data: hospital, error: getError } = await supabaseClient
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .single()

      if (getError) {
        throw new Error(`Failed to fetch hospital: ${getError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: hospital,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
    }

    // If no route matches
    throw new Error('Not Found')
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message === 'Not Found' ? 404 : 400,
      }
    )
  }
})