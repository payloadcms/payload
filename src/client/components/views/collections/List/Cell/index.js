import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import format from 'date-fns/format';
import config from 'payload/config';
import RenderCustomComponent from '../../../../utilities/RenderCustomComponent';
import Thumbnail from '../../../../elements/Thumbnail';
import Relationship from './Relationship';

const { routes: { admin } } = config;

const DefaultCell = (props) => {
  const {
    field,
    colIndex,
    collection: {
      slug,
      upload: {
        staticURL,
        adminThumbnail,
      } = {},
    },
    cellData,
    rowData: {
      id,
      filename,
      mimeType,
      sizes,
    } = {},
  } = props;

  let WrapElement = 'span';

  const wrapElementProps = {};

  if (colIndex === 0) {
    WrapElement = Link;
    wrapElementProps.to = `${admin}/collections/${slug}/${id}`;
  }

  if (field.type === 'thumbnail') {
    return (
      <WrapElement {...wrapElementProps}>
        <Thumbnail
          size="small"
          {...{
            mimeType, adminThumbnail, sizes, staticURL, filename,
          }}
        />
      </WrapElement>
    );
  }

  if (field.type === 'relationship') {
    return (
      <WrapElement {...wrapElementProps}>
        <Relationship
          field={field}
          cellData={cellData}
        />
      </WrapElement>
    );
  }

  if (field.type === 'date' && cellData) {
    return (
      <WrapElement {...wrapElementProps}>
        <span>
          {format(new Date(cellData), 'MMMM do yyyy, h:mma')}
        </span>
      </WrapElement>
    );
  }

  return (
    <WrapElement {...wrapElementProps}>
      {field.type !== 'date' && (
        <React.Fragment>
          {typeof cellData === 'string' && cellData}
          {typeof cellData === 'number' && cellData}
          {typeof cellData === 'object' && JSON.stringify(cellData)}
        </React.Fragment>
      )}
    </WrapElement>
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
    upload: PropTypes.shape({
      staticDir: PropTypes.string,
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
  }).isRequired,
};

DefaultCell.defaultProps = defaultProps;
DefaultCell.propTypes = propTypes;
Cell.defaultProps = defaultProps;
Cell.propTypes = propTypes;

export default Cell;
