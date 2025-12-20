# 🔧 Fix Render Build cho Monorepo

## ❌ Vấn Đề

Lỗi: `Cannot find module '/opt/render/project/src/node_modules/.bin/nest'`

**Nguyên nhân**: 
- Root Directory = `apps/backend`
- `@nestjs/cli` là devDependency của workspace, không được hoist lên root `node_modules`
- Build script cố tìm `nest` ở root nhưng không có

## ✅ Giải Pháp: Dùng Workspace Command

### Build Script Đã Sửa

File `apps/backend/package.json`:
```json
{
  "scripts": {
    "prebuild": "npx prisma generate",
    "build": "cd ../.. && npm install && npm run build:backend",
    "start": "node dist/main"
  }
}
```

**Cách hoạt động**:
1. `cd ../..` → về root
2. `npm install` → install tất cả dependencies (bao gồm workspace)
3. `npm run build:backend` → dùng workspace command từ root (tự động tìm đúng dependencies)

### Cấu Hình Render

1. **Root Directory**: `apps/backend` (giữ nguyên)
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm run start:prod`

### Commit và Push

```bash
git add apps/backend/package.json
git commit -m "Fix: Use workspace command for monorepo build"
git push
```

---

## ✅ Giải Pháp Tốt Hơn: Root Directory Trống

Nếu có thể, đổi Root Directory thành **TRỐNG**:

1. **Root Directory**: (trống)
2. **Build Command**: `npm install && npm run build:backend`
3. **Start Command**: `cd apps/backend && node dist/main`

Cách này đơn giản hơn và ít lỗi hơn!

---

## 🔍 Verify

Sau khi deploy, check logs:

**Nếu dùng workspace command**:
```
==> Building at /opt/render/project/src/apps/backend
==> npm install
==> cd ../.. && npm install
==> npm run build:backend
==> npm run build --workspace=apps/backend
✅ Build succeeded
```

**Nếu Root Directory trống**:
```
==> Building at /opt/render/project/src
==> npm install
==> npm run build:backend
✅ Build succeeded
```

---

## 📝 Tóm Tắt

**Cách 1 (Đã sửa code)**:
- Root Directory: `apps/backend`
- Build Command: `npm install && npm run build`
- Build script tự động về root và dùng workspace command

**Cách 2 (Tốt hơn)**:
- Root Directory: **TRỐNG**
- Build Command: `npm install && npm run build:backend`
- Start Command: `cd apps/backend && node dist/main`

Cả 2 cách đều hoạt động, nhưng Cách 2 đơn giản hơn!
