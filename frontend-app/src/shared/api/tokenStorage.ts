import { type AuthTokens } from '../../entities/user'

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const AUTH_SCHEME_KEY = 'auth_scheme'
export const AUTH_TOKENS_CHANGED_EVENT = 'auth-tokens-changed'

function emitTokenStorageChange(hasTokens: boolean) {
  window.dispatchEvent(
    new CustomEvent(AUTH_TOKENS_CHANGED_EVENT, {
      detail: { hasTokens },
    }),
  )
}

export const tokenStorage = {
  // Сохранить токены
  setTokens: (tokens: AuthTokens) => {
    if (!tokens.access) {
      return
    }

    const authScheme = tokens.tokenType ?? 'Bearer'

    console.log('Saving tokens to localStorage')
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
    localStorage.setItem(AUTH_SCHEME_KEY, authScheme)
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    emitTokenStorageChange(true)
    console.log('Tokens saved. Access token:', tokens.access.substring(0, 20) + '...')
  },

  // Получить access token
  getAccessToken: (): string | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    console.log('Getting access token from localStorage:', token ? token.substring(0, 20) + '...' : 'null')
    return token
  },

  // Получить refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  // Получить оба токена
  getTokens: (): AuthTokens | null => {
    const access = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    const tokenType = localStorage.getItem(AUTH_SCHEME_KEY) === 'Token' ? 'Token' : 'Bearer'

    if (!access) {
      return null
    }

    return { access, refresh: refresh ?? undefined, tokenType }
  },

  getAuthorizationHeader: (): string | null => {
    const tokens = tokenStorage.getTokens()

    if (!tokens?.access) {
      return null
    }

    return `${tokens.tokenType ?? 'Bearer'} ${tokens.access}`
  },

  // Очистить токены
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(AUTH_SCHEME_KEY)
    emitTokenStorageChange(false)
  },

  // Проверить наличие токенов
  hasTokens: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
  },
}
