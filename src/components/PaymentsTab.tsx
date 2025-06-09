
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  status: string;
  receipt_url?: string;
  created_at: string;
  courses?: {
    title: string;
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
          courses (title),
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
      // In a real app, you would upload the file to Supabase Storage
      // For now, we'll just update the payment status
      const { error } = await (supabase as any)
        .from('payments')
        .update({
          status: 'pending',
          receipt_url: 'uploaded_receipt.jpg' // This would be the actual file URL
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

  if (loading) {
    return <div className="text-center">Loading payments...</div>;
  }

  const pendingPayments = payments.filter(p => !p.receipt_url && p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Upload Receipt (Users only) */}
      {userRole !== 'admin' && pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Payment Receipt</CardTitle>
            <CardDescription>Upload your Telebirr payment screenshot for course access</CardDescription>
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
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="receipt-file">Payment Receipt</Label>
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
            >
              Upload Receipt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {userRole === 'admin' ? 'Payment Receipts to Review' : 'My Payment History'}
        </h3>
        
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h4 className="font-medium">{payment.courses?.title || 'Unknown Course'}</h4>
                <p className="text-sm text-muted-foreground">
                  {payment.amount} ETB • {new Date(payment.created_at).toLocaleDateString()}
                  {userRole === 'admin' && payment.profiles?.email && (
                    <> • {payment.profiles.email}</>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={
                    payment.status === 'approved' ? 'default' : 
                    payment.status === 'rejected' ? 'destructive' : 'secondary'
                  }
                >
                  {payment.status}
                </Badge>
                {userRole === 'admin' && payment.status === 'pending' && payment.receipt_url && (
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprovePayment(payment.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectPayment(payment.id)}
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

export default PaymentsTab;
