import type { CSSProperties } from 'react'
import type { GroupBase } from 'react-select'

import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'
import React, { useCallback, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { components as rsComponents } from 'react-select'

import type { CustomSelectProps } from './types.js'

import { useTheme } from '../../providers/Theme/index.js'

const FLOATING_MENU_PADDING = 16
const FLOATING_MENU_OFFSET = 4

type FloatingMenuPortalStyle = {
  '--rs-floating-menu-max-height'?: string
} & CSSProperties

type DefaultMenuPortalProps<
  Opt,
  IsMulti extends boolean,
  Group extends GroupBase<Opt>,
> = React.ComponentProps<typeof rsComponents.MenuPortal<Opt, IsMulti, Group>>

export function DefaultMenuPortal<Opt, IsMulti extends boolean, Group extends GroupBase<Opt>>(
  props: DefaultMenuPortalProps<Opt, IsMulti, Group>,
) {
  const { appendTo, children, controlElement, innerProps = {}, menuPlacement } = props
  const { theme } = useTheme()
  const floatingRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<null | number>(null)
  const selectProps = props.selectProps as {
    customProps?: CustomSelectProps
  } & typeof props.selectProps
  const menuPortalTheme = selectProps.customProps?.menuPortalTheme

  const updatePosition = useCallback(async () => {
    const floatingElement = floatingRef.current

    if (!controlElement || !floatingElement) {
      return
    }

    const placement = menuPlacement === 'top' ? 'top-start' : 'bottom-start'
    const { x, y } = await computePosition(controlElement, floatingElement, {
      middleware: [
        offset(FLOATING_MENU_OFFSET),
        flip({ padding: FLOATING_MENU_PADDING }),
        shift({ padding: FLOATING_MENU_PADDING }),
        size({
          apply({ availableHeight, elements, rects }) {
            const maxHeight = `${Math.max(1, Math.floor(availableHeight))}px`
            const width = `${Math.floor(rects.reference.width)}px`

            Object.assign(elements.floating.style, {
              '--rs-floating-menu-max-height': maxHeight,
              minWidth: width,
              width,
            })
          },
          padding: FLOATING_MENU_PADDING,
        }),
      ],
      placement,
      strategy: 'fixed',
    })

    Object.assign(floatingElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    })
  }, [controlElement, menuPlacement])

  const setFloatingElement = useCallback(
    (element: HTMLDivElement | null) => {
      floatingRef.current = element
      void updatePosition()
    },
    [updatePosition],
  )

  useLayoutEffect(() => {
    const floatingElement = floatingRef.current

    if (!appendTo || !controlElement || !floatingElement || typeof window === 'undefined') {
      return
    }

    const cleanupAutoUpdate = autoUpdate(controlElement, floatingElement, updatePosition, {
      elementResize: 'ResizeObserver' in window,
    })
    const visualViewport = window.visualViewport

    visualViewport?.addEventListener('resize', updatePosition)
    visualViewport?.addEventListener('scroll', updatePosition)
    rafRef.current = window.requestAnimationFrame(() => {
      void updatePosition()
    })

    return () => {
      cleanupAutoUpdate()
      visualViewport?.removeEventListener('resize', updatePosition)
      visualViewport?.removeEventListener('scroll', updatePosition)

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [appendTo, controlElement, updatePosition])

  if (!appendTo || !controlElement) {
    return (
      <rsComponents.MenuPortal
        {...props}
        innerProps={{ ...innerProps, 'data-theme': menuPortalTheme ?? theme }}
      />
    )
  }

  const { className, style, ...restInnerProps } = innerProps
  const menuWrapper = (
    <div
      {...restInnerProps}
      className={['rs__floating-menu-portal', className].filter(Boolean).join(' ')}
      data-theme={menuPortalTheme ?? theme}
      ref={setFloatingElement}
      style={
        {
          ...style,
          left: 0,
          position: 'fixed',
          top: 0,
          zIndex: 9999,
        } as FloatingMenuPortalStyle
      }
    >
      {children}
    </div>
  )

  return createPortal(menuWrapper, appendTo)
}
