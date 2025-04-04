import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'

const baseClass = 'breadcrumbs'

type BreadcrumbsProps = {
  breadcrumbs: {
    label: string
    onClick?: () => void
    url?: string
  }[]
  onClick?: () => void
}
export function Breadcrumbs({ breadcrumbs, onClick }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className={baseClass}>
      <ol>
        {breadcrumbs.map((breadcrumb, index) => (
          <li className={`${baseClass}__item`} key={index}>
            {breadcrumb.url ? (
              <a
                className={`${baseClass}__link`}
                href={breadcrumb.url}
                onClick={breadcrumb.onClick || onClick}
              >
                {breadcrumb.label}
              </a>
            ) : breadcrumb.onClick || onClick ? (
              <button
                className={`${baseClass}__button`}
                onClick={breadcrumb.onClick || onClick}
                type="button"
              >
                {breadcrumb.label}
              </button>
            ) : (
              <span className={`${baseClass}__label`}>{breadcrumb.label}</span>
            )}
            {breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && (
              <ChevronIcon className={`${baseClass}__crumb-chevron`} direction="right" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
