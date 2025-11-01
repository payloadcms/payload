import React, { createContext, useContext } from 'react'

// Import the real ModalProvider and ModalContainer from @faceless-ui/modal
import { ModalProvider, ModalContainer } from '@faceless-ui/modal'

// Mock Next.js Router Context
const RouterContext = createContext(null)

// Mock Next.js Link component
export const MockLink = ({ 
  children, 
  href, 
  onClick, 
  ...props 
}: {
  children: React.ReactNode
  href: string | object
  onClick?: (e: any) => void
  [key: string]: any
}) => {
  return (
    <a
      href={typeof href === 'string' ? href : '#mock-link'}
      onClick={(e) => {
        e.preventDefault()
        if (onClick) onClick(e)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

// Mock Next.js Router
export const mockRouter = {
  push: (url: string, options?: any) => {
    console.log('Mock router.push:', url, options)
    return Promise.resolve(true)
  },
  replace: (url: string, options?: any) => {
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
  prefetch: (url: string) => {
    console.log('Mock router.prefetch:', url)
    return Promise.resolve()
  },
  pathname: '/mock-path',
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

// Mock Translation Context
const MockTranslationContext = createContext({
  t: (key: string, options?: any) => key,
  i18n: { language: 'en' }
})

export const MockTranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const mockT = (key: string) => {
    // Return the key or a default translation
    const translations: Record<string, string> = {
      'general:loading': 'Loading...',
      'general:creating': 'Creating...',
      'general:updating': 'Updating...',
      'general:save': 'Save',
      'general:cancel': 'Cancel',
      'general:edit': 'Edit',
      'general:delete': 'Delete',
    }
    return translations[key] || key
  }

  return (
    <MockTranslationContext.Provider value={{ 
      t: mockT, 
      i18n: { language: 'en' } 
    }}>
      {children}
    </MockTranslationContext.Provider>
  )
}

// Mock Config Context
const MockConfigContext = createContext({
  config: {
    admin: { user: 'users' },
    localization: { defaultLocale: 'en', locales: ['en'] },
    routes: { admin: '/admin' }
  }
})

export const MockConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const mockConfig = {
    admin: { user: 'users' },
    localization: { 
      defaultLocale: 'en', 
      locales: [{ label: 'English', code: 'en' }] 
    },
    routes: { admin: '/admin' }
  }

  return (
    <MockConfigContext.Provider value={{ config: mockConfig }}>
      {children}
    </MockConfigContext.Provider>
  )
}

// Mock Locale Context
const MockLocaleContext = createContext('en')

export const MockLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockLocaleContext.Provider value="en">
      {children}
    </MockLocaleContext.Provider>
  )
}

// Mock RouteTransition Provider
const MockRouteTransitionContext = createContext({
  startRouteTransition: (callback: () => void) => {
    console.log('Mock startRouteTransition called')
    callback()
  },
  isTransitioning: false
})

export const MockRouteTransitionProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockRouteTransitionContext.Provider value={{
      startRouteTransition: (callback: () => void) => {
        // Just call the callback immediately in our mock
        callback()
      },
      isTransitioning: false
    }}>
      {children}
    </MockRouteTransitionContext.Provider>
  )
}

// Combined Mock Provider
export const PayloadMockProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ModalProvider classPrefix="modal">
      <MockConfigProvider>
        <MockTranslationProvider>
          <MockLocaleProvider>
            <MockRouteTransitionProvider>
              <div className="payload-admin" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {children}
                {/* Add ModalContainer for @faceless-ui/modal */}
                <ModalContainer />
              </div>
            </MockRouteTransitionProvider>
          </MockLocaleProvider>
        </MockTranslationProvider>
      </MockConfigProvider>
    </ModalProvider>
  )
}

// Hook exports for components that might need them
export const useTranslation = () => useContext(MockTranslationContext)
export const useConfig = () => useContext(MockConfigContext)
export const useLocale = () => useContext(MockLocaleContext)
export const useRouteTransition = () => useContext(MockRouteTransitionContext)

// Export mock router hook
export const useRouter = () => mockRouter