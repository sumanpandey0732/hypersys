-- Add UPDATE policy for messages table
CREATE POLICY "Users can update messages in their conversations" 
ON public.messages 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))));

-- Create rate_limit_log table for tracking API usage
CREATE TABLE public.rate_limit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_rate_limit_log_user_endpoint_time ON public.rate_limit_log (user_id, endpoint, created_at DESC);

-- Enable RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own rate limit logs
CREATE POLICY "Users can insert their own rate limit logs"
ON public.rate_limit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own rate limit logs (for debugging/transparency)
CREATE POLICY "Users can view their own rate limit logs"
ON public.rate_limit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Create a cleanup function to delete old rate limit logs (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '1 hour';
END;
$$;