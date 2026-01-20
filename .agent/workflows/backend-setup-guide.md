---
description: Supabase 和后端开发完整指南
---

# Membership System - Supabase 和后端开发指南

## 📋 开发顺序总览

**推荐顺序:先配置 Supabase → 再搭建后端 → 最后集成前端**

### 为什么这个顺序?
1. **Supabase 是基础设施** - 提供数据库、认证、存储等核心服务
2. **后端依赖 Supabase** - 需要数据库连接、Schema 定义
3. **前端已完成** - 可以根据前端需求设计后端 API

---

## 阶段一: Supabase 配置 (1-2 小时)

### Step 1: 创建 Supabase 项目

1. **访问 Supabase**
   - 前往 [https://supabase.com](https://supabase.com)
   - 使用 GitHub 账号登录
   - 点击 "New Project"

2. **项目配置**
   ```
   Project Name: membership-system
   Database Password: [生成强密码并保存]
   Region: Northeast Asia (Tokyo) - 选择离你最近的区域
   Pricing Plan: Free (开发阶段)
   ```

3. **等待项目初始化** (约 2 分钟)

### Step 2: 获取项目凭证

在 Supabase Dashboard 中:
1. 进入 `Settings` → `API`
2. 记录以下信息:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (前端使用)
   - **service_role key**: `eyJhbGc...` (后端使用,保密!)

3. 进入 `Settings` → `Database`
4. 记录:
   - **Connection String**: `postgresql://postgres:[password]@...`
   - **Direct Connection String**: 用于后端 Prisma

### Step 3: 设计数据库 Schema

根据你的前端功能,需要以下核心表:

#### 3.1 用户和认证
```sql
-- Supabase Auth 自动提供 auth.users 表
-- 我们需要扩展用户信息表

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER', -- ADMIN, STAFF, CUSTOMER
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略:用户只能查看和更新自己的资料
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);
```

#### 3.2 客户管理
```sql
CREATE TYPE customer_type AS ENUM ('FF', 'GC', 'DESIGNER', 'WHOLESALE');

CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_type customer_type NOT NULL DEFAULT 'FF',
  company_name TEXT,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  points_balance INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_type ON public.customers(customer_type);
```

#### 3.3 订单管理
```sql
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  status order_status DEFAULT 'PENDING',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  quickbooks_invoice_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
```

#### 3.4 折扣码管理
```sql
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE code_type AS ENUM ('GENERAL', 'DEDICATED');

CREATE TABLE public.discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  code_type code_type DEFAULT 'GENERAL',
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_customer ON public.discount_codes(customer_id);
```

#### 3.5 积分系统
```sql
CREATE TABLE public.points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  points_change INTEGER NOT NULL, -- 正数为获得,负数为使用
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_customer ON public.points_transactions(customer_id);
```

#### 3.6 系统配置
```sql
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO public.system_settings (key, value, description) VALUES
  ('points_rules', '{"earning_rate": 1, "redemption_rate": 100, "min_redemption": 100}', '积分规则配置'),
  ('wholesale_program', '{"initial_discount": 20, "upgraded_discount": 30}', '批发计划配置');
```

### Step 4: 在 Supabase 中执行 SQL

1. 在 Supabase Dashboard 中,进入 `SQL Editor`
2. 点击 `New Query`
3. 复制上述 SQL 语句,分批执行
4. 检查 `Table Editor` 确认表已创建

### Step 5: 配置 Storage (可选)

如果需要上传文件(如客户资料、订单附件):

1. 进入 `Storage` → `Create a new bucket`
2. 创建 bucket:
   - Name: `customer-files`
   - Public: false (需要认证才能访问)
3. 设置 Storage Policies

---

## 阶段二: NestJS 后端搭建 (2-3 小时)

### Step 1: 初始化 NestJS 项目

```bash
cd /Users/lihaoyang/Desktop/membership_system/backend

# 安装 NestJS CLI (如果还没有)
npm i -g @nestjs/cli

# 创建新项目(在当前目录)
nest new . --package-manager npm
```

选择配置:
- Package manager: `npm`
- 会提示目录不为空,选择继续

### Step 2: 安装核心依赖

```bash
# Supabase 客户端
npm install @supabase/supabase-js

# Prisma ORM (用于类型安全的数据库操作)
npm install prisma @prisma/client
npm install -D prisma

# 配置管理
npm install @nestjs/config

# 验证和转换
npm install class-validator class-transformer

# JWT 认证
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt

# QuickBooks SDK (后续集成)
npm install node-quickbooks

# 其他工具
npm install dayjs
```

### Step 3: 配置环境变量

创建 `.env` 文件:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database (Prisma)
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# App
PORT=8000
NODE_ENV=development

# QuickBooks (后续配置)
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=http://localhost:8000/api/quickbooks/callback
```

### Step 4: 初始化 Prisma

```bash
# 初始化 Prisma
npx prisma init

# 这会创建:
# - prisma/schema.prisma
# - .env (如果不存在)
```

编辑 `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 枚举类型
enum Role {
  ADMIN
  STAFF
  CUSTOMER
}

enum CustomerType {
  FF
  GC
  DESIGNER
  WHOLESALE
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  COMPLETED
  CANCELLED
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum CodeType {
  GENERAL
  DEDICATED
}

// 用户资料
model Profile {
  id        String   @id @db.Uuid
  email     String   @unique
  fullName  String?  @map("full_name")
  phone     String?
  role      Role     @default(CUSTOMER)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("profiles")
}

// 客户
model Customer {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String?      @map("user_id") @db.Uuid
  customerType   CustomerType @default(FF) @map("customer_type")
  companyName    String?      @map("company_name")
  contactPerson  String?      @map("contact_person")
  phone          String
  email          String?
  address        String?
  pointsBalance  Int          @default(0) @map("points_balance")
  totalSpent     Decimal      @default(0) @db.Decimal(10, 2) @map("total_spent")
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  orders              Order[]
  discountCodes       DiscountCode[]
  pointsTransactions  PointsTransaction[]

  @@index([userId])
  @@index([customerType])
  @@map("customers")
}

// 订单
model Order {
  id                  String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderNumber         String      @unique @map("order_number")
  customerId          String      @map("customer_id") @db.Uuid
  status              OrderStatus @default(PENDING)
  subtotal            Decimal     @db.Decimal(10, 2)
  discountAmount      Decimal     @default(0) @map("discount_amount") @db.Decimal(10, 2)
  pointsUsed          Int         @default(0) @map("points_used")
  pointsEarned        Int         @default(0) @map("points_earned")
  totalAmount         Decimal     @map("total_amount") @db.Decimal(10, 2)
  notes               String?
  quickbooksInvoiceId String?     @map("quickbooks_invoice_id")
  createdBy           String?     @map("created_by") @db.Uuid
  createdAt           DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  customer Customer     @relation(fields: [customerId], references: [id])
  items    OrderItem[]

  @@index([customerId])
  @@index([status])
  @@map("orders")
}

// 订单项
model OrderItem {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId    String   @map("order_id") @db.Uuid
  productName String  @map("product_name")
  quantity   Int
  unitPrice  Decimal  @map("unit_price") @db.Decimal(10, 2)
  totalPrice Decimal  @map("total_price") @db.Decimal(10, 2)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_items")
}

// 折扣码
model DiscountCode {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code          String       @unique
  codeType      CodeType     @default(GENERAL) @map("code_type")
  discountType  DiscountType @map("discount_type")
  discountValue Decimal      @map("discount_value") @db.Decimal(10, 2)
  customerId    String?      @map("customer_id") @db.Uuid
  usageLimit    Int?         @map("usage_limit")
  usageCount    Int          @default(0) @map("usage_count")
  validFrom     DateTime     @default(now()) @map("valid_from") @db.Timestamptz(6)
  validUntil    DateTime?    @map("valid_until") @db.Timestamptz(6)
  isActive      Boolean      @default(true) @map("is_active")
  createdBy     String?      @map("created_by") @db.Uuid
  createdAt     DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)

  customer Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId])
  @@map("discount_codes")
}

