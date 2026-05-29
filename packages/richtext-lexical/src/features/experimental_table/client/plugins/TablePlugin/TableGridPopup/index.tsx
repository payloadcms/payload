'use client'

import type { LexicalEditor } from 'lexical'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import './index.css'

const GRID_COLUMNS = 10
const GRID_ROWS = 7

function ColumnsIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
      <rect height="9" rx="1" stroke="currentColor" width="3" x="1.5" y="1.5" />
      <rect height="9" rx="1" stroke="currentColor" width="3" x="7.5" y="1.5" />
    </svg>
  )
}

function RowsIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
      <rect height="3" rx="1" stroke="currentColor" width="9" x="1.5" y="1.5" />
      <rect height="3" rx="1" stroke="currentColor" width="9" x="1.5" y="7.5" />
    </svg>
  )
}

type TableGridPopupProps = {
  anchorElem: HTMLElement | null
  editor: LexicalEditor
  isOpen: boolean
  onClose: () => void
  onInsert: (cols: number, rows: number) => void
  position: null | { left: number; top: number }
}

export function TableGridPopup({
  anchorElem,
  editor: _editor,
  isOpen,
  onClose,
  onInsert,
  position,
}: TableGridPopupProps) {
  const [hoverCol, setHoverCol] = useState(0)
  const [hoverRow, setHoverRow] = useState(0)
  const [inputCols, setInputCols] = useState('')
  const [inputRows, setInputRows] = useState('')
  const [focusedInput, setFocusedInput] = useState<'cols' | 'rows' | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const colsInputRef = useRef<HTMLInputElement>(null)
  const rowsInputRef = useRef<HTMLInputElement>(null)

  const effectiveCols = hoverCol > 0 ? hoverCol : inputCols ? parseInt(inputCols, 10) || 0 : 5
  const effectiveRows = hoverRow > 0 ? hoverRow : inputRows ? parseInt(inputRows, 10) || 0 : 5

  useEffect(() => {
    if (!isOpen) {
      setHoverCol(0)
      setHoverRow(0)
      setInputCols('')
      setInputRows('')
      setFocusedInput(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Enter' && focusedInput) {
        e.preventDefault()
        const cols = parseInt(inputCols, 10)
        const rows = parseInt(inputRows, 10)
        if (cols > 0 && rows > 0) {
          onInsert(cols, rows)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose, onInsert, focusedInput, inputCols, inputRows])

  const handleCellClick = useCallback(
    (col: number, row: number) => {
      if (col > 0 && row > 0) {
        onInsert(col, row)
      }
    },
    [onInsert],
  )

  const handleCellMouseEnter = useCallback((col: number, row: number) => {
    setHoverCol(col)
    setHoverRow(row)
  }, [])

  const handleGridMouseLeave = useCallback(() => {
    setHoverCol(0)
    setHoverRow(0)
  }, [])

  if (!isOpen || !position || !anchorElem) {
    return null
  }

  const cells: React.ReactNode[] = []
  for (let row = 1; row <= GRID_ROWS; row++) {
    for (let col = 1; col <= GRID_COLUMNS; col++) {
      const isInSelection = col <= effectiveCols && row <= effectiveRows
      const isHovered = col <= hoverCol && row <= hoverRow
      let className = 'table-grid-popup__cell'
      if (isInSelection && isHovered) {
        className += ' table-grid-popup__cell--hover'
      } else if (isInSelection) {
        className += ' table-grid-popup__cell--selected'
      }

      cells.push(
        <div
          aria-label={`${col} columns, ${row} rows`}
          className={className}
          key={`${row}-${col}`}
          onClick={() => handleCellClick(col, row)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCellClick(col, row)
            }
          }}
          onMouseEnter={() => handleCellMouseEnter(col, row)}
          role="button"
          tabIndex={-1}
        />,
      )
    }
  }

  const showTooltip = hoverCol > 0 && hoverRow > 0

  return createPortal(
    <React.Fragment>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="table-grid-popup__backdrop" onClick={onClose} />
      <div
        className="table-grid-popup"
        ref={popupRef}
        style={{
          transform: `translate(${position.left}px, ${position.top}px)`,
        }}
      >
        <div className="table-grid-popup__content">
          <div className="table-grid-popup__header">
            <div
              className={`table-grid-popup__input-group${focusedInput === 'cols' ? ' table-grid-popup__input-group--focused' : ''}`}
            >
              <div className="table-grid-popup__input-icon">
                <ColumnsIcon />
              </div>
              <input
                aria-label="Columns"
                className="table-grid-popup__input"
                min={1}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setInputCols(e.target.value)}
                onFocus={() => setFocusedInput('cols')}
                placeholder={hoverCol > 0 ? String(hoverCol) : '5'}
                ref={colsInputRef}
                type="number"
                value={inputCols}
              />
            </div>
            <span className="table-grid-popup__separator">×</span>
            <div
              className={`table-grid-popup__input-group${focusedInput === 'rows' ? ' table-grid-popup__input-group--focused' : ''}`}
            >
              <div className="table-grid-popup__input-icon">
                <RowsIcon />
              </div>
              <input
                aria-label="Rows"
                className="table-grid-popup__input"
                min={1}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setInputRows(e.target.value)}
                onFocus={() => setFocusedInput('rows')}
                placeholder={hoverRow > 0 ? String(hoverRow) : '5'}
                ref={rowsInputRef}
                type="number"
                value={inputRows}
              />
            </div>
          </div>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div className="table-grid-popup__grid" onMouseLeave={handleGridMouseLeave}>
            {cells}
            {showTooltip && (
              <div
                className="table-grid-popup__tooltip"
                style={{
                  left: `calc(${((hoverCol - 0.5) / GRID_COLUMNS) * 100}%)`,
                  top: `calc(${((hoverRow - 1) / GRID_ROWS) * 100}%)`,
                }}
              >
                {effectiveCols} × {effectiveRows}
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>,
    anchorElem,
  )
}
