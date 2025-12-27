interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress?: string
  fulfillmentType: string
  scheduledDate: string
  scheduledTime: string
  items: Array<{
    itemName: string
    quantity: number
    guestCount?: number
    lineTotal: string
    notes?: string
  }>
  subtotal: string
  deliveryFee: string
  total: string
  notes?: string
  businessName?: string
  businessPhone?: string
  businessAddress?: string
}

export async function sendOrderNotification(
  toEmail: string,
  orderData: OrderEmailData
): Promise<boolean> {
  const { SMTP2GO_API_KEY, SMTP2GO_SENDER_EMAIL } = process.env

  // If SMTP2Go is not configured, log to console (for local development)
  if (!SMTP2GO_API_KEY) {
    console.log('='.repeat(60))
    console.log('ORDER NOTIFICATION EMAIL (SMTP2Go not configured)')
    console.log('='.repeat(60))
    console.log(`To: ${toEmail}`)
    console.log(`Subject: New Catering Order - ${orderData.orderId.slice(0, 8)}`)
    console.log('-'.repeat(60))
    console.log(formatOrderEmailText(orderData))
    console.log('='.repeat(60))
    return true
  }

  const senderEmail = SMTP2GO_SENDER_EMAIL || 'orders@bluecilantro.ca'

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [toEmail],
        sender: senderEmail,
        subject: `New Catering Order - ${orderData.orderId.slice(0, 8)}`,
        text_body: formatOrderEmailText(orderData),
        html_body: formatOrderEmailHtml(orderData),
      }),
    })

    const result = await response.json()

    if (!response.ok || result.data?.error) {
      console.error('SMTP2Go error:', result)
      return false
    }

    console.log('Email sent successfully via SMTP2Go')
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

function formatOrderEmailText(data: OrderEmailData): string {
  const lines = [
    `NEW CATERING ORDER`,
    `Order ID: ${data.orderId}`,
    ``,
    `CUSTOMER INFORMATION`,
    `Name: ${data.customerName}`,
    `Email: ${data.customerEmail}`,
    `Phone: ${data.customerPhone}`,
    data.customerAddress ? `Address: ${data.customerAddress}` : '',
    ``,
    `ORDER DETAILS`,
    `Type: ${data.fulfillmentType.toUpperCase()}`,
    `Date: ${data.scheduledDate}`,
    `Time: ${data.scheduledTime}`,
    ``,
    `ITEMS`,
  ]

  data.items.forEach((item) => {
    lines.push(`- ${item.itemName} x${item.quantity}${item.guestCount ? ` (${item.guestCount} guests)` : ''} - ${item.lineTotal}`)
    if (item.notes) {
      lines.push(`  Note: ${item.notes}`)
    }
  })

  lines.push(``)
  lines.push(`Subtotal: ${data.subtotal}`)
  if (parseFloat(data.deliveryFee.replace(/[^0-9.-]/g, '')) > 0) {
    lines.push(`Delivery Fee: ${data.deliveryFee}`)
  }
  lines.push(`TOTAL: ${data.total}`)

  if (data.notes) {
    lines.push(``)
    lines.push(`ORDER NOTES: ${data.notes}`)
  }

  lines.push(``)
  lines.push(`* Prices do not include taxes. Please confirm final amount with customer.`)

  return lines.filter(Boolean).join('\n')
}

