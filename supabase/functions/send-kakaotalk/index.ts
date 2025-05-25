
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KakaoTalkRequest {
  to: string;
  message: string;
  jobId?: string;
  type: 'job_start' | 'job_progress' | 'job_completed' | 'invitation' | 'general';
  templateCode?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, jobId, type, templateCode }: KakaoTalkRequest = await req.json();

    // Format phone number for Korea
    const formattedPhone = to.startsWith('+82') ? to.replace('+82', '') : to.replace(/^0/, '');

    // KakaoTalk Business API integration would go here
    // For now, we'll simulate the API call and log the message
    console.log(`Sending KakaoTalk message to ${formattedPhone}:`, message);
    
    // In a real implementation, you would integrate with KakaoTalk Business API
    // const kakaoResponse = await fetch('https://api.kakao.com/v2/api/talk/memo/default/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${kakaoAccessToken}`,
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     template_object: JSON.stringify({
    //       object_type: 'text',
    //       text: message,
    //       link: {
    //         web_url: jobId ? `${Deno.env.get('SITE_URL')}/track-job/${jobId}` : undefined,
    //       }
    //     })
    //   })
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: `kakao_${Date.now()}`,
        message: 'KakaoTalk message sent successfully (simulated)',
        recipient: formattedPhone
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending KakaoTalk message:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
