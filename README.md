# Membership System

A full-stack membership management system with Next.js frontend and NestJS backend.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database and auth)

### Project Structure

```
membership_system/
├── frontend/          # Next.js + shadcn UI (Port 3000)
└── backend/           # NestJS + Supabase + Prisma (Port 8000)
```

---

## 🎯 Current Status

✅ **Frontend**: Running on `http://localhost:3000`  
✅ **Backend**: Running on `http://localhost:8000`  
✅ **Database**: Connected to Supabase PostgreSQL  
✅ **API**: Available at `http://localhost:8000/api`

---

## 🔧 Development

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will be available at: `http://localhost:3000`

### Start Backend
```bash
cd backend
npm run start:dev
```
Backend API will be available at: `http://localhost:8000/api`

### View Database
```bash
cd backend
npx prisma studio
```
Prisma Studio will open at: `http://localhost:5555`

---

## 📝 First Time Setup

### 1. Create Admin Account

You can register an admin account through the API:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

Or use the frontend login page at `http://localhost:3000/login`

### 2. Login

**Via API:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Via Frontend:**
Navigate to `http://localhost:3000/login` and use your credentials.

---

## 🔑 API Endpoints

All API endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Customers
- `GET /api/customers` - List customers (with pagination)
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/points` - Add/redeem points

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/sync` - Sync with QuickBooks (not implemented)

### Benefits
- `GET/POST/PUT/DELETE /api/benefits/discount-rules` - Manage discount rules
- `GET/POST/PUT/DELETE /api/benefits/points-rules` - Manage points rules
- `GET/POST/PUT/DELETE /api/benefits/discount-codes` - Manage discount codes
- `POST /api/benefits/discount-codes/validate` - Validate a discount code

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/discount-rates` - Update discount rates
- `PUT /api/settings/points-config` - Update points configuration

### SMS
- `GET/POST /api/sms/campaigns` - Manage SMS campaigns
- `POST /api/sms/campaigns/:id/send` - Send SMS campaign
- `GET/POST /api/sms/templates` - Manage SMS templates

**Note:** Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## 🗄️ Database Schema

The system uses the following main tables:
- `profiles` - User accounts (ADMIN, STAFF)
- `customers` - Customer records (REGULAR, GC, DESIGNER, WHOLESALE, OTHER)
- `orders` - Order records
- `order_items` - Order line items
- `discount_codes` - Discount codes (GENERIC, EXCLUSIVE)
- `discount_rules` - Discount rules by customer type
- `points_rules` - Points earning/redemption rules
- `points_transactions` - Points transaction history
- `sms_campaigns` - SMS marketing campaigns
- `sms_templates` - SMS message templates
- `system_settings` - System configuration

---

## 🔐 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
```

### Backend (`.env`)
```env
# Supabase
# ⚠️  Supports both NEW (sb_*) and LEGACY (eyJ*) API key formats
# See docs/SUPABASE_API_KEY_MIGRATION.md for details
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=7d

# App
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 🚧 Not Yet Implemented

- ❌ QuickBooks Integration (OAuth flow pending)
- ❌ Twilio SMS Integration (API pending)
- ❌ Email notifications
- ❌ File uploads (customer documents)

---

## 📚 Tech Stack

### Frontend
- **Framework**: Next.js 15
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State**: React Hooks

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: JWT + Passport
- **Validation**: class-validator

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
1. Check backend is running: `curl http://localhost:8000/api/settings`
2. Verify `.env.local` has correct API URL
3. Restart frontend: `npm run dev`

### Database connection error
1. Check Supabase credentials in `backend/.env`
2. Verify database is accessible
3. Try regenerating Prisma client: `npx prisma generate`

### Authentication not working
1. Make sure you've registered a user first
2. Check JWT token is being stored in localStorage
3. Verify token is sent in Authorization header

---

## 📖 Documentation

- [Backend Setup Guide](/.agent/workflows/backend-setup-guide.md)
- [Supabase API Key Migration Guide](/docs/SUPABASE_API_KEY_MIGRATION.md) - 新旧 API Key 格式兼容说明
- [Supabase Database Connection Modes](/docs/SUPABASE_DATABASE_CONNECTION_MODES.md) - 数据库连接模式选择指南
- [Supabase Documentation](https://supabase.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 👥 Support

For issues or questions, please check the documentation or create an issue.
