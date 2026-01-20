# 生产环境管理员账户创建指南

## 方法对比

| 方法 | 安全性 | 适用场景 | 推荐度 |
|------|--------|----------|--------|
| 专用脚本 | ⭐⭐⭐⭐⭐ | 生产环境初始化 | ✅ 强烈推荐 |
| API 注册 | ⭐⭐⭐ | 开发/测试环境 | ⚠️ 需要关闭注册端点 |
| SQL 直接插入 | ⭐ | 不推荐 | ❌ 容易出错 |

---

## 方法 1: 使用专用脚本（推荐）

### 开发环境

```bash
cd backend
npm run create-admin admin@example.com SecurePass123 "Admin User"
```

### 生产环境

```bash
# 1. SSH 到生产服务器
ssh user@your-production-server

# 2. 进入后端目录
cd /path/to/membership_system/backend

# 3. 运行创建脚本
npm run create-admin admin@yourcompany.com "YourSecurePassword123!" "Admin Name"
```

**脚本特性：**
- ✅ 自动在 Supabase Auth 创建用户
- ✅ 自动在数据库创建 profile 记录
- ✅ 密码自动加密（bcrypt）
- ✅ 邮箱格式验证
- ✅ 密码强度检查（至少 8 位）
- ✅ 错误处理和回滚

---

## 方法 2: 通过 API（需要额外配置）

### ⚠️ 安全注意事项

生产环境使用 API 注册需要：

1. **临时开放注册端点**
2. **使用后立即关闭**
3. **或添加管理员密钥验证**

### 步骤：

#### 1. 修改注册端点（添加管理员密钥验证）

编辑 `backend/src/auth/auth.controller.ts`:

```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto, @Headers('x-admin-secret') adminSecret: string) {
  // 生产环境需要管理员密钥
  if (process.env.NODE_ENV === 'production') {
    if (adminSecret !== process.env.ADMIN_CREATION_SECRET) {
      throw new UnauthorizedException('Invalid admin secret');
    }
  }
  
  return this.authService.register(registerDto);
}
```

#### 2. 添加环境变量

在 `backend/.env` 添加：
```env
ADMIN_CREATION_SECRET=your-super-secret-key-here
```

#### 3. 使用 API 创建

```bash
curl -X POST https://your-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-super-secret-key-here" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

#### 4. 创建后立即移除密钥或关闭端点

---

## 方法 3: 直接 SQL（不推荐）

如果必须使用 SQL，需要两步：

### 1. 在 Supabase Auth 创建用户

在 Supabase Dashboard → SQL Editor:

```sql
-- 注意：这只创建 auth 用户，密码是明文（Supabase 会自动加密）
-- 但你需要手动确认邮箱
SELECT auth.create_user(
  email := 'admin@example.com',
  password := 'YourPassword123!',
  email_confirmed := true
);
```

### 2. 在应用数据库创建 Profile

```sql
-- 获取刚创建的用户 ID
SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- 创建 profile（需要手动加密密码）
-- ⚠️ 这里的密码需要用 bcrypt 加密，不能直接用明文
INSERT INTO profiles (id, email, name, role, password_hash, status)
VALUES (
  'user-id-from-above',
  'admin@example.com',
  'Admin User',
  'ADMIN',
  '$2b$10$...',  -- ⚠️ 需要预先用 bcrypt 加密
  'ACTIVE'
);
```

**问题：**
- ❌ 需要手动加密密码
- ❌ 容易出错（两个表不同步）
- ❌ 不推荐用于生产环境

---

## 最佳实践建议

### 生产环境部署流程

1. **部署应用**
   ```bash
   # 部署代码
   git pull origin main
   npm install
   npm run build
   ```

2. **运行数据库迁移**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **创建管理员账户**
   ```bash
   npm run create-admin admin@yourcompany.com "SecurePassword123!" "Admin Name"
   ```

4. **验证登录**
   - 访问前端登录页面
   - 使用创建的账户登录
   - 立即修改密码

5. **安全措施**
   - 删除或注释掉 API 注册端点（如果不需要）
   - 启用 2FA（如果实现了）
   - 定期审计管理员账户

---

## 环境变量检查清单

生产环境 `backend/.env` 必需项：

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️ 创建管理员需要

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=production-secret-key  # ⚠️ 必须是强密钥
JWT_EXPIRATION=7d

# App
PORT=8000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
```

---

## 故障排查

### 脚本执行失败

**错误**: `Cannot find module '@prisma/client'`
```bash
cd backend
npm install
npx prisma generate
```

**错误**: `Supabase Auth error: Invalid API key`
- 检查 `.env` 中的 `SUPABASE_SERVICE_ROLE_KEY`
- 确保使用的是 Service Role Key，不是 Anon Key

**错误**: `User already exists`
- 该邮箱已被使用
- 使用不同的邮箱或删除现有用户

### 无法登录

1. 检查邮箱是否已确认（脚本会自动确认）
2. 检查密码是否正确
3. 查看后端日志
4. 使用 Prisma Studio 检查数据库记录

---

## 安全建议

1. **强密码策略**
   - 至少 12 位字符
   - 包含大小写字母、数字、特殊字符
   - 不使用常见密码

2. **定期轮换**
   - 每 90 天更换管理员密码
   - 使用密码管理器

3. **最小权限原则**
   - 不要给所有人 ADMIN 权限
   - 使用 STAFF 角色处理日常操作

4. **审计日志**
   - 记录所有管理员操作
   - 定期审查访问日志
