# FamilyFast - Full-Stack BRAID Architecture

## Overview

FamilyFast is a family social platform for sharing health data, milestones, challenges, recipes, strategies and results, discussion feeds, and more.

This document defines our complete BRAID architecture, connecting frontend and backend through unified naming conventions, shared types, and coordinated strands.

---

## Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | Svelte + SvelteKit + TailwindCSS | GitHub Pages |
| Backend | Node.js + Express + TypeScript | Render (free tier) |
| Database | PostgreSQL | Render (free tier) |
| Auth | JWT + Passport.js (Google OAuth) | - |
| ORM | Prisma | - |

---

## Core Braids (Development Order)

### Phase 1: Foundation (MVP)

| # | Braid | Purpose | Priority | Status |
|---|-------|---------|----------|--------|
| 1 | **core** | Shared types, API contracts, utilities | Critical | ✅ Complete |
| 2 | **auth** | Authentication, sessions, users | Critical | ✅ Complete |
| 3 | **family** | Family groups, invitations, members | Critical | ✅ Complete |

### Phase 2: Engagement

| # | Braid | Purpose | Priority | Status |
|---|-------|---------|----------|--------|
| 4 | **feeds** | Posts, comments, reactions | High | ✅ Complete |
| 5 | **milestones** | Birthdays, achievements, reminders | High | ✅ Complete |

### Phase 3: Health & Activity

| # | Braid | Purpose | Priority | Status |
|---|-------|---------|----------|--------|
| 6 | **health** | Health metrics tracking & sharing | Medium | ✅ Complete |
| 7 | **challenges** | Family competitions, goals | Medium | ✅ Complete |

### Phase 4: Lifestyle

| # | Braid | Purpose | Priority | Status |
|---|-------|---------|----------|--------|
| 8 | **recipes** | Recipe sharing, meal planning | Medium | Planned |
| 9 | **strategies** | Tips, techniques, life hacks | Low | Planned |

---

## Braid Structure

Each braid follows this unified structure:

```
backend/src/braids/{braid-name}/
├── service.ts              # Business logic
├── routes.ts               # API route handlers
└── types.ts                # Braid-specific types (if needed)

frontend/src/lib/
├── stores/{braid-name}.ts  # Svelte store
└── api/{braid-name}.ts     # API client functions (if needed)

frontend/src/routes/
└── {braid-routes}/         # SvelteKit pages
```

---

## Braid Definitions

### 1. CORE Braid
> Shared foundation for all other braids

**Strands:**
- `types` - Shared TypeScript interfaces
- `api-client` - HTTP client wrapper with auth headers
- `validation` - Zod schemas for forms/API
- `prisma` - Database client singleton

**Files:**
- `backend/src/braids/core/types.ts`
- `backend/src/braids/core/validation.ts`
- `backend/src/braids/core/prisma.ts`
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/types.ts`

---

### 2. AUTH Braid
> User identity and access management

**Strands:**
| Strand | Purpose | Status |
|--------|---------|--------|
| `register` | Email/password signup | ✅ |
| `login` | Email/password authentication | ✅ |
| `logout` | Session termination | ✅ |
| `session` | JWT token management | ✅ |
| `oauth-google` | Google social login | ✅ |
| `password-reset` | Forgot password flow | ✅ |

**Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/google
GET    /api/auth/google/callback
```

**Database Tables:**
- `users` - User accounts
- `sessions` - Active sessions with refresh tokens
- `password_resets` - Password reset tokens

**Frontend Routes:**
- `/login` - Login page
- `/register` - Registration page
- `/auth/callback` - OAuth callback handler

---

### 3. FAMILY Braid
> Family group management

**Strands:**
| Strand | Purpose | Status |
|--------|---------|--------|
| `create` | Create new family group | ✅ |
| `invite` | Generate invite codes/links | ✅ |
| `join` | Accept invitation | ✅ |
| `members` | View/manage family members | ✅ |
| `roles` | Admin/member permissions | ✅ |
| `settings` | Family group settings | ✅ |

**Endpoints:**
```
POST   /api/families              # Create family
GET    /api/families              # List user's families
GET    /api/families/:id          # Get family details
PUT    /api/families/:id          # Update family
DELETE /api/families/:id          # Delete family
POST   /api/families/join         # Join with invite code
GET    /api/families/:id/members  # List members
PUT    /api/families/:id/members/:userId    # Update member role
DELETE /api/families/:id/members/:userId    # Remove member
POST   /api/families/:id/invite/regenerate  # New invite code
```

