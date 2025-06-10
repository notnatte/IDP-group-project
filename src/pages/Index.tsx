
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WelcomeSection from "@/components/WelcomeSection";
import CoursesTab from "@/components/CoursesTab";
import JobsTab from "@/components/JobsTab";
import PaymentsTab from "@/components/PaymentsTab";

const Index = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-lg">Loading EthioLearn...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSectionClick = (section: string) => {
    setActiveTab(section);
  };

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  EthioLearn
                </h1>
              </div>
              <Badge variant="outline" className="capitalize font-medium">
                {userRole}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="outline" onClick={signOut}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2">
                Welcome back!
              </h2>
              <p className="text-xl text-muted-foreground">
                {userRole === 'user' && "Explore courses and job opportunities"}
                {userRole === 'instructor' && "Manage your courses and create new content"}
                {userRole === 'employer' && "Post job opportunities and find talent"}
                {userRole === 'admin' && "Oversee platform operations and approvals"}
              </p>
            </div>
            
            {activeTab !== 'welcome' && (
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('welcome')}
              >
                ← Back to Dashboard
              </Button>
            )}
          </div>

          <TabsList className={`mb-8 ${activeTab === 'welcome' ? 'hidden' : ''}`}>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome">
            <WelcomeSection userRole={userRole as any} onSectionClick={handleSectionClick} />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab userRole={userRole as any} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsTab userRole={userRole as any} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab userRole={userRole as any} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
