import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, useModal } from '@faceless-ui/modal';
import config from '../../../../../config';
import MinimalTemplate from '../../../../templates/Minimal';
import Button from '../../../../elements/Button';
import formatFields from '../../../../views/collections/List/formatFields';
import usePayloadAPI from '../../../../../hooks/usePayloadAPI';
import ListControls from '../../../../elements/ListControls';
import Paginator from '../../../../elements/Paginator';
import UploadGallery from '../../../../elements/UploadGallery';

import './index.scss';

const { serverURL, routes: { api } } = config;

const baseClass = 'select-existing-upload-modal';

const SelectExistingUploadModal = (props) => {
  const {
    setValue,
    collection,
    collection: {
      slug: collectionSlug,
    } = {},
    slug: modalSlug,
  } = props;

  const { closeAll } = useModal();
  const [fields, setFields] = useState(collection.fields);
  const [listControls, setListControls] = useState({});
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
    if (listControls?.where) params.where = listControls.where;

    setParams(params);
  }, [setParams, page, listControls]);

  return (
    <Modal
      className={classes}
      slug={modalSlug}
    >
      <MinimalTemplate width="wide">
        <header className={`${baseClass}__header`}>
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
          enableColumns={false}
          handleChange={setListControls}
          collection={{
            ...collection,
            fields,
          }}
        />
        <UploadGallery
          docs={data?.docs}
          collection={collection}
          onCardClick={(doc) => {
            setValue(doc);
            closeAll();
          }}
        />
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
            onChange={setPage}
            disableHistoryChange
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
      </MinimalTemplate>
    </Modal>
  );
};

SelectExistingUploadModal.propTypes = {
  setValue: PropTypes.func.isRequired,
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
    fields: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
  }).isRequired,
  slug: PropTypes.string.isRequired,
};

export default SelectExistingUploadModal;
