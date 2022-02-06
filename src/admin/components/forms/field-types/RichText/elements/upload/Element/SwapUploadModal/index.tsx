import * as React from 'react';
import { Modal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import { Element, Transforms } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import { SanitizedCollectionConfig } from '../../../../../../../../../collections/config/types';
import usePayloadAPI from '../../../../../../../../hooks/usePayloadAPI';
import MinimalTemplate from '../../../../../../../templates/Minimal';
import Button from '../../../../../../../elements/Button';
import Label from '../../../../../../Label';
import ReactSelect from '../../../../../../../elements/ReactSelect';
import ListControls from '../../../../../../../elements/ListControls';
import UploadGallery from '../../../../../../../elements/UploadGallery';
import Paginator from '../../../../../../../elements/Paginator';
import PerPage from '../../../../../../../elements/PerPage';
import formatFields from '../../../../../../../views/collections/List/formatFields';

import '../../addSwapModals.scss';

const baseClass = 'rich-text-upload-modal';

type Props = {
  slug: string
  element: Element
  closeModal: () => void
  setRelatedCollectionConfig: (collectionConfig: SanitizedCollectionConfig) => void
  relatedCollectionConfig: SanitizedCollectionConfig
}
export const SwapUploadModal: React.FC<Props> = ({ closeModal, element, setRelatedCollectionConfig, relatedCollectionConfig, slug }) => {
  const { collections, serverURL, routes: { api } } = useConfig();
  const editor = useSlateStatic();

  const [modalCollection, setModalCollection] = React.useState(relatedCollectionConfig);
  const [modalCollectionOption, setModalCollectionOption] = React.useState<{ label: string, value: string }>({ label: relatedCollectionConfig.labels.singular, value: relatedCollectionConfig.slug });
  const [availableCollections] = React.useState(() => collections.filter(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [fields, setFields] = React.useState(() => formatFields(modalCollection));

  const [limit, setLimit] = React.useState<number>();
  const [sort, setSort] = React.useState(null);
  const [where, setWhere] = React.useState(null);
  const [page, setPage] = React.useState(null);

  const moreThanOneAvailableCollection = availableCollections.length > 1;

  const apiURL = `${serverURL}${api}/${modalCollection.slug}`;
  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  const handleUpdateUpload = React.useCallback((doc) => {
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
    closeModal();
  }, [closeModal, editor, element, modalCollection]);

  React.useEffect(() => {
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

  React.useEffect(() => {
    setFields(formatFields(modalCollection));
    setLimit(modalCollection.admin.pagination.defaultLimit);
  }, [modalCollection]);

  React.useEffect(() => {
    setModalCollection(collections.find(({ slug: collectionSlug }) => modalCollectionOption.value === collectionSlug));
  }, [modalCollectionOption, collections]);

  return (
    <Modal
      className={baseClass}
      slug={slug}
    >
      <MinimalTemplate width="wide">
        <header className={`${baseClass}__header`}>
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
            onClick={closeModal}
          />
        </header>
        {
          moreThanOneAvailableCollection && (
            <div className={`${baseClass}__select-collection-wrap`}>
              <Label label="Select a Collection to Browse" />
              <ReactSelect
                className={`${baseClass}__select-collection`}
                value={modalCollectionOption}
                onChange={setModalCollectionOption}
                options={availableCollections.map((coll) => ({ label: coll.labels.singular, value: coll.slug }))}
              />
            </div>
          )
        }
        <ListControls
          collection={
            {
              ...modalCollection,
              fields,
            }
          }
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
            setRelatedCollectionConfig(modalCollection);
            closeModal();
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
            <React.Fragment>
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
                limits={modalCollection?.admin?.pagination?.limits}
                limit={limit}
                modifySearchParams={false}
                handleChange={setLimit}
              />
            </React.Fragment>
          )}
        </div>
      </MinimalTemplate>
    </Modal>
  );
};
