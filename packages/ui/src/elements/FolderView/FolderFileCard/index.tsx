import LinkImport from 'next/link.js'
import React from 'react'

import './index.scss'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

const baseClass = 'folderFileCard'

type Props = {
  readonly ButtonContent: React.ReactNode
  readonly children: React.ReactNode
  readonly className?: string
  readonly href?: string
  readonly isDeleting: boolean
  readonly isSelected: boolean
  readonly isSelecting: boolean
  readonly onClick?: ({
    isSelected,
    isSelecting,
  }: {
    isSelected: boolean
    isSelecting: boolean
  }) => void
}
export function FolderFileCard({
  ButtonContent,
  children,
  className,
  href,
  isDeleting,
  isSelected,
  isSelecting,
  onClick,
}: Props) {
  return (
    <div
      className={[
        baseClass,
        className,
        isSelected && `${baseClass}--selected`,
        isSelecting && `${baseClass}--selecting`,
        isDeleting && `${baseClass}--deleting`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {href ? (
        <Link className={`${baseClass}__button`} href={href}>
          {ButtonContent}
        </Link>
      ) : (
        <button
          aria-label="item"
          className={`${baseClass}__button`}
          onClick={() => {
            onClick({ isSelected, isSelecting })
          }}
          tabIndex={isDeleting ? -1 : 0}
          type="button"
        >
          {ButtonContent}
        </button>
      )}
      {children}
    </div>
  )
}
