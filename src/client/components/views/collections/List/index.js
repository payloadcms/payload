import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import customComponents from '../../../customComponents';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Paginator from '../../../elements/Paginator';
import ListControls from '../../../elements/ListControls';
import Pill from '../../../elements/Pill';
import Button from '../../../elements/Button';
import SortColumn from '../../../elements/SortColumn';
import Table from '../../../elements/Table';

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
          columns={listControls.columns.map((col, i) => {
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
                  if (i === 0) {
                    return (
                      <>
                        <Link to={`${admin}/collections/${collection.slug}/${rowData.id}`}>
                          {cellData}
                        </Link>
                      </>
                    );
                  }

                  return cellData;
                },
              },
            };
          })}
        />
      )}
      {(!data.docs || data.docs.length === 0) && (
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
      <Paginator
        totalDocs={data.totalDocs}
        limit={data.limit}
        totalPages={data.totalPages}
        page={data.page}
        hasPrevPage={data.hasPrevPage}
        hasNextPage={data.hasNextPage}
        prevPage={data.prevPage}
        nextPage={data.nextPage}
        numberOfNeighbors={1}
      />
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

const ListView = (props) => {
  const {
    collection,
    collection: {
      slug,
      fields,
      timestamps,
      labels: {
        plural,
      },
    },
  } = props;
  const { setStepNav } = useStepNav();

  let allFields = [...fields, { name: 'id', label: 'ID' }];

  if (timestamps) {
    allFields = allFields.concat([{ name: 'createdAt', label: 'Created At' }, { name: 'modifiedAt', label: 'Modified At' }]);
  }

  useEffect(() => {
    setStepNav([
      {
        label: plural,
      },
    ]);
  }, [setStepNav, plural]);

  const List = customComponents?.[slug]?.views?.List || DefaultList;

  return (
    <>
      <List collection={{ ...collection, fields: allFields }} />
    </>
  );
};

ListView.propTypes = {
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

export default ListView;
