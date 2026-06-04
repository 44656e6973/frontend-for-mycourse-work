import { CommentIcon, HeartIcon } from '../../../shared/ui/Icons'
import { type Idea } from '../model/types'

type IdeaCardProps = {
  idea: Idea
}

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <article className="snap-start overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_26px_80px_-42px_rgba(28,16,55,0.55)]">
      <div className="relative isolate min-h-[17rem] overflow-hidden px-5 py-5 sm:px-7 sm:py-6">
        <div
          className="absolute inset-0"
          style={{
            background: idea.cover,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(15,23,42,0.08))]" />
        <div className="absolute -right-10 top-6 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute bottom-[-3rem] left-[-2rem] h-36 w-36 rounded-full bg-slate-950/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between gap-8 text-white">
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
              {idea.category}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              {idea.stage}
            </span>
          </div>

          <div className="max-w-[28rem] space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              {idea.coverLabel}
            </p>
            <p className="font-display text-3xl font-semibold tracking-[-0.04em] sm:text-[2.15rem]">
              {idea.previewTitle}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700">
            {idea.category}
          </span>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {idea.title}
            </h2>
            <p className="max-w-[48rem] text-sm leading-7 text-slate-500 sm:text-[0.96rem]">
              {idea.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{idea.author}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{idea.role}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <HeartIcon className="h-4 w-4" />
              {idea.likes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CommentIcon className="h-4 w-4" />
              {idea.comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
