
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, DollarSign, User, ArrowLeft, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor_id: string;
  phone_number?: string;
  profiles?: {
    email: string;
  };
}

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onPurchase: (course: Course) => void;
  paymentStatus?: string;
  canDownload?: boolean;
  onDownload?: () => void;
}

const CourseDetailPage = ({ 
  course, 
  onBack, 
  onPurchase, 
  paymentStatus, 
  canDownload,
  onDownload 
}: CourseDetailPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <Button 
        onClick={onBack} 
        variant="ghost" 
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Courses
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-blue-500" />
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-lg mt-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Instructor: {course.profiles?.email || 'Unknown'}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {course.price} ETB
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Course Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description || 'No description available.'}
                  </p>
                </div>
                
                {course.phone_number && (
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900">Payment Information</h4>
                    <p className="text-blue-700">Send payment to: {course.phone_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!paymentStatus && (
                <Button 
                  onClick={() => onPurchase(course)}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Course - {course.price} ETB
                </Button>
              )}
              
              {paymentStatus === 'pending' && (
                <div className="text-center space-y-2">
                  <Badge variant="outline" className="w-full justify-center py-2 text-yellow-600 border-yellow-200">
                    🟡 Payment Pending
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Your payment is being verified
                  </p>
                </div>
              )}
              
              {paymentStatus === 'rejected' && (
                <div className="text-center space-y-2">
                  <Badge variant="destructive" className="w-full justify-center py-2">
                    ❌ Payment Rejected
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Please contact support or try again
                  </p>
                </div>
              )}
              
              {canDownload && (
                <div className="space-y-2">
                  <Badge variant="default" className="w-full justify-center py-2 text-green-600 bg-green-50 border-green-200">
                    ✅ Access Granted
                  </Badge>
                  <Button 
                    onClick={onDownload}
                    variant="outline"
                    className="w-full"
                  >
                    Download Course Material
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseDetailPage;
