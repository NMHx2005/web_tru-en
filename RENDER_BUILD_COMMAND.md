# 🎯 Build Command Cho Render (Monorepo)

## ⚠️ Vấn Đề

Với monorepo, khi Root Directory = `apps/backend`, cần build command đặc biệt.

## ✅ Giải Pháp

### Cách 1: Root Directory Trống (KHUYÊN DÙNG)

**Cấu hình Render**:
- **Root Directory**: (TRỐNG)
- **Build Command**: `npm install && npm run build:backend`
- **Start Command**: `cd apps/backend && node dist/main`

### Cách 2: Root Directory = `apps/backend`

**Cấu hình Render**:
- **Root Directory**: `apps/backend`
- **Build Command**: `npm install && npm run build:render`
- **Start Command**: `npm run start:prod`

**Build script đã được thêm**:
```json
{
  "scripts": {
    "build:render": "cd ../.. && npm install && cd apps/backend && npx prisma generate && npx nest build"
  }
}
```

Cách hoạt động:
1. `cd ../..` → về root
2. `npm install` → install tất cả dependencies
3. `cd apps/backend` → về lại backend
4. `npx prisma generate` → generate Prisma client
5. `npx nest build` → build với nest CLI (từ root node_modules hoặc local)

---

## 🚀 Các Bước

### Bước 1: Commit Code

```bash
git add apps/backend/package.json
git commit -m "Add build:render script for Render deployment"
git push
```

### Bước 2: Cấu Hình Render

**Nếu Root Directory trống**:
- Build Command: `npm install && npm run build:backend`

**Nếu Root Directory = `apps/backend`**:
- Build Command: `npm install && npm run build:render`

### Bước 3: Deploy

1. Save Changes
2. Manual Deploy → Deploy latest commit

---

## 🔍 Verify

Sau khi deploy, logs sẽ hiển thị:

**Nếu dùng `build:render`**:
```
==> cd ../.. && npm install
==> cd apps/backend
==> npx prisma generate
==> npx nest build
✅ Build succeeded
```

---

## 📝 Lưu Ý

- `build:render` script chỉ dùng cho Render khi Root Directory = `apps/backend`
- Nếu Root Directory trống, dùng `npm run build:backend` từ root
- `npx` sẽ tự động tìm `nest` CLI từ node_modules gần nhất
