import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, DollarSign, FileText, Upload, Download, Building } from "lucide-react";
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
          jobs!inner(employer_id),
          profiles!job_applications_user_id_fkey(email)
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

  const handleApply = async (jobId: string, cv: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to apply for jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = cv.name.split('.').pop();
      const fileName = `${user.id}/${jobId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, cv);

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
        description: "Your CV has been uploaded and is pending verification.",
      });

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

  const getApplicationStatus = (jobId: string) => {
    const application = applications.find(app => app.job_id === jobId);
    return application?.status || 'not_applied';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Briefcase className="h-12 w-12 text-green-500 mx-auto animate-pulse" />
          <p className="text-lg">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post Job Form (Employers only) */}
      {userRole === 'employer' && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-500" />
              Post New Job
            </CardTitle>
            <CardDescription>
              Share job opportunities with qualified candidates
            </CardDescription>
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
            <Button onClick={handlePostJob} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
              <Upload className="h-4 w-4 mr-2" />
              Post Job
            </Button>
          </CardContent>
        </Card>
      )}

      {/* My Applications (Users only) */}
      {userRole === 'user' && applications.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              My Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((app) => {
                const job = jobs.find(j => j.id === app.job_id);
                if (!job) return null;
                
                return (
                  <div key={app.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <Badge variant={
                      app.status === 'accepted' ? 'default' :
                      app.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.status === 'accepted' && '✅ Accepted'}
                      {app.status === 'rejected' && '❌ Rejected'}
                      {app.status === 'applied' && '🟡 Pending'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <Card key={job.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2 group-hover:text-green-600 transition-colors">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <Briefcase className="h-4 w-4 text-white" />
                    </div>
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2 text-base">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                  </CardDescription>
                </div>
                {job.salary && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-50 text-green-700">
                    <DollarSign className="h-3 w-3" />
                    {job.salary}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              {job.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
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

              <div className="pt-4 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full group-hover:border-green-500 group-hover:text-green-600"
                >
                  View Details
                </Button>

                {userRole === 'user' && (
                  <div>
                    {!isApplied(job.id) ? (
                      <Button 
                        onClick={() => handleApply(job.id, new File([], 'temp'))}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    ) : (
                      <Badge 
                        variant={
                          getApplicationStatus(job.id) === 'accepted' ? 'default' :
                          getApplicationStatus(job.id) === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className="w-full justify-center py-2"
                      >
                        {getApplicationStatus(job.id) === 'accepted' && '✅ Application Accepted'}
                        {getApplicationStatus(job.id) === 'rejected' && '❌ Application Rejected'}
                        {getApplicationStatus(job.id) === 'applied' && '🟡 Application Pending'}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Employer Applications Section */}
                {userRole === 'employer' && job.employer_id === user?.id && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Applications ({applications.filter(app => app.job_id === job.id).length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {applications
                        .filter(app => app.job_id === job.id)
                        .map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
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
                                  className="bg-green-500 hover:bg-green-600"
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
          <p className="text-muted-foreground">
            {userRole === 'employer' ? 'Start by posting your first job opportunity.' : 'Check back later for new opportunities.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobsTab;
