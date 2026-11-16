'use client'

import React from 'react'

import type { TreeItemVariant, TreePosition } from '../types.js'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { SpinnerIcon } from '../../../icons/Spinner/index.js'
import { TreeConnectors } from '../TreeConnectors/index.js'
import './index.css'

type Props = {
  children: React.ReactNode
  className?: string
  hideConnectors?: boolean
  isExpanded?: boolean
  isPending?: boolean
  onToggle?: () => void
  parentDescription?: string
  position: TreePosition
  variant?: TreeItemVariant
} & ({ hasChildren: boolean; toggleLabel: string } | { hasChildren?: false; toggleLabel?: never })

export function TreeItem({
  children,
  className,
  hasChildren = false,
  hideConnectors = false,
  isExpanded = false,
  isPending = false,
  onToggle,
  parentDescription,
  position,
  toggleLabel,
  variant = 'default',
}: Props) {
  const hasLoadingDelay = useDebounce(isPending, 200)
  const shouldShowSpinner = isExpanded && isPending && hasLoadingDelay

  return (
    <div
      aria-busy={isPending}
      className={['tree-item', className].filter(Boolean).join(' ')}
      data-variant={variant}
      style={
        {
          '--tree-indent-level': position.indent,
        } as React.CSSProperties
      }
    >
      {!hideConnectors && (
        <TreeConnectors
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          position={position}
          variant={variant}
        />
      )}
      {hasChildren ? (
        <button
          aria-disabled={!onToggle || undefined}
          aria-expanded={isExpanded}
          aria-label={toggleLabel}
          className="tree-item__toggle"
          onClick={onToggle}
          type="button"
        >
          <span aria-hidden="true">
            {shouldShowSpinner ? (
              <SpinnerIcon size="sm" />
            ) : (
              <ChevronIcon direction={isExpanded ? 'down' : 'right'} size={16} />
            )}
          </span>
        </button>
      ) : (
        <span aria-hidden="true" className="tree-item__spacer" />
      )}
      {parentDescription !== undefined && <span className="sr-only">{parentDescription}</span>}
      {children}
    </div>
  )
}
