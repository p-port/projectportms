
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailInvitation {
  to: string;
  shopName: string;
  invitationCode: string;
  shopId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, shopName, invitationCode, shopId }: EmailInvitation = await req.json();

    // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll simulate the email sending
    
    const signupUrl = `${Deno.env.get('SITE_URL')}/signup?invitation=${invitationCode}&shop=${shopId}`;
    
    console.log(`Sending invitation email to ${to}`);
    console.log(`Shop: ${shopName}`);
    console.log(`Signup URL: ${signupUrl}`);
    
    // Simulate email content
    const emailContent = {
      to,
      subject: `Invitation to join ${shopName}`,
      html: `
        <h2>You're invited to join ${shopName}!</h2>
        <p>You have been invited to join the ${shopName} team on our motorcycle service platform.</p>
        <p><a href="${signupUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>If the button doesn't work, copy and paste this link: ${signupUrl}</p>
        <p>This invitation will expire in 7 days.</p>
      `,
    };

    // Here you would actually send the email using your preferred service
    // await emailService.send(emailContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: `email_${Date.now()}`,
        message: 'Invitation email sent successfully (simulated)',
        recipient: to
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending invitation email:', error);
    
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
