import { ApiError, apiClient } from '../../../shared/api/httpClient'
import { type User } from '../../user'
import { ideas as mockIdeas } from '../model/mockIdeas'
import {
  type CreateIdeaPayload,
  type Idea,
  type IdeaCategory,
  type IdeaComment,
  type Tag,
} from '../model/types'

type IdeaApiTag =
  | string
  | number
  | {
      id?: string | number
      name?: string
      title?: string
      label?: string
      value?: string | number
    }

type RawComment = Partial<{
  id: string | number
  idea: string | number
  idea_id: string | number
  author: User | string | number
  user: User | string | number
  text: string
  content: string
  body: string
  comment: string
  created_at: string
  created: string
}>

type TagsApiResponse = IdeaApiTag[] | { results?: IdeaApiTag[]; data?: IdeaApiTag[]; tags?: IdeaApiTag[] }
type IdeasApiResponse = IdeaApiRecord[] | { results?: IdeaApiRecord[]; data?: IdeaApiRecord[] }
type CommentsApiResponse =
  | RawComment[]
  | { results?: RawComment[]; data?: RawComment[]; comments?: RawComment[] }

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
  is_liked: boolean
  isLiked: boolean
  liked: boolean
  liked_by_me: boolean
  comments_count: number
  comments: number | RawComment[]
  author: User | string | number
  role: string
  tags: IdeaApiTag[]
}>

type LikeApiResponse = Partial<{
  likes_count: number
  likes: number
  is_liked: boolean
  isLiked: boolean
  liked: boolean
  liked_by_me: boolean
}>

type IdeaLikeState = {
  likes: number
  isLikedByCurrentUser: boolean
}

const FALLBACK_CATEGORY: IdeaCategory = 'UI/UX'
const DEFAULT_CREATED_IDEA_STATUS = 'draft'
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const TAGS_PATHS = getTagsPaths()
const localIdeaComments: Record<string, IdeaComment[]> = {}
const localCreatedIdeas: Idea[] = []
const localLikedIdeaIdsByUser = new Map<string, Set<string>>()

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

function waitForLocalResponse() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 250)
  })
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

function normalizeApiPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function getTagsPaths() {
  const paths = [
    import.meta.env.VITE_TAGS_PATH,
    '/v1/tags/',
    '/v1/tags',
    '/tags/',
    '/tags',
  ].filter((path): path is string => Boolean(path?.trim()))

  return Array.from(new Set(paths.map((path) => normalizeApiPath(path.trim()))))
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

  const name = tag.name ?? tag.title ?? tag.label ?? String(tag.value ?? tag.id ?? '')

  return {
    id: tag.id ?? name,
    name,
  }
}

function normalizeTagsResponse(response: TagsApiResponse): Tag[] {
  const tags = Array.isArray(response) ? response : response.results ?? response.data ?? response.tags ?? []
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
  return normalizeTagsResponse([...localCreatedIdeas, ...mockIdeas].flatMap((idea) => idea.tags))
}

function getLocalUserKey(user: User) {
  return (user.email || user.username || user.id).trim().toLocaleLowerCase('ru-RU')
}

function getLocalLikedIdeaIds(user: User) {
  const userKey = getLocalUserKey(user)
  const likedIdeaIds = localLikedIdeaIdsByUser.get(userKey)

  if (likedIdeaIds) {
    return likedIdeaIds
  }

  const nextLikedIdeaIds = new Set<string>()

  localLikedIdeaIdsByUser.set(userKey, nextLikedIdeaIds)

  return nextLikedIdeaIds
}

function isIdeaLikedLocallyByUser(ideaId: string, user: User | null) {
  return user ? getLocalLikedIdeaIds(user).has(ideaId) : false
}

function getLocalLikesCount(ideaId: string) {
  return Array.from(localLikedIdeaIdsByUser.values()).reduce(
    (likesCount, likedIdeaIds) => likesCount + (likedIdeaIds.has(ideaId) ? 1 : 0),
    0,
  )
}

function forgetLocalIdeaLikes(ideaId: string) {
  localLikedIdeaIdsByUser.forEach((likedIdeaIds) => {
    likedIdeaIds.delete(ideaId)
  })
}

function getLocalIdeas(currentUser: User | null = null) {
  return [...localCreatedIdeas, ...mockIdeas].map((idea) => ({
    ...idea,
    likes: idea.likes + getLocalLikesCount(idea.id),
    isLikedByCurrentUser: isIdeaLikedLocallyByUser(idea.id, currentUser),
  }))
}

function normalizeIdeaTags(apiTags: IdeaApiTag[] | undefined, fallbackTags: string[]) {
  const tags = apiTags?.map((tag) => {
    if (typeof tag === 'string' || typeof tag === 'number') {
      return String(tag)
    }

    return tag.name ?? tag.title ?? tag.label ?? String(tag.value ?? tag.id ?? '')
  })

  return (tags?.length ? tags : fallbackTags).filter(Boolean)
}

