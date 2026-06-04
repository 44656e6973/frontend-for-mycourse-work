import { apiClient } from '../../../shared/api/httpClient'
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
  login: (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (!apiClient.isConfigured) {
      return getLocalAuthResponse(createLocalUser(credentials.email))
    }

    return apiClient.post<AuthResponse>('/v1/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    })
  },
  register: (credentials: RegisterCredentials): Promise<AuthResponse> => {
    if (!apiClient.isConfigured) {
      return getLocalAuthResponse(createLocalUser(credentials.email, credentials.username))
    }

    return apiClient.post<AuthResponse>('/v1/auth/register/', credentials)
    
  },
}
