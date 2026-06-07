import { type AuthTokens } from '../../entities/user'

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

export const tokenStorage = {
  // Сохранить токены
  setTokens: (tokens: AuthTokens) => {
    console.log('Saving tokens to localStorage')
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
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

    if (!access || !refresh) {
      return null
    }

    return { access, refresh }
  },

  // Очистить токены
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  // Проверить наличие токенов
  hasTokens: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY) && !!localStorage.getItem(REFRESH_TOKEN_KEY)
  },
}
