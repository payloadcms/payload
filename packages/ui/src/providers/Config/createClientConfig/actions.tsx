import type {
  CreateMappedComponent,
  EditConfig,
  ImportMap,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  ActionMap,
} from 'payload'

export const mapActions = (args: {
  collectionConfig?: SanitizedCollectionConfig
  createMappedComponent: CreateMappedComponent
  globalConfig?: SanitizedGlobalConfig
  importMap: ImportMap
}): ActionMap => {
  const { collectionConfig, createMappedComponent, globalConfig } = args

  const editViews: EditConfig = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit

  const listActions =
    typeof collectionConfig?.admin?.components?.views?.List === 'object'
      ? collectionConfig?.admin?.components?.views?.List?.actions
      : undefined

  const result: ActionMap = {
    Edit: {},
    List: [],
  }

  if (editViews) {
    for (const [key, view] of Object.entries(editViews)) {
      if (!('actions' in view)) {
        continue
      }
      if (!result.Edit[key]) {
        result.Edit[key] = []
      }
      result.Edit[key] = createMappedComponent(view.actions)
    }
  }

  if (listActions) {
    result.List = createMappedComponent(listActions)
  }

  return result
}
