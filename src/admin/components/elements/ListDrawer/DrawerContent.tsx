import React, { Fragment, useCallback, useEffect, useReducer, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { ListDrawerProps } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import { DocumentInfoProvider } from '../../utilities/DocumentInfo';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
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
import { baseClass } from '.';

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

export const ListDrawerContent: React.FC<ListDrawerProps> = ({
  drawerSlug,
  onSelect,
  customHeader,
  collectionSlugs,
  selectedCollection,
  filterOptions,
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

  const enabledCollectionConfigs = collections.filter(({ slug }) => {
    return collectionSlugs.includes(slug);
  });

  const [selectedCollectionConfig, setSelectedCollectionConfig] = useState<SanitizedCollectionConfig>(() => {
    return enabledCollectionConfigs.find(({ slug }) => slug === selectedCollection) || enabledCollectionConfigs?.[0];
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
    if (selectedCollection) {
      // if passed a selection, find it and check if it's enabled
      const selectedConfig = enabledCollectionConfigs.find(({ slug }) => slug === selectedCollection) || enabledCollectionConfigs?.[0];
      setSelectedCollectionConfig(selectedConfig);
    }
  }, [selectedCollection, enabledCollectionConfigs, onSelect, t]);

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
      setSelectedCollectionConfig(enabledCollectionConfigs.find(({ slug }) => selectedOption.value === slug));
    }
  }, [selectedOption, enabledCollectionConfigs]);

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

    params.where = {
      ...where ? { ...where } : {},
      ...filterOptions?.[selectedCollectionConfig.slug] ? {
        ...filterOptions[selectedCollectionConfig.slug],
      } : {},
    };

    if (sort) params.sort = sort;
    if (limit) params.limit = limit;
    if (cacheBust) params.cacheBust = cacheBust;

    setParams(params);
  }, [setParams, page, sort, where, limit, cacheBust, filterOptions, selectedCollectionConfig]);

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
    <Fragment>
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
                    <h2 className={`${baseClass}__header-text`}>
                      {!customHeader ? getTranslation(selectedCollectionConfig?.labels?.plural, i18n) : customHeader}
                    </h2>
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
            handlePerPageChange: setLimit,
          }}
        />
      </DocumentInfoProvider>
      <DocumentDrawer onSave={onCreateNew} />
    </Fragment>
  );
};
