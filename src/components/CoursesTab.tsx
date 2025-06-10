
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Upload, DollarSign, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

      toast({
        title: "Payment initiated",
        description: `Please send ${course.price} ETB to ${course.phone_number} and upload your receipt in the Payments tab.`,
      });

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
    return <div className="text-center">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Course Form (Instructors only) */}
      {userRole === 'instructor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Add New Course
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  placeholder="Course title"
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
            <Button onClick={handleAddCourse} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    {course.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    by {course.profiles?.email || 'Unknown'}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {course.price} ETB
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {course.description}
              </p>
              
              {course.phone_number && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Phone className="h-4 w-4" />
                  {course.phone_number}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {userRole === 'user' && (
                  <>
                    {!getPaymentStatus(course.id) && (
                      <Button 
                        onClick={() => handlePurchase(course)}
                        className="w-full"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Buy Course
                      </Button>
                    )}
                    
                    {getPaymentStatus(course.id) === 'pending' && (
                      <Badge variant="outline" className="w-full justify-center py-2">
                        Payment Pending
                      </Badge>
                    )}
                    
                    {canDownload(course.id) && course.pdf_storage_path && (
                      <Button 
                        onClick={() => handleDownload(course)}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Course
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoursesTab;
