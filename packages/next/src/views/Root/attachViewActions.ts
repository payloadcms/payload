import type {
  CustomComponent,
  EditConfig,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from '@ruya.sa/payload'

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
  collectionOrGlobal,
  viewKeyArg,
}: {
  collectionOrGlobal: SanitizedCollectionConfig | SanitizedGlobalConfig
  viewKeyArg?: keyof EditConfig
}): CustomComponent[] {
  if (collectionOrGlobal?.admin?.components?.views?.edit) {
    let viewKey = viewKeyArg || 'default'
    if ('root' in collectionOrGlobal.admin.components.views.edit) {
      viewKey = 'root'
    }

    const actions = getViewActions({
      editConfig: collectionOrGlobal.admin?.components?.views?.edit,
      viewKey,
    })

    return actions
  }

  return []
}
