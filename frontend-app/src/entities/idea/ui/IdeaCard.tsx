import { type FormEvent, useState } from 'react'

import { type User } from '../../user'
import { CommentIcon, HeartIcon } from '../../../shared/ui/Icons'
import { type Idea, type IdeaComment } from '../model/types'

type IdeaCardProps = {
  idea: Idea
  currentUser: User | null
  onRequireAuth: () => void
  onToggleLike: (idea: Idea) => Promise<void>
  onLoadComments: (ideaId: string) => Promise<IdeaComment[]>
  onCreateComment: (ideaId: string, text: string) => Promise<IdeaComment>
}

function getAuthorName(author: IdeaComment['author']) {
  return typeof author === 'object' ? author.username : String(author)
}

function formatCommentDate(date: string) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function IdeaCard({
  idea,
  currentUser,
  onRequireAuth,
  onToggleLike,
  onLoadComments,
  onCreateComment,
}: IdeaCardProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [comments, setComments] = useState<IdeaComment[]>([])
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [isLikePending, setIsLikePending] = useState(false)
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)

  const loadComments = async () => {
    setIsCommentsLoading(true)
    setCommentsError(null)

    try {
      const loadedComments = await onLoadComments(idea.id)

      setComments(loadedComments)
      setHasLoadedComments(true)
    } catch {
      setCommentsError('Не удалось загрузить комментарии')
    } finally {
      setIsCommentsLoading(false)
    }
  }

  const handleToggleComments = async () => {
    const shouldOpenComments = !isCommentsOpen

    setIsCommentsOpen(shouldOpenComments)

    if (shouldOpenComments && !hasLoadedComments) {
      await loadComments()
    }
  }

  const handleToggleLike = async () => {
    if (!currentUser) {
      setActionError('Войдите, чтобы поставить лайк')
      onRequireAuth()
      return
    }

    setIsLikePending(true)
    setActionError(null)

    try {
      await onToggleLike(idea)
    } catch {
      setActionError('Не удалось обновить лайк')
    } finally {
      setIsLikePending(false)
    }
  }

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUser) {
      setActionError('Войдите, чтобы написать комментарий')
      onRequireAuth()
      return
    }

    const trimmedComment = commentText.trim()

    if (!trimmedComment) {
      setActionError('Введите текст комментария')
      return
    }

    setIsCommentSubmitting(true)
    setActionError(null)

    try {
      const createdComment = await onCreateComment(idea.id, trimmedComment)

      setComments((currentComments) => [...currentComments, createdComment])
      setHasLoadedComments(true)
      setCommentText('')
    } catch {
      setActionError('Не удалось отправить комментарий')
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  return (
    <article className="snap-start overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_30px_90px_-44px_rgba(28,16,55,0.58)]">
      <div className="relative isolate min-h-[21rem] overflow-hidden px-6 py-6 sm:min-h-[24rem] sm:px-8 sm:py-8 lg:min-h-[27rem]">
        <div
          className="absolute inset-0"
          style={{
            background: idea.cover,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(15,23,42,0.08))]" />
        <div className="absolute -right-10 top-6 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute bottom-[-3rem] left-[-2rem] h-36 w-36 rounded-full bg-slate-950/10 blur-3xl" />

        <div className="relative flex min-h-[17rem] flex-col justify-between gap-10 text-white sm:min-h-[19rem] lg:min-h-[22rem]">
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
              {idea.category}
            </span>
          </div>

          <div className="max-w-[36rem] space-y-4">
            <p className="font-display text-[2.25rem] font-semibold leading-tight tracking-[-0.04em] sm:text-[2.75rem] lg:text-[3.15rem]">
              {idea.previewTitle}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-fuchsia-50 px-4 py-1.5 text-xs font-medium text-fuchsia-700">
            {idea.category}
          </span>
          <div className="space-y-3">
            <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[2.1rem]">
              {idea.title}
            </h2>
            <p className="max-w-[56rem] text-base leading-8 text-slate-500">
              {idea.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {idea.tags.map((tag, index) => (
            <span
              key={`${idea.id}-tag-${index}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500"
            >
              #{String(tag)}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">
              {String(typeof idea.author === 'object' ? idea.author.username : idea.author)}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{String(idea.role)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-base text-slate-500">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLikePending}
              className={[
                'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                idea.isLikedByCurrentUser
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500',
              ].join(' ')}
              aria-pressed={idea.isLikedByCurrentUser}
            >
              <HeartIcon className="h-5 w-5" />
              {idea.likes}
            </button>

            <button
              type="button"
              onClick={handleToggleComments}
              className={[
                'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                isCommentsOpen
                  ? 'border-slate-300 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-950',
              ].join(' ')}
              aria-expanded={isCommentsOpen}
            >
              <CommentIcon className="h-5 w-5" />
              {idea.comments}
            </button>
          </div>
        </div>

        {actionError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {actionError}
          </div>
        ) : null}

        {isCommentsOpen ? (
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Комментарии</p>
              {isCommentsLoading ? (
                <span className="text-xs font-medium text-slate-400">Загрузка...</span>
              ) : null}
            </div>

            {commentsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {commentsError}
              </div>
            ) : null}

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-white/80 bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{getAuthorName(comment.author)}</p>
                      <p className="text-xs font-medium text-slate-400">
                        {formatCommentDate(comment.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : !isCommentsLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-5 text-center text-sm text-slate-400">
                Комментариев пока нет
              </div>
            ) : null}

            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="Напишите комментарий"
                  className="min-h-[6rem] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{commentText.length}/600</span>
                  <button
                    type="submit"
                    disabled={isCommentSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <CommentIcon className="h-4 w-4" />
                    {isCommentSubmitting ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">Войдите, чтобы написать комментарий.</p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Войти
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </article>
  )
}
