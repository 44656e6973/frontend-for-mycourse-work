import { apiClient } from '../../../shared/api/httpClient'
import { tokenStorage } from '../../../shared/api/tokenStorage'
import {
  type AuthResponse,
  type LoginCredentials,
  type RegisterCredentials,
  type User,
} from '../model/types'

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
      refresh: 'local-access-token',
      access: 'local-refresh-token',
    },
  }
}

async function getLocalAuthResponse(user: User) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 350)
  })

  return createLocalAuthResponse(user)
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (!apiClient.isConfigured) {
      return getLocalAuthResponse(createLocalUser(credentials.email))
    }

    const response = await apiClient.post<AuthResponse>('/v1/auth/login/', {
      email: credentials.email.trim(),
      password: credentials.password,
    })
    
    console.log('Login response:', response)
    return response
  },
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    if (!apiClient.isConfigured) {
      return getLocalAuthResponse(createLocalUser(credentials.email, credentials.username))
    }

    const response = await apiClient.post<AuthResponse>('/v1/auth/register/', credentials)
    console.log('Register response:', response)
    return response
    
  },
  logout: async (): Promise<void> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve()
    }

    const tokens = tokenStorage.getTokens()
    if (!tokens?.access) {
      return Promise.resolve()
    }

    await apiClient.post<void>('/v1/auth/logout/', { refresh: tokens.refresh })
    console.log('Logout response: success')
  },
}
