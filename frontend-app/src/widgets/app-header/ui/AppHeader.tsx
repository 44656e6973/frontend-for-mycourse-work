import { type ChangeEvent } from 'react'

import { type User } from '../../../entities/user'
import { SearchIcon, UserIcon } from '../../../shared/ui/Icons'

type AppHeaderProps = {
  titleQuery: string
  currentUser: User | null
  isCreateButtonVisible?: boolean
  isSearchVisible?: boolean
  onTitleQueryChange: (value: string) => void
  onAuthClick: () => void
  onCreateIdeaClick: () => void
  onHomeClick: () => void
  onProfileClick: () => void
  onLogout?: () => void
}

export function AppHeader({
  titleQuery,
  currentUser,
  isCreateButtonVisible = true,
  isSearchVisible = true,
  onTitleQueryChange,
  onAuthClick,
  onCreateIdeaClick,
  onHomeClick,
  onProfileClick,
  onLogout,
}: AppHeaderProps) {
  const userInitial = currentUser?.username.trim().charAt(0).toLocaleUpperCase('ru-RU')

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTitleQueryChange(event.target.value)
  }

  return (
    <header className="space-y-4 px-3 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onHomeClick}
            className="font-display text-[1.65rem] font-semibold text-slate-950 transition hover:text-slate-700"
          >
            IdeaBoard
          </button>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {isSearchVisible ? (
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
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            {currentUser ? (
              <>
                <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                    {userInitial || <UserIcon className="h-4 w-4" />}
                  </span>
                  <span className="max-w-[10rem] truncate text-sm font-semibold text-slate-900">
                    {String(currentUser.username)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onProfileClick}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <UserIcon className="h-4 w-4" />
                  Профиль
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 hover:border-slate-300"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onAuthClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:text-slate-950"
              >
                <UserIcon className="h-5 w-5" />
                Войти
              </button>
            )}

            {currentUser && isCreateButtonVisible ? (
              <button
                type="button"
                onClick={onCreateIdeaClick}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Создать
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
