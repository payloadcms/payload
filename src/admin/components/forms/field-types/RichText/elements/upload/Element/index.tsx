import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import FileGraphic from '../../../../../../graphics/File';
import useThumbnail from '../../../../../../../hooks/useThumbnail';
import Button from '../../../../../../elements/Button';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import { SwapUploadModal } from './SwapUploadModal';
import { EditModal } from './EditModal';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'rich-text-upload';

const initialParams = {
  depth: 0,
};

const Element = ({ attributes, children, element, path, fieldProps }) => {
  const { relationTo, value } = element;
  const { toggleModal } = useModal();
  const { collections, serverURL, routes: { api } } = useConfig();
  const [modalToRender, setModalToRender] = useState(undefined);
  const [relatedCollection, setRelatedCollection] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => coll.slug === relationTo));
  const { t, i18n } = useTranslation('fields');

  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();

  const modalSlug = `${path}-edit-upload-${modalToRender}`;

  // Get the referenced document
  const [{ data: upload }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

  const thumbnailSRC = useThumbnail(relatedCollection, upload);

  const removeUpload = useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.removeNodes(
      editor,
      { at: elementPath },
    );
  }, [editor, element]);

  const closeModal = useCallback(() => {
    toggleModal(modalSlug);
    setModalToRender(null);
  }, [toggleModal, modalSlug]);

  useEffect(() => {
    if (modalToRender) {
      toggleModal(modalSlug);
    }
  }, [modalToRender, toggleModal, modalSlug]);

  const fieldSchema = fieldProps?.admin?.upload?.collections?.[relatedCollection.slug]?.fields;

  return (
    <div
      className={[
        baseClass,
        (selected && focused) && `${baseClass}--selected`,
      ].filter(Boolean).join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__topRow`}>
          <div className={`${baseClass}__thumbnail`}>
            {thumbnailSRC ? (
              <img
                src={thumbnailSRC}
                alt={upload?.filename}
              />
            ) : (
              <FileGraphic />
            )}
          </div>
          <div className={`${baseClass}__topRowRightPanel`}>
            <div className={`${baseClass}__collectionLabel`}>
              {getTranslation(relatedCollection.labels.singular, i18n)}
            </div>
            <div className={`${baseClass}__actions`}>
              {fieldSchema && (
                <Button
                  icon="edit"
                  round
                  buttonStyle="icon-label"
                  className={`${baseClass}__actionButton`}
                  onClick={(e) => {
                    e.preventDefault();
                    setModalToRender('edit');
                  }}
                  tooltip={t('general:edit')}
                />
              )}
              <Button
                icon="swap"
                round
                buttonStyle="icon-label"
                className={`${baseClass}__actionButton`}
                onClick={(e) => {
                  e.preventDefault();
                  setModalToRender('swap');
                }}
                tooltip={t('swapUpload')}
              />
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                className={`${baseClass}__actionButton`}
                onClick={(e) => {
                  e.preventDefault();
                  removeUpload();
                }}
                tooltip={t('removeUpload')}
              />
            </div>
          </div>
        </div>

        <div className={`${baseClass}__bottomRow`}>
          <strong>{upload?.filename}</strong>
        </div>
      </div>
      {children}

      {modalToRender === 'swap' && (
        <SwapUploadModal
          slug={modalSlug}
          element={element}
          closeModal={closeModal}
          setRelatedCollectionConfig={setRelatedCollection}
          relatedCollectionConfig={relatedCollection}
        />
      )}

      {(modalToRender === 'edit' && fieldSchema) && (
        <EditModal
          slug={modalSlug}
          closeModal={closeModal}
          relatedCollectionConfig={relatedCollection}
          fieldSchema={fieldSchema}
          element={element}
        />
      )}
    </div>
  );
};

export default Element;
