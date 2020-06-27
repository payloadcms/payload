import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, useModal } from '@trbl/react-modal';
import config from '../../../../../config';
import MinimalTemplate from '../../../../templates/Minimal';
import Form from '../../../Form';
import Button from '../../../../elements/Button';
import formatFields from '../../../../views/collections/List/formatFields';
import usePayloadAPI from '../../../../../hooks/usePayloadAPI';
import ListControls from '../../../../elements/ListControls';
import Paginator from '../../../../elements/Paginator';

import './index.scss';

const { serverURL, routes: { api } } = config;

const baseClass = 'select-existing-upload-modal';

const SelectExistingUploadModal = (props) => {
  const {
    collection,
    collection: {
      slug: collectionSlug,
      labels: {
        plural: pluralLabel,
        singular: singularLabel,
      },
    } = {},
    slug: modalSlug,
    addModalSlug,
  } = props;

  const { closeAll, toggle } = useModal();
  const [fields, setFields] = useState(collection.fields);
  const [listControls, setListControls] = useState({});
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(null);

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  const apiURL = `${serverURL}${api}/${collectionSlug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    setFields(formatFields(collection));
  }, [collection]);

  useEffect(() => {
    const params = {};

    if (page) params.page = page;
    if (sort) params.sort = sort;
    if (listControls?.where) params.where = listControls.where;

    setParams(params);
  }, [setParams, page, sort, listControls]);

  return (
    <Modal
      className={classes}
      slug={modalSlug}
    >
      <MinimalTemplate width="wide">
        <Form>
          <header>
            <h1>
              {' '}
              Select existing
              {' '}
              {collection.labels.singular}
            </h1>
            <Button
              icon="x"
              round
              buttonStyle="icon-label"
              iconStyle="with-border"
              onClick={closeAll}
            />
          </header>
          <ListControls
            handleChange={setListControls}
            collection={{
              ...collection,
              fields,
            }}
          />
          {(data.docs && data.docs.length > 0) && (
            <ul>
              {data.docs.map((doc, i) => {
                return (
                  <li key={i}>
                    doc.id
                  </li>
                );
              })}
            </ul>
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
                onClick={() => {
                  toggle(addModalSlug);
                }}
              >
                Upload new
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
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

SelectExistingUploadModal.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
  }).isRequired,
  slug: PropTypes.string.isRequired,
  addModalSlug: PropTypes.string.isRequired,
};

export default SelectExistingUploadModal;
