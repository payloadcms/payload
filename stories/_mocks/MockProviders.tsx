import React, { createContext, use } from 'react'

// Import the real ModalProvider and ModalContainer from @faceless-ui/modal
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'

// Mock Next.js Router Context
const RouterContext = createContext(null)

// Mock Next.js Link component
export const MockLink = ({
  children,
  href,
  onClick,
  ...props
}: {
  [key: string]: any
  children: React.ReactNode
  href: object | string
  onClick?: (e: any) => void
}) => {
  return (
    <a
      href={typeof href === 'string' ? href : '#mock-link'}
      onClick={(e) => {
        e.preventDefault()
        if (onClick) {onClick(e)}
      }}
      {...props}
    >
      {children}
    </a>
  )
}

// Mock Next.js Router
export const mockRouter = {
  asPath: '/mock-path',
  back: () => {
    console.log('Mock router.back')
  },
  basePath: '',
  defaultLocale: 'en',
  forward: () => {
    console.log('Mock router.forward')
  },
  isPreview: false,
  isReady: true,
  locale: 'en',
  locales: ['en'],
  pathname: '/mock-path',
  prefetch: (url: string) => {
    console.log('Mock router.prefetch:', url)
    return Promise.resolve()
  },
  push: (url: string, options?: any) => {
    console.log('Mock router.push:', url, options)
    return Promise.resolve(true)
  },
  query: {},
  refresh: () => {
    console.log('Mock router.refresh')
  },
  replace: (url: string, options?: any) => {
    console.log('Mock router.replace:', url, options)
    return Promise.resolve(true)
  },
  route: '/mock-path',
}

// Mock Translation Context
const MockTranslationContext = createContext({
  i18n: { language: 'en' },
  t: (key: string, options?: any) => key,
})

export const MockTranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const mockT = (key: string) => {
    // Return the key or a default translation
    const translations: Record<string, string> = {
      'general:cancel': 'Cancel',
      'general:creating': 'Creating...',
      'general:delete': 'Delete',
      'general:edit': 'Edit',
      'general:loading': 'Loading...',
      'general:save': 'Save',
      'general:updating': 'Updating...',
    }
    return translations[key] || key
  }

  return (
    <MockTranslationContext
      value={{
        i18n: { language: 'en' },
        t: mockT,
      }}
    >
      {children}
    </MockTranslationContext>
  )
}

// Mock Config Context
const MockConfigContext = createContext({
  config: {
    admin: { user: 'users' },
    localization: { defaultLocale: 'en', locales: ['en'] },
    routes: { admin: '/admin' },
  },
  getEntityConfig: () => ({}),
})

export const MockConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const mockConfig = {
    admin: { user: 'users' },
    localization: {
      defaultLocale: 'en',
      locales: [{ code: 'en', label: 'English' }],
    },
    routes: { admin: '/admin' },
  }

  const getEntityConfig = ({ collectionSlug }: { collectionSlug: string }) => {
    return {
      slug: collectionSlug,
      admin: {
        description: `Manage your ${collectionSlug} collection`,
      },
      enableQueryPresets: true,
      labels: {
        plural: collectionSlug,
        singular: collectionSlug.slice(0, -1),
      },
      trash: true,
      upload:
        collectionSlug === 'media' ? { bulkUpload: true, hideFileInputOnCreate: false } : false,
    }
  }

  return (
    <MockConfigContext value={{ config: mockConfig, getEntityConfig }}>
      {children}
    </MockConfigContext>
  )
}

// Mock Locale Context
const MockLocaleContext = createContext('en')

export const MockLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  return <MockLocaleContext value="en">{children}</MockLocaleContext>
}

// Mock Selection Context (for ListSelection component)
const MockSelectionContext = createContext({
  count: 0,
  selectAll: 'none' as 'all' | 'none' | 'some',
  selectedIDs: [] as string[],
  toggleAll: () => {},
  totalDocs: 0,
})

export const MockSelectionProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockSelectionContext
      value={{
        count: 2,
        selectAll: 'some',
        selectedIDs: ['doc-1', 'doc-3'],
        toggleAll: () => console.log('Mock toggleAll'),
        totalDocs: 5,
      }}
    >
      {children}
    </MockSelectionContext>
  )
}

// Mock RouteTransition Provider
const MockRouteTransitionContext = createContext({
  isTransitioning: false,
  startRouteTransition: (callback: () => void) => {
    console.log('Mock startRouteTransition called')
    callback()
  },
})

export const MockRouteTransitionProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockRouteTransitionContext
      value={{
        isTransitioning: false,
        startRouteTransition: (callback: () => void) => {
          // Just call the callback immediately in our mock
          callback()
        },
      }}
    >
      {children}
    </MockRouteTransitionContext>
  )
}

// Mock ListQuery Provider
const MockListQueryContext = createContext({
  data: { docs: [], totalDocs: 0, totalPages: 1 },
  isGroupingBy: false,
})

