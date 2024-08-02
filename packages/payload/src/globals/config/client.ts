import type { SanitizedGlobalConfig } from './types.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import { MappedComponent } from '../../admin/types.js'

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'hooks'
>
export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'hidden' | 'preview'
>

export type ClientGlobalConfig = {
  isPreviewEnabled: boolean
  admin: {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
    components: {
      views: {
        Edit: {
          Default: {
            Component: MappedComponent
            actions?: MappedComponent[]
          }
        }
      }
      SaveButton: MappedComponent
      SaveDraftButton: MappedComponent
      PreviewButton: MappedComponent
      PublishButton: MappedComponent
    }
  } & Omit<
    SanitizedGlobalConfig['admin'],
    'livePreview' | 'components' | ServerOnlyGlobalAdminProperties
  >
  fields: ClientFieldConfig[]
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>
