
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, DollarSign, FileText, Upload, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  requirements: string;
  description?: string;
  salary?: string;
  employer_id: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  cv_storage_path?: string;
}

const JobsTab = ({ userRole }: { userRole: string }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    requirements: "",
    description: "",
    salary: ""
  });

  const [applicationData, setApplicationData] = useState({
    jobId: "",
    cv: null as File | null
  });

  useEffect(() => {
    fetchJobs();
    if (userRole === 'user') {
      fetchApplications();
    } else if (userRole === 'employer') {
      fetchEmployerApplications();
    }
  }, [userRole]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error loading jobs",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchEmployerApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select(`
          *,
          jobs!inner(employer_id)
        `)
        .eq('jobs.employer_id', user.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching employer applications:', error);
    }
  };

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.location || !newJob.requirements || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await (supabase as any)
        .from('jobs')
        .insert({
          title: newJob.title,
          location: newJob.location,
          requirements: newJob.requirements,
          description: newJob.description,
          salary: newJob.salary,
          employer_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Job posted successfully!",
        description: "Your job has been posted on the platform.",
      });

      setNewJob({ title: "", location: "", requirements: "", description: "", salary: "" });
      fetchJobs();
    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: "Error posting job",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user || !applicationData.cv) {
      toast({
        title: "Missing CV",
        description: "Please upload your CV to apply",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = applicationData.cv.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, applicationData.cv);

      if (uploadError) throw uploadError;

      const { error } = await (supabase as any)
        .from('job_applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          status: 'applied',
          cv_storage_path: fileName
        });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "Your job application has been submitted successfully.",
      });

      setApplicationData({ jobId: "", cv: null });
      fetchApplications();
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Error submitting application",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCV = async (cvPath: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cvs')
        .download(cvPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${applicantName}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast({
        title: "Download failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: `Application ${status}`,
        description: `The application has been ${status}.`,
      });

      fetchEmployerApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error updating application",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const isApplied = (jobId: string) => {
    return applications.some(app => app.job_id === jobId);
  };

  if (loading) {
    return <div className="text-center">Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Post Job Form (Employers only) */}
      {userRole === 'employer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Post New Job
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  placeholder="Software Developer"
                />
              </div>
              <div>
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  placeholder="Addis Ababa"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="job-salary">Salary</Label>
              <Input
                id="job-salary"
                value={newJob.salary}
                onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                placeholder="15,000 - 25,000 ETB"
              />
            </div>
            <div>
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                placeholder="Detailed job description..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="job-requirements">Requirements</Label>
              <Textarea
                id="job-requirements"
                value={newJob.requirements}
                onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                placeholder="Required skills and experience"
                rows={3}
              />
            </div>
            <Button onClick={handlePostJob} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Post Job
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-500" />
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span>{job.company}</span>
                  </CardDescription>
                </div>
                {job.salary && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {job.salary}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Requirements</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {job.requirements}
                </p>
              </div>

              {userRole === 'user' && (
                <div className="space-y-3 pt-2 border-t">
                  {!isApplied(job.id) ? (
                    <div className="space-y-2">
                      <Label htmlFor={`cv-${job.id}`}>Upload CV</Label>
                      <Input
                        id={`cv-${job.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setApplicationData({
                          jobId: job.id,
                          cv: e.target.files?.[0] || null
                        })}
                      />
                      <Button 
                        onClick={() => handleApply(job.id)}
                        disabled={!applicationData.cv || applicationData.jobId !== job.id}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center py-2">
                      Applied
                    </Badge>
                  )}
                </div>
              )}

              {userRole === 'employer' && job.employer_id === user?.id && (
                <div className="pt-2 border-t">
                  <h4 className="font-medium mb-2">Applications</h4>
                  {applications
                    .filter(app => app.job_id === job.id)
                    .map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-2 border rounded mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            app.status === 'accepted' ? 'default' :
                            app.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {app.status}
                          </Badge>
                          {app.cv_storage_path && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCV(app.cv_storage_path!, 'Applicant')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              CV
                            </Button>
                          )}
                        </div>
                        {app.status === 'applied' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateApplicationStatus(app.id, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobsTab;