// 积分交易
model PointsTransaction {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId   String   @map("customer_id") @db.Uuid
  orderId      String?  @map("order_id") @db.Uuid
  pointsChange Int      @map("points_change")
  balanceAfter Int      @map("balance_after")
  description  String?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  customer Customer @relation(fields: [customerId], references: [id])

  @@index([customerId])
  @@map("points_transactions")
}

// 系统配置
model SystemSetting {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key         String   @unique
  value       Json
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("system_settings")
}
```

生成 Prisma Client:

```bash
npx prisma generate
```

### Step 5: 项目结构规划

```
backend/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── app.module.ts              # 根模块
│   ├── common/                    # 公共模块
│   │   ├── decorators/            # 自定义装饰器
│   │   ├── filters/               # 异常过滤器
│   │   ├── guards/                # 守卫
│   │   ├── interceptors/          # 拦截器
│   │   └── pipes/                 # 管道
│   ├── config/                    # 配置
│   │   └── configuration.ts
│   ├── database/                  # 数据库
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── supabase/                  # Supabase 集成
│   │   ├── supabase.module.ts
│   │   └── supabase.service.ts
│   ├── auth/                      # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   ├── customers/                 # 客户管理
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts
│   │   ├── customers.service.ts
│   │   └── dto/
│   ├── orders/                    # 订单管理
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── dto/
│   ├── discount-codes/            # 折扣码管理
│   ├── points/                    # 积分系统
│   ├── settings/                  # 系统设置
│   ├── dashboard/                 # 仪表板统计
│   └── quickbooks/                # QuickBooks 集成
├── prisma/
│   └── schema.prisma
├── .env
├── .env.example
└── package.json
```

---

## 阶段三: 核心模块开发 (4-6 小时)

### Step 1: Prisma Service

创建 `src/database/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

