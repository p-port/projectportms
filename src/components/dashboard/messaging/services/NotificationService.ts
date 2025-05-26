
import { supabase } from "@/integrations/supabase/client";

interface SMSNotification {
  to: string;
  message: string;
  jobId?: string;
  type: 'job_start' | 'job_progress' | 'job_completed' | 'invitation' | 'general';
}

interface EmailInvitation {
  to: string;
  shopName: string;
  invitationCode: string;
  shopId: string;
}

export class NotificationService {
  static async sendSMS(notification: SMSNotification): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-kakaotalk', {
        body: notification
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  static async sendInvitationEmail(invitation: EmailInvitation): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: invitation
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }

  static async createShopInvitation(shopId: string, email: string, phone?: string): Promise<string | null> {
    try {
      const invitationCode = Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('shop_invitations')
        .insert({
          shop_id: shopId,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          email,
          phone,
          invitation_code: invitationCode,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Get shop details for the notification
      const { data: shop } = await supabase
        .from('shops')
        .select('name')
        .eq('id', shopId)
        .single();

      // Find the user by email to send notification
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email);

      if (profiles && profiles.length > 0) {
        // Create notification for the invited user
        await supabase
          .from('notifications')
          .insert({
            user_id: profiles[0].id,
            title: 'Shop Invitation',
            content: `You have been invited to join ${shop?.name || 'a shop'}`,
            type: 'shop_invitation',
            reference_id: data.id,
            is_read: false
          });
      }

      return invitationCode;
    } catch (error) {
      console.error('Error creating shop invitation:', error);
      return null;
    }
  }

  static async notifyJobStatusChange(jobId: string, customerPhone: string, status: string, shopName: string): Promise<void> {
    const messages = {
      'in-progress': `Your motorcycle service has started at ${shopName}. Track progress: ${window.location.origin}/legal-disclosure/${jobId}?phone=${customerPhone}`,
      'completed': `Your motorcycle service at ${shopName} is complete! Please come pick up your vehicle. Job ID: ${jobId}`,
      'pending': `Your motorcycle service request has been received by ${shopName}. We'll notify you when work begins.`
    };

    const message = messages[status as keyof typeof messages] || `Service status update for job ${jobId}`;

    await this.sendSMS({
      to: customerPhone,
      message,
      jobId,
      type: status === 'completed' ? 'job_completed' : status === 'in-progress' ? 'job_progress' : 'general'
    });
  }
}
