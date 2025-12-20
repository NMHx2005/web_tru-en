# 🔧 Fix Lỗi "nest: not found" trên Render

## Vấn Đề

Khi deploy monorepo lên Render với `Root Directory = apps/backend`, lỗi:
```
npm error could not determine executable to run
npm error command sh -c npx prisma generate && npx nest build
```

## ✅ Giải Pháp (Khuyên Dùng)

### Cách 1: Build từ Root (Tốt Nhất) ⭐

**Cấu hình trên Render**:

1. **Root Directory**: Để **TRỐNG** (xóa `apps/backend`)
2. **Build Command**: 
   ```
   npm install && npm run build:backend
   ```
3. **Start Command**: 
   ```
   cd apps/backend && npm run start:prod
   ```

**⚠️ QUAN TRỌNG**: Đây là cách đúng nhất cho monorepo!

**Lý do**: 
- Monorepo cần install dependencies ở root trước
- Workspace commands (`npm run build:backend`) sẽ tự động tìm đúng dependencies
- Đảm bảo `@nestjs/cli` được tìm thấy từ root `node_modules`

---

### Cách 2: Nếu Phải Dùng Root Directory = `apps/backend` (Không Khuyên)

**Cấu hình trên Render**:

1. **Root Directory**: `apps/backend`
2. **Build Command**: 
   ```
   cd ../.. && npm install && cd apps/backend && npm install && npm run build
   ```
3. **Start Command**: 
   ```
   npm run start:prod
   ```

**Lưu ý**: Cách này phức tạp hơn và dễ lỗi. Nên dùng Cách 1!

---

## 🚀 Các Bước Thực Hiện

### Bước 1: Cập Nhật Cấu Hình Render

1. Vào Render Dashboard → Service của bạn
2. Vào **Settings**
3. Thay đổi:
   - **Root Directory**: Để **TRỐNG** (xóa `apps/backend` hoặc để `.`)
   - **Build Command**: `npm install && npm run build:backend`
   - **Start Command**: `cd apps/backend && npm run start:prod`

**⚠️ QUAN TRỌNG**: 
- Root Directory **PHẢI** để trống
- Nếu vẫn để `apps/backend`, sẽ tiếp tục lỗi

### Bước 2: Save và Deploy

1. Click **Save Changes**
2. Render sẽ tự động trigger deploy mới
3. Hoặc click **Manual Deploy** → **Deploy latest commit**

### Bước 3: Kiểm Tra Logs

1. Vào tab **Logs**
2. Xem quá trình build:
   - ✅ `npm install` ở root
   - ✅ `npm run build:backend` 
   - ✅ Build thành công

---

## 🔍 Verify Local Trước

Test build local để đảm bảo không lỗi:

```bash
# Từ root directory
npm install
npm run build:backend

# Nếu thành công, sẽ thấy:
# - Prisma generate
# - Nest build
# - dist/ folder được tạo trong apps/backend/
```

---

## 📝 Lưu Ý

1. **Root Directory trống** = Build từ root của repo
2. **Workspace commands** (`npm run build:backend`) tự động tìm đúng workspace
3. **Dependencies** được install ở root và hoisted lên workspace
4. **Prisma** cần generate trước khi build (đã có trong build script)

---

## ✅ Sau Khi Fix

Nếu build thành công, bạn sẽ thấy:
- ✅ Build completed
- ✅ Service is live
- ✅ URL: `https://your-service.onrender.com`

Test API:
```bash
curl https://your-service.onrender.com/api/stories
```

---

## 🔄 Nếu Vẫn Lỗi Sau Khi Đổi Root Directory

### Kiểm Tra Lại:

1. **Root Directory có thực sự trống không?**
   - Vào Settings → Root Directory
   - Phải để **TRỐNG** hoặc `.`
   - KHÔNG được có `apps/backend`

2. **Build Command đúng chưa?**
   ```
   npm install && npm run build:backend
   ```

3. **Start Command đúng chưa?**
   ```
   cd apps/backend && npm run start:prod
   ```

### Alternative Build Command (Nếu vẫn lỗi):

Thử build command này:
```
npm install && cd apps/backend && npx prisma generate && npx nest build
```

Và start command:
```
cd apps/backend && node dist/main
```

### Debug Steps:

1. Vào **Shell** tab trên Render
2. Chạy:
   ```bash
   npm install
   which nest
   npm list @nestjs/cli
   ```
3. Kiểm tra xem `@nestjs/cli` có được install không
