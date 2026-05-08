export const useRouter = () => ({
  push: (_url: string) => {},
  replace: (_url: string) => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: (_url: string) => {},
})

export const usePathname = () => '/'

export const useSearchParams = () => new URLSearchParams()

export const useParams = () => ({})

export const redirect = (_url: string): never => {
  throw new Error(`redirect() called with: ${_url}`)
}

export const notFound = (): never => {
  throw new Error('notFound() called')
}

export type ReadonlyURLSearchParams = URLSearchParams
