import React, { Fragment, useState, useEffect } from 'react';
import equal from 'deep-equal';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig } from '../../../../utilities/Config';
import { useAuth } from '../../../../utilities/Auth';
import { Where } from '../../../../../../types';
import MinimalTemplate from '../../../../templates/Minimal';
import Button from '../../../../elements/Button';
import usePayloadAPI from '../../../../../hooks/usePayloadAPI';
import ListControls from '../../../../elements/ListControls';
import Paginator from '../../../../elements/Paginator';
import UploadGallery from '../../../../elements/UploadGallery';
import { Props } from './types';
import PerPage from '../../../../elements/PerPage';
import formatFields from '../../../../views/collections/List/formatFields';
import { getFilterOptionsQuery } from '../../getFilterOptionsQuery';
import { useDocumentInfo } from '../../../../utilities/DocumentInfo';
import { useWatchForm } from '../../../Form/context';
import ViewDescription from '../../../../elements/ViewDescription';

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
    path,
    filterOptions,
  } = props;

  const { serverURL, routes: { api } } = useConfig();
  const { id } = useDocumentInfo();
  const { user } = useAuth();
  const { getData, getSiblingData } = useWatchForm();
  const { closeAll, currentModal } = useModal();
  const [fields] = useState(() => formatFields(collection));
  const [limit, setLimit] = useState(defaultLimit);
  const [sort, setSort] = useState(null);
  const [where, setWhere] = useState(null);
  const [page, setPage] = useState(null);
  const [optionFilters, setOptionFilters] = useState<Where>();

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
    if (where) params.where = { and: [where, optionFilters] };
    if (sort) params.sort = sort;
    if (limit) params.limit = limit;

    setParams(params);
  }, [setParams, page, sort, where, limit, optionFilters]);

  useEffect(() => {
    if (!filterOptions || !isOpen) {
      return;
    }

    const newOptionFilters = getFilterOptionsQuery(filterOptions, {
      id,
      relationTo: collectionSlug,
      data: getData(),
      siblingData: getSiblingData(path),
      user,
    })[collectionSlug];
    if (!equal(newOptionFilters, optionFilters)) {
      setOptionFilters(newOptionFilters);
    }
  }, [collectionSlug, filterOptions, optionFilters, id, getData, getSiblingData, path, user, isOpen]);

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
              <div className={`${baseClass}__sub-header`}>
                <ViewDescription description={description} />
              </div>
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
                  limits={collection?.admin?.pagination?.limits}
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