export const MockListQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const mockDocs = Array.from({ length: 5 }, (_, i) => ({
    id: `doc-${i + 1}`,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    email: `user${i + 1}@example.com`,
    status: i % 2 === 0 ? 'published' : 'draft',
    title: `Document ${i + 1}`,
    updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
  }))

  return (
    <MockListQueryContext
      value={{
        data: {
          docs: mockDocs,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
          nextPage: null,
          page: 1,
          prevPage: null,
          totalDocs: mockDocs.length,
          totalPages: 1,
        },
        isGroupingBy: false,
      }}
    >
      {children}
    </MockListQueryContext>
  )
}

// Mock ListDrawer Context
const MockListDrawerContext = createContext({
  allowCreate: true,
  createNewDrawerSlug: 'create-new',
  isInDrawer: false,
  onBulkSelect: undefined,
})

export const MockListDrawerProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockListDrawerContext
      value={{
        allowCreate: true,
        createNewDrawerSlug: 'create-new',
        isInDrawer: false,
        onBulkSelect: undefined,
      }}
    >
      {children}
    </MockListDrawerContext>
  )
}

// Mock BulkUpload Context
const MockBulkUploadContext = createContext({
  drawerSlug: 'bulk-upload',
  setCollectionSlug: () => {},
  setOnSuccess: () => {},
})

export const MockBulkUploadProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockBulkUploadContext
      value={{
        drawerSlug: 'bulk-upload',
        setCollectionSlug: (slug: string) => console.log('Mock setCollectionSlug:', slug),
        setOnSuccess: (callback: () => void) => console.log('Mock setOnSuccess:', callback),
      }}
    >
      {children}
    </MockBulkUploadContext>
  )
}

// Mock StepNav Context
const MockStepNavContext = createContext({
  setStepNav: () => {},
})

export const MockStepNavProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockStepNavContext
      value={{
        setStepNav: (items: any[]) => console.log('Mock setStepNav:', items),
      }}
    >
      {children}
    </MockStepNavContext>
  )
}

// Mock WindowInfo Context
const MockWindowInfoContext = createContext({
  breakpoints: {
    l: true,
    m: false,
    s: false,
  },
})

export const MockWindowInfoProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockWindowInfoContext
      value={{
        breakpoints: {
          l: true,
          m: false,
          s: false,
        },
      }}
    >
      {children}
    </MockWindowInfoContext>
  )
}

// Mock TableColumns Provider
const MockTableColumnsContext = createContext({
  columns: [],
  moveColumn: () => {},
  toggleColumn: () => {},
})

export const MockTableColumnsProvider = ({
  children,
  collectionSlug,
}: {
  children: React.ReactNode
  collectionSlug?: string
}) => {
  return (
    <MockTableColumnsContext
      value={{
        columns: [
          { accessor: 'title', active: true, label: 'Title' },
          { accessor: 'status', active: true, label: 'Status' },
          { accessor: 'createdAt', active: true, label: 'Created' },
          { accessor: 'updatedAt', active: true, label: 'Updated' },
        ],
        moveColumn: () => console.log('Mock moveColumn'),
        toggleColumn: () => console.log('Mock toggleColumn'),
      }}
    >
      {children}
    </MockTableColumnsContext>
  )
}

// Combined Mock Provider
export const PayloadMockProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ModalProvider classPrefix="modal">
      <MockConfigProvider>
        <MockTranslationProvider>
          <MockLocaleProvider>
            <MockListQueryProvider>
              <MockSelectionProvider>
                <MockListDrawerProvider>
                  <MockBulkUploadProvider>
                    <MockStepNavProvider>
                      <MockWindowInfoProvider>
                        <MockRouteTransitionProvider>
                          <div
                            className="payload-admin"
                            style={{ fontFamily: 'system-ui, sans-serif' }}
                          >
                            {children}
                            {/* Add ModalContainer for @faceless-ui/modal */}
                            <ModalContainer />
                          </div>
                        </MockRouteTransitionProvider>
                      </MockWindowInfoProvider>
                    </MockStepNavProvider>
                  </MockBulkUploadProvider>
                </MockListDrawerProvider>
              </MockSelectionProvider>
            </MockListQueryProvider>
          </MockLocaleProvider>
        </MockTranslationProvider>
      </MockConfigProvider>
    </ModalProvider>
  )
}

// Hook exports for components that might need them
export const useTranslation = () => use(MockTranslationContext)
export const useConfig = () => use(MockConfigContext)
export const useLocale = () => use(MockLocaleContext)
export const useSelection = () => use(MockSelectionContext)
export const useRouteTransition = () => use(MockRouteTransitionContext)
export const useListQuery = () => use(MockListQueryContext)
export const useListDrawerContext = () => use(MockListDrawerContext)
export const useBulkUpload = () => use(MockBulkUploadContext)
export const useStepNav = () => use(MockStepNavContext)
export const useWindowInfo = () => use(MockWindowInfoContext)

// Export mock router hook
export const useRouter = () => mockRouter

// Export mock modal hook
export const useModal = () => ({
  closeModal: (slug: string) => console.log('Mock closeModal:', slug),
  openModal: (slug: string) => console.log('Mock openModal:', slug),
  toggleModal: (slug: string) => console.log('Mock toggleModal:', slug),
})
