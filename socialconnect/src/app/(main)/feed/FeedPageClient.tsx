'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, PenSquare } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import NewPostDialog from '@/components/posts/NewPostDialog'

interface Author {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Post {
  id: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
  created_at: string
  author_id: string
  profiles: Author
  is_liked_by_me: boolean
}

interface FeedPageClientProps {
  initialPosts: Post[]
  initialHasMore: boolean
  currentUserId: string
  profile: Author | null
}

export default function FeedPageClient({
  initialPosts,
  initialHasMore,
  currentUserId,
  profile,
}: FeedPageClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setError(null)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/feed?page=${nextPage}&limit=10`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Load failed')
      setPosts((prev) => [...prev, ...(json.posts ?? [])])
      setHasMore(json.pagination.hasMore)
      setPage(nextPage)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page])

  function handlePostCreated(newPost: Post) {
    setPosts((prev) => [{ ...newPost, is_liked_by_me: false }, ...prev])
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="main-content">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="t-h1">Your Feed</h1>
        <NewPostDialog
          currentUserId={currentUserId}
          profile={profile}
          onPostCreated={handlePostCreated}
          trigger={
            <button id="open-new-post-dialog" className="btn btn--primary btn--sm">
              <PenSquare size={15} />
              New Post
            </button>
          }
        />
      </div>

      {/* Compose bar (also opens the dialog) */}
      <NewPostDialog
        currentUserId={currentUserId}
        profile={profile}
        onPostCreated={handlePostCreated}
        trigger={
          <button
            className="compose-bar"
            style={{ width: '100%', textAlign: 'left', background: 'var(--surface-raised)', cursor: 'pointer' }}
          >
            <div className="avatar--initials avatar--sm">{initials}</div>
            <span className="compose-bar__prompt" style={{ pointerEvents: 'none' }}>
              What&apos;s on your mind?
            </span>
          </button>
        }
      />

      {/* Feed */}
      <div className="feed-column" style={{ marginTop: 20 }}>
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">✨</div>
            <p className="empty-state__title">Nothing here yet</p>
            <p className="empty-state__desc">Be the first to post something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={handlePostDeleted}
            />
          ))
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <button
              id="load-more-posts"
              className="btn--secondary"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                  Loading…
                </>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}

        {error && (
          <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
