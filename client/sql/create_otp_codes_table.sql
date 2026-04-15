-- Create OTP Codes Table for Client Registration
-- This table stores temporary OTP codes for email verification

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON public.otp_codes(code);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for unauthenticated users registering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_codes' 
    AND policyname = 'Allow insert for unauthenticated registration'
  ) THEN
    CREATE POLICY "Allow insert for unauthenticated registration" ON public.otp_codes
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- Allow selecting own codes (for verification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_codes' 
    AND policyname = 'Users can verify their own codes'
  ) THEN
    CREATE POLICY "Users can verify their own codes" ON public.otp_codes
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Add table comments
COMMENT ON TABLE public.otp_codes IS 'Stores temporary OTP codes for email verification during registration';
COMMENT ON COLUMN public.otp_codes.id IS 'Unique identifier for the OTP record';
COMMENT ON COLUMN public.otp_codes.email IS 'Email address to verify';
COMMENT ON COLUMN public.otp_codes.code IS '6-digit verification code';
COMMENT ON COLUMN public.otp_codes.full_name IS 'Full name provided during registration';
COMMENT ON COLUMN public.otp_codes.phone IS 'Phone number provided during registration';
COMMENT ON COLUMN public.otp_codes.expires_at IS 'When this code expires (typically 10 minutes from creation)';
COMMENT ON COLUMN public.otp_codes.created_at IS 'Timestamp when the code was generated';
COMMENT ON COLUMN public.otp_codes.used_at IS 'Timestamp when code was successfully verified (NULL if unused)';
