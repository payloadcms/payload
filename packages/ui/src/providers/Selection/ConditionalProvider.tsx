'use client'

import { useAuth } from '../../providers/Auth/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { SelectionProvider } from './index.js'

/**
 * @experimental Subject to change. Use at your own risk.
 * Right now, when using `groupBy`, bulk edit is table-by-table.
 * This is done by wrapping each table with its own `SelectionProvider`, instead of using the top-level `SelectionProvider`.
 * In the future, we may want to change this to allow bulk edit across all tables through a single provider.
 * This may require breaking changes, however, to re-shape the state to accommodate groups.
 * Or, we can keep this nested provider pattern and lift state up to the parent component.
 * To be determined.
 */
export const ConditionalSelectionProvider: React.FC<{
  children: React.ReactNode
  docs?: any[]
  totalDocs?: number
}> = ({ children, docs, totalDocs }) => {
  const { user } = useAuth()
  const { isGroupingBy } = useListQuery()

  if (!isGroupingBy) {
    return children
  }

  return (
    <SelectionProvider docs={docs} totalDocs={totalDocs} user={user}>
      {children}
    </SelectionProvider>
  )
}
