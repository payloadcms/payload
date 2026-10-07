'use client'
import React from 'react'

import type { PathSegment } from '../../ColumnBrowser/types.js'

import { FolderIcon } from '../../../../icons/Folder/index.js'
import { ReplaceIcon } from '../../../../icons/Replace/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { Chip } from '../../../Chip/index.js'
import { DialogFooter } from '../../../Dialog/index.js'
import './index.css'

const baseClass = 'hierarchy-modal-footer'

export type HierarchyModalFooterProps = {
  confirmLabel: string
  destinationPath?: PathSegment[]
  Icon?: React.ReactNode
  isConfirmDisabled: boolean
  isMultiSelect: boolean
  onClear: () => void
  onConfirm: () => void
  onMoveToRoot?: () => void
  placeholderLabel: string
  previousPath?: PathSegment[]
  selectionCount: number
  selectionCountLabel: string
  showMoveToRoot?: boolean
}

const HierarchyPath: React.FC<{
  Icon?: React.ReactNode
  path: PathSegment[]
}> = ({ Icon, path }) => {
  const label = path.map((segment) => segment.title).join(' / ')

  return (
    <Chip aria-label={label} className={`${baseClass}__path`} icon={Icon ?? <FolderIcon />}>
      {label}
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
  placeholderLabel,
  previousPath,
  selectionCount,
  selectionCountLabel,
  showMoveToRoot,
}) => {
  const { t } = useTranslation()

  return (
    <DialogFooter>
      <div className={`${baseClass}__info`}>
        {isMultiSelect ? (
          <React.Fragment>
            <span className={`${baseClass}__secondary`}>{selectionCountLabel}</span>
            {selectionCount > 0 ? (
              <Button
                buttonStyle="primary-ghost"
                className={`${baseClass}__clear`}
                margin={false}
                onClick={onClear}
                size="medium"
              >
                {t('general:clear')}
              </Button>
            ) : null}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {previousPath?.length ? (
              <React.Fragment>
                <HierarchyPath Icon={Icon} path={previousPath} />
                <span aria-hidden className={`${baseClass}__arrow`}>
                  <ReplaceIcon />
                </span>
              </React.Fragment>
            ) : null}
            {destinationPath?.length ? (
              <HierarchyPath Icon={Icon} path={destinationPath} />
            ) : (
              <span className={`${baseClass}__secondary`}>{placeholderLabel}</span>
            )}
          </React.Fragment>
        )}
      </div>
      <div className={`${baseClass}__actions`}>
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
