import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { Props, DocumentTogglerProps } from './types';
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
import { DocumentInfoProvider } from '../../utilities/DocumentInfo';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
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

export const DocumentDrawerToggler: React.FC<DocumentTogglerProps> = ({
  id,
  collection,
  children,
  className,
  ...rest
}) => {
  const drawerDepth = useDrawerDepth();

  return (
    <DrawerToggler
      slug={formatDrawerSlug({ collection, id, depth: drawerDepth })}
      exactSlug
      className={className}
      {...rest}
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
  const { toggleModal, isModalOpen } = useModal();
  const locale = useLocale();
  const { permissions, user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const { t, i18n } = useTranslation('fields');
  const drawerDepth = useDrawerDepth();
  const config = useConfig();
  const [modalSlug] = useState<string>(() => formatDrawerSlug({ collection, id, depth: drawerDepth }));
  const hasInitializedState = useRef(false);

  const collectionConfig = config.collections.find((col) => col.slug === collection);
  const [fields] = useState(() => formatFields(collectionConfig, true));

  const [{ data, isLoading: isLoadingDocument, isError }] = usePayloadAPI(
    (id ? `${serverURL}${api}/${collection}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } },
  );

  useEffect(() => {
    if (isLoadingDocument || hasInitializedState.current === true) {
      return;
    }

    const awaitInitialState = async () => {
      const state = await buildStateFromSchema({ fieldSchema: fields, data, user, operation: id ? 'update' : 'create', id, locale, t });
      setInitialState(state);
    };

    awaitInitialState();
    hasInitializedState.current = true;
  }, [data, fields, id, user, locale, isLoadingDocument, t]);

  const modalAction = `${serverURL}${api}/${collection}?locale=${locale}&depth=0&fallback-locale=null`;

  if (isError) return null;

  const isOpen = isModalOpen(modalSlug);

  return (
    <Drawer
      slug={modalSlug}
      exactSlug
    >
      {isOpen && (
      // IMPORTANT: we must ensure that modals are not recursively rendered
      // to do this, do not render the document until the modal is open
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
      )}
    </Drawer>
  );
};

export type IDocumentDrawerContext = {
  DocumentDrawer: React.FC<Props>,
  DocumentDrawerToggler: React.FC<DocumentTogglerProps>
}

export const DocumentDrawerContext = createContext({
  DocumentDrawer,
  DocumentDrawerToggler,
});

export const useDocumentDrawer = (): IDocumentDrawerContext => useContext(DocumentDrawerContext);
