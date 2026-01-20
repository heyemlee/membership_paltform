# Supabase 数据库连接模式选择指南

## 概述

Supabase 提供三种数据库连接模式，每种模式适用于不同的场景。理解它们的区别对于生产环境部署至关重要。

---

## 三种连接模式对比

### 1️⃣ Direct Connection (直连模式)

**连接字符串格式**:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**端口**: `5432` (PostgreSQL 默认端口)

**特点**:
- ✅ **最快的性能** - 直接连接到数据库，无中间层
- ✅ **支持所有 PostgreSQL 特性** - 包括 `LISTEN/NOTIFY`、预处理语句等
- ✅ **适合长连接** - 适合需要保持连接的应用
- ❌ **连接数限制严格** - 受数据库实例的 `max_connections` 限制
- ❌ **有防火墙限制** - 需要 IPv4 地址（某些云平台不支持）

**适用场景**:
- 🔹 本地开发环境
- 🔹 需要使用高级 PostgreSQL 特性（如 `LISTEN/NOTIFY`）
- 🔹 单个长期运行的后端服务
- 🔹 数据库迁移和管理工具（Prisma Migrate）

**连接数限制**:
| Supabase 计划 | 最大连接数 |
|--------------|----------|
| Free         | 60       |
| Pro          | 200      |
| Team         | 400      |
| Enterprise   | 自定义    |

---

### 2️⃣ Transaction Pooler (事务池模式)

**连接字符串格式**:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**端口**: `6543`

**特点**:
- ✅ **支持更多并发连接** - 通过 PgBouncer 连接池管理
- ✅ **适合无服务器环境** - 每个请求创建新连接
- ✅ **无防火墙限制** - 通过 HTTP/HTTPS 兼容的端口
- ✅ **支持事务** - 每个连接在事务结束后释放
- ⚠️ **不支持某些特性** - 如预处理语句、`LISTEN/NOTIFY`
- ⚠️ **性能略低于直连** - 有连接池开销

**适用场景**:
- 🔹 **生产环境推荐** - 大多数应用的最佳选择
- 🔹 无服务器函数（AWS Lambda、Vercel、Netlify）
- 🔹 高并发 Web 应用
- 🔹 需要自动扩展的应用

**工作原理**:
```
[应用] → [PgBouncer 连接池] → [PostgreSQL 数据库]
         (Transaction Mode)
```

每个事务结束后，连接返回池中供其他请求使用。

---

### 3️⃣ Session Pooler (会话池模式)

**连接字符串格式**:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
```

**端口**: `5432` (与直连相同，但通过 PgBouncer)

**特点**:
- ✅ **支持所有 PostgreSQL 特性** - 包括预处理语句
- ✅ **连接池管理** - 比直连支持更多并发
- ✅ **会话级别的连接** - 连接在客户端断开后才释放
- ⚠️ **连接数限制** - 比事务池模式更严格
- ⚠️ **不适合短连接** - 会话保持时间较长

**适用场景**:
- 🔹 需要预处理语句的应用
- 🔹 需要会话级别状态的应用
- 🔹 中等并发的传统 Web 应用

**工作原理**:
```
[应用] → [PgBouncer 连接池] → [PostgreSQL 数据库]
         (Session Mode)
```

连接在整个会话期间保持，直到客户端断开。

---

## 🎯 生产环境选择建议

### 推荐方案（适用于大多数应用）

```typescript
// 使用 Transaction Pooler
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

**原因**:
1. ✅ **无防火墙限制** - 可在任何云平台部署
2. ✅ **高并发支持** - 适合扩展
3. ✅ **无服务器友好** - 适合现代架构
4. ✅ **成本效益** - 不会浪费数据库连接

### 特殊场景选择

#### 场景 1: 使用 Prisma Migrate

**问题**: Prisma Migrate 需要直连模式

**解决方案**: 使用两个连接字符串

```env
# .env
# 应用运行时使用（Transaction Pooler）
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres"

# 数据库迁移使用（Direct Connection）
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

**Prisma Schema 配置**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Transaction Pooler
  directUrl = env("DIRECT_URL")        // Direct Connection
}
```

#### 场景 2: 需要 LISTEN/NOTIFY

**解决方案**: 必须使用 Direct Connection

