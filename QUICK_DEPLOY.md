# ⚡ Quick Deploy Guide (5 phút)

Hướng dẫn nhanh để deploy dự án lên production.

## 🎯 Option 1: Deploy nhanh nhất (Recommended)

### Backend → Railway
1. Vào [Railway](https://railway.app) → New Project
2. Deploy from GitHub → Chọn repo
3. **Root Directory**: `apps/backend`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm run start:prod`
6. Add environment variables (xem bên dưới)
7. Deploy → Done! ✅

### Frontend → Vercel
1. Vào [Vercel](https://vercel.com) → Import Project
2. Connect GitHub → Chọn repo
3. **Root Directory**: `apps/frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
   ```
5. Deploy → Done! ✅

### Database → Neon
1. Vào [Neon](https://console.neon.tech) → New Project
2. Copy connection string
3. Add vào Railway environment variables:
   ```
   DATABASE_URL=postgresql://...
   ```
4. Run migrations:
   ```bash
   # SSH vào Railway hoặc dùng Railway CLI
   npx prisma migrate deploy
   ```

---

## 🔐 Environment Variables Checklist

### Backend (Railway)
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
DATABASE_URL=postgresql://... (từ Neon)
JWT_SECRET=<generate-32-chars>
JWT_REFRESH_SECRET=<generate-32-chars>
FRONTEND_URL=https://your-frontend.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-backend.railway.app/api/auth/google/callback
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_CALLBACK_URL=https://your-backend.railway.app/api/auth/facebook/callback
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

---

## 🚀 Deploy Steps

1. **Database**: Tạo Neon project → Copy connection string
2. **Backend**: Deploy lên Railway → Add env vars → Deploy
3. **Frontend**: Deploy lên Vercel → Add env vars → Deploy
4. **Migrations**: Chạy `npx prisma migrate deploy` trong Railway
5. **OAuth**: Update callback URLs trong Google/Facebook
6. **Test**: Truy cập frontend URL → Test đăng nhập

---

## 📝 Post-Deploy

1. **Create admin user** (qua database hoặc API)
2. **Test OAuth** (Google, Facebook)
3. **Setup domain** (optional - có thể dùng subdomain của Railway/Vercel)
4. **Setup monitoring** (Sentry - optional)

**Done! Website đã live! 🎉**
