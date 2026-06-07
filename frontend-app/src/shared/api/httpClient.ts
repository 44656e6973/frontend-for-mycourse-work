import { tokenStorage } from './tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const TOKEN_REFRESH_PATHS = getTokenRefreshPaths()

type StoredTokens = {
  access: string
  refresh?: string
  tokenType?: 'Bearer' | 'Token'
}

let tokenRefreshPromise: Promise<string | null> | null = null

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function normalizeApiPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function getTokenRefreshPaths() {
  const paths = [
    import.meta.env.VITE_TOKEN_REFRESH_PATH,
    '/v1/auth/token/refresh/',
    '/v1/auth/refresh/',
    '/token/refresh/',
  ].filter((path): path is string => Boolean(path?.trim()))

  return Array.from(new Set(paths.map((path) => normalizeApiPath(path.trim()))))
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const text = await response.text()
      return text ? JSON.parse(text) : null
    } catch {
      return null
    }
  }

  return response.text()
}

function getBodyRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null
  }

  return body as Record<string, unknown>
}

function readString(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key]

  return typeof value === 'string' && value ? value : undefined
}

function readRecord(record: Record<string, unknown> | null, key: string) {
  return getBodyRecord(record?.[key])
}

function getAuthErrorDetail(body: unknown) {
  return readString(getBodyRecord(body), 'detail') ?? ''
}

function getAuthErrorCode(body: unknown) {
  return readString(getBodyRecord(body), 'code') ?? ''
}

function includesText(value: unknown, text: string): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase().includes(text)
  }

  if (Array.isArray(value)) {
    return value.some((item) => includesText(item, text))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => includesText(item, text))
  }

  return false
}

function isMissingCredentialsError(body: unknown) {
  return getAuthErrorDetail(body).toLowerCase().includes('credentials were not provided')
}

function isExpiredAccessTokenError(body: unknown) {
  const detail = getAuthErrorDetail(body).toLowerCase()
  const code = getAuthErrorCode(body)

  return (
    code === 'token_not_valid' ||
    detail.includes('token not valid') ||
    detail.includes('token is expired') ||
    detail.includes('token has expired') ||
    includesText(body, 'token is expired') ||
    includesText(body, 'token has expired')
  )
}

function getAlternateAuthorizationHeader(authorizationHeader: string, body: unknown) {
  if (!isMissingCredentialsError(body)) {
    return null
  }

  if (authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.replace(/^Bearer /, 'Token ')
  }

  if (authorizationHeader.startsWith('Token ')) {
    return authorizationHeader.replace(/^Token /, 'Bearer ')
  }

  return null
}

function getRequestHeaders(optionsHeaders: HeadersInit | undefined, authorizationHeader: string | null) {
  const headers = new Headers(optionsHeaders)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (authorizationHeader) {
    headers.set('Authorization', authorizationHeader)
  }

  return headers
}

function fetchWithAuthorization(
  requestUrl: string,
  options: RequestInit,
  authorizationHeader: string | null,
) {
  return fetch(requestUrl, {
    ...options,
    headers: getRequestHeaders(options.headers, authorizationHeader),
  })
}

function getTokenType(
  response: Record<string, unknown> | null,
  fallbackTokenType: StoredTokens['tokenType'],
) {
  const tokenType = readString(response, 'token_type')?.toLowerCase()

  if (tokenType === 'token' || readString(response, 'token') || readString(response, 'key')) {
    return 'Token'
  }

  if (tokenType === 'bearer') {
    return 'Bearer'
  }

  return fallbackTokenType ?? 'Bearer'
}

function getRefreshedTokens(body: unknown, fallbackTokens: StoredTokens): StoredTokens | null {
  const response = getBodyRecord(body)
  const nestedTokens = readRecord(response, 'tokens')
  const access =
    readString(nestedTokens, 'access') ??
    readString(response, 'access') ??
    readString(response, 'access_token') ??
    readString(response, 'auth_token') ??
    readString(response, 'token') ??
    readString(response, 'key')
  const nestedTokenType = readString(nestedTokens, 'tokenType')

  if (!access) {
    return null
  }

  return {
    access,
    refresh:
      readString(nestedTokens, 'refresh') ??
      readString(response, 'refresh') ??
      readString(response, 'refresh_token') ??
      fallbackTokens.refresh,
    tokenType:
      nestedTokenType === 'Token' || nestedTokenType === 'Bearer'
        ? nestedTokenType
        : getTokenType(response, fallbackTokens.tokenType),
  }
}

async function refreshStoredTokens() {
  const tokens = tokenStorage.getTokens()

  if (!tokens?.refresh) {
    tokenStorage.clearTokens()
    return null
  }

  for (const refreshPath of TOKEN_REFRESH_PATHS) {
    try {
      const response = await fetch(`${API_BASE_URL}${refreshPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })
      const body = await parseResponseBody(response)

      if (response.ok) {
        const refreshedTokens = getRefreshedTokens(body, tokens)

        if (!refreshedTokens) {
          continue
        }

        tokenStorage.setTokens(refreshedTokens)

        return tokenStorage.getAuthorizationHeader()
      }

      if (response.status === 404 || response.status === 405) {
        continue
      }

      break
    } catch {
      return null
    }
  }

  tokenStorage.clearTokens()
  return null
}

function refreshAuthorizationHeader() {
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = refreshStoredTokens().finally(() => {
      tokenRefreshPromise = null
    })
  }

  return tokenRefreshPromise
}

function saveAuthorizationScheme(authorizationHeader: string) {
  const tokens = tokenStorage.getTokens()

  if (!tokens) {
    return
  }

  tokenStorage.setTokens({
    ...tokens,
    tokenType: authorizationHeader.startsWith('Token ') ? 'Token' : 'Bearer',
  })
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const requestUrl = `${API_BASE_URL}${path}`
  const authorizationHeader = tokenStorage.getAuthorizationHeader()
  let response = await fetchWithAuthorization(requestUrl, options, authorizationHeader)
  let body = await parseResponseBody(response)

  if (response.ok) {
    return body as T
  }

  if (response.status === 401 && authorizationHeader) {
    const alternateAuthorizationHeader = getAlternateAuthorizationHeader(authorizationHeader, body)

    if (alternateAuthorizationHeader) {
      const retryResponse = await fetchWithAuthorization(requestUrl, options, alternateAuthorizationHeader)

      body = await parseResponseBody(retryResponse)

      if (retryResponse.ok) {
        saveAuthorizationScheme(alternateAuthorizationHeader)
        return body as T
      }

      response = retryResponse
    }
  }

  if (response.status === 401 && authorizationHeader && isExpiredAccessTokenError(body)) {
    const refreshedAuthorizationHeader = await refreshAuthorizationHeader()

    if (refreshedAuthorizationHeader) {
      const retryResponse = await fetchWithAuthorization(requestUrl, options, refreshedAuthorizationHeader)

      body = await parseResponseBody(retryResponse)

      if (retryResponse.ok) {
        return body as T
      }

      response = retryResponse
    }
  }

  throw new ApiError(response.statusText, response.status, body)
}

export const apiClient = {
  isConfigured: API_BASE_URL.length > 0,
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
}
