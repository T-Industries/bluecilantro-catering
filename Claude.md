# BlueCilantro Catering Website

## Project Overview

A catering ordering website for BlueCilantro with customer-facing menu/ordering and an admin panel for order management.

**Domain:** bluecilantro24.ca

## Tech Stack

- **Framework:** Next.js 13.4 (App Router)
- **Database:** SQLite (local dev) / PostgreSQL via Neon (production)
- **ORM:** Prisma 5.22.0
- **Styling:** Tailwind CSS 3.4.0
- **Auth:** Custom JWT sessions (jose + bcryptjs)
- **Email:** SMTP2Go API
- **Payments:** Stripe (Checkout with manual capture)
- **Tax:** Stripe Tax (automatic Canadian GST/HST/PST)

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Full-stack monolith | Simpler for small team, lower cost |
| Database | SQLite local, Neon prod | Free tiers, easy migration |
| Email Provider | SMTP2Go | User preference (changed from Mailgun) |
| Payment | Stripe manual capture | Authorize at checkout, capture on admin confirm |
| Order IDs | UUID/GUID | Unique, non-sequential |
| Lead Time | 24 hours | Configurable in settings |
| Delivery Fee | $25 flat rate | Configurable in settings |
| Minimum Order | None (configurable) | Set to $0 by default |
| Tax | Stripe Tax auto-calculate | GST/HST/PST based on delivery address |

## Features

### Customer-Facing
- Menu display by category (Appetizers, Mains, Desserts, Beverages, Packages)
- Shopping cart (localStorage persistence)
- Checkout with date/time selection (delivery only)
- Stripe Checkout for secure payment (card authorized, not charged until confirmed)
- Automatic tax calculation based on delivery address
- Order confirmation page with payment status
- Order tracking by order ID (`/track`)
- Email notifications (order received, confirmed, cancelled)

### Admin Panel (`/admin`)
- Secure login with first-time password setup
- Order management with status updates (New → Confirmed → Completed)
- Payment management: Confirm captures payment, Cancel releases authorization
- Payment status display and Stripe Dashboard links
- Menu management (CRUD for categories and items)
- Calendar view of scheduled orders
- Settings configuration

## Local Development

### Prerequisites
- Node.js 18.17+ (tested with 18.x)
- npm

### Setup
```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
```

### Environment Variables (.env)
```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key-min-32-chars-here"
SMTP2GO_API_KEY="your-smtp2go-api-key"
SMTP2GO_SENDER_EMAIL="your-verified-sender@domain.com"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Default Admin Login
- **Email:** gpwc@bluecilantro.ca
- **Password:** Set on first login (enter email, tab out, then set password)

---

## Production Deployment

### Step 1: Set Up Neon PostgreSQL

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up (free tier: 0.5 GB storage)

2. **Create Project**
   - Click "New Project"
   - Name: `bluecilantro-catering`
   - Region: Choose closest to your users (e.g., US East)

3. **Get Connection String**
   - Go to Dashboard → Connection Details
   - Copy the connection string (looks like):
     ```
     postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

4. **Update Prisma Schema for PostgreSQL**

   Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

5. **Push Schema to Neon**
   ```bash
   # Set the production DATABASE_URL temporarily
   export DATABASE_URL="postgresql://..."

   # Push schema
   npx prisma db push

   # Seed initial data (optional - creates admin user and sample menu)
   npx prisma db seed
   ```

### Step 2: Set Up SMTP2Go Email

1. **Create SMTP2Go Account**
   - Go to https://www.smtp2go.com
   - Sign up (free tier: 1,000 emails/month)

2. **Get API Key**
   - Go to Settings → API Keys
   - Create new API key
   - Copy the key

3. **Verify Sender Domain** (recommended)
   - Go to Settings → Sender Domains
   - Add and verify `bluecilantro.ca` or your domain

### Step 3: Deploy to Vercel

1. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/bluecilantro-catering.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**

   In Vercel Project Settings → Environment Variables, add:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://...@neon.tech/neondb?sslmode=require` |
   | `SESSION_SECRET` | Generate: `openssl rand -base64 32` |
   | `SMTP2GO_API_KEY` | Your SMTP2Go API key |
   | `SMTP2GO_SENDER_EMAIL` | `orders@bluecilantro.ca` (must be verified) |
   | `STRIPE_SECRET_KEY` | `sk_live_...` (from Stripe Dashboard) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe Webhooks) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (from Stripe Dashboard) |

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Configure Custom Domain**
   - Go to Project Settings → Domains
   - Add `bluecilantro24.ca`
   - Update DNS records as instructed

### Step 4: Post-Deployment

1. **Set Admin Password**
   - Go to `https://yourdomain.com/admin/login`
   - Enter email: `gpwc@bluecilantro.ca`
   - Tab out of field to trigger password setup
   - Create your admin password

2. **Configure Settings**
   - Go to Admin → Settings
   - Update business info, delivery fee, notification email

3. **Update Menu**
   - Go to Admin → Menu
   - Add/edit your actual menu items

---

## Stripe Payment Integration

### Payment Flow (Manual Capture)

