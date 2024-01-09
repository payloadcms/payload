export type Translations = {
  [language: string]:
    | {
        $schema: string
      }
    | {
        [namespace: string]: {
          [key: string]: string
        }
      }
}

export type TFunction = (key: string, options?: Record<string, any>) => string

export type I18n = {
  /** The fallback language */
  fallbackLanguage: string
  /** The language of the request */
  language: string
  /** Translate function */
  t: (key: string, options?: Record<string, unknown>) => string
}

export type I18nOptions = {
  fallbackLanguage?: string
  supportedLanguages?: string[]
  translations?: {
    [language: string]:
      | {
          $schema: string
        }
      | {
          [namespace: string]: {
            [key: string]: string
          }
        }
  }
}

export type InitTFunction = (args: {
  config: I18nOptions
  language?: string
  translations?: Translations
}) => TFunction
