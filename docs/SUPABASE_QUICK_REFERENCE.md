# Supabase 连接模式快速参考

## 🚀 快速决策

```
你的应用部署在哪里？

├─ 无服务器平台 (Vercel/Netlify/Lambda)
│  └─ ✅ 使用 Transaction Pooler (端口 6543)
│
├─ 传统服务器/VPS
│  ├─ 需要高并发？
│  │  └─ ✅ 使用 Transaction Pooler (端口 6543)
│  └─ 需要 LISTEN/NOTIFY？
│     └─ ✅ 使用 Direct Connection (端口 5432)
│
└─ 本地开发
   └─ ✅ 使用 Direct Connection (端口 5432)
```

---

## 📋 三种模式对比表

| 特性 | Direct Connection | Transaction Pooler | Session Pooler |
|------|------------------|-------------------|----------------|
| **端口** | 5432 | 6543 | 5432 + pgbouncer |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **并发能力** | ⭐⭐ (60-400) | ⭐⭐⭐⭐⭐ (数千) | ⭐⭐⭐ (数百) |
| **防火墙限制** | ❌ 可能受限 | ✅ 无限制 | ❌ 可能受限 |
| **LISTEN/NOTIFY** | ✅ 支持 | ❌ 不支持 | ✅ 支持 |
| **预处理语句** | ✅ 支持 | ❌ 不支持 | ✅ 支持 |
| **Prisma Migrate** | ✅ 支持 | ❌ 需要 directUrl | ✅ 支持 |
| **无服务器** | ⚠️ 不推荐 | ✅ 推荐 | ⚠️ 不推荐 |

---

## 💻 配置示例

### 方案 A: 生产环境（推荐）

```env
# Transaction Pooler - 运行时使用
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection - 迁移使用
DIRECT_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**Prisma Schema**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Transaction Pooler
  directUrl = env("DIRECT_URL")        // Direct Connection
}
```

**适用于**: 
- ✅ Vercel / Netlify / AWS Lambda
- ✅ 高并发 Web 应用
- ✅ 需要自动扩展的应用

---

### 方案 B: 开发环境

```env
# Direct Connection - 最快性能
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**适用于**:
- ✅ 本地开发
- ✅ 数据库迁移
- ✅ 调试和测试

---

### 方案 C: 需要高级特性

```env
# Direct Connection - 支持所有 PostgreSQL 特性
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**适用于**:
- ✅ 使用 LISTEN/NOTIFY
- ✅ 需要预处理语句
- ✅ 长连接应用

---

## 🔧 常用命令

### 验证 Supabase 配置
```bash
cd backend
npm run validate:supabase
```

### 运行数据库迁移
```bash
cd backend
npx prisma migrate dev
```

### 查看数据库
```bash
cd backend
npx prisma studio
```

---

## ⚠️ 常见错误

### 错误 1: "too many connections"

**原因**: 超过数据库连接限制

**解决**:
```env
# 切换到 Transaction Pooler
DATABASE_URL="...pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

### 错误 2: "prepared statement does not exist"

**原因**: Transaction Pooler 不支持预处理语句

**解决**:
```env
# 方案 1: 禁用预处理语句
DATABASE_URL="...?pgbouncer=true&prepared_statements=false"

# 方案 2: 切换到 Session Pooler
DATABASE_URL="...pooler.supabase.com:5432/postgres?pgbouncer=true"
```

---

### 错误 3: Prisma Migrate 失败

**原因**: Transaction Pooler 不支持某些迁移操作

**解决**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 添加这行
}
```

---

## 📊 连接数限制

| Supabase 计划 | Direct Connection | Transaction Pooler |
|--------------|------------------|-------------------|
| Free         | 60               | ~3000             |
| Pro          | 200              | ~10000            |
| Team         | 400              | ~20000            |

---

## 🎯 推荐配置总结

### ✅ 大多数应用（推荐）

```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

### ✅ 无服务器应用（必须）

```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

### ✅ 本地开发

```env
DATABASE_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

---

## 📚 更多信息

详细文档: [SUPABASE_DATABASE_CONNECTION_MODES.md](./SUPABASE_DATABASE_CONNECTION_MODES.md)
