import type { MappedComponent } from '../../admin/types.js'
import type { MappedView } from '../../admin/views/types.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'
import type { ClientField } from '../../fields/config/client.js'
import type { SanitizedCollectionConfig } from './types.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'custom' | 'endpoints' | 'hooks'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'hidden' | 'preview'
>

export type ClientCollectionConfig = {
  admin: {
    components: {
      Description: MappedComponent
      afterList: MappedComponent[]
      afterListTable: MappedComponent[]
      beforeList: MappedComponent[]
      beforeListTable: MappedComponent[]
      edit: {
        PreviewButton: MappedComponent
        PublishButton: MappedComponent
        SaveButton: MappedComponent
        SaveDraftButton: MappedComponent
        Upload: MappedComponent
      }
      views: {
        Edit: {
          API: MappedView
          Default: MappedView
          LivePreview: MappedView
          Version: MappedView
          Versions: MappedView
        }
        List: {
          Component: MappedComponent
          actions: MappedComponent[]
        }
      }
    }
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedCollectionConfig['admin'],
    'components' | 'livePreview' | ServerOnlyCollectionAdminProperties
  >
  fields: ClientField[]
  isPreviewEnabled: boolean
} & Omit<SanitizedCollectionConfig, 'admin' | 'fields' | ServerOnlyCollectionProperties>
