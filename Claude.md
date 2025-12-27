# BlueCilantro Catering Website

## Project Overview

A catering ordering website for BlueCilantro with customer-facing menu/ordering and an admin panel for order management.

**Domain:** Bluecilantro24.com

## Tech Stack

- **Framework:** Next.js 13.4 (App Router)
- **Database:** SQLite (local dev) / PostgreSQL via Neon (production)
- **ORM:** Prisma 5.22.0
- **Styling:** Tailwind CSS 3.4.0
- **Auth:** Custom JWT sessions (jose + bcryptjs)
- **Email:** SMTP2Go API

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Full-stack monolith | Simpler for small team, lower cost |
| Database | SQLite local, Neon prod | Free tiers, easy migration |
| Email Provider | SMTP2Go | User preference (changed from Mailgun) |
| Payment | Pay on delivery | Stripe integration planned for later |
| Order IDs | UUID/GUID | Unique, non-sequential |
| Lead Time | 24 hours | Configurable in settings |
| Delivery Fee | $25 flat rate | Configurable in settings |
| Minimum Order | None (configurable) | Set to $0 by default |
| Tax Display | Base prices only | Final confirmed on order |

## Features

### Customer-Facing
- Menu display by category (Appetizers, Mains, Desserts, Beverages, Packages)
- Shopping cart (localStorage persistence)
- Checkout with date/time selection
- Delivery or pickup options
- Order confirmation page
- Email notification to restaurant

### Admin Panel (`/admin`)
- Secure login with first-time password setup
- Order management with status updates (New → Confirmed → Completed)
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

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Configure Custom Domain**
   - Go to Project Settings → Domains
   - Add `bluecilantro24.com`
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
| `/api/orders/[id]` | GET, PUT, DELETE | Single order operations |
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

- [ ] Stripe payment integration
- [ ] Customer order tracking page
- [ ] SMS notifications
- [ ] Recurring orders
- [ ] Inventory management
- [ ] Reports and analytics
