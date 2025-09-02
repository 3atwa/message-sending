import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://example.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTY5MjMyMDAsImV4cCI6MTkzMjQ5OTYwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// Database types
export type User = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  created_by: string;
}

export type Message = {
  id: string;
  content: string;
  sent_at: string;
  sent_by: string;
  recipients: string[];
  sent_via: string[];
}