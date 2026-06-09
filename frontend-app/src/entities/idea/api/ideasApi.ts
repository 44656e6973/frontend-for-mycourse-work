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
      tag_id?: string | number
      name?: string
      tag?: string | number | { id?: string | number; name?: string; title?: string; label?: string }
      title?: string
      label?: string
      value?: string | number
    }

type RawLikeUser =
  | User
  | string
  | number
  | {
      id?: string | number
      user_id?: string | number
      author_id?: string | number
      profile_id?: string | number
      username?: string
      user_username?: string
      email?: string
      user_email?: string
      user?: User | string | number
      author?: User | string | number
    }

type LikeStateFields = Partial<{
  likes_count: number
  likes: number | RawLikeUser[]
  is_liked: boolean
  isLiked: boolean
  liked: boolean
  liked_by_me: boolean
  is_liked_by_current_user: boolean
  liked_by_current_user: boolean
  is_liked_by_user: boolean
  user_liked: boolean
  liked_by: RawLikeUser[]
  liked_users: RawLikeUser[]
  liked_by_users: RawLikeUser[]
}>

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

type IdeaApiRecord = LikeStateFields & Partial<{
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
  comments_count: number
  comments: number | RawComment[]
  author: User | string | number
  role: string
  tags: IdeaApiTag[]
  tag_ids: IdeaApiTag[]
  tag_names: IdeaApiTag[]
  tags_data: IdeaApiTag[]
  tag_objects: IdeaApiTag[]
  labels: IdeaApiTag[]
}>

type LikeApiResponse = LikeStateFields

type IdeaLikeState = {
  likes: number
  isLikedByCurrentUser: boolean
}

const FALLBACK_CATEGORY: IdeaCategory = 'UI/UX'
const DEFAULT_CREATED_IDEA_STATUS = 'draft'
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const TAGS_PATHS = getTagsPaths()
const LOCAL_LIKED_IDEA_IDS_KEY = 'idea_liked_ids_by_user'
const LOCAL_IDEA_LIKE_STATES_KEY = 'idea_like_states_by_user'
const LOCAL_IDEA_TAGS_KEY = 'idea_tags_by_id'
const localIdeaComments: Record<string, IdeaComment[]> = {}
const localCreatedIdeas: Idea[] = []
const localTagNamesById = new Map<string, string>()
const localIdeaTagsById = readLocalIdeaTagsById()
const localLikedIdeaIdsByUser = readLocalLikedIdeaIdsByUser()
const localIdeaLikeStatesByUser = readLocalIdeaLikeStatesByUser()

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
      name: localTagNamesById.get(String(tag)) ?? String(tag),
    }
  }

  if (tag.tag && typeof tag.tag === 'object') {
    const nestedTagName = tag.tag.name ?? tag.tag.title ?? tag.tag.label ?? String(tag.tag.id ?? '')

    return {
      id: tag.id ?? tag.tag_id ?? tag.tag.id ?? nestedTagName,
      name: nestedTagName,
    }
  }

  if (tag.tag && (typeof tag.tag === 'string' || typeof tag.tag === 'number')) {
    return {
      id: tag.id ?? tag.tag_id ?? tag.tag,
      name: localTagNamesById.get(String(tag.tag)) ?? String(tag.tag),
    }
  }

  const tagId = tag.id ?? tag.tag_id ?? tag.value
  const name =
    tag.name ??
    tag.title ??
    tag.label ??
    (tagId !== undefined ? localTagNamesById.get(String(tagId)) : undefined) ??
    String(tagId ?? '')

  return {
    id: tag.id ?? tag.tag_id ?? name,
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
    localTagNamesById.set(String(tag.id), tag.name)
    return true
  })
}

function getLocalTags() {
  return normalizeTagsResponse([...localCreatedIdeas, ...mockIdeas].flatMap((idea) => idea.tags))
}

function readLocalIdeaTagsById() {
  try {
    const rawIdeaTags = localStorage.getItem(LOCAL_IDEA_TAGS_KEY)

    if (!rawIdeaTags) {
      return new Map<string, string[]>()
    }

    const parsedIdeaTags = JSON.parse(rawIdeaTags) as unknown

    if (!parsedIdeaTags || typeof parsedIdeaTags !== 'object' || Array.isArray(parsedIdeaTags)) {
      return new Map<string, string[]>()
    }

    return new Map(
      Object.entries(parsedIdeaTags)
        .filter(([, tags]) => Array.isArray(tags))
        .map(([ideaId, tags]) => [ideaId, (tags as unknown[]).map(String).filter(Boolean)]),
    )
  } catch {
    return new Map<string, string[]>()
  }
}

