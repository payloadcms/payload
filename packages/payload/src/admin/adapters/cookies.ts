export type CookieStore = {
  get: (name: string) => null | undefined | { name: string; value: string }
  getAll?: () => Array<{ name: string; value: string }>
  set?: (name: string, value: string, options?: CookieOptions) => void
}

export type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'lax' | 'none' | 'strict'
  secure?: boolean
}
