import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  CreditCard,
  Loader2,
  X,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { razorpayAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface RazorpayPaymentProps {
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export default function RazorpayPayment({ onClose, userEmail, userName }: RazorpayPaymentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Standard',
      price: 0,
      description: 'Basic transport features for everyday employees.',
      features: ['Standard Route Matching', 'Basic Live Tracking', 'Email Support'],
      highlight: false,
    },
    {
      name: 'Premium',
      price: 999,
      description: 'Priority routing and advanced safety features.',
      features: [
        'Priority Route Assignment',
        'Real-time ETA Predictions',
        '24/7 VIP Concierge',
        'Advanced SOS Features',
        'Family Tracking Alerts'
      ],
      highlight: true,
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      name: 'Enterprise',
      price: 2499,
      description: 'The ultimate transport experience for executives.',
      features: [
        'All Premium Features',
        'Dedicated Luxury Vehicle',
        'Zero-Wait Pickup',
        'Custom Route Planning',
        'Monthly Usage Reports'
      ],
      highlight: false,
    }
  ];

  const handlePayment = async (amount: number, planName: string) => {
    if (amount === 0) {
      toast.success(`You are already on the ${planName} plan!`);
      return;
    }

    setLoading(true);
    try {
      const orderData = await razorpayAPI.createOrder(amount);

      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key is not configured');
      }
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TRANZO Premium',
        description: `Upgrade to ${planName} Plan`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          console.log('--- Razorpay Payment Response ---', response);
          try {
            const verification = await razorpayAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.success) {
              // Record the payment in the system
              await paymentAPI.create({
                user_id: user?.id || 0,
                amount: amount,
                payment_method: 'upi', // Defaulting to UPI for now, but Razorpay handles it
                transaction_id: response.razorpay_payment_id
              }).catch(err => console.error('Failed to record payment:', err));

              toast.success(`Welcome to ${planName}! Your upgrade was successful.`);
              onClose();
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            toast.error('Verification error occurred.');
          }
        },
        prefill: {
          name: userName || 'Employee',
          email: userEmail || 'employee@company.com',
          contact: '9999999999'
        },
        notes: {
          plan: planName,
          user_id: userEmail
        },
        theme: {
          color: '#059669'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment Error:', error);
      toast.error('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Side - Info */}
          <div className="lg:w-1/3 bg-gradient-to-br from-emerald-700 to-teal-800 p-12 text-white flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-6">Upgrade to Premium</h1>
              <p className="text-emerald-100 text-lg leading-relaxed mb-8">
                Experience the next level of corporate mobility with TRANZO Premium. 
                Smarter routes, priority service, and enhanced safety for your daily commute.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  </div>
                  <span>Enterprise-grade Safety</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-200" />
                  </div>
                  <span>AI Route Optimization</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center gap-2 opacity-60">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm tracking-wide">SECURE RAZORPAY GATEWAY</span>
            </div>
          </div>

          {/* Right Side - Plans */}
          <div className="lg:w-2/3 p-12 bg-gray-50">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => (
                <Card 
                  key={idx}
                  className={`relative p-8 rounded-3xl border-none shadow-xl transition-all duration-300 ${
                    plan.highlight 
                      ? 'bg-white ring-4 ring-emerald-500/20 scale-105 z-10' 
                      : 'bg-white hover:scale-102'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-500 text-sm leading-snug">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <span className="text-4xl font-black text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 text-sm ml-1">/mo</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${plan.highlight ? 'text-emerald-500' : 'text-gray-300'}`} />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePayment(plan.price, plan.name)}
                    disabled={loading}
                    className={`w-full h-12 rounded-2xl font-bold transition-all ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/40 hover:scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : plan.price === 0 ? 'Current Plan' : 'Get Started'}
                  </Button>
                </Card>
              ))}
            </div>

            {/* Test Mode Note */}
            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-orange-700">
                <strong>Test Mode:</strong> Use Razorpay test credentials to complete the transaction. 
                No real money will be charged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
