'use client'

import type { ListViewGroup, ViewTypes } from 'payload'

import React from 'react'

import { GroupByPageControls } from '../../../elements/PageControls/GroupByPageControls.js'
import { TableSection } from '../../../elements/TableSection/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useListQuery } from '../../../providers/ListQuery/index.js'
import { SelectionProvider } from '../../../providers/Selection/index.js'
import { DocumentGrid } from '../DocumentGrid/index.js'
import { GroupByHeader } from '../GroupByHeader/index.js'
import './index.css'

type GroupedDocumentGridProps = {
  readonly collectionSlug: string
  readonly groups: ListViewGroup[]
  readonly hierarchyParentFieldName?: string
  readonly viewType?: ViewTypes
}

export const GroupedDocumentGrid: React.FC<GroupedDocumentGridProps> = ({
  collectionSlug,
  groups,
  hierarchyParentFieldName,
  viewType,
}) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { query } = useListQuery()
  const collectionConfig = getEntityConfig({ collectionSlug })
  const groupByFieldPath = query?.groupBy?.replace(/^-/, '') ?? ''

  return groups.map(({ data, heading, value }) => (
    <TableSection
      className="table-wrap table-wrap--group-by table-wrap--group-by-grid"
      data-group-id={value}
      key={value}
    >
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs}>
        <TableSection.Header heading={heading}>
          <GroupByHeader
            collectionConfig={collectionConfig}
            groupByFieldPath={groupByFieldPath}
            groupByValue={value}
            heading={heading}
          />
          <GroupByPageControls
            data={data}
            groupByValue={value}
            tableId={`payload-table-${collectionSlug}-${encodeURIComponent(value)}`}
          />
        </TableSection.Header>
        <TableSection.Content>
          <DocumentGrid
            adminRoute={adminRoute}
            collectionLabel={heading}
            collectionSlug={collectionSlug}
            docs={data.docs}
            hierarchyParentFieldName={hierarchyParentFieldName}
            useAsThumbnail={collectionConfig.admin.useAsThumbnail}
            useAsTitle={collectionConfig.admin.useAsTitle}
            viewType={viewType}
          />
        </TableSection.Content>
      </SelectionProvider>
    </TableSection>
  ))
}
