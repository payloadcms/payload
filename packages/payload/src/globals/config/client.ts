import type { MappedComponent } from '../../admin/types.js'
import type { MappedView } from '../../admin/views/types.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'
import type { ClientField } from '../../fields/config/client.js'
import type { SanitizedGlobalConfig } from './types.js'

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'hooks'
>
export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'hidden' | 'preview'
>

export type ClientGlobalConfig = {
  admin: {
    components: {
      elements: {
        PreviewButton: MappedComponent
        PublishButton: MappedComponent
        SaveButton: MappedComponent
        SaveDraftButton: MappedComponent
      }
      views: {
        Edit: {
          API: MappedView
          Default: MappedView
          LivePreview: MappedView
          Version: MappedView
          Versions: MappedView
        }
      }
    }
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedGlobalConfig['admin'],
    'components' | 'livePreview' | ServerOnlyGlobalAdminProperties
  >
  fields: ClientField[]
  isPreviewEnabled: boolean
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>
