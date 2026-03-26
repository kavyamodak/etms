
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay with credentials
const razorpay =
  razorpayKeyId && razorpayKeySecret
    ? new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      })
    : null;

export const createOrder = async (req, res) => {
  const { amount, currency = 'INR' } = req.body;

  if (!amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }

  if (!razorpay) {
    return res.status(500).json({ success: false, message: 'Razorpay is not configured on the server' });
  }

  try {
    const options = {
      amount: parseInt(amount * 100), // amount in the smallest currency unit (paise)
      currency: currency,
      receipt: `receipt_${Date.now()}`,
    };

    console.log('--- Razorpay Order Creation ---');
    console.log('Options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('Order Created:', order.id);
    console.log('-------------------------------');

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay order', error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  console.log('--- Razorpay Verification Debug ---');
  console.log('REQ BODY:', JSON.stringify(req.body));

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.error('❌ Missing verification parameters');
    return res.status(400).json({ 
      success: false, 
      message: 'Missing payment verification details',
      received: {
        order_id: !!razorpay_order_id,
        payment_id: !!razorpay_payment_id,
        signature: !!razorpay_signature
      }
    });
  }

  try {
    if (!razorpayKeySecret) {
      return res.status(500).json({ success: false, message: 'Razorpay is not configured on the server' });
    }

    const secret = razorpayKeySecret.toString().trim();
    const body = `${razorpay_order_id.toString().trim()}|${razorpay_payment_id.toString().trim()}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    console.log('Body for Hashing:', body);
    console.log('Expected Signature:', expectedSignature);
    console.log('Received Signature:', razorpay_signature.trim());
    console.log('Secret (masked):', `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`);
    console.log('-----------------------------------');

    if (expectedSignature === razorpay_signature.trim()) {
      console.log('✅ Signature verified successfully!');
      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.warn('❌ Signature mismatch for order:', razorpay_order_id);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature',
        error: 'Signature mismatch'
      });
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    res.status(500).json({ success: false, message: 'Verification process failed', error: error.message });
  }
};
