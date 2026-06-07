import { ApiError, apiClient } from '../../../shared/api/httpClient'
import { tokenStorage } from '../../../shared/api/tokenStorage'
import {
  type AuthResponse,
  type AuthTokens,
  type LoginCredentials,
  type RegisterCredentials,
  type UpdateUserPayload,
  type User,
} from '../model/types'

const USER_PROFILE_PATHS = getUserProfilePaths()

type RawAuthResponse = Partial<AuthResponse> & {
  access?: string
  access_token?: string
  auth_token?: string
  key?: string
  refresh?: string
  refresh_token?: string
  token?: string
  token_type?: string
}

type RawUser = Partial<Omit<User, 'id' | 'avatar_URL'>> & {
  id?: string | number
  avatar_URL?: string | null
  avatar_url?: string | null
}

function normalizeApiPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function getUserProfilePaths() {
  const paths = [
    import.meta.env.VITE_USER_PROFILE_PATH,
    '/v1/auth/user/',
    '/v1/users/me/',
    '/v1/user/me/',
    '/v1/profile/',
  ].filter((path): path is string => Boolean(path?.trim()))

  return Array.from(new Set(paths.map((path) => normalizeApiPath(path.trim()))))
}

function waitForLocalResponse() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 350)
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getRawUser(response: unknown): RawUser {
  if (!isRecord(response)) {
    return {}
  }

  if (isRecord(response.user)) {
    return response.user as RawUser
  }

  return response as RawUser
}

function normalizeUserResponse(response: unknown, fallbackUser: User): User {
  const rawUser = getRawUser(response)

  return {
    id: String(rawUser.id ?? fallbackUser.id),
    username: rawUser.username ?? fallbackUser.username,
    email: rawUser.email ?? fallbackUser.email,
    avatar_URL: rawUser.avatar_URL ?? rawUser.avatar_url ?? fallbackUser.avatar_URL ?? '',
    created_at: rawUser.created_at ?? fallbackUser.created_at,
  }
}

function createLocalUser(email: string, username?: string): User {
  const fallbackUsername = email.split('@')[0] || 'Пользователь'

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`,
    username: username?.trim() || fallbackUsername,
    email,
    avatar_URL: '',
    created_at: new Date().toISOString(),
  }
}

function createLocalAuthResponse(user: User): AuthResponse {
  return {
    user,
    tokens: {
      access: 'local-access-token',
      refresh: 'local-refresh-token',
      tokenType: 'Bearer',
    },
  }
}

async function getLocalAuthResponse(user: User) {
  await waitForLocalResponse()

  return createLocalAuthResponse(user)
}

function normalizeTokenType(response: RawAuthResponse): AuthTokens['tokenType'] {
  if (response.token_type?.toLowerCase() === 'token' || response.token || response.key || response.auth_token) {
    return 'Token'
  }

  return 'Bearer'
}

function normalizeAuthResponse(response: RawAuthResponse, fallbackUser: User): AuthResponse {
  const access =
    response.tokens?.access ??
    response.access ??
    response.access_token ??
    response.auth_token ??
    response.token ??
    response.key
  const refresh = response.tokens?.refresh ?? response.refresh ?? response.refresh_token

  return {
    user: response.user ?? fallbackUser,
    tokens: access
      ? {
          access,
          refresh,
          tokenType: response.tokens?.tokenType ?? normalizeTokenType(response),
        }
      : response.tokens ?? {
          access: '',
          tokenType: 'Bearer',
        },
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const fallbackUser = createLocalUser(credentials.email)

    if (!apiClient.isConfigured) {
      return getLocalAuthResponse(fallbackUser)
    }

    const response = await apiClient.post<RawAuthResponse>('/v1/auth/login/', {
      email: credentials.email.trim(),
      password: credentials.password,
    })
    
    console.log('Login response:', response)
    return normalizeAuthResponse(response, fallbackUser)
  },
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const fallbackUser = createLocalUser(credentials.email, credentials.username)

    if (!apiClient.isConfigured) {
      return getLocalAuthResponse(fallbackUser)
    }

    const response = await apiClient.post<RawAuthResponse>('/v1/auth/register/', credentials)
    console.log('Register response:', response)
    return normalizeAuthResponse(response, fallbackUser)
    
  },
  updateProfile: async (currentUser: User, payload: UpdateUserPayload): Promise<User> => {
    const normalizedPayload = {
      username: payload.username.trim(),
      email: payload.email.trim(),
      avatar_URL: payload.avatar_URL || null,
      ...(payload.password ? { password: payload.password } : {}),
    }

    if (!apiClient.isConfigured) {
      await waitForLocalResponse()

      return {
        ...currentUser,
        username: normalizedPayload.username,
        email: normalizedPayload.email,
        avatar_URL: normalizedPayload.avatar_URL ?? '',
      }
    }

    let lastError: unknown = null

    for (const profilePath of USER_PROFILE_PATHS) {
      try {
        const response = await apiClient.patch<unknown>(profilePath, normalizedPayload)

        return normalizeUserResponse(response, currentUser)
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
  logout: async (): Promise<void> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve()
    }

    const tokens = tokenStorage.getTokens()
    if (!tokens?.access || !tokens.refresh) {
      return Promise.resolve()
    }

    await apiClient.post<void>('/v1/auth/logout/', { refresh: tokens.refresh })
    console.log('Logout response: success')
  },
}
