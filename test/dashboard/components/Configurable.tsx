/* eslint-disable no-restricted-exports */
import { type WidgetServerProps } from 'payload'

import type { ConfigurableWidget } from '../payload-types.js'

export default function Configurable({ widgetData }: WidgetServerProps<ConfigurableWidget>) {
  const title = widgetData?.title || 'Untitled'
  const description = widgetData?.description || ''
  const relatedTicket =
    typeof widgetData?.relatedTicket === 'string' ? widgetData.relatedTicket : undefined

  return (
    <div className="configurable-widget card" style={{ padding: '16px' }}>
      <h3 data-testid="configurable-title" style={{ margin: 0 }}>
        {title}
      </h3>
      {description && (
        <p data-testid="configurable-description" style={{ margin: '8px 0 0' }}>
          {description}
        </p>
      )}
      {relatedTicket && (
        <p data-testid="configurable-ticket" style={{ fontSize: '12px', margin: '8px 0 0' }}>
          Ticket: {relatedTicket}
        </p>
      )}
    </div>
  )
}
