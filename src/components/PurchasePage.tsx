
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, CreditCard, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  price: number;
  phone_number?: string;
}

interface PurchasePageProps {
  course: Course;
  onBack: () => void;
  onSubmitReceipt: (paymentId: string, receipt: File) => void;
  loading?: boolean;
}

const PurchasePage = ({ course, onBack, onSubmitReceipt, loading }: PurchasePageProps) => {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [step, setStep] = useState<'payment' | 'receipt' | 'success'>('payment');

  const handleReceiptUpload = () => {
    if (receipt) {
      onSubmitReceipt(course.id, receipt);
      setStep('success');
    }
  };

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        <Card>
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Receipt Uploaded!</h2>
            <p className="text-muted-foreground mb-6">
              Your receipt has been uploaded and is pending verification.
              You'll be notified once your payment is approved.
            </p>
            <Button onClick={onBack} variant="outline">
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Course
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border">
              <h3 className="font-semibold mb-2">Course: {course.title}</h3>
              <p className="text-lg font-bold text-blue-600">Amount: {course.price} ETB</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Payment Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Send <strong>{course.price} ETB</strong> via Telebirr</li>
                <li>Send to: <strong>{course.phone_number}</strong></li>
                <li>Take a screenshot of your payment confirmation</li>
                <li>Upload the receipt using the form on the right</li>
              </ol>
            </div>

            <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please ensure your receipt clearly shows the transaction amount and recipient number.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Receipt
            </CardTitle>
            <CardDescription>
              Upload your payment receipt for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt">Payment Receipt (PNG/JPG)</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            {receipt && (
              <div className="p-3 bg-green-50 rounded border">
                <p className="text-sm text-green-700">
                  ✓ File selected: {receipt.name}
                </p>
              </div>
            )}

            <Button 
              onClick={handleReceiptUpload}
              disabled={!receipt || loading}
              className="w-full"
            >
              {loading ? 'Uploading...' : 'Submit Receipt'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your receipt will be reviewed by our team. You'll receive access once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default PurchasePage;
