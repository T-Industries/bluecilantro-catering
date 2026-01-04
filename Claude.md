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
NEXT_PUBLIC_APP_URL="http://localhost:3000"
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
   | `NEXT_PUBLIC_APP_URL` | `https://bluecilantro24.ca` **(REQUIRED for Stripe redirects)** |
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
- Check `SMTP2GO_API_KEY` is set (if not set, emails log to console instead)
- Verify sender email domain in SMTP2Go dashboard
- Check console logs for errors (emails log to console in dev mode)
- **For Stripe orders:** Emails are sent after payment authorization, not at checkout. See "Email System" section below.

---

## Security Checklist

Regularly review the codebase for common security vulnerabilities. Use this checklist during development and before deployment.

### Critical Security Checks

1. **Hardcoded Secrets**
   ```bash
   # Search for potential hardcoded secrets
   grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" --include="*.ts" --include="*.js"
   ```
   - ✅ All secrets in environment variables
   - ✅ No secrets committed to git
   - ✅ `.env` files in `.gitignore`

2. **Security Headers** (`next.config.js`)
   - ✅ X-Frame-Options (prevent clickjacking)
   - ✅ X-Content-Type-Options (prevent MIME sniffing)
   - ✅ Content-Security-Policy (restrict resource loading)
   - ✅ X-XSS-Protection
   - ✅ Referrer-Policy
   - ✅ Permissions-Policy

3. **Image & Resource Configuration**
   - ✅ Restrict `remotePatterns` to trusted CDNs only
   - ❌ Never use wildcard `hostname: '**'` (SSRF risk)

4. **SQL Injection Prevention**
   - ✅ Always use Prisma ORM (parameterized queries)
   - ❌ Never use string interpolation in raw SQL
   - ❌ Never use `${}` in SQL queries

5. **XSS Prevention**
   - ✅ React escapes by default
   - ❌ Avoid `dangerouslySetInnerHTML`
   - ❌ Never set `innerHTML` directly
   - ✅ Sanitize user input if HTML rendering needed

6. **Authentication & Sessions**
   - ✅ httpOnly cookies (prevent XSS cookie theft)
   - ✅ secure flag in production
   - ✅ sameSite: 'lax' (CSRF protection)
   - ✅ bcrypt for password hashing (cost factor 12+)
   - ✅ JWT tokens with proper expiration

7. **Rate Limiting** ⚠️ TODO
   - ⚠️ Login endpoint needs rate limiting (brute force risk)
   - ⚠️ Password setup endpoint needs rate limiting
   - ⚠️ Consider implementing account lockout

8. **Input Validation**
   - ✅ Validate all API inputs (email format, required fields)
   - ✅ Sanitize file uploads (if implemented)
   - ✅ Password strength requirements (min 8 chars)

9. **Error Handling**
   - ✅ Generic error messages to clients (no stack traces)
   - ✅ Detailed logs server-side only
   - ❌ Never expose database errors to users

10. **Dependency Security**
    ```bash
    # Check for vulnerabilities
    npm audit
    npm audit fix
    ```

### Security Testing Commands

```bash
# Search for common security issues
grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.ts"
grep -r "innerHTML\s*=" --include="*.tsx" --include="*.ts"
grep -r "eval(" --include="*.ts" --include="*.js"
grep -r "process.env" --include="*.ts" --include="*.js"

# Check for exposed secrets
git log -p | grep -i "api_key\|secret\|password"
```

### Recent Security Fixes

| Date | Issue | Fix | Severity |
|------|-------|-----|----------|
| 2026-01-04 | Missing security headers | Added CSP, X-Frame-Options, etc. in `next.config.js` | High |
| 2026-01-04 | Overly permissive image sources | Restricted to trusted CDNs only | Medium |

---

## Best Practices / Common Pitfalls

### Todo List Management

When working on complex tasks, use the TodoWrite tool to track progress:

**When to use todos:**
- Multi-step features (3+ steps)
- Complex bug fixes requiring investigation
- Deployment tasks with multiple phases
- Security audits with multiple checks

**Best practices:**
```typescript
// 1. Create todos at start of complex task
TodoWrite([
  { content: "Investigate root cause", activeForm: "Investigating root cause", status: "in_progress" },
  { content: "Fix the issue", activeForm: "Fixing the issue", status: "pending" },
  { content: "Write tests", activeForm: "Writing tests", status: "pending" },
  { content: "Update documentation", activeForm: "Updating documentation", status: "pending" }
])

// 2. Mark complete immediately after finishing each step
TodoWrite([
  { content: "Investigate root cause", activeForm: "Investigating root cause", status: "completed" },
  { content: "Fix the issue", activeForm: "Fixing the issue", status: "in_progress" },
  // ...
])
```

