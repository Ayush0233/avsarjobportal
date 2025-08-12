import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Phone, Calendar, Trash2, ToggleLeft, ToggleRight, Users, FileText, Download, ExternalLink, Edit, Check, X, ChevronDown } from 'lucide-react';
import { JobPostingForm } from './JobPostingForm';
import jobHunt from "../images/jobhunt.png"
import application from "../images/application.png"
import appliedJobs from "../images/appliedJobs.png"
import "./style.css"
interface Job {
  id: string;
  title: string;
  location: string;
  organization_name?: string;
  city?: string;
  address?: string;
  contact_number: string;
  amount: number;
  duration_type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  requires_resume: boolean;
}

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_location: string;
  message: string;
  created_at: string;
  resume_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  jobs: {
    title: string;
  };
}

interface MyApplication {
  id: string;
  job_id: string;
  message: string;
  created_at: string;
  resume_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  jobs: {
    title: string;
    location: string;
    amount: number;
    duration_type: string;
    contact_number: string;
  };
}

export const UserDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [openJobs, setOpenJobs] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching user jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your jobs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJobUpdated = () => {
    fetchUserJobs();
    setEditingJob(null);
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs!inner (
            title,
            user_id
          )
        `)
        .eq('jobs.user_id', user.id);

      if (error) throw error;
      setApplications((data || []) as JobApplication[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchMyApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs!inner (
            title,
            location,
            amount,
            duration_type,
            contact_number
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyApplications((data || []) as MyApplication[]);
    } catch (error) {
      console.error('Error fetching my applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !currentStatus })
        .eq('id', jobId);

      if (error) throw error;

      setJobs(jobs.map(job =>
        job.id === jobId ? { ...job, is_active: !currentStatus } : job
      ));

      toast({
        title: 'Success',
        description: `Job ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update job status.',
        variant: 'destructive',
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      setJobs(jobs.filter(job => job.id !== jobId));
      toast({
        title: 'Success',
        description: 'Job deleted successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job.',
        variant: 'destructive',
      });
    }
  };

  const downloadResume = async (resumeUrl: string, applicantName: string) => {
    try {
      // Get the public URL since bucket is now public
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(resumeUrl);

      if (data?.publicUrl) {
        // Create a temporary link and click it
        const a = document.createElement('a');
        a.href = data.publicUrl;
        a.download = `${applicantName}_resume.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: 'Resume download started.',
        });
      } else {
        throw new Error('Could not get file URL');
      }
    } catch (error) {
      console.error('Resume download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download resume. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      // Show loading state immediately
      setApplications(prev => prev.map(app =>
        app.id === applicationId ? { ...app, status: 'pending' } : app
      ));

      if (status === 'accepted') {
        // First, get the application data directly from the database
        const { data: applicationData, error: fetchError } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('id', applicationId)
          .single();

        if (fetchError) {
          console.error('Error fetching application:', fetchError);
          throw fetchError;
        }

        if (!applicationData) {
          throw new Error('Application not found');
        }

        // Update the accepted application
        const { error: acceptError } = await supabase
          .from('job_applications')
          .update({ status: 'accepted' })
          .eq('id', applicationId);

        if (acceptError) {
          console.error('Error accepting application:', acceptError);
          throw acceptError;
        }

        // Reject all other applications for the same job
        const { error: rejectError } = await supabase
          .from('job_applications')
          .update({ status: 'rejected' })
          .eq('job_id', applicationData.job_id)
          .neq('id', applicationId);

        if (rejectError) {
          console.error('Error rejecting other applications:', rejectError);
          throw rejectError;
        }

        // Update the job status to inactive (Done)
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ is_active: false })
          .eq('id', applicationData.job_id)
          .eq('user_id', user!.id);

        if (jobError) {
          console.error('Error updating job status:', jobError);
          // Don't throw here, just log it since the application was accepted successfully
        }

        // Update local state immediately
        setApplications(prev => prev.map(app =>
          app.job_id === applicationData.job_id
            ? { ...app, status: app.id === applicationId ? 'accepted' : 'rejected' }
            : app
        ));

        setJobs(prev => prev.map(job =>
          job.id === applicationData.job_id ? { ...job, is_active: false } : job
        ));

        toast({
          title: 'Success',
          description: 'Application accepted! All other applications have been rejected and the job is now marked as Done.',
        });
      } else {
        const { error } = await supabase
          .from('job_applications')
          .update({ status })
          .eq('id', applicationId);

        if (error) {
          console.error('Error updating application status:', error);
          throw error;
        }

        // Update local state immediately
        setApplications(prev => prev.map(app =>
          app.id === applicationId ? { ...app, status } : app
        ));

        toast({
          title: 'Success',
          description: `Application ${status} successfully!`,
        });
      }

      // Fetch fresh data after a short delay to ensure consistency
      setTimeout(() => {
        fetchApplications();
        fetchUserJobs();
      }, 1000);

    } catch (error) {
      console.error('Error in updateApplicationStatus:', error);

      // Revert local state on error
      fetchApplications();

      toast({
        title: 'Error',
        description: `Failed to ${status} application. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserJobs();
      fetchApplications();
      fetchMyApplications();
    }
  }, [user]);

  const formatAmount = (amount: number, durationType: string) => {
    return `₹${amount} per ${durationType.slice(0, -2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getWelcomeMessage = () => {
    if (userProfile?.full_name) {
      return ` ${userProfile.full_name}!`;
    }
    return user?.email ? `Welcome back, ${user.email}!` : 'Welcome back!';
  };

  // Group applications by job title and job_id
  const groupedApplications = applications.reduce((acc, application) => {
    const jobKey = `${application.job_id}-${application.jobs.title}`;
    if (!acc[jobKey]) {
      acc[jobKey] = {
        jobTitle: application.jobs.title,
        jobId: application.job_id,
        applications: []
      };
    }
    acc[jobKey].applications.push(application);
    return acc;
  }, {} as Record<string, { jobTitle: string; jobId: string; applications: JobApplication[] }>);

  const toggleJobCollapse = (jobKey: string) => {
    setOpenJobs(prev => ({
      ...prev,
      [jobKey]: !prev[jobKey]
    }));
  };

  const getLocationDisplay = (job: Job) => {
    if (job.city && job.address) {
      return `${job.city}, ${job.address}`;
    }
    return job.location || 'Location not specified';
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-right">Welcome back, <span className='text-purple-700'>{getWelcomeMessage()}</span></h2>
        {/* <p className="text-muted-foreground text-center mt-10 font-bold text-2xl">Manage your jobs and applications</p> */}
      </div>

      <Tabs defaultValue="posted" className="w-full  flex gap-9 justify-center">
        <TabsList className=" tablist w-3/12 flex flex-col mt-2 bg-purple-50 h-3/5 items-start ">
          <TabsTrigger value="posted">Posted Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="applications">Applications Received ({applications.length})</TabsTrigger>
          <TabsTrigger value="applied">My Applications ({myApplications.length})</TabsTrigger>
        </TabsList>
        <div className='dashboardTabs'>
          {/* <span className=''></span> */}
        <TabsContent value="posted" className="space-y-4 w-9/12">
          {loading ? (  
            <div className="text-center py-8">Loading your jobs...</div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <Card key={job.id} className={`${!job.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {job.title}
                        <Badge variant={job.is_active ? "default" : "secondary"}>
                          {job.is_active ? "Active" : "Done"}
                        </Badge>
                        {job.requires_resume && (
                          <Badge variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Resume Required
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {getLocationDisplay(job)}
                        </div>
                        {job.organization_name && (
                          <div className="text-sm font-medium text-muted-foreground">
                            {job.organization_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(job.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingJob(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJobStatus(job.id, job.is_active)}
                      >
                        {job.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this job? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteJob(job.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {job.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-primary">
                      {formatAmount(job.amount, job.duration_type)}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-4 w-4" />
                      {job.contact_number}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center font-bold text-xl flex flex-col items-center py-2 text-muted-foreground">
              <img src={jobHunt} className='w-96 drop-shadow-xl ' alt="" />
              You haven't posted any jobs yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4 w-9/12">
          {loading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : Object.keys(groupedApplications).length > 0 ? (
            Object.entries(groupedApplications).map(([jobKey, jobData]) => (
              <Collapsible
                key={jobKey}
                open={openJobs[jobKey] || false}
                onOpenChange={() => toggleJobCollapse(jobKey)}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 hover:bg-muted/50 transition-colors">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {jobData.jobTitle}
                          <Badge variant="secondary">{jobData.applications.length} applications</Badge>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openJobs[jobKey] ? 'rotate-180' : ''}`} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {jobData.applications.map((application) => (
                          <div key={application.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium">{application.applicant_name}</p>
                                {application.applicant_location && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {application.applicant_location}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(application.created_at)}
                                </div>
                                {application.resume_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadResume(application.resume_url!, application.applicant_name)}
                                    className="flex items-center gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    Resume
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                  disabled={application.status !== 'pending'}
                                  className="flex items-center gap-1"
                                >
                                  <Check className="h-4 w-4" />
                                  Accept
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                  disabled={application.status !== 'pending'}
                                  className="flex items-center gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                              {application.status !== 'pending' && (
                                <Badge
                                  variant={application.status === 'accepted' ? 'default' : 'destructive'}
                                >
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </Badge>
                              )}
                            </div>
                            {application.message && (
                              <div>
                                <p className="text-sm font-medium mb-1">Message:</p>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                  {application.message}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          ) : (
            <div className="text-center flex flex-col items-center py-5 text-muted-foreground">
              <img src={application} className='w-96 drop-shadow-xl ' alt="" />
              No applications received yet. When someone applies to your jobs, they'll appear here.
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="space-y-4 w-11/12">
          {loading ? (
            <div className="text-center py-8">Loading your applications...</div>
          ) : myApplications.length > 0 ? (
            myApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold  flex items-center gap-2">
                        <ExternalLink className="h-8 w-8 text-purple-800" />
                        {application.jobs.title}
                      </CardTitle>
                      <div className="flex items-center mt-4 gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-6 w-6 text-pink-700" />
                          <p className='font-bold'>
                            {application.jobs.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col gap-4 items-end'>
                      <Badge variant="outline">Applied</Badge>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-6 w-6 text-pink-700 " />
                        Applied on : {formatDate(application.created_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.message && (
                      <div>
                        <p className="text-sm font-medium mb-1">Your message:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {application.message}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-5 w-5 text-blue-500" />
                      {application.jobs.contact_number}
                    </div>

                    {application.resume_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Resume submitted
                      </div>
                    )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="text-lg font-semibold text-primary">
                        {formatAmount(application.jobs.amount, application.jobs.duration_type)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            application.status === 'accepted' ? 'default' :
                              application.status === 'rejected' ? 'destructive' :
                                'secondary'
                          }
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center flex flex-col items-center py-5 text-muted-foreground">
              <img src={appliedJobs} className='w-96 drop-shadow-xl ' alt="" />
              You haven't applied to any jobs yet. Browse jobs to start applying!
            </div>
          )}
        </TabsContent>
        </div>
      </Tabs>

      {/* Edit Job Dialog */}
      {editingJob && (
        <JobPostingForm
          editJob={editingJob}
          onJobUpdated={handleJobUpdated}
          isEditing={true}
        />
      )}
    </div>
  );
};