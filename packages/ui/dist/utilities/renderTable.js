import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { fieldAffectsData, fieldIsHiddenOrDisabled } from 'payload/shared';
import React from 'react';
import { RenderServerComponent } from '../elements/RenderServerComponent/index.js';
import { GroupByHeader, GroupByPageControls, OrderableTable, Pill, SelectAll, SelectionProvider, SelectRow, SortHeader, SortRow, Table } from '../exports/client/index.js';
import { filterFieldsWithPermissions } from '../providers/TableColumns/buildColumnState/filterFieldsWithPermissions.js';
import { buildColumnState } from '../providers/TableColumns/buildColumnState/index.js';
export const renderFilters = (fields, importMap) => fields.reduce((acc, field) => {
  if (fieldIsHiddenOrDisabled(field)) {
    return acc;
  }
  if ('name' in field && field.admin?.components?.Filter) {
    acc.set(field.name, RenderServerComponent({
      Component: field.admin.components?.Filter,
      importMap
    }));
  }
  return acc;
}, new Map());
export const renderTable = ({
  clientCollectionConfig,
  clientConfig,
  collectionConfig,
  collections,
  columns,
  customCellProps,
  data,
  enableRowSelections,
  fieldPermissions,
  groupByFieldPath,
  groupByValue,
  heading,
  i18n,
  key = 'table',
  orderableFieldName,
  payload,
  query,
  renderRowTypes,
  req,
  tableAppearance,
  useAsTitle,
  viewType
}) => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disableListColumn`, etc.
  let columnState;
  let clientFields = clientCollectionConfig?.fields || [];
  let serverFields = collectionConfig?.fields || [];
  const isPolymorphic = collections;
  const isGroupingBy = Boolean(collectionConfig?.admin?.groupBy && query?.groupBy);
  if (isPolymorphic) {
    clientFields = [];
    serverFields = [];
    for (const collection of collections) {
      const clientCollectionConfig = clientConfig.collections.find(each => each.slug === collection);
      for (const field of filterFieldsWithPermissions({
        fieldPermissions,
        fields: clientCollectionConfig.fields
      })) {
        if (fieldAffectsData(field)) {
          if (clientFields.some(each => fieldAffectsData(each) && each.name === field.name)) {
            continue;
          }
        }
        clientFields.push(field);
      }
      const serverCollectionConfig = payload.collections[collection].config;
      for (const field of filterFieldsWithPermissions({
        fieldPermissions,
        fields: serverCollectionConfig.fields
      })) {
        if (fieldAffectsData(field)) {
          if (serverFields.some(each => fieldAffectsData(each) && each.name === field.name)) {
            continue;
          }
        }
        serverFields.push(field);
      }
    }
  }
  const sharedArgs = {
    clientFields,
    columns,
    enableRowSelections,
    fieldPermissions,
    i18n,
    // sortColumnProps,
    customCellProps,
    payload,
    req,
    serverFields,
    useAsTitle,
    viewType
  };
  if (isPolymorphic) {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: undefined,
      dataType: 'polymorphic',
      docs: data?.docs || []
    });
  } else {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: clientCollectionConfig.slug,
      dataType: 'monomorphic',
      docs: data?.docs || []
    });
  }
  const columnsToUse = [...columnState];
  if (renderRowTypes) {
    columnsToUse.unshift({
      accessor: 'collection',
      active: true,
      field: {
        admin: {
          disabled: true
        },
        hidden: true
      },
      Heading: i18n.t('version:type'),
      renderedCells: (data?.docs || []).map((doc, i) => /*#__PURE__*/_jsx(Pill, {
        size: "small",
        children: getTranslation(collections ? payload.collections[doc.relationTo].config.labels.singular : clientCollectionConfig.labels.singular, i18n)
      }, i))
    });
  }
  if (enableRowSelections) {
    columnsToUse.unshift({
      accessor: '_select',
      active: true,
      field: {
        admin: {
          disabled: true
        },
        hidden: true
      },
      Heading: /*#__PURE__*/_jsx(SelectAll, {}),
      renderedCells: (data?.docs || []).map((_, i) => /*#__PURE__*/_jsx(SelectRow, {
        rowData: data?.docs[i]
      }, i))
    });
  }
  if (isGroupingBy) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: /*#__PURE__*/_jsx("div", {
        className: ['table-wrap', groupByValue !== undefined && `table-wrap--group-by`].filter(Boolean).join(' '),
        children: /*#__PURE__*/_jsxs(SelectionProvider, {
          docs: data?.docs || [],
          totalDocs: data?.totalDocs || 0,
          children: [/*#__PURE__*/_jsx(GroupByHeader, {
            collectionConfig: clientCollectionConfig,
            groupByFieldPath: groupByFieldPath,
            groupByValue: groupByValue,
            heading: heading
          }), /*#__PURE__*/_jsx(Table, {
            appearance: tableAppearance,
            columns: columnsToUse,
            data: data?.docs || []
          }), /*#__PURE__*/_jsx(GroupByPageControls, {
            collectionConfig: clientCollectionConfig,
            data: data,
            groupByValue: groupByValue
          })]
        })
      }, key)
    };
  }
  if (!orderableFieldName) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: /*#__PURE__*/_jsx("div", {
        className: "table-wrap",
        children: /*#__PURE__*/_jsx(Table, {
          appearance: tableAppearance,
          columns: columnsToUse,
          data: data?.docs || []
        })
      }, key)
    };
  }
  columnsToUse.unshift({
    accessor: '_dragHandle',
    active: true,
    field: {
      admin: {
        disabled: true
      },
      hidden: true
    },
    Heading: /*#__PURE__*/_jsx(SortHeader, {}),
    renderedCells: (data?.docs || []).map((_, i) => /*#__PURE__*/_jsx(SortRow, {}, i))
  });
  return {
    columnState,
    // key is required since Next.js 15.2.0 to prevent React key error
    Table: /*#__PURE__*/_jsx("div", {
      className: "table-wrap",
      children: /*#__PURE__*/_jsx(OrderableTable, {
        appearance: tableAppearance,
        collection: clientCollectionConfig,
        columns: columnsToUse,
        data: data?.docs || []
      })
    }, key)
  };
};
//# sourceMappingURL=renderTable.js.map