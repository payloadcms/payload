export type LoadingOverlayTypes = 'fullscreen' | 'withoutNav'

type ToggleLoadingOverlayOptions = {
  type?: LoadingOverlayTypes
  key: string
  isLoading?: boolean
  loadingText?: string
}
export type ToggleLoadingOverlay = (options: ToggleLoadingOverlayOptions) => void

type Add = {
  type: 'add'
  payload: {
    type: LoadingOverlayTypes
    key: string
    loadingText?: string
  }
}
type Remove = {
  type: 'remove'
  payload: {
    key: string
    type: LoadingOverlayTypes
    loadingText?: never
  }
}
export type Action = Add | Remove
export type State = {
  isLoading: boolean
  overlayType: null | LoadingOverlayTypes
  loaders: {
    type: LoadingOverlayTypes
    key: string
    loadingText: string
  }[]
  loadingText: string
}

export type LoadingOverlayContext = {
  toggleLoadingOverlay: ToggleLoadingOverlay
  isOnScreen: boolean
}
