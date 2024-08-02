import type { SanitizedCollectionConfig } from './types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'
import { MappedComponent } from '../../admin/types.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'custom' | 'endpoints' | 'hooks'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'hidden' | 'preview'
>

export type ClientCollectionConfig = {
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
        List: {
          Component: MappedComponent
          actions: MappedComponent[]
        }
      }
      SaveButton: MappedComponent
      SaveDraftButton: MappedComponent
      PreviewButton: MappedComponent
      PublishButton: MappedComponent
      Upload: MappedComponent
      beforeList: MappedComponent[]
      beforeListTable: MappedComponent[]
      afterList: MappedComponent[]
      afterListTable: MappedComponent[]
    }
  } & Omit<
    SanitizedCollectionConfig['admin'],
    'livePreview' | 'components' | ServerOnlyCollectionAdminProperties
  >
  fields: ClientFieldConfig[]
} & Omit<SanitizedCollectionConfig, 'admin' | 'fields' | ServerOnlyCollectionProperties>
