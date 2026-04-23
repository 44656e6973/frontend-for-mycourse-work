import { IdeaCard } from './IdeaCard'
import { type FilterCategory, type Idea } from '../types/idea'

type IdeaFeedProps = {
  ideas: Idea[]
  activeCategory: FilterCategory
}

export function IdeaFeed({ ideas, activeCategory }: IdeaFeedProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(247,242,255,0.92))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Каталог идей
            </p>
            <div>
              <h1 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.35rem]">
                Лента проектов
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-500">
                Идеи можно искать по названию, фильтровать по тэгам и категории, а саму ленту
                удобно листать внутри отдельного скролл-блока.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/75 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Активная категория
            </p>
            <p className="text-base font-semibold text-slate-950">{activeCategory}</p>
          </div>
        </div>

        {ideas.length > 0 ? (
          <div className="hide-scrollbar h-[min(68vh,52rem)] snap-y snap-proximity space-y-5 overflow-y-auto pr-1 sm:pr-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="flex h-[24rem] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/85 px-6 text-center">
            <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Ничего не найдено
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
              Попробуйте изменить запрос по названию или тэгам, либо снимите часть фильтров.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
