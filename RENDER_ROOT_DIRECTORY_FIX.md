# 🔴 QUAN TRỌNG: Root Directory Phải Để TRỐNG!

## ❌ Vấn Đề Hiện Tại

Log cho thấy path là: `/opt/render/project/src/apps/backend`

Điều này có nghĩa là **Root Directory vẫn là `apps/backend`**!

## ✅ Giải Pháp: Đổi Root Directory Thành TRỐNG

### Bước 1: Vào Render Dashboard

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Click vào service `web-truyen-backend` của bạn
3. Click tab **Settings** (bên trái)

### Bước 2: Tìm và Xóa Root Directory

1. Scroll xuống phần **Build & Deploy**
2. Tìm field **Root Directory**
3. **XÓA HẾT** giá trị trong đó (hiện tại là `apps/backend`)
4. Để **TRỐNG HOÀN TOÀN** (không có gì cả)

**Hình ảnh minh họa**:
```
Root Directory: [apps/backend]  ❌ SAI - XÓA HẾT
Root Directory: []              ✅ ĐÚNG - ĐỂ TRỐNG
```

### Bước 3: Cập Nhật Build & Start Commands

Trong cùng phần **Build & Deploy**:

**Build Command**:
```
npm install && npm run build:backend
```

**Start Command**:
```
cd apps/backend && node dist/main
```

### Bước 4: Save và Deploy

1. Click nút **Save Changes** (màu xanh, ở cuối trang)
2. Render sẽ tự động trigger deploy mới
3. Hoặc vào tab **Manual Deploy** → **Deploy latest commit**

---

## 🔍 Verify Sau Khi Đổi

Sau khi deploy, check logs. Path phải là:
```
/opt/render/project/src
```

**KHÔNG PHẢI**:
```
/opt/render/project/src/apps/backend  ❌
```

---

## 📸 Nếu Không Tìm Thấy Root Directory Field

1. Scroll xuống dưới cùng của Settings page
2. Hoặc tìm trong phần **Build Settings**
3. Hoặc trong **Advanced Settings**

Nếu vẫn không thấy, có thể:
- Render đã ẩn field này
- Thử tạo service mới với Root Directory trống ngay từ đầu

---

## 🆘 Nếu Vẫn Không Được

### Tạo Service Mới

1. **New +** → **Web Service**
2. Connect GitHub → Chọn repo
3. **Root Directory**: Để **TRỐNG** ngay từ đầu
4. **Build Command**: `npm install && npm run build:backend`
5. **Start Command**: `cd apps/backend && node dist/main`
6. Add environment variables
7. Deploy

---

## ✅ Sau Khi Fix

Logs sẽ hiển thị:
```
==> Building...
==> npm install
==> npm run build:backend
==> Build succeeded!
```

Path sẽ là `/opt/render/project/src` (root của repo)
