import { type ChangeEvent } from 'react'

import { BellIcon, BrandIcon, SearchIcon } from './Icons'

type AppHeaderProps = {
  titleQuery: string
  onTitleQueryChange: (value: string) => void
}

export function AppHeader({ titleQuery, onTitleQueryChange }: AppHeaderProps) {
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTitleQueryChange(event.target.value)
  }

  return (
    <header className="space-y-4 px-3 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff8dc4_0%,#a42bfd_100%)] shadow-[0_18px_36px_-20px_rgba(168,43,253,0.95)]">
            <BrandIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-950">
              IdeaBoard
            </p>
        
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/70 bg-slate-100/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:min-w-[22rem]">
            <SearchIcon className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="search"
              value={titleQuery}
              onChange={handleTitleChange}
              placeholder="Поиск по названию"
              className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:text-slate-950"
              aria-label="Уведомления"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Создать
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
