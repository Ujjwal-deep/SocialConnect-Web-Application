# SocialConnect

A full-featured social networking application built with **Next.js 14**, **TypeScript**, **Supabase**, and the **Amber Noir** design system.

---

## Features

- 🔐 **Authentication** — Register & login with email or username
- 📝 **Posts** — Create text & image posts (soft-delete on remove)
- 🤙 **Feed** — Paginated, chronological feed. Prioritises posts from followed users when you follow anyone
- ❤️ **Likes** — Toggle likes with optimistic UI updates
- 💬 **Comments** — Nested comment thread per post
- 👤 **User Profiles** — Full profile pages with stats (posts, followers, following)
- ✏️ **Edit Profile** — Update name, bio (160 char), website, location, and avatar
- 📸 **Avatar Upload** — JPEG / PNG, max 2 MB, stored in Supabase Storage
- 👥 **Follow / Unfollow** — Follow other users, counts updated atomically
- 🔍 **People Page** — Browse & search users, follow directly from the list

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.3 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS (Amber Noir design system) |
| UI Components | shadcn/ui + Radix UI |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Forms | react-hook-form + Zod |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd socialconnect
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the root of the `socialconnect` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Never commit `.env.local` to version control.**

### 3. Set up the database

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**
2. Run `supabase/schema.sql` (base schema — tables, RLS, storage buckets)
3. Run `supabase/phase3_migration.sql` (adds RPC functions for follow counts)

### 4. Configure Supabase Storage

Ensure both storage buckets are **public** in your Supabase dashboard:
- `post-images` — for post images
- `avatars` — for user avatars

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

---

## Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, for admin operations) |

> The service role key is used **only** on the server (API routes) to bypass RLS for atomic counter updates (like_count, comment_count, follower_count, following_count) — it is never exposed to the browser.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (main)/          # Protected pages: feed, profile, people, posts
│   └── api/             # API routes
│       ├── auth/        # login, logout, register
│       ├── feed/        # GET feed
│       ├── posts/       # CRUD posts, likes, comments
│       └── users/       # Users list, profile, follow, followers, following
├── components/
│   ├── layout/          # Sidebar
│   ├── posts/           # PostCard, NewPostDialog, CommentList
│   ├── profile/         # FollowButton, EditProfileDialog
│   └── ui/              # shadcn/ui base components
└── lib/
    └── supabase/        # server, client, middleware, admin clients
```