function formatOrderEmailHtml(data: OrderEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName}${item.notes ? `<br><small style="color: #666;">Note: ${item.notes}</small>` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}${item.guestCount ? `<br><small>(${item.guestCount} guests)</small>` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.lineTotal}</td>
      </tr>
    `
    )
    .join('')

  const showDeliveryFee = parseFloat(data.deliveryFee.replace(/[^0-9.-]/g, '')) > 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Catering Order</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2D5A27; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">BlueCilantro Catering</h1>
        <p style="margin: 5px 0 0;">New Order Received</p>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <p style="color: #666; font-size: 14px;">Order ID: ${data.orderId}</p>

        <h2 style="color: #2D5A27; border-bottom: 2px solid #2D5A27; padding-bottom: 10px;">Customer Information</h2>
        <p><strong>Name:</strong> ${data.customerName}</p>
        <p><strong>Email:</strong> ${data.customerEmail}</p>
        <p><strong>Phone:</strong> ${data.customerPhone}</p>
        ${data.customerAddress ? `<p><strong>Address:</strong> ${data.customerAddress}</p>` : ''}

        <h2 style="color: #2D5A27; border-bottom: 2px solid #2D5A27; padding-bottom: 10px;">Order Details</h2>
        <p><strong>Type:</strong> <span style="background: ${data.fulfillmentType === 'delivery' ? '#3B82F6' : '#2D5A27'}; color: white; padding: 2px 8px; border-radius: 4px;">${data.fulfillmentType.toUpperCase()}</span></p>
        <p><strong>Date:</strong> ${data.scheduledDate}</p>
        <p><strong>Time:</strong> ${data.scheduledTime}</p>

        <h2 style="color: #2D5A27; border-bottom: 2px solid #2D5A27; padding-bottom: 10px;">Items</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #eee;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
              <td style="padding: 8px; text-align: right;">${data.subtotal}</td>
            </tr>
            ${showDeliveryFee ? `
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right;">Delivery Fee:</td>
              <td style="padding: 8px; text-align: right;">${data.deliveryFee}</td>
            </tr>
            ` : ''}
            <tr style="background: #2D5A27; color: white;">
              <td colspan="2" style="padding: 12px; text-align: right;"><strong>TOTAL:</strong></td>
              <td style="padding: 12px; text-align: right;"><strong>${data.total}</strong></td>
            </tr>
          </tfoot>
        </table>

        ${data.notes ? `
        <h2 style="color: #2D5A27; border-bottom: 2px solid #2D5A27; padding-bottom: 10px;">Order Notes</h2>
        <p style="background: #fff3cd; padding: 10px; border-radius: 4px;">${data.notes}</p>
        ` : ''}

        <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          * Prices do not include taxes. Please confirm final amount with customer.
        </p>
      </div>
    </body>
    </html>
  `
}

// ============================================
// CUSTOMER EMAIL NOTIFICATIONS
// ============================================

export async function sendCustomerOrderConfirmation(
  orderData: OrderEmailData
): Promise<boolean> {
  const { SMTP2GO_API_KEY, SMTP2GO_SENDER_EMAIL } = process.env

  if (!SMTP2GO_API_KEY) {
    console.log('='.repeat(60))
    console.log('CUSTOMER ORDER CONFIRMATION EMAIL (SMTP2Go not configured)')
    console.log('='.repeat(60))
    console.log(`To: ${orderData.customerEmail}`)
    console.log(`Subject: Order Received - ${orderData.orderId.slice(0, 8)}`)
    console.log('-'.repeat(60))
    console.log(formatCustomerConfirmationText(orderData))
    console.log('='.repeat(60))
    return true
  }

  const senderEmail = SMTP2GO_SENDER_EMAIL || 'orders@bluecilantro.ca'

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [orderData.customerEmail],
        sender: senderEmail,
        subject: `Order Received - ${orderData.businessName || 'BlueCilantro'} Catering`,
        text_body: formatCustomerConfirmationText(orderData),
        html_body: formatCustomerConfirmationHtml(orderData),
      }),
    })

    const result = await response.json()

    if (!response.ok || result.data?.error) {
      console.error('SMTP2Go error (customer confirmation):', result)
      return false
    }

    console.log('Customer confirmation email sent successfully')
    return true
  } catch (error) {
    console.error('Failed to send customer confirmation:', error)
    return false
  }
}

