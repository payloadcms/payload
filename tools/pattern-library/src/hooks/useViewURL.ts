// Module paths from the glob are relative to src/hooks/ (4 levels up to repo root)
// URL param strips that prefix for a clean path like packages/ui/src/...
const GLOB_PREFIX = '../../../../'

export function modulePathToUrlParam(modulePath: string): string {
  return modulePath.startsWith(GLOB_PREFIX) ? modulePath.slice(GLOB_PREFIX.length) : modulePath
}

export function urlParamToModulePath(param: string): string {
  return GLOB_PREFIX + param
}

export type ActiveView =
  | { activeVariant: null | string; modulePath: string; type: 'story' }
  | { category: null | string; type: 'tokens' }
  | { iconName: string; type: 'icon' }
  | { type: 'icons' }
  | null

export function readActiveViewFromURL(): ActiveView {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('v')

  if (v === 'tokens') {
    return { type: 'tokens', category: params.get('c') }
  }
  if (v === 'icons') {
    return { type: 'icons' }
  }
  if (v === 'icon') {
    const name = params.get('n')
    if (name) {
      return { type: 'icon', iconName: name }
    }
  }
  if (v === 'story') {
    const p = params.get('p')
    if (p) {
      return {
        type: 'story',
        modulePath: urlParamToModulePath(p),
        activeVariant: params.get('var'),
      }
    }
  }
  return null
}

export function writeActiveViewToURL(view: ActiveView): void {
  const params = new URLSearchParams()

  if (view === null) {
    history.pushState(null, '', '/')
    return
  }

  if (view.type === 'tokens') {
    params.set('v', 'tokens')
    if (view.category) {
      params.set('c', view.category)
    }
  } else if (view.type === 'icons') {
    params.set('v', 'icons')
  } else if (view.type === 'icon') {
    params.set('v', 'icon')
    params.set('n', view.iconName)
  } else if (view.type === 'story') {
    params.set('v', 'story')
    params.set('p', modulePathToUrlParam(view.modulePath))
    if (view.activeVariant) {
      params.set('var', view.activeVariant)
    }
  }

  history.pushState(null, '', `?${params.toString()}`)
}
