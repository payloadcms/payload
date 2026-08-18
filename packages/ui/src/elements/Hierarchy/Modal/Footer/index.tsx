'use client'
import React, { useCallback } from 'react'

import type { PathSegment } from '../../ColumnBrowser/types.js'

import { FolderIcon } from '../../../../icons/Folder/index.js'
import { ReplaceIcon } from '../../../../icons/Replace/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { Chip } from '../../../Chip/index.js'
import { DialogFooter } from '../../../Dialog/index.js'
import './index.css'

const baseClass = 'hierarchy-modal-footer'

// TODO: replace with a translation key once the hierarchy strings are finalized
const moveToLabel = 'Move to'

export type HierarchyModalFooterProps = {
  /** Label for the primary action, e.g. "Move" or "Confirm" */
  readonly confirmLabel: string
  /** Path of the item the user has picked in this session, root first */
  readonly destinationPath?: PathSegment[]
  /** Leading icon for the breadcrumb chips - falls back to a folder */
  readonly Icon?: React.ReactNode
  readonly isConfirmDisabled: boolean
  readonly isMultiSelect: boolean
  readonly onClear: () => void
  readonly onConfirm: () => void
  readonly onMoveToRoot?: () => void
  /** Called with a chip's path to expand the browser down to that item and focus it */
  readonly onRevealPath: (path: PathSegment[]) => void
  /** Shown when nothing has been picked yet, e.g. "Select Folder" */
  readonly placeholderLabel: string
  /** Path the item lived in before the modal was opened, root first */
  readonly previousPath?: PathSegment[]
  readonly selectionCount: number
  /** Shown in multi-select mode once something is checked, e.g. "3 Tags selected" */
  readonly selectionCountLabel: string
  readonly showMoveToRoot?: boolean
}

/** Deeper paths collapse to a leading ellipsis so the chip stays scannable, e.g. "… / Parent / Child" */
const MAX_VISIBLE_SEGMENTS = 2

const Separator: React.FC = () => <span className={`${baseClass}__chip-separator`}>/</span>

const HierarchyPathChip: React.FC<{
  readonly Icon?: React.ReactNode
  readonly onClick: () => void
  readonly path: PathSegment[]
}> = ({ Icon, onClick, path }) => {
  const isTruncated = path.length > MAX_VISIBLE_SEGMENTS
  const visibleSegments = isTruncated ? path.slice(-MAX_VISIBLE_SEGMENTS) : path

  return (
    <Chip
      aria-label={path.map((segment) => segment.title).join(' / ')}
      className={`${baseClass}__chip`}
      icon={Icon ?? <FolderIcon />}
      onClick={onClick}
    >
      {isTruncated ? (
        <React.Fragment>
          <span className={`${baseClass}__chip-ellipsis`}>&hellip;</span>
          <Separator />
        </React.Fragment>
      ) : null}
      {visibleSegments.map((segment, index) => (
        <React.Fragment key={segment.id}>
          {index > 0 && <Separator />}
          {segment.title}
        </React.Fragment>
      ))}
    </Chip>
  )
}

export const HierarchyModalFooter: React.FC<HierarchyModalFooterProps> = ({
  confirmLabel,
  destinationPath,
  Icon,
  isConfirmDisabled,
  isMultiSelect,
  onClear,
  onConfirm,
  onMoveToRoot,
  onRevealPath,
  placeholderLabel,
  previousPath,
  selectionCount,
  selectionCountLabel,
  showMoveToRoot,
}) => {
  const { t } = useTranslation()

  const revealPrevious = useCallback(
    () => onRevealPath(previousPath ?? []),
    [onRevealPath, previousPath],
  )

  const revealDestination = useCallback(
    () => onRevealPath(destinationPath ?? []),
    [destinationPath, onRevealPath],
  )

  const placeholder = <span className={`${baseClass}__placeholder`}>{placeholderLabel}</span>

  return (
    <DialogFooter>
      <div className={`${baseClass}__lead`}>
        {isMultiSelect ? (
          selectionCount > 0 ? (
            <React.Fragment>
              <span className={`${baseClass}__placeholder`}>{selectionCountLabel}</span>
              <Button
                buttonStyle="ghost"
                className={`${baseClass}__clear`}
                margin={false}
                onClick={onClear}
                size="medium"
              >
                {t('general:clear')}
              </Button>
            </React.Fragment>
          ) : (
            placeholder
          )
        ) : (
          <React.Fragment>
            {previousPath?.length ? (
              <React.Fragment>
                <HierarchyPathChip Icon={Icon} onClick={revealPrevious} path={previousPath} />
                <span className={`${baseClass}__arrow`}>
                  <ReplaceIcon />
                </span>
              </React.Fragment>
            ) : null}
            {destinationPath?.length ? (
              <React.Fragment>
                {!previousPath?.length && (
                  <span className={`${baseClass}__placeholder`}>{moveToLabel}</span>
                )}
                <HierarchyPathChip Icon={Icon} onClick={revealDestination} path={destinationPath} />
              </React.Fragment>
            ) : (
              placeholder
            )}
          </React.Fragment>
        )}
      </div>
      <div className={`${baseClass}__trail`}>
        {showMoveToRoot && onMoveToRoot ? (
          <Button buttonStyle="secondary" margin={false} onClick={onMoveToRoot} size="medium">
            {t('hierarchy:moveToRoot')}
          </Button>
        ) : null}
        <Button disabled={isConfirmDisabled} margin={false} onClick={onConfirm} size="medium">
          {confirmLabel}
        </Button>
      </div>
    </DialogFooter>
  )
}
