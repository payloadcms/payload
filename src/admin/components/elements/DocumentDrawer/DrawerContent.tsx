import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { DocumentDrawerProps } from './types';
import DefaultEdit from '../../views/collections/Edit/Default';
import X from '../../icons/X';
import { Fields } from '../../forms/Form/types';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { getTranslation } from '../../../../utilities/getTranslation';
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
import { baseClass } from '.';

export const DocumentDrawerContent: React.FC<DocumentDrawerProps> = ({
  collectionSlug,
  id,
  drawerSlug,
  onSave: onSaveFromProps,
  customHeader,
}) => {
  const { serverURL, routes: { api } } = useConfig();
  const { toggleModal, modalState, closeModal } = useModal();
  const locale = useLocale();
  const { permissions, user } = useAuth();
  const [internalState, setInternalState] = useState<Fields>();
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
    if (isLoadingDocument) {
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
      setInternalState(state);
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

  const onSave = useCallback<DocumentDrawerProps['onSave']>((args) => {
    if (typeof onSaveFromProps === 'function') {
      onSaveFromProps({
        ...args,
        collectionConfig,
      });
    }
  }, [collectionConfig, onSaveFromProps]);

  if (isError) return null;

  return (
    <DocumentInfoProvider
      collection={collectionConfig}
      id={id}
    >
      <RenderCustomComponent
        DefaultComponent={DefaultEdit}
        CustomComponent={collectionConfig.admin?.components?.views?.Edit}
        componentProps={{
          isLoading: !internalState,
          data,
          id,
          collection: collectionConfig,
          permissions: permissions.collections[collectionConfig.slug],
          isEditing: Boolean(id),
          apiURL: id ? `${serverURL}${api}/${collectionSlug}/${id}` : null,
          onSave,
          internalState,
          hasSavePermission: true,
          action: `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`,
          disableEyebrow: true,
          disableActions: true,
          me: true,
          disableLeaveWithoutSaving: true,
          customHeader: (
            <div className={`${baseClass}__header`}>
              <div className={`${baseClass}__header-content`}>
                <h2 className={`${baseClass}__header-text`}>
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
  );
};
