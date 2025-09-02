# Supabase Setup Guide for Messaging App

This guide will walk you through setting up Supabase for your messaging application.

## 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with your email or GitHub account

## 2. Create a New Project

1. Once logged in, click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `messaging-app` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be created (this takes 1-2 minutes)

## 3. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Project API Keys** → **anon public** key

## 4. Configure Environment Variables

1. In your project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 5. Set Up Database Tables

Go to your Supabase dashboard → **SQL Editor** and run these SQL commands:

### Create Profiles Table
```sql
-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Create Contacts Table
```sql
-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  CONSTRAINT contacts_email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS contacts_created_by_idx ON contacts(created_by);
CREATE INDEX IF NOT EXISTS contacts_name_idx ON contacts(name);
```

### Create Messages Table
```sql
-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  sent_via TEXT[] NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = sent_by);

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sent_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_sent_by_idx ON messages(sent_by);
CREATE INDEX IF NOT EXISTS messages_sent_at_idx ON messages(sent_at DESC);
```

## 6. Create Your First Admin User

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click "Add user"
3. Fill in:
   - **Email**: Your email address
   - **Password**: Create a secure password
   - **Email Confirm**: Set to `true`
4. Click "Create user"

5. After creating the user, go to **SQL Editor** and run:
   ```sql
   -- Update the user role to admin (replace 'your-email@example.com' with your actual email)
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

## 7. Configure Authentication Settings

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your development URL: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000`
4. **Disable email confirmations** for development:
   - Set "Enable email confirmations" to **OFF**
5. Click "Save"

## 8. Test Your Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000`
3. You should see a login page
4. Log in with the admin credentials you created
5. You should be redirected to the dashboard

## 9. Optional: Set Up Email Templates (for production)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 10. Production Deployment

When deploying to production:

1. Update your **Site URL** and **Redirect URLs** in Supabase settings
2. Set up proper environment variables in your hosting platform
3. Consider enabling email confirmations
4. Set up proper SMTP settings for email delivery

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that your environment variables are correct
2. **"User not found"**: Make sure you created the user in Supabase dashboard
3. **"Permission denied"**: Check your RLS policies
4. **"Table doesn't exist"**: Make sure you ran all the SQL commands

### Useful SQL Queries for Debugging:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check user profiles
SELECT * FROM profiles;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'contacts', 'messages');
```

## Next Steps

Once everything is working:

1. Add more contacts through the Contacts page
2. Try sending messages through the Messaging interface
3. Import contacts using CSV/Excel files
4. Explore the admin features if you're logged in as an admin

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Supabase logs in your dashboard
3. Verify your environment variables are correct
4. Make sure all SQL commands were executed successfully