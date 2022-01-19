import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { useConfig } from '@payloadcms/config-provider';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import FileGraphic from '../../../../../../graphics/File';
import useThumbnail from '../../../../../../../hooks/useThumbnail';
import Button from '../../../../../../elements/Button';
import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import { SwapUploadModal } from './SwapUploadModal';

import './index.scss';
import { EditModal } from './EditModal';

const baseClass = 'rich-text-upload';

const initialParams = {
  depth: 0,
};

const Element = ({ attributes, children, element, path, fieldProps }) => {
  const { relationTo, value } = element;
  const { closeAll, open } = useModal();
  const { collections, serverURL, routes: { api } } = useConfig();
  const [modalToRender, setModalToRender] = useState(undefined);
  const [relatedCollection, setRelatedCollection] = useState<SanitizedCollectionConfig>(() => collections.find((coll) => coll.slug === relationTo));

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
    closeAll();
    setModalToRender(null);
  }, [closeAll]);

  useEffect(() => {
    if (modalToRender && modalSlug) {
      open(`${modalSlug}`);
    }
  }, [modalToRender, open, modalSlug]);

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
              {relatedCollection.labels.singular}
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
                  tooltip="Edit Upload"
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
                tooltip="Swap Upload"
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
                tooltip="Remove Upload"
              />
            </div>
          </div>
        </div>

        <div className={`${baseClass}__bottomRow`}>
          <h5>{upload?.filename}</h5>
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
