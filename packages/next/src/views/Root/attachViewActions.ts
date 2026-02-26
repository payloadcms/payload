import type {
  CustomComponent,
  EditConfig,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

export function getViewActions({
  editConfig,
  viewKey,
}: {
  editConfig: EditConfig
  viewKey: keyof EditConfig
}): CustomComponent[] {
  if (editConfig && viewKey in editConfig && 'actions' in editConfig[viewKey]) {
    return editConfig[viewKey].actions ?? []
  }

  return []
}

export function getSubViewActions({
  adminEditConfig,
  collectionOrGlobal,
  viewKeyArg,
}: {
  adminEditConfig?: EditConfig
  collectionOrGlobal: SanitizedCollectionConfig | SanitizedGlobalConfig
  viewKeyArg?: keyof EditConfig
}): CustomComponent[] {
  const editConfig = adminEditConfig || collectionOrGlobal?.admin?.components?.views?.edit

  if (editConfig) {
    let viewKey = viewKeyArg || 'default'
    if ('root' in editConfig) {
      viewKey = 'root'
    }

    const actions = getViewActions({
      editConfig,
      viewKey,
    })

    return actions
  }

  return []
}
