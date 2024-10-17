import type { MappedComponent, StaticDescription } from '../../admin/types.js'
import type { MappedView } from '../../admin/views/types.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'
import type { ClientField } from '../../fields/config/client.js'
import type { SanitizedCollectionConfig } from './types.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'custom' | 'endpoints' | 'hooks' | 'joins'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'hidden' | 'preview'
>

export type ServerOnlyUploadProperties = keyof Pick<
  SanitizedCollectionConfig['upload'],
  | 'adminThumbnail'
  | 'externalFileHeaderFilter'
  | 'handlers'
  | 'modifyResponseHeaders'
  | 'withMetadata'
>

export type ClientCollectionConfig = {
  _isPreviewEnabled?: true
  admin: {
    components: {
      afterList: MappedComponent[]
      afterListTable: MappedComponent[]
      beforeList: MappedComponent[]
      beforeListTable: MappedComponent[]
      Description: MappedComponent
      edit: {
        CopyLocaleButton: MappedComponent
        PreviewButton: MappedComponent
        PublishButton: MappedComponent
        SaveButton: MappedComponent
        SaveDraftButton: MappedComponent
        Upload: MappedComponent
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
        list: {
          actions: MappedComponent[]
          Component: MappedComponent
        }
      }
    }
    description?: StaticDescription
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedCollectionConfig['admin'],
    'components' | 'description' | 'joins' | 'livePreview' | ServerOnlyCollectionAdminProperties
  >
  fields: ClientField[]
} & Omit<SanitizedCollectionConfig, 'admin' | 'fields' | ServerOnlyCollectionProperties>
