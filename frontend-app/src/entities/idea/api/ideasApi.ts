import { apiClient } from '../../../shared/api/httpClient'
import { type User } from '../../user'
import { ideas as mockIdeas } from '../model/mockIdeas'
import { type CreateIdeaPayload, type Idea, type IdeaCategory, type Tag } from '../model/types'

type IdeaApiTag = string | number | { id?: string | number; name?: string; title?: string }
type TagsApiResponse = IdeaApiTag[] | { results?: IdeaApiTag[]; data?: IdeaApiTag[] }

type IdeaApiRecord = Partial<{
  id: string | number
  title: string
  description: string
  status: string
  cover_image_URL: string | null
  cover_image_url: string | null
  likes_count: number
  comments_count: number
  author: User | string | number
  tags: IdeaApiTag[]
}>

const FALLBACK_CATEGORY: IdeaCategory = 'UI/UX'
const DEFAULT_CREATED_IDEA_STATUS = 'draft'

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

function getCoverBackground(coverImageUrl: string | null | undefined) {
  if (coverImageUrl) {
    return [
      'linear-gradient(135deg, rgba(15,23,42,0.34), rgba(2,6,23,0.58))',
      `url(${JSON.stringify(coverImageUrl)}) center/cover no-repeat`,
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

function normalizeCreatedIdea(
  apiIdea: IdeaApiRecord,
  payload: CreateIdeaPayload,
  author: User,
  selectedTags: string[] = [],
): Idea {
  const title = apiIdea.title?.trim() || payload.title
  const description = apiIdea.description?.trim() || payload.description
  const coverImageUrl = apiIdea.cover_image_URL ?? apiIdea.cover_image_url ?? payload.cover_image_URL
  const status = apiIdea.status ?? DEFAULT_CREATED_IDEA_STATUS

  return {
    id: String(apiIdea.id ?? globalThis.crypto?.randomUUID?.() ?? `idea-${Date.now()}`),
    title,
    previewTitle: title,
    description,
    category: FALLBACK_CATEGORY,
    tags: normalizeIdeaTags(apiIdea.tags, selectedTags),
    author: normalizeAuthor(apiIdea.author, author),
    role: 'Автор идеи',
    likes: apiIdea.likes_count ?? 0,
    comments: apiIdea.comments_count ?? 0,
    stage: getStatusLabel(status),
    coverLabel: status,
    cover: getCoverBackground(coverImageUrl),
  }
}

async function getLocalCreatedIdea(
  payload: CreateIdeaPayload,
  author: User,
  selectedTags: string[] = [],
) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 350)
  })

  return normalizeCreatedIdea({}, payload, author, selectedTags)
}

export const ideasApi = {
  getIdeas: (): Promise<Idea[]> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve(mockIdeas)
    }

    return apiClient.get<Idea[]>('/v1/ideas')
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

    return normalizeCreatedIdea(createdIdea, payload, author, selectedTags)
  },
}
