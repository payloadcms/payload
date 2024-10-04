import type { MappedComponent } from '../../admin/types.js'
import type { MappedView } from '../../admin/views/types.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'
import type { ClientField } from '../../fields/config/client.js'
import type { SanitizedGlobalConfig } from './types.js'

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'custom' | 'db' | 'endpoints' | 'fields' | 'hooks'
>
export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'hidden' | 'preview'
>

export type ClientGlobalConfig = {
  _isPreviewEnabled?: true
  admin: {
    components: {
      elements: {
        PreviewButton: MappedComponent
        PublishButton: MappedComponent
        SaveButton: MappedComponent
        SaveDraftButton: MappedComponent
      }
      views: {
        edit: {
          [key: string]: MappedView
          api: MappedView
          default: MappedView
          livePreview: MappedView
          version: MappedView
          versions: MappedView
        }
      }
    }
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedGlobalConfig['admin'],
    'components' | 'livePreview' | ServerOnlyGlobalAdminProperties
  >
  fields: ClientField[]
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>
