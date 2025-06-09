
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Briefcase, Users, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const roles = [
    { id: "user", label: "Learner", icon: BookOpen, description: "Browse courses and jobs" },
    { id: "instructor", label: "Instructor", icon: Users, description: "Create and share courses" },
    { id: "employer", label: "Employer", icon: Briefcase, description: "Post job opportunities" },
    { id: "admin", label: "Admin", icon: Shield, description: "Platform administration" }
  ];

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    await signIn(loginEmail, loginPassword);
  };

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword) return;
    await signUp(signupEmail, signupPassword, selectedRole);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EthioLearn</h1>
          </div>
          <p className="text-muted-foreground">Join our learning community</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
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
                  onClick={handleLogin}
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
                  onClick={handleSignup}
                  disabled={!signupEmail || !signupPassword}
                >
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
