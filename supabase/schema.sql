-- =============================================================================
-- SOCIALCONNECT — MINIMAL SUPABASE SCHEMA
-- Internship assessment. Covers all required features across Phase 1, 2, 3.
-- Run in Supabase SQL Editor.
-- =============================================================================


-- =============================================================================
-- 1. PROFILES
-- =============================================================================

CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    username        TEXT NOT NULL UNIQUE,
    first_name      TEXT NOT NULL DEFAULT '',
    last_name       TEXT NOT NULL DEFAULT '',
    bio             TEXT,
    avatar_url      TEXT,
    website         TEXT,
    location        TEXT,
    posts_count     INTEGER NOT NULL DEFAULT 0,
    follower_count  INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 2. POSTS
-- =============================================================================

CREATE TABLE public.posts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    image_url     TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    like_count    INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 3. LIKES
-- =============================================================================

CREATE TABLE public.likes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id    UUID NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, post_id)
);


-- =============================================================================
-- 4. COMMENTS
-- =============================================================================

CREATE TABLE public.comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 5. FOLLOWS
-- =============================================================================

CREATE TABLE public.follows (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);


-- =============================================================================
-- 6. AUTO-CREATE PROFILE ON SIGN-UP
--    So the register API route just calls supabase.auth.signUp() and this
--    trigger handles the profiles insert automatically.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username',   split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name',  '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 7. RLS — keep it simple, just enough to not be wide open
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows  ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_read"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: public read, authenticated write, own delete/update
CREATE POLICY "posts_read"   ON public.posts FOR SELECT USING (is_active = true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Likes
CREATE POLICY "likes_read"   ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_read"   ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- Follows
CREATE POLICY "follows_read"   ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- =============================================================================
-- 8. STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
    ('post-images', 'post-images', true),
    ('avatars',     'avatars',     true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view, authenticated users can upload
CREATE POLICY "post_images_read"   ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "post_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
