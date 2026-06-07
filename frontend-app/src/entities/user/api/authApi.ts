import { apiClient } from '../../../shared/api/httpClient'
import { tokenStorage } from '../../../shared/api/tokenStorage'
import {
  type AuthResponse,
  type AuthTokens,
  type LoginCredentials,
  type RegisterCredentials,
  type User,
} from '../model/types'

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
  await new Promise((resolve) => {
    window.setTimeout(resolve, 350)
  })

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
