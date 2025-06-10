
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Briefcase, CreditCard, Plus, Eye, Upload } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeSectionProps {
  userRole: 'user' | 'instructor' | 'employer' | 'admin';
  onSectionClick: (section: string) => void;
}

const WelcomeSection = ({ userRole, onSectionClick }: WelcomeSectionProps) => {
  const sections = [
    {
      id: 'courses',
      title: 'Courses',
      description: 'Discover and learn from expert-led courses',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      actions: [
        { label: 'Browse Courses', action: () => onSectionClick('courses') },
        ...(userRole === 'instructor' ? [{ label: 'Add Course', action: () => onSectionClick('courses') }] : []),
      ]
    },
    {
      id: 'jobs',
      title: 'Jobs',
      description: 'Find your next career opportunity',
      icon: Briefcase,
      gradient: 'from-green-500 to-emerald-500',
      actions: [
        { label: 'Browse Jobs', action: () => onSectionClick('jobs') },
        ...(userRole === 'employer' ? [{ label: 'Post Job', action: () => onSectionClick('jobs') }] : []),
      ]
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Manage your course purchases and receipts',
      icon: CreditCard,
      gradient: 'from-purple-500 to-pink-500',
      actions: [
        { label: 'View Payments', action: () => onSectionClick('payments') },
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <CardHeader className="relative">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <section.icon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">{section.title}</CardTitle>
              <CardDescription className="text-lg">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-3">
              {section.actions.map((action, actionIndex) => (
                <Button
                  key={actionIndex}
                  onClick={action.action}
                  variant="outline"
                  className="w-full group-hover:border-primary transition-colors"
                >
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default WelcomeSection;
