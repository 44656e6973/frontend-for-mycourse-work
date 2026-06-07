import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'

import { ideasApi, type CreateIdeaPayload, type Tag } from '../../../entities/idea'
import { type User } from '../../../entities/user'
import { ArrowLeftIcon, CheckIcon, ImageIcon, SearchIcon, TagIcon } from '../../../shared/ui/Icons'

type CreateIdeaPageProps = {
  currentUser: User
  onBack: () => void
  onCreateIdea: (payload: CreateIdeaPayload, selectedTags: string[]) => Promise<void>
}

type CreateIdeaForm = {
  title: string
  description: string
  coverImageUrl: string
}

const initialForm: CreateIdeaForm = {
  title: '',
  description: '',
  coverImageUrl: '',
}

function validateForm(form: CreateIdeaForm) {
  if (!form.title.trim()) {
    return 'Введите название идеи'
  }

  if (form.title.trim().length > 200) {
    return 'Название должно быть не длиннее 200 символов'
  }

  if (!form.description.trim()) {
    return 'Добавьте описание идеи'
  }

  const coverUrl = form.coverImageUrl.trim()

  if (coverUrl) {
    try {
      const parsedUrl = new URL(coverUrl)

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return 'Ссылка на обложку должна начинаться с http или https'
      }
    } catch {
      return 'Укажите корректную ссылку на изображение'
    }
  }

  return null
}

function getTagKey(tag: Tag) {
  return String(tag.id)
}

export function CreateIdeaPage({ currentUser, onBack, onCreateIdea }: CreateIdeaPageProps) {
  const [form, setForm] = useState<CreateIdeaForm>(initialForm)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([])
  const [tagQuery, setTagQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tagsError, setTagsError] = useState<string | null>(null)
  const [isTagsLoading, setIsTagsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    ideasApi
      .getTags()
      .then((tags) => {
        if (!isMounted) {
          return
        }

        setAvailableTags(tags)
        setTagsError(null)
      })
      .catch(() => {
        if (isMounted) {
          setTagsError('Не удалось загрузить список тегов')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsTagsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagKeys.includes(getTagKey(tag))),
    [availableTags, selectedTagKeys],
  )
  const filteredTags = useMemo(() => {
    const normalizedQuery = tagQuery.trim().toLocaleLowerCase('ru-RU')

    if (!normalizedQuery) {
      return availableTags
    }

    return availableTags.filter((tag) =>
      tag.name.toLocaleLowerCase('ru-RU').includes(normalizedQuery),
    )
  }, [availableTags, tagQuery])
  const coverUrl = form.coverImageUrl.trim()
  const titlePreview = form.title.trim() || 'Название идеи'
  const descriptionPreview =
    form.description.trim() || 'Краткое описание появится здесь после заполнения формы.'
  const previewTags = selectedTags.length > 0 ? selectedTags.map((tag) => tag.name) : ['idea']

  const previewCoverStyle = coverUrl
    ? {
        backgroundImage: [
          'linear-gradient(135deg, rgba(15,23,42,0.24), rgba(2,6,23,0.62))',
          `url(${JSON.stringify(coverUrl)})`,
        ].join(', '),
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : {
        background:
          'linear-gradient(135deg, rgba(14,165,233,0.84) 0%, rgba(124,58,237,0.76) 52%, rgba(244,114,182,0.62) 100%)',
      }

  const handleFieldChange =
    (field: keyof CreateIdeaForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }))
    }

  const handleToggleTag = (tag: Tag) => {
    const tagKey = getTagKey(tag)

    setSelectedTagKeys((currentKeys) =>
      currentKeys.includes(tagKey)
        ? currentKeys.filter((currentKey) => currentKey !== tagKey)
        : [...currentKeys, tagKey],
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm(form)

    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onCreateIdea(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          cover_image_URL: coverUrl || null,
          tags: selectedTags.map((tag) => tag.id),
        },
        selectedTags.map((tag) => tag.name),
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось создать идею')
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
              Новая идея
            </p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
              Создание идеи
            </h1>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Автор
          </p>
          <p className="text-sm font-semibold text-slate-950">{currentUser.username}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-[28px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] sm:px-6"
        >
          <label className="block space-y-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
              <span>Название</span>
              <span className="text-xs text-slate-400">{form.title.length}/200</span>
            </span>
            <input
              type="text"
              value={form.title}
              onChange={handleFieldChange('title')}
              maxLength={200}
              placeholder="Например, сервис для быстрых дизайн-идей"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300 focus:bg-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Описание</span>
            <textarea
              value={form.description}
              onChange={handleFieldChange('description')}
              rows={8}
              placeholder="Опишите суть идеи, проблему, решение и кому это может быть полезно"
              className="min-h-[12rem] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300 focus:bg-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">URL обложки</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
              <ImageIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={handleFieldChange('coverImageUrl')}
                placeholder="https://example.com/cover.jpg"
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">Теги</p>
              <p className="text-xs text-slate-400">Выбрано: {selectedTags.length}</p>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-fuchsia-300 focus-within:bg-white">
              <SearchIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="search"
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
                placeholder="Найти тег из списка"
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            {tagsError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {tagsError}
              </div>
            ) : null}

            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
              {isTagsLoading ? (
                <div className="px-3 py-4 text-sm text-slate-400">Загружаем теги...</div>
              ) : filteredTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredTags.map((tag) => {
                    const tagKey = getTagKey(tag)
                    const isSelected = selectedTagKeys.includes(tagKey)

                    return (
                      <button
                        key={tagKey}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={[
                          'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition',
                          isSelected
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-950',
                        ].join(' ')}
                      >
                        <TagIcon className="h-3.5 w-3.5" />
                        #{tag.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-3 py-4 text-sm text-slate-400">Подходящих тегов нет</div>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
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
              {isSubmitting ? 'Сохранение...' : 'Сохранить идею'}
            </button>
          </div>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]">
            <div className="relative min-h-[16rem] px-5 py-5 text-white" style={previewCoverStyle}>
              <div className="relative flex min-h-[13.5rem] flex-col justify-between gap-8">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
                    Идея
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                    Черновик
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                    preview
                  </p>
                  <p className="font-display text-3xl font-semibold tracking-[-0.04em]">
                    {titlePreview}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
                  Новая идея
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {titlePreview}
                </h2>
                <p className="text-sm leading-7 text-slate-500">{descriptionPreview}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {previewTags.map((tag) => (
                  <span
                    key={`preview-${tag}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-900">{currentUser.username}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Автор идеи</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
