# ⚡ Quick Fix - Render Build Error

## 🎯 Vấn Đề

Lỗi: `npm error could not determine executable to run` khi build trên Render.

## ✅ Giải Pháp Nhanh (3 Bước)

### Bước 1: Cập Nhật Render Settings

Vào **Render Dashboard** → Service → **Settings**:

1. **Root Directory**: Xóa hết, để **TRỐNG** (không có gì cả)
2. **Build Command**: 
   ```
   npm install && npm run build:backend
   ```
3. **Start Command**: 
   ```
   cd apps/backend && node dist/main
   ```

### Bước 2: Save và Deploy

1. Click **Save Changes**
2. Click **Manual Deploy** → **Deploy latest commit**

### Bước 3: Kiểm Tra

Xem logs, nếu thấy:
- ✅ `npm install` chạy ở root
- ✅ `npm run build:backend` chạy thành công
- ✅ Build completed

---

## 🔍 Nếu Vẫn Lỗi

### Kiểm Tra Root Directory

**QUAN TRỌNG**: Root Directory **PHẢI** để trống hoàn toàn!

- ❌ SAI: `apps/backend`
- ❌ SAI: `.`
- ✅ ĐÚNG: (trống, không có gì)

### Alternative Build Command

Nếu vẫn lỗi, thử build command này:

```
npm install && cd apps/backend && npm install && npx prisma generate && npx nest build
```

Và start command:
```
cd apps/backend && node dist/main
```

---

## 📝 Lưu Ý

1. **Root Directory trống** = Render sẽ build từ root của repo
2. `npm run build:backend` sẽ tự động tìm workspace và dependencies
3. `node dist/main` chạy trực tiếp file đã build, không cần nest CLI

---

## ✅ Verify Local

Test trước khi push:

```bash
# Từ root directory
npm install
npm run build:backend

# Kiểm tra dist folder
ls apps/backend/dist
```

Nếu có file `main.js` trong `apps/backend/dist/` → ✅ Build thành công!
