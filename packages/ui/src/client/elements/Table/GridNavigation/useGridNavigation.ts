'use client'

import type { RefObject } from 'react'

import { useLayoutEffect, useRef } from 'react'

const controlsSelector =
  'a[href],button,input:not([type="hidden"]),select,textarea,[tabindex],[contenteditable="true"],summary,audio[controls],video[controls]'
const compositeSelector =
  '[role="toolbar"],[role="tablist"],[role="radiogroup"],[role="listbox"],[role="tree"],[role="menu"],[role="menubar"],[role="grid"],[role="treegrid"]'
const interactionSelector =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]),textarea,select,[contenteditable="true"],[role="combobox"],[aria-haspopup],[aria-roledescription="sortable"]'

type Position = { column: string; columnIndex: number; row: string; rowIndex: number }

/** Rove over rendered cells, including opaque server-rendered/custom cell contents. */
export function useGridNavigation({
  id,
  isEnabled,
  ref,
}: {
  id?: string
  isEnabled: boolean
  ref: RefObject<HTMLTableElement | null>
}) {
  const position = useRef<null | Position>(null)

  useLayoutEffect(() => {
    const table = ref.current

    if (!isEnabled || !table) {
      return
    }

    const originals = new Map<HTMLElement, null | string>()
    const assignedTabIndexes = new Map<HTMLElement, null | string>()
    let activeCell: HTMLTableCellElement | undefined
    let isInteracting = false
    let isLeaving = false
    let hadFocus = false
    let focusedElement: HTMLElement | undefined

    const rows = () => Array.from(table.rows)
    const cells = () => rows().flatMap((row) => Array.from(row.cells))
    const ownedCell = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return undefined
      }

      const cell = target.closest<HTMLTableCellElement>('th,td')

      return cell?.closest('table') === table ? cell : undefined
    }
    const isVisible = (element: HTMLElement) =>
      !element.closest('[hidden],[inert],[aria-hidden="true"]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden'
    const controls = (cell: HTMLTableCellElement) =>
      Array.from(cell.querySelectorAll<HTMLElement>(controlsSelector)).filter((element) => {
        const popup = element.closest('.popup__content,[role="dialog"]')
        const original = originals.has(element)
          ? originals.get(element)
          : element.getAttribute('tabindex')

        return (
          ownedCell(element) === cell &&
          !(popup && cell.contains(popup)) &&
          !element.matches(':disabled') &&
          (original === null || Number(original) >= 0) &&
          isVisible(element)
        )
      })
    const refreshOriginals = () => {
      for (const [element, assigned] of assignedTabIndexes) {
        if (!table.contains(element)) {
          const original = originals.get(element)

          if (original == null) {
            element.removeAttribute('tabindex')
          } else {
            element.setAttribute('tabindex', original)
          }
          originals.delete(element)
          assignedTabIndexes.delete(element)
          continue
        }
        const current = element.getAttribute('tabindex')

        // Preserve changes made by a custom widget instead of treating them as grid writes.
        if (current !== assigned) {
          originals.set(element, current)
          assignedTabIndexes.set(element, current)
        }
      }
    }
    const setTabIndex = (element: HTMLElement, value: null | number | string) => {
      if (!originals.has(element)) {
        originals.set(element, element.getAttribute('tabindex'))
      }
      const attribute = value === null ? null : String(value)

      if (element.getAttribute('tabindex') !== attribute) {
        if (attribute === null) {
          element.removeAttribute('tabindex')
        } else {
          element.setAttribute('tabindex', attribute)
        }
      }
      assignedTabIndexes.set(element, attribute)
    }
    const getCellNavigation = ({ cell }: { cell: HTMLTableCellElement }) => {
      const items = controls(cell)
      const buttons = cell.matches('th')
        ? items.filter((item) => item.matches('[data-grid-sort-controls] button'))
        : []
      const composite = items[0]?.closest(compositeSelector)
      const canFocusControl =
        items.length === 1 &&
        !(composite && cell.contains(composite)) &&
        items[0].matches(
          'button,input[type="checkbox"],[role="button"],[role="checkbox"],[role="switch"]',
        ) &&
        !items[0].matches(interactionSelector)

      return { buttons, items, target: buttons[0] ?? (canFocusControl ? items[0] : cell) }
    }
    const remember = (cell: HTMLTableCellElement) => {
      const row = cell.parentElement as HTMLTableRowElement

      position.current = {
        column: cell.dataset.column ?? String(cell.cellIndex),
        columnIndex: cell.cellIndex,
        row: row.dataset.id ?? 'header',
        rowIndex: row.rowIndex,
      }
    }
    const synchronize = () => {
      refreshOriginals()
      const available = cells().filter(isVisible)
      const shouldRecoverFocus =
        hadFocus &&
        focusedElement &&
        (!table.contains(focusedElement) ||
          !isVisible(focusedElement) ||
          focusedElement.matches(':disabled')) &&
        (document.activeElement === document.body || document.activeElement === focusedElement)

      if (shouldRecoverFocus) {
        isInteracting = false
      }

      if (!activeCell?.isConnected || !available.includes(activeCell)) {
        const saved = position.current
        const row =
          saved &&
          (rows().find((item) => (item.dataset.id ?? 'header') === saved.row) ??
            rows()[Math.min(saved.rowIndex, rows().length - 1)])

        activeCell =
          (row &&
            (Array.from(row.cells).find(
              (cell) => available.includes(cell) && cell.dataset.column === saved?.column,
            ) ??
              Array.from(row.cells).filter(isVisible)[
                Math.min(saved.columnIndex, Array.from(row.cells).filter(isVisible).length - 1)
              ])) ||
          available.find((cell) => cell.matches('tbody .cell--linked')) ||
          available[0]
        isInteracting = false
      }
      for (const cell of available) {
        const { buttons, items, target } = getCellNavigation({ cell })
        const isActive = cell === activeCell && !isLeaving

        setTabIndex(cell, isActive && target === cell && !isInteracting ? 0 : -1)
        for (const item of items) {
          let tabIndex: null | number | string = -1

          if (isActive) {
            if (isInteracting) {
              tabIndex = originals.has(item) ? originals.get(item) : item.getAttribute('tabindex')
            } else if (target === item || buttons.includes(item)) {
              tabIndex = 0
            }
          }
          setTabIndex(item, tabIndex ?? null)
        }
      }
      if (activeCell) {
        remember(activeCell)
        if (shouldRecoverFocus) {
          getCellNavigation({ cell: activeCell }).target.focus()
        }
      }
    }
    const move = ({
      cell,
      shouldFocusLastControl,
    }: {
      cell: HTMLTableCellElement
      shouldFocusLastControl: boolean
    }) => {
      activeCell = cell
      isInteracting = false
      synchronize()
      const { buttons, target } = getCellNavigation({ cell })
      const focusTarget =
        shouldFocusLastControl && buttons.length ? buttons[buttons.length - 1] : target

      focusTarget.focus()
    }
    const onFocus = (event: FocusEvent) => {
      const cell = ownedCell(event.target)

      if (!cell) {
        return
      }
      refreshOriginals()
      hadFocus = true
      isLeaving = false
      focusedElement = event.target as HTMLElement
      activeCell = cell
      const { buttons, target } = getCellNavigation({ cell })

      isInteracting =
        event.target !== cell &&
        event.target !== target &&
        !buttons.includes(event.target as HTMLElement)
      synchronize()
    }
    const onBlur = (event: FocusEvent) => {
      if (
        isLeaving ||
        (event.relatedTarget instanceof Node && !table.contains(event.relatedTarget))
      ) {
        hadFocus = false
        isLeaving = false
        isInteracting = false
        synchronize()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const cell = ownedCell(event.target)

      if (!cell || event.defaultPrevented) {
        return
      }
      const target = event.target as HTMLElement
      const popup = target.closest('.popup__content,[role="dialog"]')

      if (popup && cell.contains(popup)) {
        return
      }
      const { buttons } = getCellNavigation({ cell })

      if (buttons.includes(target)) {
        if (event.key === 'Tab') {
          isLeaving = true
          synchronize()
          return
        }
        if (
          !event.altKey &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        ) {
          const isRTL = getComputedStyle(table).direction === 'rtl'
          const isForward = (event.key === 'ArrowRight') !== isRTL
          const nextButton = buttons[buttons.indexOf(target) + (isForward ? 1 : -1)]

          if (nextButton) {
            event.preventDefault()
            nextButton.focus()
            return
          }
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          buttons[0].focus()
          return
        }
      }
      if (isInteracting) {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          isInteracting = false
          getCellNavigation({ cell }).target.focus()
          synchronize()
        } else if (event.key === 'Tab') {
          const items = controls(cell)
          const index = items.indexOf(target)

          if ((event.shiftKey && index === 0) || (!event.shiftKey && index === items.length - 1)) {
            isInteracting = false
            isLeaving = true
            synchronize()
          }
        }
        return
      }
      if ((event.key === 'Enter' || event.key === 'F2') && target === cell) {
        const items = controls(cell)

        if (event.key === 'Enter' && items.length === 1 && items[0].matches('a[href]')) {
          event.preventDefault()
          items[0].click()
          return
        }
        if (items.length) {
          event.preventDefault()
          isInteracting = true
          synchronize()
          items[0].focus()
        }
        return
      }
      if (event.altKey || event.metaKey || event.shiftKey) {
        return
      }
      const allRows = rows()
      const row = cell.parentElement as HTMLTableRowElement
      let rowIndex = row.rowIndex
      let columnIndex = cell.cellIndex
      const isRTL = getComputedStyle(table).direction === 'rtl'

      switch (event.key) {
        case 'ArrowDown':
          rowIndex++
          break
        case 'ArrowLeft':
          columnIndex += isRTL ? 1 : -1
          break
        case 'ArrowRight':
          columnIndex += isRTL ? -1 : 1
          break
        case 'ArrowUp':
          rowIndex--
          break
        case 'End':
          columnIndex = row.cells.length - 1
          if (event.ctrlKey) {
            rowIndex = allRows.length - 1
          }
          break
        case 'Home':
          columnIndex = 0
          if (event.ctrlKey) {
            rowIndex = 0
          }
          break
        default:
          return
      }
      event.preventDefault()
      const nextRow = allRows[Math.max(0, Math.min(rowIndex, allRows.length - 1))]
      const nextCell = nextRow.cells[Math.max(0, Math.min(columnIndex, nextRow.cells.length - 1))]

      if (nextCell && nextCell !== cell && isVisible(nextCell)) {
        move({
          cell: nextCell,
          shouldFocusLastControl:
            (event.key === 'ArrowLeft' && !isRTL) || (event.key === 'ArrowRight' && isRTL),
        })
      }
    }
    const onOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !table.contains(event.target)) {
        hadFocus = false
      }
    }
    const onWindowBlur = () => {
      hadFocus = false
    }
    const onChange = () => queueMicrotask(synchronize)
    const observer = new MutationObserver(synchronize)

    synchronize()
    observer.observe(table, {
      attributeFilter: ['tabindex', 'disabled', 'hidden', 'aria-hidden'],
      attributes: true,
      childList: true,
      subtree: true,
    })
    document.addEventListener('pointerdown', onOutsidePointer, true)
    window.addEventListener('blur', onWindowBlur)
    table.addEventListener('focusin', onFocus)
    table.addEventListener('focusout', onBlur)
    // React cell handlers must be able to consume keys before grid navigation handles them.
    document.addEventListener('keydown', onKeyDown)
    table.addEventListener('change', onChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('pointerdown', onOutsidePointer, true)
      window.removeEventListener('blur', onWindowBlur)
      table.removeEventListener('focusin', onFocus)
      table.removeEventListener('focusout', onBlur)
      document.removeEventListener('keydown', onKeyDown)
      table.removeEventListener('change', onChange)
      for (const [element, original] of originals) {
        if (original === null) {
          element.removeAttribute('tabindex')
        } else {
          element.setAttribute('tabindex', original)
        }
      }
    }
  }, [id, isEnabled, ref])
}
