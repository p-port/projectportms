
export interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}