**Database Tables:**
- `families` - Family groups
- `family_members` - User-family relationships with roles
- `family_invitations` - Email invitations (future)

**Frontend Routes:**
- `/dashboard` - Family list and quick actions
- `/families/[id]` - Family detail page

---

### 4. FEEDS Braid
> Posts, comments, and reactions within families

**Strands:**
| Strand | Purpose | Status |
|--------|---------|--------|
| `posts` | Create, read, update, delete posts | ✅ |
| `comments` | Comment on posts | ✅ |
| `reactions` | Like/react to posts | ✅ |
| `media` | Image/video attachments | Planned |
| `notifications` | Activity notifications | Planned |

**Endpoints:**
```
GET    /api/families/:id/posts      # List family posts
POST   /api/families/:id/posts      # Create post
GET    /api/posts/:id               # Get single post
PATCH  /api/posts/:id               # Update post
DELETE /api/posts/:id               # Delete post
GET    /api/posts/:id/comments      # List comments
POST   /api/posts/:id/comments      # Add comment
DELETE /api/comments/:id            # Delete comment
POST   /api/posts/:id/reactions     # Toggle reaction
```

**Database Tables:**
- `posts` - Family posts with content
- `comments` - Post comments
- `reactions` - User reactions (heart, thumbsup, laugh, wow, sad, celebrate)

**Frontend Routes:**
- Posts displayed on `/families/[id]` family detail page

---

### 5. MILESTONES Braid
> Important dates and achievements

**Strands:**
| Strand | Purpose | Status |
|--------|---------|--------|
| `create` | Add milestones (birthday, anniversary, etc.) | ✅ |
| `list` | View family milestones | ✅ |
| `upcoming` | Cross-family upcoming view | ✅ |
| `recurring` | Yearly recurring events | ✅ |
| `reminders` | Notification scheduling | Planned |

**Endpoints:**
```
GET    /api/families/:id/milestones   # List family milestones
POST   /api/families/:id/milestones   # Create milestone
GET    /api/milestones/:id            # Get milestone
PATCH  /api/milestones/:id            # Update milestone
DELETE /api/milestones/:id            # Delete milestone
GET    /api/milestones/upcoming       # Upcoming across all families
```

**Database Tables:**
- `milestones` - Events with type, date, recurring flag, person name

**Frontend Routes:**
- Milestones displayed on `/families/[id]` sidebar
- Upcoming milestones on `/dashboard`

---

### 6. HEALTH Braid
> Personal health metrics tracking

**Strands:**
| Strand | Purpose | Status |
|--------|---------|--------|
| `weight` | Weight logging and trends | ✅ |
| `food` | Food logging with macros | ✅ |
| `summary` | Daily nutrition summary | ✅ |

**Endpoints:**
```
POST   /api/health/weight             # Log weight
GET    /api/health/weight             # Get weight history
GET    /api/health/weight/trend       # Get weight trend data
DELETE /api/health/weight/:date       # Delete weight log
POST   /api/health/food               # Log food with macros
GET    /api/health/food               # Get food logs
DELETE /api/health/food/:id           # Delete food log
GET    /api/health/food/summary/:date # Daily macro summary
```

**Database Tables:**
- `weight_logs` - Weight entries with date, unit, notes
- `food_logs` - Food entries with description, macros, optional challenge link

---

### 7. CHALLENGES Braid
> Family challenges with fasting support

**Strands:**
| Strand | Purpose | Status |
|--------|---------|--------|
| `create` | Create fasting/exercise/custom challenges | ✅ |
| `join` | Join and leave challenges | ✅ |
| `logs` | Daily check-ins and progress | ✅ |
| `participants` | View participants and leaderboard | ✅ |
| `progress` | Track streaks and completion rates | ✅ |

**Endpoints:**
```
POST   /api/families/:id/challenges          # Create challenge
GET    /api/families/:id/challenges          # List family challenges
GET    /api/challenges/:id                   # Get challenge details
PATCH  /api/challenges/:id                   # Update challenge
DELETE /api/challenges/:id                   # Delete challenge
POST   /api/challenges/:id/join              # Join challenge
POST   /api/challenges/:id/leave             # Leave challenge
GET    /api/challenges/:id/participants      # Get participants + progress
POST   /api/challenges/:id/logs              # Log daily check-in
GET    /api/challenges/:id/logs              # Get logs for challenge
```

