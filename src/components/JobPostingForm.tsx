import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import './style.css'
const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  organization_name: z.string().min(1, 'Organization name is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  contact_number: z.string().min(10, 'Valid contact number is required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  duration_type: z.enum(['hourly', 'daily', 'monthly']),
  job_type: z.enum(['household', 'it', 'data-entry', 'non-tech', 'sales', 'marketing', 'finance', 'education', 'healthcare', 'construction', 'general']),
  description: z.string().optional(),
  requires_resume: z.boolean(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobPostingFormProps {
  editJob?: {
    id: string;
    title: string;
    organization_name?: string;
    city?: string;
    address?: string;
    location?: string;
    contact_number: string;
    amount: number;
    duration_type: string;
    job_type?: string;
    description?: string;
    requires_resume: boolean;
  };
  onJobUpdated?: () => void;
  isEditing?: boolean;
}

export const JobPostingForm = ({ editJob, onJobUpdated, isEditing = false }: JobPostingFormProps) => {
  const [open, setOpen] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: editJob?.title || '',
      organization_name: editJob?.organization_name || '',
      city: editJob?.city || '',
      address: editJob?.address || '',
      contact_number: editJob?.contact_number || '',
      amount: editJob?.amount?.toString() || '',
      duration_type: (editJob?.duration_type as 'hourly' | 'daily' | 'monthly') || 'hourly',
      job_type: (editJob?.job_type as any) || 'general',
      description: editJob?.description || '',
      requires_resume: editJob?.requires_resume || false,
    },
  });

  const onSubmit = async (data: JobFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const jobData = {
        user_id: user.id,
        title: data.title,
        organization_name: data.organization_name,
        city: data.city,
        address: data.address,
        location: `${data.city}, ${data.address}`, // Keep location for backward compatibility
        contact_number: data.contact_number,
        amount: Number(data.amount),
        duration_type: data.duration_type,
        job_type: data.job_type,
        description: data.description,
        requires_resume: data.requires_resume,
      };

      let error;
      if (editJob) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editJob.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('jobs').insert(jobData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: editJob ? 'Job updated successfully!' : 'Job posted successfully!',
      });

      form.reset();
      setOpen(false);
      onJobUpdated?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: editJob ? 'Failed to update job. Please try again.' : 'Failed to post job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="w-full dashButton">
            <Plus className="h-4 w-4 mr-2" />
            Post Job
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editJob ? 'Edit Job' : 'Post a New Job'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Web Developer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Tech Solutions Pvt Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Andheri West, Maharashtra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Per Hour</SelectItem>
                        <SelectItem value="daily">Per Day</SelectItem>
                        <SelectItem value="monthly">Per Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="job_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="household">Household</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="data-entry">Data Entry</SelectItem>
                      <SelectItem value="non-tech">Non-Tech</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the job requirements..." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requires_resume"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Resume Upload</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Applicants must upload a resume to apply
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full dashButton" disabled={loading}>
              {loading ? (editJob ? 'Updating...' : 'Posting...') : (editJob ? 'Update Job' : 'Post Job')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};