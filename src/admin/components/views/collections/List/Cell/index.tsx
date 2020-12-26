import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import RenderCustomComponent from '../../../../utilities/RenderCustomComponent';
import cellComponents from './field-types';
import { Props } from './types';

const DefaultCell: React.FC<Props> = (props) => {
  const {
    field,
    colIndex,
    collection: {
      slug,
    },
    cellData,
    rowData: {
      id,
    } = {},
  } = props;

  const { routes: { admin } } = useConfig();

  let WrapElement: React.ComponentType | string = 'span';

  const wrapElementProps: {
    to?: string
  } = {};

  if (colIndex === 0) {
    WrapElement = Link;
    wrapElementProps.to = `${admin}/collections/${slug}/${id}`;
  }

  const CellComponent = cellComponents[field.type];

  if (!CellComponent) {
    return (
      <WrapElement {...wrapElementProps}>
        {(cellData === '' || typeof cellData === 'undefined') && `<No ${field.label ?? 'data'}>`}
        {typeof cellData === 'string' && cellData}
        {typeof cellData === 'number' && cellData}
        {typeof cellData === 'object' && JSON.stringify(cellData)}
      </WrapElement>
    );
  }

  return (
    <WrapElement {...wrapElementProps}>
      <CellComponent
        field={field}
        data={cellData}
      />
    </WrapElement>
  );
};

const Cell: React.FC<Props> = (props) => {
  const {
    colIndex,
    collection,
    cellData,
    rowData,
    field,
    field: {
      admin: {
        components: {
          Cell: CustomCell,
        } = {},
      } = {},
    },
  } = props;

  return (
    <RenderCustomComponent
      componentProps={{
        rowData,
        colIndex,
        cellData,
        collection,
        field,
      }}
      CustomComponent={CustomCell}
      DefaultComponent={DefaultCell}
    />
  );
};

export default Cell;
