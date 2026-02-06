-- Create a table to track import jobs
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'descriptions', 'prices', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  config JSONB, -- Job configuration (URLs, product IDs, etc.)
  results JSONB, -- Results and logs
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view and manage import jobs (admin only in practice)
CREATE POLICY "Anyone can view import jobs" 
ON public.import_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create import jobs" 
ON public.import_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update import jobs" 
ON public.import_jobs 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();