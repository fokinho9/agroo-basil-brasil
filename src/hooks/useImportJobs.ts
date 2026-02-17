import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  success_count: number;
  error_count: number;
  config: any;
  results: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useImportJobs() {
  return useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ImportJob[];
    },
    refetchInterval: 3000, // Poll every 3 seconds for updates
  });
}

export function useActiveImportJob(type: string) {
  return useQuery({
    queryKey: ['import-job-active', type],
    queryFn: async () => {
      // First try to find a running/pending job
      const { data: activeJob, error: activeError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('type', type)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeError) throw activeError;
      if (activeJob) return activeJob as ImportJob;

      // If no active job, return the most recent one (completed/failed)
      const { data: latestJob, error: latestError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('type', type)
        .in('status', ['completed', 'failed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestError) throw latestError;
      return latestJob as ImportJob | null;
    },
    refetchInterval: (query) => {
      const job = query.state.data;
      // Poll fast while running, stop when done
      if (job?.status === 'pending' || job?.status === 'running') return 1500;
      return false;
    },
  });
}

export function useCreateImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: { type: string; total_items: number; config: any }) => {
      // Create the job in the database
      const { data: newJob, error: insertError } = await supabase
        .from('import_jobs')
        .insert({
          type: job.type,
          status: 'pending',
          total_items: job.total_items,
          config: job.config,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger the edge function to process the job
      const { error: fnError } = await supabase.functions.invoke('process-import-job', {
        body: { jobId: newJob.id },
      });

      // Note: We don't wait for the function to complete
      // It will run in the background and update the job status

      if (fnError) {
        // If the function call failed, mark the job as failed
        await supabase
          .from('import_jobs')
          .update({ status: 'failed', error_message: fnError.message })
          .eq('id', newJob.id);
        throw fnError;
      }

      return newJob as ImportJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['import-job-active'] });
    },
  });
}

export function useCancelImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('import_jobs')
        .update({ status: 'failed', error_message: 'Cancelled by user' })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['import-job-active'] });
    },
  });
}
