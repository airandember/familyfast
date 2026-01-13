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
| 4 | **feeds** | Posts, comments, reactions | High | Planned |
| 5 | **milestones** | Birthdays, achievements, reminders | High | Planned |

### Phase 3: Health & Activity

| # | Braid | Purpose | Priority | Status |
|---|-------|---------|----------|--------|
| 6 | **health** | Health metrics tracking & sharing | Medium | Planned |
| 7 | **challenges** | Family competitions, goals | Medium | Planned |

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

### 4. FEEDS Braid (Planned)
> Posts, comments, and reactions within families

**Strands:**
- `posts` - Create, read, update, delete posts
- `comments` - Comment on posts
- `reactions` - Like/react to posts
- `media` - Image/video attachments
- `notifications` - Activity notifications

**Planned Endpoints:**
```
GET    /api/families/:id/posts
POST   /api/families/:id/posts
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/comments
POST   /api/posts/:id/reactions
```

**Planned Tables:**
- `posts`
- `comments`
- `reactions`

---

### 5. MILESTONES Braid (Planned)
> Important dates and achievements

**Strands:**
- `birthdays` - Birthday tracking and reminders
- `anniversaries` - Anniversary dates
- `achievements` - Custom milestones
- `reminders` - Notification scheduling

**Planned Endpoints:**
```
GET    /api/families/:id/milestones
POST   /api/families/:id/milestones
PUT    /api/milestones/:id
DELETE /api/milestones/:id
GET    /api/milestones/upcoming
```

---

### 6. HEALTH Braid (Planned)
> Health metrics tracking and sharing

**Strands:**
- `metrics` - Weight, steps, sleep, etc.
- `goals` - Personal health goals
- `sharing` - Share with family members
- `history` - Historical data and trends

---

### 7. CHALLENGES Braid (Planned)
> Family competitions and goals

**Strands:**
- `create` - Create challenges
- `join` - Join challenges
- `progress` - Track progress
- `leaderboard` - Rankings
- `rewards` - Challenge completion rewards

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

### Technical Features
- ✅ JWT authentication with refresh tokens
- ✅ Automatic token refresh
- ✅ Protected routes
- ✅ Role-based permissions (admin/member)
- ✅ Form validation (Zod)
- ✅ Responsive design (TailwindCSS)
- ✅ GitHub Pages deployment workflow
- ✅ Render deployment configuration

---

*Last updated: January 2026*