function persistLocalIdeaTagsById() {
  try {
    const payload: Record<string, string[]> = {}

    localIdeaTagsById.forEach((tags, ideaId) => {
      if (tags.length > 0) {
        payload[ideaId] = tags
      }
    })

    localStorage.setItem(LOCAL_IDEA_TAGS_KEY, JSON.stringify(payload))
  } catch {
    return
  }
}

function rememberLocalIdeaTags(ideaId: string, tags: string[]) {
  const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean)

  if (normalizedTags.length === 0) {
    return
  }

  localIdeaTagsById.set(ideaId, normalizedTags)
  persistLocalIdeaTagsById()
}

function readLocalLikedIdeaIdsByUser() {
  const likedIdeaIdsByUser = new Map<string, Set<string>>()

  try {
    const rawLikes = localStorage.getItem(LOCAL_LIKED_IDEA_IDS_KEY)

    if (!rawLikes) {
      return likedIdeaIdsByUser
    }

    const parsedLikes = JSON.parse(rawLikes) as unknown

    if (!parsedLikes || typeof parsedLikes !== 'object' || Array.isArray(parsedLikes)) {
      return likedIdeaIdsByUser
    }

    Object.entries(parsedLikes).forEach(([userKey, ideaIds]) => {
      if (Array.isArray(ideaIds)) {
        likedIdeaIdsByUser.set(userKey, new Set(ideaIds.map(String)))
      }
    })
  } catch {
    return likedIdeaIdsByUser
  }

  return likedIdeaIdsByUser
}

function persistLocalLikedIdeaIdsByUser() {
  try {
    const payload: Record<string, string[]> = {}

    localLikedIdeaIdsByUser.forEach((likedIdeaIds, userKey) => {
      if (likedIdeaIds.size > 0) {
        payload[userKey] = Array.from(likedIdeaIds)
      }
    })

    localStorage.setItem(LOCAL_LIKED_IDEA_IDS_KEY, JSON.stringify(payload))
  } catch {
    return
  }
}

function readLocalIdeaLikeStatesByUser() {
  const likeStatesByUser = new Map<string, Map<string, IdeaLikeState>>()

  try {
    const rawLikeStates = localStorage.getItem(LOCAL_IDEA_LIKE_STATES_KEY)

    if (!rawLikeStates) {
      return likeStatesByUser
    }

    const parsedLikeStates = JSON.parse(rawLikeStates) as unknown

    if (!parsedLikeStates || typeof parsedLikeStates !== 'object' || Array.isArray(parsedLikeStates)) {
      return likeStatesByUser
    }

    Object.entries(parsedLikeStates).forEach(([userKey, rawUserLikeStates]) => {
      if (!rawUserLikeStates || typeof rawUserLikeStates !== 'object' || Array.isArray(rawUserLikeStates)) {
        return
      }

      const userLikeStates = new Map<string, IdeaLikeState>()

      Object.entries(rawUserLikeStates).forEach(([ideaId, rawLikeState]) => {
        if (!rawLikeState || typeof rawLikeState !== 'object' || Array.isArray(rawLikeState)) {
          return
        }

        const likeState = rawLikeState as Partial<IdeaLikeState>

        if (typeof likeState.likes === 'number' && typeof likeState.isLikedByCurrentUser === 'boolean') {
          userLikeStates.set(ideaId, {
            likes: Math.max(0, likeState.likes),
            isLikedByCurrentUser: likeState.isLikedByCurrentUser,
          })
        }
      })

      if (userLikeStates.size > 0) {
        likeStatesByUser.set(userKey, userLikeStates)
      }
    })
  } catch {
    return likeStatesByUser
  }

  return likeStatesByUser
}

