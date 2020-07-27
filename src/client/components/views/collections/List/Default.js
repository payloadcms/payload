import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import config from 'payload/config';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
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

const { serverURL, routes: { api, admin } } = config;

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
  } = props;

  const history = useHistory();
  const location = useLocation();
  const [listControls, setListControls] = useState({});
  const [sort, setSort] = useState(null);
  const newDocumentURL = `${admin}/collections/${slug}/create`;

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = `${serverURL}${api}/${slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, { initialParams: { depth: 0 } });

  useEffect(() => {
    const params = {
      depth: 0,
    };

    if (page) params.page = page;
    if (sort) params.sort = sort;
    if (listControls?.where) params.where = listControls.where;

    setParams(params);
  }, [setParams, page, sort, listControls]);

  return (
    <div className={baseClass}>
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <header className={`${baseClass}__header`}>
          <h1>{pluralLabel}</h1>
          <Pill to={newDocumentURL}>
            Create New
          </Pill>
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
    </div>
  );
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
};

export default DefaultList;
