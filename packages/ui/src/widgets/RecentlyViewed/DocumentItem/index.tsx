'use client'
import React from 'react'

import type { DashboardDocument } from '../shared.js'

import { Link } from '../../../elements/Link/index.js'
import { Thumbnail } from '../../../elements/Thumbnail/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatRelativeDate, getRelativeTimeFormat } from '../../../utilities/formatRelativeDate.js'
import { WidgetIcon } from '../../WidgetIcon/index.js'
import './index.css'

export const DocumentItem = ({
  doc,
  isPinned,
  isSaving,
  onTogglePin,
  view,
}: {
  doc: DashboardDocument
  isPinned: boolean
  isSaving: boolean
  onTogglePin: () => void
  view: 'grid' | 'list'
}) => {
  const { i18n, t } = useTranslation()
  const date = doc.updatedAt
  const formattedDate =
    date && Number.isFinite(Date.parse(date))
      ? formatRelativeDate({
          relativeTimeFormat: getRelativeTimeFormat(i18n.language),
          value: date,
        })
      : '—'
  return (
    <li className={`dashboard-document dashboard-document--${view}`}>
      <Link aria-label={doc.title} className="dashboard-document__link" href={doc.href}>
        <div className="dashboard-document__name">
          <div className="dashboard-document__thumbnail">
            <Thumbnail doc={{ filename: doc.title }} fileSrc={doc.thumbnailURL} size="expand" />
          </div>
          <span className="dashboard-document__title" title={doc.title}>
            {doc.title}
          </span>
          {doc.status && (
            <span
              className={`dashboard-document__status dashboard-document__status--${doc.status}`}
            >
              {t(`version:${doc.status}`)}
            </span>
          )}
        </div>
        <span className="dashboard-document__collection">{doc.typeLabel}</span>
        <time className="dashboard-document__date" dateTime={date}>
          {formattedDate}
        </time>
        {view === 'list' && (
          <span className="dashboard-document__author">{doc.updatedBy || '—'}</span>
        )}
      </Link>
      <button
        aria-label={t(isPinned ? 'dashboard:unpinDocument' : 'dashboard:pinDocument', {
          title: doc.title,
        })}
        aria-pressed={isPinned}
        className="dashboard-document__pin"
        disabled={isSaving}
        onClick={onTogglePin}
        title={t(isPinned ? 'dashboard:unpinDocument' : 'dashboard:pinDocument', {
          title: doc.title,
        })}
        type="button"
      >
        <WidgetIcon name={isPinned ? 'pin-solid' : 'pin'} />
      </button>
    </li>
  )
}
