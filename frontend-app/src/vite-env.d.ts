/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_TOKEN_REFRESH_PATH?: string
  readonly VITE_USER_PROFILE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
