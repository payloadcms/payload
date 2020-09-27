import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useConfig } from '../../../../providers/Config';
import RenderCustomComponent from '../../../../utilities/RenderCustomComponent';
import cellComponents from './types';

const DefaultCell = (props) => {
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

  let WrapElement = 'span';

  const wrapElementProps = {};

  if (colIndex === 0) {
    WrapElement = Link;
    wrapElementProps.to = `${admin}/collections/${slug}/${id}`;
  }

  const CellComponent = cellComponents[field.type];

  if (!CellComponent) {
    return (
      <WrapElement {...wrapElementProps}>
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

const Cell = (props) => {
  const {
    colIndex,
    collection,
    cellData,
    rowData,
    field,
    field: {
      admin: {
        components: {
          cell: CustomCell,
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

const defaultProps = {
  cellData: undefined,
};

const propTypes = {
  colIndex: PropTypes.number.isRequired,
  collection: PropTypes.shape({
    slug: PropTypes.string,
    upload: PropTypes.shape({
      adminThumbnail: PropTypes.string,
    }),
  }).isRequired,
  cellData: PropTypes.oneOfType([
    PropTypes.shape({}),
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
    PropTypes.array,
    PropTypes.bool,
  ]),
  rowData: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  field: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    admin: PropTypes.shape({
      components: PropTypes.shape({
        cell: PropTypes.func,
      }),
    }),
  }).isRequired,
};

DefaultCell.defaultProps = defaultProps;
DefaultCell.propTypes = propTypes;
Cell.defaultProps = defaultProps;
Cell.propTypes = propTypes;

export default Cell;
