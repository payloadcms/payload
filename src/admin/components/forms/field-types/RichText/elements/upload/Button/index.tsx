import React, { Fragment, useEffect, useId, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { ReactEditor, useSlate } from 'slate-react';
import { useTranslation } from 'react-i18next';
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
import Button from '../../../../../../elements/Button';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import PerPage from '../../../../../../elements/PerPage';
import { injectVoidElement } from '../../injectVoid';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';
import { Drawer, formatDrawerSlug } from '../../../../../../elements/Drawer';
import { useEditDepth } from '../../../../../../utilities/EditDepth';
import { Gutter } from '../../../../../../elements/Gutter';
import './index.scss';

const baseClass = 'upload-rich-text-button';

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
  const { t, i18n } = useTranslation('upload');
  const { openModal, closeModal, isModalOpen } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [availableCollections] = useState(() => collections.filter(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [modalCollectionOption, setModalCollectionOption] = useState<{ label: string, value: string }>(() => {
    const firstAvailableCollection = collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship));
    if (firstAvailableCollection) {
      return { label: getTranslation(firstAvailableCollection.labels.singular, i18n), value: firstAvailableCollection.slug };
    }

    return undefined;
  });
  const [modalCollection, setModalCollection] = useState<SanitizedCollectionConfig>(() => collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [fields, setFields] = useState(() => (modalCollection ? formatFields(modalCollection, t) : undefined));
  const [limit, setLimit] = useState<number>();
  const [sort, setSort] = useState(null);
  const [where, setWhere] = useState(null);
  const [page, setPage] = useState(null);
  const editDepth = useEditDepth();
  const uuid = useId();
  const drawerSlug = formatDrawerSlug({
    slug: `${path}-add-upload-${uuid}`,
    depth: editDepth,
  });
  const moreThanOneAvailableCollection = availableCollections.length > 1;

  // If modal is open, get active page of upload gallery
  const isOpen = isModalOpen(drawerSlug);
  const apiURL = isOpen ? `${serverURL}${api}/${modalCollection.slug}` : null;
  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    if (modalCollection) {
      setFields(formatFields(modalCollection, t));
    }
  }, [modalCollection, t]);

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
        onClick={() => openModal(drawerSlug)}
        tooltip={t('fields:addLabel', { label: getTranslation(modalCollection.labels.singular, i18n) })}
      >
        <UploadIcon />
      </ElementButton>
      <Drawer
        className={`${baseClass}__modal`}
        slug={drawerSlug}
        formatSlug={false}
      >
        <Gutter className={`${baseClass}__modal-gutter`}>
          <header className={`${baseClass}__modal-header`}>
            <h1>
              {t('fields:addLabel', { label: getTranslation(modalCollection.labels.singular, i18n) })}
            </h1>
            <Button
              icon="x"
              round
              buttonStyle="icon-label"
              iconStyle="with-border"
              onClick={() => {
                closeModal(drawerSlug);
              }}
            />
          </header>
          {moreThanOneAvailableCollection && (
            <div className={`${baseClass}__select-collection-wrap`}>
              <Label label={t('selectCollectionToBrowse')} />
              <ReactSelect
                className={`${baseClass}__select-collection`}
                value={modalCollectionOption}
                onChange={setModalCollectionOption}
                options={availableCollections.map((coll) => ({ label: getTranslation(coll.labels.singular, i18n), value: coll.slug }))}
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
              closeModal(drawerSlug);
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
                  {t('general:of')}
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
        </Gutter>
      </Drawer>
    </Fragment>
  );
};

export default UploadButton;
