import type { Action, State } from './types'

export const defaultLoadingOverlayState = {
  isLoading: false,
  loaders: [],
  loadingText: '',
  overlayType: null,
}

export const reducer = (state: State, action: Action): State => {
  const loadersCopy = [...state.loaders]
  const { key = 'user', loadingText, type = 'fullscreen' } = action.payload

  if (action.type === 'add') {
    loadersCopy.push({ key, loadingText, type })
  } else if (action.type === 'remove') {
    const index = loadersCopy.findIndex((item) => item.key === key && item.type === type)
    loadersCopy.splice(index, 1)
  }

  const nextLoader = loadersCopy?.length > 0 ? loadersCopy[loadersCopy.length - 1] : null

  return {
    isLoading: Boolean(nextLoader),
    loaders: loadersCopy,
    loadingText: nextLoader?.loadingText || state?.loadingText,
    overlayType: nextLoader?.type || state?.overlayType,
  }
}
