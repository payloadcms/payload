import { AdminViewComponent } from 'payload/config'
import { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export const getCustomViewByPath = (
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views'],
  path: string,
): AdminViewComponent => {
  if (typeof views?.Edit === 'object' && typeof views?.Edit !== 'function') {
    const foundViewConfig = Object.entries(views.Edit).find(([, view]) => {
      if (typeof view === 'object' && typeof view !== 'function' && 'path' in view) {
        return view.path === path
      }
      return false
    })?.[1]

    if (foundViewConfig && 'Component' in foundViewConfig) {
      return foundViewConfig.Component
    }
  }

  return null
}
