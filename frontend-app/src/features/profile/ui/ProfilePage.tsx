import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'

import { authApi, type UpdateUserPayload, type User } from '../../../entities/user'
import { ApiError } from '../../../shared/api/httpClient'
import { ArrowLeftIcon, CheckIcon, ImageIcon, LockIcon, MailIcon, UserIcon } from '../../../shared/ui/Icons'

type ProfilePageProps = {
  currentUser: User
  onBack: () => void
  onProfileUpdate: (user: User) => void
}

type ProfileForm = {
  username: string
  email: string
  avatarUrl: string
  password: string
  confirmPassword: string
}

const fieldNameMap: Record<string, string> = {
  username: 'Имя',
  email: 'Email',
  avatar_URL: 'Аватар',
  avatar_url: 'Аватар',
  password: 'Пароль',
}

function getInitialForm(user: User): ProfileForm {
  return {
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar_URL ?? '',
    password: '',
    confirmPassword: '',
  }
}

function extractErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError) {
    const body = error.body as Record<string, unknown> | null

    if (body?.detail) {
      return String(body.detail)
    }

    if (body && Array.isArray(body.non_field_errors) && body.non_field_errors.length > 0) {
      return String(body.non_field_errors[0])
    }

    if (body && typeof body === 'object') {
      for (const [key, value] of Object.entries(body)) {
        if (Array.isArray(value) && value.length > 0) {
          const fieldName = fieldNameMap[key]
          const message = String(value[0])

          return fieldName ? `${fieldName}: ${message}` : message
        }

        if (typeof value === 'string') {
          const fieldName = fieldNameMap[key]

          return fieldName ? `${fieldName}: ${value}` : value
        }
      }
    }

    return error.message || 'Ошибка сервера'
  }

  if (error instanceof Error) {
    return error.message
  }

  return null
}

function getValidUrl(value: string) {
  const url = value.trim()

  if (!url) {
    return ''
  }

  try {
    const parsedUrl = new URL(url)

    return ['http:', 'https:'].includes(parsedUrl.protocol) ? url : ''
  } catch {
    return ''
  }
}

function validateProfileForm(form: ProfileForm) {
  const username = form.username.trim()
  const email = form.email.trim()
  const avatarUrl = form.avatarUrl.trim()

  if (username.length < 2) {
    return 'Введите имя пользователя'
  }

  if (username.length > 50) {
    return 'Имя пользователя должно быть не длиннее 50 символов'
  }

  if (!email || !email.includes('@')) {
    return 'Введите корректный email'
  }

  if (avatarUrl && !getValidUrl(avatarUrl)) {
    return 'Ссылка на аватар должна начинаться с http или https'
  }

  if (form.password && form.password.length < 6) {
    return 'Новый пароль должен быть не короче 6 символов'
  }

  if (form.password.length > 128) {
    return 'Новый пароль должен быть не длиннее 128 символов'
  }

  if (form.password !== form.confirmPassword) {
    return 'Пароли не совпадают'
  }

  return null
}

export function ProfilePage({ currentUser, onBack, onProfileUpdate }: ProfilePageProps) {
  const [form, setForm] = useState<ProfileForm>(() => getInitialForm(currentUser))
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const avatarPreviewUrl = useMemo(() => getValidUrl(form.avatarUrl), [form.avatarUrl])
  const userInitial = form.username.trim().charAt(0).toLocaleUpperCase('ru-RU')

  const handleFieldChange =
    (field: keyof ProfileForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }))
      setSuccessMessage(null)
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateProfileForm(form)

    if (validationError) {
      setError(validationError)
      return
    }

    const payload: UpdateUserPayload = {
      username: form.username.trim(),
      email: form.email.trim(),
      avatar_URL: form.avatarUrl.trim() || null,
      ...(form.password ? { password: form.password } : {}),
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updatedUser = await authApi.updateProfile(currentUser, payload)

      onProfileUpdate(updatedUser)
      setForm(getInitialForm(updatedUser))
      setSuccessMessage('Профиль сохранен')
    } catch (error) {
      setError(extractErrorMessage(error) ?? 'Не удалось сохранить профиль')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Назад
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-600">
              Личный кабинет
            </p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
              Профиль пользователя
            </h1>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Аккаунт
          </p>
          <p className="text-sm font-semibold text-slate-950">{currentUser.email}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-[28px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] sm:px-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Имя пользователя</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
                <UserIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={handleFieldChange('username')}
                  maxLength={50}
                  autoComplete="username"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="ivan"
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
                <MailIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleFieldChange('email')}
                  autoComplete="email"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="name@example.com"
                />
              </span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">URL аватара</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
              <ImageIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="url"
                value={form.avatarUrl}
                onChange={handleFieldChange('avatarUrl')}
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="https://example.com/avatar.jpg"
              />
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Новый пароль</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
                <LockIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={handleFieldChange('password')}
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Оставьте пустым"
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Повтор пароля</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
                <LockIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleFieldChange('confirmPassword')}
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Еще раз"
                />
              </span>
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Назад
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <CheckIcon className="h-4 w-4" />
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]">
            <div
              className="relative flex min-h-[18rem] items-end px-5 py-5 text-white"
              style={{
                background: avatarPreviewUrl
                  ? [
                      'linear-gradient(135deg, rgba(15,23,42,0.26), rgba(2,6,23,0.64))',
                      `url(${JSON.stringify(avatarPreviewUrl)}) center/cover no-repeat`,
                    ].join(', ')
                  : 'linear-gradient(135deg, rgba(14,165,233,0.84) 0%, rgba(124,58,237,0.76) 52%, rgba(244,114,182,0.62) 100%)',
              }}
            >
              <div className="space-y-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-semibold backdrop-blur-sm">
                  {userInitial || <UserIcon className="h-7 w-7" />}
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold tracking-[-0.04em]">
                    {form.username.trim() || currentUser.username}
                  </p>
                  <p className="text-sm font-medium text-white/75">{form.email.trim() || currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  ID
                </span>
                <span className="max-w-[12rem] truncate text-sm font-semibold text-slate-900">
                  {currentUser.id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Создан
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {new Date(currentUser.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
