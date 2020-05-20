import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import customComponents from '../../../customComponents';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Paginator from '../../../elements/Paginator';
import Text from '../../../forms/field-types/Text';

import './index.scss';

const { serverURL, routes: { api, admin } } = PAYLOAD_CONFIG;

const baseClass = 'collection-list';

const DefaultList = (props) => {
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState(null);
  const [filters, setFilters] = useState(null);

  const location = useLocation();
  const { collection } = props;

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = `${serverURL}${api}/${collection.slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    const params = {
      where: {
      },
    };

    if (page) params.page = page;

    if (search) {
      params.where[collection.useAsTitle || 'id'] = {
        like: search,
      };
    }

    setParams(params);
  }, [search, setParams, page, collection.useAsTitle]);

  return (
    <div className={baseClass}>
      <h1>{collection.labels.plural}</h1>
      <div className={`${baseClass}__controls`}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {data.docs && (
        <ul>
          {data.docs.map((doc) => {
            return (
              <li key={doc.id}>
                <Link to={`${admin}/collections/${collection.slug}/${doc.id}`}>
                  {doc[collection.useAsTitle || 'id']}
                </Link>
              </li>
            );
          })}
        </ul>
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
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
  }).isRequired,
};

const ListView = (props) => {
  const { collection } = props;
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([
      {
        label: collection.labels.plural,
      },
    ]);
  }, [setStepNav, collection.labels.plural]);

  const List = customComponents?.[collection.slug]?.views?.List || DefaultList;

  return (
    <>
      <List collection={collection} />
    </>
  );
};

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
  }).isRequired,
};

export default ListView;