```env
DATABASE_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

**注意**: 需要确保部署环境支持 IPv4 直连

#### 场景 3: 部署在有防火墙限制的平台

**问题**: 某些云平台（如某些 PaaS）限制出站连接

**解决方案**: 使用 Transaction Pooler (端口 6543)

```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres"
```

---

## 🔥 为什么 Direct Connection 有防火墙限制？

### 技术原因

1. **端口限制**
   - Direct Connection 使用端口 `5432`（PostgreSQL 标准端口）
   - 某些云平台出于安全考虑，限制非标准端口的出站连接
   - 只允许 HTTP(80)、HTTPS(443) 等标准端口

2. **IPv4 要求**
   - Direct Connection 需要 IPv4 地址
   - 某些现代云平台（如 Cloudflare Workers）仅支持 IPv6 或 HTTP 协议
   - Supabase 的直连端点需要 TCP 连接，不支持纯 HTTP

3. **网络架构**
   - 无服务器平台（Vercel、Netlify）通常在隔离的网络环境中运行
   - 这些环境可能不允许直接的 TCP 数据库连接
   - 需要通过 HTTP 代理或连接池

### 常见受限平台

| 平台 | Direct Connection | Transaction Pooler |
|------|------------------|-------------------|
| Vercel (Serverless) | ❌ 可能受限 | ✅ 推荐 |
| Netlify Functions | ❌ 可能受限 | ✅ 推荐 |
| Cloudflare Workers | ❌ 不支持 | ✅ 必须使用 |
| AWS Lambda | ✅ 支持（需 VPC） | ✅ 推荐 |
| Railway | ✅ 支持 | ✅ 支持 |
| Render | ✅ 支持 | ✅ 支持 |
| 传统 VPS/服务器 | ✅ 支持 | ✅ 支持 |

---

## 📊 性能对比

### 延迟对比（相对值）

```
Direct Connection:      ████░░░░░░ (最低延迟)
Session Pooler:         █████░░░░░ (略高)
Transaction Pooler:     █████░░░░░ (略高)
```

### 并发能力对比

```
Direct Connection:      ████░░░░░░ (60-400 连接)
Session Pooler:         ███████░░░ (数百连接)
Transaction Pooler:     ██████████ (数千连接)
```

---

## 🛠️ 实际配置示例

### 方案 1: NestJS + Prisma (推荐)

```env
# .env
# 运行时使用 Transaction Pooler
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移使用 Direct Connection
DIRECT_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**Prisma Schema**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**连接池配置**:
```typescript
// prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // 连接池配置
      log: ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

### 方案 2: 无服务器环境（Vercel/Netlify）

```env
# 必须使用 Transaction Pooler
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**重要**: 设置 `connection_limit=1` 避免连接泄漏

### 方案 3: 传统服务器部署

```env
# 可以使用 Direct Connection
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

---

## ⚠️ 常见问题和解决方案

### 问题 1: "too many connections" 错误

**原因**: 超过数据库最大连接数

**解决方案**:
1. 切换到 Transaction Pooler
2. 减少应用的连接池大小
3. 升级 Supabase 计划

```typescript
// Prisma 连接池配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 限制连接数
  connection_limit = 5
  pool_timeout = 20
}
```

### 问题 2: Prisma Migrate 失败

**错误**: `Error: P1001: Can't reach database server`

**原因**: Transaction Pooler 不支持某些迁移操作

**解决方案**: 使用 `directUrl`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Transaction Pooler
  directUrl = env("DIRECT_URL")        // Direct Connection
}
```

### 问题 3: 预处理语句错误

**错误**: `prepared statement "..." does not exist`

**原因**: Transaction Pooler 不支持预处理语句

**解决方案**:
1. 切换到 Session Pooler 或 Direct Connection
2. 或在连接字符串中禁用预处理语句:

```env
DATABASE_URL="...?pgbouncer=true&prepared_statements=false"
```

### 问题 4: 无服务器环境连接超时

**原因**: 连接未正确关闭，导致连接池耗尽

**解决方案**:
```typescript
// 确保每次请求后关闭连接
export async function handler(event) {
  const prisma = new PrismaClient();
  
  try {
    const result = await prisma.user.findMany();
    return { statusCode: 200, body: JSON.stringify(result) };
  } finally {
    await prisma.$disconnect(); // 重要！
  }
}
```

---

## 🎓 最佳实践总结

### ✅ 推荐做法

1. **生产环境默认使用 Transaction Pooler**
   ```env
   DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

2. **使用 Prisma 时配置 directUrl**
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

3. **无服务器环境限制连接数**
   ```env
   DATABASE_URL="...?connection_limit=1"
   ```

4. **监控连接使用情况**
   - 在 Supabase Dashboard 查看活跃连接数
   - 设置告警（接近限制时）

### ❌ 避免的做法

1. ❌ 在无服务器环境使用 Direct Connection
2. ❌ 不设置连接池限制
3. ❌ 忘记关闭数据库连接
4. ❌ 在 Transaction Pooler 上使用预处理语句

---

## 📚 相关资源

- [Supabase Database Connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

## 🔍 快速决策树

```
需要使用 Prisma Migrate？
├─ 是 → 使用 Transaction Pooler + directUrl
└─ 否 → 继续

部署在无服务器平台？
├─ 是 → 使用 Transaction Pooler (6543)
└─ 否 → 继续

需要 LISTEN/NOTIFY 或高级特性？
├─ 是 → 使用 Direct Connection (5432)
└─ 否 → 使用 Transaction Pooler (6543) ✅ 推荐

```

---

## 总结

| 连接模式 | 端口 | 性能 | 并发 | 防火墙 | 推荐场景 |
|---------|------|------|------|--------|---------|
| **Direct Connection** | 5432 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ 可能受限 | 开发、迁移、高级特性 |
| **Transaction Pooler** | 6543 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ 无限制 | **生产环境推荐** |
| **Session Pooler** | 5432 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ 可能受限 | 需要预处理语句 |

**🎯 生产环境推荐**: Transaction Pooler (端口 6543)
