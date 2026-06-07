const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const ACCESS_TOKEN_KEY = 'auth_access_token'

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

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const text = await response.text()
      // Если тело пустое, вернуть null вместо попытки парсить JSON
      return text ? JSON.parse(text) : null
    } catch {
      // Если ошибка парсинга JSON, вернуть null
      return null
    }
  }

  return response.text()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Получить access token из localStorage и добавить в заголовок
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
    console.log('Token found, adding to request:', accessToken.substring(0, 20) + '...')
  } else {
    console.log('No token found in localStorage')
  }

  console.log('Making request to:', `${API_BASE_URL}${path}`)
  console.log('Headers:', headers)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
  const body = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError(response.statusText, response.status, body)
  }

  return body as T
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
