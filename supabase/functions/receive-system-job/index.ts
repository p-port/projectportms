
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobRequest {
  job_type: string;
  status: string;
  created_by: string;
  vehicle_id: string;
  auto_generated: boolean;
  note?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Incoming request from ${req.headers.get('user-agent')}`);

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key
    const authHeader = req.headers.get('Authorization');
    const expectedApiKey = Deno.env.get('PROJECTPORTMS_API_KEY');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[${requestId}] Missing or invalid Authorization header`);
      await logRequest(supabase, requestId, req, null, 403, 'Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (apiKey !== expectedApiKey) {
      console.log(`[${requestId}] Invalid API key provided`);
      await logRequest(supabase, requestId, req, null, 403, 'Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let requestBody: JobRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.log(`[${requestId}] Invalid JSON in request body:`, error);
      await logRequest(supabase, requestId, req, null, 400, 'Invalid JSON');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    const { job_type, status, created_by, vehicle_id, auto_generated, note } = requestBody;
    
    if (!job_type || !status || !created_by || !vehicle_id || typeof auto_generated !== 'boolean') {
      console.log(`[${requestId}] Missing required fields:`, requestBody);
      await logRequest(supabase, requestId, req, requestBody, 400, 'Missing required fields');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['job_type', 'status', 'created_by', 'vehicle_id', 'auto_generated']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate job_type and status
    if (job_type !== 'Ownership Transfer') {
      console.log(`[${requestId}] Invalid job_type: ${job_type}`);
      await logRequest(supabase, requestId, req, requestBody, 400, 'Invalid job_type');
      return new Response(
        JSON.stringify({ error: 'job_type must be "Ownership Transfer"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (status !== 'closed') {
      console.log(`[${requestId}] Invalid status: ${status}`);
      await logRequest(supabase, requestId, req, requestBody, 400, 'Invalid status');
      return new Response(
        JSON.stringify({ error: 'status must be "closed"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate job ID
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create job data
    const jobData = {
      job_id: jobId,
      customer: {
        name: 'System Generated',
        email: 'system@projectportms.com',
        phone: 'N/A'
      },
      motorcycle: {
        make: 'Unknown',
        model: 'Unknown',
        year: new Date().getFullYear(),
        vin: vehicle_id,
        license_plate: 'N/A'
      },
      service_type: job_type,
      status: status,
      date_created: new Date().toISOString(),
      date_completed: new Date().toISOString(),
      notes: [
        {
          text: note || `System-generated job for vehicle ${vehicle_id}. Auto-generated: ${auto_generated}`,
          timestamp: new Date().toISOString(),
          userId: created_by
        }
      ],
      photos: { start: [], completion: [] },
      user_id: created_by
    };

    // Insert job into database
    const { data: insertedJob, error: insertError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (insertError) {
      console.error(`[${requestId}] Database insert error:`, insertError);
      await logRequest(supabase, requestId, req, requestBody, 500, `Database error: ${insertError.message}`, null);
      return new Response(
        JSON.stringify({ error: 'Database error', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Successfully created job: ${jobId}`);
    
    const responseData = {
      success: true,
      job_id: jobId,
      message: 'System job created successfully'
    };

    // Log successful request
    await logRequest(supabase, requestId, req, requestBody, 201, null, jobId);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    
    // Try to log the error if possible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await logRequest(supabase, requestId, req, null, 500, `Unexpected error: ${error.message}`);
    } catch (logError) {
      console.error(`[${requestId}] Failed to log error:`, logError);
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logRequest(
  supabase: any,
  requestId: string,
  req: Request,
  requestPayload: any,
  responseStatus: number,
  errorMessage?: string | null,
  jobId?: string | null
) {
  try {
    const logData = {
      request_id: requestId,
      source_app: 'portrider',
      endpoint: '/functions/v1/receive-system-job',
      http_method: req.method,
      request_payload: requestPayload,
      response_status: responseStatus,
      response_payload: errorMessage ? { error: errorMessage } : { success: true, job_id: jobId },
      error_message: errorMessage,
      job_id: jobId
    };

    const { error } = await supabase
      .from('external_job_tracking')
      .insert(logData);

    if (error) {
      console.error(`[${requestId}] Failed to log request:`, error);
    } else {
      console.log(`[${requestId}] Request logged successfully`);
    }
  } catch (error) {
    console.error(`[${requestId}] Error in logRequest function:`, error);
  }
}
