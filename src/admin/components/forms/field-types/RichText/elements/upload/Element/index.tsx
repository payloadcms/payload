import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { useConfig } from '@payloadcms/config-provider';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import FileGraphic from '../../../../../../graphics/File';
import useThumbnail from '../../../../../../../hooks/useThumbnail';
import MinimalTemplate from '../../../../../../templates/Minimal';
import UploadGallery from '../../../../../../elements/UploadGallery';
import ListControls from '../../../../../../elements/ListControls';
import Button from '../../../../../../elements/Button';
import ReactSelect from '../../../../../../elements/ReactSelect';
import Paginator from '../../../../../../elements/Paginator';
import formatFields from '../../../../../../views/collections/List/formatFields';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import PerPage from '../../../../../../elements/PerPage';
import Label from '../../../../../Label';

import './index.scss';
import '../modal.scss';

const baseClass = 'rich-text-upload';
const baseModalClass = 'rich-text-upload-modal';

const initialParams = {
  depth: 0,
};

const Element = ({ attributes, children, element, path }) => {
  const { relationTo, value } = element;
  const { closeAll, currentModal, open } = useModal();
  const { collections, serverURL, routes: { api } } = useConfig();
  const [availableCollections] = useState(() => collections.filter(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [renderModal, setRenderModal] = useState(false);
  const [relatedCollection, setRelatedCollection] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => coll.slug === relationTo));
  const [modalCollectionOption, setModalCollectionOption] = useState<{ label: string, value: string}>({ label: relatedCollection.labels.singular, value: relatedCollection.slug });
  const [modalCollection, setModalCollection] = useState<SanitizedCollectionConfig>(relatedCollection);

  const [fields, setFields] = useState(() => formatFields(modalCollection));
  const [limit, setLimit] = useState<number>();
  const [sort, setSort] = useState(null);
  const [where, setWhere] = useState(null);
  const [page, setPage] = useState(null);

  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();

  const modalSlug = `${path}-edit-upload`;
  const isOpen = currentModal === modalSlug;
  const moreThanOneAvailableCollection = availableCollections.length > 1;

  // Get the referenced document
  const [{ data: upload }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

  // If modal is open, get active page of upload gallery
  const apiURL = isOpen ? `${serverURL}${api}/${modalCollection.slug}` : null;
  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  const thumbnailSRC = useThumbnail(relatedCollection, upload);

  const handleUpdateUpload = useCallback((doc) => {
    const newNode = {
      type: 'upload',
      value: { id: doc.id },
      relationTo: modalCollection.slug,
      children: [
        { text: ' ' },
      ],
    };

    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      newNode,
      { at: elementPath },
    );
    closeAll();
  }, [closeAll, editor, element, modalCollection]);

  useEffect(() => {
    setFields(formatFields(modalCollection));
    setLimit(modalCollection.admin.pagination.defaultLimit);
  }, [modalCollection]);

  useEffect(() => {
    if (renderModal && modalSlug) {
      open(modalSlug);
    }
  }, [renderModal, open, modalSlug]);

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
    setModalCollection(collections.find(({ slug }) => modalCollectionOption.value === slug));
  }, [modalCollectionOption, collections]);

  return (
    <div
      className={[
        baseClass,
        (selected && focused) && `${baseClass}--selected`,
      ].filter(Boolean).join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <div className={`${baseClass}__thumbnail`}>
        {thumbnailSRC && (
          <img
            src={thumbnailSRC}
            alt={upload?.filename}
          />
        )}
        {!thumbnailSRC && (
          <FileGraphic />
        )}
      </div>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__label`}>
          {relatedCollection.labels.singular}
        </div>
        <h5>{upload?.filename}</h5>
      </div>
      <Button
        icon="edit"
        round
        buttonStyle="icon-label"
        iconStyle="with-border"
        className={`${baseClass}__button`}
        onClick={(e) => {
          e.preventDefault();
          setRenderModal(true);
        }}
      />
      {children}
      {renderModal && (
        <Modal
          className={baseModalClass}
          slug={modalSlug}
        >
          {isOpen && (
            <MinimalTemplate width="wide">
              <header className={`${baseModalClass}__header`}>
                <h1>
                  Choose
                  {' '}
                  {modalCollection.labels.singular}
                </h1>
                <Button
                  icon="x"
                  round
                  buttonStyle="icon-label"
                  iconStyle="with-border"
                  onClick={() => {
                    closeAll();
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
                  handleUpdateUpload(doc);
                  setRelatedCollection(modalCollection);
                  setRenderModal(false);
                  closeAll();
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
                      collection={modalCollection}
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
    </div>
  );
};

export default Element;
