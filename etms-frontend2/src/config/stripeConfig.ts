// Stripe Configuration for ETMS
export const STRIPE_CONFIG = {
  // Frontend-safe publishable config only
  PUBLISHABLE_KEY: ((import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY as string) || '',
  SECRET_KEY: ((import.meta as any)?.env?.VITE_STRIPE_SECRET_KEY as string) || '',
  
  // Test Account IDs (Stripe Connect Test Accounts)
  TEST_DRIVER_ACCOUNT: 'acct_test_placeholder',
  TEST_EMPLOYEE_ACCOUNT: 'acct_test_placeholder',
  
  // Webhook Configuration
  WEBHOOK_SECRET: ((import.meta as any)?.env?.VITE_STRIPE_WEBHOOK_SECRET as string) || '',
  WEBHOOK_ENDPOINT: '/api/payments/webhook',
  
  // Payout Configuration
  DEFAULT_CURRENCY: 'usd',
  MINIMUM_PAYOUT_AMOUNT: 1.00, // $1 minimum
  MAXIMUM_PAYOUT_AMOUNT: 10000.00, // $10,000 maximum
  
  // Fee Configuration (for demo purposes)
  PLATFORM_FEE_PERCENTAGE: 0.0, // 0% for demo
  STRIPE_FEE_PERCENTAGE: 0.029, // 2.9% Stripe fee
  STRIPE_FEE_FIXED: 0.30, // $0.30 fixed fee
};

// Helper functions
export const calculateStripeFees = (amount: number): number => {
  return (amount * STRIPE_CONFIG.STRIPE_FEE_PERCENTAGE) + STRIPE_CONFIG.STRIPE_FEE_FIXED;
};

export const calculateNetAmount = (grossAmount: number): number => {
  const stripeFees = calculateStripeFees(grossAmount);
  const platformFees = grossAmount * STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE;
  return grossAmount - stripeFees - platformFees;
};

export const validatePayoutAmount = (amount: number): { valid: boolean; error?: string } => {
  if (amount < STRIPE_CONFIG.MINIMUM_PAYOUT_AMOUNT) {
    return { valid: false, error: `Minimum payout amount is $${STRIPE_CONFIG.MINIMUM_PAYOUT_AMOUNT}` };
  }
  
  if (amount > STRIPE_CONFIG.MAXIMUM_PAYOUT_AMOUNT) {
    return { valid: false, error: `Maximum payout amount is $${STRIPE_CONFIG.MAXIMUM_PAYOUT_AMOUNT}` };
  }
  
  return { valid: true };
};