```
CUSTOMER CHECKOUT:
1. Customer fills checkout form (name, email, phone, address, date, time)
2. POST /api/checkout → creates order (status: new, paymentStatus: pending)
3. Redirect to Stripe Checkout (capture_method: manual)
4. Customer enters card → card authorized (funds held, NOT charged)
5. Webhook (checkout.session.completed) → paymentStatus: 'authorized'
6. Redirect to /checkout/success → "Order submitted, awaiting confirmation"

ADMIN CONFIRMS ORDER:
7. Admin reviews order in dashboard
8. Admin clicks "Confirm Order"
9. API calls stripe.paymentIntents.capture() → funds captured
10. paymentStatus: 'paid', status: 'confirmed'
11. Customer receives confirmation email with receipt

ADMIN CANCELS ORDER:
7. Admin clicks "Cancel Order"
8. API calls stripe.paymentIntents.cancel() → authorization released
9. paymentStatus: 'cancelled', status: 'cancelled'
10. Customer receives cancellation email (card NOT charged)
```

**Important:** Stripe authorizations expire after 7 days. Orders must be confirmed/cancelled within this window.

### Canadian Tax (Stripe Tax)

Stripe Tax automatically calculates GST/HST/PST based on customer's delivery address:

| Province | Tax Type | Rate |
|----------|----------|------|
| Ontario | HST | 13% |
| British Columbia | GST + PST | 5% + 7% = 12% |
| Alberta | GST only | 5% |
| Quebec | GST + QST | 5% + 9.975% ≈ 15% |
| Nova Scotia | HST | 14% |
| New Brunswick | HST | 15% |

**Setup in Stripe Dashboard:**
1. Enable Stripe Tax: Settings → Tax → Enable
2. Add tax registration: Registrations → Add your GST/HST number
3. Set business address for tax origin

### Stripe Setup Steps

1. **Create Stripe Account**
   - Go to https://dashboard.stripe.com
   - Sign up and verify business

2. **Get API Keys**
   - Dashboard → Developers → API Keys
   - Copy Publishable key (`pk_test_...`) and Secret key (`sk_test_...`)

3. **Set Up Webhook**
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`
   - Copy Signing secret (`whsec_...`)

4. **Enable Stripe Tax**
   - Dashboard → Settings → Tax
   - Enable automatic tax calculation
   - Add your GST/HST registration

5. **Test with Stripe CLI (Local Development)**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login
   stripe login

   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

### Stripe Production Checklist

Before going live, complete these steps:

1. **Enable Stripe Tax**
   - Go to Stripe Dashboard → Settings → Tax
   - Enable automatic tax calculation
   - Add your GST/HST registration number under Registrations
   - Set your business address for tax origin

2. **Create Production Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://bluecilantro24.ca/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`
   - Copy the signing secret (`whsec_...`)

3. **Add Production Environment Variables in Vercel**
   - `STRIPE_SECRET_KEY` → Live secret key (`sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` → Signing secret from step 2 (`whsec_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Live publishable key (`pk_live_...`)

4. **Test the Live Flow**
   - Place a test order with a real card (you can refund it)
   - Verify webhook is received (check Stripe Dashboard → Webhooks → Events)
   - Confirm the order in admin panel and verify payment is captured

### Payment Database Fields

Added to Order model:
```prisma
paymentStatus         String    @default("pending")  // pending, authorized, paid, failed, cancelled, refunded
stripeSessionId       String?   @unique              // Checkout Session ID
stripePaymentIntentId String?   @unique              // Payment Intent ID (for capture/cancel)
paidAt                DateTime?                      // When payment was captured
```

### Payment API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkout` | POST | Create order + Stripe Checkout session |
| `/api/webhooks/stripe` | POST | Handle Stripe webhook events |
| `/api/orders/[id]` | PUT | Confirm (capture) or Cancel (release) payment |

---

## Database Schema

### Tables
- **AdminUser** - Admin login credentials
- **Setting** - Key-value configuration
- **MenuCategory** - Menu sections (Appetizers, Mains, etc.)
- **MenuItem** - Individual menu items
- **Order** - Customer orders
- **OrderItem** - Items within each order

### View/Edit Data
```bash
# Local development - Prisma Studio
npx prisma studio

# Opens browser at http://localhost:5555
```

---

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Admin login |
| `/api/auth/logout` | POST | Admin logout |
| `/api/auth/setup-password` | POST | First-time password setup |
| `/api/auth/check-email` | POST | Check if email needs password setup |
| `/api/auth/me` | GET | Get current session |
| `/api/orders` | GET, POST | List/create orders |
| `/api/orders/[id]` | GET, PUT, DELETE | Single order operations (PUT captures/cancels payment) |
| `/api/orders/lookup` | GET | Public order lookup by ID |
| `/api/checkout` | POST | Create order + Stripe Checkout session |
| `/api/webhooks/stripe` | POST | Handle Stripe webhook events |
| `/api/menu/categories` | GET, POST | List/create categories |
| `/api/menu/categories/[id]` | PUT, DELETE | Single category operations |
| `/api/menu/items` | GET, POST | List/create menu items |
| `/api/menu/items/[id]` | PUT, DELETE | Single item operations |
| `/api/settings` | GET, PUT | Get/update settings |

---

## Troubleshooting

### White page / Webpack errors
```bash
# Clear Next.js cache and restart
rm -rf .next
npm run dev
```

### Database connection issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset local database
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Email not sending
- Check `SMTP2GO_API_KEY` is set
- Verify sender email domain in SMTP2Go dashboard
- Check console logs for errors (emails log to console in dev mode)

---

## Future Enhancements

- [x] Stripe payment integration (with manual capture)
- [x] Customer order tracking page (`/track`)
- [x] Automatic Canadian tax calculation (Stripe Tax)
- [ ] SMS notifications (Twilio)
- [ ] Recurring orders
- [ ] Inventory management
- [ ] Reports and analytics
- [ ] Refund handling from admin panel
- [ ] Multiple admin users with roles
