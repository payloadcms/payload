import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { UploadDrawerProps, UploadTogglerProps, UseUploadDrawer } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { Drawer, DrawerToggler } from '../Drawer';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import { DocumentInfoProvider } from '../../utilities/DocumentInfo';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { useEditDepth } from '../../utilities/EditDepth';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import DefaultList from '../../views/collections/List/Default';
import { Gutter } from '../Gutter';
import Label from '../../forms/Label';
import ReactSelect from '../ReactSelect';

import './index.scss';

const baseClass = 'uploads-drawer';

const formatUploadsDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number,
  uuid: string, // supply when creating a new document and no id is available
}) => `uploads-drawer_${depth}_${uuid}`;

export const UploadsDrawerToggler: React.FC<UploadTogglerProps> = ({
  children,
  className,
  drawerSlug,
  ...rest
}) => {
  return (
    <DrawerToggler
      slug={drawerSlug}
      formatSlug={false}
      className={[
        className,
        `${baseClass}__toggler`,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </DrawerToggler>
  );
};

export const UploadsDrawer: React.FC<UploadDrawerProps> = ({
  drawerSlug,
  onSave,
  customHeader,
}) => {
  const { t, i18n } = useTranslation(['upload', 'general']);
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
  const [{ data, isError }, { setParams }] = usePayloadAPI(apiURL, {});
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

  if (!selectedCollectionConfig || isError) {
    return null;
  }

  return (
    <Drawer
      slug={drawerSlug}
      formatSlug={false}
      className={baseClass}
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
      <DocumentInfoProvider collection={selectedCollectionConfig}>
        <RenderCustomComponent
          DefaultComponent={DefaultList}
          CustomComponent={selectedCollectionConfig.admin?.components?.views?.List}
          componentProps={{
            collection: selectedCollectionConfig,
            customHeader,
            data,
            limit,
            setLimit,
            tableColumns: [],
            setColumns: () => undefined,
            setSort,
            newDocumentURL: null,
            hasCreatePermission,
            columnNames: [],
            setListControls: () => undefined,
            disableEyebrow: true,
            modifySearchParams: false,
            onCardClick: (doc) => {
              if (typeof onSave === 'function') {
                onSave({
                  doc,
                  collectionConfig: selectedCollectionConfig,
                });
              }
              closeModal(drawerSlug);
            },
            disableCardLink: true,
            handleSortChange: setSort,
            handleWhereChange: setWhere,
            handlePageChange: setPage,
          }}
        />
      </DocumentInfoProvider>
    </Drawer>
  );
};

export const useUploadsDrawer: UseUploadDrawer = () => {
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const drawerSlug = formatUploadsDrawerSlug({
    depth: drawerDepth,
    uuid,
  });

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
  }, [modalState, drawerSlug]);

  const toggleDrawer = useCallback(() => {
    toggleModal(drawerSlug);
  }, [toggleModal, drawerSlug]);

  const MemoizedDrawer = useMemo(() => {
    return ((props) => (
      <UploadsDrawer
        {...props}
        drawerSlug={drawerSlug}
        key={drawerSlug}
      />
    ));
  }, [drawerSlug]);

  const MemoizedDrawerToggler = useMemo(() => {
    return ((props) => (
      <UploadsDrawerToggler
        {...props}
        drawerSlug={drawerSlug}
      />
    ));
  }, [drawerSlug]);

  const MemoizedDrawerState = useMemo(() => ({
    drawerSlug,
    drawerDepth,
    isDrawerOpen: isOpen,
    toggleDrawer,
  }), [drawerDepth, drawerSlug, isOpen, toggleDrawer]);

  return [
    MemoizedDrawer,
    MemoizedDrawerToggler,
    MemoizedDrawerState,
  ];
};
