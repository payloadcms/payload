import React, { Fragment, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import { useConfig } from '../../../../../../utilities/Config';
import ElementButton from '../../Button';
import UploadIcon from '../../../../../../icons/Upload';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import UploadGallery from '../../../../../../elements/UploadGallery';
import ListControls from '../../../../../../elements/ListControls';
import ReactSelect from '../../../../../../elements/ReactSelect';
import Paginator from '../../../../../../elements/Paginator';
import formatFields from '../../../../../../views/collections/List/formatFields';
import Label from '../../../../../Label';
import MinimalTemplate from '../../../../../../templates/Minimal';
import Button from '../../../../../../elements/Button';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import PerPage from '../../../../../../elements/PerPage';
import { injectVoidElement } from '../../injectVoid';

import './index.scss';
import '../addSwapModals.scss';

const baseClass = 'upload-rich-text-button';
const baseModalClass = 'rich-text-upload-modal';

const insertUpload = (editor, { value, relationTo }) => {
  const text = { text: ' ' };

  const upload = {
    type: 'upload',
    value,
    relationTo,
    children: [
      text,
    ],
  };

  injectVoidElement(editor, upload);

  ReactEditor.focus(editor);
};

const UploadButton: React.FC<{ path: string }> = ({ path }) => {
  const { toggleModal, isModalOpen } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [availableCollections] = useState(() => collections.filter(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [renderModal, setRenderModal] = useState(false);
  const [modalCollectionOption, setModalCollectionOption] = useState<{ label: string, value: string }>(() => {
    const firstAvailableCollection = collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship));
    if (firstAvailableCollection) {
      return { label: firstAvailableCollection.labels.singular, value: firstAvailableCollection.slug };
    }

    return undefined;
  });
  const [modalCollection, setModalCollection] = useState<SanitizedCollectionConfig>(() => collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));

  const [fields, setFields] = useState(() => (modalCollection ? formatFields(modalCollection) : undefined));
  const [limit, setLimit] = useState<number>();
  const [sort, setSort] = useState(null);
  const [where, setWhere] = useState(null);
  const [page, setPage] = useState(null);

  const modalSlug = `${path}-add-upload`;
  const moreThanOneAvailableCollection = availableCollections.length > 1;
  const isOpen = isModalOpen(modalSlug);

  // If modal is open, get active page of upload gallery
  const apiURL = isOpen ? `${serverURL}${api}/${modalCollection.slug}` : null;
  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    if (modalCollection) {
      setFields(formatFields(modalCollection));
    }
  }, [modalCollection]);

  useEffect(() => {
    if (renderModal) {
      toggleModal(modalSlug);
    }
  }, [renderModal, toggleModal, modalSlug]);

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

  useEffect(() => {
    if (modalCollectionOption) {
      setModalCollection(collections.find(({ slug }) => modalCollectionOption.value === slug));
    }
  }, [modalCollectionOption, collections]);

  if (!modalCollection) {
    return null;
  }

  return (
    <Fragment>
      <ElementButton
        className={baseClass}
        format="upload"
        onClick={() => setRenderModal(true)}
      >
        <UploadIcon />
      </ElementButton>
      {renderModal && (
        <Modal
          className={baseModalClass}
          slug={modalSlug}
        >
          {isOpen && (
            <MinimalTemplate width="wide">
              <header className={`${baseModalClass}__header`}>
                <h1>
                  Add
                  {' '}
                  {modalCollection.labels.singular}
                </h1>
                <Button
                  icon="x"
                  round
                  buttonStyle="icon-label"
                  iconStyle="with-border"
                  onClick={() => {
                    toggleModal(modalSlug);
                    setRenderModal(false);
                  }}
                />
              </header>
              {moreThanOneAvailableCollection && (
                <div className={`${baseModalClass}__select-collection-wrap`}>
                  <Label label="Select a Collection to Browse" />
                  <ReactSelect
                    className={`${baseClass}__select-collection`}
                    value={modalCollectionOption}
                    onChange={setModalCollectionOption}
                    options={availableCollections.map((coll) => ({ label: coll.labels.singular, value: coll.slug }))}
                  />
                </div>
              )}
              <ListControls
                collection={{
                  ...modalCollection,
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
                collection={modalCollection}
                onCardClick={(doc) => {
                  insertUpload(editor, {
                    value: {
                      id: doc.id,
                    },
                    relationTo: modalCollection.slug,
                  });
                  setRenderModal(false);
                  toggleModal(modalSlug);
                }}
              />
              <div className={`${baseModalClass}__page-controls`}>
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
                    <div className={`${baseModalClass}__page-info`}>
                      {data.page}
                      -
                      {data.totalPages > 1 ? data.limit : data.totalDocs}
                      {' '}
                      of
                      {' '}
                      {data.totalDocs}
                    </div>
                    <PerPage
                      limits={modalCollection?.admin?.pagination?.limits}
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
      )}
    </Fragment>
  );
};

export default UploadButton;