创建 `src/database/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Step 2: Supabase Service

创建 `src/supabase/supabase.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // 认证相关方法
  async createUser(email: string, password: string, metadata?: any) {
    return this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
  }

  async deleteUser(userId: string) {
    return this.supabase.auth.admin.deleteUser(userId);
  }

  // Storage 相关方法
  async uploadFile(bucket: string, path: string, file: Buffer) {
    return this.supabase.storage.from(bucket).upload(path, file);
  }

  async getPublicUrl(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(path);
  }
}
```

### Step 3: 认证模块

创建 JWT Strategy 和 Guards (详细代码见后续实现)

### Step 4: 业务模块

按照以下优先级开发:
1. **Customers Module** - 客户管理 (CRUD)
2. **Orders Module** - 订单管理
3. **Discount Codes Module** - 折扣码
4. **Points Module** - 积分系统
5. **Settings Module** - 系统配置
6. **Dashboard Module** - 统计数据

---

## 阶段四: API 设计 (参考前端需求)

基于你的前端,需要以下 API 端点:

### 认证 API
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
```

### 客户 API
```
GET    /api/customers              # 列表(支持分页、筛选)
GET    /api/customers/:id          # 详情
POST   /api/customers              # 创建
PUT    /api/customers/:id          # 更新
DELETE /api/customers/:id          # 删除
GET    /api/customers/:id/orders   # 客户订单
GET    /api/customers/:id/points   # 积分记录
```

### 订单 API
```
GET    /api/orders                 # 列表
GET    /api/orders/:id             # 详情
POST   /api/orders                 # 创建
PUT    /api/orders/:id             # 更新
PATCH  /api/orders/:id/status      # 更新状态
DELETE /api/orders/:id             # 删除
```

### 折扣码 API
```
GET    /api/discount-codes
POST   /api/discount-codes
PUT    /api/discount-codes/:id
DELETE /api/discount-codes/:id
POST   /api/discount-codes/validate  # 验证折扣码
```

### 系统设置 API
```
GET    /api/settings
PUT    /api/settings/points-rules
PUT    /api/settings/wholesale-program
```

