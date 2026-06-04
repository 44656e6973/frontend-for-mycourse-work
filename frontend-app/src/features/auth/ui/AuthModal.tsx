import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import { authApi, type User } from '../../../entities/user'
import { CloseIcon, LockIcon, MailIcon, UserIcon } from '../../../shared/ui/Icons'

type AuthMode = 'login' | 'register'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: User) => void
}

type AuthFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
  remember: boolean
}

const initialFormState: AuthFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  remember: true,
}

function validateAuthForm(mode: AuthMode, form: AuthFormState) {
  if (!form.email.trim() || !form.email.includes('@')) {
    return 'Введите корректный email'
  }

  if (form.password.length < 6) {
    return 'Пароль должен быть не короче 6 символов'
  }

  if (mode === 'register' && form.name.trim().length < 2) {
    return 'Введите имя'
  }

  if (mode === 'register' && form.password !== form.confirmPassword) {
    return 'Пароли не совпадают'
  }

  return null
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState<AuthFormState>(initialFormState)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const title = mode === 'login' ? 'Вход' : 'Регистрация'
  const submitLabel = mode === 'login' ? 'Войти' : 'Создать аккаунт'

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleFieldChange =
    (field: keyof AuthFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = field === 'remember' ? event.target.checked : event.target.value

      setForm((currentForm) => ({
        ...currentForm,
        [field]: value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateAuthForm(mode, form)

    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response =
        mode === 'login'
          ? await authApi.login({
              email: form.email.trim(),
              password: form.password,
            })
          : await authApi.register({
              username: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            })

      onAuthSuccess(response.user)
      setForm(initialFormState)
      onClose()
    } catch {
      setError('Не удалось выполнить запрос')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-[30rem] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.65)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
              Аккаунт
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950"
            aria-label="Закрыть окно авторизации"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-5 sm:px-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={[
                'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                mode === 'login'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950',
              ].join(' ')}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={[
                'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                mode === 'register'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950',
              ].join(' ')}
            >
              Регистрация
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-6">
          {mode === 'register' ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Имя</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <UserIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange('name')}
                  autoComplete="name"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Иван"
                />
              </span>
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Пароль</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <LockIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={handleFieldChange('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Минимум 6 символов"
              />
            </span>
          </label>

          {mode === 'register' ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Повтор пароля</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <LockIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleFieldChange('confirmPassword')}
                  autoComplete="new-password"
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Еще раз пароль"
                />
              </span>
            </label>
          ) : null}

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={handleFieldChange('remember')}
              className="h-4 w-4 rounded border-slate-300 accent-slate-950"
            />
            Запомнить меня
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Отправка...' : submitLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
