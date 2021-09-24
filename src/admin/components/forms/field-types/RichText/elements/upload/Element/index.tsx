import React, { useState, useEffect, useCallback } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useEditor, useFocused, useSelected } from 'slate-react';
import { useConfig } from '@payloadcms/config-provider';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import FileGraphic from '../../../../../../graphics/File';
import useThumbnail from '../../../../../../../hooks/useThumbnail';
import MinimalTemplate from '../../../../../../templates/Minimal';
import UploadGallery from '../../../../../../elements/UploadGallery';
import ListControls from '../../../../../../elements/ListControls';
import Button from '../../../../../../elements/Button';
import Paginator from '../../../../../../elements/Paginator';
import formatFields from '../../../../../../views/collections/List/formatFields';
import { Field } from '../../../../../../../../fields/config/types';

import './index.scss';

const baseClass = 'rich-text-upload';

const initialParams = {
  depth: 0,
};

const Element = ({ attributes, children, element, path }) => {
  const { relationTo, value } = element;
  const { closeAll, currentModal, open } = useModal();
  const { collections, serverURL, routes: { api } } = useConfig();
  const [renderModal, setRenderModal] = useState(false);
  const [listControls, setListControls] = useState<{where?: unknown}>({});
  const [page, setPage] = useState(null);
  const [sort, setSort] = useState(null);
  const [relatedCollection] = useState(() => collections.find((coll) => coll.slug === relationTo));
  const [fields, setFields] = useState(relatedCollection?.fields);
  const editor = useEditor();
  const selected = useSelected();
  const focused = useFocused();
  const modalSlug = `${path}-edit-upload`;
  const isOpen = currentModal === modalSlug;

  const [{ data: upload }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

  const apiURL = isOpen ? `${serverURL}${api}/${relatedCollection.slug}` : null;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  const thumbnailSRC = useThumbnail(relatedCollection, upload);

  const handleUpdateUpload = useCallback((doc) => {
    const newNode = {
      type: 'upload',
      value: { id: doc.id },
      relationTo: relatedCollection.slug,
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
  }, [closeAll, editor, element, relatedCollection]);

  useEffect(() => {
    setFields(formatFields(relatedCollection) as Field[]);
  }, [relatedCollection]);

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
    } = {};

    if (page) params.page = page;
    if (listControls?.where) params.where = listControls.where;
    if (sort) params.sort = sort;

    setParams(params);
  }, [setParams, page, listControls, sort]);

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
          className={`${baseClass}__modal`}
          slug={modalSlug}
        >
          {isOpen && (
            <MinimalTemplate width="wide">
              <header className={`${baseClass}__modal-header`}>
                <div>
                  <h1>
                    {' '}
                    Select existing
                    {' '}
                    {relatedCollection.labels.singular}
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
                </div>
                {relatedCollection?.admin?.description && (
                  <div className={`${baseClass}__modal-sub-header`}>{relatedCollection?.admin?.description}</div>
                )}
              </header>
              <ListControls
                handleChange={setListControls}
                collection={{
                  ...relatedCollection,
                  fields,
                }}
                enableColumns={false}
                setSort={setSort}
                enableSort
              />
              <UploadGallery
                docs={data?.docs}
                collection={relatedCollection}
                onCardClick={(doc) => {
                  handleUpdateUpload(doc);
                  setRenderModal(false);
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
      )}
    </div>
  );
};

export default Element;
