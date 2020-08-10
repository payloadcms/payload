import React from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from 'payload/config';
import UploadGallery from '../../../elements/UploadGallery';
import Eyebrow from '../../../elements/Eyebrow';
import Paginator from '../../../elements/Paginator';
import ListControls from '../../../elements/ListControls';
import Pill from '../../../elements/Pill';
import Button from '../../../elements/Button';
import SortColumn from '../../../elements/SortColumn';
import Table from '../../../elements/Table';
import Cell from './Cell';

import './index.scss';

const { routes: { admin } } = config;

const baseClass = 'collection-list';

const DefaultList = (props) => {
  const {
    collection,
    collection: {
      upload,
      fields,
      slug,
      labels: {
        singular: singularLabel,
        plural: pluralLabel,
      },
    },
    data,
    newDocumentURL,
    setListControls,
    listControls,
    setSort,
    hasCreatePermission,
  } = props;

  const history = useHistory();

  return (
    <div className={baseClass}>
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <header className={`${baseClass}__header`}>
          <h1>{pluralLabel}</h1>
          {hasCreatePermission && (
            <Pill to={newDocumentURL}>
              Create New
            </Pill>
          )}
        </header>
        <ListControls
          handleChange={setListControls}
          collection={collection}
          enableColumns={!upload}
        />
        {(data.docs && data.docs.length > 0) && (
          <React.Fragment>
            {!upload && (
              <Table
                data={data.docs}
                columns={listControls.columns.reduce((cols, col, colIndex) => {
                  const field = fields.find((fieldToCheck) => fieldToCheck.name === col);

                  if (field) {
                    return [
                      ...cols,
                      {
                        accessor: field.name,
                        components: {
                          Heading: (
                            <SortColumn
                              label={field.label}
                              name={field.name}
                              handleChange={setSort}
                              disable={field.disableSort || undefined}
                            />
                          ),
                          renderCell: (rowData, cellData) => (
                            <Cell
                              field={field}
                              colIndex={colIndex}
                              collection={collection}
                              rowData={rowData}
                              cellData={cellData}
                            />
                          ),
                        },
                      },
                    ];
                  }

                  return cols;
                }, [])}
              />
            )}
            {upload && (
              <UploadGallery
                docs={data.docs}
                collection={collection}
                onCardClick={(doc) => history.push(`${admin}/collections/${slug}/${doc.id}`)}
              />
            )}
          </React.Fragment>
        )}
        {data.docs && data.docs.length === 0 && (
          <div className={`${baseClass}__no-results`}>
            <p>
              No
              {' '}
              {pluralLabel}
              {' '}
              found. Either no
              {' '}
              {pluralLabel}
              {' '}
              exist yet or none match the filters you&apos;ve specified above.
            </p>
            {hasCreatePermission && (
              <Button
                el="link"
                to={newDocumentURL}
              >
                Create new
                {' '}
                {singularLabel}
              </Button>
            )}
          </div>
        )}
        <div className={`${baseClass}__page-controls`}>
          <Paginator
            limit={data.limit}
            totalPages={data.totalPages}
            page={data.page}
            hasPrevPage={data.hasPrevPage}
            hasNextPage={data.hasNextPage}
            prevPage={data.prevPage}
            nextPage={data.nextPage}
            numberOfNeighbors={1}
          />
          {data?.totalDocs > 0 && (
            <div className={`${baseClass}__page-info`}>
              {data.page}
              -
              {data.totalPages > 1 ? data.limit : data.totalDocs}
              {' '}
              of
              {' '}
              {data.totalDocs}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DefaultList.defaultProps = {
  data: null,
};

DefaultList.propTypes = {
  collection: PropTypes.shape({
    upload: PropTypes.shape({}),
    labels: PropTypes.shape({
      singular: PropTypes.string,
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    admin: PropTypes.shape({
      useAsTitle: PropTypes.string,
    }),
    fields: PropTypes.arrayOf(PropTypes.shape),
    timestamps: PropTypes.bool,
  }).isRequired,
  newDocumentURL: PropTypes.string.isRequired,
  data: PropTypes.shape({
    docs: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
    limit: PropTypes.number,
    nextPage: PropTypes.number,
    prevPage: PropTypes.number,
    totalDocs: PropTypes.number,
    hasNextPage: PropTypes.bool,
    hasPrevPage: PropTypes.bool,
    page: PropTypes.number,
    totalPages: PropTypes.number,
  }),
  setListControls: PropTypes.func.isRequired,
  setSort: PropTypes.func.isRequired,
  listControls: PropTypes.shape({
    columns: PropTypes.arrayOf(
      PropTypes.string,
    ),
  }).isRequired,
  hasCreatePermission: PropTypes.bool.isRequired,
};

export default DefaultList;
