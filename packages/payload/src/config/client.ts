import type { MappedComponent } from '../admin/types.js'
import type { ClientCollectionConfig } from '../collections/config/client.js'
import type { ClientGlobalConfig } from '../globals/config/client.js'
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
  | 'queues'
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
  collections: ClientCollectionConfig[]
  custom?: Record<string, any>
  globals: ClientGlobalConfig[]
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
  'queues',
  // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
]
