# SchedulAI — AI Message Scheduler

A full-stack application that lets you schedule messages to any platform with AI-powered content generation. Messages are sent automatically at the specified time using a background cron job.

---

## ✨ Features

- **JWT Authentication** — Signup, login, protected routes
- **Dashboard** — Stats overview, upcoming messages, recent activity
- **Message Scheduler** — Schedule to Email, SMS, WhatsApp, Slack, Telegram, Twitter
- **AI Generator** — OpenAI-powered message generation from a short prompt
- **Auto Delivery** — node-cron polls every minute, dispatches due messages
- **Notifications** — Email confirmation after delivery or failure
- **History & Analytics** — Delivery rate, platform breakdown, full audit trail
- **Retry Logic** — Up to 3 automatic retries before marking failed

---

## 📁 Folder Structure

```
ai-message-scheduler/
│
├── backend/                        # Node.js + Express API
│   ├── config/
│   │   └── database.js             # Mongoose connection
│   ├── controllers/
│   │   ├── authController.js       # Signup, login, profile
│   │   ├── messageController.js    # CRUD for scheduled messages
│   │   ├── historyController.js    # Delivery history + analytics
│   │   └── aiController.js        # OpenAI message generation
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect middleware + token generator
│   │   └── validation.js          # express-validator rules
│   ├── models/
│   │   ├── User.js                 # User schema (bcrypt, safe methods)
│   │   └── ScheduledMessage.js    # Message schema + status lifecycle
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── historyRoutes.js
│   │   └── aiRoutes.js
│   ├── services/
│   │   ├── emailService.js         # Nodemailer send + notification emails
│   │   └── schedulerService.js    # node-cron job + dispatch logic
│   ├── utils/
│   │   └── logger.js               # Winston logger
│   ├── .env                        # Environment variables (edit this)
│   ├── .env.example                # Template
│   ├── package.json
│   └── server.js                   # Entry point
│
├── frontend/                       # React + Tailwind CSS
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── AppLayout.jsx   # Sidebar + shell layout
│   │   │       ├── StatusBadge.jsx # Colored status chip
│   │   │       └── PlatformIcon.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Auth state + actions (React Context)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── SchedulePage.jsx    # Create/edit message + AI generator
│   │   │   ├── HistoryPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + all API calls
│   │   ├── App.jsx                 # Router + protected routes
│   │   ├── index.js
│   │   └── index.css               # Tailwind + custom CSS variables
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |
| MongoDB | ≥ 6.0 (local or Atlas) |

---

## 🚀 Setup — Step by Step

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/ai-message-scheduler.git
cd ai-message-scheduler
```

### Step 2 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
MONGODB_URI=mongodb://localhost:27017/ai-message-scheduler
JWT_SECRET=your_super_secret_random_string_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
OPENAI_API_KEY=sk-your_openai_key
```

**Getting a Gmail App Password:**
1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords → generate one for "Mail"
4. Use that 16-character password as `EMAIL_PASS`

**Getting an OpenAI key:**
- Visit https://platform.openai.com/api-keys

### Step 3 — Install backend dependencies

```bash
# Inside /backend
npm install
```

### Step 4 — Start MongoDB

```bash
# If running MongoDB locally:
mongod

# Or use MongoDB Atlas (cloud) — just paste the connection string in .env
```

### Step 5 — Start the backend server

```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

The API will be running at: **http://localhost:5000**

You should see:
```
🚀 Server running on port 5000 in development mode
✅ MongoDB connected: localhost
⏰ Message scheduler initialized
✅ Cron scheduler started — polling every minute
```

### Step 6 — Install frontend dependencies

```bash
# Open a new terminal tab
cd ../frontend
npm install
```

### Step 7 — Start the frontend

```bash
npm start
```

The app will open at: **http://localhost:3000**

The `"proxy": "http://localhost:5000"` in `frontend/package.json` routes all `/api/*` calls to your backend automatically during development.

---

## 🔌 REST API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PATCH | `/api/auth/profile` | ✅ | Update name, timezone, notifications |
| PATCH | `/api/auth/change-password` | ✅ | Change password |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages` | ✅ | List messages (filter, paginate) |
| GET | `/api/messages/stats` | ✅ | Dashboard stats + upcoming |
| GET | `/api/messages/:id` | ✅ | Get single message |
| POST | `/api/messages` | ✅ | Create scheduled message |
| PUT | `/api/messages/:id` | ✅ | Update message (scheduled only) |
| DELETE | `/api/messages/:id` | ✅ | Delete message |
| PATCH | `/api/messages/:id/cancel` | ✅ | Cancel without deleting |

### History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history` | ✅ | Sent/failed/cancelled history |
| GET | `/api/history/analytics` | ✅ | Delivery rate + platform stats |

### AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/generate` | ✅ | Generate message from prompt |
| GET | `/api/ai/suggestions` | ✅ | Example prompt suggestions |

**Example: Schedule a message**
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": { "name": "John", "contact": "john@example.com" },
    "subject": "Happy Birthday!",
    "content": "Wishing you a wonderful birthday, John!",
    "scheduledAt": "2026-06-01T09:00:00.000Z",
    "timezone": "America/New_York",
    "platform": "email"
  }'
```

**Example: Generate with AI**
```bash
curl -X POST http://localhost:5000/api/ai/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Birthday wish for my best friend turning 30",
    "platform": "email"
  }'
```

---

## 🏗️ Architecture Notes

### How the scheduler works

Every minute, `node-cron` fires `processDueMessages()` which:
1. Queries MongoDB for `{ status: 'scheduled', scheduledAt: { $lte: now } }`
2. Calls `dispatchMessage()` per platform
3. On success → sets `status: 'sent'`, sends notification email
4. On failure → increments `retryCount`, reschedules +5 min (up to 3 retries), then marks `failed`

### Adding a real SMS/WhatsApp integration

Open `backend/services/schedulerService.js` and replace the stub handlers:

```js
case 'sms': {
  // Example with Twilio
  const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
  const msg = await client.messages.create({
    body: content,
    from: '+1XXXXXXXXXX',
    to: recipient.contact,
  });
  return { success: true, deliveryId: msg.sid };
}
```

### JWT flow

1. Client sends `POST /api/auth/login` → server returns `{ token, user }`
2. Client stores token in `localStorage`
3. Axios interceptor attaches `Authorization: Bearer <token>` on every request
4. `protect` middleware verifies the token and attaches `req.user`

---

## 🌍 Production Deployment

### Environment changes

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scheduler
JWT_SECRET=<64+ char random string>
CLIENT_URL=https://your-frontend-domain.com
```

### Build the frontend

```bash
cd frontend
npm run build
# Serve the /build folder from your CDN or static host (Vercel, Netlify, S3)
```

### Deploy the backend

```bash
cd backend
npm start
# Recommended: use PM2 for process management
npm install -g pm2
pm2 start server.js --name schedulai-api
pm2 save
```

### Recommended stack
- **Backend**: Railway, Render, or a VPS (DigitalOcean, Hetzner)
- **Frontend**: Vercel or Netlify
- **Database**: MongoDB Atlas (free tier works great)

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT with expiry
- [x] Rate limiting on all API routes (100/15min) and stricter on auth (20/15min)
- [x] Helmet.js for HTTP security headers
- [x] Request body size limited to 10kb
- [x] Input validation on all endpoints (express-validator)
- [x] Passwords never returned in API responses (`select: false`)
- [x] CORS locked to `CLIENT_URL`
- [ ] Add HTTPS in production (TLS via your host or Nginx)
- [ ] Rotate `JWT_SECRET` periodically

---

## 📝 License

MIT
