import { jsx as _jsx } from "react/jsx-runtime";
import { SortColumn } from '@payloadcms/ui';
import { hasDraftsEnabled } from 'payload/shared';
import React from 'react';
import { AutosaveCell } from './cells/AutosaveCell/index.js';
import { CreatedAtCell } from './cells/CreatedAt/index.js';
import { IDCell } from './cells/ID/index.js';
export const buildVersionColumns = ({
  collectionConfig,
  CreatedAtCellOverride,
  currentlyPublishedVersion,
  docID,
  docs,
  globalConfig,
  i18n: {
    t
  },
  isTrashed,
  latestDraftVersion
}) => {
  const entityConfig = collectionConfig || globalConfig;
  const CreatedAtCellComponent = CreatedAtCellOverride ?? CreatedAtCell;
  const columns = [{
    accessor: 'updatedAt',
    active: true,
    field: {
      name: '',
      type: 'date'
    },
    Heading: /*#__PURE__*/_jsx(SortColumn, {
      Label: t('general:updatedAt'),
      name: "updatedAt"
    }),
    renderedCells: docs.map((doc, i) => {
      return /*#__PURE__*/_jsx(CreatedAtCellComponent, {
        collectionSlug: collectionConfig?.slug,
        docID: docID,
        globalSlug: globalConfig?.slug,
        isTrashed: isTrashed,
        rowData: {
          id: doc.id,
          updatedAt: doc.updatedAt
        }
      }, i);
    })
  }, {
    accessor: 'id',
    active: true,
    field: {
      name: '',
      type: 'text'
    },
    Heading: /*#__PURE__*/_jsx(SortColumn, {
      disable: true,
      Label: t('version:versionID'),
      name: "id"
    }),
    renderedCells: docs.map((doc, i) => {
      return /*#__PURE__*/_jsx(IDCell, {
        id: doc.id
      }, i);
    })
  }];
  if (hasDraftsEnabled(entityConfig)) {
    columns.push({
      accessor: '_status',
      active: true,
      field: {
        name: '',
        type: 'checkbox'
      },
      Heading: /*#__PURE__*/_jsx(SortColumn, {
        disable: true,
        Label: t('version:status'),
        name: "status"
      }),
      renderedCells: docs.map((doc, i) => {
        return /*#__PURE__*/_jsx(AutosaveCell, {
          currentlyPublishedVersion: currentlyPublishedVersion,
          latestDraftVersion: latestDraftVersion,
          rowData: doc
        }, i);
      })
    });
  }
  return columns;
};
//# sourceMappingURL=buildColumns.js.map