export async function sendOrderStatusUpdate(
  orderData: OrderEmailData,
  newStatus: 'confirmed' | 'cancelled'
): Promise<boolean> {
  const { SMTP2GO_API_KEY, SMTP2GO_SENDER_EMAIL } = process.env

  const statusMessages = {
    confirmed: {
      subject: `Order Confirmed - ${orderData.businessName || 'BlueCilantro'} Catering`,
      heading: 'Your Order is Confirmed!',
      message: 'Great news! Your catering order has been confirmed. We look forward to serving you.',
      color: '#2D5A27',
    },
    cancelled: {
      subject: `Order Cancelled - ${orderData.businessName || 'BlueCilantro'} Catering`,
      heading: 'Order Cancelled',
      message: 'Your catering order has been cancelled. If you have any questions, please contact us.',
      color: '#DC2626',
    },
  }

  const statusInfo = statusMessages[newStatus]

  if (!SMTP2GO_API_KEY) {
    console.log('='.repeat(60))
    console.log(`ORDER STATUS UPDATE EMAIL (${newStatus.toUpperCase()}) - SMTP2Go not configured`)
    console.log('='.repeat(60))
    console.log(`To: ${orderData.customerEmail}`)
    console.log(`Subject: ${statusInfo.subject}`)
    console.log('-'.repeat(60))
    console.log(formatStatusUpdateText(orderData, statusInfo))
    console.log('='.repeat(60))
    return true
  }

  const senderEmail = SMTP2GO_SENDER_EMAIL || 'orders@bluecilantro.ca'

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [orderData.customerEmail],
        sender: senderEmail,
        subject: statusInfo.subject,
        text_body: formatStatusUpdateText(orderData, statusInfo),
        html_body: formatStatusUpdateHtml(orderData, statusInfo),
      }),
    })

    const result = await response.json()

    if (!response.ok || result.data?.error) {
      console.error(`SMTP2Go error (status ${newStatus}):`, result)
      return false
    }

    console.log(`Order status (${newStatus}) email sent successfully`)
    return true
  } catch (error) {
    console.error(`Failed to send ${newStatus} email:`, error)
    return false
  }
}

function formatCustomerConfirmationText(data: OrderEmailData): string {
  const businessName = data.businessName || 'BlueCilantro'
  const lines = [
    `Thank you for your order!`,
    ``,
    `Hi ${data.customerName},`,
    ``,
    `We've received your catering order and will confirm it shortly.`,
    ``,
    `ORDER DETAILS`,
    `Order ID: ${data.orderId.slice(0, 8)}`,
    `Type: ${data.fulfillmentType.toUpperCase()}`,
    `Date: ${data.scheduledDate}`,
    `Time: ${data.scheduledTime}`,
    data.customerAddress ? `Delivery Address: ${data.customerAddress}` : '',
    ``,
    `ITEMS`,
  ]

  data.items.forEach((item) => {
    lines.push(`- ${item.itemName} x${item.quantity}${item.guestCount ? ` (${item.guestCount} guests)` : ''} - ${item.lineTotal}`)
  })

  lines.push(``)
  lines.push(`Subtotal: ${data.subtotal}`)
  if (parseFloat(data.deliveryFee.replace(/[^0-9.-]/g, '')) > 0) {
    lines.push(`Delivery Fee: ${data.deliveryFee}`)
  }
  lines.push(`TOTAL: ${data.total}`)
  lines.push(``)
  lines.push(`* Prices do not include taxes. Final amount will be confirmed.`)
  lines.push(``)
  lines.push(`If you have any questions, please contact us:`)
  if (data.businessPhone) lines.push(`Phone: ${data.businessPhone}`)
  lines.push(``)
  lines.push(`Thank you for choosing ${businessName}!`)

  return lines.filter(Boolean).join('\n')
}

