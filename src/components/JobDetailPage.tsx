
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign, Building, FileText, Upload, CheckCircle } from "lucide-react";
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleApply = async () => {
    if (cv) {
      setIsUploading(true);
      try {
        await onApply(job.id, cv);
        setShowConfirmation(true);
        setCv(null);
        // Hide confirmation after 3 seconds
        setTimeout(() => setShowConfirmation(false), 3000);
      } catch (error) {
        console.error('Error applying to job:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '🟡';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'accepted': return 'Congratulations! Your application has been accepted.';
      case 'rejected': return 'Application Rejected - Unfortunately, your application was not successful this time.';
      default: return 'Your CV has been uploaded and is pending verification.';
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
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {job.title}
                  </CardTitle>
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
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Job Description
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Requirements
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {job.requirements}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Section */}
        {userRole === 'user' && (
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Apply for this Job
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Application Submitted!</p>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Your CV has been uploaded and is pending verification.
                    </p>
                  </motion.div>
                )}

                {!isApplied ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="cv" className="text-base font-medium">
                        Upload CV
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Accepted formats: PDF, DOC, DOCX
                      </p>
                      <Input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCv(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>

                    {cv && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-green-700">
                          <FileText className="h-4 w-4" />
                          <p className="text-sm font-medium">
                            CV selected: {cv.name}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <Button 
                      onClick={handleApply}
                      disabled={!cv || isUploading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Apply Now
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border">
                      <Badge 
                        variant={getStatusBadgeVariant(applicationStatus || 'applied')}
                        className="w-full justify-center py-3 text-base"
                      >
                        {getStatusIcon(applicationStatus || 'applied')} Application {applicationStatus === 'accepted' ? 'Accepted' : applicationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-3">
                        {getStatusMessage(applicationStatus || 'applied')}
                      </p>
                    </div>

                    {applicationStatus === 'accepted' && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 font-medium text-center">
                          🎉 You can expect to hear from the employer soon!
                        </p>
                      </div>
                    )}
                  </motion.div>
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
