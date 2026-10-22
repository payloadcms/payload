import type { RefObject } from 'react'

import type { Point, PointerSample } from './safetyTriangle.js'

import {
  followTurn,
  getStopDelay,
  isApproaching,
  SAMPLE_WINDOW_MS,
  STOP_DELAY_GAP_COUNT,
} from './safetyTriangle.js'

export type SubmenuNode = {
  closeBranch: () => void
  contentRef: RefObject<HTMLElement | null>
  getTrigger: () => HTMLElement | null
  id: string
  isHoverSubmenu: boolean
  open: (viaKeyboard: boolean) => void
}

export type SubmenuScope = {
  attach: (args: { menu: HTMLElement }) => () => void
  closeActiveBranch: () => void
  register: (node: SubmenuNode) => () => void
  release: (id: string) => void
  requestOpen: (args: { id: string; viaKeyboard?: boolean }) => void
}

export const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'

type Tracking = {
  id: string
  isArmed: boolean
  isHeadingBack: boolean
  samples: PointerSample[]
  stopTimer?: ReturnType<typeof setTimeout>
  turn: null | PointerSample
}

export const createSubmenuScope = (): SubmenuScope => {
  const nodes = new Map<string, SubmenuNode>()
  const pointerGaps: number[] = []
  let menu: HTMLElement | null = null
  let activeChildId: null | string = null
  let tracking: null | Tracking = null
  let lastPointer: null | Point = null
  let lastPointerTime: null | number = null

  const stopTracking = () => {
    if (!tracking) {
      return
    }

    clearTimeout(tracking.stopTimer)
    tracking = null
    document.removeEventListener('pointermove', handlePointerMove, { capture: true })
  }

  const startTracking = ({ id }: { id: string }) => {
    tracking = { id, isArmed: false, isHeadingBack: false, samples: [], turn: null }
    document.addEventListener('pointermove', handlePointerMove, { capture: true, passive: true })
  }

  const activate = ({ id, viaKeyboard = false }: { id: string; viaKeyboard?: boolean }) => {
    const node = nodes.get(id)
    if (!node) {
      return
    }

    if (activeChildId !== id) {
      closeActiveBranch()
      activeChildId = id
    }
    node.open(viaKeyboard)

    if (node.isHoverSubmenu && !viaKeyboard && tracking?.id !== id) {
      startTracking({ id })
    }
  }

  const closeActiveBranch = () => {
    const node = nodes.get(activeChildId ?? '')
    const hasFocus = Boolean(node?.contentRef.current?.contains(document.activeElement))

    node?.closeBranch()
    activeChildId = null
    stopTracking()

    if (hasFocus) {
      node?.getTrigger()?.focus()
    }
  }

  const closeActiveHoverBranch = () => {
    if (nodes.get(activeChildId ?? '')?.isHoverSubmenu) {
      closeActiveBranch()
    }
  }

  const handOver = ({ element }: { element: Element | null }) => {
    if (!menu) {
      return
    }

    if (!element || !menu.contains(element)) {
      closeActiveHoverBranch()
      return
    }

    if (nodes.get(activeChildId ?? '')?.contentRef.current?.contains(element)) {
      return
    }

    const item = element.closest(MENU_ITEM_SELECTOR)
    if (!item) {
      return
    }

    const node = Array.from(nodes.values()).find(
      ({ getTrigger, isHoverSubmenu }) => isHoverSubmenu && getTrigger()?.contains(item),
    )

    if (!node) {
      closeActiveHoverBranch()
    } else if (node.id !== activeChildId) {
      activate({ id: node.id })
    } else if (!tracking) {
      startTracking({ id: node.id })
    }
  }

  const setArmed = ({ isArmed }: { isArmed: boolean }) => {
    if (!tracking || tracking.isArmed === isArmed) {
      return
    }

    tracking.isArmed = isArmed

    if (!isArmed && lastPointer) {
      handOver({ element: document.elementFromPoint(lastPointer.x, lastPointer.y) })
    }
  }

  const recordPointerGap = ({ time }: { time: number }) => {
    if (lastPointerTime !== null) {
      pointerGaps.push(time - lastPointerTime)
      pointerGaps.splice(0, pointerGaps.length - STOP_DELAY_GAP_COUNT)
    }
    lastPointerTime = time
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !tracking || event.timeStamp === lastPointerTime) {
      return
    }

    const current = tracking
    const node = nodes.get(current.id)
    const trigger = node?.getTrigger()
    const submenu = node?.contentRef.current

    if (!trigger || !submenu) {
      stopTracking()
      return
    }

    const pointer = { time: event.timeStamp, x: event.clientX, y: event.clientY }
    const triggerRect = trigger.getBoundingClientRect()
    const submenuRect = submenu.getBoundingClientRect()
    const isInsideSubmenu = event.target instanceof Node && submenu.contains(event.target)
    const isInsideTrigger = event.target instanceof Node && trigger.contains(event.target)
    const { isUndecided, shouldSwitchTarget, turn } =
      isInsideSubmenu || isInsideTrigger
        ? { isUndecided: false, shouldSwitchTarget: false, turn: null }
        : followTurn({
            currentTarget: current.isHeadingBack ? triggerRect : submenuRect,
            otherTarget: current.isHeadingBack ? submenuRect : triggerRect,
            pointer,
            previous: current.samples.at(-1),
            turn: current.turn,
          })
    let isHeadingBack = current.isHeadingBack

    if (isInsideSubmenu) {
      isHeadingBack = true
    } else if (isInsideTrigger) {
      isHeadingBack = false
    } else if (shouldSwitchTarget) {
      isHeadingBack = !current.isHeadingBack
    }

    recordPointerGap({ time: pointer.time })
    lastPointer = pointer
    current.turn = turn

    if (isHeadingBack !== current.isHeadingBack) {
      current.isHeadingBack = isHeadingBack
      current.samples = []
      current.turn = null

      if (shouldSwitchTarget) {
        setArmed({ isArmed: true })
      }
    }

    const target = isHeadingBack ? triggerRect : submenuRect

    const recent = current.samples.filter(({ time }) => pointer.time - time <= SAMPLE_WINDOW_MS)
    const rest = recent.length === 0 ? current.samples.at(-1) : undefined

    current.samples = [
      ...(rest ? [{ ...rest, time: pointer.time - getStopDelay({ gaps: pointerGaps }) }] : recent),
      pointer,
    ]
    setArmed({
      isArmed:
        isUndecided || current.samples.length < 2
          ? current.isArmed
          : isApproaching({ samples: current.samples, target }),
    })

    if (tracking !== current) {
      return
    }

    clearTimeout(current.stopTimer)
    current.stopTimer = setTimeout(
      () => setArmed({ isArmed: false }),
      getStopDelay({ gaps: pointerGaps }),
    )
  }

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' && tracking && !tracking.isArmed) {
      closeActiveHoverBranch()
    }
  }

  const handlePointerOver = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !(event.target instanceof Element)) {
      return
    }

    // pointerover fires before its own pointermove, which is then skipped by timeStamp
    handlePointerMove(event)

    const item = event.target.closest(MENU_ITEM_SELECTOR)

    if (item && event.relatedTarget instanceof Node && item.contains(event.relatedTarget)) {
      return
    }

    const armedNode = tracking?.isArmed ? nodes.get(tracking.id) : null

    if (
      armedNode &&
      !armedNode.getTrigger()?.contains(event.target) &&
      !armedNode.contentRef.current?.contains(event.target)
    ) {
      return
    }

    handOver({ element: event.target })
  }

  return {
    attach: ({ menu: element }) => {
      menu = element
      element.addEventListener('pointerover', handlePointerOver, { capture: true })
      element.addEventListener('pointerleave', handlePointerLeave)

      return () => {
        element.removeEventListener('pointerover', handlePointerOver, { capture: true })
        element.removeEventListener('pointerleave', handlePointerLeave)
        menu = null
      }
    },
    closeActiveBranch,
    register: (node) => {
      nodes.set(node.id, node)

      return () => {
        nodes.delete(node.id)

        if (activeChildId === node.id) {
          activeChildId = null
          stopTracking()
        }
      }
    },
    release: (id) => {
      if (activeChildId === id) {
        activeChildId = null
      }
      if (tracking?.id === id) {
        stopTracking()
      }
    },
    requestOpen: activate,
  }
}
