import type { AdminViewServerProps } from 'payload'

import React from 'react'

import { customCollectionViewTitle } from '../../../shared.js'

export function CustomCollectionView({ initPageResult }: AdminViewServerProps) {
  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1 id="custom-collection-view-title">{customCollectionViewTitle}</h1>
      <p>This is a custom collection-level view (e.g., grid view) added via:</p>
      <ul>
        <li>
          <code>admin.components.views[key].Component</code>
        </li>
        <li>
          <code>admin.components.views[key].path</code>
        </li>
      </ul>
    </div>
  )
}
