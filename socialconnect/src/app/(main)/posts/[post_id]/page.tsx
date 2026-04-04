import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import CommentList from '@/components/posts/CommentList'

export async function generateMetadata({ params }: { params: { post_id: string } }) {
  return {
    title: 'Post — SocialConnect',
    description: 'View post and comments on SocialConnect',
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PostDetailPage({
  params,
}: {
  params: { post_id: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id, content, image_url, like_count, comment_count, created_at, author_id, is_active,
      profiles:author_id ( id, username, first_name, last_name, avatar_url )
    `)
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (error || !post) return notFound()

  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const initials = `${author.first_name[0] ?? ''}${author.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="main-content">
      {/* Back link */}
      <Link
        href="/feed"
        className="post-action-btn"
        style={{ marginBottom: 20, display: 'inline-flex', textDecoration: 'none' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Feed</span>
      </Link>

      {/* Post */}
      <article className="post-card" style={{ marginBottom: 32 }}>
        <div className="post-card__header">
          <Link href={`/profile/${author.id}`}>
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={`${author.first_name} ${author.last_name}`}
                width={40}
                height={40}
                className="avatar avatar--md"
              />
            ) : (
              <div className="avatar--initials avatar--md">{initials}</div>
            )}
          </Link>

          <div className="post-card__author-info">
            <Link href={`/profile/${author.id}`} className="post-card__author-name">
              {author.first_name} {author.last_name}
            </Link>
            <div className="post-card__meta">
              <span>@{author.username}</span>
              <span>·</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        <p className="post-card__content" style={{ fontSize: '1.0625rem', lineHeight: 1.75 }}>
          {post.content}
        </p>

        {post.image_url && (
          <Image
            src={post.image_url}
            alt="Post image"
            width={640}
            height={400}
            className="post-card__image"
            style={{ height: 'auto', maxHeight: 500 }}
          />
        )}

        <div className="post-card__actions">
          <span className="t-sm" style={{ color: 'var(--text-muted)' }}>
            {post.like_count ?? 0} likes · {post.comment_count ?? 0} comments
          </span>
        </div>
      </article>

      {/* Comments */}
      {userId ? (
        <CommentList
          postId={post.id}
          currentUserId={userId}
          initialCommentCount={post.comment_count ?? 0}
        />
      ) : (
        <p className="t-sm" style={{ color: 'var(--text-muted)' }}>
          <Link href="/login" style={{ color: 'var(--accent-color)' }}>Sign in</Link> to read and leave comments.
        </p>
      )}
    </div>
  )
}
