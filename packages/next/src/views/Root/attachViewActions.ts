import type {
  CustomComponent,
  EditConfig,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  ServerPropsFromView,
} from 'payload'

export function getViewActions({
  editConfig,
  viewKey,
}: {
  editConfig: EditConfig
  viewKey: keyof EditConfig
}): CustomComponent[] | undefined {
  if (editConfig && viewKey in editConfig && 'actions' in editConfig[viewKey]) {
    return editConfig[viewKey].actions
  }

  return undefined
}

export function attachViewActions({
  collectionOrGlobal,
  serverProps,
  viewKeyArg,
}: {
  collectionOrGlobal: SanitizedCollectionConfig | SanitizedGlobalConfig
  serverProps: ServerPropsFromView
  viewKeyArg?: keyof EditConfig
}) {
  if (collectionOrGlobal?.admin?.components?.views?.edit) {
    let viewKey = viewKeyArg || 'default'
    if ('root' in collectionOrGlobal.admin.components.views.edit) {
      viewKey = 'root'
    }

    const actions = getViewActions({
      editConfig: collectionOrGlobal.admin?.components?.views?.edit,
      viewKey,
    })

    if (actions) {
      serverProps.viewActions = serverProps.viewActions.concat(actions)
    }
  }
}