function normalizeAuthor(apiAuthor: IdeaApiRecord['author'] | RawComment['author'], fallbackAuthor: User) {
  if (typeof apiAuthor === 'string' || typeof apiAuthor === 'number') {
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

function getCommentsCount(apiIdea: IdeaApiRecord) {
  if (typeof apiIdea.comments === 'number') {
    return apiIdea.comments
  }

  if (Array.isArray(apiIdea.comments)) {
    return apiIdea.comments.length
  }

  return apiIdea.comments_count ?? 0
}

function getLikedState(apiIdea: IdeaApiRecord) {
  return Boolean(apiIdea.is_liked ?? apiIdea.isLiked ?? apiIdea.liked ?? apiIdea.liked_by_me)
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
    comments: getCommentsCount(apiIdea),
    isLikedByCurrentUser: getLikedState(apiIdea),
    stage: apiIdea.stage ?? getStatusLabel(status),
    coverLabel: apiIdea.coverLabel ?? status,
    cover: apiIdea.cover ?? getCoverBackground(getCoverImageUrl(apiIdea, payload)),
  }
}

function normalizeComment(rawComment: RawComment, ideaId: string, fallbackAuthor: User): IdeaComment {
  return {
    id: String(rawComment.id ?? globalThis.crypto?.randomUUID?.() ?? `comment-${Date.now()}`),
    ideaId: String(rawComment.idea_id ?? rawComment.idea ?? ideaId),
    author: normalizeAuthor(rawComment.author ?? rawComment.user, fallbackAuthor),
    text:
      rawComment.text?.trim() ??
      rawComment.content?.trim() ??
      rawComment.body?.trim() ??
      rawComment.comment?.trim() ??
      '',
    created_at: rawComment.created_at ?? rawComment.created ?? new Date().toISOString(),
  }
}

function normalizeCommentsResponse(
  response: CommentsApiResponse,
  ideaId: string,
  fallbackAuthor: User,
): IdeaComment[] {
  const comments = Array.isArray(response)
    ? response
    : response.results ?? response.data ?? response.comments ?? []

  return comments.map((comment) => normalizeComment(comment, ideaId, fallbackAuthor)).filter((comment) => comment.text)
}

function getRawCreatedComment(response: unknown): RawComment {
  if (response && typeof response === 'object' && !Array.isArray(response) && 'comment' in response) {
    const comment = (response as { comment: unknown }).comment

    if (comment && typeof comment === 'object' && !Array.isArray(comment)) {
      return comment as RawComment
    }
  }

  return response && typeof response === 'object' && !Array.isArray(response) ? (response as RawComment) : {}
}

function getFilledIdeaPath(pathTemplate: string, ideaId: string) {
  return pathTemplate.replace('{ideaId}', encodeURIComponent(ideaId))
}

function getIdeaLikePaths(ideaId: string) {
  return [
    '/v1/ideas/{ideaId}/likes/',
    '/v1/ideas/{ideaId}/like/',
    '/v1/ideas/{ideaId}/toggle-like/',
  ].map((path) => getFilledIdeaPath(path, ideaId))
}

function getIdeaCommentsPaths(ideaId: string) {
  return ['/v1/ideas/{ideaId}/comments/', '/v1/comments/ideas/{ideaId}/'].map((path) =>
    getFilledIdeaPath(path, ideaId),
  )
}

function getIdeaDeletePaths(ideaId: string) {
  return ['/v1/ideas/{ideaId}/', '/v1/ideas/{ideaId}'].map((path) =>
    getFilledIdeaPath(path, ideaId),
  )
}

function normalizeLikeResponse(response: LikeApiResponse | null, idea: Idea): IdeaLikeState {
  const nextLikedState =
    response?.is_liked ?? response?.isLiked ?? response?.liked ?? response?.liked_by_me ?? !idea.isLikedByCurrentUser
  const fallbackLikes = idea.likes + (nextLikedState ? 1 : -1)

  return {
    likes: Math.max(0, response?.likes_count ?? response?.likes ?? fallbackLikes),
    isLikedByCurrentUser: nextLikedState,
  }
}

function rememberIdeaComments(idea: IdeaApiRecord, normalizedIdea: Idea, fallbackAuthor: User) {
  if (!Array.isArray(idea.comments)) {
    return
  }

  localIdeaComments[normalizedIdea.id] = idea.comments
    .map((comment) => normalizeComment(comment, normalizedIdea.id, fallbackAuthor))
    .filter((comment) => comment.text)
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

  return ideas.map((idea) => {
    const normalizedIdea = normalizeIdea(
      idea,
      {
        title: idea.title ?? '',
        description: idea.description ?? '',
        cover_image_URL: null,
        tags: [],
      },
      fallbackAuthor,
    )

    rememberIdeaComments(idea, normalizedIdea, fallbackAuthor)

    return normalizedIdea
  })
}

async function getLocalCreatedIdea(
  payload: CreateIdeaPayload,
  author: User,
  selectedTags: string[] = [],
) {
  await waitForLocalResponse()

  return normalizeIdea({}, payload, author, selectedTags)
}

export const ideasApi = {
  getIdeas: (currentUser: User | null = null): Promise<Idea[]> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve(getLocalIdeas(currentUser))
    }

    return apiClient.get<IdeasApiResponse>('/v1/ideas').then(normalizeIdeasResponse)
  },
  getTags: async (): Promise<Tag[]> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve(getLocalTags())
    }

    let lastError: unknown = null

    for (const tagsPath of TAGS_PATHS) {
      try {
        const tags = await apiClient.get<TagsApiResponse>(tagsPath)

        return normalizeTagsResponse(tags)
      } catch (error) {
        lastError = error

        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          continue
        }

        throw error
      }
    }

    throw lastError
  },
  getIdeaComments: async (ideaId: string): Promise<IdeaComment[]> => {
    if (!apiClient.isConfigured) {
      await waitForLocalResponse()

      return localIdeaComments[ideaId] ?? []
    }

    let lastError: unknown = null
    const fallbackAuthor: User = {
      id: 'comment-author',
      username: 'Пользователь',
      email: '',
      avatar_URL: '',
      created_at: new Date().toISOString(),
    }

    for (const commentsPath of getIdeaCommentsPaths(ideaId)) {
      try {
        const response = await apiClient.get<CommentsApiResponse>(commentsPath)
        const comments = normalizeCommentsResponse(response, ideaId, fallbackAuthor)

        localIdeaComments[ideaId] = comments

        return comments
      } catch (error) {
        lastError = error

        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          continue
        }

        throw error
      }
    }

    if (lastError instanceof ApiError && (lastError.status === 404 || lastError.status === 405)) {
      return localIdeaComments[ideaId] ?? []
    }

    throw lastError
  },
  toggleIdeaLike: async (idea: Idea, currentUser: User): Promise<IdeaLikeState> => {
    if (!apiClient.isConfigured) {
      await waitForLocalResponse()

      const likedIdeaIds = getLocalLikedIdeaIds(currentUser)
      const wasLikedByCurrentUser = likedIdeaIds.has(idea.id)

      if (wasLikedByCurrentUser) {
        likedIdeaIds.delete(idea.id)
      } else {
        likedIdeaIds.add(idea.id)
      }

      return {
        likes: Math.max(0, idea.likes + (wasLikedByCurrentUser ? -1 : 1)),
        isLikedByCurrentUser: !wasLikedByCurrentUser,
      }
    }

    let lastError: unknown = null

    for (const likePath of getIdeaLikePaths(idea.id)) {
      try {
        const response = await apiClient.post<LikeApiResponse | null>(likePath, {})

        return normalizeLikeResponse(response, idea)
      } catch (error) {
        lastError = error

        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          continue
        }

        throw error
      }
    }

    throw lastError
  },
  createIdeaComment: async (ideaId: string, text: string, author: User): Promise<IdeaComment> => {
    const payload = { text: text.trim(), content: text.trim() }

    if (!apiClient.isConfigured) {
      await waitForLocalResponse()

      const comment = normalizeComment(
        {
          idea_id: ideaId,
          author,
          text: payload.text,
        },
        ideaId,
        author,
      )

      localIdeaComments[ideaId] = [...(localIdeaComments[ideaId] ?? []), comment]

      return comment
    }

    let lastError: unknown = null

    for (const commentsPath of getIdeaCommentsPaths(ideaId)) {
      try {
        const response = await apiClient.post<unknown>(commentsPath, payload)
        const comment = normalizeComment(getRawCreatedComment(response), ideaId, author)

        localIdeaComments[ideaId] = [...(localIdeaComments[ideaId] ?? []), comment]

        return comment
      } catch (error) {
        lastError = error

        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          continue
        }

        throw error
      }
    }

    throw lastError
  },
  deleteIdea: async (ideaId: string): Promise<void> => {
    if (!apiClient.isConfigured) {
      await waitForLocalResponse()
      delete localIdeaComments[ideaId]
      forgetLocalIdeaLikes(ideaId)
      const localIdeaIndex = localCreatedIdeas.findIndex((idea) => idea.id === ideaId)

      if (localIdeaIndex >= 0) {
        localCreatedIdeas.splice(localIdeaIndex, 1)
      }

      return
    }

    let lastError: unknown = null

    for (const deletePath of getIdeaDeletePaths(ideaId)) {
      try {
        await apiClient.delete<void>(deletePath)
        delete localIdeaComments[ideaId]
        forgetLocalIdeaLikes(ideaId)
        return
      } catch (error) {
        lastError = error

        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          continue
        }

        throw error
      }
    }

    throw lastError
  },
  createIdea: async (
    payload: CreateIdeaPayload,
    author: User,
    selectedTags: string[] = [],
  ): Promise<Idea> => {
    if (!apiClient.isConfigured) {
      const createdIdea = await getLocalCreatedIdea(payload, author, selectedTags)

      localCreatedIdeas.unshift(createdIdea)

      return createdIdea
    }

    const createdIdea = await apiClient.post<IdeaApiRecord>('/v1/ideas/', payload)

    return normalizeIdea(createdIdea, payload, author, selectedTags)
  },
}