function persistLocalIdeaLikeStatesByUser() {
  try {
    const payload: Record<string, Record<string, IdeaLikeState>> = {}

    localIdeaLikeStatesByUser.forEach((userLikeStates, userKey) => {
      const serializedUserLikeStates: Record<string, IdeaLikeState> = {}

      userLikeStates.forEach((likeState, ideaId) => {
        serializedUserLikeStates[ideaId] = likeState
      })

      if (Object.keys(serializedUserLikeStates).length > 0) {
        payload[userKey] = serializedUserLikeStates
      }
    })

    localStorage.setItem(LOCAL_IDEA_LIKE_STATES_KEY, JSON.stringify(payload))
  } catch {
    return
  }
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

function getLocalIdeaLikeStates(user: User) {
  const userKey = getLocalUserKey(user)
  const userLikeStates = localIdeaLikeStatesByUser.get(userKey)

  if (userLikeStates) {
    return userLikeStates
  }

  const nextUserLikeStates = new Map<string, IdeaLikeState>()

  localIdeaLikeStatesByUser.set(userKey, nextUserLikeStates)

  return nextUserLikeStates
}

function getLocalIdeaLikeState(ideaId: string, user: User | null) {
  return user ? getLocalIdeaLikeStates(user).get(ideaId) ?? null : null
}

function rememberLocalIdeaLikeState(ideaId: string, user: User, likeState: IdeaLikeState) {
  const likedIdeaIds = getLocalLikedIdeaIds(user)
  const userLikeStates = getLocalIdeaLikeStates(user)

  if (likeState.isLikedByCurrentUser) {
    likedIdeaIds.add(ideaId)
  } else {
    likedIdeaIds.delete(ideaId)
  }

  userLikeStates.set(ideaId, likeState)
  persistLocalLikedIdeaIdsByUser()
  persistLocalIdeaLikeStatesByUser()
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
  localIdeaLikeStatesByUser.forEach((userLikeStates) => {
    userLikeStates.delete(ideaId)
  })
  persistLocalLikedIdeaIdsByUser()
  persistLocalIdeaLikeStatesByUser()
}

function getLocalIdeas(currentUser: User | null = null) {
  return [...localCreatedIdeas, ...mockIdeas].map((idea) => ({
    ...idea,
    likes: idea.likes + getLocalLikesCount(idea.id),
    isLikedByCurrentUser: isIdeaLikedLocallyByUser(idea.id, currentUser),
  }))
}

function getIdeaApiTags(apiIdea: IdeaApiRecord) {
  const tagSources = [
    apiIdea.tags,
    apiIdea.tag_names,
    apiIdea.tags_data,
    apiIdea.tag_objects,
    apiIdea.labels,
    apiIdea.tag_ids,
  ]

  return tagSources.find((tags) => Array.isArray(tags) && tags.length > 0)
}

function normalizeIdeaTags(apiTags: IdeaApiTag[] | undefined, fallbackTags: string[]) {
  const tags = apiTags?.map((tag) => normalizeTag(tag).name)

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

function normalizeComparableValue(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  return String(value).trim().toLocaleLowerCase('ru-RU')
}

function getUserCompareValues(user: User) {
  return [user.id, user.username, user.email]
    .map(normalizeComparableValue)
    .filter((value): value is string => Boolean(value))
}

function isRawLikeByUser(rawLike: RawLikeUser, currentUser: User | null) {
  if (!currentUser) {
    return false
  }

  const userCompareValues = getUserCompareValues(currentUser)

  if (typeof rawLike === 'string' || typeof rawLike === 'number') {
    const rawLikeValue = normalizeComparableValue(rawLike)

    return rawLikeValue ? userCompareValues.includes(rawLikeValue) : false
  }

  const rawLikeRecord = rawLike as Record<string, unknown>

  if (rawLikeRecord.user && isRawLikeByUser(rawLikeRecord.user as RawLikeUser, currentUser)) {
    return true
  }

  if (rawLikeRecord.author && isRawLikeByUser(rawLikeRecord.author as RawLikeUser, currentUser)) {
    return true
  }

  return [
    rawLikeRecord.id,
    rawLikeRecord.user_id,
    rawLikeRecord.author_id,
    rawLikeRecord.profile_id,
    rawLikeRecord.username,
    rawLikeRecord.user_username,
    rawLikeRecord.email,
    rawLikeRecord.user_email,
  ]
    .map(normalizeComparableValue)
    .some((value) => Boolean(value && userCompareValues.includes(value)))
}

function getLikeUsers(likeState: LikeStateFields) {
  return (
    likeState.liked_by ??
    likeState.liked_users ??
    likeState.liked_by_users ??
    (Array.isArray(likeState.likes) ? likeState.likes : null)
  )
}

function getExplicitLikedState(likeState: LikeStateFields) {
  return (
    likeState.is_liked ??
    likeState.isLiked ??
    likeState.liked ??
    likeState.liked_by_me ??
    likeState.is_liked_by_current_user ??
    likeState.liked_by_current_user ??
    likeState.is_liked_by_user ??
    likeState.user_liked
  )
}

function getLikesCountFromSource(likeState: LikeStateFields) {
  if (typeof likeState.likes_count === 'number') {
    return likeState.likes_count
  }

  if (typeof likeState.likes === 'number') {
    return likeState.likes
  }

  const likeUsers = getLikeUsers(likeState)

  return likeUsers ? likeUsers.length : null
}

function getLikesCount(likeState: LikeStateFields) {
  return getLikesCountFromSource(likeState) ?? 0
}

function getLikedState(likeState: LikeStateFields, currentUser: User | null = null) {
  const explicitLikedState = getExplicitLikedState(likeState)

  if (explicitLikedState !== undefined) {
    return explicitLikedState
  }

  const likeUsers = getLikeUsers(likeState)

  return likeUsers ? likeUsers.some((rawLike) => isRawLikeByUser(rawLike, currentUser)) : false
}

function normalizeIdea(
  apiIdea: IdeaApiRecord,
  payload: CreateIdeaPayload,
  author: User,
  selectedTags: string[] = [],
  currentUser: User | null = null,
): Idea {
  const title = apiIdea.title?.trim() || payload.title
  const description = apiIdea.description?.trim() || payload.description
  const status = apiIdea.status ?? DEFAULT_CREATED_IDEA_STATUS
  const id = String(apiIdea.id ?? globalThis.crypto?.randomUUID?.() ?? `idea-${Date.now()}`)
  const tags = normalizeIdeaTags(getIdeaApiTags(apiIdea), selectedTags)

  return {
    id,
    title,
    previewTitle: apiIdea.previewTitle ?? title,
    description,
    category: apiIdea.category ?? FALLBACK_CATEGORY,
    tags: tags.length > 0 ? tags : localIdeaTagsById.get(id) ?? [],
    author: normalizeAuthor(apiIdea.author, author),
    role: apiIdea.role ?? 'Автор идеи',
    likes: getLikesCount(apiIdea),
    comments: getCommentsCount(apiIdea),
    isLikedByCurrentUser: getLikedState(apiIdea, currentUser),
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

function normalizeLikeResponse(response: LikeApiResponse | null, idea: Idea, currentUser: User): IdeaLikeState {
  const explicitLikedState = response ? getExplicitLikedState(response) : undefined
  const likeUsers = response ? getLikeUsers(response) : null
  const nextLikedState =
    explicitLikedState ??
    (likeUsers ? likeUsers.some((rawLike) => isRawLikeByUser(rawLike, currentUser)) : !idea.isLikedByCurrentUser)
  const fallbackLikes = idea.likes + (nextLikedState ? 1 : -1)

  return {
    likes: Math.max(0, (response ? getLikesCountFromSource(response) : null) ?? fallbackLikes),
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

function applyLocalLikeFallback(apiIdea: IdeaApiRecord, normalizedIdea: Idea, currentUser: User | null) {
  const localLikeState = getLocalIdeaLikeState(normalizedIdea.id, currentUser)

  if (!localLikeState || getExplicitLikedState(apiIdea) !== undefined || getLikeUsers(apiIdea)) {
    return normalizedIdea
  }

  return {
    ...normalizedIdea,
    likes: localLikeState.likes,
    isLikedByCurrentUser: localLikeState.isLikedByCurrentUser,
  }
}

function rememberIdeaTags(normalizedIdea: Idea) {
  rememberLocalIdeaTags(normalizedIdea.id, normalizedIdea.tags)
}

function normalizeIdeasResponse(response: IdeasApiResponse, currentUser: User | null = null): Idea[] {
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
      [],
      currentUser,
    )

    const ideaWithLocalLikeFallback = applyLocalLikeFallback(idea, normalizedIdea, currentUser)

    rememberIdeaTags(ideaWithLocalLikeFallback)
    rememberIdeaComments(idea, ideaWithLocalLikeFallback, fallbackAuthor)

    return ideaWithLocalLikeFallback
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

    return apiClient
      .get<IdeasApiResponse>('/v1/ideas')
      .then((response) => normalizeIdeasResponse(response, currentUser))
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
      rememberLocalIdeaLikeState(idea.id, currentUser, {
        likes: Math.max(0, idea.likes + (wasLikedByCurrentUser ? -1 : 1)),
        isLikedByCurrentUser: !wasLikedByCurrentUser,
      })

      return {
        likes: Math.max(0, idea.likes + (wasLikedByCurrentUser ? -1 : 1)),
        isLikedByCurrentUser: !wasLikedByCurrentUser,
      }
    }

    let lastError: unknown = null

    for (const likePath of getIdeaLikePaths(idea.id)) {
      try {
        const response = await apiClient.post<LikeApiResponse | null>(likePath, {})
        const likeState = normalizeLikeResponse(response, idea, currentUser)

        rememberLocalIdeaLikeState(idea.id, currentUser, likeState)

        return likeState
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

      rememberIdeaTags(createdIdea)
      localCreatedIdeas.unshift(createdIdea)

      return createdIdea
    }

    const apiPayload = {
      ...payload,
      tag_ids: payload.tags,
      tag_names: selectedTags,
    }
    const createdIdea = await apiClient.post<IdeaApiRecord>('/v1/ideas/', apiPayload)
    const normalizedIdea = normalizeIdea(createdIdea, payload, author, selectedTags)

    rememberIdeaTags(normalizedIdea)

    return normalizedIdea
  },
}