**Rules:**
- Only ONE task `in_progress` at a time
- Mark tasks `completed` immediately when done
- Update todos in real-time, not in batches
- Remove irrelevant tasks entirely

### Next.js App Router Cache Revalidation

**Problem:** Server Components cache their data by default. When data is modified via API routes (e.g., admin panel), the cached pages don't update automatically.

**Solution:** Always call `revalidatePath('/')` (or the relevant path) in API routes that modify data displayed on server-rendered pages.

```typescript
import { revalidatePath } from 'next/cache'

// In your POST/PUT/DELETE handlers:
await prisma.menuItem.create({ ... })
revalidatePath('/')  // Invalidate cache for affected pages
return NextResponse.json(item)
```

**When to use:**
- Any API route that creates, updates, or deletes data shown on public pages
- Menu item/category changes → `revalidatePath('/')`
- Order status changes → `revalidatePath('/track')`
- Settings changes → `revalidatePath('/')`

### Stripe Redirect URLs

**Problem:** Stripe success/cancel URLs default to localhost if `NEXT_PUBLIC_APP_URL` is not set.

**Solution:** Always set `NEXT_PUBLIC_APP_URL` in production environment variables:
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Cart Context vs Hook

**Problem:** Using `useCart()` directly creates a new isolated cart state. Changes made in one component won't reflect in others.

**Solution:** Always use `useCartContext()` from `CartProvider` to share cart state across components:

```typescript
// WRONG - creates isolated state
import { useCart } from '@/hooks/useCart'
const { addPackageToCart } = useCart()

// CORRECT - uses shared context
import { useCartContext } from '@/components/CartProvider'
const { addPackageToCart } = useCartContext()
```

**When this matters:**
- Package configurator pages adding items to cart
- Any component that needs to read/write cart state
- The `useCart` hook is only used internally by `CartProvider`

### Package Upgrades Field Name

**Problem:** Package upgrades use `pricePerPerson` in Prisma schema, but API might accidentally use `price`.

**Solution:** When creating/updating package upgrades, always map `body.price` to `pricePerPerson`:

```typescript
// In API route
const upgrade = await prisma.packageUpgrade.create({
  data: {
    packageId: params.id,
    name: body.name,
    pricePerPerson: body.price,  // NOT price: body.price
  },
})
```

### Email Timing with Payments

**Problem:** Sending confirmation emails before payment is completed leads to confusion if payment fails.

**Solution:** For Stripe payments, send emails in the webhook handler (`checkout.session.completed`) not in the checkout API. Only send immediately for bypass/test orders.

---

## Email System

### Email Flow Architecture

Order emails are sent at different times depending on the checkout method:

```
STRIPE CHECKOUT (Production):
1. Customer submits checkout → Order created (paymentStatus: pending)
2. Customer completes Stripe payment
3. Stripe sends webhook (checkout.session.completed)
4. Webhook handler updates order (paymentStatus: authorized)
5. Webhook handler sends emails ← EMAILS SENT HERE
6. Customer sees success page

BYPASS CHECKOUT (Testing with TEST_BYPASS_CODE):
1. Customer submits checkout with promo code
2. Order created (paymentStatus: test_bypass)
3. Emails sent immediately ← EMAILS SENT HERE
4. Redirect to success page
```

### Email Types

| Email | Recipient | Trigger | Purpose |
|-------|-----------|---------|---------|
| Order Notification | Admin | Payment authorized | Alert restaurant of new order |
| Customer Confirmation | Customer | Payment authorized | Confirm order received |
| Order Confirmed | Customer + Admin | Admin confirms order | Payment captured, order confirmed |
| Order Completed | Customer + Admin | Admin marks complete | Thank customer, confirm completion |
| Order Cancelled | Customer + Admin | Admin cancels order | Authorization released |

### Local Development Without Webhooks

**Problem:** Stripe webhooks can't reach `localhost`. Without `stripe listen`, the webhook never fires and emails never send.

**Solutions:**

1. **Use Test Bypass Code** (Easiest)
   - Set `TEST_BYPASS_CODE` in `.env.local`
   - Enter this code in the "Promo Code" field during checkout
   - Skips Stripe entirely, sends emails immediately

