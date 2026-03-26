# Stripe Test Mode Integration - ETMS

## Overview
This guide documents the Stripe Test Mode integration for the Employee Transport Management System (ETMS). The implementation allows admins to create payouts for drivers and employees using Stripe's test environment.

## Architecture

### Frontend Components
- **PaymentService** (`src/services/paymentService.ts`) - Stripe API integration
- **StripeConfig** (`src/config/stripeConfig.ts`) - Configuration and utilities
- **PaymentsPage** (`src/components/PaymentsPage.tsx`) - UI for payout management
- **API Extensions** (`src/services/api.ts`) - Payment API endpoints

### Backend Requirements
- Node.js/Express server with Stripe integration
- Database table: `payouts`
- API endpoints: `/api/payments/*`
- Webhook endpoint: `/api/payments/webhook`

## Database Schema

### Payouts Table
```sql
CREATE TABLE payouts (
  id VARCHAR(255) PRIMARY KEY,
  recipient_id VARCHAR(255) NOT NULL,
  recipient_type ENUM('driver', 'employee') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  stripe_transfer_id VARCHAR(255),
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /api/payments/payout
Create a new payout
```json
{
  "recipient_id": "driver_123",
  "recipient_type": "driver",
  "amount": 1500.00,
  "currency": "usd"
}
```

### GET /api/payments/history
Get all payout history
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_123",
      "recipient_id": "driver_123",
      "recipient_type": "driver",
      "amount": 1500.00,
      "currency": "usd",
      "stripe_transfer_id": "tr_123",
      "status": "success",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### GET /api/drivers/available-for-payout
Get drivers available for payout
```json
{
  "success": true,
  "drivers": [
    {
      "id": "driver_123",
      "name": "John Doe",
      "vehicle_number": "ETM-042",
      "earnings": 1500.00
    }
  ]
}
```

### GET /api/employees/available-for-payout
Get employees available for payout
```json
{
  "success": true,
  "employees": [
    {
      "id": "emp_123",
      "name": "Jane Smith",
      "project_code": "PROJ001",
      "salary": 3000.00
    }
  ]
}
```

### PUT /api/payments/:id/update
Update payout status
```json
{
  "status": "success",
  "stripe_transfer_id": "tr_123"
}
```

### POST /api/payments/webhook
Handle Stripe webhooks
```json
{
  "type": "transfer.created",
  "data": {
    "object": {
      "id": "tr_123",
      "amount": 150000,
      "currency": "usd",
      "destination": "acct_test_123"
    }
  }
}
```

## Environment Configuration

### .env.local
```bash
# Stripe Test Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
VITE_STRIPE_SECRET_KEY=sk_test_51234567890abcdef
VITE_STRIPE_WEBHOOK_SECRET=whsec_test_placeholder

# API Configuration
VITE_API_URL=http://localhost:5000/api
```

## Installation & Setup

### 1. Install Dependencies
```bash
npm install stripe@^17.2.0
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your Stripe test keys
```

### 3. Stripe Dashboard Setup
1. Create a Stripe account (test mode)
2. Get test API keys from Dashboard > Developers > API keys
3. Create test connected accounts for drivers/employees
4. Set up webhook endpoint in Dashboard > Developers > Webhooks

## Usage

### Admin Payout Creation
1. Navigate to `/admin/payments`
2. Select recipient type (Driver/Employee)
3. Choose recipient from dropdown
4. Enter payout amount
5. Click "Generate Payout"
6. View Stripe Transfer ID on success

### Payout Status Tracking
- **Pending**: Payout created, awaiting Stripe processing
- **Success**: Transfer completed successfully
- **Failed**: Transfer failed, check Stripe dashboard

## Business Logic

### Driver Earnings Calculation
```javascript
// Based on completed trips
const earnings = trips
  .filter(trip => trip.status === 'completed')
  .reduce((sum, trip) => sum + trip.earnings, 0);
```

### Employee Salary Calculation
```javascript
// Fixed monthly salary based on project code
const salary = getSalaryByProjectCode(projectCode);
```

### Payout Validation
- Minimum amount: $1.00
- Maximum amount: $10,000.00
- Valid recipient required
- Sufficient balance validation (backend)

## Security Considerations

### Frontend
- Environment variables for API keys
- Input validation and sanitization
- Error handling and user feedback
- Loading states and disabled buttons

### Backend
- Stripe signature verification for webhooks
- Role-based access control
- Audit logging for all payouts
- Rate limiting on payout creation

## Testing

### Test Scenarios
1. **Successful Payout**: Create payout for driver with valid amount
2. **Failed Payout**: Insufficient funds or invalid recipient
3. **Webhook Processing**: Simulate Stripe webhook events
4. **Error Handling**: Network errors, API failures

### Test Data
```javascript
// Test driver
{
  id: "driver_test_123",
  name: "Test Driver",
  vehicle_number: "ETM-TEST",
  earnings: 1500.00
}

// Test employee
{
  id: "emp_test_123",
  name: "Test Employee",
  project_code: "TEST_PROJ",
  salary: 3000.00
}
```

## Monitoring & Logging

### Frontend
- Console logging for debugging
- Error state management
- Success message display
- Loading indicators

### Backend
- Payout creation logs
- Stripe API response logging
- Webhook event logging
- Error tracking and alerting

## Troubleshooting

### Common Issues
1. **API Key Errors**: Verify environment variables
2. **Network Issues**: Check API endpoint accessibility
3. **Stripe Errors**: Verify test mode and account setup
4. **Webhook Failures**: Check endpoint URL and secret

### Debug Mode
```javascript
// Enable debug logging
console.log('Stripe Config:', STRIPE_CONFIG);
console.log('API Response:', response);
```

## Future Enhancements

### Phase 2 Features
- Recurring payouts
- Bulk payout creation
- Payout scheduling
- Advanced reporting
- Email notifications
- Mobile app integration

### Integration Points
- Accounting software sync
- Banking API integration
- Advanced analytics
- Compliance reporting

## Support

### Documentation
- Stripe API documentation: https://stripe.com/docs/api
- Stripe Connect documentation: https://stripe.com/docs/connect
- React Stripe integration: https://stripe.com/docs/stripe-js/react

### Contact
- For technical issues: Check console logs and network tab
- For Stripe issues: Refer to Stripe dashboard
- For business logic: Review payout calculation rules
