import type { FieldMap, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

export type ActionMap = {
  Edit: {
    [view: string]: React.ReactNode[]
  }
  List: React.ReactNode[]
}

export type CollectionComponentMap = {
  AfterList: React.ReactNode
  AfterListTable: React.ReactNode
  BeforeList: React.ReactNode
  BeforeListTable: React.ReactNode
  List: React.ReactNode
} & ConfigComponentMapBase

export type GlobalComponentMap = ConfigComponentMapBase

export type ConfigComponentMapBase = {
  Description: React.ReactNode
  Edit: React.ReactNode
  PreviewButton: React.ReactNode
  PublishButton: React.ReactNode
  SaveButton: React.ReactNode
  SaveDraftButton: React.ReactNode
  Upload: React.ReactNode
  actionsMap: ActionMap
  fieldMap: FieldMap
  isPreviewEnabled: boolean
}

export type ComponentMap = {
  Icon: React.ReactNode
  LogoutButton: React.ReactNode
  actions: React.ReactNode[]
  collections: {
    [slug: SanitizedCollectionConfig['slug']]: CollectionComponentMap
  }
  globals: {
    [slug: SanitizedGlobalConfig['slug']]: GlobalComponentMap
  }
}
