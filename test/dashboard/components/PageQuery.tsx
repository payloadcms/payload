/* eslint-disable no-restricted-exports */

import { type WidgetServerProps } from 'payload'
import React from 'react'

import { PageQueryButton } from './PageQueryButton.client.js'

export default function PageQuery({ req }: WidgetServerProps) {
  // Get page from query params
  const queryPage = req.query?.page
  const currentPage = typeof queryPage === 'string' ? parseInt(queryPage, 10) : 0

  return (
    <div
      className="page-query-widget card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        padding: '16px',
      }}
    >
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Page Query Widget</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>
          Current page from query: <strong>{currentPage}</strong>
        </p>
      </div>

      <PageQueryButton currentPage={currentPage} />
    </div>
  )
}
