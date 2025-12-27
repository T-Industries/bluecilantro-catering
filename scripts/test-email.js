// Test script for SMTP2Go email integration
// Run with: node scripts/test-email.js

require('dotenv').config()

async function testEmail() {
  const { SMTP2GO_API_KEY, SMTP2GO_SENDER_EMAIL } = process.env

  if (!SMTP2GO_API_KEY) {
    console.error('ERROR: SMTP2GO_API_KEY is not set in .env')
    process.exit(1)
  }

  console.log('Testing SMTP2Go email integration...')
  console.log(`API Key: ${SMTP2GO_API_KEY.slice(0, 10)}...`)
  console.log(`Sender Email: ${SMTP2GO_SENDER_EMAIL}`)

  const testOrderData = {
    orderId: 'TEST-' + Date.now(),
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '(555) 123-4567',
    fulfillmentType: 'delivery',
    scheduledDate: '2025-01-15',
    scheduledTime: '12:00 PM',
  }

  // Send to the same email as the sender (since it's verified)
  const toEmail = SMTP2GO_SENDER_EMAIL || 'gpwc@bluecilantro.ca'

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [toEmail],
        sender: SMTP2GO_SENDER_EMAIL,
        subject: `TEST: New Catering Order - ${testOrderData.orderId}`,
        text_body: `
NEW CATERING ORDER (TEST)
Order ID: ${testOrderData.orderId}

CUSTOMER INFORMATION
Name: ${testOrderData.customerName}
Email: ${testOrderData.customerEmail}
Phone: ${testOrderData.customerPhone}

ORDER DETAILS
Type: ${testOrderData.fulfillmentType.toUpperCase()}
Date: ${testOrderData.scheduledDate}
Time: ${testOrderData.scheduledTime}

ITEMS
- Butter Chicken x2 - $37.98
- Vegetable Samosas x1 - $12.99

Subtotal: $50.97
Delivery Fee: $25.00
TOTAL: $75.97

* This is a TEST email from BlueCilantro Catering system
        `,
        html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Order Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2D5A27; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">BlueCilantro Catering</h1>
    <p style="margin: 5px 0 0;">TEST ORDER - Please Ignore</p>
  </div>

  <div style="padding: 20px; background: #f9f9f9;">
    <p style="color: #666; font-size: 14px;">Order ID: ${testOrderData.orderId}</p>

    <h2 style="color: #2D5A27;">Customer Information</h2>
    <p><strong>Name:</strong> ${testOrderData.customerName}</p>
    <p><strong>Email:</strong> ${testOrderData.customerEmail}</p>
    <p><strong>Phone:</strong> ${testOrderData.customerPhone}</p>

    <h2 style="color: #2D5A27;">Order Details</h2>
    <p><strong>Type:</strong> ${testOrderData.fulfillmentType.toUpperCase()}</p>
    <p><strong>Date:</strong> ${testOrderData.scheduledDate}</p>
    <p><strong>Time:</strong> ${testOrderData.scheduledTime}</p>

    <h2 style="color: #2D5A27;">Items</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #eee;">
        <th style="padding: 8px; text-align: left;">Item</th>
        <th style="padding: 8px; text-align: center;">Qty</th>
        <th style="padding: 8px; text-align: right;">Price</th>
      </tr>
      <tr>
        <td style="padding: 8px;">Butter Chicken</td>
        <td style="padding: 8px; text-align: center;">2</td>
        <td style="padding: 8px; text-align: right;">$37.98</td>
      </tr>
      <tr>
        <td style="padding: 8px;">Vegetable Samosas</td>
        <td style="padding: 8px; text-align: center;">1</td>
        <td style="padding: 8px; text-align: right;">$12.99</td>
      </tr>
      <tr style="background: #2D5A27; color: white;">
        <td colspan="2" style="padding: 12px; text-align: right;"><strong>TOTAL:</strong></td>
        <td style="padding: 12px; text-align: right;"><strong>$75.97</strong></td>
      </tr>
    </table>

    <p style="background: #d4edda; padding: 10px; border-radius: 4px; margin-top: 20px; color: #155724;">
      This is a TEST email from the BlueCilantro Catering ordering system. If you received this, the email integration is working correctly!
    </p>
  </div>
</body>
</html>
        `,
      }),
    })

    const result = await response.json()

    console.log('\n--- SMTP2Go Response ---')
    console.log(JSON.stringify(result, null, 2))

    if (response.ok && result.data?.succeeded > 0) {
      console.log('\n SUCCESS! Test email sent to:', toEmail)
      console.log('Check your inbox (and spam folder) for the test email.')
    } else {
      console.error('\n FAILED to send email.')
      console.error('Error:', result.data?.error || result.data?.failures || 'Unknown error')
    }
  } catch (error) {
    console.error('\n ERROR:', error)
  }
}

testEmail()
