import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import moment from 'moment';
import config from 'payload/config';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';

const { routes: { admin } } = config;

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

  let WrapElement = 'span';

  const wrapElementProps = {};

  if (colIndex === 0) {
    WrapElement = Link;
    wrapElementProps.to = `${admin}/collections/${slug}/${id}`;
  }

  return (
    <>
      <WrapElement {...wrapElementProps}>
        {(field.type === 'date' && cellData) && (
          <span>
            {moment(cellData).format('MMMM Do YYYY, h:mma')}
          </span>
        )}
        {field.type !== 'date' && (
          <>
            {typeof cellData === 'string' && cellData}
            {typeof cellData === 'object' && JSON.stringify(cellData)}
          </>
        )}
      </WrapElement>
    </>
  );
};

const Cell = (props) => {
  const {
    colIndex,
    collection,
    collection: {
      slug,
    },
    cellData,
    rowData,
    field,
    field: {
      name,
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
      path={`${slug}.fields.${name}.cell`}
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
  }).isRequired,
};

DefaultCell.defaultProps = defaultProps;
DefaultCell.propTypes = propTypes;
Cell.defaultProps = defaultProps;
Cell.propTypes = propTypes;

export default Cell;
