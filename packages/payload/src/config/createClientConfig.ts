import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../exports/types.js'
import type { Field, FieldBase } from '../fields/config/types.js'
import type { LivePreviewConfig, SanitizedConfig } from './types.js'

export type ServerOnlyRootProperties = keyof Pick<
  SanitizedConfig,
  | 'bin'
  | 'cors'
  | 'csrf'
  | 'db'
  | 'editor'
  | 'endpoints'
  | 'hooks'
  | 'onInit'
  | 'plugins'
  | 'secret'
  | 'sharp'
  | 'typescript'
>

export type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'endpoints' | 'hooks'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'components' | 'hidden' | 'hooks' | 'preview'
>

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'endpoints' | 'fields' | 'hooks'
>

export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'components' | 'hidden' | 'preview'
>

export type ServerOnlyLivePreviewProperties = keyof Pick<LivePreviewConfig, 'url'>

export type ServerOnlyFieldProperties =
  | 'editor' // This is a `richText` only property
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | keyof Pick<FieldBase, 'access' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldAdminProperties = keyof Pick<
  FieldBase['admin'],
  'components' | 'condition' | 'description'
>

export type ClientConfigField = Omit<Field, 'access' | 'defaultValue' | 'hooks' | 'validate'>

export type ClientConfig = Omit<SanitizedConfig, 'admin' | ServerOnlyRootProperties> & {
  admin: Omit<SanitizedConfig['admin'], ServerOnlyRootAdminProperties & 'livePreview'> & {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  }
  collections: (Omit<
    SanitizedCollectionConfig,
    'admin' | 'fields' | ServerOnlyCollectionProperties
  > & {
    admin: Omit<
      SanitizedCollectionConfig['admin'],
      ServerOnlyCollectionAdminProperties & 'fields' & 'livePreview'
    > & {
      livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
    }
    fields: ClientConfigField[]
  })[]
  globals: (Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties> & {
    admin: Omit<
      SanitizedGlobalConfig['admin'],
      ServerOnlyGlobalAdminProperties & 'fields' & 'livePreview'
    > & {
      livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
    }
    fields: ClientConfigField[]
  })[]
}

export const sanitizeField = (f: Field) => {
  const field = { ...f }

  const serverOnlyFieldProperties: Partial<ServerOnlyFieldProperties>[] = [
    'hooks',
    'access',
    'validate',
    'defaultValue',
    'label',
    'filterOptions', // This is a `relationship` and `upload` only property
    'editor', // This is a `richText` only property
    // `fields`
    // `blocks`
    // `tabs`
    // `admin`
    // are all handled separately
  ]

  serverOnlyFieldProperties.forEach((key) => {
    if (key in field) {
      delete field[key]
    }
  })

  if ('fields' in field) {
    field.fields = sanitizeFields(field.fields)
  }

  if ('blocks' in field) {
    field.blocks = field.blocks.map((block) => {
      const sanitized = { ...block }
      sanitized.fields = sanitizeFields(sanitized.fields)
      return sanitized
    })
  }

  if ('tabs' in field) {
    // @ts-expect-error
    field.tabs = field.tabs.map((tab) => sanitizeField(tab))
  }

  if ('admin' in field) {
    field.admin = { ...field.admin }

    const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = [
      'components',
      'condition',
      'description',
    ]

    serverOnlyFieldAdminProperties.forEach((key) => {
      if (key in field.admin) {
        delete field.admin[key]
      }
    })
  }

  return field
}

