'use client'
import type { ClientCollectionConfig } from 'payload'

import { extractID } from 'payload/shared'
import React, { Fragment } from 'react'

import { DeleteMany } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { ListSelection_v4 } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { useFolder } from '../../../providers/Folders/index.js'

export type ListSelectionProps = {
  collectionConfig?: ClientCollectionConfig
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
}) => {
  const { getSelectedItems } = useFolder()

  const items = getSelectedItems().filter((item) => item.relationTo === collectionConfig.slug)
  const count = items.length

  if (count === 0) {
    return null
  }

  const ids = items.map((item) => {
    return extractID(item.value)
  })

  return (
    <ListSelection_v4
      count={count}
      SelectionActions={[
        !disableBulkEdit && (
          <Fragment key="bulk-actions">
            <EditMany_v4 collection={collectionConfig} count={count} ids={ids} selectAll={false} />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={ids}
              selectAll={false}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={ids}
              selectAll={false}
            />
          </Fragment>
        ),
        !disableBulkDelete && <DeleteMany collection={collectionConfig} key="bulk-delete" />,
      ].filter(Boolean)}
    />
  )
}
