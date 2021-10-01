import React, { useState, useEffect } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import MinimalTemplate from '../../../../templates/Minimal';
import Button from '../../../../elements/Button';
import formatFields from '../../../../views/collections/List/formatFields';
import usePayloadAPI from '../../../../../hooks/usePayloadAPI';
import ListControls from '../../../../elements/ListControls';
import Paginator from '../../../../elements/Paginator';
import UploadGallery from '../../../../elements/UploadGallery';
import { Field } from '../../../../../../fields/config/types';
import { Props } from './types';

import './index.scss';

const baseClass = 'select-existing-upload-modal';

const SelectExistingUploadModal: React.FC<Props> = (props) => {
  const {
    setValue,
    collection,
    collection: {
      slug: collectionSlug,
      admin: {
        description,
      } = {},
    } = {},
    slug: modalSlug,
  } = props;

  const { serverURL, routes: { api } } = useConfig();
  const { closeAll, currentModal } = useModal();
  const [fields, setFields] = useState(collection.fields);
  const [listControls, setListControls] = useState<{where?: unknown}>({});
  const [page, setPage] = useState(null);
  const [sort, setSort] = useState(null);

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  const isOpen = currentModal === modalSlug;

  const apiURL = isOpen ? `${serverURL}${api}/${collectionSlug}` : null;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    setFields(formatFields(collection) as Field[]);
  }, [collection]);

  useEffect(() => {
    const params: {
      page?: number
      sort?: string
      where?: unknown
    } = {};

    if (page) params.page = page;
    if (listControls?.where) params.where = listControls.where;
    if (sort) params.sort = sort;

    setParams(params);
  }, [setParams, page, listControls, sort]);


  return (
    <Modal
      className={classes}
      slug={modalSlug}
    >
      {isOpen && (
        <MinimalTemplate width="wide">
          <header className={`${baseClass}__header`}>
            <div>
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
            </div>
            {description && (
              <div className={`${baseClass}__sub-header`}>{description}</div>
            )}
          </header>
          <ListControls
            handleChange={setListControls}
            collection={{
              ...collection,
              fields,
            }}
            enableColumns={false}
            setSort={setSort}
            enableSort
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
      )}
    </Modal>
  );
};

export default SelectExistingUploadModal;
