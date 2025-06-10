
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign, Building, FileText, Upload } from "lucide-react";
import { motion } from "framer-motion";

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

interface JobDetailPageProps {
  job: Job;
  onBack: () => void;
  onApply: (jobId: string, cv: File) => void;
  isApplied?: boolean;
  applicationStatus?: string;
  userRole: string;
}

const JobDetailPage = ({ 
  job, 
  onBack, 
  onApply, 
  isApplied, 
  applicationStatus,
  userRole 
}: JobDetailPageProps) => {
  const [cv, setCv] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleApply = async () => {
    if (cv) {
      setIsUploading(true);
      await onApply(job.id, cv);
      setIsUploading(false);
      setCv(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {job.description && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Job Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Requirements</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {userRole === 'user' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isApplied ? (
                  <>
                    <div>
                      <Label htmlFor="cv">Upload CV (PDF/DOC)</Label>
                      <Input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCv(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>

                    {cv && (
                      <div className="p-3 bg-green-50 rounded border">
                        <p className="text-sm text-green-700">
                          ✓ CV selected: {cv.name}
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleApply}
                      disabled={!cv || isUploading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      size="lg"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isUploading ? 'Submitting...' : 'Apply Now'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-3">
                    <Badge 
                      variant={
                        applicationStatus === 'accepted' ? 'default' : 
                        applicationStatus === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="w-full justify-center py-2"
                    >
                      {applicationStatus === 'accepted' && '✅ Application Accepted'}
                      {applicationStatus === 'rejected' && '❌ Application Rejected'}
                      {applicationStatus === 'applied' && '🟡 Application Pending'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {applicationStatus === 'accepted' && 'Congratulations! The employer has accepted your application.'}
                      {applicationStatus === 'rejected' && 'Unfortunately, your application was not successful this time.'}
                      {applicationStatus === 'applied' && 'Your application is being reviewed by the employer.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default JobDetailPage;
