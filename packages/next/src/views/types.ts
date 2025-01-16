import type { CustomComponent, SanitizedConfig } from 'payload'

export type ViewTypes = 'dashboard' | 'document' | 'list' | 'version'
export type DocumentSubViewTypes = 'api' | 'default' | 'livePreview' | 'version' | 'versions'

export type ServerPropsFromView = {
  collectionConfig?: SanitizedConfig['collections'][number]
  globalConfig?: SanitizedConfig['globals'][number]
  viewActions: CustomComponent[]
}
