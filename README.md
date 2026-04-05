# SocialConnect-Web-Application
# SocialConnect ✦

A premium, full-featured social networking platform built with **Next.js 14**, **TypeScript**, and **Supabase**. SocialConnect is designed with the **Amber Noir** design system—a sophisticated, dark-themed aesthetic prioritizing high-end typography and smooth transitions.

---

## ✨ Features

- 🔐 **Secure Authentication** — Enterprise-grade Auth (Supabase) with registration, login, and protected routes.
- 🚀 **Optimized Feed** — A dual-mode chronological feed:
    - **Community Feed**: Discover all active posts from across the platform.
    - **Following Feed**: A prioritized view focusing on the users you follow.
- 📸 **Rich Media Posts** — Create engaging content with multi-line text and high-resolution images (powered by Supabase Storage).
- ❤️ **Real-time Interactions** — Optimistic UI updates for likes and nested comment threads.
- 👤 **Dynamic Profiles** — Comprehensive user profiles with stats, bios, location, and customizable avatars.
- 👥 **High-Fidelity Following** — Atomically updated social graphs (Follow/Unfollow) with dedicated People discovery pages.
- 🌀 **Luma-style Loading** — Custom signature loading animations and glassmorphic skeleton states for a seamless UX.

---

## 🎨 Design System: Amber Noir

SocialConnect follows the **Amber Noir** specification, focusing on:
- **Typography:** *Playfair Display* (Serif) for headings and *DM Sans* (Sans-serif) for body text.
- **Palette:** A deep obsidian base (`#0D0C0A`) with vibrant Amber accents (`#EF9F27`) and muted gold secondary tones.
- **Glassmorphism:** Subtle background blurs and border-glow effects on cards and dialogs.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.2.3 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Custom CSS Variables |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (JWT) |
| **Storage** | Supabase Storage (S3-compatible) |
| **Components** | Radix UI + Lucide Icons |

---

## 🚀 Setup & Installation

### 1. Repository Setup
```bash
git clone <repo-url>
cd socialconnect
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database & Storage Initialization
1. **Tables & RLS:** Run the contents of [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase SQL Editor.
2. **RPC Functions:** Run [`supabase/phase3_migration.sql`](./supabase/phase3_migration.sql) to enable atomic social counters.
3. **Storage Buckets:** Create two **Public** buckets: `post-images` and `avatars`.

### 4. Local Development
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🏗️ Architecture

- **Server-Side Rendered (SSR):** Leveraging Next.js Server Components for secure data fetching.
- **Atomic Counters:** Uses PostgreSQL RPC (Remote Procedure Calls) to ensure like/follow counts remain accurate under high concurrency.
- **Storage Management:** Automatic image renaming and path-based partitioning (`userId/timestamp-filename`) for optimized delivery.
- **RLS (Row Level Security):** Fine-grained database access control ensuring users only modify their own content.

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── (auth)/          # Authentication flows (Login/Register)
│   ├── (main)/          # Main App shell (Feed, People, Profile)
│   └── api/             # Edge-compatible API routes
├── components/
│   ├── layout/          # Global navigation & Sidebar
│   ├── posts/           # Post cards, comments, & creation dialogs
│   ├── profile/         # Profile management & follow systems
│   └── ui/              # Radix-base building blocks
├── lib/
│   └── supabase/        # Typed Supabase clients (Server/Browser/Admin)
└── supabase/            # Database migrations & SQL schema
```

---

*Built with passion by the SocialConnect Team.*
