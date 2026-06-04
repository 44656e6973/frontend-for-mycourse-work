export type User = {
  id: string
  username: string
  email: string
  avatar_URL?: string
  created_at: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  username: string
  email: string
  password: string
}

export type AuthTokens = {
  refresh: string
  access: string
}

export type AuthResponse = {
  user: User
  tokens: AuthTokens
}
