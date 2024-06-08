'use client'
/* eslint-disable */

import React from 'react'
import ReactDOM from 'react-dom'

import { Loader, getAsset } from './assets.js'
import { useIsDocumentHidden } from './hooks.js'
import { ToastState, toast } from './state.js'
import './styles.css'
import {
  type ExternalToast,
  type HeightT,
  type ToastProps,
  type ToastT,
  type ToastToDismiss,
  type ToasterProps,
  isAction,
} from './types.js'

// Visible toasts amount
const VISIBLE_TOASTS_AMOUNT = 3

// Viewport padding
const VIEWPORT_OFFSET = '32px'

// Default lifetime of a toasts (in ms)
const TOAST_LIFETIME = 4000

// Default toast width
const TOAST_WIDTH = 356

// Default gap between toasts
const GAP = 14

// Threshold to dismiss a toast
const SWIPE_THRESHOLD = 20

// Equal to exit animation duration
const TIME_BEFORE_UNMOUNT = 200

function _cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const Toast = (props: ToastProps) => {
  const {
    actionButtonStyle,
    cancelButtonStyle,
    className = '',
    classNames,
    closeButton: closeButtonFromToaster,
    closeButtonAriaLabel = 'Close toast',
    cn,
    defaultRichColors,
    descriptionClassName = '',
    duration: durationFromToaster,
    expandByDefault,
    expanded,
    gap,
    heights,
    icons,
    index,
    interacting,
    invert: ToasterInvert,
    loadingIcon: loadingIconProp,
    pauseWhenPageIsHidden,
    position,
    removeToast,
    setHeights,
    style,
    toast,
    toasts,
    unstyled,
    visibleToasts,
  } = props
  const [mounted, setMounted] = React.useState(false)
  const [removed, setRemoved] = React.useState(false)
  const [swiping, setSwiping] = React.useState(false)
  const [swipeOut, setSwipeOut] = React.useState(false)
  const [offsetBeforeRemove, setOffsetBeforeRemove] = React.useState(0)
  const [initialHeight, setInitialHeight] = React.useState(0)
  const dragStartTime = React.useRef<Date | null>(null)
  const toastRef = React.useRef<HTMLLIElement>(null)
  const isFront = index === 0
  const isVisible = index + 1 <= visibleToasts
  const toastType = toast.type
  const dismissible = toast.dismissible !== false
  const toastClassname = toast.className || ''
  const toastDescriptionClassname = toast.descriptionClassName || ''
  // Height index is used to calculate the offset as it gets updated before the toast array, which means we can calculate the new layout faster.
  const heightIndex = React.useMemo(
    () => heights.findIndex((height) => height.toastId === toast.id) || 0,
    [heights, toast.id],
  )
  const closeButton = React.useMemo(
    () => toast.closeButton ?? closeButtonFromToaster,
    [toast.closeButton, closeButtonFromToaster],
  )
  const duration = React.useMemo(
    () => toast.duration || durationFromToaster || TOAST_LIFETIME,
    [toast.duration, durationFromToaster],
  )
  const closeTimerStartTimeRef = React.useRef(0)
  const offset = React.useRef(0)
  const lastCloseTimerStartTimeRef = React.useRef(0)
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null)
  const [y, x] = position.split('-')
  const toastsHeightBefore = React.useMemo(() => {
    return heights.reduce((prev, curr, reducerIndex) => {
      // Calculate offset up until current  toast
      if (reducerIndex >= heightIndex) {
        return prev
      }

      return prev + curr.height
    }, 0)
  }, [heights, heightIndex])
  const isDocumentHidden = useIsDocumentHidden()

  const invert = toast.invert || ToasterInvert
  const disabled = toastType === 'loading'

  offset.current = React.useMemo(
    () => heightIndex * gap + toastsHeightBefore,
    [heightIndex, toastsHeightBefore],
  )

  React.useEffect(() => {
    // Trigger enter animation without using CSS animation
    setMounted(true)
  }, [])

  React.useLayoutEffect(() => {
    if (!mounted) return
    const toastNode = toastRef.current
    const originalHeight = toastNode.style.height
    toastNode.style.height = 'auto'
    const newHeight = toastNode.getBoundingClientRect().height
    toastNode.style.height = originalHeight

    setInitialHeight(newHeight)

    setHeights((heights) => {
      const alreadyExists = heights.find((height) => height.toastId === toast.id)
      if (!alreadyExists) {
        return [{ height: newHeight, position: toast.position, toastId: toast.id }, ...heights]
      } else {
        return heights.map((height) =>
          height.toastId === toast.id ? { ...height, height: newHeight } : height,
        )
      }
    })
  }, [mounted, toast.title, toast.description, setHeights, toast.id])

  const deleteToast = React.useCallback(() => {
    // Save the offset for the exit swipe animation
    setRemoved(true)
    setOffsetBeforeRemove(offset.current)
    setHeights((h) => h.filter((height) => height.toastId !== toast.id))

    setTimeout(() => {
      removeToast(toast)
    }, TIME_BEFORE_UNMOUNT)
  }, [toast, removeToast, setHeights, offset])

  React.useEffect(() => {
    if (
      (toast.promise && toastType === 'loading') ||
      toast.duration === Infinity ||
      toast.type === 'loading'
    )
      return
    let timeoutId: NodeJS.Timeout
    let remainingTime = duration

    // Pause the timer on each hover
    const pauseTimer = () => {
      if (lastCloseTimerStartTimeRef.current < closeTimerStartTimeRef.current) {
        // Get the elapsed time since the timer started
        const elapsedTime = new Date().getTime() - closeTimerStartTimeRef.current

        remainingTime = remainingTime - elapsedTime
      }

      lastCloseTimerStartTimeRef.current = new Date().getTime()
    }

    const startTimer = () => {
      // setTimeout(, Infinity) behaves as if the delay is 0.
      // As a result, the toast would be closed immediately, giving the appearance that it was never rendered.
      // See: https://github.com/denysdovhan/wtfjs?tab=readme-ov-file#an-infinite-timeout
      if (remainingTime === Infinity) return

      closeTimerStartTimeRef.current = new Date().getTime()

      // Let the toast know it has started
      timeoutId = setTimeout(() => {
        toast.onAutoClose?.(toast)
        deleteToast()
      }, remainingTime)
    }

    if (expanded || interacting || (pauseWhenPageIsHidden && isDocumentHidden)) {
      pauseTimer()
    } else {
      startTimer()
    }

    return () => clearTimeout(timeoutId)
  }, [
    expanded,
    interacting,
    expandByDefault,
    toast,
    duration,
    deleteToast,
    toast.promise,
    toastType,
    pauseWhenPageIsHidden,
    isDocumentHidden,
  ])

  React.useEffect(() => {
    const toastNode = toastRef.current

    if (toastNode) {
      const height = toastNode.getBoundingClientRect().height

      // Add toast height tot heights array after the toast is mounted
      setInitialHeight(height)
      setHeights((h) => [{ height, position: toast.position, toastId: toast.id }, ...h])

      return () => setHeights((h) => h.filter((height) => height.toastId !== toast.id))
    }
  }, [setHeights, toast.id])

  React.useEffect(() => {
    if (toast.delete) {
      deleteToast()
    }
  }, [deleteToast, toast.delete])

  function getLoadingIcon() {
    if (icons?.loading) {
      return (
        <div className="sonner-loader" data-visible={toastType === 'loading'}>
          {icons.loading}
        </div>
      )
    }

    if (loadingIconProp) {
      return (
        <div className="sonner-loader" data-visible={toastType === 'loading'}>
          {loadingIconProp}
        </div>
      )
    }
    return <Loader visible={toastType === 'loading'} />
  }

  return (
    <li
      aria-atomic="true"
      aria-live={toast.important ? 'assertive' : 'polite'}
      className={cn(
        className,
        toastClassname,
        classNames?.toast,
        toast?.classNames?.toast,
        classNames?.default,
        classNames?.[toastType],
        toast?.classNames?.[toastType],
      )}
      data-dismissible={dismissible}
      data-expanded={Boolean(expanded || (expandByDefault && mounted))}
      data-front={isFront}
      data-index={index}
      data-invert={invert}
      data-mounted={mounted}
      data-promise={Boolean(toast.promise)}
      data-removed={removed}
      data-rich-colors={toast.richColors ?? defaultRichColors}
      data-sonner-toast=""
      data-styled={!(toast.jsx || toast.unstyled || unstyled)}
      data-swipe-out={swipeOut}
      data-swiping={swiping}
      data-type={toastType}
      data-visible={isVisible}
      data-x-position={x}
      data-y-position={y}
      onPointerDown={(event) => {
        if (disabled || !dismissible) return
        dragStartTime.current = new Date()
        setOffsetBeforeRemove(offset.current)
        // Ensure we maintain correct pointer capture even when going outside of the toast (e.g. when swiping)
        ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
        if ((event.target as HTMLElement).tagName === 'BUTTON') return
        setSwiping(true)
        pointerStartRef.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerMove={(event) => {
        if (!pointerStartRef.current || !dismissible) return

        const yPosition = event.clientY - pointerStartRef.current.y
        const xPosition = event.clientX - pointerStartRef.current.x

        const clamp = y === 'top' ? Math.min : Math.max
        const clampedY = clamp(0, yPosition)
        const swipeStartThreshold = event.pointerType === 'touch' ? 10 : 2
        const isAllowedToSwipe = Math.abs(clampedY) > swipeStartThreshold

        if (isAllowedToSwipe) {
          toastRef.current?.style.setProperty('--swipe-amount', `${yPosition}px`)
        } else if (Math.abs(xPosition) > swipeStartThreshold) {
          // User is swiping in wrong direction so we disable swipe gesture
          // for the current pointer down interaction
          pointerStartRef.current = null
        }
      }}
      onPointerUp={() => {
        if (swipeOut || !dismissible) return

        pointerStartRef.current = null
        const swipeAmount = Number(
          toastRef.current?.style.getPropertyValue('--swipe-amount').replace('px', '') || 0,
        )
        const timeTaken = new Date().getTime() - dragStartTime.current?.getTime()
        const velocity = Math.abs(swipeAmount) / timeTaken

        // Remove only if threshold is met
        if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
          setOffsetBeforeRemove(offset.current)
          toast.onDismiss?.(toast)
          deleteToast()
          setSwipeOut(true)
          return
        }

        toastRef.current?.style.setProperty('--swipe-amount', '0px')
        setSwiping(false)
      }}
      ref={toastRef}
      role="status"
      style={
        {
          '--index': index,
          '--initial-height': expandByDefault ? 'auto' : `${initialHeight}px`,
          '--offset': `${removed ? offsetBeforeRemove : offset.current}px`,
          '--toasts-before': index,
          '--z-index': toasts.length - index,
          ...style,
          ...toast.style,
        } as React.CSSProperties
      }
      tabIndex={0}
    >
      {closeButton && !toast.jsx ? (
        <button
          aria-label={closeButtonAriaLabel}
          className={cn(classNames?.closeButton, toast?.classNames?.closeButton)}
          data-close-button
          data-disabled={disabled}
          onClick={
            disabled || !dismissible
              ? () => {}
              : () => {
                  deleteToast()
                  toast.onDismiss?.(toast)
                }
          }
        >
          <svg
            fill="none"
            height="12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            width="12"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>
      ) : null}
      {toast.jsx || React.isValidElement(toast.title) ? (
        toast.jsx || toast.title
      ) : (
        <React.Fragment>
          {toastType || toast.icon || toast.promise ? (
            <div className={cn(classNames?.icon, toast?.classNames?.icon)} data-icon="">
              {toast.promise || (toast.type === 'loading' && !toast.icon)
                ? toast.icon || getLoadingIcon()
                : null}
              {toast.type !== 'loading'
                ? toast.icon || icons?.[toastType] || getAsset(toastType)
                : null}
            </div>
          ) : null}

          <div className={cn(classNames?.content, toast?.classNames?.content)} data-content="">
            <div className={cn(classNames?.title, toast?.classNames?.title)} data-title="">
              {toast.title}
            </div>
            {toast.description ? (
              <div
                className={cn(
                  descriptionClassName,
                  toastDescriptionClassname,
                  classNames?.description,
                  toast?.classNames?.description,
                )}
                data-description=""
              >
                {toast.description}
              </div>
            ) : null}
          </div>
          {React.isValidElement(toast.cancel) ? (
            toast.cancel
          ) : toast.cancel && isAction(toast.cancel) ? (
            <button
              className={cn(classNames?.cancelButton, toast?.classNames?.cancelButton)}
              data-button
              data-cancel
              onClick={(event) => {
                // We need to check twice because typescript
                if (!isAction(toast.cancel)) return
                if (!dismissible) return
                toast.cancel.onClick?.(event)
                deleteToast()
              }}
              style={toast.cancelButtonStyle || cancelButtonStyle}
            >
              {toast.cancel.label}
            </button>
          ) : null}
          {React.isValidElement(toast.action) ? (
            toast.action
          ) : toast.action && isAction(toast.action) ? (
            <button
              className={cn(classNames?.actionButton, toast?.classNames?.actionButton)}
              data-action
              data-button
              onClick={(event) => {
                // We need to check twice because typescript
                if (!isAction(toast.action)) return
                if (event.defaultPrevented) return
                toast.action.onClick?.(event)
                deleteToast()
              }}
              style={toast.actionButtonStyle || actionButtonStyle}
            >
              {toast.action.label}
            </button>
          ) : null}
        </React.Fragment>
      )}
    </li>
  )
}

