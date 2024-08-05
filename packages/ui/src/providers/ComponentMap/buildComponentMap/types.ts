import type {
  FieldMap,
  MappedComponent,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

export type ActionMap = {
  Edit: {
    [view: string]: MappedComponent[]
  }
  List: MappedComponent[]
}

export type CollectionComponentMap = {
  AfterList: MappedComponent[]
  AfterListTable: MappedComponent[]
  BeforeList: MappedComponent[]
  BeforeListTable: MappedComponent[]
  List: MappedComponent
} & ConfigComponentMapBase

export type GlobalComponentMap = ConfigComponentMapBase

export type ConfigComponentMapBase = {
  Description: MappedComponent
  Edit: MappedComponent
  PreviewButton: MappedComponent
  PublishButton: MappedComponent
  SaveButton: MappedComponent
  SaveDraftButton: MappedComponent
  Upload: MappedComponent
  actionsMap: ActionMap
  fieldMap: FieldMap
  isPreviewEnabled: boolean
}

export type ComponentMap = {
  CustomAvatar: MappedComponent
  Icon: MappedComponent
  LogoutButton: MappedComponent
  actions: MappedComponent[]
  collections: {
    [slug: SanitizedCollectionConfig['slug']]: CollectionComponentMap
  }
  custom: {
    [key: string]: MappedComponent
  }
  globals: {
    [slug: SanitizedGlobalConfig['slug']]: GlobalComponentMap
  }
}
