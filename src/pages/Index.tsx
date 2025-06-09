import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Briefcase, Users, Shield, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'instructor' | 'employer' | 'admin' | null>(null);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  const handleLogin = (email: string, password: string, role: string) => {
    // In real app, this would be Supabase auth
    console.log('Login attempt:', { email, password, role });
    setIsLoggedIn(true);
    setUserRole(role as any);
  };

  const handleSignup = (email: string, password: string, role: string) => {
    // In real app, this would be Supabase auth with role in user_metadata
    console.log('Signup attempt:', { email, password, role });
    setIsLoggedIn(true);
    setUserRole(role as any);
  };

  if (isLoggedIn && userRole) {
    return <WelcomePage userRole={userRole} onLogout={() => { setIsLoggedIn(false); setUserRole(null); }} />;
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EthioLearn</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Learn, Share, Earn in Ethiopia</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A platform designed for Ethiopian youth and women to access online courses, 
            share resources, and discover job opportunities.
          </p>
          <div className="flex justify-center space-x-4 mb-12">
            <Badge variant="secondary" className="px-4 py-2">
              <BookOpen className="w-4 h-4 mr-2" />
              Learn Skills
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Briefcase className="w-4 h-4 mr-2" />
              Find Jobs
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Share Resources
            </Badge>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-md">
          <AuthTabs onLogin={handleLogin} onSignup={handleSignup} />
        </div>
      </section>
    </div>
  );
};