2. **Use Stripe CLI** (Full testing)
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Fallback Mechanism** (Automatic)
   - `/api/checkout/session` has a built-in fallback
   - When success page loads, it checks if order is still "pending"
   - If so, queries Stripe directly to verify payment status
   - If paid, updates order and sends emails
   - This works without `stripe listen` running

### Console Logging (Dev Mode)

When `SMTP2GO_API_KEY` is not set, emails are logged to the terminal instead of being sent:

```
============================================================
ORDER NOTIFICATION EMAIL (SMTP2Go not configured)
============================================================
To: gpwc@bluecilantro.ca
Subject: New Catering Order - abc12345
------------------------------------------------------------
[Full email content displayed here]
============================================================
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/email.ts` | Email formatting and SMTP2Go API calls |
| `src/app/api/webhooks/stripe/route.ts` | Primary email trigger (webhook) |
| `src/app/api/checkout/route.ts` | Bypass order emails |
| `src/app/api/checkout/session/route.ts` | Fallback email trigger (success page) |

### Settings That Affect Emails

| Setting Key | Default | Purpose |
|-------------|---------|---------|
| `notification_email` | gpwc@bluecilantro.ca | Where admin notifications go |
| `send_customer_emails` | true | Toggle customer confirmation emails |
| `business_name` | BlueCilantro | Shown in email headers |
| `business_phone` | - | Shown in email footers |

---

## In Progress: Dual Menu System (Standard + Package)

### Background

The current menu system only supports "Standard Menu" (categories with individually priced items). A new "Package Menu" system is needed to support catering packages like the reference design in `bowling_stones.pdf`.

**Reference:** `bowling_stones.pdf` in project root shows:
- "Select & Choose Package" - Pick a tier ($29 or $45 PP), select items from each category
- "Canapés Menu" - Items priced by quantity (Half Dozen $12, Full Dozen $21)
- "Premium Upgrades" - Optional add-ons (Prime Beef +$19, Salmon +$14)
- Badges like "MOST POPULAR"

### All Decisions (Finalized)

| Question | Answer |
|----------|--------|
| Both menu types available simultaneously? | **No** - Customer chooses Standard OR Package, then proceeds. Back button to re-choose. |
| Multiple package types on Package page? | **Yes** - Browse multiple packages (Select & Choose, Canapés, Desserts) |
| Multiple packages in cart? | **Yes** - All types can coexist in same cart |
| Guest count | **Per package** (Selection type only) |
| Minimum guests | **Per package** (e.g., "Select & Choose" min 10 guests) |
| Canapés - pricing model | **Per item type** - different items can have different tier prices |
| Canapés - multiple quantities | **Yes** - Meatballs × 3 (Full Dozen) = $63 |
| Canapés - minimum order | **No minimum** |
| Selection - same item twice | **Yes** - Can pick Caesar Salad × 2 for "Choose of Two" |
| Selection - multiple packages | **Yes** - Admin can create multiple selection packages |
| Fixed price - multiple items | **Yes** - Desserts $50, Fruit $35, etc. |
| Upgrades | **Per person** (10 guests × $19 = $190) |
| Badges ("MOST POPULAR") | **Admin manually sets** |
| After add to cart | **Return to package list** to browse more |

### Package Types

| Type | Example | Customer Flow | Pricing Formula |
|------|---------|---------------|-----------------|
| **Selection** | Select & Choose | Pick tier → Select items from categories → Enter guests → Add upgrades | `(Tier × Guests) + (Upgrades × Guests)` |
| **Quantity** | Canapés | Pick item → See tier prices → Pick tier → Enter quantity → Add | `Item Tier Price × Quantity` |
| **Fixed** | Desserts Platter | Pick item → Enter quantity → Add | `Item Price × Quantity` |

### Database Schema (Final)

