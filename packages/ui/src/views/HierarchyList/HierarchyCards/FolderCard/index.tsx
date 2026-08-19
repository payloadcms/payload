'use client'

import type { User } from 'payload'

import React, { useId } from 'react'

import { Link } from '../../../../elements/Link/index.js'
import { Locked } from '../../../../elements/Locked/index.js'
import { FolderIcon } from '../../../../icons/Folder/index.js'
import './index.css'

const baseClass = 'hierarchy-folder-card'

export type FolderCardProps = {
  /**
   * Hover state while a hierarchy drag is over this card: `over` invites the drop, `invalid` marks a
   * destination that would reject it (wrong collection type, or the folder's own subtree).
   */
  dropState?: 'invalid' | 'over'
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
   * The user currently editing this document. When set, a lock indicator is shown and the card
   * cannot be selected.
   */
  lockedUser?: User
  title: string
}

export const FolderCard: React.FC<FolderCardProps> = ({
  dropState,
  href,
  icon,
  isSelected = false,
  lockedUser,
  title,
}) => {
  const selectedStatusID = useId()

  // The selected state is otherwise only conveyed by the accent border. Suppressed when locked, so
  // this never contradicts the lock indicator's own announcement.
  const shouldAnnounceSelection = isSelected && !lockedUser

  return (
    <div
      className={[
        baseClass,
        isSelected && `${baseClass}--selected`,
        dropState && `${baseClass}--drop-${dropState}`,
        // The trailing slot holds the lock indicator.
        lockedUser && `${baseClass}--has-corner-slot`,
      ]
        .filter(Boolean)
        .join(' ')}
      data-selected={isSelected ? 'true' : undefined}
    >
      <Link
        aria-describedby={shouldAnnounceSelection ? selectedStatusID : undefined}
        className={`${baseClass}__link`}
        // The card itself is the drag handle; a link's native drag would fight the pointer sensor.
        draggable={false}
        href={href}
      >
        <span className={`${baseClass}__icon`}>{icon || <FolderIcon />}</span>
        <span className={`${baseClass}__title`} title={title}>
          {title}
        </span>
      </Link>
      {shouldAnnounceSelection && (
        <span className="sr-only" id={selectedStatusID}>
          Selected
        </span>
      )}
      {lockedUser && (
        <div className={`${baseClass}__corner-slot`}>
          <Locked user={lockedUser} />
        </div>
      )}
    </div>
  )
}
