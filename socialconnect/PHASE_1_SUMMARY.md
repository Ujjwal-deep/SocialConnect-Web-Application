# Phase 1 Summary — SocialConnect [Handover]

**Project Name:** SocialConnect  
**Tech Stack:** Next.js 14.2.3 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth (@supabase/ssr).  
**Design System:** "Amber Noir" (Dark editorial noir with warm amber accents).

---

## 1. Project Core Configuration
- **Next.js Version:** Pinned to `14.2.3` to avoid compatibility issues with ESLint 8.
- **Dependencies:** `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `zod`, `react-hook-form`, `@hookform/resolvers`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `@radix-ui/react-slot`, `@radix-ui/react-label`.
- **Environment Variables:** Located in `./socialconnect/.env.local`. Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 2. Design System: Amber Noir
The design follows `design-system.html` exactly. Core variables are defined in:
- `tailwind.config.ts`: Custom colors (`surface`, `amber`, `text`, `accent`), fonts (`Playfair Display`, `DM Sans`), and radii.
- `src/app/globals.css`: Full CSS variable implementation and utility classes (`.card--auth`, `.btn--primary`, `.t-h1`, etc.).
- **Fix Applied:** The standard browser focus outline has been replaced with a custom amber ring (`#EF9F27` at 12% opacity).

---

## 3. Database & Auth Setup
- **Supabase Schema:** Defined in `/supabase/schema.sql`. Includes `profiles`, `posts`, `likes`, `comments`, and `follows`.
- **Auth Clients (`src/lib/supabase/`):**
    - `client.ts`: Browser client for Client Components.
    - `server.ts`: Server client for Server Components and API Routes.
    - `middleware.ts`: Middleware client for session refreshing.
- **Trigger:** A DB trigger `on_auth_user_created` exists to create profiles automatically, but the register API includes a **manual fallback insert** if the trigger hasn't been enabled in the dashboard.

---

## 4. Middleware & Route Protection
- **File:** `src/middleware.ts`
- **Logic:**
    - Routes under `/(main)` are **protected** (redirects to `/login` if no session).
    - Routes under `/(auth)` are **public** (redirects to `/feed` if a session already exists).
    - Root path `/` redirects to `/feed` if logged in, otherwise `/login`.

---

## 5. API Routes (`src/app/api/`)
- `POST /api/auth/register`: Zod-validated. Checks username uniqueness. Registers user + creates profile.
- `POST /api/auth/login`: Supports both **Email** and **Username** login. Updates `last_login`.
- `POST /api/auth/logout`: Clears session and cookies.
- **Errors:** All API routes return `{ error: string, status: number }` consistent with the specification.

---

## 6. UI Implementation
- **Layouts:** `src/app/(main)/layout.tsx` is a persistent shell.
- **Pages:**
    - `/login`: Auth card centered with Amber Noir styling. Live email validation on `onChange`.
    - `/register`: Five-field registration form with live validation.
    - `/feed`: Protected route placeholder.
    - `/profile/[user_id]`: Protected route placeholder displaying initials avatar and profile info.

---

## 7. Known Fixes & Overrides
- **Custom Input (`src/components/ui/input.tsx`):** The default shadcn/base-ui component was replaced with a native input using Amber Noir CSS to remove the blue focus outline and integrate better with the theme.
- **Validation:** Forms use `mode: 'onBlur'` as default, with a custom **500ms debounce** on the email/login fields for a smoother typing experience without immediate error "shouting".

