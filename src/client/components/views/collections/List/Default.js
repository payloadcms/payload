import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Paginator from '../../../elements/Paginator';
import ListControls from '../../../elements/ListControls';
import Pill from '../../../elements/Pill';
import Button from '../../../elements/Button';
import SortColumn from '../../../elements/SortColumn';
import Table from '../../../elements/Table';
import Cell from './Cell';

import './index.scss';

const { serverURL, routes: { api, admin } } = PAYLOAD_CONFIG;

const baseClass = 'collection-list';

const DefaultList = (props) => {
  const {
    collection,
    collection: {
      fields,
      slug,
      labels: {
        singular: singularLabel,
        plural: pluralLabel,
      },
    },
  } = props;

  const location = useLocation();
  const [listControls, setListControls] = useState({});
  const [sort, setSort] = useState(null);
  const newDocumentURL = `${admin}/collections/${slug}/create`;

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = `${serverURL}${api}/${slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    const params = {};

    if (page) params.page = page;
    if (sort) params.sort = sort;
    if (listControls?.where) params.where = listControls.where;

    setParams(params);
  }, [setParams, page, sort, listControls]);

  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        <h1>{pluralLabel}</h1>
        <Pill to={newDocumentURL}>
          Create New
        </Pill>
      </header>
      <ListControls
        handleChange={setListControls}
        collection={collection}
      />
      {(data.docs && data.docs.length > 0) && (
        <Table
          data={data.docs}
          columns={listControls.columns.map((col, colIndex) => {
            const field = fields.find(fieldToCheck => fieldToCheck.name === col);
            return {
              accessor: field.name,
              components: {
                Heading: (
                  <SortColumn
                    label={field.label}
                    name={field.name}
                    handleChange={setSort}
                  />
                ),
                renderCell: (rowData, cellData) => {
                  return (
                    <Cell
                      field={field}
                      colIndex={colIndex}
                      collection={collection}
                      rowData={rowData}
                      cellData={cellData}
                    />
                  );
                },
              },
            };
          })}
        />
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
          <Button
            el="link"
            to={newDocumentURL}
          >
            Create new
            {' '}
            {singularLabel}
          </Button>
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
  );
};

DefaultList.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
    timestamps: PropTypes.bool,
  }).isRequired,
};

export default DefaultList;
