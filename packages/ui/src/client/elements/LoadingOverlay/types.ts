export type LoadingOverlayTypes = 'fullscreen' | 'withoutNav'

type ToggleLoadingOverlayOptions = {
  isLoading?: boolean
  key: string
  loadingText?: string
  type?: LoadingOverlayTypes
}
export type ToggleLoadingOverlay = (options: ToggleLoadingOverlayOptions) => void

type Add = {
  payload: {
    key: string
    loadingText?: string
    type: LoadingOverlayTypes
  }
  type: 'add'
}
type Remove = {
  payload: {
    key: string
    loadingText?: never
    type: LoadingOverlayTypes
  }
  type: 'remove'
}
export type Action = Add | Remove
export type State = {
  isLoading: boolean
  loaders: {
    key: string
    loadingText: string
    type: LoadingOverlayTypes
  }[]
  loadingText: string
  overlayType: LoadingOverlayTypes | null
}

export type LoadingOverlayContext = {
  isOnScreen: boolean
  toggleLoadingOverlay: ToggleLoadingOverlay
}
