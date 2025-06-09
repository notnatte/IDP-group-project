
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  requirements: string;
  employer_id: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
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
    requirements: ""
  });

  useEffect(() => {
    fetchJobs();
    if (userRole === 'user') {
      fetchApplications();
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

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.location || !newJob.requirements || !user) return;
    
    try {
      const { error } = await (supabase as any)
        .from('jobs')
        .insert({
          title: newJob.title,
          location: newJob.location,
          requirements: newJob.requirements,
          employer_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Job posted successfully!",
        description: "Your job has been posted on the platform.",
      });

      setNewJob({ title: "", location: "", requirements: "" });
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
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('job_applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          status: 'applied'
        });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "Your job application has been submitted successfully.",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Error submitting application",
        description: "You may have already applied to this job.",
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
            <CardTitle>Post New Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  placeholder="Job title"
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
              <Label htmlFor="job-requirements">Requirements</Label>
              <Input
                id="job-requirements"
                value={newJob.requirements}
                onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                placeholder="Required skills and experience"
              />
            </div>
            <Button onClick={handlePostJob}>Post Job</Button>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription>{job.company} • {job.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{job.requirements}</p>
              {userRole === 'user' && (
                <Button 
                  size="sm" 
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied(job.id)}
                  className="w-full"
                >
                  {isApplied(job.id) ? 'Applied' : 'Apply Now'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobsTab;