function formatCustomerConfirmationHtml(data: OrderEmailData): string {
  const businessName = data.businessName || 'BlueCilantro'
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}${item.guestCount ? `<br><small>(${item.guestCount} guests)</small>` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.lineTotal}</td>
      </tr>
    `
    )
    .join('')

  const showDeliveryFee = parseFloat(data.deliveryFee.replace(/[^0-9.-]/g, '')) > 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: #2D5A27; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">${businessName}</h1>
        <p style="margin: 5px 0 0; font-size: 18px;">Thank you for your order!</p>
      </div>

      <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>
        <p>We've received your catering order and will confirm it shortly. You'll receive another email once your order is confirmed.</p>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Order ID: <strong>${data.orderId.slice(0, 8)}</strong></p>
          <p style="margin: 0;"><strong>${data.fulfillmentType.toUpperCase()}</strong> on <strong>${data.scheduledDate}</strong> at <strong>${data.scheduledTime}</strong></p>
          ${data.customerAddress ? `<p style="margin: 10px 0 0; color: #666;"><strong>Delivery to:</strong> ${data.customerAddress}</p>` : ''}
        </div>

        <h3 style="color: #2D5A27; border-bottom: 2px solid #2D5A27; padding-bottom: 8px;">Your Order</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #eee;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right;">Subtotal:</td>
              <td style="padding: 8px; text-align: right;">${data.subtotal}</td>
            </tr>
            ${showDeliveryFee ? `
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right;">Delivery Fee:</td>
              <td style="padding: 8px; text-align: right;">${data.deliveryFee}</td>
            </tr>
            ` : ''}
            <tr style="background: #2D5A27; color: white;">
              <td colspan="2" style="padding: 12px; text-align: right;"><strong>TOTAL:</strong></td>
              <td style="padding: 12px; text-align: right;"><strong>${data.total}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p style="color: #666; font-size: 12px; margin-top: 15px;">* Prices do not include taxes. Final amount will be confirmed.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="margin: 0; color: #666;">Questions? Contact us:</p>
          ${data.businessPhone ? `<p style="margin: 5px 0; font-size: 18px;"><strong>${data.businessPhone}</strong></p>` : ''}
          <p style="margin-top: 20px; color: #2D5A27; font-weight: bold;">Thank you for choosing ${businessName}!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

interface StatusInfo {
  subject: string
  heading: string
  message: string
  color: string
}

function formatStatusUpdateText(data: OrderEmailData, statusInfo: StatusInfo): string {
  const businessName = data.businessName || 'BlueCilantro'
  const lines = [
    statusInfo.heading,
    ``,
    `Hi ${data.customerName},`,
    ``,
    statusInfo.message,
    ``,
    `ORDER DETAILS`,
    `Order ID: ${data.orderId.slice(0, 8)}`,
    `Type: ${data.fulfillmentType.toUpperCase()}`,
    `Date: ${data.scheduledDate}`,
    `Time: ${data.scheduledTime}`,
    `Total: ${data.total}`,
    ``,
    `If you have any questions, please contact us.`,
    ``,
    `${businessName}`,
  ]

  return lines.join('\n')
}

function formatStatusUpdateHtml(data: OrderEmailData, statusInfo: StatusInfo): string {
  const businessName = data.businessName || 'BlueCilantro'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${statusInfo.heading}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">${businessName}</h1>
        <p style="margin: 5px 0 0; font-size: 18px;">${statusInfo.heading}</p>
      </div>

      <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>
        <p>${statusInfo.message}</p>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Order ID: <strong>${data.orderId.slice(0, 8)}</strong></p>
          <p style="margin: 0;"><strong>${data.fulfillmentType.toUpperCase()}</strong> on <strong>${data.scheduledDate}</strong> at <strong>${data.scheduledTime}</strong></p>
          <p style="margin: 10px 0 0; font-size: 18px;"><strong>Total: ${data.total}</strong></p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="margin: 0; color: #666;">Questions? Contact us:</p>
          ${data.businessPhone ? `<p style="margin: 5px 0; font-size: 18px;"><strong>${data.businessPhone}</strong></p>` : ''}
          <p style="margin-top: 20px; color: #2D5A27; font-weight: bold;">${businessName}</p>
        </div>
      </div>
    </body>
    </html>
  `
}