const sanitizeCollections = (
  collections: SanitizedConfig['collections'],
): ClientConfig['collections'] =>
  collections.map((collection) => {
    const sanitized = { ...collection }
    sanitized.fields = sanitizeFields(sanitized.fields)

    const serverOnlyCollectionProperties: Partial<ServerOnlyCollectionProperties>[] = [
      'hooks',
      'access',
      'endpoints',
      // `upload`
      // `admin`
      // are all handled separately
    ]

    serverOnlyCollectionProperties.forEach((key) => {
      if (key in sanitized) {
        delete sanitized[key]
      }
    })

    if ('upload' in sanitized && typeof sanitized.upload === 'object') {
      sanitized.upload = { ...sanitized.upload }
      delete sanitized.upload.handlers
    }

    if ('auth' in sanitized && typeof sanitized.auth === 'object') {
      sanitized.auth = { ...sanitized.auth }
      delete sanitized.auth.strategies
      delete sanitized.auth.forgotPassword
      delete sanitized.auth.verify
    }

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      const serverOnlyCollectionAdminProperties: Partial<ServerOnlyCollectionAdminProperties>[] = [
        'components',
        'hidden',
        'preview',
        'hooks',
        // `livePreview` is handled separately
      ]

      serverOnlyCollectionAdminProperties.forEach((key) => {
        if (key in sanitized.admin) {
          delete sanitized.admin[key]
        }
      })

      if ('livePreview' in sanitized.admin) {
        sanitized.admin.livePreview = { ...sanitized.admin.livePreview }
        delete sanitized.admin.livePreview.url
      }
    }

    return sanitized
  })

const sanitizeGlobals = (globals: SanitizedConfig['globals']): ClientConfig['globals'] =>
  globals.map((global) => {
    const sanitized = { ...global }
    sanitized.fields = sanitizeFields(sanitized.fields)

    const serverOnlyProperties: Partial<ServerOnlyGlobalProperties>[] = [
      'hooks',
      'access',
      'endpoints',
      // `admin` is handled separately
    ]

    serverOnlyProperties.forEach((key) => {
      if (key in sanitized) {
        delete sanitized[key]
      }
    })

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      const serverOnlyGlobalAdminProperties: Partial<ServerOnlyGlobalAdminProperties>[] = [
        'components',
        'hidden',
        'preview',
      ]

      serverOnlyGlobalAdminProperties.forEach((key) => {
        if (key in sanitized.admin) {
          delete sanitized.admin[key]
        }
      })

      if ('livePreview' in sanitized.admin) {
        sanitized.admin.livePreview = { ...sanitized.admin.livePreview }
        delete sanitized.admin.livePreview.url
      }
    }

    return sanitized
  })

export const sanitizeFields = (fields: Field[]): Field[] => fields.map(sanitizeField)

export const createClientConfig = async (
  configPromise: Promise<SanitizedConfig> | SanitizedConfig,
): Promise<ClientConfig> => {
  const config = await configPromise
  const clientConfig: ClientConfig = { ...config }

  const serverOnlyConfigProperties: Partial<ServerOnlyRootProperties>[] = [
    'endpoints',
    'db',
    'editor',
    'plugins',
    'sharp',
    'onInit',
    'secret',
    'hooks',
    'bin',
    'typescript',
    'cors',
    'csrf',
    // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
  ]

  serverOnlyConfigProperties.forEach((key) => {
    if (key in clientConfig) {
      delete clientConfig[key]
    }
  })

  if ('localization' in clientConfig && clientConfig.localization) {
    clientConfig.localization = { ...clientConfig.localization }

    clientConfig.localization.locales.forEach((locale) => {
      delete locale.toString
    })
  }

  if ('admin' in clientConfig) {
    clientConfig.admin = { ...clientConfig.admin }

    const serverOnlyAdminProperties: Partial<ServerOnlyRootAdminProperties>[] = ['components']

    serverOnlyAdminProperties.forEach((key) => {
      if (key in clientConfig.admin) {
        delete clientConfig.admin[key]
      }
    })

    if ('livePreview' in clientConfig.admin) {
      clientConfig.admin.livePreview = { ...clientConfig.admin.livePreview }
      delete clientConfig.admin.livePreview.url
    }
  }

  clientConfig.collections = sanitizeCollections(clientConfig.collections)
  clientConfig.globals = sanitizeGlobals(clientConfig.globals)

  return clientConfig
}
