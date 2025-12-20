# 🚀 Hướng dẫn Triển khai (Deployment Guide)

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Chuẩn bị](#chuẩn-bị)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Domain & SSL](#domain--ssl)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Tổng quan

Dự án này là một **monorepo** với:
- **Backend**: NestJS API (Port 3001)
- **Frontend**: Next.js App (Port 3000)
- **Database**: PostgreSQL (Neon hoặc tự host)

### Kiến trúc Deployment

```
┌─────────────┐
│   Domain    │ (yourdomain.com)
└──────┬──────┘
       │
       ├───► Frontend (Next.js) ──► Vercel/Netlify/VPS
       │
       └───► Backend API ──► Railway/Render/VPS
              │
              └───► Database ──► Neon/Supabase/Self-hosted
```

---

## 🔧 Chuẩn bị

### 1. Tài khoản cần có

- [ ] **Domain**: Mua domain từ Namecheap, GoDaddy, etc.
- [ ] **Database**: Neon (free tier) hoặc Supabase
- [ ] **Cloudinary**: Tài khoản Cloudinary (free tier)
- [ ] **GitHub**: Repository để deploy
- [ ] **Vercel/Netlify**: Deploy frontend (free tier)
- [ ] **Railway/Render**: Deploy backend (free tier) hoặc VPS

### 2. Tools cần cài

```bash
# Node.js 18+ và npm
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# Git
git --version

# (Optional) Docker nếu dùng VPS
docker --version
```

---

## 🗄️ Database Setup

### Option 1: Neon (Recommended - Free Tier)

1. **Tạo tài khoản**: [Neon Console](https://console.neon.tech)
2. **Tạo project mới**
3. **Copy connection string**:
   ```
   postgresql://user:password@host/database?sslmode=require
   ```
4. **Lưu connection string** để dùng cho `DATABASE_URL`

### Option 2: Supabase (Free Tier)

1. **Tạo project**: [Supabase](https://supabase.com)
2. **Vào Settings → Database**
3. **Copy connection string** (URI format)

### Option 3: Self-hosted PostgreSQL

Nếu dùng VPS, có thể dùng Docker:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=web_truyen_db \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## 🔙 Backend Deployment

### Option 1: Railway (Recommended - Easy)

1. **Tạo tài khoản**: [Railway](https://railway.app)
2. **Connect GitHub repository**
3. **New Project → Deploy from GitHub**
4. **Chọn repository và branch**
5. **Configure**:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
6. **Add Environment Variables** (xem phần [Environment Variables](#environment-variables))
7. **Deploy** → Railway tự động build và deploy

### Option 2: Render

1. **Tạo tài khoản**: [Render](https://render.com)
2. **New → Web Service**
3. **Connect GitHub repository**
4. **Configure**:
   - **Name**: `web-truyen-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd apps/backend && npm install && npm run build`
   - **Start Command**: `cd apps/backend && npm run start:prod`
   - **Root Directory**: `apps/backend`
5. **Add Environment Variables**
6. **Deploy**

### Option 3: VPS (Vultr, DigitalOcean, AWS EC2)

#### Bước 1: Setup Server

```bash
# SSH vào server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx
```

#### Bước 2: Clone và Build

```bash
# Clone repository
git clone https://github.com/your-username/web-truyen-tien-hung.git
cd web-truyen-tien-hung

# Install dependencies
npm install

# Build backend
cd apps/backend
npm run build

# Create .env file
nano .env
# (Paste environment variables)
```

#### Bước 3: Setup PM2

```bash
# Start với PM2
pm2 start dist/main.js --name "web-truyen-backend"

# Save PM2 config
pm2 save
pm2 startup
```

#### Bước 4: Setup Nginx

```bash
# Create Nginx config
nano /etc/nginx/sites-available/web-truyen-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/web-truyen-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended - Best for Next.js)

1. **Tạo tài khoản**: [Vercel](https://vercel.com)
2. **Import Project từ GitHub**
3. **Configure**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `npm run build` (hoặc để mặc định)
   - **Output Directory**: `.next`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
5. **Deploy** → Vercel tự động build và deploy

### Option 2: Netlify

1. **Tạo tài khoản**: [Netlify](https://netlify.com)
2. **New site from Git**
3. **Connect GitHub**
4. **Configure**:
   - **Base directory**: `apps/frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/frontend/.next`
5. **Add Environment Variables**
6. **Deploy**

### Option 3: VPS

```bash
# SSH vào server
ssh root@your-server-ip

# Clone repository (nếu chưa có)
cd /var/www
git clone https://github.com/your-username/web-truyen-tien-hung.git
cd web-truyen-tien-hung

# Install dependencies
npm install

# Build frontend
cd apps/frontend
npm run build

# Install PM2
npm install -g pm2

# Start Next.js với PM2
pm2 start npm --name "web-truyen-frontend" -- start

# Save PM2 config
pm2 save
```

**Nginx config cho frontend**:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🌐 Domain & SSL

### 1. Cấu hình DNS

Thêm các records sau vào DNS provider (Namecheap, GoDaddy, etc.):

```
Type    Name    Value                    TTL
A       @       <VPS_IP>                 3600
A       www     <VPS_IP>                 3600
CNAME   api     <backend-domain>         3600
```

**Nếu dùng Vercel/Railway**:
- Vercel: Thêm domain trong Vercel dashboard → DNS records tự động
- Railway: Thêm custom domain → Copy DNS records

### 2. Setup SSL với Let's Encrypt (Free)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

**Nếu dùng Vercel/Railway**:
- SSL tự động được cấu hình
- Không cần setup thủ công

---

## 🔐 Environment Variables

### Backend (.env)

Tạo file `.env` trong `apps/backend/`:

```env
# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT
JWT_SECRET=<generate-strong-secret-32-chars>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate-strong-secret-32-chars>
JWT_REFRESH_EXPIRES_IN=30d

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# OAuth - Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://api.yourdomain.com/api/auth/facebook/callback

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

**Generate JWT_SECRET**:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Frontend (.env.local)

Tạo file `.env.local` trong `apps/frontend/`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

**Lưu ý**: 
- Với Vercel/Netlify: Thêm vào dashboard → Environment Variables
- Với VPS: Tạo file `.env.local` trong `apps/frontend/`

---

## 🚀 Post-Deployment

### 1. Database Migrations

```bash
# SSH vào backend server hoặc chạy local
cd apps/backend

# Run migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npm run prisma:seed
```

### 2. Verify Deployment

**Backend**:
```bash
# Test API
curl https://api.yourdomain.com/api/health
# Hoặc
curl https://api.yourdomain.com/api/settings
```

**Frontend**:
- Truy cập: `https://yourdomain.com`
- Kiểm tra console không có lỗi
- Test đăng nhập/đăng ký

### 3. Update OAuth Callbacks

**Google OAuth**:
1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit OAuth Client ID
4. Update **Authorized redirect URIs**:
   ```
   https://api.yourdomain.com/api/auth/google/callback
   ```

**Facebook OAuth**:
1. Vào [Facebook Developers](https://developers.facebook.com)
2. Settings → Basic
3. Add **Valid OAuth Redirect URIs**:
   ```
   https://api.yourdomain.com/api/auth/facebook/callback
   ```

### 4. Create Admin User

```bash
# SSH vào backend server
cd apps/backend

# Chạy script tạo admin (hoặc dùng Prisma Studio)
npx prisma studio

# Hoặc tạo user qua API (nếu có endpoint)
# Hoặc dùng database client để insert trực tiếp
```

**SQL để tạo admin**:
```sql
-- Hash password: "admin123" với bcrypt
-- (Cần hash trước, hoặc dùng script)
INSERT INTO "User" (id, email, username, password, "displayName", role, "emailVerified", "isActive", "createdAt", "updatedAt")
VALUES (
  'admin-id',
  'admin@yourdomain.com',
  'admin',
  '$2b$10$hashed_password_here',
  'Admin',
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
);
```

---

## 📊 Monitoring & Maintenance

### 1. Error Tracking

**Sentry (Recommended)**:

1. **Tạo tài khoản**: [Sentry](https://sentry.io)
2. **Tạo project** (Node.js cho backend, React cho frontend)
3. **Install SDK**:

```bash
# Backend
cd apps/backend
npm install @sentry/node @sentry/profiling-node
```

```typescript
// apps/backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

```bash
# Frontend
cd apps/frontend
npm install @sentry/nextjs
```

```bash
# Setup Sentry
npx @sentry/wizard@latest -i nextjs
```

### 2. Uptime Monitoring

- **UptimeRobot** (Free): [UptimeRobot](https://uptimerobot.com)
- **Pingdom**: Monitor API và Frontend endpoints

### 3. Log Management

**Backend logs** (đã có Winston):
- Logs được lưu trong `apps/backend/logs/`
- Monitor: `error.log`, `combined.log`

**VPS**:
```bash
# Xem PM2 logs
pm2 logs web-truyen-backend
pm2 logs web-truyen-frontend

# Xem Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 4. Database Backups

**Neon/Supabase**: Tự động backup (check dashboard)

**Self-hosted**:
```bash
# Create backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

---

## 🔧 Troubleshooting

### Backend không start

```bash
# Check logs
pm2 logs web-truyen-backend

# Check environment variables
pm2 env web-truyen-backend

# Restart
pm2 restart web-truyen-backend
```

### Database connection error

1. **Kiểm tra DATABASE_URL**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Kiểm tra firewall**: Database phải allow connection từ server IP

### Frontend không load

1. **Check build**:
   ```bash
   cd apps/frontend
   npm run build
   ```

2. **Check environment variables**:
   ```bash
   # Vercel/Netlify: Check dashboard
   # VPS: Check .env.local
   ```

3. **Check console errors**: Browser DevTools → Console

### OAuth không hoạt động

1. **Kiểm tra callback URLs**: Phải match chính xác
2. **Kiểm tra environment variables**: `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`
3. **Check logs**: Backend logs sẽ show error

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Domain đã mua và cấu hình DNS
- [ ] Database đã setup (Neon/Supabase/Self-hosted)
- [ ] Cloudinary account đã tạo
- [ ] OAuth apps đã tạo (Google, Facebook)
- [ ] Environment variables đã chuẩn bị
- [ ] Code đã push lên GitHub

### Deployment
- [ ] Backend đã deploy (Railway/Render/VPS)
- [ ] Frontend đã deploy (Vercel/Netlify/VPS)
- [ ] Database migrations đã chạy
- [ ] SSL certificates đã setup
- [ ] OAuth callbacks đã update

### Post-Deployment
- [ ] Test đăng nhập/đăng ký
- [ ] Test OAuth (Google, Facebook)
- [ ] Test API endpoints
- [ ] Test admin panel
- [ ] Setup monitoring (Sentry)
- [ ] Setup backups
- [ ] Create admin user

---

## 📚 Tài liệu tham khảo

- [NestJS Deployment](https://docs.nestjs.com/recipes/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)

---

## 🆘 Cần hỗ trợ?

Nếu gặp vấn đề trong quá trình deploy:
1. Check logs (backend và frontend)
2. Verify environment variables
3. Check database connection
4. Verify DNS và SSL
5. Review error messages trong console/logs

**Good luck với deployment! 🚀**
