import React, { createContext, useContext, useEffect, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'react-router-dom';
import { Props, TogglerProps } from './types';
import DefaultEdit from '../../views/collections/Edit/Default';
import X from '../../icons/X';
import { Fields } from '../../forms/Form/types';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { getTranslation } from '../../../../utilities/getTranslation';
import { Drawer, DrawerToggler, useDrawerDepth } from '../Drawer';
import Button from '../Button';
import { useConfig } from '../../utilities/Config';
import { useLocale } from '../../utilities/Locale';
import { useAuth } from '../../utilities/Auth';
import { DocumentInfoProvider, useDocumentInfo } from '../../utilities/DocumentInfo';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { usePreferences } from '../../utilities/Preferences';
import formatFields from '../../views/collections/Edit/formatFields';
import './index.scss';

const baseClass = 'doc-drawer';

const formatDrawerSlug = ({
  collection,
  id,
  depth,
}: {
  collection: string,
  id: string,
  depth: number,
}) => `doc-${collection}-${id}-lvl-${depth}`;

export const DocumentDrawerToggler: React.FC<TogglerProps> = ({
  id,
  collection,
  children,
}) => {
  const drawerDepth = useDrawerDepth();

  return (
    <DrawerToggler
      slug={formatDrawerSlug({ collection, id, depth: drawerDepth })}
      exactSlug
    >
      {children}
    </DrawerToggler>
  );
};

export const DocumentDrawer: React.FC<Props> = ({
  collection,
  id,
  onSave,
  customHeader,
}) => {
  const { serverURL, routes: { api } } = useConfig();
  const { toggleModal } = useModal();
  const locale = useLocale();
  const { permissions, user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const { t, i18n } = useTranslation('fields');
  const drawerDepth = useDrawerDepth();
  const config = useConfig();
  const [modalSlug] = useState<string>(() => formatDrawerSlug({ collection, id, depth: drawerDepth }));
  const { getPreference } = usePreferences();
  const { preferencesKey } = useDocumentInfo();

  const collectionConfig = config.collections.find((col) => col.slug === collection);
  const [fields] = useState(() => formatFields(collectionConfig, true));

  const [{ data, isLoading: isLoadingDocument, isError }] = usePayloadAPI(
    (id ? `${serverURL}${api}/${collection}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } },
  );

  useEffect(() => {
    if (isLoadingDocument) {
      return;
    }
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema({ fieldSchema: fields, data, user, operation: id ? 'update' : 'create', id, locale, t });
      await getPreference(preferencesKey);
      setInitialState(state);
    };

    awaitInitialState();
  }, [data, fields, id, user, locale, isLoadingDocument, preferencesKey, getPreference, t]);

  const modalAction = `${serverURL}${api}/${collection}?locale=${locale}&depth=0&fallback-locale=null`;

  if (isError) {
    return (
      <Redirect to={`${collectionConfig.admin}/not-found`} />
    );
  }

  return (
    <Drawer
      slug={modalSlug}
      exactSlug
    >
      <DocumentInfoProvider collection={collectionConfig}>
        <RenderCustomComponent
          DefaultComponent={DefaultEdit}
          CustomComponent={collectionConfig.admin?.components?.views?.Edit}
          componentProps={{
            isLoading: !initialState,
            data,
            collection: collectionConfig,
            permissions: permissions.collections[collectionConfig.slug],
            isEditing: false,
            onSave,
            initialState,
            hasSavePermission: true,
            action: modalAction,
            disableEyebrow: true,
            disableActions: true,
            me: true,
            disableLeaveWithoutSaving: true,
            customHeader: (
              <div className={`${baseClass}__header`}>
                <h2>
                  {!customHeader ? t(!id ? 'addNewLabel' : 'editLabel', { label: getTranslation(collectionConfig.labels.singular, i18n) }) : customHeader}
                </h2>
                <Button
                  buttonStyle="none"
                  className={`${baseClass}__header-close`}
                  onClick={() => toggleModal(modalSlug)}
                >
                  <X />
                </Button>
              </div>
            ),
          }}
        />
      </DocumentInfoProvider>
    </Drawer>
  );
};

export type IDocumentDrawerContext = {
  DocumentDrawer: React.FC<Props>,
  DocumentDrawerToggler: React.FC<TogglerProps>
}

export const DocumentDrawerContext = createContext({
  DocumentDrawer,
  DocumentDrawerToggler,
});

export const useDocumentDrawer = (): IDocumentDrawerContext => useContext(DocumentDrawerContext);