```prisma
model MenuPackage {
  id           String   @id @default(uuid())
  name         String   // "Select & Choose", "Canapés Menu"
  description  String?
  type         String   // "selection", "quantity", "fixed"
  imageUrl     String?  @map("image_url")
  badge        String?  // "MOST POPULAR", "NEW", etc.
  minGuests    Int?     @map("min_guests")  // For selection type
  active       Boolean  @default(true)
  displayOrder Int      @default(0) @map("display_order")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  tiers      PackageTier[]
  categories PackageCategory[]  // For selection type
  items      PackageItem[]      // For quantity & fixed types
  upgrades   PackageUpgrade[]   // For selection type

  @@map("menu_packages")
}

model PackageTier {
  id           String      @id @default(uuid())
  packageId    String      @map("package_id")
  package      MenuPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  name         String      // "Choose of One", "Half Dozen"
  description  String?
  selectCount  Int?        @map("select_count")  // Selection type: items per category
  price        Decimal     @db.Decimal(10, 2)    // Selection: per person, Quantity: default
  active       Boolean     @default(true)
  displayOrder Int         @default(0) @map("display_order")

  @@map("package_tiers")
}

model PackageCategory {
  id           String      @id @default(uuid())
  packageId    String      @map("package_id")
  package      MenuPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  name         String      // "Salads", "Vegetables"
  description  String?
  imageUrl     String?     @map("image_url")
  active       Boolean     @default(true)
  displayOrder Int         @default(0) @map("display_order")
  items        PackageCategoryItem[]

  @@map("package_categories")
}

model PackageCategoryItem {
  id           String          @id @default(uuid())
  categoryId   String          @map("category_id")
  category     PackageCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name         String          // "Caesar Salad"
  description  String?
  active       Boolean         @default(true)
  displayOrder Int             @default(0) @map("display_order")

  @@map("package_category_items")
}

model PackageItem {
  id           String      @id @default(uuid())
  packageId    String      @map("package_id")
  package      MenuPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  name         String      // "Meatballs", "Assorted Desserts Platter"
  description  String?
  imageUrl     String?     @map("image_url")
  price        Decimal?    @db.Decimal(10, 2)  // Fixed type: item price
  tierPrices   Json?       @map("tier_prices") // Quantity type: {"tierId": "12.00"}
  badge        String?     // "MOST POPULAR"
  active       Boolean     @default(true)
  displayOrder Int         @default(0) @map("display_order")

  @@map("package_items")
}

model PackageUpgrade {
  id             String      @id @default(uuid())
  packageId      String      @map("package_id")
  package        MenuPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  name           String      // "Prime Beef"
  description    String?
  pricePerPerson Decimal     @map("price_per_person") @db.Decimal(10, 2)
  active         Boolean     @default(true)
  displayOrder   Int         @default(0) @map("display_order")

  @@map("package_upgrades")
}
```

### Customer Flow

```
Home Page: "How would you like to order?"
    │
    ├── [À La Carte] ──→ Standard Menu (current functionality)
    │
    └── [Packages] ──→ Package List
                           │
                           ├── Select & Choose ──→ Configure (tier, selections, guests, upgrades)
                           │                              └──→ Add to Cart ──→ Back to Package List
                           │
                           ├── Canapés ──→ Browse items, each has tier/qty selector
                           │                    └──→ Add to Cart (per item) ──→ Stay on page
                           │
                           └── Desserts ──→ Browse items, each has qty selector
                                               └──→ Add to Cart (per item) ──→ Stay on page
```

### Implementation Phases

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | Add Edit functionality for existing standard menu items | Low |
| 2 | Database schema for packages (Prisma migration) | Medium |
| 3 | API endpoints for packages CRUD | Medium |
| 4 | Admin UI - Package list and type selection | Medium |
| 5 | Admin UI - Selection package editor (tiers, categories, items, upgrades) | High |
| 6 | Admin UI - Quantity package editor (tiers, items with prices) | Medium |
| 7 | Admin UI - Fixed package editor (items with prices) | Low |
| 8 | Customer UI - Menu type selection | Low |
| 9 | Customer UI - Package list | Low |
| 10 | Customer UI - Selection package configurator | High |
| 11 | Customer UI - Quantity package configurator | Medium |
| 12 | Customer UI - Fixed package configurator | Low |
| 13 | Cart integration for all package types | High |
| 14 | Checkout & order storage for packages | Medium |
| 15 | Order display (admin & confirmation) for packages | Medium |

### Current Admin Menu Gaps

- **Edit button for items** - Can only hide/show/delete, not edit name/description/price
- **Package management** - No UI for creating/managing packages

---

## Future Enhancements

- [x] Stripe payment integration (with manual capture)
- [x] Customer order tracking page (`/track`)
- [x] Automatic Canadian tax calculation (Stripe Tax)
- [ ] **Dual Menu System (Standard + Package)** - IN PROGRESS
- [ ] SMS notifications (Twilio)
- [ ] Recurring orders
- [ ] Inventory management
- [ ] Reports and analytics
- [ ] Refund handling from admin panel
- [ ] Multiple admin users with roles
