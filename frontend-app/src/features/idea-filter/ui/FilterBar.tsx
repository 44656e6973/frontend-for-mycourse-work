import { type Tag } from '../../../entities/idea'
import { TagIcon } from '../../../shared/ui/Icons'

type FilterBarProps = {
  selectedTag: string
  onSelectedTagChange: (value: string) => void
  availableTags: Tag[]
  isTagsLoading: boolean
  tagsError: string | null
  resultsCount: number
  onResetFilters: () => void
}

function normalizeTagValue(value: string) {
  return value.toLocaleLowerCase('ru-RU').replaceAll('#', '').trim()
}

export function FilterBar({
  selectedTag,
  onSelectedTagChange,
  availableTags,
  isTagsLoading,
  tagsError,
  resultsCount,
  onResetFilters,
}: FilterBarProps) {
  const normalizedSelectedTag = normalizeTagValue(selectedTag)
  const isAllTagsActive = normalizedSelectedTag.length === 0

  const handleTagSelect = (tag: Tag) => {
    const nextTagName = tag.name

    onSelectedTagChange(normalizedSelectedTag === normalizeTagValue(nextTagName) ? '' : nextTagName)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectedTagChange('')}
            className={[
              'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
              isAllTagsActive
                ? 'bg-[linear-gradient(135deg,#d238ff_0%,#7c3aed_100%)] text-white shadow-[0_16px_30px_-18px_rgba(124,58,237,0.9)]'
                : 'border border-white/70 bg-white/80 text-slate-600 hover:border-slate-200 hover:text-slate-950',
            ].join(' ')}
          >
            Все
          </button>

          {isTagsLoading ? (
            <span className="inline-flex h-11 shrink-0 items-center rounded-full border border-dashed border-slate-200 bg-white/70 px-4 text-sm text-slate-400">
              Загружаем теги...
            </span>
          ) : availableTags.length > 0 ? (
            availableTags.map((tag) => {
              const isActive = normalizedSelectedTag === normalizeTagValue(tag.name)

              return (
                <button
                  key={`${String(tag.id)}-${tag.name}`}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  title={`Фильтр: ${tag.name}`}
                  className={[
                    'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                    isActive
                      ? 'bg-[linear-gradient(135deg,#d238ff_0%,#7c3aed_100%)] text-white shadow-[0_16px_30px_-18px_rgba(124,58,237,0.9)]'
                      : 'border border-white/70 bg-white/80 text-slate-600 hover:border-slate-200 hover:text-slate-950',
                  ].join(' ')}
                >
                  <TagIcon className="h-4 w-4" />
                  #{tag.name}
                </button>
              )
            })
          ) : (
            <span className="inline-flex h-11 shrink-0 items-center rounded-full border border-dashed border-slate-200 bg-white/70 px-4 text-sm text-slate-400">
              Список тегов пуст
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 rounded-[24px] border border-slate-200/70 bg-slate-50/80 px-4 py-3">
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

      {tagsError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {tagsError}
        </div>
      ) : null}
    </section>
  )
}
