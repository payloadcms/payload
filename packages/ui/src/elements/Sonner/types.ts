import type React from 'react'

export type ToastTypes =
  | 'action'
  | 'default'
  | 'error'
  | 'info'
  | 'loading'
  | 'normal'
  | 'success'
  | 'warning'

export type PromiseT<Data = any> = (() => Promise<Data>) | Promise<Data>

export type PromiseExternalToast = Omit<ExternalToast, 'description'>

export type PromiseData<ToastData = any> = PromiseExternalToast & {
  description?: ((data: any) => React.ReactNode | string) | React.ReactNode | string
  error?: ((error: any) => React.ReactNode | string) | React.ReactNode | string
  finally?: () => Promise<void> | void
  loading?: React.ReactNode | string
  success?: ((data: ToastData) => React.ReactNode | string) | React.ReactNode | string
}

export interface ToastClassnames {
  actionButton?: string
  cancelButton?: string
  closeButton?: string
  content?: string
  default?: string
  description?: string
  error?: string
  icon?: string
  info?: string
  loader?: string
  loading?: string
  success?: string
  title?: string
  toast?: string
  warning?: string
}

export interface ToastIcons {
  error?: React.ReactNode
  info?: React.ReactNode
  loading?: React.ReactNode
  success?: React.ReactNode
  warning?: React.ReactNode
}

interface Action {
  actionButtonStyle?: React.CSSProperties
  label: React.ReactNode
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export interface ToastT {
  action?: Action | React.ReactNode
  actionButtonStyle?: React.CSSProperties
  cancel?: Action | React.ReactNode
  cancelButtonStyle?: React.CSSProperties
  className?: string
  classNames?: ToastClassnames
  closeButton?: boolean
  delete?: boolean
  description?: React.ReactNode
  descriptionClassName?: string
  dismissible?: boolean
  duration?: number
  icon?: React.ReactNode
  id: number | string
  important?: boolean
  invert?: boolean
  jsx?: React.ReactNode
  onAutoClose?: (toast: ToastT) => void
  onDismiss?: (toast: ToastT) => void
  position?: Position
  promise?: PromiseT
  richColors?: boolean
  style?: React.CSSProperties
  title?: React.ReactNode | string
  type?: ToastTypes
  unstyled?: boolean
}

export function isAction(action: Action | React.ReactNode): action is Action {
  return (action as Action).label !== undefined
}

export type Position =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'
export interface HeightT {
  height: number
  position: Position
  toastId: number | string
}

interface ToastOptions {
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
  className?: string
  classNames?: ToastClassnames
  closeButton?: boolean
  descriptionClassName?: string
  duration?: number
  style?: React.CSSProperties
  unstyled?: boolean
}

type CnFunction = (...classes: Array<string | undefined>) => string

export interface ToasterProps {
  className?: string
  closeButton?: boolean
  cn?: CnFunction
  containerAriaLabel?: string
  dir?: 'auto' | 'ltr' | 'rtl'
  duration?: number
  expand?: boolean
  gap?: number
  hotkey?: string[]
  icons?: ToastIcons
  invert?: boolean
  /**
   * @deprecated Please use the `icons` prop instead:
   * ```jsx
   * <Toaster
   *   icons={{ loading: <LoadingIcon /> }}
   * />
   * ```
   */
  loadingIcon?: React.ReactNode
  offset?: number | string
  pauseWhenPageIsHidden?: boolean
  position?: Position
  richColors?: boolean
  style?: React.CSSProperties
  theme?: 'dark' | 'light' | 'system'
  toastOptions?: ToastOptions
  visibleToasts?: number
}

export interface ToastProps {
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
  className?: string
  classNames?: ToastClassnames
  closeButton: boolean
  closeButtonAriaLabel?: string
  cn: CnFunction
  defaultRichColors?: boolean
  descriptionClassName?: string
  duration?: number
  expandByDefault: boolean
  expanded: boolean
  gap?: number
  heights: HeightT[]
  icons?: ToastIcons
  index: number
  interacting: boolean
  invert: boolean
  loadingIcon?: React.ReactNode
  pauseWhenPageIsHidden: boolean
  position: Position
  removeToast: (toast: ToastT) => void
  setHeights: React.Dispatch<React.SetStateAction<HeightT[]>>
  style?: React.CSSProperties
  toast: ToastT
  toasts: ToastT[]
  unstyled?: boolean
  visibleToasts: number
}

export enum SwipeStateTypes {
  NotSwiped = 'NotSwiped',
  SwipedBack = 'SwipedBack',
  SwipedOut = 'SwipedOut',
}

export type Theme = 'dark' | 'light'

export interface ToastToDismiss {
  dismiss: boolean
  id: number | string
}

export type ExternalToast = Omit<ToastT, 'delete' | 'id' | 'jsx' | 'promise' | 'title' | 'type'> & {
  id?: number | string
}
