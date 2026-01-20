# Supabase API Key 格式迁移指南

## 概述

Supabase 正在推广新的 API Key 格式（以 `sb_` 开头），以提供更好的安全性和可识别性。本应用已完全兼容新旧两种格式。

## API Key 格式对比

### 🆕 新格式（推荐）
- **前缀**: `sb_`
- **示例**: `sb_1234567890abcdef...`
- **优势**:
  - 更易识别（一眼就能看出是 Supabase key）
  - 更好的安全性
  - 未来的默认格式

### 📜 旧格式（仍然支持）
- **前缀**: `eyJ`
- **示例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **说明**: JWT 格式，仍然完全支持

## 兼容性状态

✅ **完全兼容**: 本应用使用 `@supabase/supabase-js` v2.89.0，完全支持两种格式

### 自动检测功能

应用启动时会自动：
1. ✅ 检测你使用的 API Key 格式
2. ✅ 验证 API Key 的有效性
3. ✅ 测试与 Supabase 的连接
4. ✅ 在日志中显示详细的诊断信息

## 如何获取新格式的 API Key

### 方法 1: Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 查看 **Project API keys** 部分
5. 如果你的 key 已经是 `sb_` 开头，无需任何操作
6. 如果还是旧格式，可以选择重新生成（⚠️ 注意：会使旧 key 失效）

### 方法 2: 继续使用旧格式

如果你的项目目前使用旧格式（`eyJ` 开头），**无需立即迁移**：
- ✅ 旧格式仍然完全支持
- ✅ 不会影响任何功能
- ✅ 可以在方便的时候迁移

## 配置示例

### 使用新格式

```bash
# .env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_1234567890abcdef...
```

### 使用旧格式

```bash
# .env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 启动日志示例

### 使用新格式时的日志

```
[SupabaseService] ✅ Using NEW Supabase API key format: sb_12345...abcd
[SupabaseService] 📌 New format (sb_*) is fully supported
[SupabaseService] 🔍 Testing Supabase connection...
[SupabaseService] ✅ Supabase connection successful!
[SupabaseService] 📊 Auth service is operational (found 5 user(s) in test query)
```

### 使用旧格式时的日志

```
[SupabaseService] ✅ Using LEGACY Supabase API key format: eyJhbGci...XVCj9
[SupabaseService] 📌 Legacy format is supported but consider migrating to new format
[SupabaseService] 🔍 Testing Supabase connection...
[SupabaseService] ✅ Supabase connection successful!
[SupabaseService] 📊 Auth service is operational (found 5 user(s) in test query)
```

## 故障排查

### 问题：API Key 无效

**日志显示**:
```
[SupabaseService] ❌ Supabase connection test failed: Invalid API key
[SupabaseService] 💡 Tip: Verify your SUPABASE_SERVICE_ROLE_KEY is correct
[SupabaseService] 💡 Both old (eyJ*) and new (sb_*) formats are supported
```

**解决方案**:
1. 检查 `.env` 文件中的 `SUPABASE_SERVICE_ROLE_KEY`
2. 确保使用的是 **Service Role Key**（不是 Anon Key）
3. 确保 key 完整复制（没有多余空格或换行）
4. 在 Supabase Dashboard 中重新复制 key

### 问题：未知的 API Key 格式

**日志显示**:
```
[SupabaseService] ⚠️  Unknown API key format: abc12...xyz
[SupabaseService] Expected formats: sb_* (new) or eyJ* (legacy JWT)
```

**解决方案**:
1. 确认你复制的是正确的 Supabase API Key
2. 检查是否复制了完整的 key
3. 从 Supabase Dashboard 重新获取

## 迁移建议

### 何时迁移到新格式？

**建议迁移**:
- ✅ 新项目：直接使用新格式
- ✅ 定期轮换密钥时：趁机切换到新格式
- ✅ 重新部署应用时：可以顺便更新

**可以暂缓**:
- ⏸️ 生产环境运行稳定：无需立即迁移
- ⏸️ 旧格式工作正常：可以继续使用

### 迁移步骤

1. **备份当前配置**
   ```bash
   cp backend/.env backend/.env.backup
   ```

2. **获取新格式的 API Key**
   - 在 Supabase Dashboard 中查看或重新生成

3. **更新 .env 文件**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=sb_new_key_here
   ```

4. **重启应用**
   ```bash
   cd backend
   npm run start:dev
   ```

5. **验证日志**
   - 查看是否显示 "Using NEW Supabase API key format"
   - 确认连接测试成功

## 技术实现细节

本应用的兼容性实现包括：

1. **格式检测**: 自动识别 `sb_` 或 `eyJ` 前缀
2. **验证逻辑**: 检查 key 长度和格式
3. **连接测试**: 启动时自动测试 Supabase 连接
4. **详细日志**: 提供清晰的诊断信息
5. **错误处理**: 针对不同错误提供具体建议

## 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase API Keys 说明](https://supabase.com/docs/guides/api/api-keys)
- [@supabase/supabase-js 文档](https://supabase.com/docs/reference/javascript/introduction)

## 总结

✅ **无需担心**: 本应用完全兼容新旧两种格式  
✅ **自动检测**: 启动时会自动验证和测试  
✅ **灵活迁移**: 可以在方便的时候迁移到新格式  
✅ **详细日志**: 清晰的诊断信息帮助排查问题
