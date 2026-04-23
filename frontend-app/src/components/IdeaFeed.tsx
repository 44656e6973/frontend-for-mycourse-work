import { IdeaCard } from './IdeaCard'
import { type FilterCategory, type Idea } from '../types/idea'

type IdeaFeedProps = {
  ideas: Idea[]
  titleQuery: string
  tagQuery: string
  activeCategory: FilterCategory
}

export function IdeaFeed({
  ideas,
  titleQuery,
  tagQuery,
  activeCategory,
}: IdeaFeedProps) {
  const hasFilters = Boolean(titleQuery.trim() || tagQuery.trim() || activeCategory !== 'Все')

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
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

      <aside className="space-y-4">
        <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
            Быстрая сводка
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
            {ideas.length}
          </p>
          <p className="mt-2 text-sm leading-7 text-white/70">
            карточек сейчас в ленте после применения фильтров и поиска.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/80 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Что уже работает
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>Поиск по названию в верхней строке.</li>
            <li>Отдельный поиск по тэгам и кликабельные категории.</li>
            <li>Прокрутка записей в центральной колонке без перезагрузки страницы.</li>
          </ul>
        </div>

        <div className="rounded-[28px] border border-fuchsia-100 bg-[linear-gradient(180deg,rgba(254,244,255,0.95),rgba(255,255,255,0.95))] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-500">
            Статус фильтров
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {hasFilters
              ? 'Фильтры активны, поэтому список обновляется по мере ввода.'
              : 'Фильтры не заданы, отображается вся коллекция идей.'}
          </p>
        </div>
      </aside>
    </section>
  )
}
