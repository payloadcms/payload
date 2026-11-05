import React from 'react'

import '../../elements/Card/index.css'
import './index.css'

export type WidgetListItem = {
  href: string
  key: string
  main: React.ReactNode
  meta?: React.ReactNode
}

export function WidgetCard({
  children,
  className,
  title,
}: {
  children: React.ReactNode
  className?: string
  title: React.ReactNode
}) {
  return (
    <div className={['card', 'widget-card', className].filter(Boolean).join(' ')}>
      <div className="widget-card__header">
        <h3 className="widget-card__title">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function WidgetList({
  emptyMessage,
  items,
}: {
  emptyMessage: string
  items: WidgetListItem[]
}) {
  if (items.length === 0) {
    return <p className="widget-card__empty">{emptyMessage}</p>
  }

  return (
    <ul className="widget-card__rows">
      {items.map((item) => (
        <li className="widget-card__row" key={item.key}>
          <a className="widget-card__row-link" href={item.href}>
            <span className="widget-card__row-main">{item.main}</span>
            {item.meta != null ? <span className="widget-card__row-meta">{item.meta}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  )
}