function getDocumentDirection(): ToasterProps['dir'] {
  if (typeof window === 'undefined') return 'ltr'
  if (typeof document === 'undefined') return 'ltr' // For Fresh purpose

  const dirAttribute = document.documentElement.getAttribute('dir')

  if (dirAttribute === 'auto' || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction as ToasterProps['dir']
  }

  return dirAttribute as ToasterProps['dir']
}

const Toaster = (props: ToasterProps) => {
  const {
    className,
    closeButton,
    cn = _cn,
    containerAriaLabel = 'Notifications',
    dir = getDocumentDirection(),
    duration,
    expand,
    gap = GAP,
    hotkey = ['altKey', 'KeyT'],
    icons,
    invert,
    loadingIcon,
    offset,
    pauseWhenPageIsHidden,
    position = 'bottom-right',
    richColors,
    style,
    theme = 'light',
    toastOptions,
    visibleToasts = VISIBLE_TOASTS_AMOUNT,
  } = props
  const [toasts, setToasts] = React.useState<ToastT[]>([])
  const possiblePositions = React.useMemo(() => {
    return Array.from(
      new Set(
        [position].concat(toasts.filter((toast) => toast.position).map((toast) => toast.position)),
      ),
    )
  }, [toasts, position])
  const [heights, setHeights] = React.useState<HeightT[]>([])
  const [expanded, setExpanded] = React.useState(false)
  const [interacting, setInteracting] = React.useState(false)
  const [actualTheme, setActualTheme] = React.useState(
    theme !== 'system'
      ? theme
      : typeof window !== 'undefined'
        ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : 'light',
  )

  const listRef = React.useRef<HTMLOListElement>(null)
  const hotkeyLabel = hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '')
  const lastFocusedElementRef = React.useRef<HTMLElement>(null)
  const isFocusWithinRef = React.useRef(false)

  const removeToast = React.useCallback(
    (toast: ToastT) => setToasts((toasts) => toasts.filter(({ id }) => id !== toast.id)),
    [],
  )

  React.useEffect(() => {
    return ToastState.subscribe((toast) => {
      if ((toast as ToastToDismiss).dismiss) {
        setToasts((toasts) => toasts.map((t) => (t.id === toast.id ? { ...t, delete: true } : t)))
        return
      }

      // Prevent batching, temp solution.
      setTimeout(() => {
        ReactDOM.flushSync(() => {
          setToasts((toasts) => {
            const indexOfExistingToast = toasts.findIndex((t) => t.id === toast.id)

            // Update the toast if it already exists
            if (indexOfExistingToast !== -1) {
              return [
                ...toasts.slice(0, indexOfExistingToast),
                { ...toasts[indexOfExistingToast], ...toast },
                ...toasts.slice(indexOfExistingToast + 1),
              ]
            }

            return [toast, ...toasts]
          })
        })
      })
    })
  }, [])

  React.useEffect(() => {
    if (theme !== 'system') {
      setActualTheme(theme)
      return
    }

    if (theme === 'system') {
      // check if current preference is dark
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // it's currently dark
        setActualTheme('dark')
      } else {
        // it's not dark
        setActualTheme('light')
      }
    }

    if (typeof window === 'undefined') return

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
      if (matches) {
        setActualTheme('dark')
      } else {
        setActualTheme('light')
      }
    })
  }, [theme])

  React.useEffect(() => {
    // Ensure expanded is always false when no toasts are present / only one left
    if (toasts.length <= 1) {
      setExpanded(false)
    }
  }, [toasts])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isHotkeyPressed = hotkey.every((key) => (event as any)[key] || event.code === key)

      if (isHotkeyPressed) {
        setExpanded(true)
        listRef.current?.focus()
      }

      if (
        event.code === 'Escape' &&
        (document.activeElement === listRef.current ||
          listRef.current?.contains(document.activeElement))
      ) {
        setExpanded(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hotkey])

  React.useEffect(() => {
    if (listRef.current) {
      return () => {
        if (lastFocusedElementRef.current) {
          lastFocusedElementRef.current.focus({ preventScroll: true })
          lastFocusedElementRef.current = null
          isFocusWithinRef.current = false
        }
      }
    }
  }, [listRef.current])

  if (!toasts.length) return null

  return (
    // Remove item from normal navigation flow, only available via hotkey
    <section aria-label={`${containerAriaLabel} ${hotkeyLabel}`} tabIndex={-1}>
      {possiblePositions.map((position, index) => {
        const [y, x] = position.split('-')
        return (
          <ol
            className={className}
            data-sonner-toaster
            data-theme={actualTheme}
            data-x-position={x}
            data-y-position={y}
            dir={dir === 'auto' ? getDocumentDirection() : dir}
            key={position}
            onBlur={(event) => {
              if (isFocusWithinRef.current && !event.currentTarget.contains(event.relatedTarget)) {
                isFocusWithinRef.current = false
                if (lastFocusedElementRef.current) {
                  lastFocusedElementRef.current.focus({ preventScroll: true })
                  lastFocusedElementRef.current = null
                }
              }
            }}
            onFocus={(event) => {
              const isNotDismissible =
                event.target instanceof HTMLElement && event.target.dataset.dismissible === 'false'

              if (isNotDismissible) return

              if (!isFocusWithinRef.current) {
                isFocusWithinRef.current = true
                lastFocusedElementRef.current = event.relatedTarget as HTMLElement
              }
            }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => {
              // Avoid setting expanded to false when interacting with a toast, e.g. swiping
              if (!interacting) {
                setExpanded(false)
              }
            }}
            onMouseMove={() => setExpanded(true)}
            onPointerDown={(event) => {
              const isNotDismissible =
                event.target instanceof HTMLElement && event.target.dataset.dismissible === 'false'

              if (isNotDismissible) return
              setInteracting(true)
            }}
            onPointerUp={() => setInteracting(false)}
            ref={listRef}
            style={
              {
                '--front-toast-height': `${heights[0]?.height || 0}px`,
                '--gap': `${gap}px`,
                '--offset': typeof offset === 'number' ? `${offset}px` : offset || VIEWPORT_OFFSET,
                '--width': `${TOAST_WIDTH}px`,
                ...style,
              } as React.CSSProperties
            }
            tabIndex={-1}
          >
            {toasts
              .filter((toast) => (!toast.position && index === 0) || toast.position === position)
              .map((toast, index) => (
                <Toast
                  actionButtonStyle={toastOptions?.actionButtonStyle}
                  cancelButtonStyle={toastOptions?.cancelButtonStyle}
                  className={toastOptions?.className}
                  classNames={toastOptions?.classNames}
                  closeButton={toastOptions?.closeButton ?? closeButton}
                  cn={cn}
                  defaultRichColors={richColors}
                  descriptionClassName={toastOptions?.descriptionClassName}
                  duration={toastOptions?.duration ?? duration}
                  expandByDefault={expand}
                  expanded={expanded}
                  gap={gap}
                  heights={heights.filter((h) => h.position == toast.position)}
                  icons={icons}
                  index={index}
                  interacting={interacting}
                  invert={invert}
                  key={toast.id}
                  loadingIcon={loadingIcon}
                  pauseWhenPageIsHidden={pauseWhenPageIsHidden}
                  position={position}
                  removeToast={removeToast}
                  setHeights={setHeights}
                  style={toastOptions?.style}
                  toast={toast}
                  toasts={toasts.filter((t) => t.position == toast.position)}
                  unstyled={toastOptions?.unstyled}
                  visibleToasts={visibleToasts}
                />
              ))}
          </ol>
        )
      })}
    </section>
  )
}
export { type ExternalToast, type ToastT, Toaster, type ToasterProps, toast }
