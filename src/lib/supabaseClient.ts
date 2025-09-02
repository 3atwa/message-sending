import { createClient } from '@supabase/supabase-js';

// These will be set from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// Database types
export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
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