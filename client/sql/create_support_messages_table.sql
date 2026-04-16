-- Create Support Messages Table
-- This table stores messages sent by users from the Help & Support page

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (authenticated or guest)
CREATE POLICY "Allow anyone to submit support messages" ON public.support_messages
  FOR INSERT WITH CHECK (true);

-- Allow users to see their own messages
CREATE POLICY "Users can view their own support messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view and update all messages
-- (Assuming there is a way to identify admins, e.g. via a role in profiles)
-- For now, we'll keep it simple or restricted to insert-only for the public.

-- Add table comments
COMMENT ON TABLE public.support_messages IS 'Stores messages from users for the support team';
COMMENT ON COLUMN public.support_messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN public.support_messages.user_id IS 'ID of the user who sent the message (if authenticated)';
COMMENT ON COLUMN public.support_messages.name IS 'Name of the sender';
COMMENT ON COLUMN public.support_messages.contact IS 'Email or phone number for follow-up';
COMMENT ON COLUMN public.support_messages.message IS 'Contents of the support request';
COMMENT ON COLUMN public.support_messages.status IS 'Current processing status of the message';
COMMENT ON COLUMN public.support_messages.created_at IS 'When the message was submitted';
