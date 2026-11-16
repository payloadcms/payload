import type { ListViewServerProps } from 'payload'

import React from 'react'

export function CustomLibraryList({ hierarchyData }: ListViewServerProps) {
  return (
    <div>
      <h1>Custom library list</h1>
      <p>{hierarchyData ? 'Hierarchy list data' : 'Standard list data'}</p>
    </div>
  )
}
