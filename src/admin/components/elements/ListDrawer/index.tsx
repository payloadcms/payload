import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types';
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
import Label from '../../forms/Label';
import ReactSelect from '../ReactSelect';
import { useDocumentDrawer } from '../DocumentDrawer';
import Pill from '../Pill';
import X from '../../icons/X';
import ViewDescription from '../ViewDescription';

import './index.scss';

const baseClass = 'list-drawer';

const formatListDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number,
  uuid: string, // supply when creating a new document and no id is available
}) => `list-drawer_${depth}_${uuid}`;

export const ListDrawerToggler: React.FC<ListTogglerProps> = ({
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

const shouldIncludeCollection = ({
  coll: {
    admin: { enableRichTextRelationship },
    upload,
    slug,
  },
  uploads,
  collectionSlugs,
}) => (enableRichTextRelationship && ((uploads && Boolean(upload)) || collectionSlugs?.includes(slug)));

export const ListDrawer: React.FC<ListDrawerProps> = ({
  drawerSlug,
  onSave,
  customHeader,
  collectionSlugs,
  uploads,
}) => {
  const { t, i18n } = useTranslation(['upload', 'general']);
  const { permissions } = useAuth();
  const { isModalOpen, closeModal } = useModal();
  const [limit, setLimit] = useState<number>();
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [where, setWhere] = useState(null);
  const { serverURL, routes: { api }, collections } = useConfig();

  const [enabledCollectionConfigs] = useState(() => collections.filter((coll) => shouldIncludeCollection({ coll, uploads, collectionSlugs })));

  const [selectedCollectionConfig, setSelectedCollectionConfig] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => shouldIncludeCollection({ coll, uploads, collectionSlugs })));

  const [selectedOption, setSelectedOption] = useState<{ label: string, value: string }>(() => (selectedCollectionConfig ? { label: getTranslation(selectedCollectionConfig.labels.singular, i18n), value: selectedCollectionConfig.slug } : undefined));

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
  ] = useDocumentDrawer({
    collectionSlug: selectedCollectionConfig.slug,
  });

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
  const moreThanOneAvailableCollection = enabledCollectionConfigs.length > 1;

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
      <DocumentInfoProvider collection={selectedCollectionConfig}>
        <RenderCustomComponent
          DefaultComponent={DefaultList}
          CustomComponent={selectedCollectionConfig?.admin?.components?.views?.List}
          componentProps={{
            collection: selectedCollectionConfig,
            customHeader: (
              <header className={`${baseClass}__header`}>
                <div className={`${baseClass}__header-wrap`}>
                  <div className={`${baseClass}__header-content`}>
                    <h1>
                      {!customHeader ? getTranslation(selectedCollectionConfig?.labels?.plural, i18n) : customHeader}
                    </h1>
                    {hasCreatePermission && (
                      <DocumentDrawerToggler
                        className={`${baseClass}__create-new-button`}
                      >
                        <Pill>
                          {t('general:createNew')}
                        </Pill>
                      </DocumentDrawerToggler>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeModal(drawerSlug);
                    }}
                    className={`${baseClass}__header-close`}
                  >
                    <X />
                  </button>
                </div>
                {selectedCollectionConfig?.admin?.description && (
                  <div className={`${baseClass}__sub-header`}>
                    <ViewDescription description={selectedCollectionConfig.admin.description} />
                  </div>
                )}
                {moreThanOneAvailableCollection && (
                  <div className={`${baseClass}__select-collection-wrap`}>
                    <Label label={t('selectCollectionToBrowse')} />
                    <ReactSelect
                      className={`${baseClass}__select-collection`}
                      value={selectedOption}
                      onChange={setSelectedOption}
                      options={enabledCollectionConfigs.map((coll) => ({ label: getTranslation(coll.labels.singular, i18n), value: coll.slug }))}
                    />
                  </div>
                )}
              </header>
            ),
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
      <DocumentDrawer />
    </Drawer>
  );
};

export const useListDrawer: UseListDrawer = ({ collectionSlugs, uploads }) => {
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const drawerSlug = formatListDrawerSlug({
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
      <ListDrawer
        {...props}
        drawerSlug={drawerSlug}
        collectionSlugs={collectionSlugs}
        uploads={uploads}
        key={drawerSlug}
      />
    ));
  }, [drawerSlug, collectionSlugs, uploads]);

  const MemoizedDrawerToggler = useMemo(() => {
    return ((props) => (
      <ListDrawerToggler
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
