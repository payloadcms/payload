export type CookieStore = {
  get: (name: string) => { name: string; value: string } | null | undefined
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
