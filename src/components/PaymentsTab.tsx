
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  status: string;
  receipt_storage_path?: string;
  created_at: string;
  courses?: {
    title: string;
    phone_number?: string;
  };
  profiles?: {
    email: string;
  };
}

const PaymentsTab = ({ userRole }: { userRole: string }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");

  useEffect(() => {
    fetchPayments();
  }, [userRole]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      let query = (supabase as any)
        .from('payments')
        .select(`
          *,
          courses (title, phone_number),
          profiles (email)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only show user's own payments
      if (userRole !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error loading payments",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !selectedPaymentId) return;

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { error } = await (supabase as any)
        .from('payments')
        .update({
          status: 'pending',
          receipt_storage_path: fileName
        })
        .eq('id', selectedPaymentId);

      if (error) throw error;

      toast({
        title: "Receipt uploaded successfully!",
        description: "Your payment receipt has been submitted for review.",
      });

      setReceiptFile(null);
      setSelectedPaymentId("");
      fetchPayments();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "Error uploading receipt",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment approved",
        description: "The payment has been approved successfully.",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "Error approving payment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment rejected",
        description: "The payment has been rejected.",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error rejecting payment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleViewReceipt = async (receiptPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(receiptPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast({
        title: "Error viewing receipt",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading payments...</div>;
  }

  const pendingPayments = payments.filter(p => !p.receipt_storage_path && p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Upload Receipt (Users only) */}
      {userRole !== 'admin' && pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Payment Receipt
            </CardTitle>
            <CardDescription>
              Upload your payment screenshot to get course access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payment-select">Select Payment</Label>
              <select
                id="payment-select"
                className="w-full p-2 border rounded"
                value={selectedPaymentId}
                onChange={(e) => setSelectedPaymentId(e.target.value)}
              >
                <option value="">Select a payment...</option>
                {pendingPayments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.courses?.title} - {payment.amount} ETB
                    {payment.courses?.phone_number && ` (Send to: ${payment.courses.phone_number})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="receipt-file">Payment Receipt (Image)</Label>
              <Input
                id="receipt-file"
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button 
              onClick={handleUploadReceipt} 
              disabled={!receiptFile || !selectedPaymentId}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Receipt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          {userRole === 'admin' ? 'Payment Receipts to Review' : 'My Payment History'}
        </h3>
        
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">
                      {payment.courses?.title || 'Unknown Course'}
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      <p>Amount: {payment.amount} ETB</p>
                      <p>Date: {new Date(payment.created_at).toLocaleDateString()}</p>
                      {userRole === 'admin' && payment.profiles?.email && (
                        <p>User: {payment.profiles.email}</p>
                      )}
                      {payment.courses?.phone_number && (
                        <p>Payment Phone: {payment.courses.phone_number}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        payment.status === 'approved' ? 'default' : 
                        payment.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="flex items-center gap-1"
                    >
                      {payment.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                      {payment.status === 'rejected' && <XCircle className="h-3 w-3" />}
                      {payment.status}
                    </Badge>
                    
                    {payment.receipt_storage_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(payment.receipt_storage_path!)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {userRole === 'admin' && payment.status === 'pending' && payment.receipt_storage_path && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovePayment(payment.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRejectPayment(payment.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
