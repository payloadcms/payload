'use client'

import { useAuth } from '../../providers/Auth/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { SelectionProvider } from './index.js'

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
