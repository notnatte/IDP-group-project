import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, DollarSign, Phone, Plus, User, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CourseDetailPage from "./CourseDetailPage";
import PurchasePage from "./PurchasePage";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor_id: string;
  pdf_storage_path?: string;
  phone_number?: string;
  profiles?: {
    email: string;
  };
}

interface Payment {
  id: string;
  course_id: string;
  status: string;
}

const CoursesTab = ({ userRole }: { userRole: string }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userPayments, setUserPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showPurchasePage, setShowPurchasePage] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newCourse, setNewCourse] = useState({
    title: "",
    price: "",
    description: "",
    phoneNumber: "",
    pdf: null as File | null
  });

  useEffect(() => {
    fetchCourses();
    if (userRole === 'user') {
      fetchUserPayments();
    }
  }, [userRole]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .select(`
          *,
          profiles:instructor_id (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error loading courses",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('payments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.price || !newCourse.description || !newCourse.phoneNumber || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let pdfPath = null;

      if (newCourse.pdf) {
        const fileExt = newCourse.pdf.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course-pdfs')
          .upload(fileName, newCourse.pdf);

        if (uploadError) throw uploadError;
        pdfPath = fileName;
      }

      const { error } = await (supabase as any)
        .from('courses')
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          price: parseInt(newCourse.price),
          phone_number: newCourse.phoneNumber,
          pdf_storage_path: pdfPath,
          instructor_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Course created successfully!",
        description: "Your course has been added to the platform.",
      });

      setNewCourse({ title: "", price: "", description: "", phoneNumber: "", pdf: null });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error creating course",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async (course: Course) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('payments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          status: 'pending'
        });

      if (error) throw error;

      setShowPurchasePage(true);
      fetchUserPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error processing purchase",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReceipt = async (paymentId: string, receipt: File) => {
    if (!receipt) return;

    try {
      setPurchaseLoading(true);
      const fileExt = receipt.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receipt);

      if (uploadError) throw uploadError;

      const payment = userPayments.find(p => p.course_id === paymentId);
      if (payment) {
        const { error } = await (supabase as any)
          .from('payments')
          .update({
            status: 'pending',
            receipt_storage_path: fileName
          })
          .eq('id', payment.id);

        if (error) throw error;
      }

      toast({
        title: "Receipt uploaded successfully!",
        description: "Your payment receipt has been submitted for review.",
      });

      setShowPurchasePage(false);
      setSelectedCourse(null);
      fetchUserPayments();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "Error uploading receipt",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleDownload = async (course: Course) => {
    if (!course.pdf_storage_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('course-pdfs')
        .download(course.pdf_storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const getPaymentStatus = (courseId: string) => {
    return userPayments.find(p => p.course_id === courseId)?.status;
  };

  const canDownload = (courseId: string) => {
    return getPaymentStatus(courseId) === 'approved';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (showPurchasePage && selectedCourse) {
    return (
      <PurchasePage
        course={selectedCourse}
        onBack={() => {
          setShowPurchasePage(false);
          setSelectedCourse(null);
        }}
        onSubmitReceipt={handleSubmitReceipt}
        loading={purchaseLoading}
      />
    );
  }

  if (selectedCourse) {
    const paymentStatus = getPaymentStatus(selectedCourse.id);
    const canDownloadCourse = canDownload(selectedCourse.id);
    
    return (
      <CourseDetailPage
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
        onPurchase={() => setShowPurchasePage(true)}
        paymentStatus={paymentStatus}
        canDownload={canDownloadCourse}
        onDownload={() => handleDownload(selectedCourse)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Add Course Form (Instructors only) */}
      {userRole === 'instructor' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Course
              </CardTitle>
              <CardDescription>Create a new course for students to enroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <Label htmlFor="course-price">Price (ETB)</Label>
                  <Input
                    id="course-price"
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                    placeholder="500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="course-description">Description</Label>
                <Input
                  id="course-description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  placeholder="Course description"
                />
              </div>
              <div>
                <Label htmlFor="phone-number">Phone Number (for payments)</Label>
                <Input
                  id="phone-number"
                  value={newCourse.phoneNumber}
                  onChange={(e) => setNewCourse({...newCourse, phoneNumber: e.target.value})}
                  placeholder="+251912345678"
                />
              </div>
              <div>
                <Label htmlFor="course-pdf">Course PDF</Label>
                <Input
                  id="course-pdf"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewCourse({...newCourse, pdf: e.target.files?.[0] || null})}
                />
              </div>
              <Button onClick={handleAddCourse} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Courses Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Available Courses</h3>
          <Badge variant="outline">{courses.length} courses</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        {course.title}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {course.profiles?.email || 'Unknown'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      <DollarSign className="h-3 w-3" />
                      {course.price}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {course.description}
                  </p>
                  
                  {course.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Payment: {course.phone_number}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button 
                      onClick={() => handleViewCourse(course)}
                      variant="outline"
                      className="w-full group-hover:border-primary transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {userRole === 'user' && (
                      <>
                        {!getPaymentStatus(course.id) && (
                          <Button 
                            onClick={() => handlePurchase(course)}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Buy Now
                          </Button>
                        )}
                        
                        {getPaymentStatus(course.id) && (
                          <Badge 
                            variant={
                              getPaymentStatus(course.id) === 'approved' ? 'default' : 
                              getPaymentStatus(course.id) === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className="w-full justify-center py-2"
                          >
                            {getPaymentStatus(course.id) === 'approved' && '✅ Purchased'}
                            {getPaymentStatus(course.id) === 'rejected' && '❌ Rejected'}
                            {getPaymentStatus(course.id) === 'pending' && '🟡 Pending'}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesTab;
