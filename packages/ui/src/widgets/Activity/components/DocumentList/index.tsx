import React from 'react'

import type { ActivityDocument } from '../../types.js'

import { CardGrid } from '../../../../elements/CardGrid/index.js'
import { DocumentCard } from '../../../../elements/DocumentCard/index.js'
import { DocumentIcon } from '../../../../icons/Document/index.js'
import { PAGE_SIZES } from '../../utils/constants.js'
import { documentKey } from '../../utils/documents.js'
import { StatusPill } from '../StatusPill/index.js'
import './index.css'

export function DocumentList({
  id,
  isEmpty = false,
  items,
  label,
  renderActions,
  trailingItem,
}: {
  id: string
  /** Whether the tab has no documents, so the trailing item spans the whole row. */
  isEmpty?: boolean
  items: ActivityDocument[]
  label: string
  renderActions?: (args: { item: ActivityDocument }) => React.ReactNode
  trailingItem?: React.ReactNode
}) {
  return (
    <div className="activity-widget__content" id={id}>
      <CardGrid<ActivityDocument | null>
        ariaLabel={label}
        className="activity-widget__items"
        getItemClassName={(item) =>
          item
            ? 'activity-widget__item'
            : `activity-widget__item activity-widget__item--add-pin${isEmpty ? ' activity-widget__item--empty' : ''}`
        }
        getKey={(item) => (item ? documentKey(item) : 'add-pin')}
        items={trailingItem ? [...items, null] : items}
        renderItem={(item) =>
          item ? (
            <DocumentCard
              href={item.href}
              placeholder={<DocumentIcon />}
              thumbnail={
                item.thumbnailURL
                  ? {
                      alt: '',
                      // Cards past the smallest page size are hidden by CSS in narrow tiers.
                      loading: items.indexOf(item) < PAGE_SIZES[0] ? 'eager' : 'lazy',
                      src: item.thumbnailURL,
                    }
                  : undefined
              }
              title={item.title}
            >
              <div className="activity-widget__meta">
                {item.typeLabel}
                {item.dateTime && item.dateLabel ? (
                  <>
                    {' · '}
                    <time dateTime={item.dateTime}>{item.dateLabel}</time>
                  </>
                ) : null}
              </div>
              <StatusPill
                isChanged={item.isChanged}
                isDraft={item.isDraft}
                label={item.statusLabel}
              />
              {renderActions?.({ item })}
            </DocumentCard>
          ) : (
            trailingItem
          )
        }
      />
    </div>
  )
}
