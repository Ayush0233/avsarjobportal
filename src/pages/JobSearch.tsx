import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Phone, Calendar, UserPlus, Upload, CheckCircle, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  job_type: string;
  description: string | null;
  created_at: string;
  user_id: string;
  requires_resume: boolean;
}

export default function JobSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applyingToJobId, setApplyingToJobId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Filter states
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  
  const location = searchParams.get('location') || '';

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchAppliedJobs();
    }
  }, [location, user]);

  // Apply filters whenever jobs or filter values change
  useEffect(() => {
    let filtered = [...jobs];

    // Filter by job type
    if (selectedJobType !== 'all') {
      filtered = filtered.filter(job => job.job_type === selectedJobType);
    }

    // Filter by salary range
    if (minSalary) {
      filtered = filtered.filter(job => job.amount >= Number(minSalary));
    }
    if (maxSalary) {
      filtered = filtered.filter(job => job.amount <= Number(maxSalary));
    }

    // Filter by location
    if (filterLocation) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filterLocation.toLowerCase()) ||
        job.city?.toLowerCase().includes(filterLocation.toLowerCase()) ||
        job.address?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, selectedJobType, minSalary, maxSalary, filterLocation]);

  const fetchJobs = async () => {
    if (!location || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .neq('user_id', user.id) // Hide user's own jobs
        .or(`location.ilike.%${location}%,city.ilike.%${location}%,address.ilike.%${location}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', user.id);

      if (error) throw error;
      
      const appliedJobIds = new Set(data?.map(app => app.job_id) || []);
      setAppliedJobs(appliedJobIds);
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  const uploadResume = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    
    return fileName;
  };

  const handleApplyToJob = async (jobId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for jobs.",
        variant: "destructive",
      });
      return;
    }

    const currentJob = jobs.find(job => job.id === jobId);
    if (currentJob?.requires_resume && !resumeFile) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume to apply for this job.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Get user profile for applicant info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, current_city, phone, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      let resumeUrl = null;
      if (resumeFile) {
        resumeUrl = await uploadResume(resumeFile);
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          applicant_name: profile?.full_name || 'Anonymous',
          applicant_email: profile?.email || user.email || '',
          applicant_phone: profile?.phone || '',
          applicant_location: profile?.current_city || '',
          message: applicationMessage,
          resume_url: resumeUrl
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully!",
      });

      setApplicationMessage('');
      setApplyingToJobId(null);
      setResumeFile(null);
      
      // Update applied jobs set
      setAppliedJobs(prev => new Set([...prev, jobId]));
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatAmount = (amount: number, durationType: string) => {
    return `₹${amount} per ${durationType.slice(0, -2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isJobApplied = (jobId: string) => appliedJobs.has(jobId);

  const resetApplicationForm = () => {
    setApplicationMessage('');
    setApplyingToJobId(null);
    setResumeFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Jobs in {location}</h1>
            <p className="text-muted-foreground">{filteredJobs.length} of {jobs.length} jobs shown</p>
          </div>
        </div>

        {!loading && jobs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Job Type</label>
                  <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All job types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Salary (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 1000"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Salary (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Filter by location..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  />
                </div>
              </div>
              {(selectedJobType !== 'all' || minSalary || maxSalary || filterLocation) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedJobType('all');
                      setMinSalary('');
                      setMaxSalary('');
                      setFilterLocation('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading jobs...</div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid gap-6">
            {filteredJobs.length > 0 ? filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        {isJobApplied(job.id) && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Applied
                          </Badge>
                        )}
                        {job.requires_resume && (
                          <Badge variant="outline">Resume Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(job.created_at)}
                        </div>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="flex items-center gap-2"
                          onClick={() => setApplyingToJobId(job.id)}
                          disabled={isJobApplied(job.id)}
                          variant={isJobApplied(job.id) ? "outline" : "default"}
                        >
                          {isJobApplied(job.id) ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Applied
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              Apply
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply for {job.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {job.requires_resume && (
                            <div>
                              <p className="text-sm font-medium mb-2">Resume Upload (Required)</p>
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground">
                                      Upload your resume (PDF, DOC, DOCX)
                                    </p>
                                    <Input
                                      type="file"
                                      accept=".pdf,.doc,.docx"
                                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                      className="mt-2"
                                    />
                                  </div>
                                </div>
                                {resumeFile && (
                                  <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">{resumeFile.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Add a message for the employer (optional):
                            </p>
                            <Textarea
                              placeholder="Tell the employer why you're interested in this job..."
                              value={applicationMessage}
                              onChange={(e) => setApplicationMessage(e.target.value)}
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={resetApplicationForm}
                              disabled={uploading}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleApplyToJob(job.id)}
                              disabled={uploading || (job.requires_resume && !resumeFile)}
                            >
                              {uploading ? 'Submitting...' : 'Submit Application'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {job.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-primary">
                      {formatAmount(job.amount, job.duration_type)}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {job.duration_type}
                        </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-4 w-4" />
                        {job.contact_number}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12">
                <div className="text-lg text-muted-foreground">
                  No jobs match your current filters. Try adjusting your search criteria.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">
              No jobs found in {location}. Try searching for a different location.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}