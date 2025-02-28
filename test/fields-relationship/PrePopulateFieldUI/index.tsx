'use client'
import { useField } from '@payloadcms/ui'
import * as React from 'react'

import { collection1Slug } from '../slugs.js'

export const PrePopulateFieldUI: React.FC<{
  hasMany?: boolean
  hasMultipleRelations?: boolean
  path?: string
  targetFieldPath: string
}> = ({ hasMany = true, hasMultipleRelations = false, path, targetFieldPath }) => {
  const { setValue } = useField({ path: targetFieldPath })

  const addDefaults = React.useCallback(() => {
    const fetchRelationDocs = async () => {
      const res = await fetch(
        `/api/${collection1Slug}?limit=20&where[name][contains]=relationship-test`,
      )
      const json = await res.json()
      if (hasMany) {
        const docIDs = json.docs.map((doc) => {
          if (hasMultipleRelations) {
            return {
              relationTo: collection1Slug,
              value: doc.id,
            }
          }

          return doc.id
        })
        setValue(docIDs)
      } else {
        // value that does not appear in first 10 docs fetch
        setValue(json.docs[6].id)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchRelationDocs()
  }, [setValue, hasMultipleRelations, hasMany])

  return (
    <div
      className="pre-populate-field-ui"
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <button onClick={addDefaults} style={{}} type="button">
        Add default items
      </button>
    </div>
  )
}
