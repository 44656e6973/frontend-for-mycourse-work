import { type ChangeEvent } from 'react'

import { type FilterCategory } from '../../../entities/idea'

type FilterBarProps = {
  categories: FilterCategory[]
  activeCategory: FilterCategory
  onCategoryChange: (category: FilterCategory) => void
  tagQuery: string
  onTagQueryChange: (value: string) => void
  resultsCount: number
  onResetFilters: () => void
}

export function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  tagQuery,
  onTagQueryChange,
  resultsCount,
  onResetFilters,
}: FilterBarProps) {
  const handleTagChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTagQueryChange(event.target.value)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((category, index) => {
            const isActive = category === activeCategory

            return (
              <button
                key={`category-${index}-${String(category)}`}
                type="button"
                onClick={() => onCategoryChange(category)}
                className={[
                  'shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[linear-gradient(135deg,#d238ff_0%,#7c3aed_100%)] text-white shadow-[0_16px_30px_-18px_rgba(124,58,237,0.9)]'
                    : 'border border-white/70 bg-white/80 text-slate-600 hover:border-slate-200 hover:text-slate-950',
                ].join(' ')}
              >
                {String(category)}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200/70 bg-slate-50/80 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Результаты
            </p>
            <p className="text-sm text-slate-600">
              Найдено записей: <span className="font-semibold text-slate-950">{resultsCount}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:text-slate-950"
          >
            Сбросить
          </button>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-[24px] border border-dashed border-fuchsia-200 bg-fuchsia-50/80 px-4 py-3 text-sm text-slate-700">
        <span className="rounded-full bg-white px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
          Tags
        </span>
        <input
          type="search"
          value={tagQuery}
          onChange={handleTagChange}
          placeholder="Фильтр по тэгам: web, mobile, интерьер..."
          className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </label>
    </section>
  )
}
