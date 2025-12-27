# BlueCilantro Catering Order Management System

A full-stack catering order management system built with Next.js, featuring customer ordering and admin management capabilities.

## Tech Stack

- **Frontend**: Next.js 13.4 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT sessions (jose + bcryptjs)
- **Email**: SMTP2Go API

## Infrastructure

| Service | Purpose | Dashboard URL |
|---------|---------|---------------|
| **Vercel** | Hosting & Deployment | [vercel.com/dashboard](https://vercel.com/dashboard) |
| **Neon** | PostgreSQL Database | [console.neon.tech](https://console.neon.tech) |
| **SMTP2Go** | Email Notifications | [app.smtp2go.com](https://app.smtp2go.com) |
| **GitHub** | Source Code Repository | [github.com/T-Industries/bluecilantro-catering](https://github.com/T-Industries/bluecilantro-catering) |

## Features

### Customer Features
- Browse menu by category
- Add items to cart (fixed price or per-person pricing)
- Checkout with delivery scheduling (24-hour advance notice required)
- Order confirmation with email notification
- Track order status by order ID

### Admin Features
- Secure login with password management
- Order management (view, confirm, cancel, complete)
- Menu management (categories and items CRUD)
- Calendar view of scheduled orders
- Settings management (delivery fee, notification email, etc.)

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/T-Industries/bluecilantro-catering.git
   cd bluecilantro-catering
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials (see Environment Variables section below)

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed with initial data (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Customer site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-secret-key-min-32-characters"

# SMTP2Go Email Configuration
SMTP2GO_API_KEY="your-smtp2go-api-key"
SMTP2GO_SENDER_EMAIL="your-verified-sender@domain.com"

# App URL (optional, for email links)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### For Local Development with SQLite
If you want to use SQLite locally instead of PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Use this DATABASE_URL in `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

## Deployment to Vercel

### 1. Push to GitHub
Ensure your code is pushed to the GitHub repository.

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import `T-Industries/bluecilantro-catering` from GitHub

### 3. Configure Build Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: Leave empty
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

### 4. Add Environment Variables
Add the following environment variables in Vercel's project settings:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Random 32+ character string
- `SMTP2GO_API_KEY` - Your SMTP2Go API key
- `SMTP2GO_SENDER_EMAIL` - Verified sender email

### 5. Deploy
Click **Deploy** and wait for the build to complete.

### 6. Post-Deployment
1. Visit your deployed URL
2. Go to `/admin` and login with the admin email
3. Set your admin password on first login

## Database Management

### Prisma Commands
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Create a migration (for production)
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Database Schema
The database includes these models:
- **AdminUser** - Admin authentication
- **Setting** - Application settings (key-value)
- **MenuCategory** - Menu categories
- **MenuItem** - Menu items with pricing
- **Order** - Customer orders
- **OrderItem** - Individual items in orders

## Admin Access

- **Default Admin Email**: Set in seed script or manually create in database
- **Password**: Set on first login (must_set_password flag)
- **Admin URL**: `/admin`

## Email Notifications

The system sends emails for:
1. **New Order** - Notification to restaurant
2. **Order Confirmation** - Confirmation to customer
3. **Order Status Update** - When order is confirmed or cancelled

Email sending can be toggled in Admin Settings.

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin/         # Admin panel pages
│   │   ├── api/           # API routes
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Checkout flow
│   │   ├── confirmation/  # Order confirmation
│   │   └── track/         # Order tracking
│   ├── components/        # React components
│   └── lib/               # Utilities (auth, db, email, etc.)
├── public/                # Static assets
└── .env.example           # Environment variables template
```

## Troubleshooting

### White page / Build errors
```bash
rm -rf .next
npm run dev
```

### Port already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database connection issues
- Verify `DATABASE_URL` is correct
- For Neon: Ensure `?sslmode=require` is in the connection string
- Run `npm run db:generate` after any schema changes

### Email not sending
- Verify SMTP2Go API key is correct
- Ensure sender email is verified in SMTP2Go
- Check Admin Settings → "Send Customer Emails" is enabled

## License

Private - All rights reserved
