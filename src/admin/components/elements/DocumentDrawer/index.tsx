import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { DocumentDrawerProps, DocumentTogglerProps, UseDocumentDrawer } from './types';
import DefaultEdit from '../../views/collections/Edit/Default';
import X from '../../icons/X';
import { Fields } from '../../forms/Form/types';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { getTranslation } from '../../../../utilities/getTranslation';
import { Drawer, DrawerToggler } from '../Drawer';
import Button from '../Button';
import { useConfig } from '../../utilities/Config';
import { useLocale } from '../../utilities/Locale';
import { useAuth } from '../../utilities/Auth';
import { DocumentInfoProvider } from '../../utilities/DocumentInfo';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import formatFields from '../../views/collections/Edit/formatFields';
import { useRelatedCollections } from '../../forms/field-types/Relationship/AddNew/useRelatedCollections';
import IDLabel from '../IDLabel';
import { useEditDepth } from '../../utilities/EditDepth';
import './index.scss';

const baseClass = 'doc-drawer';

const formatDocumentDrawerSlug = ({
  collectionSlug,
  id,
  depth,
  uuid,
}: {
  collectionSlug: string,
  id: string,
  depth: number,
  uuid: string, // supply when creating a new document and no id is available
}) => `doc-drawer_${collectionSlug}_${depth}${id ? `_${id}` : ''}_${uuid}`;

export const DocumentDrawerToggler: React.FC<DocumentTogglerProps> = ({
  children,
  className,
  drawerSlug,
  id,
  collectionSlug,
  ...rest
}) => {
  const { t, i18n } = useTranslation(['fields', 'general']);
  const [collectionConfig] = useRelatedCollections(collectionSlug);

  return (
    <DrawerToggler
      slug={drawerSlug}
      formatSlug={false}
      className={className}
      aria-label={t(!id ? 'fields:addNewLabel' : 'general:editLabel', { label: getTranslation(collectionConfig.labels.singular, i18n) })}
      {...rest}
    >
      {children}
    </DrawerToggler>
  );
};

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({
  collectionSlug,
  id,
  drawerSlug,
  onSave,
  customHeader,
}) => {
  const { serverURL, routes: { api } } = useConfig();
  const { toggleModal, modalState, closeModal } = useModal();
  const locale = useLocale();
  const { permissions, user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const { t, i18n } = useTranslation(['fields', 'general']);
  const hasInitializedState = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [collectionConfig] = useRelatedCollections(collectionSlug);

  const [fields, setFields] = useState(() => formatFields(collectionConfig, true));

  useEffect(() => {
    setFields(formatFields(collectionConfig, true));
  }, [collectionSlug, collectionConfig]);

  const [{ data, isLoading: isLoadingDocument, isError }] = usePayloadAPI(
    (id ? `${serverURL}${api}/${collectionSlug}/${id}` : null),
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
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
  }, [modalState, drawerSlug]);

  useEffect(() => {
    if (isOpen && !isLoadingDocument && isError) {
      closeModal(drawerSlug);
      toast.error(data.errors?.[0].message || t('error:unspecific'));
    }
  }, [isError, t, isOpen, data, drawerSlug, closeModal, isLoadingDocument]);

  if (isError) return null;

  if (isOpen) {
    // IMPORTANT: we must ensure that modals are not recursively rendered
    // to do this, do not render the drawer until it is open
    return (
      <Drawer
        slug={drawerSlug}
        formatSlug={false}
        className={baseClass}
      >
        <DocumentInfoProvider collection={collectionConfig}>
          <RenderCustomComponent
            DefaultComponent={DefaultEdit}
            CustomComponent={collectionConfig.admin?.components?.views?.Edit}
            componentProps={{
              isLoading: !initialState,
              data,
              id,
              collection: collectionConfig,
              permissions: permissions.collections[collectionConfig.slug],
              isEditing: Boolean(id),
              apiURL: id ? `${serverURL}${api}/${collectionSlug}/${id}` : null,
              onSave,
              initialState,
              hasSavePermission: true,
              action: `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`,
              disableEyebrow: true,
              disableActions: true,
              me: true,
              disableLeaveWithoutSaving: true,
              customHeader: (
                <div className={`${baseClass}__header`}>
                  <div className={`${baseClass}__header-content`}>
                    <h2>
                      {!customHeader ? t(!id ? 'fields:addNewLabel' : 'general:editLabel', { label: getTranslation(collectionConfig.labels.singular, i18n) }) : customHeader}
                    </h2>
                    <Button
                      buttonStyle="none"
                      className={`${baseClass}__header-close`}
                      onClick={() => toggleModal(drawerSlug)}
                      aria-label={t('general:close')}
                    >
                      <X />
                    </Button>
                  </div>
                  {id && (
                    <IDLabel id={id} />
                  )}
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

export const useDocumentDrawer: UseDocumentDrawer = ({ id, collectionSlug }) => {
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const { modalState, toggleModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const drawerSlug = formatDocumentDrawerSlug({
    collectionSlug,
    id,
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
      <DocumentDrawer
        {...props}
        collectionSlug={collectionSlug}
        id={id}
        drawerSlug={drawerSlug}
        key={drawerSlug}
      />
    ));
  }, [id, drawerSlug, collectionSlug]);

  const MemoizedDrawerToggler = useMemo(() => {
    return ((props) => (
      <DocumentDrawerToggler
        {...props}
        id={id}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
      />
    ));
  }, [id, drawerSlug, collectionSlug]);

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
