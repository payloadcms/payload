'use client'
import type { I18nClient, I18nOptions, Language } from '@payloadcms/translations'
import type {
  ClientConfig,
  LanguageOptions,
  Locale,
  SanitizedPermissions,
  ServerFunctionClient,
  TypedUser,
} from 'payload'

import { WindowInfoProvider } from '../../providers/WindowInfo/index.js'

type Props = {
  readonly children: React.ReactNode
  readonly config: ClientConfig
  readonly dateFNSKey: Language['dateFNSKey']
  readonly fallbackLang: I18nOptions['fallbackLanguage']
  readonly isNavOpen?: boolean
  readonly languageCode: string
  readonly languageOptions: LanguageOptions
  readonly locale?: Locale['code']
  readonly permissions: SanitizedPermissions
  readonly serverFunction: ServerFunctionClient
  readonly switchLanguageServerAction?: (lang: string) => Promise<void>
  readonly theme: Theme
  readonly translations: I18nClient['translations']
  readonly user: null | TypedUser
}

export const RootProvider: React.FC<Props> = ({ children, isNavOpen }) => {
  return (
    <WindowInfoProvider
      breakpoints={{
        l: '(max-width: 1440px)',
        m: '(max-width: 1024px)',
        s: '(max-width: 768px)',
        xs: '(max-width: 400px)',
      }}
    >
      <NavProvider initialIsOpen={isNavOpen}>{children}</NavProvider>
    </WindowInfoProvider>
  )
}
