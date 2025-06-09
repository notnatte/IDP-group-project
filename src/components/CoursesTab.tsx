
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor_id: string;
  pdf_url?: string;
  profiles?: {
    email: string;
  };
}

const CoursesTab = ({ userRole }: { userRole: string }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newCourse, setNewCourse] = useState({
    title: "",
    price: "",
    description: "",
    pdf: null as File | null
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
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

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.price || !newCourse.description || !user) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          price: parseInt(newCourse.price),
          instructor_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Course created successfully!",
        description: "Your course has been added to the platform.",
      });

      setNewCourse({ title: "", price: "", description: "", pdf: null });
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

  const handlePurchase = async (courseId: string) => {
    if (!user) return;

    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount: course.price,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Payment record created",
        description: "Please upload your payment receipt in the Payments tab.",
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error processing purchase",
        description: "Please try again later",
        variant: "destructive",
      });
    }
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
            <CardTitle>Add New Course</CardTitle>
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
              <Label htmlFor="course-pdf">Course PDF</Label>
              <Input
                id="course-pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => setNewCourse({...newCourse, pdf: e.target.files?.[0] || null})}
              />
            </div>
            <Button onClick={handleAddCourse}>Add Course</Button>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription>by {course.profiles?.email || 'Unknown'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{course.price} ETB</span>
                {userRole === 'user' && (
                  <Button 
                    size="sm" 
                    onClick={() => handlePurchase(course.id)}
                  >
                    Buy
                  </Button>
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
