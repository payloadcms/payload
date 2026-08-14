'use client'

import type { User } from 'payload'

import React, { useId } from 'react'

import { Link } from '../../../../elements/Link/index.js'
import { Locked } from '../../../../elements/Locked/index.js'
import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { FolderIcon } from '../../../../icons/Folder/index.js'
import './index.css'

const baseClass = 'hierarchy-folder-card'

export type FolderCardProps = {
  /**
   * Renders a trailing chevron affordance signalling the folder can be drilled into.
   */
  hasChildren?: boolean
  /**
   * Admin URL the card navigates to when clicked.
   */
  href: string
  /**
   * Overrides the default folder icon rendered on the leading side.
   */
  icon?: React.ReactNode
  isSelected?: boolean
  /**
   * The user currently editing this document. When set, a lock indicator replaces the checkbox.
   */
  lockedUser?: User
  /**
   * When provided, a selection checkbox is rendered for bulk actions.
   */
  onSelectionChange?: () => void
  title: string
}

export const FolderCard: React.FC<FolderCardProps> = ({
  hasChildren = false,
  href,
  icon,
  isSelected = false,
  lockedUser,
  onSelectionChange,
  title,
}) => {
  const selectedStatusID = useId()
  const isSelectable = Boolean(onSelectionChange)

  /**
   * The checkbox is a sibling of the link rather than a descendant, so a toggle can
   * never reach the anchor. The bubbling change event is stopped anyway so ancestor
   * card/row handlers cannot reinterpret a selection toggle as a navigation.
   */
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    onSelectionChange?.()
  }

  // Without a checkbox the selected state would only be conveyed by the accent border. Suppressed
  // when locked, so this never contradicts the lock indicator's own announcement.
  const shouldAnnounceSelection = isSelected && !isSelectable && !lockedUser

  return (
    <div
      className={[
        baseClass,
        isSelected && `${baseClass}--selected`,
        // The trailing slot holds either the checkbox or the lock indicator.
        (isSelectable || lockedUser) && `${baseClass}--has-corner-slot`,
      ]
        .filter(Boolean)
        .join(' ')}
      data-selected={isSelected ? 'true' : undefined}
    >
      <Link
        aria-describedby={shouldAnnounceSelection ? selectedStatusID : undefined}
        className={`${baseClass}__link`}
        href={href}
      >
        <span className={`${baseClass}__icon`}>{icon || <FolderIcon />}</span>
        <span className={`${baseClass}__title`} title={title}>
          {title}
        </span>
        {hasChildren && (
          <span className={`${baseClass}__chevron`}>
            <ChevronIcon direction="right" />
          </span>
        )}
      </Link>
      {shouldAnnounceSelection && (
        <span className="sr-only" id={selectedStatusID}>
          Selected
        </span>
      )}
      {lockedUser ? (
        <div className={`${baseClass}__checkbox`}>
          <Locked user={lockedUser} />
        </div>
      ) : (
        isSelectable && (
          <div className={`${baseClass}__checkbox`}>
            <CheckboxInput
              aria-label={`Select ${title}`}
              checked={isSelected}
              onToggle={handleToggle}
              variant="muted"
            />
          </div>
        )
      )}
    </div>
  )
}
