
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CoursesTab from "@/components/CoursesTab";
import JobsTab from "@/components/JobsTab";
import PaymentsTab from "@/components/PaymentsTab";

const Index = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EthioLearn</h1>
            <Badge variant="outline" className="capitalize">{userRole}</Badge>
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

        <WelcomePage userRole={userRole as any} />
      </div>
    </div>
  );
};

const WelcomePage = ({ userRole }: { userRole: 'user' | 'instructor' | 'employer' | 'admin' }) => {
  const [activeTab, setActiveTab] = useState("courses");

  const getAvailableTabs = () => {
    const baseTabs = ["courses", "jobs"];
    baseTabs.push("payments");
    return baseTabs;
  };

  return (
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
  );
};

export default Index;