### 仪表板 API
```
GET    /api/dashboard/stats        # 总览统计
GET    /api/dashboard/revenue      # 收入趋势
GET    /api/dashboard/top-customers
```

---

## 阶段五: 前后端集成 (1-2 小时)

### Step 1: 配置 CORS

在 `main.ts` 中:

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Step 2: 前端 API 客户端配置

在前端创建 `src/lib/api-client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = {
  async fetch(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  get: (endpoint: string) => apiClient.fetch(endpoint),
  post: (endpoint: string, data: any) => 
    apiClient.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) => 
    apiClient.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => 
    apiClient.fetch(endpoint, { method: 'DELETE' }),
};
```

### Step 3: 测试集成

1. 启动后端: `npm run start:dev`
2. 启动前端: `npm run dev`
3. 测试登录、数据获取等功能

---

## 阶段六: QuickBooks 集成 (2-3 小时)

### OAuth 2.0 流程

1. 用户点击"连接 QuickBooks"
2. 重定向到 QuickBooks 授权页面
3. 用户授权后回调到你的应用
4. 保存 access_token 和 refresh_token
5. 使用 token 调用 QuickBooks API

### 核心功能

- 同步客户到 QuickBooks
- 创建发票
- 同步订单状态
- 定期刷新 token

---

## 📝 开发检查清单

### Supabase 配置
- [ ] 创建 Supabase 项目
- [ ] 获取 API 凭证
- [ ] 执行数据库 Schema SQL
- [ ] 配置 RLS 策略
- [ ] 设置 Storage (如需要)
- [ ] 测试数据库连接

### 后端开发
- [ ] 初始化 NestJS 项目
- [ ] 安装依赖
- [ ] 配置环境变量
- [ ] 设置 Prisma
- [ ] 创建 Prisma Service
- [ ] 创建 Supabase Service
- [ ] 实现认证模块
- [ ] 实现业务模块
- [ ] 编写 API 文档
- [ ] 单元测试

### 前后端集成
- [ ] 配置 CORS
- [ ] 创建 API 客户端
- [ ] 测试所有 API 端点
- [ ] 错误处理
- [ ] Loading 状态

### QuickBooks
- [ ] 注册 QuickBooks 开发者账号
- [ ] 创建应用获取凭证
- [ ] 实现 OAuth 流程
- [ ] 测试 API 调用

---

## 🚀 快速启动命令

### 开发环境
```bash
# 后端
cd backend
npm run start:dev

# 前端
cd frontend
npm run dev
```

### 数据库管理
```bash
# 查看数据库
npx prisma studio

# 同步 schema
npx prisma db push

# 生成 migration
npx prisma migrate dev --name init
```

---

## 📚 推荐资源

- [Supabase 文档](https://supabase.com/docs)
- [NestJS 文档](https://docs.nestjs.com)
- [Prisma 文档](https://www.prisma.io/docs)
- [QuickBooks API](https://developer.intuit.com/app/developer/qbo/docs/get-started)

---

## ⚠️ 注意事项

1. **环境变量安全**: 永远不要提交 `.env` 文件到 Git
2. **Service Role Key**: 只在后端使用,前端使用 anon key
3. **RLS 策略**: 确保数据库安全策略正确配置
4. **错误处理**: 实现全局异常过滤器
5. **日志记录**: 使用 NestJS Logger
6. **API 版本控制**: 考虑使用 `/api/v1/` 前缀
7. **数据验证**: 使用 class-validator 验证所有输入
8. **性能优化**: 使用数据库索引、缓存等

---

## 🎯 下一步行动

1. **立即开始**: 创建 Supabase 项目
2. **第一天**: 完成 Supabase 配置和数据库设计
3. **第二天**: 搭建 NestJS 后端基础架构
4. **第三天**: 实现核心业务模块
5. **第四天**: 前后端集成测试
6. **第五天**: QuickBooks 集成

预计总开发时间: **3-5 天** (全职开发)
