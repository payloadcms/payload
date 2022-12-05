import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Props, DocumentTogglerProps, IDocumentDrawerContext } from './types';
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

const formatDocumentDrawerSlug = ({
  collection,
  id,
  depth,
  uuid,
}: {
  collection: string,
  id: string,
  depth: number,
  uuid?: string, // supply when creating a new document and no id is available
}) => `doc-${collection}-lvl-${depth}-${id || uuid || '0'}`;

export const DocumentDrawerToggler: React.FC<DocumentTogglerProps> = ({
  id,
  collection,
  children,
  className,
  uuid,
  ...rest
}) => {
  const drawerDepth = useDrawerDepth();
  const drawerSlug = formatDocumentDrawerSlug({ collection, id, depth: drawerDepth, uuid });

  return (
    <DrawerToggler
      slug={drawerSlug}
      formatSlug={false}
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
  uuid,
}) => {
  const { serverURL, routes: { api } } = useConfig();
  const { toggleModal, modalState, closeModal } = useModal();
  const locale = useLocale();
  const { permissions, user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const { t, i18n } = useTranslation(['fields', 'general']);
  const drawerDepth = useDrawerDepth();
  const config = useConfig();
  const hasInitializedState = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [modalSlug] = useState<string>(() => formatDocumentDrawerSlug({
    collection,
    id,
    depth: drawerDepth,
    uuid,
  }));

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
      const state = await buildStateFromSchema({
        fieldSchema: fields,
        data,
        user,
        operation: id ? 'update' : 'create',
        id,
        locale,
        t,
      });
      setInitialState(state);
    };

    awaitInitialState();
    hasInitializedState.current = true;
  }, [data, fields, id, user, locale, isLoadingDocument, t]);

  useEffect(() => {
    setIsOpen(Boolean(modalState[modalSlug]?.isOpen));
  }, [modalState, modalSlug]);

  useEffect(() => {
    if (isOpen && isError) {
      closeModal(modalSlug);
      toast.error(data.errors[0].message);
    }
  }, [isError, t, isOpen, data, modalSlug, closeModal]);

  const modalAction = `${serverURL}${api}/${collection}?locale=${locale}&depth=0&fallback-locale=null`;

  if (isError) return null;

  if (isOpen) {
    // IMPORTANT: we must ensure that modals are not recursively rendered
    // to do this, do not render the drawer until it is open
    return (
      <Drawer
        slug={modalSlug}
        formatSlug={false}
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
                    {!customHeader ? t(!id ? 'fields:addNewLabel' : 'general:editLabel', { label: getTranslation(collectionConfig.labels.singular, i18n) }) : customHeader}
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
  }
  return null;
};

export const DocumentDrawerContext = createContext({
  DocumentDrawer,
  DocumentDrawerToggler,
  formatDocumentDrawerSlug,
});

export const useDocumentDrawer = (): IDocumentDrawerContext => useContext(DocumentDrawerContext);
