import * as React from 'react'

import useField from '../../../packages/payload/src/admin/components/forms/useField'
import { collection1Slug } from '../collectionSlugs'

export type PrePopulateFieldUIProps = {
  hasMany?: boolean
  hasMultipleRelations?: boolean
  path: string
}

export const PrePopulateFieldUI = ({
  hasMany = true,
  hasMultipleRelations = false,
  path,
}: PrePopulateFieldUIProps) => {
  const { setValue } = useField({ path })

  const addDefaults = React.useCallback(() => {
    const fetchRelationDocs = async () => {
      const res = await fetch(
        `/api/${collection1Slug}?limit=20&where[name][contains]=relationship-test`,
      )
      const json = await res.json()
      if (hasMany) {
        const docIds = json.docs.map((doc) => {
          if (hasMultipleRelations) {
            return {
              relationTo: collection1Slug,
              value: doc.id,
            }
          }

          return doc.id
        })
        setValue(docIds)
      } else {
        // value that does not appear in first 10 docs fetch
        setValue(json.docs[6].id)
      }
    }

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
