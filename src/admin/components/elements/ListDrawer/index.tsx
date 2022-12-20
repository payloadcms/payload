import React, { useCallback, useEffect, useId, useMemo, useReducer, useState } from 'react';
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
import { Column } from '../Table/types';
import getInitialColumnState from '../../views/collections/List/getInitialColumns';
import buildListColumns from '../../views/collections/List/buildColumns';
import formatFields from '../../views/collections/List/formatFields';
import { ListPreferences } from '../../views/collections/List/types';
import { usePreferences } from '../../utilities/Preferences';
import { Field } from '../../../../fields/config/types';

import './index.scss';

const baseClass = 'list-drawer';

const buildColumns = ({
  collectionConfig,
  columns,
  onSelect,
  t,
}) => buildListColumns({
  collection: collectionConfig,
  columns,
  t,
  cellProps: [{
    link: false,
    onClick: ({ collection, rowData }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          docID: rowData.id,
          collectionConfig: collection,
        });
      }
    },
    className: `${baseClass}__first-cell`,
  }],
});

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
  disabled,
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
      disabled={disabled}
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
  onSelect,
  customHeader,
  collectionSlugs,
  uploads,
  selectedCollection,
}) => {
  const { t, i18n } = useTranslation(['upload', 'general']);
  const { permissions } = useAuth();
  const { getPreference, setPreference } = usePreferences();
  const { isModalOpen, closeModal } = useModal();
  const [limit, setLimit] = useState<number>();
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [where, setWhere] = useState(null);
  const { serverURL, routes: { api }, collections } = useConfig();
  const [enabledCollectionConfigs] = useState(() => collections.filter((coll) => shouldIncludeCollection({ coll, uploads, collectionSlugs })));
  const [selectedCollectionConfig, setSelectedCollectionConfig] = useState<SanitizedCollectionConfig>(() => {
    let initialSelection: SanitizedCollectionConfig;
    if (selectedCollection) {
      // if passed a selection, find it and check if it's enabled
      const foundSelection = collections.find(({ slug }) => slug === selectedCollection);
      if (foundSelection && shouldIncludeCollection({ coll: foundSelection, uploads, collectionSlugs })) {
        initialSelection = foundSelection;
      }
    } else {
      // return the first one that is enabled
      initialSelection = collections.find((coll) => shouldIncludeCollection({ coll, uploads, collectionSlugs }));
    }
    return initialSelection;
  });

  const [selectedOption, setSelectedOption] = useState<{ label: string, value: string }>(() => (selectedCollectionConfig ? { label: getTranslation(selectedCollectionConfig.labels.singular, i18n), value: selectedCollectionConfig.slug } : undefined));
  const [fields, setFields] = useState<Field[]>(() => formatFields(selectedCollectionConfig, t));
  const [tableColumns, setTableColumns] = useState<Column[]>(() => {
    const initialColumns = getInitialColumnState(fields, selectedCollectionConfig.admin.useAsTitle, selectedCollectionConfig.admin.defaultColumns);
    return buildColumns({
      collectionConfig: selectedCollectionConfig,
      columns: initialColumns,
      t,
      onSelect,
    });
  });

  // allow external control of selected collection, same as the initial state logic above
  useEffect(() => {
    let newSelection: SanitizedCollectionConfig;
    if (selectedCollection) {
      // if passed a selection, find it and check if it's enabled
      const foundSelection = collections.find(({ slug }) => slug === selectedCollection);
      if (foundSelection && shouldIncludeCollection({ coll: foundSelection, uploads, collectionSlugs })) {
        newSelection = foundSelection;
      }
    } else {
      // return the first one that is enabled
      newSelection = collections.find((coll) => shouldIncludeCollection({ coll, uploads, collectionSlugs }));
    }
    setSelectedCollectionConfig(newSelection);
  }, [selectedCollection, collectionSlugs, uploads, collections, onSelect, t]);

  const activeColumnNames = tableColumns.map(({ accessor }) => accessor);
  const stringifiedActiveColumns = JSON.stringify(activeColumnNames);
  const preferenceKey = `${selectedCollectionConfig.slug}-list`;

  // this is the 'create new' drawer
  const [
    DocumentDrawer,
    DocumentDrawerToggler,
    {
      drawerSlug: documentDrawerSlug,
    },
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
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0); // used to force a re-fetch even when apiURL is unchanged
  const [{ data, isError }, { setParams }] = usePayloadAPI(apiURL, {});
  const moreThanOneAvailableCollection = enabledCollectionConfigs.length > 1;

  useEffect(() => {
    const params: {
      page?: number
      sort?: string
      where?: unknown
      limit?: number
      cacheBust?: number
    } = {};

    if (page) params.page = page;
    if (where) params.where = where;
    if (sort) params.sort = sort;
    if (limit) params.limit = limit;
    if (cacheBust) params.cacheBust = cacheBust;

    setParams(params);
  }, [setParams, page, sort, where, limit, cacheBust]);

  useEffect(() => {
    const syncColumnsFromPrefs = async () => {
      const currentPreferences = await getPreference<ListPreferences>(preferenceKey);
      const newFields = formatFields(selectedCollectionConfig, t);
      setFields(newFields);
      const initialColumns = getInitialColumnState(newFields, selectedCollectionConfig.admin.useAsTitle, selectedCollectionConfig.admin.defaultColumns);
      setTableColumns(buildColumns({
        collectionConfig: selectedCollectionConfig,
        columns: currentPreferences?.columns || initialColumns,
        t,
        onSelect,
      }));
    };

    syncColumnsFromPrefs();
  }, [t, getPreference, preferenceKey, onSelect, selectedCollectionConfig]);

  useEffect(() => {
    const newPreferences = {
      limit,
      sort,
      columns: JSON.parse(stringifiedActiveColumns),
    };

    setPreference(preferenceKey, newPreferences);
  }, [sort, limit, stringifiedActiveColumns, setPreference, preferenceKey]);

  const setActiveColumns = useCallback((columns: string[]) => {
    setTableColumns(buildColumns({
      collectionConfig: selectedCollectionConfig,
      columns,
      t,
      onSelect,
    }));
  }, [selectedCollectionConfig, t, onSelect]);

  const onCreateNew = useCallback(({ doc }) => {
    if (typeof onSelect === 'function') {
      onSelect({
        docID: doc.id,
        collectionConfig: selectedCollectionConfig,
      });
    }
    dispatchCacheBust();
    closeModal(documentDrawerSlug);
    closeModal(drawerSlug);
  }, [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedCollectionConfig]);

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
            collection: {
              ...selectedCollectionConfig,
              fields,
            },
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
                      onChange={setSelectedOption} // this is only changing the options which is not rerunning my effect
                      options={enabledCollectionConfigs.map((coll) => ({ label: getTranslation(coll.labels.singular, i18n), value: coll.slug }))}
                    />
                  </div>
                )}
              </header>
            ),
            data,
            limit: limit || selectedCollectionConfig?.admin?.pagination?.defaultLimit,
            setLimit,
            tableColumns,
            setColumns: setActiveColumns,
            setSort,
            newDocumentURL: null,
            hasCreatePermission,
            columnNames: activeColumnNames,
            disableEyebrow: true,
            modifySearchParams: false,
            onCardClick: (doc) => {
              if (typeof onSelect === 'function') {
                onSelect({
                  docID: doc.id,
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
      <DocumentDrawer
        onSave={onCreateNew}
      />
    </Drawer>
  );
};

export const useListDrawer: UseListDrawer = ({ collectionSlugs, uploads, selectedCollection }) => {
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal, closeModal } = useModal();
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

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug);
  }, [drawerSlug, closeModal]);

  const MemoizedDrawer = useMemo(() => {
    return ((props) => (
      <ListDrawer
        {...props}
        drawerSlug={drawerSlug}
        collectionSlugs={collectionSlugs}
        uploads={uploads}
        closeDrawer={closeDrawer}
        key={drawerSlug}
        selectedCollection={selectedCollection}
      />
    ));
  }, [drawerSlug, collectionSlugs, uploads, closeDrawer, selectedCollection]);

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
    closeDrawer,
  }), [drawerDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer]);

  return [
    MemoizedDrawer,
    MemoizedDrawerToggler,
    MemoizedDrawerState,
  ];
};
