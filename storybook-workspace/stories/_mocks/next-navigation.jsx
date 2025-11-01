// Mock Next.js navigation hooks for Storybook
console.log('Loading mock next/navigation')

// Mock useRouter hook - this is the main one causing issues
export function useRouter() {
  console.log('Mock useRouter called')
  return {
    push: (url, options) => {
      console.log('Mock router.push:', url, options)
      return Promise.resolve(true)
    },
    replace: (url, options) => {
      console.log('Mock router.replace:', url, options)
      return Promise.resolve(true)
    },
    back: () => {
      console.log('Mock router.back')
    },
    forward: () => {
      console.log('Mock router.forward')
    },
    refresh: () => {
      console.log('Mock router.refresh')
    },
    prefetch: (url) => {
      console.log('Mock router.prefetch:', url)
      return Promise.resolve()
    },
    pathname: '/mock-path',
    searchParams: new URLSearchParams(),
    query: {},
    asPath: '/mock-path',
    route: '/mock-path',
    basePath: '',
    isReady: true,
    isPreview: false,
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
  }
}

// Mock usePathname hook
export const usePathname = () => '/mock-path'

// Mock useSearchParams hook
export const useSearchParams = () => new URLSearchParams()

// Mock useParams hook
export const useParams = () => ({})

// Mock other navigation hooks
export const useSelectedLayoutSegment = () => null
export const useSelectedLayoutSegments = () => []
export const notFound = () => {
  throw new Error('Mock notFound called')
}
export const redirect = (url) => {
  console.log('Mock redirect called:', url)
  throw new Error(`Mock redirect to ${url}`)
}
export const permanentRedirect = (url) => {
  console.log('Mock permanentRedirect called:', url)
  throw new Error(`Mock permanentRedirect to ${url}`)
}