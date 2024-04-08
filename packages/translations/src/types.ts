export type LanguageTranslations = {
  [namespace: string]: {
    [key: string]: string
  }
}

export type Translations = {
  [language: string]: LanguageTranslations
}

export type TFunction = (key: string, options?: Record<string, any>) => string

export type I18n = {
  /** The fallback language */
  fallbackLanguage: string
  /** The language of the request */
  language: string
  /** Translate function */
  t: TFunction
  translations: Translations
}

export type I18nOptions = {
  fallbackLanguage?: string
  supportedLanguages?: string[]
  translations?: {
    [language: string]:
      | {
          $schema: string
        }
      | LanguageTranslations
  }
}

export type InitTFunction = (args: {
  config: I18nOptions
  language?: string
  translations: Translations
}) => {
  t: TFunction
  translations: Translations
}

export type InitI18n = (args: {
  config: I18nOptions
  context: 'api' | 'client'
  language?: string
}) => Promise<I18n>
