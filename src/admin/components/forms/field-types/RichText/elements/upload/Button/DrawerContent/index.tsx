import React, { useEffect, useState } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useModal } from '@faceless-ui/modal';
import { Gutter } from '../../../../../../../elements/Gutter';
import { useAuth } from '../../../../../../../utilities/Auth';
import ReactSelect from '../../../../../../../elements/ReactSelect';
import usePayloadAPI from '../../../../../../../../hooks/usePayloadAPI';
import { useConfig } from '../../../../../../../utilities/Config';
import { getTranslation } from '../../../../../../../../../utilities/getTranslation';
import { SanitizedCollectionConfig } from '../../../../../../../../../collections/config/types';
import { injectVoidElement } from '../../../injectVoid';
import Label from '../../../../../../Label';
import DefaultList from '../../../../../../../views/collections/List/Default';

import './index.scss';

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

const baseClass = 'upload-rich-text-drawer-content';

export const DrawerContent: React.FC<{
  className?: string
  drawerSlug: string
}> = (props) => {
  const { className, drawerSlug } = props;
  const { t, i18n } = useTranslation(['upload', 'general']);
  const editor = useSlate();
  const { permissions } = useAuth();
  const { isModalOpen, closeModal } = useModal();
  const [limit, setLimit] = useState<number>();
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [where, setWhere] = useState(null);
  const { serverURL, routes: { api }, collections } = useConfig();
  const [enabledUploadCollectionConfigs] = useState(() => collections.filter(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [selectedCollectionConfig, setSelectedCollectionConfig] = useState<SanitizedCollectionConfig>(() => collections.find(({ admin: { enableRichTextRelationship }, upload }) => (Boolean(upload) && enableRichTextRelationship)));
  const [selectedOption, setSelectedOption] = useState<{ label: string, value: string }>(() => (selectedCollectionConfig ? { label: getTranslation(selectedCollectionConfig.labels.singular, i18n), value: selectedCollectionConfig.slug } : undefined));

  useEffect(() => {
    if (selectedOption) {
      setSelectedCollectionConfig(collections.find(({ slug }) => selectedOption.value === slug));
    }
  }, [selectedOption, collections]);

  const collectionPermissions = permissions?.collections?.[selectedCollectionConfig?.slug];
  const hasCreatePermission = collectionPermissions?.create?.permission;

  // If modal is open, get active page of upload gallery
  const isOpen = isModalOpen(drawerSlug);
  const apiURL = isOpen ? `${serverURL}${api}/${selectedCollectionConfig.slug}` : null;
  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});
  const moreThanOneAvailableCollection = enabledUploadCollectionConfigs.length > 1;

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

  if (!selectedCollectionConfig) {
    return null;
  }

  return (
    <div
      className={[
        baseClass,
        className,
      ].filter(Boolean).join(' ')}
    >
      <Gutter>
        {moreThanOneAvailableCollection && (
          <div className={`${baseClass}__select-collection-wrap`}>
            <Label label={t('selectCollectionToBrowse')} />
            <ReactSelect
              className={`${baseClass}__select-collection`}
              value={selectedOption}
              onChange={setSelectedOption}
              options={enabledUploadCollectionConfigs.map((coll) => ({ label: getTranslation(coll.labels.singular, i18n), value: coll.slug }))}
            />
          </div>
        )}
      </Gutter>
      <DefaultList
        collection={selectedCollectionConfig}
        data={data}
        limit={limit}
        setLimit={setLimit}
        tableColumns={[]}
        setColumns={() => undefined}
        setSort={setSort}
        newDocumentURL={null}
        hasCreatePermission={hasCreatePermission}
        columnNames={[]}
        setListControls={() => undefined}
        disableEyebrow
        modifySearchParams={false}
        onCardClick={(doc) => {
          insertUpload(editor, {
            value: {
              id: doc.id,
            },
            relationTo: selectedCollectionConfig.slug,
          });
          closeModal(drawerSlug);
        }}
        disableCardLink
        handleSortChange={setSort}
        handleWhereChange={setWhere}
        handlePageChange={setPage}
      />
    </div>
  );
};
