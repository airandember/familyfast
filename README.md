# FamilyFast

A family social platform for sharing health data, milestones, challenges, recipes, strategies and results, discussion feeds, and more.

## Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | Svelte + SvelteKit + TailwindCSS | GitHub Pages |
| Backend | Node.js + Express + TypeScript | Render (free tier) |
| Database | PostgreSQL | Render (free tier) |
| Auth | JWT + Passport.js (Google OAuth) | - |
| ORM | Prisma | - |

## Project Structure

```
familyfast/
├── _BRAID/                    # BRAID methodology documentation
├── frontend/                  # Svelte SPA
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api/          # API client
│   │   │   ├── stores/       # Svelte stores
│   │   │   └── types.ts      # TypeScript types
│   │   └── routes/           # SvelteKit pages
│   └── static/               # Static assets
│
├── backend/                   # Express API
│   ├── src/
│   │   ├── braids/
│   │   │   ├── core/         # Shared utilities, types, validation
│   │   │   ├── auth/         # Authentication braid
│   │   │   └── family/       # Family management braid
│   │   └── middleware/       # Express middleware
│   └── prisma/               # Database schema
│
└── .github/workflows/        # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or use Render's free PostgreSQL)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp env.example.txt .env
# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Backend (`.env`):
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

## Deployment

### Frontend (GitHub Pages)

1. Push to `main` branch
2. GitHub Actions automatically builds and deploys
3. Set `VITE_API_URL` in repository variables

### Backend (Render)

1. Connect your GitHub repository to Render
2. Use `render.yaml` blueprint or manual setup
3. Configure environment variables in Render dashboard

## BRAID Architecture

This project follows the BRAID methodology for organized, modular development.

### Current Braids

| Braid | Status | Description |
|-------|--------|-------------|
| **core** | ✅ | Shared types, API client, validation |
| **auth** | ✅ | User authentication (email + Google OAuth) |
| **family** | ✅ | Family groups, invitations, members |

### Future Braids

| Braid | Description |
|-------|-------------|
| **feeds** | Posts, comments, likes within family |
| **milestones** | Birthday reminders, achievements |
| **health** | Health metrics tracking & sharing |
| **challenges** | Family competitions |
| **recipes** | Recipe sharing and meal planning |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Initiate Google OAuth
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Families
- `GET /api/families` - List user's families
- `POST /api/families` - Create new family
- `GET /api/families/:id` - Get family details
- `PUT /api/families/:id` - Update family
- `DELETE /api/families/:id` - Delete family
- `POST /api/families/join` - Join family with invite code
- `GET /api/families/:id/members` - List family members
- `DELETE /api/families/:id/members/:userId` - Remove member

## License

MIT
