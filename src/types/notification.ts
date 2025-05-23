
export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  type: 'verification' | 'ticket' | 'message' | 'system' | 'shop';
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}