const AuthTabs = ({ onLogin, onSignup }: { 
  onLogin: (email: string, password: string, role: string) => void;
  onSignup: (email: string, password: string, role: string) => void;
}) => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");

  const roles = [
    { id: "user", label: "Learner", icon: BookOpen, description: "Browse courses and jobs" },
    { id: "instructor", label: "Instructor", icon: Users, description: "Create and share courses" },
    { id: "employer", label: "Employer", icon: Briefcase, description: "Post job opportunities" },
    { id: "admin", label: "Admin", icon: Shield, description: "Platform administration" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>Join EthioLearn to access courses and opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => onLogin(loginEmail, loginPassword, selectedRole)}
              disabled={!loginEmail || !loginPassword}
            >
              Login
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Choose Your Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <Card 
                    key={role.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRole === role.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardContent className="p-3 text-center">
                      <role.icon className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button 
              className="w-full"
              onClick={() => onSignup(signupEmail, signupPassword, selectedRole)}
              disabled={!signupEmail || !signupPassword}
            >
              Create Account
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const WelcomePage = ({ userRole, onLogout }: { 
  userRole: 'user' | 'instructor' | 'employer' | 'admin';
  onLogout: () => void;
}) => {
  const [activeTab, setActiveTab] = useState("courses");

  const getAvailableTabs = () => {
    const baseTabs = ["courses", "jobs"];
    baseTabs.push("payments");
    return baseTabs;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EthioLearn</h1>
            <Badge variant="outline" className="capitalize">{userRole}</Badge>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            {userRole === 'user' && "Explore courses and job opportunities"}
            {userRole === 'instructor' && "Manage your courses and create new content"}
            {userRole === 'employer' && "Post job opportunities and find talent"}
            {userRole === 'admin' && "Oversee platform operations and approvals"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            {getAvailableTabs().map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="courses">
            <CoursesTab userRole={userRole} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsTab userRole={userRole} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const CoursesTab = ({ userRole }: { userRole: string }) => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Web Development Fundamentals",
      instructor: "John Doe",
      price: 500,
      description: "Learn HTML, CSS, and JavaScript basics",
      purchased: userRole === 'user' ? false : true
    },
    {
      id: 2,
      title: "Digital Marketing Essentials",
      instructor: "Jane Smith",
      price: 750,
      description: "Master social media and online marketing",
      purchased: userRole === 'user' ? true : true
    }
  ]);

  const [newCourse, setNewCourse] = useState({
    title: "",
    price: "",
    description: "",
    pdf: null as File | null
  });

  const handlePurchase = (courseId: number) => {
    console.log('Purchasing course:', courseId);
    // In real app, this would redirect to payment upload
  };

  const handleAddCourse = () => {
    if (!newCourse.title || !newCourse.price || !newCourse.description) return;
    
    const course = {
      id: Date.now(),
      title: newCourse.title,
      instructor: "You",
      price: parseInt(newCourse.price),
      description: newCourse.description,
      purchased: true
    };
    
    setCourses([...courses, course]);
    setNewCourse({ title: "", price: "", description: "", pdf: null });
  };

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
              <CardDescription>by {course.instructor}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{course.price} ETB</span>
                {userRole === 'user' && (
                  <Button 
                    size="sm" 
                    onClick={() => handlePurchase(course.id)}
                    disabled={course.purchased}
                  >
                    {course.purchased ? 'Purchased' : 'Buy'}
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

const JobsTab = ({ userRole }: { userRole: string }) => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      company: "Tech Solutions",
      location: "Addis Ababa",
      requirements: "React, TypeScript experience required",
      applied: userRole === 'user' ? false : true
    },
    {
      id: 2,
      title: "Digital Marketing Specialist",
      company: "Marketing Pro",
      location: "Remote",
      requirements: "Social media marketing experience",
      applied: userRole === 'user' ? true : true
    }
  ]);

  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    requirements: ""
  });

  const handleApply = (jobId: number) => {
    console.log('Applying to job:', jobId);
    setJobs(jobs.map(job => 
      job.id === jobId ? {...job, applied: true} : job
    ));
  };

  const handlePostJob = () => {
    if (!newJob.title || !newJob.location || !newJob.requirements) return;
    
    const job = {
      id: Date.now(),
      title: newJob.title,
      company: "Your Company",
      location: newJob.location,
      requirements: newJob.requirements,
      applied: false
    };
    
    setJobs([...jobs, job]);
    setNewJob({ title: "", location: "", requirements: "" });
  };

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
                  disabled={job.applied}
                  className="w-full"
                >
                  {job.applied ? 'Applied' : 'Apply Now'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PaymentsTab = ({ userRole }: { userRole: string }) => {
  const [receipts, setReceipts] = useState([
    {
      id: 1,
      course: "Web Development Fundamentals",
      amount: 500,
      status: "pending",
      submittedAt: "2024-01-15"
    },
    {
      id: 2,
      course: "Digital Marketing Essentials",
      amount: 750,
      status: "approved",
      submittedAt: "2024-01-10"
    }
  ]);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleUploadReceipt = () => {
    if (!receiptFile) return;
    
    const newReceipt = {
      id: Date.now(),
      course: "Selected Course",
      amount: 500,
      status: "pending",
      submittedAt: new Date().toISOString().split('T')[0]
    };
    
    setReceipts([...receipts, newReceipt]);
    setReceiptFile(null);
  };

  const handleApproveReceipt = (receiptId: number) => {
    setReceipts(receipts.map(receipt => 
      receipt.id === receiptId ? {...receipt, status: "approved"} : receipt
    ));
  };

  const handleRejectReceipt = (receiptId: number) => {
    setReceipts(receipts.map(receipt => 
      receipt.id === receiptId ? {...receipt, status: "rejected"} : receipt
    ));
  };

  return (
    <div className="space-y-6">
      {/* Upload Receipt (Users only) */}
      {userRole !== 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Payment Receipt</CardTitle>
            <CardDescription>Upload your Telebirr payment screenshot for course access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt-file">Payment Receipt</Label>
              <Input
                id="receipt-file"
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button onClick={handleUploadReceipt} disabled={!receiptFile}>
              Upload Receipt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Receipts List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {userRole === 'admin' ? 'Payment Receipts to Review' : 'My Payment History'}
        </h3>
        
        {receipts.map((receipt) => (
          <Card key={receipt.id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h4 className="font-medium">{receipt.course}</h4>
                <p className="text-sm text-muted-foreground">
                  {receipt.amount} ETB • Submitted {receipt.submittedAt}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={
                    receipt.status === 'approved' ? 'default' : 
                    receipt.status === 'rejected' ? 'destructive' : 'secondary'
                  }
                >
                  {receipt.status}
                </Badge>
                {userRole === 'admin' && receipt.status === 'pending' && (
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveReceipt(receipt.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectReceipt(receipt.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
