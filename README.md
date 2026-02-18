# SkillSwap

A full-stack peer-to-peer skill exchange platform where students can offer skills they know and request skills they want to learn — no money involved, just mutual learning.

---

## Tech Stack

### Frontend
- **Angular 17** (standalone components, signals)
- **Tailwind CSS** — utility-first styling
- **RxJS** — reactive data streams
- **TypeScript**

### Backend
- **Node.js + Express** — REST API
- **MongoDB Atlas + Mongoose** — database & ODM
- **JWT** — authentication
- **Passport.js + Google OAuth 2.0** — social login
- **Multer** — avatar/file uploads
- **Winston** — structured logging
- **Helmet + CORS + Rate Limiting** — security

---

## Features

- **Auth** — register, login, Google OAuth, JWT-based sessions
- **Skills** — add skills you teach or want to learn, browse by category
- **Swap Requests** — propose, accept, reject skill swaps with other users
- **Dashboard** — pending requests, active swaps, recommended users, activity feed
- **Sessions** — schedule and manage learning sessions
- **Messages** — in-app messaging between swap partners
- **Reviews** — leave ratings after completed swaps
- **Notifications** — real-time notification bell with unread badge
- **Profile** — avatar upload, bio, university, skill management

---

## Project Structure

```
SkillSwap/
├── backend/              # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js        # Entry point
│   │   ├── config/       # DB, env, logger, passport
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, validation, upload, error
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   └── utils/        # Notifications helper
│   ├── uploads/          # Uploaded avatars
│   └── .env.example      # Environment variable template
│
└── skillswap/            # Angular 17 frontend
    └── src/
        └── app/
            ├── core/     # Guards, interceptors, models, services
            ├── features/ # Pages (dashboard, auth, skills, swaps…)
            └── shared/   # Reusable components (sidebar, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB Atlas account (or local MongoDB)

---

### 1. Clone the repo

```bash
git clone https://github.com/Diya-patel111/SkillSwap.git
cd SkillSwap
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Fill in the required values in `.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:4200
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Start the backend:

```bash
npm run dev
```

The API will be running at `http://localhost:3000`

---

### 3. Frontend Setup

```bash
cd skillswap
npm install
ng serve
```

The app will be running at `http://localhost:4200`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/users` | Browse users by skill/category |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |
| GET | `/api/skills` | List all skills |
| POST | `/api/swaps` | Send a swap request |
| PUT | `/api/swaps/:id/accept` | Accept a swap request |
| PUT | `/api/swaps/:id/reject` | Reject a swap request |
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/sessions` | Schedule a session |
| POST | `/api/reviews` | Submit a review |

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables.

---

## License

MIT
