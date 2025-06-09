
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminUserCreator = () => {
  const { toast } = useToast();

  useEffect(() => {
    const createAdminUser = async () => {
      try {
        // Check if admin user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const adminExists = existingUsers?.users?.find(user => user.email === 'admin@gmail.com');
        
        if (adminExists) {
          console.log('Admin user already exists');
          return;
        }

        // Create admin user
        const { data, error } = await supabase.auth.signUp({
          email: 'admin@gmail.com',
          password: '0922494501Aa',
          options: {
            data: { role: 'admin' }
          }
        });

        if (error) {
          console.error('Error creating admin user:', error);
          return;
        }

        if (data.user) {
          // Update the user's role to admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Error updating admin role:', updateError);
          } else {
            console.log('Admin user created successfully');
            toast({
              title: "Admin user created",
              description: "Admin user has been created with email: admin@gmail.com",
            });
          }
        }
      } catch (error) {
        console.error('Error in admin user creation:', error);
      }
    };

    // Only run once when component mounts
    createAdminUser();
  }, [toast]);

  return null; // This component doesn't render anything
};

export default AdminUserCreator;
