import React, { Fragment, useState, useEffect } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import MinimalTemplate from '../../../../templates/Minimal';
import Button from '../../../../elements/Button';
import usePayloadAPI from '../../../../../hooks/usePayloadAPI';
import ListControls from '../../../../elements/ListControls';
import Paginator from '../../../../elements/Paginator';
import UploadGallery from '../../../../elements/UploadGallery';
import { Props } from './types';
import PerPage from '../../../../elements/PerPage';
import formatFields from '../../../../views/collections/List/formatFields';

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
        pagination: {
          defaultLimit,
        },
      } = {},
    } = {},
    slug: modalSlug,
  } = props;

  const { serverURL, routes: { api } } = useConfig();
  const { closeAll, currentModal } = useModal();
  const [fields] = useState(() => formatFields(collection));
  const [limit, setLimit] = useState(defaultLimit);
  const [sort, setSort] = useState(null);
  const [where, setWhere] = useState(null);
  const [page, setPage] = useState(null);

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  const isOpen = currentModal === modalSlug;

  const apiURL = isOpen ? `${serverURL}${api}/${collectionSlug}` : null;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    const params: {
      page?: number
      sort?: string
      where?: unknown
      limit?: number
    } = {};

    if (page) params.page = page;
    if (where) params.where = where;
    if (sort) params.sort = sort;
    if (limit) params.limit = limit;

    setParams(params);
  }, [setParams, page, sort, where, limit]);

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
            collection={{
              ...collection,
              fields,
            }}
            enableColumns={false}
            enableSort
            modifySearchQuery={false}
            handleSortChange={setSort}
            handleWhereChange={setWhere}
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
              <Fragment>
                <div className={`${baseClass}__page-info`}>
                  {data.page}
                  -
                  {data.totalPages > 1 ? data.limit : data.totalDocs}
                  {' '}
                  of
                  {' '}
                  {data.totalDocs}
                </div>
                <PerPage
                  collection={collection}
                  limit={limit}
                  modifySearchParams={false}
                  handleChange={setLimit}
                />
              </Fragment>
            )}
          </div>
        </MinimalTemplate>
      )}
    </Modal>
  );
};

export default SelectExistingUploadModal;
