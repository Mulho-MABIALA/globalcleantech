/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WHATSAPP_NUMBER: string
  readonly VITE_FACEBOOK_URL: string
  readonly VITE_TWITTER_URL: string
  readonly VITE_INFO_SITE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