**Database Tables:**
- `challenges` - Challenge with type, dates, fasting settings (JSON)
- `challenge_participants` - User-challenge relationships
- `challenge_logs` - Daily check-ins with fasting status

**Fasting Settings Schema:**
```json
{
  "feedingWindowStart": "12:00",
  "feedingWindowEnd": "20:00",
  "fastingHours": 16
}
```

**Frontend Routes:**
- `/families/[id]/challenges` - Challenge list and creation
- `/families/[id]/challenges/[challengeId]` - Challenge detail with logging

---

### 8. RECIPES Braid (Planned)
> Recipe sharing and meal planning

**Strands:**
- `catalog` - Browse and search recipes
- `create` - Add new recipes
- `collections` - Recipe collections/cookbooks
- `meal-plan` - Weekly meal planning

---

## Naming Conventions

### API Endpoints
- Lowercase, kebab-case
- Plural nouns for collections: `/api/families`
- Singular with ID: `/api/families/:id`
- Nested resources: `/api/families/:id/members`

### Database Tables
- Lowercase, snake_case
- Plural: `users`, `families`, `posts`
- Junction tables: `family_members`

### TypeScript Types
- PascalCase: `User`, `Family`, `FamilyMember`
- Request/Response suffixes: `CreateFamilyRequest`, `AuthResponse`

### Svelte Stores
- camelCase: `auth`, `families`, `currentFamily`
- Derived stores: `isAuthenticated`, `familiesList`

### Components
- PascalCase files: `LoginForm.svelte`
- Folder-based routes in SvelteKit

---

## Development Workflow

### Adding a New Feature

1. **Identify the braid** - Does this belong to an existing braid or need a new one?
2. **Plan the strand** - Define endpoints, database changes, UI components
3. **Backend first** - Implement service, routes, validation
4. **Database** - Update Prisma schema, run migrations
5. **Frontend** - Build store, API calls, UI components
6. **Test** - End-to-end testing
7. **Document** - Update this file and relevant STRAND.md

### Creating a New Braid

```bash
# Backend
mkdir -p backend/src/braids/{braid-name}
touch backend/src/braids/{braid-name}/service.ts
touch backend/src/braids/{braid-name}/routes.ts

# Frontend
touch frontend/src/lib/stores/{braid-name}.ts
mkdir -p frontend/src/routes/{braid-routes}
```

---

## Completed Features

### User Flows
- ✅ Homepage with features overview
- ✅ User registration (email/password)
- ✅ User login (email/password)
- ✅ Google OAuth login
- ✅ Password reset flow
- ✅ Dashboard with family list
- ✅ Create new family
- ✅ Join family with invite code
- ✅ View family details and members
- ✅ Family settings (admin only)
- ✅ Leave family
- ✅ Remove family member (admin only)
- ✅ Regenerate invite code
- ✅ Create posts in family feed
- ✅ React to posts (6 reaction types)
- ✅ Comment on posts
- ✅ Delete posts/comments
- ✅ Create milestones (birthdays, anniversaries, achievements)
- ✅ Recurring yearly milestones
- ✅ Upcoming milestones dashboard widget
- ✅ Create fasting challenges (16:8, 18:6, 20:4, OMAD presets)
- ✅ Join/leave family challenges
- ✅ Daily challenge check-ins with fasting status
- ✅ Challenge progress calendar
- ✅ Challenge leaderboard with participant rankings
- ✅ Personal weight tracking with trends
- ✅ Food logging with macro tracking
- ✅ Real-time feeding/fasting window indicator
- ✅ Daily nutrition summary

### Technical Features
- ✅ JWT authentication with refresh tokens
- ✅ Automatic token refresh
- ✅ Protected routes
- ✅ Role-based permissions (admin/member)
- ✅ Form validation (Zod)
- ✅ Responsive design (TailwindCSS)
- ✅ GitHub Pages deployment workflow
- ✅ Render deployment configuration
- ✅ Paginated feeds with "load more"
- ✅ Relative time formatting

---

*Last updated: January 2026*
