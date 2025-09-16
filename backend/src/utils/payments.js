// Payment gateway stubs for Razorpay/Stripe
// In production, integrate official SDKs and verify signatures securely.

async function createPaymentIntent({ gateway = 'razorpay', amount, currency = 'INR', metadata = {} }) {
  // Returns a client secret or order id depending on gateway
  if (gateway === 'stripe') {
    // TODO: integrate Stripe PaymentIntent
    return { provider: 'stripe', clientSecret: 'stub_client_secret', amount, currency, metadata };
  }
  // Default: Razorpay order creation stub
  return { provider: 'razorpay', orderId: 'stub_order_id', amount, currency, metadata };
}

function verifyWebhookSignature({ gateway = 'razorpay', req }) {
  // TODO: verify using gateway secret and headers
  return true; // stub: always true
}

module.exports = { createPaymentIntent, verifyWebhookSignature };
