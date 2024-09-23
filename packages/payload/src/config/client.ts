import type { MappedComponent } from '../admin/types.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type {
  LivePreviewConfig,
  SanitizedConfig,
  ServerOnlyLivePreviewProperties,
} from './types.js'

export type ServerOnlyRootProperties = keyof Pick<
  SanitizedConfig,
  | 'bin'
  | 'cors'
  | 'csrf'
  | 'custom'
  | 'db'
  | 'editor'
  | 'email'
  | 'endpoints'
  | 'graphQL'
  | 'hooks'
  | 'onInit'
  | 'plugins'
  | 'secret'
  | 'sharp'
  | 'typescript'
>

export type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>

export type ClientConfig = {
  admin: {
    components: {
      actions?: MappedComponent[]
      Avatar: MappedComponent
      graphics: {
        Icon: MappedComponent
        Logo: MappedComponent
      }
      LogoutButton?: MappedComponent
    }
    dependencies?: Record<string, MappedComponent>
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<SanitizedConfig['admin'], 'components' | 'dependencies' | 'livePreview'>
  collections: ({
    admin: Pick<
      SanitizedCollectionConfig['admin'],
      'enableRichTextRelationship' | 'group' | 'listSearchableFields' | 'pagination' | 'useAsTitle'
    >
    labels: {
      plural: string
      singular: string
    }
  } & Pick<SanitizedCollectionConfig, 'slug' | 'upload' | 'versions'>)[]
  custom?: Record<string, any>
  globals: ({
    admin: Pick<SanitizedGlobalConfig['admin'], 'group'>
    label: string
  } & Pick<SanitizedGlobalConfig, 'slug' | 'versions'>)[]
} & Omit<SanitizedConfig, 'admin' | 'collections' | 'globals' | ServerOnlyRootProperties>

export const serverOnlyConfigProperties: readonly Partial<ServerOnlyRootProperties>[] = [
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
  'email',
  'custom',
  'graphQL',
  // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
]
