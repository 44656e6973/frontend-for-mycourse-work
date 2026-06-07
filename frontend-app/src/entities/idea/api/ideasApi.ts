import { apiClient } from '../../../shared/api/httpClient'
import { type User } from '../../user'
import { ideas as mockIdeas } from '../model/mockIdeas'
import { type CreateIdeaPayload, type Idea, type IdeaCategory, type Tag } from '../model/types'

type IdeaApiTag = string | number | { id?: string | number; name?: string; title?: string }
type TagsApiResponse = IdeaApiTag[] | { results?: IdeaApiTag[]; data?: IdeaApiTag[] }
type IdeasApiResponse = IdeaApiRecord[] | { results?: IdeaApiRecord[]; data?: IdeaApiRecord[] }

type IdeaApiRecord = Partial<{
  id: string | number
  title: string
  previewTitle: string
  description: string
  category: IdeaCategory
  status: string
  stage: string
  coverLabel: string
  cover: string
  cover_image_URL: string | null
  cover_image_url: string | null
  image: string | null
  image_url: string | null
  likes_count: number
  likes: number
  comments_count: number
  comments: number
  author: User | string | number
  role: string
  tags: IdeaApiTag[]
}>

const FALLBACK_CATEGORY: IdeaCategory = 'UI/UX'
const DEFAULT_CREATED_IDEA_STATUS = 'draft'
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

function getStatusLabel(status: string | undefined) {
  switch (status) {
    case 'published':
      return 'Опубликовано'
    case 'review':
      return 'На проверке'
    default:
      return 'Черновик'
  }
}

function getApiOrigin() {
  if (!API_BASE_URL) {
    return window.location.origin
  }

  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return window.location.origin
  }
}

function normalizeMediaUrl(url: string | null | undefined) {
  const trimmedUrl = url?.trim()

  if (!trimmedUrl) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmedUrl) || trimmedUrl.startsWith('data:')) {
    return trimmedUrl
  }

  if (trimmedUrl.startsWith('/')) {
    return `${getApiOrigin()}${trimmedUrl}`
  }

  return trimmedUrl
}

function getCoverBackground(coverImageUrl: string | null | undefined) {
  const normalizedCoverImageUrl = normalizeMediaUrl(coverImageUrl)

  if (normalizedCoverImageUrl) {
    return [
      'linear-gradient(135deg, rgba(15,23,42,0.34), rgba(2,6,23,0.58))',
      `url(${JSON.stringify(normalizedCoverImageUrl)}) center/cover no-repeat`,
    ].join(', ')
  }

  return 'linear-gradient(135deg, rgba(14,165,233,0.82) 0%, rgba(124,58,237,0.78) 52%, rgba(244,114,182,0.64) 100%)'
}

function normalizeTag(tag: IdeaApiTag): Tag {
  if (typeof tag === 'string' || typeof tag === 'number') {
    return {
      id: tag,
      name: String(tag),
    }
  }

  const name = tag.name ?? tag.title ?? String(tag.id ?? '')

  return {
    id: tag.id ?? name,
    name,
  }
}

function normalizeTagsResponse(response: TagsApiResponse): Tag[] {
  const tags = Array.isArray(response) ? response : response.results ?? response.data ?? []
  const normalizedTags = tags.map(normalizeTag).filter((tag) => tag.name)
  const uniqueTagNames = new Set<string>()

  return normalizedTags.filter((tag) => {
    const tagName = tag.name.toLocaleLowerCase('ru-RU')

    if (uniqueTagNames.has(tagName)) {
      return false
    }

    uniqueTagNames.add(tagName)
    return true
  })
}

function getLocalTags() {
  return normalizeTagsResponse(mockIdeas.flatMap((idea) => idea.tags))
}

function normalizeIdeaTags(apiTags: IdeaApiTag[] | undefined, fallbackTags: string[]) {
  const tags = apiTags?.map((tag) => {
    if (typeof tag === 'string' || typeof tag === 'number') {
      return String(tag)
    }

    return tag.name ?? tag.title ?? String(tag.id ?? '')
  })

  return (tags?.length ? tags : fallbackTags).filter(Boolean)
}

function normalizeAuthor(apiAuthor: IdeaApiRecord['author'], fallbackAuthor: User) {
  if (typeof apiAuthor === 'string') {
    return apiAuthor
  }

  if (apiAuthor && typeof apiAuthor === 'object') {
    return apiAuthor
  }

  return fallbackAuthor
}

function getCoverImageUrl(apiIdea: IdeaApiRecord, payload: CreateIdeaPayload) {
  return (
    apiIdea.cover_image_URL ??
    apiIdea.cover_image_url ??
    apiIdea.image_url ??
    apiIdea.image ??
    payload.cover_image_URL
  )
}

function normalizeIdea(
  apiIdea: IdeaApiRecord,
  payload: CreateIdeaPayload,
  author: User,
  selectedTags: string[] = [],
): Idea {
  const title = apiIdea.title?.trim() || payload.title
  const description = apiIdea.description?.trim() || payload.description
  const status = apiIdea.status ?? DEFAULT_CREATED_IDEA_STATUS

  return {
    id: String(apiIdea.id ?? globalThis.crypto?.randomUUID?.() ?? `idea-${Date.now()}`),
    title,
    previewTitle: apiIdea.previewTitle ?? title,
    description,
    category: apiIdea.category ?? FALLBACK_CATEGORY,
    tags: normalizeIdeaTags(apiIdea.tags, selectedTags),
    author: normalizeAuthor(apiIdea.author, author),
    role: apiIdea.role ?? 'Автор идеи',
    likes: apiIdea.likes_count ?? apiIdea.likes ?? 0,
    comments: apiIdea.comments_count ?? apiIdea.comments ?? 0,
    stage: apiIdea.stage ?? getStatusLabel(status),
    coverLabel: apiIdea.coverLabel ?? status,
    cover: apiIdea.cover ?? getCoverBackground(getCoverImageUrl(apiIdea, payload)),
  }
}

function normalizeIdeasResponse(response: IdeasApiResponse): Idea[] {
  const ideas = Array.isArray(response) ? response : response.results ?? response.data ?? []
  const fallbackAuthor: User = {
    id: 'api-author',
    username: 'Автор идеи',
    email: '',
    avatar_URL: '',
    created_at: new Date().toISOString(),
  }

  return ideas.map((idea) =>
    normalizeIdea(
      idea,
      {
        title: idea.title ?? '',
        description: idea.description ?? '',
        cover_image_URL: null,
        tags: [],
      },
      fallbackAuthor,
    ),
  )
}

async function getLocalCreatedIdea(
  payload: CreateIdeaPayload,
  author: User,
  selectedTags: string[] = [],
) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 350)
  })

  return normalizeIdea({}, payload, author, selectedTags)
}

export const ideasApi = {
  getIdeas: (): Promise<Idea[]> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve(mockIdeas)
    }

    return apiClient.get<IdeasApiResponse>('/v1/ideas').then(normalizeIdeasResponse)
  },
  getTags: async (): Promise<Tag[]> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve(getLocalTags())
    }

    const tags = await apiClient.get<TagsApiResponse>('/v1/tags/')

    return normalizeTagsResponse(tags)
  },
  createIdea: async (
    payload: CreateIdeaPayload,
    author: User,
    selectedTags: string[] = [],
  ): Promise<Idea> => {
    if (!apiClient.isConfigured) {
      return getLocalCreatedIdea(payload, author, selectedTags)
    }

    const createdIdea = await apiClient.post<IdeaApiRecord>('/v1/ideas/', payload)

    return normalizeIdea(createdIdea, payload, author, selectedTags)
  },
}
