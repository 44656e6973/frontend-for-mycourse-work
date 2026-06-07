import { CommentIcon, HeartIcon } from '../../../shared/ui/Icons'
import { type Idea } from '../model/types'

type IdeaCardProps = {
  idea: Idea
}

export function IdeaCard({ idea }: IdeaCardProps) {
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
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              {idea.stage}
            </span>
          </div>

          <div className="max-w-[36rem] space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              {idea.coverLabel}
            </p>
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

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="text-base font-semibold text-slate-900">
              {String(typeof idea.author === 'object' ? idea.author.username : idea.author)}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{String(idea.role)}</p>
          </div>

          <div className="flex items-center gap-5 text-base text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <HeartIcon className="h-5 w-5" />
              {idea.likes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CommentIcon className="h-5 w-5" />
              {idea.comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
