import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import { useConfig } from '@payloadcms/config-provider';
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

import './index.scss';
import '../modal.scss';

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

  const nodes = [upload, { children: [{ text: '' }] }];

  if (editor.blurSelection) {
    Transforms.select(editor, editor.blurSelection);
  }

  Transforms.insertNodes(editor, nodes);

  const currentPath = editor.selection.anchor.path[0];
  const newSelection = { anchor: { path: [currentPath + 1, 0], offset: 0 }, focus: { path: [currentPath + 1, 0], offset: 0 } };

  Transforms.select(editor, newSelection);
  ReactEditor.focus(editor);
};

const UploadButton: React.FC<{path: string}> = ({ path }) => {
  const { open, closeAll, currentModal } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [availableCollections] = useState(() => collections.filter(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [renderModal, setRenderModal] = useState(false);
  const [modalCollectionOption, setModalCollectionOption] = useState<{ label: string, value: string}>(() => {
    const firstAvailableCollection = collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship));
    return { label: firstAvailableCollection.labels.singular, value: firstAvailableCollection.slug };
  });
  const [modalCollection, setModalCollection] = useState<SanitizedCollectionConfig>(() => collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [listControls, setListControls] = useState<{where?: unknown}>({});
  const [page, setPage] = useState(null);
  const [sort, setSort] = useState(null);
  const [fields, setFields] = useState(formatFields(modalCollection));
  const [hasEnabledCollections] = useState(() => collections.find(({ upload, admin: { enableRichTextRelationship } }) => upload && enableRichTextRelationship));

  const modalSlug = `${path}-add-upload`;
  const moreThanOneAvailableCollection = availableCollections.length > 1;
  const isOpen = currentModal === modalSlug;

  // If modal is open, get active page of upload gallery
  const apiURL = isOpen ? `${serverURL}${api}/${modalCollection.slug}` : null;
  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    setFields(formatFields(modalCollection));
  }, [modalCollection]);

  useEffect(() => {
    if (renderModal) {
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

  useEffect(() => {
    setModalCollection(collections.find(({ slug }) => modalCollectionOption.value === slug));
  }, [modalCollectionOption, collections]);

  if (!hasEnabledCollections) return null;

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
                handleChange={setListControls}
                collection={{
                  ...modalCollection,
                  fields,
                }}
                enableColumns={false}
                setSort={setSort}
                enableSort
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
    </Fragment>
  );
};

export default UploadButton;
